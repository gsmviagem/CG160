// ============================================================
// CG 160 — Inngest Worker: Generate Ideas
// ============================================================

import { inngest } from '@/lib/inngest';
import { getDB } from '@/lib/supabase';
import { generateIdeas, filterRepetitiveIdeas, scoreIdea } from '@cg160/ai';
import type { Idea } from '@cg160/types';

export const fnGenerateIdeas = inngest.createFunction(
  { id: 'generate-ideas', name: 'Generate Content Ideas', concurrency: 1 },
  { event: 'cg160/ideas.generate' },
  async ({ event, step }) => {
    const db = getDB();
    const count = event.data.count ?? 10;

    // Gather context
    const [characters, patterns, recentIdeas] = await step.run('gather-context', async () => {
      return Promise.all([
        db.getActiveCharacters(),
        db.getActivePatterns(),
        db.getRecentIdeas(50),
      ]);
    });

    // Generate raw ideas from Claude
    const rawIdeas = await step.run('generate-from-claude', async () => {
      return generateIdeas({
        characters,
        patterns,
        recent_ideas: recentIdeas,
        trends: [], // TODO: integrate trend fetching
        count,
      });
    });

    // Filter repetitive ideas
    const { kept, removed } = await step.run('filter-repetitive', async () => {
      return filterRepetitiveIdeas(rawIdeas, recentIdeas);
    });

    // Score and save each idea
    const saved = await step.run('score-and-save', async () => {
      const results: Idea[] = [];

      for (const raw of kept) {
        const scores = await scoreIdea(raw, patterns, recentIdeas);
        const character = raw.character_name
          ? characters.find(c => c.name === raw.character_name) ?? null
          : null;

        const idea = await db.createIdea({
          title: raw.title,
          concept: raw.concept,
          character_id: character?.id ?? null,
          trend_id: null,
          hook_summary: raw.hook_summary,
          narrative_type: raw.narrative_type,
          target_emotion: raw.target_emotion,
          format_type: raw.format_type,
          source_patterns: patterns
            .filter(p => raw.suggested_patterns.includes(p.slug))
            .map(p => p.id),
          predicted_retention_score: scores.predicted_retention_score,
          novelty_score: scores.novelty_score,
          diversity_score: scores.diversity_score,
          total_score: scores.total_score,
          score_breakdown: {
            predicted_retention: { score: scores.predicted_retention_score, rationale: raw.predicted_retention_rationale },
            novelty: { score: scores.novelty_score, rationale: raw.novelty_rationale },
          },
          status: 'pending',
          rejection_reason: null,
          rejected_at: null,
          generation_model: 'claude-sonnet-4-6',
          generation_prompt: null,
          metadata: { suggested_patterns: raw.suggested_patterns },
        });

        results.push(idea);
      }

      return results;
    });

    return {
      generated: rawIdeas.length,
      filtered_out: removed.length,
      saved: saved.length,
    };
  }
);
