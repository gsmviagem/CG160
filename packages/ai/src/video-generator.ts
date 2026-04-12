// ============================================================
// CG 160 — Video Generation Abstraction Layer
//
// Provides a unified interface over multiple AI video providers.
// Provider selection is configured via VIDEO_PROVIDER env var.
// ============================================================

import type { VideoProvider, Platform } from '@cg160/types';

export interface VideoGenerationRequest {
  prompt: string;           // AI video generation prompt from script
  duration_seconds: number;
  aspect_ratio?: '9:16' | '16:9' | '1:1'; // default 9:16 for short-form
  style_preset?: string;
  reference_image_url?: string; // for character consistency
  seed?: number;
}

export interface VideoGenerationJob {
  job_id: string;
  provider: VideoProvider;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created_at: string;
  estimated_completion_seconds?: number;
}

export interface VideoGenerationResult {
  job_id: string;
  provider: VideoProvider;
  status: 'completed' | 'failed';
  video_url?: string;       // temporary URL to download
  thumbnail_url?: string;
  duration_seconds?: number;
  error?: string;
}

// ---- RunwayML Provider -------------------------------------

async function runwayGenerateVideo(req: VideoGenerationRequest): Promise<VideoGenerationJob> {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) throw new Error('RUNWAY_API_KEY is not set');

  // RunwayML Gen-3 Alpha Turbo API
  const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-09-13',
    },
    body: JSON.stringify({
      model: 'gen3a_turbo',
      promptText: req.prompt,
      duration: Math.min(req.duration_seconds, 10), // RunwayML max 10s per clip
      ratio: req.aspect_ratio ?? '9:16',
      ...(req.seed ? { seed: req.seed } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`RunwayML API error: ${response.status} ${error}`);
  }

  const data = await response.json() as { id: string };
  return {
    job_id: data.id,
    provider: 'runway',
    status: 'queued',
    created_at: new Date().toISOString(),
    estimated_completion_seconds: 90,
  };
}

async function runwayPollJob(job_id: string): Promise<VideoGenerationResult> {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) throw new Error('RUNWAY_API_KEY is not set');

  const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${job_id}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'X-Runway-Version': '2024-09-13',
    },
  });

  if (!response.ok) {
    throw new Error(`RunwayML poll error: ${response.status}`);
  }

  const data = await response.json() as {
    id: string;
    status: string;
    output?: string[];
    failure?: string;
  };

  if (data.status === 'SUCCEEDED' && data.output?.[0]) {
    return { job_id, provider: 'runway', status: 'completed', video_url: data.output[0] };
  }
  if (data.status === 'FAILED') {
    return { job_id, provider: 'runway', status: 'failed', error: data.failure ?? 'Unknown error' };
  }

  // Still processing
  return { job_id, provider: 'runway', status: 'failed', error: 'Still processing' };
}

// ---- Kling Provider ----------------------------------------

async function klingGenerateVideo(req: VideoGenerationRequest): Promise<VideoGenerationJob> {
  const apiKey = process.env.KLING_API_KEY;
  if (!apiKey) throw new Error('KLING_API_KEY is not set');

  const response = await fetch('https://api.klingai.com/v1/videos/text2video', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_name: 'kling-v1-5',
      prompt: req.prompt,
      duration: String(Math.min(req.duration_seconds, 10)),
      aspect_ratio: req.aspect_ratio ?? '9:16',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kling API error: ${response.status} ${error}`);
  }

  const data = await response.json() as { data: { task_id: string } };
  return {
    job_id: data.data.task_id,
    provider: 'kling',
    status: 'queued',
    created_at: new Date().toISOString(),
    estimated_completion_seconds: 120,
  };
}

async function klingPollJob(job_id: string): Promise<VideoGenerationResult> {
  const apiKey = process.env.KLING_API_KEY;
  if (!apiKey) throw new Error('KLING_API_KEY is not set');

  const response = await fetch(`https://api.klingai.com/v1/videos/text2video/${job_id}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Kling poll error: ${response.status}`);
  }

  const data = await response.json() as {
    data: {
      task_status: string;
      task_result?: { videos: Array<{ url: string; duration: string }> };
      task_status_msg?: string;
    };
  };

  const status = data.data.task_status;
  if (status === 'succeed' && data.data.task_result?.videos?.[0]) {
    const video = data.data.task_result.videos[0];
    return {
      job_id,
      provider: 'kling',
      status: 'completed',
      video_url: video.url,
      duration_seconds: parseFloat(video.duration),
    };
  }
  if (status === 'failed') {
    return { job_id, provider: 'kling', status: 'failed', error: data.data.task_status_msg ?? 'Failed' };
  }

  return { job_id, provider: 'kling', status: 'failed', error: 'Still processing' };
}

// ---- Unified Interface -------------------------------------

function getProvider(): VideoProvider {
  const provider = process.env.VIDEO_PROVIDER as VideoProvider;
  if (!provider || !['runway', 'kling', 'luma'].includes(provider)) {
    return 'runway'; // default
  }
  return provider;
}

/**
 * Submit a video generation job to the configured provider.
 * Returns a job reference for polling.
 */
export async function submitVideoGenerationJob(
  req: VideoGenerationRequest,
  provider?: VideoProvider
): Promise<VideoGenerationJob> {
  const p = provider ?? getProvider();

  switch (p) {
    case 'runway': return runwayGenerateVideo(req);
    case 'kling':  return klingGenerateVideo(req);
    default:       throw new Error(`Video provider "${p}" not yet implemented`);
  }
}

/**
 * Poll a job's status. The Inngest worker calls this on a schedule
 * until the job completes or fails.
 */
export async function pollVideoGenerationJob(
  job_id: string,
  provider: VideoProvider
): Promise<VideoGenerationResult> {
  switch (provider) {
    case 'runway': return runwayPollJob(job_id);
    case 'kling':  return klingPollJob(job_id);
    default:       throw new Error(`Provider "${provider}" poll not implemented`);
  }
}

/**
 * Build a video generation prompt from a script's video_prompt + additional context.
 * Adds platform-specific formatting context.
 */
export function buildVideoPrompt(
  base_prompt: string,
  platform: Platform,
  character_visual_style?: string
): string {
  const platformContext = platform === 'tiktok'
    ? 'Vertical 9:16 format. Bold, dynamic visuals that read clearly on mobile.'
    : 'Vertical 9:16 format. Polished, vibrant aesthetic optimized for Instagram Reels.';

  const characterContext = character_visual_style
    ? `Character visual style: ${character_visual_style}.`
    : '';

  return `${base_prompt} ${characterContext} ${platformContext}`.trim();
}
