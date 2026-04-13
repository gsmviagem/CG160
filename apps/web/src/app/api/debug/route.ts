// ============================================================
// CG 160 — Debug endpoint (remove after fixing)
// GET /api/debug — shows env var status and tests inngest.send
// ============================================================

import { NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest';

export async function GET() {
  const eventKey = process.env.INNGEST_EVENT_KEY;
  const signingKey = process.env.INNGEST_SIGNING_KEY;

  // Test inngest send with a dummy/no-op event
  let sendResult: string;
  try {
    await inngest.send({ name: 'cg160/debug.ping', data: {} } as never);
    sendResult = 'OK';
  } catch (err: unknown) {
    sendResult = err instanceof Error ? err.message : String(err);
  }

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
