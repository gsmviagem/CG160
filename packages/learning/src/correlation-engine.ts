// ============================================================
// CG 160 — Correlation Engine
//
// Computes Pearson correlations between content features
// and performance metrics.
//
// This is the analytical heart of the learning system.
// No deep learning — pure statistics with practical thresholds.
// ============================================================

import type { TrainingRecord } from './feature-extractor';

export interface CorrelationResult {
  feature: string;
  value: string;       // for categorical; or bucket for numerical
  metric: string;
  correlation: number; // Pearson r, -1 to 1
  sample_size: number;
  confidence: number;  // 0–1, based on sample size
}

export interface NumericalCorrelation {
  feature: string;
  metric: string;
  pearson_r: number;
  sample_size: number;
  confidence: number;
}

const MIN_SAMPLE_SIZE = 5; // minimum samples for a correlation to be meaningful
const CONFIDENCE_FULL = 30; // sample size for 100% confidence

/**
 * Compute confidence level based on sample size.
 * Grows from 0 to 1 as sample size approaches CONFIDENCE_FULL.
 */
function computeConfidence(sampleSize: number): number {
  return Math.min(sampleSize / CONFIDENCE_FULL, 1.0);
}

/**
 * Compute Pearson correlation coefficient between two numeric arrays.
 */
export function pearsonCorrelation(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length || xs.length < 2) return 0;

  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;

  return Math.max(-1, Math.min(1, numerator / denominator));
}

/**
 * Compute Pearson correlations between all numerical script scoring
 * dimensions and a given performance metric.
 */
export function computeNumericalCorrelations(
  records: TrainingRecord[],
  metric: keyof TrainingRecord['performance']
): NumericalCorrelation[] {
  const numericalFeatures = [
    'hook_strength', 'clarity_score', 'emotional_trigger_score', 'curiosity_gap_score',
    'pacing_density_score', 'setup_simplicity_score', 'punchline_strength', 'loop_potential',
    'shareability_score', 'memorability_score', 'novelty_score', 'absurdity_balance',
    'visual_feasibility', 'viral_structure_alignment', 'script_total_score',
    'visual_complexity', 'scene_count',
  ] as const;

  const results: NumericalCorrelation[] = [];

  for (const feature of numericalFeatures) {
    const pairs = records
      .map(r => ({
        x: r.features[feature] as number,
        y: r.performance[metric] as number,
      }))
      .filter(p => typeof p.x === 'number' && typeof p.y === 'number' && !isNaN(p.x) && !isNaN(p.y));

    if (pairs.length < MIN_SAMPLE_SIZE) continue;

    const xs = pairs.map(p => p.x);
    const ys = pairs.map(p => p.y);
    const pearson_r = pearsonCorrelation(xs, ys);

    results.push({
      feature,
      metric: String(metric),
      pearson_r,
      sample_size: pairs.length,
      confidence: computeConfidence(pairs.length),
    });
  }

  return results.sort((a, b) => Math.abs(b.pearson_r) - Math.abs(a.pearson_r));
}

/**
 * Compute point-biserial correlations for categorical features
 * by grouping records by category value and comparing mean performance.
 */
export function computeCategoricalCorrelations(
  records: TrainingRecord[],
  metric: keyof TrainingRecord['performance']
): CorrelationResult[] {
  const categoricalFeatures = [
    'character_used', 'narrative_structure_type', 'hook_type',
    'pacing_style', 'voice_style', 'caption_style', 'emotional_tone',
    'humor_type', 'format_type', 'platform', 'posting_hour_bucket',
    'day_type', 'duration_bucket',
  ] as const;

  const results: CorrelationResult[] = [];
  const allValues = records.map(r => r.performance[metric] as number).filter(v => !isNaN(v));
  const overallMean = allValues.reduce((a, b) => a + b, 0) / Math.max(allValues.length, 1);
  const overallStd = Math.sqrt(
    allValues.reduce((sum, v) => sum + Math.pow(v - overallMean, 2), 0) / Math.max(allValues.length, 1)
  );

  for (const feature of categoricalFeatures) {
    // Group records by feature value
    const groups = new Map<string, number[]>();

    for (const record of records) {
      const featureValue = record.features[feature] as string;
      const perfValue = record.performance[metric] as number;
      if (typeof perfValue !== 'number' || isNaN(perfValue)) continue;

      if (!groups.has(featureValue)) groups.set(featureValue, []);
      groups.get(featureValue)!.push(perfValue);
    }

    for (const [value, groupValues] of groups.entries()) {
      if (groupValues.length < MIN_SAMPLE_SIZE) continue;

      const groupMean = groupValues.reduce((a, b) => a + b, 0) / groupValues.length;
      // Normalized effect size: (groupMean - overallMean) / overallStd
      // Mapped to -1 to 1 range (clip at ±2 std devs)
      const effectSize = overallStd > 0
        ? Math.max(-1, Math.min(1, (groupMean - overallMean) / (overallStd * 2)))
        : 0;

      results.push({
        feature,
        value,
        metric: String(metric),
        correlation: effectSize,
        sample_size: groupValues.length,
        confidence: computeConfidence(groupValues.length),
      });
    }
  }

  return results.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

/**
 * Run a full correlation sweep across all features and key metrics.
 */
export function runCorrelationSweep(records: TrainingRecord[]): {
  numerical: NumericalCorrelation[];
  categorical: CorrelationResult[];
} {
  const targetMetrics: Array<keyof TrainingRecord['performance']> = [
    'performance_score', 'completion_rate', 'engagement_ratio', 'shares',
  ];

  const numerical: NumericalCorrelation[] = [];
  const categorical: CorrelationResult[] = [];

  for (const metric of targetMetrics) {
    numerical.push(...computeNumericalCorrelations(records, metric));
    categorical.push(...computeCategoricalCorrelations(records, metric));
  }

  return { numerical, categorical };
}
