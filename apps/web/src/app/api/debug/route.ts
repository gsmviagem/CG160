// ============================================================
// CG 160 — Debug endpoint (remove after fixing)
// GET /api/debug — shows env var status and tests inngest.send
// ============================================================

import { NextResponse } from 'next/server';
import { sendInngestEvent } from '@/lib/inngest';

export async function GET() {
  const eventKey = process.env.INNGEST_EVENT_KEY;
  const signingKey = process.env.INNGEST_SIGNING_KEY;

  // Test via direct REST call
  const result = await sendInngestEvent('cg160/debug.ping', {});
  const sendResult = result.ok ? 'OK' : result.error ?? 'unknown error';

  return NextResponse.json({
    env: {
      INNGEST_EVENT_KEY: eventKey
        ? `set (${eventKey.length} chars, starts with "${eventKey.slice(0, 8)}...")`
        : 'NOT SET',
      INNGEST_SIGNING_KEY: signingKey
        ? `set (${signingKey.length} chars)`
        : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    inngest_send_test: sendResult,
  });
}
