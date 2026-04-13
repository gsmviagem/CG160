// ============================================================
// CG 160 — Manual Generation Trigger API
// POST /api/generate  { type: 'ideas' | 'script', idea_id?: string, count?: number }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest';
import { getDB } from '@/lib/supabase';

async function safeSend(name: string, data: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    // Force-set event key at runtime in case module was initialized before env vars loaded
    const key = process.env.INNGEST_EVENT_KEY;
    if (key) inngest.setEventKey(key);

    await inngest.send({ name, data } as Parameters<typeof inngest.send>[0]);
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[generate] inngest.send(${name}) failed: ${msg}`, err);
    return { ok: false, error: msg };
  }
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';

  let body: Record<string, string>;
  try {
    if (contentType.includes('application/json')) {
      body = await request.json() as Record<string, string>;
    } else {
      const fd = await request.formData();
      body = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)]));
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { type, idea_id, count } = body;

  if (type === 'ideas') {
    const result = await safeSend('cg160/ideas.generate', { count: Number(count ?? 5) });
    if (!result.ok) {
      // Surface the real error to the client so user/developer can diagnose
      return NextResponse.json({
        error: 'Inngest send failed',
        detail: result.error,
        hint: 'Check INNGEST_EVENT_KEY in Vercel environment variables',
      }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Idea generation started' });
  }

  if (type === 'script') {
    if (!idea_id) {
      return NextResponse.json({ error: 'idea_id required' }, { status: 400 });
    }
    try {
      const db = getDB();
      await db.updateIdeaStatus(idea_id, 'approved');
    } catch (err) {
      console.error('[generate] updateIdeaStatus failed:', err);
    }
    const result = await safeSend('cg160/scripts.generate', { idea_id });
    if (!result.ok) {
      return NextResponse.json({
        error: 'Inngest send failed',
        detail: result.error,
        hint: 'Check INNGEST_EVENT_KEY in Vercel environment variables',
      }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Script generation started' });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}
