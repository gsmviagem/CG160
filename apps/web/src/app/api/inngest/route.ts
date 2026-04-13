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

// Allow Inngest steps to run for up to 60s (Vercel default is 10s, which
// kills long AI calls like Groq script generation with 8192 output tokens).
export const maxDuration = 60;

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
