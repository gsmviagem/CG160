// Vercel Cron: every hour

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/utils';
import { inngest } from '@/lib/inngest';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await inngest.send({ name: 'cg160/metrics.sync', data: {} });

  return NextResponse.json({ triggered: true, at: new Date().toISOString() });
}
