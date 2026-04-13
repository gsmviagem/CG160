// CG 160 — Delete API
// POST /api/delete  { type: 'idea' | 'script', id: string }

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  let body: { type?: string; id?: string };
  try {
    body = await request.json() as { type?: string; id?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { type, id } = body;
  if (!type || !id) {
    return NextResponse.json({ error: 'type and id required' }, { status: 400 });
  }

  const db = getDB();
  try {
    if (type === 'idea')   await db.deleteIdea(id);
    else if (type === 'script') await db.deleteScript(id);
    else return NextResponse.json({ error: 'Unknown type' }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[delete] error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
