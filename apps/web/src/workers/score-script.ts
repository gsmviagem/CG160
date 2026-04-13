// ============================================================
// CG 160 — Inngest Worker: Score Script
// ============================================================

import { inngest } from '@/lib/inngest';
import { getDB } from '@/lib/supabase';
import { buildScoringPrompt, parseScoringResponse, buildScriptScore } from '@cg160/scoring';
import { callGroqAnalytical as callClaudeAnalytical } from '@cg160/ai';

const SCORE_THRESHOLD = parseFloat(process.env.SCRIPT_MIN_SCORE_THRESHOLD ?? '65');

export const fnScoreScript = inngest.createFunction(
  { id: 'score-script', name: 'Score Script on 14 Dimensions', concurrency: 5 },
  { event: 'cg160/scripts.score' },
  async ({ event, step }) => {
    const db = getDB();
    const { script_id } = event.data;

    const { script, weights } = await step.run('load-script', async () => {
      const script = await db.getScriptById(script_id);
      if (!script) throw new Error(`Script ${script_id} not found`);

      const weightRows = await db.getLearningWeights('script_scoring');
      const weights = Object.fromEntries(weightRows.map(w => [w.feature_name, w.current_weight]));

      return { script, weights };
    });

    const scoreResult = await step.run('evaluate-with-claude', async () => {
      const prompt = buildScoringPrompt({
        content: script.content,
        hook: script.hook,
        scenes: script.scenes,
        duration_estimate_seconds: script.duration_estimate_seconds,
      });

      const response = await callClaudeAnalytical(prompt, {
        model: 'gemini-2.0-flash',
        maxOutputTokens: 3000,
      });

      const rawScores = parseScoringResponse(response);

      return buildScriptScore(rawScores, weights, {
        weights,
        threshold: SCORE_THRESHOLD,
        weights_version: new Date().toISOString().split('T')[0],
      });
    });

    await step.run('save-scores', async () => {
      const breakdown = scoreResult.dimensions;

      await db.updateScriptStatus(script_id, 'pending', {
        hook_strength: breakdown.hook_strength?.score ?? null,
        clarity_score: breakdown.clarity_score?.score ?? null,
        emotional_trigger_score: breakdown.emotional_trigger_score?.score ?? null,
        curiosity_gap_score: breakdown.curiosity_gap_score?.score ?? null,
        pacing_density_score: breakdown.pacing_density_score?.score ?? null,
        setup_simplicity_score: breakdown.setup_simplicity_score?.score ?? null,
        punchline_strength: breakdown.punchline_strength?.score ?? null,
        loop_potential: breakdown.loop_potential?.score ?? null,
        shareability_score: breakdown.shareability_score?.score ?? null,
        memorability_score: breakdown.memorability_score?.score ?? null,
        novelty_score: breakdown.novelty_score?.score ?? null,
        absurdity_balance: breakdown.absurdity_balance?.score ?? null,
        visual_feasibility: breakdown.visual_feasibility?.score ?? null,
        viral_structure_alignment: breakdown.viral_structure_alignment?.score ?? null,
        total_score: scoreResult.total_score,
        score_breakdown: scoreResult.dimensions,
      } as never);
    });

    return {
      script_id,
      total_score: scoreResult.total_score,
      passes_threshold: scoreResult.passes_threshold,
    };
  }
);
