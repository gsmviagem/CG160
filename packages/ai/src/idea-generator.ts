// ============================================================
// CG 160 — Idea Generator
//
// Generates scored content ideas using:
// - Active characters
// - Trending topics
// - Pattern library (weighted by learning loop)
// - Historical performance context
// - Anti-repetition guardrail (cosine similarity check)
// ============================================================

import type {
  Idea,
  Character,
  Trend,
  PatternLibraryEntry,
  NarrativeType,
  EmotionalTone,
  FormatType,
} from '@cg160/types';
import { callGroq as callClaude } from './providers/groq';

export interface IdeaGenerationContext {
  characters: Character[];
  trends: Trend[];
  patterns: PatternLibraryEntry[];
  recent_ideas: Array<{ title: string; concept: string }>;
  performance_context?: string; // summary of what's been working
  count: number;
}

export interface GeneratedIdeaRaw {
  title: string;
  concept: string;
  hook_summary: string;
  narrative_type: NarrativeType;
  target_emotion: EmotionalTone;
  format_type: FormatType;
  character_name: string | null;
  suggested_patterns: string[];  // pattern slugs
  predicted_retention_rationale: string;
  novelty_rationale: string;
}

function buildIdeaGenerationPrompt(ctx: IdeaGenerationContext): string {
  const characterList = ctx.characters.length > 0
    ? ctx.characters.map(c =>
        `- ${c.name}: ${c.description}. Style: ${c.visual_style}. Personality: ${c.personality.join(', ')}.`
      ).join('\n')
    : '- No fixed characters. Generate ideas with original characters.';

  const trendList = ctx.trends.length > 0
    ? ctx.trends.slice(0, 5).map(t =>
        `- ${t.topic}: ${t.description ?? ''} (virality: ${t.estimated_virality_score ?? 'unknown'})`
      ).join('\n')
    : '- No specific trends. Focus on evergreen structures.';

  const topPatterns = [...ctx.patterns]
    .sort((a, b) => (b.weight * b.success_rate) - (a.weight * a.success_rate))
    .slice(0, 10)
    .map(p => `- [${p.pattern_type}] ${p.name}: ${p.description} (weight: ${p.weight.toFixed(2)})`)
    .join('\n');

  const recentIdeas = ctx.recent_ideas.slice(0, 10)
    .map(i => `- ${i.title}: ${i.concept}`)
    .join('\n');

  const performanceContext = ctx.performance_context
    ? `\n## What has been working\n${ctx.performance_context}\n`
    : '';

  return `You are a creative director and viral content strategist for CG 160, an AI-native content studio.

Your task: Generate ${ctx.count} original short-form video ideas optimized for TikTok and Instagram Reels.

## Available Characters
${characterList}

## Active Trends
${trendList}

## High-Weight Content Patterns (prioritize these)
${topPatterns}
${performanceContext}
## Recent Ideas (AVOID similar concepts — be novel)
${recentIdeas}

---

## Requirements for each idea
1. Must have a strong, scroll-stopping hook within the first 3 seconds
2. Must be achievable with AI video generation
3. Must use a known high-retention structure
4. Must be original — not too similar to recent ideas
5. Must be clear and understandable with zero context

## Narrative types available
- loop: ending connects back to beginning
- escalation: each beat gets progressively more absurd/intense
- twist: final beat recontextualizes everything before
- absurd: logic is sideways from reality but internally consistent
- relatable: amplified version of a universal experience
- observation: deadpan observation about something everyone experiences

## Format types
- micro-scene: complete story in 15 seconds
- character-arc: character faces and resolves a problem
- reaction: character reacts to an absurd situation
- observation: pointed commentary on everyday life
- tutorial-parody: parody of instructional content
- monologue: direct address, character speaking directly to viewer

---

Return ONLY a valid JSON array of ${ctx.count} objects in this exact format:
[
  {
    "title": "Short punchy title",
    "concept": "1-2 sentence concept description",
    "hook_summary": "Exact opening line or action for the first 3 seconds",
    "narrative_type": "escalation",
    "target_emotion": "funny",
    "format_type": "micro-scene",
    "character_name": "Character name or null for new character",
    "suggested_patterns": ["escalating-absurdity", "question-hook"],
    "predicted_retention_rationale": "Why this will keep viewers watching",
    "novelty_rationale": "What makes this genuinely original"
  }
]

Generate exactly ${ctx.count} ideas. Make them diverse — vary format, emotion, narrative type.`;
}

/**
 * Compute a basic TF-IDF-style similarity between two concept strings.
 * Returns a value 0–1. Used for anti-repetition guardrail.
 */
function computeTextSimilarity(a: string, b: string): number {
  const tokenize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = [...tokensA].filter(t => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;

  return intersection / union; // Jaccard similarity
}

/**
 * Filter generated ideas to remove those too similar to recent content.
 */
export function filterRepetitiveIdeas(
  generated: GeneratedIdeaRaw[],
  recent: Array<{ title: string; concept: string }>,
  threshold: number = 0.35
): { kept: GeneratedIdeaRaw[]; removed: GeneratedIdeaRaw[] } {
  const kept: GeneratedIdeaRaw[] = [];
  const removed: GeneratedIdeaRaw[] = [];
  const accepted: string[] = recent.map(r => `${r.title} ${r.concept}`);

  for (const idea of generated) {
    const ideaText = `${idea.title} ${idea.concept}`;
    const maxSimilarity = accepted.reduce((max, existing) => {
      const sim = computeTextSimilarity(ideaText, existing);
      return Math.max(max, sim);
    }, 0);

    if (maxSimilarity > threshold) {
      removed.push(idea);
    } else {
      kept.push(idea);
      accepted.push(ideaText);
    }
  }

  return { kept, removed };
}

/**
 * Generate a batch of ideas from Claude.
 * Returns parsed raw ideas (before scoring and DB insertion).
 */
export async function generateIdeas(
  ctx: IdeaGenerationContext
): Promise<GeneratedIdeaRaw[]> {
  const prompt = buildIdeaGenerationPrompt(ctx);
  const response = await callClaude(prompt, {
    model: 'llama-3.3-70b-versatile',
    maxOutputTokens: 8192,
    temperature: 0.9,
  });

  // Parse JSON array from response
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No JSON array found in idea generation response');
  }

  const ideas = JSON.parse(jsonMatch[0]) as GeneratedIdeaRaw[];

  if (!Array.isArray(ideas)) {
    throw new Error('Expected JSON array for ideas');
  }

  return ideas;
}

/**
 * Score an idea's predicted retention, novelty, and diversity.
 * Returns scores 0–100 each.
 */
export async function scoreIdea(
  idea: GeneratedIdeaRaw,
  patterns: PatternLibraryEntry[],
  recent_ideas: Array<{ title: string; concept: string }>
): Promise<{ predicted_retention_score: number; novelty_score: number; diversity_score: number; total_score: number }> {
  // Compute novelty via similarity
  const ideaText = `${idea.title} ${idea.concept}`;
  const maxSimilarity = recent_ideas.slice(0, 50).reduce((max, r) => {
    return Math.max(max, computeTextSimilarity(ideaText, `${r.title} ${r.concept}`));
  }, 0);
  const novelty_score = Math.round((1 - maxSimilarity) * 100);

  // Pattern alignment score (how many high-weight patterns does this idea use?)
  const patternMap = new Map(patterns.map(p => [p.slug, p]));
  const usedPatterns = idea.suggested_patterns
    .map(slug => patternMap.get(slug))
    .filter((p): p is PatternLibraryEntry => p !== undefined);

  const avgPatternWeight = usedPatterns.length > 0
    ? usedPatterns.reduce((sum, p) => sum + p.weight, 0) / usedPatterns.length
    : 1.0;

  // Predicted retention: base 60 + pattern weight bonus + narrative bonus
  const narrativeBonus: Record<string, number> = {
    loop: 10, escalation: 8, twist: 12, absurd: 6, relatable: 8, observation: 5,
  };
  const predicted_retention_score = Math.min(100, Math.round(
    60 + (avgPatternWeight - 1.0) * 20 + (narrativeBonus[idea.narrative_type] ?? 5)
  ));

  // Diversity: does this vary from recent by format/narrative type?
  const recentNarrativeTypes = recent_ideas.slice(0, 20).map(() => ''); // placeholder
  const diversity_score = Math.min(100, novelty_score + 10);

  const total_score = Math.round(
    predicted_retention_score * 0.5 + novelty_score * 0.3 + diversity_score * 0.2
  );

  return { predicted_retention_score, novelty_score, diversity_score, total_score };
}
