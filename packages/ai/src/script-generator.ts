// ============================================================
// CG 160 — Script Generator
//
// Generates full scripts from approved ideas.
// Uses character profiles, pattern library, and learning weights
// to produce scripts optimized for high retention.
// ============================================================

import type { Idea, Character, PatternLibraryEntry, ScriptScene } from '@cg160/types';
import { callClaude } from './providers/anthropic';
import type { ScoringWeights } from '@cg160/scoring';

export interface ScriptGenerationContext {
  idea: Idea;
  character: Character | null;
  patterns: PatternLibraryEntry[];
  scoring_weights: ScoringWeights;
  target_duration_seconds?: number;
  style_overrides?: {
    voice_style?: string;
    pacing_style?: string;
    humor_type?: string;
  };
  performance_context?: string;
}

export interface GeneratedScriptRaw {
  title: string;
  hook: string;
  content: string;
  scenes: ScriptScene[];
  duration_estimate_seconds: number;
  voice_style: string;
  pacing_style: string;
  humor_type: string;
  emotional_tone: string;
  caption_style: string;
  video_prompt: string; // AI video generation prompt
}

function buildScriptGenerationPrompt(ctx: ScriptGenerationContext): string {
  const { idea, character, patterns, scoring_weights, target_duration_seconds } = ctx;

  const characterSection = character
    ? `## Character
Name: ${character.name}
Description: ${character.description}
Visual style: ${character.visual_style}
Personality traits: ${character.personality.join(', ')}
Voice style: ${character.voice_style ?? 'natural'}
Universe: ${character.universe ?? 'unspecified'}`
    : '## Character\nCreate an appropriate original character for this concept.';

  // Sort dimensions by weight descending to focus on what matters most
  const prioritizedDimensions = Object.entries(scoring_weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([key, weight]) => `- ${key.replace(/_/g, ' ')}: (weight ${weight.toFixed(2)})`)
    .join('\n');

  const relevantPatterns = patterns
    .filter(p => idea.source_patterns.includes(p.id))
    .map(p => `- [${p.pattern_type}] ${p.name}: ${p.description}`)
    .join('\n') || '- Use highest-weight patterns from library';

  const performanceContext = ctx.performance_context
    ? `\n## What has been performing best\n${ctx.performance_context}\n`
    : '';

  const targetDuration = target_duration_seconds ?? 30;

  return `You are the head writer at CG 160, an AI-native viral content studio. Write a high-retention short-form video script.

## Approved Idea
Title: ${idea.title}
Concept: ${idea.concept}
Hook: ${idea.hook_summary}
Narrative type: ${idea.narrative_type}
Target emotion: ${idea.target_emotion}
Format: ${idea.format_type}

${characterSection}

## Patterns to apply
${relevantPatterns}
${performanceContext}
## Scoring priorities (write to maximize these)
The highest-weighted dimensions for this generation run:
${prioritizedDimensions}

## Script requirements
1. Hook MUST stop the scroll in the first 1–3 seconds — no preamble
2. Target duration: ~${targetDuration} seconds
3. Every second must earn its place
4. Visual direction must be achievable with AI video generation
5. No complex interactions between characters (AI limitations)
6. Dialogue should feel natural when spoken, not read
7. End with something that makes people either share it or watch again

## Output format

Return ONLY valid JSON in this exact format:
{
  "title": "Punchy, specific title",
  "hook": "The exact first 1-3 seconds — this must be the most arresting possible opening",
  "content": "Full script text including all dialogue and action notes",
  "scenes": [
    {
      "scene_number": 1,
      "description": "What is happening in this scene",
      "dialogue": "Exact words spoken (empty string if none)",
      "visual_direction": "What the AI video generator needs to produce — specific, achievable",
      "duration_estimate_seconds": 5,
      "sound_notes": "Any audio direction beyond dialogue"
    }
  ],
  "duration_estimate_seconds": 30,
  "voice_style": "one of: energetic | calm | comedic | dramatic | deadpan | warm",
  "pacing_style": "one of: fast | medium | slow | variable | rapid-fire",
  "humor_type": "one of: absurd | dry | slapstick | observational | surreal | dark | none",
  "emotional_tone": "one of: funny | heartwarming | tense | surprising | satisfying | melancholic",
  "caption_style": "one of: minimal | expressive | none | subtitle | kinetic",
  "video_prompt": "A concise, highly specific AI video generation prompt. Describe visual style, character appearance, environment, lighting, mood — in 2-3 sentences. Avoid vague adjectives."
}`;
}

/**
 * Generate a script from an approved idea.
 */
export async function generateScript(
  ctx: ScriptGenerationContext
): Promise<GeneratedScriptRaw> {
  const prompt = buildScriptGenerationPrompt(ctx);

  const response = await callClaude(prompt, {
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    temperature: 0.85,
  });

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in script generation response');
  }

  const script = JSON.parse(jsonMatch[0]) as GeneratedScriptRaw;

  // Validate required fields
  if (!script.hook || !script.content || !Array.isArray(script.scenes)) {
    throw new Error('Script generation response missing required fields');
  }

  return script;
}

/**
 * Generate an alternative version of an existing script.
 * Used when a script is rejected with notes.
 */
export async function regenerateScript(
  ctx: ScriptGenerationContext & {
    previous_script: string;
    rejection_reason: string;
  }
): Promise<GeneratedScriptRaw> {
  const basePrompt = buildScriptGenerationPrompt(ctx);
  const regenerationSuffix = `

## IMPORTANT — This is a regeneration
The previous version was rejected for this reason:
"${ctx.rejection_reason}"

Previous script for reference (do NOT simply repeat it — genuinely improve it):
${ctx.previous_script}

Address the rejection reason directly. Be meaningfully different and better.`;

  const response = await callClaude(basePrompt + regenerationSuffix, {
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    temperature: 0.95,
  });

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in script regeneration response');
  }

  return JSON.parse(jsonMatch[0]) as GeneratedScriptRaw;
}

/**
 * Generate a video caption and hashtag set for a script.
 */
export async function generateCaption(
  script: { title: string; hook: string; emotional_tone: string },
  platform: 'tiktok' | 'instagram',
  character_name: string | null
): Promise<{ caption: string; hashtags: string[] }> {
  const prompt = `Write a ${platform} caption for this short-form video.

Video title: ${script.title}
Hook: ${script.hook}
Emotional tone: ${script.emotional_tone}
Character: ${character_name ?? 'original character'}
Platform: ${platform}

Rules:
- Caption should be short (under 100 characters for TikTok, under 150 for Instagram)
- Should amplify curiosity or the emotional hook — not describe the video
- Hashtags: 3–5 relevant tags (not spammy)
- Do NOT use generic hashtags like #viral #fyp #trending

Return JSON: { "caption": "...", "hashtags": ["tag1", "tag2", "tag3"] }`;

  const response = await callClaude(prompt, { temperature: 0.7 });
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { caption: script.title, hashtags: [] };

  return JSON.parse(jsonMatch[0]) as { caption: string; hashtags: string[] };
}
