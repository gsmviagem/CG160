// ============================================================
// CG 160 — Approval API Route
// Handles approve / reject / regenerate actions for all entity types.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/supabase';
import { inngest } from '@/lib/inngest';

// Safe inngest.send — never throws. Logs failures but lets the UI proceed.
async function sendEvent(name: string, data: Record<string, unknown>) {
  try {
    await inngest.send({ name, data } as Parameters<typeof inngest.send>[0]);
  } catch (err) {
    console.error(`[approval] inngest.send(${name}) failed:`, err);
  }
}

export async function POST(request: NextRequest) {
  const db = getDB();

  let body: Record<string, string>;
  const contentType = request.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      body = await request.json() as Record<string, string>;
    } else {
      const formData = await request.formData();
      body = Object.fromEntries(
        [...formData.entries()].map(([k, v]) => [k, String(v)])
      );
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { entity_type, entity_id, action, reason, scheduled_at } = body;

  if (!entity_type || !entity_id || !action) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const performed_by = 'operator';

  try {
    switch (`${entity_type}:${action}`) {

      // ─── IDEAS ──────────────────────────────────────────────

      case 'idea:approved':
        await db.updateIdeaStatus(entity_id, 'approved');
        await sendEvent('cg160/scripts.generate', { idea_id: entity_id });
        break;

      case 'idea:rejected':
        await db.updateIdeaStatus(entity_id, 'rejected', {
          rejection_reason: reason ?? 'Rejected by operator',
          rejected_at: new Date().toISOString(),
        });
        break;

      case 'idea:regenerate_requested':
        // Mark current idea as rejected, then fire a new idea generation
        await db.updateIdeaStatus(entity_id, 'rejected', {
          rejection_reason: reason ?? 'Regeneration requested',
          rejected_at: new Date().toISOString(),
        });
        // Generate 3 fresh ideas to replace this one
        await sendEvent('cg160/ideas.generate', { count: 3 });
        break;

      // ─── SCRIPTS ────────────────────────────────────────────

      case 'script:approved': {
        await db.updateScriptStatus(entity_id, 'approved', {
          approved_at: new Date().toISOString(),
        });
        // For now scripts go to "approved" — video generation is manual (Veo 3)
        // When video API is enabled: await sendEvent('cg160/videos.generate', { script_id: entity_id, platform: 'tiktok' });
        break;
      }

      case 'script:rejected':
        await db.updateScriptStatus(entity_id, 'rejected', {
          rejection_reason: reason ?? 'Rejected by operator',
          rejected_at: new Date().toISOString(),
        });
        break;

      case 'script:regenerate_requested': {
        // Reject current script and regenerate from the same idea
        const script = await db.getScriptById(entity_id);
        if (script) {
          await db.updateScriptStatus(entity_id, 'rejected', {
            rejection_reason: reason ?? 'Regeneration requested',
            rejected_at: new Date().toISOString(),
          });
          // Re-approve the idea so it enters the generation queue again
          await db.updateIdeaStatus(script.idea_id, 'approved');
          await sendEvent('cg160/scripts.generate', { idea_id: script.idea_id });
        } else {
          return NextResponse.json({ error: 'Script not found' }, { status: 404 });
        }
        break;
      }

      // ─── VIDEOS ─────────────────────────────────────────────

      case 'video:approved': {
        const scheduleAt = scheduled_at ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();
        await db.updateVideo(entity_id, {
          status: 'scheduled',
          approved_by: performed_by,
          approved_at: new Date().toISOString(),
          scheduled_at: scheduleAt,
        });
        break;
      }

      case 'video:rejected':
        await db.updateVideo(entity_id, {
          status: 'rejected',
          rejection_reason: reason ?? 'Rejected by operator',
        });
        break;

      case 'video:regenerate_requested': {
        const video = await db.getVideoById(entity_id);
        if (video) {
          await db.updateVideo(entity_id, {
            status: 'rejected',
            rejection_reason: reason ?? 'Regeneration requested',
          });
          await sendEvent('cg160/videos.generate', {
            script_id: video.script_id,
            platform: video.platform ?? 'tiktok',
          });
        } else {
          return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${entity_type}:${action}` },
          { status: 400 }
        );
    }

    // Log the event (non-fatal — don't let logging failures break the response)
    try {
      await db.logApprovalEvent(entity_type, entity_id, action, performed_by, reason);
    } catch (logErr) {
      console.error('[approval] logApprovalEvent failed:', logErr);
    }

    // Redirect for form submissions, JSON response for API calls
    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/approval', request.url));
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[approval] Unhandled error:', error);

    // Even on error, redirect form submissions back to approval page
    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/approval', request.url));
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
