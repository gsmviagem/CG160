// ============================================================
// CG 160 — Inngest API Endpoint
// All Inngest functions are served through this single route.
// ============================================================

import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { fnGenerateIdeas } from '@/workers/generate-ideas';
import { fnGenerateScript } from '@/workers/generate-script';
import { fnScoreScript } from '@/workers/score-script';
import { fnGenerateVideo } from '@/workers/generate-video';
import { fnPollVideoJob } from '@/workers/poll-video-job';
import { fnSyncMetrics } from '@/workers/sync-metrics';
import { fnRunLearningLoop } from '@/workers/learning-loop';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    fnGenerateIdeas,
    fnGenerateScript,
    fnScoreScript,
    fnGenerateVideo,
    fnPollVideoJob,
    fnSyncMetrics,
    fnRunLearningLoop,
  ],
});
