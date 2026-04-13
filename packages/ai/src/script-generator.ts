// ============================================================
// CG 160 — Script Generator
//
// Generates highly detailed, production-ready scripts.
// Output includes full scene breakdown, audio direction,
// character direction, and Veo 3-ready prompts.
// ============================================================

import type { Idea, Character, PatternLibraryEntry, ScriptScene } from '@cg160/types';
import { callGroq as callGemini } from './providers/groq';
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
  video_prompt: string;
  // Extended production fields
  character_visual_bible: string;   // full visual description for consistency
  audio_direction: string;          // overall audio/music direction
  production_notes: string;         // notes for the creator
}

function buildScriptGenerationPrompt(ctx: ScriptGenerationContext): string {
  const { idea, character, patterns, scoring_weights, target_duration_seconds } = ctx;

  const characterSection = character
    ? `## Character
Name: ${character.name}
Description: ${character.description}
Visual style: ${character.visual_style}
Personality: ${character.personality.join(', ')}
Voice style: ${character.voice_style ?? 'natural'}
Universe: ${character.universe ?? 'not specified'}`
    : `## Character
No fixed character. Create an original character perfectly suited to this concept.
Define their visual appearance, personality, and voice clearly.`;

  const prioritizedDimensions = Object.entries(scoring_weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([key]) => `- ${key.replace(/_/g, ' ')}`)
    .join('\n');

  const relevantPatterns = patterns
    .filter(p => idea.source_patterns.includes(p.id))
    .map(p => `- [${p.pattern_type}] ${p.name}: ${p.description}`)
    .join('\n') || '- Apply highest-performing patterns';

  const performanceContext = ctx.performance_context
    ? `\n## What has been performing best\n${ctx.performance_context}\n`
    : '';

  const targetDuration = target_duration_seconds ?? 30;

  return `You are the head writer and creative director at CG 160, an AI-native viral content studio.

Your scripts are used to generate videos with **Veo 3** (Google's AI video model).
This means every visual and audio detail must be EXTREMELY specific and production-ready.
The creator will paste your output directly into Veo 3 — there is no room for vagueness.

## Approved Idea
Title: ${idea.title}
Concept: ${idea.concept}
Hook: ${idea.hook_summary}
Narrative type: ${idea.narrative_type}
Target emotion: ${idea.target_emotion}
Format: ${idea.format_type}

${characterSection}

## Content Patterns to Apply
${relevantPatterns}
${performanceContext}
## Scoring Priorities (write to maximize these)
${prioritizedDimensions}

---

## Script Requirements

### Structure
1. Hook MUST be the most arresting possible opening — stops scroll in under 2 seconds
2. Target duration: exactly ~${targetDuration} seconds
3. Every second must earn its place — no padding, no slow beats
4. End with something that makes people share OR watch again immediately
5. Zero exposition — viewer must understand everything from action and context

### Visual Direction (Veo 3 specific)
- Describe EXACTLY what the camera sees in each scene
- Specify camera angle: extreme close-up / close-up / medium / wide / aerial
- Specify camera movement: static / slow push in / pan left / zoom out / handheld / dolly
- Describe lighting: warm golden / dramatic side light / neon glow / soft studio / harsh sun
- Describe environment in full detail: location, time of day, textures, background elements
- Character appearance must be described IDENTICALLY in every scene (visual consistency for Veo 3)

### Audio Direction (Veo 3 native audio)
- Veo 3 generates audio natively — specify it precisely
- Voice tone: deadpan / energetic / whispered / comedic / dramatic / dry
- Background music: genre, tempo, mood, instruments
- Sound effects: list specific sounds for each scene
- Silence can be powerful — note it when intentional

### Dialogue
- Write exactly as spoken — punctuation reflects delivery
- Include pauses with "..."
- Include emphasis with CAPS
- Keep it punchy — fewer words = more impact

---

## Output Format

Return ONLY valid JSON:
{
  "title": "Punchy, specific title (max 8 words)",
  "hook": "The EXACT first 1-3 seconds. Most arresting possible opening line or action.",
  "content": "Complete script. Full dialogue + action notes. Written as a readable script.",
  "scenes": [
    {
      "scene_number": 1,
      "description": "What is happening — action and context",
      "dialogue": "Exact words spoken. Empty string if silent.",
      "visual_direction": "DETAILED: camera angle, movement, character appearance, environment, lighting. Specific enough for Veo 3.",
      "duration_estimate_seconds": 5,
      "sound_notes": "Voice tone + background music + specific sound effects"
    }
  ],
  "duration_estimate_seconds": ${targetDuration},
  "voice_style": "energetic | calm | comedic | dramatic | deadpan | warm",
  "pacing_style": "fast | medium | slow | variable | rapid-fire",
  "humor_type": "absurd | dry | slapstick | observational | surreal | dark | none",
  "emotional_tone": "funny | heartwarming | tense | surprising | satisfying | melancholic",
  "caption_style": "minimal | expressive | none | subtitle | kinetic",
  "video_prompt": "Master Veo 3 prompt. Describe: visual style, character (full appearance), setting, story arc, audio direction. 4-6 sentences. Specific and vivid. Ready to paste.",
  "character_visual_bible": "Complete visual description of the character for cross-scene consistency. Include: physical appearance, exact clothing, color palette, distinguishing features. Detailed enough to generate the same character in every scene.",
  "audio_direction": "Overall audio concept for the full video. Music style, tempo, mood arc, key sound design moments.",
  "production_notes": "3-5 practical notes for the creator. What to watch for, tips for best Veo 3 output, common pitfalls to avoid with this specific script."
}`;
}

export async function generateScript(
  ctx: ScriptGenerationContext
): Promise<GeneratedScriptRaw> {
  const prompt = buildScriptGenerationPrompt(ctx);

  const response = await callGemini(prompt, {
    model: 'gemini-2.0-flash',
    maxOutputTokens: 8192,
    temperature: 0.85,
  });

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in script generation response');

  const script = JSON.parse(jsonMatch[0]) as GeneratedScriptRaw;

  if (!script.hook || !script.content || !Array.isArray(script.scenes)) {
    throw new Error('Script generation response missing required fields');
  }

  return script;
}

export async function regenerateScript(
  ctx: ScriptGenerationContext & {
    previous_script: string;
    rejection_reason: string;
  }
): Promise<GeneratedScriptRaw> {
  const basePrompt = buildScriptGenerationPrompt(ctx);
  const regenerationSuffix = `

## IMPORTANT — This is a regeneration
The previous version was rejected:
"${ctx.rejection_reason}"

Previous script (do NOT repeat — genuinely improve it):
${ctx.previous_script}

Address the rejection reason directly. Be meaningfully different and better.`;

  const response = await callGemini(basePrompt + regenerationSuffix, {
    model: 'gemini-2.0-flash',
    maxOutputTokens: 8192,
    temperature: 0.95,
  });

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in script regeneration response');

  return JSON.parse(jsonMatch[0]) as GeneratedScriptRaw;
}

export async function generateCaption(
  script: { title: string; hook: string; emotional_tone: string },
  platform: 'tiktok' | 'instagram',
  character_name: string | null
): Promise<{ caption: string; hashtags: string[] }> {
  const prompt = `Write a ${platform} caption for this short-form video.

Video: ${script.title}
Hook: ${script.hook}
Tone: ${script.emotional_tone}
Character: ${character_name ?? 'original character'}

Rules:
- Under 100 characters
- Amplify curiosity or emotion — don't describe the video
- 3-5 hashtags, no generic spam tags

Return JSON: { "caption": "...", "hashtags": ["tag1", "tag2", "tag3"] }`;

  const response = await callGemini(prompt, { temperature: 0.7 });
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { caption: script.title, hashtags: [] };

  return JSON.parse(jsonMatch[0]) as { caption: string; hashtags: string[] };
}
