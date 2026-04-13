// Vercel Cron: daily at 9am UTC
// Triggers all pipeline jobs in sequence.

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/utils';
import { inngest } from '@/lib/inngest';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await Promise.all([
    inngest.send({
      name: 'cg160/ideas.generate',
      data: { count: parseInt(process.env.IDEAS_PER_BATCH ?? '10') },
    }),
    inngest.send({
      name: 'cg160/metrics.sync',
      data: {},
    }),
    inngest.send({
      name: 'cg160/learning.run',
      data: {},
    }),
  ]);

  return NextResponse.json({ triggered: true, at: new Date().toISOString() });
}
