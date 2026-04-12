// ============================================================
// CG 160 — Weight Adjuster
//
// Adjusts scoring dimension weights based on correlation data.
// Uses exponential moving average (EMA) to prevent overfitting.
//
// Core formula:
//   w_new = EMA_ALPHA × (1 + correlation × sensitivity) + (1 - EMA_ALPHA) × w_old
//   w_new = clamp(w_new, w_min, w_max)
//
// Where:
//   EMA_ALPHA = 0.15 (conservative, can be tuned)
//   sensitivity = how aggressively correlations affect weights
//   correlation = Pearson r between this dimension and performance_score
// ============================================================

import type { LearningWeight, WeightAdjustmentHistoryEntry } from '@cg160/types';
import type { NumericalCorrelation } from './correlation-engine';

const EMA_ALPHA = parseFloat(process.env.LEARNING_EMA_ALPHA ?? '0.15');
const WEIGHT_MIN = parseFloat(process.env.LEARNING_WEIGHT_MIN ?? '0.3');
const WEIGHT_MAX = parseFloat(process.env.LEARNING_WEIGHT_MAX ?? '3.0');
const SENSITIVITY = 2.0; // how much a correlation of 1.0 shifts the weight target
const MIN_CONFIDENCE = 0.3; // minimum confidence to apply adjustment

export interface WeightUpdate {
  feature_name: string;
  old_weight: number;
  new_weight: number;
  correlation: number;
  sample_size: number;
  confidence: number;
  reason: string;
  skipped: boolean;
  skip_reason?: string;
}

/**
 * Compute the new weight for a dimension based on its correlation.
 * Returns the EMA-smoothed, clamped result.
 */
export function computeNewWeight(
  current_weight: number,
  correlation: number,
  confidence: number,
  alpha: number = EMA_ALPHA
): number {
  // Scale correlation influence by confidence
  const effective_correlation = correlation * confidence;
  // Target weight: 1 + (correlation * sensitivity)
  const target = 1.0 + effective_correlation * SENSITIVITY;
  // EMA smoothing
  const raw_new = alpha * target + (1 - alpha) * current_weight;
  // Clamp
  return Math.round(Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, raw_new)) * 1000) / 1000;
}

/**
 * Compute weight updates for all scoring dimensions.
 * Only dimensions with sufficient confidence are updated.
 * Locked dimensions are skipped.
 */
export function computeWeightUpdates(
  current_weights: LearningWeight[],
  correlations: NumericalCorrelation[],
  primary_metric: string = 'performance_score'
): WeightUpdate[] {
  // Build a map from feature_name to correlation (using primary metric only)
  const corrMap = new Map<string, NumericalCorrelation>();
  for (const c of correlations) {
    if (c.metric === primary_metric) {
      corrMap.set(c.feature, c);
    }
  }

  return current_weights
    .filter(w => w.category === 'script_scoring')
    .map(weight => {
      // Skip locked dimensions
      if (weight.locked) {
        return {
          feature_name: weight.feature_name,
          old_weight: weight.current_weight,
          new_weight: weight.current_weight,
          correlation: 0,
          sample_size: 0,
          confidence: 0,
          reason: 'Dimension is locked',
          skipped: true,
          skip_reason: weight.lock_reason ?? 'Locked by operator',
        };
      }

      const corr = corrMap.get(weight.feature_name);

      // Skip if no correlation data
      if (!corr) {
        return {
          feature_name: weight.feature_name,
          old_weight: weight.current_weight,
          new_weight: weight.current_weight,
          correlation: 0,
          sample_size: 0,
          confidence: 0,
          reason: 'No correlation data available',
          skipped: true,
          skip_reason: 'No data',
        };
      }

      // Skip if confidence too low
      if (corr.confidence < MIN_CONFIDENCE) {
        return {
          feature_name: weight.feature_name,
          old_weight: weight.current_weight,
          new_weight: weight.current_weight,
          correlation: corr.pearson_r,
          sample_size: corr.sample_size,
          confidence: corr.confidence,
          reason: `Confidence too low (${(corr.confidence * 100).toFixed(0)}% < ${MIN_CONFIDENCE * 100}%)`,
          skipped: true,
          skip_reason: 'Low confidence',
        };
      }

      const new_weight = computeNewWeight(
        weight.current_weight,
        corr.pearson_r,
        corr.confidence
      );

      const delta = new_weight - weight.current_weight;
      const direction = delta > 0 ? 'increased' : delta < 0 ? 'decreased' : 'unchanged';

      return {
        feature_name: weight.feature_name,
        old_weight: weight.current_weight,
        new_weight,
        correlation: corr.pearson_r,
        sample_size: corr.sample_size,
        confidence: corr.confidence,
        reason: `${direction} (r=${corr.pearson_r.toFixed(3)}, n=${corr.sample_size}, conf=${(corr.confidence * 100).toFixed(0)}%)`,
        skipped: false,
      };
    });
}

/**
 * Build a history entry for a weight adjustment.
 */
export function buildHistoryEntry(update: WeightUpdate): WeightAdjustmentHistoryEntry {
  return {
    adjusted_at: new Date().toISOString(),
    old_weight: update.old_weight,
    new_weight: update.new_weight,
    reason: update.reason,
    sample_size: update.sample_size,
    correlation: update.correlation,
  };
}

/**
 * Summarize weight updates for logging/dashboard display.
 */
export function summarizeWeightUpdates(updates: WeightUpdate[]): string {
  const applied = updates.filter(u => !u.skipped);
  const skipped = updates.filter(u => u.skipped);
  const increased = applied.filter(u => u.new_weight > u.old_weight);
  const decreased = applied.filter(u => u.new_weight < u.old_weight);

  const lines = [
    `Weight adjustment summary:`,
    `  Applied: ${applied.length} | Skipped: ${skipped.length}`,
    `  Increased: ${increased.length} | Decreased: ${decreased.length}`,
    '',
    'Top changes:',
    ...applied
      .sort((a, b) => Math.abs(b.new_weight - b.old_weight) - Math.abs(a.new_weight - a.old_weight))
      .slice(0, 5)
      .map(u => `  ${u.feature_name}: ${u.old_weight.toFixed(3)} → ${u.new_weight.toFixed(3)} (${u.reason})`),
  ];

  return lines.join('\n');
}
