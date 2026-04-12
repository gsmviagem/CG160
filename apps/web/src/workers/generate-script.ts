// ============================================================
// CG 160 — Inngest Worker: Generate Script
// ============================================================

import { inngest } from '@/lib/inngest';
import { getDB } from '@/lib/supabase';
import { generateScript } from '@cg160/ai';

export const fnGenerateScript = inngest.createFunction(
  { id: 'generate-script', name: 'Generate Script from Idea', concurrency: 3 },
  { event: 'cg160/scripts.generate' },
  async ({ event, step }) => {
    const db = getDB();
    const { idea_id } = event.data;

    // Load idea + context
    const { idea, character, patterns, weights } = await step.run('load-context', async () => {
      const ideas = await db.getIdeasByStatus('approved', 1);
      const idea = ideas.find(i => i.id === idea_id) ?? await db.getIdeasByStatus('pending', 1).then(r => r[0]);

      if (!idea) throw new Error(`Idea ${idea_id} not found`);

      const [character, patterns, weightRows] = await Promise.all([
        idea.character_id ? db.getCharacterById(idea.character_id) : Promise.resolve(null),
        db.getActivePatterns(),
        db.getLearningWeights('script_scoring'),
      ]);

      const weights = Object.fromEntries(weightRows.map(w => [w.feature_name, w.current_weight]));

      return { idea, character, patterns, weights };
    });

    // Generate script from Claude
    const rawScript = await step.run('generate-from-claude', async () => {
      return generateScript({
        idea,
        character,
        patterns,
        scoring_weights: weights,
        target_duration_seconds: 30,
      });
    });

    // Save script — trigger scoring next
    const script = await step.run('save-script', async () => {
      const saved = await db.createScript({
        idea_id,
        title: rawScript.title,
        content: rawScript.content,
        hook: rawScript.hook,
        scenes: rawScript.scenes,
        duration_estimate_seconds: rawScript.duration_estimate_seconds,
        voice_style: rawScript.voice_style as never,
        pacing_style: rawScript.pacing_style as never,
        humor_type: rawScript.humor_type as never,
        emotional_tone: rawScript.emotional_tone as never,
        caption_style: rawScript.caption_style as never,
        // Scores will be filled by score-script worker
        hook_strength: null,
        clarity_score: null,
        emotional_trigger_score: null,
        curiosity_gap_score: null,
        pacing_density_score: null,
        setup_simplicity_score: null,
        punchline_strength: null,
        loop_potential: null,
        shareability_score: null,
        memorability_score: null,
        novelty_score: null,
        absurdity_balance: null,
        visual_feasibility: null,
        viral_structure_alignment: null,
        total_score: null,
        score_breakdown: {},
        version: 1,
        parent_script_id: null,
        status: 'pending',
        rejection_reason: null,
        rejected_at: null,
        approved_at: null,
        generation_model: 'claude-sonnet-4-6',
        metadata: { video_prompt: rawScript.video_prompt },
      });

      // Update idea status
      await db.updateIdeaStatus(idea_id, 'scripted');

      return saved;
    });

    // Trigger scoring
    await step.sendEvent('trigger-scoring', {
      name: 'cg160/scripts.score',
      data: { script_id: script.id },
    });

    return { script_id: script.id };
  }
);
