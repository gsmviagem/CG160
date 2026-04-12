// ============================================================
// CG 160 — Script Scoring Engine
//
// Evaluates scripts on 14 dimensions, applying learning weights.
// The scorer uses Claude to evaluate each dimension + produce
// structured rationale, then applies learned weights to compute
// the final composite score.
// ============================================================

import type { Script, ScriptScore, ScriptScoreBreakdown, ScriptScoreDimension } from '@cg160/types';
import { SCORING_DIMENSIONS, DIMENSION_KEYS } from './weights';

export interface ScoringWeights {
  [dimension: string]: number;
}

export interface RawDimensionScores {
  [dimension: string]: {
    score: number;       // 0–10 raw score
    rationale: string;
  };
}

export interface ScriptScorerOptions {
  weights: ScoringWeights;
  threshold: number;      // minimum total_score (0–100) to pass
  weights_version: string;
}

/**
 * Compute weighted composite score from raw dimension scores.
 * Formula: sum(score_i * weight_i) / sum(weight_i) * 10
 * This gives a 0–100 result proportional to weighted average.
 */
export function computeCompositeScore(
  rawScores: RawDimensionScores,
  weights: ScoringWeights
): { total_score: number; breakdown: ScriptScoreBreakdown } {
  let weightedSum = 0;
  let totalWeight = 0;
  const breakdown: ScriptScoreBreakdown = {};

  for (const key of DIMENSION_KEYS) {
    const raw = rawScores[key];
    if (!raw) continue;

    const weight = weights[key] ?? 1.0;
    const weighted_score = raw.score * weight;

    weightedSum += weighted_score;
    totalWeight += weight;

    (breakdown as Record<string, ScriptScoreDimension>)[key] = {
      score: raw.score,
      weight,
      weighted_score,
      rationale: raw.rationale,
    };
  }

  const total_score = totalWeight > 0
    ? Math.round((weightedSum / totalWeight) * 10) / 10
    : 0;

  return { total_score, breakdown };
}

/**
 * Build the scoring prompt for Claude.
 * Returns a structured prompt that asks Claude to score all 14 dimensions
 * with rationale, formatted as JSON.
 */
export function buildScoringPrompt(script: Pick<Script, 'content' | 'hook' | 'scenes' | 'duration_estimate_seconds'>): string {
  const sceneText = script.scenes
    .map(s => `Scene ${s.scene_number}: ${s.description}\nDialogue: ${s.dialogue}\nVisual: ${s.visual_direction}`)
    .join('\n\n');

  const dimensionInstructions = SCORING_DIMENSIONS.map(d =>
    `- "${d.key}": ${d.description}. 0 = ${d.low_anchor}. 10 = ${d.high_anchor}.`
  ).join('\n');

  return `You are a viral content strategist and script analyst. Your task is to score the following short-form video script on 14 dimensions, each from 0 to 10. Be precise, critical, and honest — most scripts should score in the 4–7 range on most dimensions.

## Script to evaluate

**Hook (first 3 seconds):**
${script.hook}

**Full Script:**
${script.content}

**Scenes:**
${sceneText}

**Estimated duration:** ${script.duration_estimate_seconds ?? 'unknown'} seconds

---

## Scoring Dimensions

Score each dimension from 0 to 10 (one decimal allowed):

${dimensionInstructions}

---

## Instructions

Return ONLY valid JSON in this exact format:
{
  "hook_strength": { "score": 7.5, "rationale": "..." },
  "clarity_score": { "score": 8.0, "rationale": "..." },
  "emotional_trigger_score": { "score": 6.5, "rationale": "..." },
  "curiosity_gap_score": { "score": 7.0, "rationale": "..." },
  "pacing_density_score": { "score": 7.5, "rationale": "..." },
  "setup_simplicity_score": { "score": 8.5, "rationale": "..." },
  "punchline_strength": { "score": 7.0, "rationale": "..." },
  "loop_potential": { "score": 6.0, "rationale": "..." },
  "shareability_score": { "score": 7.5, "rationale": "..." },
  "memorability_score": { "score": 7.0, "rationale": "..." },
  "novelty_score": { "score": 6.5, "rationale": "..." },
  "absurdity_balance": { "score": 7.5, "rationale": "..." },
  "visual_feasibility": { "score": 8.0, "rationale": "..." },
  "viral_structure_alignment": { "score": 7.0, "rationale": "..." }
}

Be critical. Most scripts should average 5–7. A 9+ should be rare and justified.`;
}

/**
 * Parse Claude's JSON response into structured dimension scores.
 * Handles minor formatting issues gracefully.
 */
export function parseScoringResponse(response: string): RawDimensionScores {
  // Extract JSON from response (Claude may add preamble/postamble)
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in scoring response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, { score: number; rationale: string }>;

  const result: RawDimensionScores = {};
  for (const key of DIMENSION_KEYS) {
    const entry = parsed[key];
    if (entry && typeof entry.score === 'number') {
      result[key] = {
        score: Math.max(0, Math.min(10, entry.score)),
        rationale: entry.rationale ?? '',
      };
    }
  }

  return result;
}

/**
 * Assemble final ScriptScore from computed data.
 */
export function buildScriptScore(
  rawScores: RawDimensionScores,
  weights: ScoringWeights,
  options: ScriptScorerOptions
): ScriptScore {
  const { total_score, breakdown } = computeCompositeScore(rawScores, weights);

  return {
    total_score,
    dimensions: breakdown,
    passes_threshold: total_score >= options.threshold,
    threshold_used: options.threshold,
    weights_version: options.weights_version,
  };
}

/**
 * Extract dimension scores from a scored Script record
 * (for use in learning loop feature extraction).
 */
export function extractDimensionScores(script: Script): Partial<Record<string, number>> {
  const scores: Partial<Record<string, number>> = {};
  for (const key of DIMENSION_KEYS) {
    const val = (script as unknown as Record<string, unknown>)[key];
    if (typeof val === 'number') {
      scores[key] = val;
    }
  }
  return scores;
}

/**
 * Convert a ScriptScoreBreakdown back to ScoringWeights.
 * Useful for re-applying weight changes without re-scoring.
 */
export function recomputeWithNewWeights(
  breakdown: ScriptScoreBreakdown,
  newWeights: ScoringWeights
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const key of DIMENSION_KEYS) {
    const dim = (breakdown as Record<string, ScriptScoreDimension | undefined>)[key];
    if (!dim) continue;

    const weight = newWeights[key] ?? 1.0;
    weightedSum += dim.score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
}
