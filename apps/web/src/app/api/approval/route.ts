// ============================================================
// CG 160 — Approval API Route
// Handles approve / reject / regenerate actions for all entity types.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/supabase';
import { inngest } from '@/lib/inngest';

export async function POST(request: NextRequest) {
  const db = getDB();

  let body: Record<string, string>;
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    body = await request.json() as Record<string, string>;
  } else {
    const formData = await request.formData();
    body = Object.fromEntries(
      [...formData.entries()].map(([k, v]) => [k, String(v)])
    );
  }

  const { entity_type, entity_id, action, reason, scheduled_at } = body;

  if (!entity_type || !entity_id || !action) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const performed_by = 'operator'; // single-user system for now

  try {
    switch (`${entity_type}:${action}`) {
      case 'idea:approved':
        await db.updateIdeaStatus(entity_id, 'approved');
        // Trigger script generation
        await inngest.send({ name: 'cg160/scripts.generate', data: { idea_id: entity_id } });
        break;

      case 'idea:rejected':
        await db.updateIdeaStatus(entity_id, 'rejected', {
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
        });
        break;

      case 'idea:regenerate_requested':
        await db.updateIdeaStatus(entity_id, 'rejected', {
          rejection_reason: reason ?? 'Regeneration requested',
          rejected_at: new Date().toISOString(),
        });
        break;

      case 'script:approved': {
        await db.updateScriptStatus(entity_id, 'approved', {
          approved_at: new Date().toISOString(),
        });
        // Trigger video generation (default to tiktok)
        await inngest.send({
          name: 'cg160/videos.generate',
          data: { script_id: entity_id, platform: 'tiktok' },
        });
        break;
      }

      case 'script:rejected':
        await db.updateScriptStatus(entity_id, 'rejected', {
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
        });
        break;

      case 'script:regenerate_requested': {
        const script = await db.getScriptById(entity_id);
        if (script) {
          await db.updateScriptStatus(entity_id, 'rejected', {
            rejection_reason: reason ?? 'Regeneration requested',
            rejected_at: new Date().toISOString(),
          });
          // Re-trigger script gen from the same idea
          await inngest.send({
            name: 'cg160/scripts.generate',
            data: { idea_id: script.idea_id },
          });
        }
        break;
      }

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
          rejection_reason: reason,
        });
        break;

      case 'video:regenerate_requested': {
        const video = await db.getVideoById(entity_id);
        if (video) {
          await db.updateVideo(entity_id, {
            status: 'rejected',
            rejection_reason: reason ?? 'Regeneration requested',
          });
          await inngest.send({
            name: 'cg160/videos.generate',
            data: { script_id: video.script_id, platform: video.platform ?? 'tiktok' },
          });
        }
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${entity_type}:${action}` }, { status: 400 });
    }

    await db.logApprovalEvent(entity_type, entity_id, action, performed_by, reason);

    // If request came from a form (not JSON), redirect back
    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/dashboard/approval', request.url));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
