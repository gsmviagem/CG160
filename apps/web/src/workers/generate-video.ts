// ============================================================
// CG 160 — Inngest Worker: Generate Video
// ============================================================

import { inngest } from '@/lib/inngest';
import { getDB } from '@/lib/supabase';
import { submitVideoGenerationJob, buildVideoPrompt } from '@cg160/ai';
import type { VideoProvider, Platform } from '@cg160/types';

export const fnGenerateVideo = inngest.createFunction(
  { id: 'generate-video', name: 'Generate Video from Script', concurrency: 2 },
  { event: 'cg160/videos.generate' },
  async ({ event, step }) => {
    const db = getDB();
    const { script_id, platform, provider } = event.data;

    const { script, character } = await step.run('load-script', async () => {
      const script = await db.getScriptById(script_id);
      if (!script) throw new Error(`Script ${script_id} not found`);

      const character = script.idea?.character_id
        ? await db.getCharacterById(script.idea.character_id)
        : null;

      return { script, character };
    });

    // Get the video_prompt stored in script metadata
    const videoPromptBase = (script.metadata as Record<string, string>)?.video_prompt
      ?? `${script.hook} ${script.content.slice(0, 200)}`;

    const finalPrompt = buildVideoPrompt(
      videoPromptBase,
      platform as Platform,
      character?.visual_style ?? undefined
    );

    // Create the video record
    const video = await step.run('create-video-record', async () => {
      return db.createVideo({
        script_id,
        title: script.title,
        storage_path: null,
        thumbnail_path: null,
        storage_url: null,
        thumbnail_url: null,
        duration_seconds: script.duration_estimate_seconds ?? null,
        ai_provider: (provider ?? process.env.VIDEO_PROVIDER ?? 'runway') as VideoProvider,
        generation_prompt: finalPrompt,
        generation_params: { platform, provider },
        generation_job_id: null,
        character_used: character?.name ?? null,
        narrative_structure_type: script.idea?.narrative_type ?? null,
        hook_type: null,
        pacing_style: script.pacing_style,
        voice_style: script.voice_style,
        caption_style: script.caption_style,
        visual_complexity: null,
        scene_count: script.scenes.length,
        emotional_tone: script.emotional_tone,
        humor_type: script.humor_type,
        format_type: script.idea?.format_type ?? null,
        posting_hour: null,
        posting_day_of_week: null,
        version: 1,
        parent_video_id: null,
        status: 'generating',
        rejection_reason: null,
        approved_by: null,
        approved_at: null,
        scheduled_at: null,
        published_at: null,
        platform: platform as Platform,
        platform_video_id: null,
        platform_url: null,
        platform_status: null,
        caption: null,
        hashtags: [],
        metadata: {},
      });
    });

    // Submit generation job
    const job = await step.run('submit-generation-job', async () => {
      const result = await submitVideoGenerationJob(
        {
          prompt: finalPrompt,
          duration_seconds: script.duration_estimate_seconds ?? 30,
          aspect_ratio: '9:16',
        },
        (provider ?? process.env.VIDEO_PROVIDER ?? 'runway') as VideoProvider
      );

      await db.updateVideo(video.id, { generation_job_id: result.job_id });
      return result;
    });

    // Trigger polling
    await step.sendEvent('start-polling', {
      name: 'cg160/videos.poll',
      data: {
        video_id: video.id,
        job_id: job.job_id,
        provider: job.provider,
      },
    });

    // Update script status
    await step.run('update-script-status', async () => {
      await db.updateScriptStatus(script_id, 'generating_video');
    });

    return { video_id: video.id, job_id: job.job_id };
  }
);
