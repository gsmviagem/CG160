// ============================================================
// CG 160 — Debug endpoint
// GET /api/debug — shows env var status and tests Inngest + Groq
// ============================================================

import { NextResponse } from 'next/server';
import { sendInngestEvent } from '@/lib/inngest';
import { getDB } from '@/lib/supabase';

export async function GET() {
  const eventKey    = process.env.INNGEST_EVENT_KEY;
  const signingKey  = process.env.INNGEST_SIGNING_KEY;
  const groqKey     = process.env.GROQ_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Test Inngest send
  const inngestResult = await sendInngestEvent('cg160/debug.ping', {});

  // Test Groq
  let groqTest: string;
  if (!groqKey) {
    groqTest = 'NOT SET — script generation WILL FAIL';
  } else {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Say "ok" in one word.' }],
          max_tokens: 5,
        }),
      });
      groqTest = res.ok ? `OK (${res.status})` : `Error ${res.status}: ${await res.text()}`;
    } catch (e) {
      groqTest = `Fetch failed: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  // Test DB — fetch 1 approved idea
  let dbTest: string;
  let sampleIdeaId: string | null = null;
  try {
    const db = getDB();
    const ideas = await db.getAllIdeas(5);
    const approved = ideas.find(i => i.status === 'approved');
    dbTest = `OK — ${ideas.length} total ideas`;
    sampleIdeaId = approved?.id ?? null;
  } catch (e) {
    dbTest = `Error: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({
    env: {
      INNGEST_EVENT_KEY:        eventKey    ? `set (${eventKey.length} chars, starts "${eventKey.slice(0,8)}...")` : 'NOT SET',
      INNGEST_SIGNING_KEY:      signingKey  ? `set (${signingKey.length} chars)` : 'NOT SET',
      GROQ_API_KEY:             groqKey     ? `set (${groqKey.length} chars)` : 'NOT SET — CRITICAL',
      ANTHROPIC_API_KEY:        anthropicKey? `set (${anthropicKey.length} chars)` : 'not set (optional)',
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? `set` : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY:serviceKey  ? `set (${serviceKey.length} chars)` : 'NOT SET',
      NODE_ENV:    process.env.NODE_ENV,
      VERCEL_ENV:  process.env.VERCEL_ENV,
    },
    tests: {
      inngest_send:     inngestResult.ok ? 'OK' : inngestResult.error ?? 'failed',
      groq_api:         groqTest,
      supabase_db:      dbTest,
    },
    sample_approved_idea_id: sampleIdeaId,
  });
}
