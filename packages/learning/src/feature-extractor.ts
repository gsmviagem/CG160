// ============================================================
// CG 160 — Feature Extractor
//
// Extracts structured feature vectors from Video + PerformanceMetrics
// records for use in correlation analysis.
// ============================================================

import type { Video, PerformanceMetrics, Script } from '@cg160/types';
import { DIMENSION_KEYS } from '@cg160/scoring';

export interface VideoFeatureVector {
  video_id: string;
  // categorical features
  character_used: string;
  narrative_structure_type: string;
  hook_type: string;
  pacing_style: string;
  voice_style: string;
  caption_style: string;
  emotional_tone: string;
  humor_type: string;
  format_type: string;
  platform: string;
  posting_hour_bucket: string;   // 'morning' | 'afternoon' | 'evening' | 'night'
  day_type: string;              // 'weekday' | 'weekend'
  duration_bucket: string;       // '0-15s' | '15-30s' | '30-45s' | '45-60s' | '60s+'
  // numerical features (from script scoring)
  hook_strength: number;
  clarity_score: number;
  emotional_trigger_score: number;
  curiosity_gap_score: number;
  pacing_density_score: number;
  setup_simplicity_score: number;
  punchline_strength: number;
  loop_potential: number;
  shareability_score: number;
  memorability_score: number;
  novelty_score: number;
  absurdity_balance: number;
  visual_feasibility: number;
  viral_structure_alignment: number;
  script_total_score: number;
  visual_complexity: number;
  scene_count: number;
}

export interface PerformanceVector {
  video_id: string;
  // primary target metrics (what we optimize for)
  performance_score: number;     // 0–100 composite
  completion_rate: number;       // 0–1
  engagement_ratio: number;      // 0–1+
  views: number;
  shares: number;
  saves: number;
  // derived
  is_high_performer: boolean;    // performance_score >= threshold
}

export interface TrainingRecord {
  features: VideoFeatureVector;
  performance: PerformanceVector;
}

const PERFORMANCE_THRESHOLD = 65; // score >= this = "high performer"

function bucketHour(hour: number | null): string {
  if (hour === null) return 'unknown';
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'night';
}

function bucketDuration(seconds: number | null): string {
  if (!seconds) return 'unknown';
  if (seconds <= 15) return '0-15s';
  if (seconds <= 30) return '15-30s';
  if (seconds <= 45) return '30-45s';
  if (seconds <= 60) return '45-60s';
  return '60s+';
}

function bucketDayOfWeek(dow: number | null): string {
  if (dow === null) return 'unknown';
  return dow === 0 || dow === 6 ? 'weekend' : 'weekday';
}

/**
 * Extract a feature vector from a video + its script.
 * Numerical script scores come from the script record.
 */
export function extractFeatureVector(
  video: Video,
  script: Script
): VideoFeatureVector {
  return {
    video_id: video.id,
    // categorical
    character_used: video.character_used ?? 'unknown',
    narrative_structure_type: video.narrative_structure_type ?? 'unknown',
    hook_type: video.hook_type ?? 'unknown',
    pacing_style: video.pacing_style ?? 'unknown',
    voice_style: video.voice_style ?? 'unknown',
    caption_style: video.caption_style ?? 'unknown',
    emotional_tone: video.emotional_tone ?? 'unknown',
    humor_type: video.humor_type ?? 'unknown',
    format_type: video.format_type ?? 'unknown',
    platform: video.platform ?? 'unknown',
    posting_hour_bucket: bucketHour(video.posting_hour),
    day_type: bucketDayOfWeek(video.posting_day_of_week),
    duration_bucket: bucketDuration(video.duration_seconds),
    // numerical from script scores
    hook_strength: script.hook_strength ?? 5,
    clarity_score: script.clarity_score ?? 5,
    emotional_trigger_score: script.emotional_trigger_score ?? 5,
    curiosity_gap_score: script.curiosity_gap_score ?? 5,
    pacing_density_score: script.pacing_density_score ?? 5,
    setup_simplicity_score: script.setup_simplicity_score ?? 5,
    punchline_strength: script.punchline_strength ?? 5,
    loop_potential: script.loop_potential ?? 5,
    shareability_score: script.shareability_score ?? 5,
    memorability_score: script.memorability_score ?? 5,
    novelty_score: script.novelty_score ?? 5,
    absurdity_balance: script.absurdity_balance ?? 5,
    visual_feasibility: script.visual_feasibility ?? 5,
    viral_structure_alignment: script.viral_structure_alignment ?? 5,
    script_total_score: script.total_score ?? 50,
    visual_complexity: video.visual_complexity ?? 5,
    scene_count: video.scene_count ?? 3,
  };
}

/**
 * Extract performance vector from the stabilized metrics snapshot.
 */
export function extractPerformanceVector(
  video: Video,
  metrics: PerformanceMetrics
): PerformanceVector {
  const performance_score = metrics.performance_score ?? computePerformanceScore(metrics);

  return {
    video_id: video.id,
    performance_score,
    completion_rate: metrics.completion_rate ?? 0,
    engagement_ratio: metrics.engagement_ratio ?? 0,
    views: metrics.views,
    shares: metrics.shares,
    saves: metrics.saves,
    is_high_performer: performance_score >= PERFORMANCE_THRESHOLD,
  };
}

/**
 * Compute a composite performance score if not already stored.
 * Formula: views_norm(20) + completion_rate(30) + engagement(30) + shares_saves(20)
 */
function computePerformanceScore(metrics: PerformanceMetrics): number {
  const completion = (metrics.completion_rate ?? 0) * 30;
  const engagement = Math.min((metrics.engagement_ratio ?? 0) * 100, 30);
  // Views component: log-normalized, 10k views = ~15 points, 100k = ~20
  const views_component = Math.min(Math.log10(Math.max(metrics.views, 1)) * 5, 20);
  const shares_saves = Math.min(
    ((metrics.shares + metrics.saves) / Math.max(metrics.views, 1)) * 1000,
    20
  );

  return Math.min(100, Math.round(completion + engagement + views_component + shares_saves));
}

/**
 * Combine feature + performance vectors into training records.
 */
export function buildTrainingRecords(
  videos: Video[],
  scripts: Map<string, Script>,
  metricsMap: Map<string, PerformanceMetrics>
): TrainingRecord[] {
  const records: TrainingRecord[] = [];

  for (const video of videos) {
    const script = scripts.get(video.script_id);
    const metrics = metricsMap.get(video.id);

    if (!script || !metrics || !metrics.is_stabilized) continue;

    records.push({
      features: extractFeatureVector(video, script),
      performance: extractPerformanceVector(video, metrics),
    });
  }

  return records;
}
