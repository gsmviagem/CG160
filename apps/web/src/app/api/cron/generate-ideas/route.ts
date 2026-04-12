// Vercel Cron: every 6 hours
// Triggers the Inngest idea generation job.

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/utils';
import { inngest } from '@/lib/inngest';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await inngest.send({
    name: 'cg160/ideas.generate',
    data: { count: parseInt(process.env.IDEAS_PER_BATCH ?? '10') },
  });

  return NextResponse.json({ triggered: true, at: new Date().toISOString() });
}
