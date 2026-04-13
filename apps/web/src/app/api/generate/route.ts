// ============================================================
// CG 160 — Manual Generation Trigger API
// POST /api/generate  { type: 'ideas' | 'script', idea_id?: string, count?: number }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest';
import { getDB } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';

  let body: Record<string, string>;
  if (contentType.includes('application/json')) {
    body = await request.json() as Record<string, string>;
  } else {
    const fd = await request.formData();
    body = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)]));
  }

  const { type, idea_id, count } = body;

  try {
    if (type === 'ideas') {
      await inngest.send({
        name: 'cg160/ideas.generate',
        data: { count: Number(count ?? 5) },
      });
      if (!contentType.includes('application/json')) {
        return NextResponse.redirect(new URL('/ideas', request.url));
      }
      return NextResponse.json({ success: true, message: 'Idea generation started' });
    }

    if (type === 'script') {
      if (!idea_id) {
        return NextResponse.json({ error: 'idea_id required' }, { status: 400 });
      }
      // Make sure idea is in approved state
      const db = getDB();
      await db.updateIdeaStatus(idea_id, 'approved');
      await inngest.send({
        name: 'cg160/scripts.generate',
        data: { idea_id },
      });
      if (!contentType.includes('application/json')) {
        return NextResponse.redirect(new URL('/ideas', request.url));
      }
      return NextResponse.json({ success: true, message: 'Script generation started' });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });

  } catch (error) {
    console.error('[generate] Error:', error);
    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/ideas', request.url));
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
