// ============================================================
// CG 160 — Operator Settings API
// GET  /api/settings?key=idea_instructions
// POST /api/settings  { key, value }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'Pass ?key=...' }, { status: 400 });

  const db = getDB();
  const value = await db.getSetting(key);
  return NextResponse.json({ key, value });
}

export async function POST(request: NextRequest) {
  const { key, value } = await request.json() as { key: string; value: string };
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

  const db = getDB();
  await db.setSetting(key, value ?? '');
  return NextResponse.json({ ok: true });
}
