// ============================================================
// CG 160 — Inngest Worker: Poll Video Generation Job
// Polls provider until complete, then downloads + stores.
// Uses Inngest sleep to retry on intervals.
// ============================================================

import { inngest } from '@/lib/inngest';
import { getDB } from '@/lib/supabase';
import { pollVideoGenerationJob } from '@cg160/ai';
import { getServiceClient } from '@/lib/supabase';
import type { VideoProvider } from '@cg160/types';

const MAX_POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 30_000; // 30 seconds

export const fnPollVideoJob = inngest.createFunction(
  {
    id: 'poll-video-job',
    name: 'Poll Video Generation Job',
    concurrency: 10,
    retries: 0, // We handle retry logic ourselves
  },
  { event: 'cg160/videos.poll' },
  async ({ event, step }) => {
    const db = getDB();
    const { video_id, job_id, provider } = event.data;

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await step.sleep(`wait-${attempt}`, POLL_INTERVAL_MS);
      }

      const result = await step.run(`poll-attempt-${attempt}`, async () => {
        return pollVideoGenerationJob(job_id, provider as VideoProvider);
      });

      if (result.status === 'completed' && result.video_url) {
        // Download and store video in Supabase Storage
        await step.run('store-video', async () => {
          const supabase = getServiceClient();

          // Download video
          const response = await fetch(result.video_url!);
          if (!response.ok) throw new Error(`Failed to download video: ${response.status}`);
          const buffer = await response.arrayBuffer();

          // Upload to Supabase Storage
          const storagePath = `videos/${video_id}/video.mp4`;
          const { error: uploadError } = await supabase.storage
            .from('cg160-videos')
            .upload(storagePath, buffer, {
              contentType: 'video/mp4',
              upsert: true,
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('cg160-videos')
            .getPublicUrl(storagePath);

          await db.updateVideo(video_id, {
            status: 'ready',
            storage_path: storagePath,
            storage_url: publicUrl,
            duration_seconds: result.duration_seconds ?? null,
          });
        });

        return { status: 'completed', video_id };
      }

      if (result.status === 'failed') {
        await step.run('mark-failed', async () => {
          await db.updateVideo(video_id, {
            status: 'failed',
            metadata: { error: result.error } as never,
          });
        });
        return { status: 'failed', error: result.error };
      }

      // Still processing — continue loop
    }

    // Timeout
    await db.updateVideo(video_id, {
      status: 'failed',
      metadata: { error: 'Generation timed out after max poll attempts' } as never,
    });

    return { status: 'timeout' };
  }
);
