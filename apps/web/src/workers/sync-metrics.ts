// ============================================================
// CG 160 — Inngest Worker: Sync Performance Metrics
//
// For each published video, polls platform APIs and stores
// a performance snapshot. Marks as stabilized after 72h.
//
// NOTE: TikTok and Instagram API integrations are stubbed.
// Replace stub methods with real API calls when credentials available.
// ============================================================

import { inngest } from '@/lib/inngest';
import { getDB } from '@/lib/supabase';
import type { PerformanceMetrics, Platform, SnapshotType } from '@cg160/types';

function getSnapshotType(hoursSincePublish: number): SnapshotType {
  if (hoursSincePublish < 2) return 'hourly';
  if (hoursSincePublish < 8) return '6h';
  if (hoursSincePublish < 25) return 'daily';
  if (hoursSincePublish < 74) return '72h';
  if (hoursSincePublish < 168) return 'weekly';
  return 'monthly';
}

function computeEngagementRatio(metrics: Partial<PerformanceMetrics>): number {
  const views = metrics.views ?? 0;
  if (views === 0) return 0;
  const interactions = (metrics.likes ?? 0) + (metrics.comments ?? 0) +
    (metrics.shares ?? 0) + (metrics.saves ?? 0);
  return interactions / views;
}

function computeRetentionScore(
  completion_rate: number | null,
  avg_watch: number | null,
  duration: number | null
): number | null {
  if (!completion_rate && !avg_watch) return null;
  const cr_score = (completion_rate ?? 0) * 50;
  const wd_score = duration && avg_watch ? (avg_watch / duration) * 50 : 0;
  return Math.min(100, Math.round(cr_score + wd_score));
}

function computePerformanceScore(
  views: number,
  completion_rate: number | null,
  engagement_ratio: number,
  shares: number,
  saves: number
): number {
  const completion = (completion_rate ?? 0) * 30;
  const engagement = Math.min(engagement_ratio * 100, 30);
  const views_c = Math.min(Math.log10(Math.max(views, 1)) * 5, 20);
  const shares_saves = Math.min(((shares + saves) / Math.max(views, 1)) * 1000, 20);
  return Math.min(100, Math.round(completion + engagement + views_c + shares_saves));
}

// --- Stub platform fetchers (replace with real API calls) ---

async function fetchTikTokMetrics(platform_video_id: string): Promise<Partial<PerformanceMetrics>> {
  // TODO: TikTok Content Posting API v2 — GET /v2/video/query/
  // For now, returns stub to allow end-to-end testing
  console.log(`[metrics] TikTok fetch stub for ${platform_video_id}`);
  return {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    completion_rate: null,
    avg_watch_duration_seconds: null,
  };
}

async function fetchInstagramMetrics(platform_video_id: string): Promise<Partial<PerformanceMetrics>> {
  // TODO: Instagram Graph API — GET /{media-id}/insights
  console.log(`[metrics] Instagram fetch stub for ${platform_video_id}`);
  return {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    completion_rate: null,
    avg_watch_duration_seconds: null,
  };
}

export const fnSyncMetrics = inngest.createFunction(
  { id: 'sync-metrics', name: 'Sync Platform Performance Metrics', concurrency: 1 },
  { event: 'cg160/metrics.sync' },
  async ({ event, step }) => {
    const db = getDB();

    const publishedVideos = await step.run('load-published-videos', async () => {
      return db.getPublishedVideosForMetricsSync();
    });

    let synced = 0;
    let errors = 0;

    for (const video of publishedVideos) {
      await step.run(`sync-video-${video.id}`, async () => {
        if (!video.published_at || !video.platform_video_id) return;

        const hoursSincePublish = (Date.now() - new Date(video.published_at).getTime()) / 3_600_000;
        const snapshot_type = getSnapshotType(hoursSincePublish);
        const is_stabilized = hoursSincePublish >= 72;

        try {
          const raw = video.platform === 'tiktok'
            ? await fetchTikTokMetrics(video.platform_video_id)
            : await fetchInstagramMetrics(video.platform_video_id);

          const engagement_ratio = computeEngagementRatio(raw);
          const retention_score = computeRetentionScore(
            raw.completion_rate ?? null,
            raw.avg_watch_duration_seconds ?? null,
            video.duration_seconds ?? null
          );
          const performance_score = computePerformanceScore(
            raw.views ?? 0,
            raw.completion_rate ?? null,
            engagement_ratio,
            raw.shares ?? 0,
            raw.saves ?? 0
          );

          await db.insertMetricsSnapshot({
            video_id: video.id,
            platform: video.platform as Platform,
            snapshot_type,
            measured_at: new Date().toISOString(),
            hours_since_publish: Math.round(hoursSincePublish),
            views: raw.views ?? 0,
            watch_time_seconds: null,
            completion_rate: raw.completion_rate ?? null,
            avg_watch_duration_seconds: raw.avg_watch_duration_seconds ?? null,
            likes: raw.likes ?? 0,
            comments: raw.comments ?? 0,
            shares: raw.shares ?? 0,
            saves: raw.saves ?? 0,
            profile_visits: null,
            follows_from_video: null,
            engagement_ratio,
            retention_score,
            performance_score,
            is_stabilized,
            metadata: {},
          });

          synced++;
        } catch (err) {
          console.error(`[metrics] Error syncing video ${video.id}:`, err);
          errors++;
        }
      });
    }

    return { total: publishedVideos.length, synced, errors };
  }
);
