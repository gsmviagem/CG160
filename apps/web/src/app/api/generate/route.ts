// ============================================================
// CG 160 — Manual Generation Trigger API
// POST /api/generate  { type: 'ideas' | 'script', idea_id?: string, count?: number }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { sendInngestEvent } from '@/lib/inngest';
import { getDB } from '@/lib/supabase';

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

  const { type, idea_id, count, theme } = body;

  if (type === 'ideas') {
    const payload: Record<string, unknown> = { count: Number(count ?? 5) };
    if (theme) payload.theme = theme;
    const result = await sendInngestEvent('cg160/ideas.generate', payload);
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
    const result = await sendInngestEvent('cg160/scripts.generate', { idea_id });
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
