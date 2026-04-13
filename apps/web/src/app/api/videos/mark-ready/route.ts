// ============================================================
// CG 160 — Mark manually-created video as ready for approval
// GET /api/videos/mark-ready?script_id=xxx&platform=tiktok
//
// Creates a Video record pointing to the deterministic storage
// path the user already uploaded their file to.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/supabase';
import { videoPath, videoUrl } from '@/lib/filenames';

export async function GET(request: NextRequest) {
  const script_id = request.nextUrl.searchParams.get('script_id');
  const platform  = (request.nextUrl.searchParams.get('platform') ?? 'tiktok') as 'tiktok' | 'instagram';

  if (!script_id) {
    return NextResponse.json({ error: 'Pass ?script_id=xxx' }, { status: 400 });
  }

  const db = getDB();

  const script = await db.getScriptById(script_id);
  if (!script) {
    return NextResponse.json({ error: 'Script not found' }, { status: 404 });
  }

  const storagePath = videoPath(script_id);
  const storageUrl  = videoUrl(script_id);

  const video = await db.createVideo({
    script_id,
    title: script.title,
    storage_path: storagePath,
    thumbnail_path: null,
    storage_url: storageUrl,
    thumbnail_url: null,
    duration_seconds: script.duration_estimate_seconds ?? null,
    ai_provider: null,
    generation_prompt: null,
    generation_params: { source: 'manual' },
    generation_job_id: null,
    character_used: script.idea?.character?.name ?? null,
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
    status: 'ready',
    rejection_reason: null,
    approved_by: null,
    approved_at: null,
    scheduled_at: null,
    published_at: null,
    platform,
    platform_video_id: null,
    platform_url: null,
    platform_status: null,
    caption: null,
    hashtags: [],
    metadata: { created_by: 'manual' },
  });

  // Advance script status
  await db.updateScriptStatus(script_id, 'video_ready');

  // Redirect to approval page so user can approve the video
  return NextResponse.redirect(new URL('/approval', request.url));
}
