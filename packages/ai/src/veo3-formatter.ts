// ============================================================
// CG 160 — Veo 3 Production Package Formatter
//
// Takes a generated script and produces a complete production
// package ready to paste directly into Veo 3.
// ============================================================

import { callGroq as callGemini } from './providers/groq';

export interface Veo3Scene {
  scene_number: number;
  duration_seconds: number;
  // Visual
  visual_description: string;       // what the camera sees
  camera_angle: string;             // close-up, wide, over-the-shoulder, etc
  camera_movement: string;          // static, pan left, zoom in, dolly forward, etc
  lighting: string;                 // soft natural, dramatic side light, neon, etc
  environment: string;              // detailed setting description
  // Character
  character_description: string;    // full visual description for consistency
  character_action: string;         // exactly what the character does physically
  character_expression: string;     // facial expression and body language
  // Audio
  dialogue: string;                 // exact words spoken
  voice_tone: string;               // delivery style: deadpan, energetic, whispered, etc
  background_music: string;         // style and mood of music
  sound_effects: string[];          // specific SFX to include
  // Veo 3 prompt
  veo3_prompt: string;              // complete prompt ready to paste into Veo 3
}

export interface Veo3ProductionPackage {
  title: string;
  concept_summary: string;
  total_duration_seconds: number;
  platform: string;
  aspect_ratio: string;
  // Character bible (for visual consistency)
  character_bible: {
    name: string;
    visual_identity: string;        // detailed physical description
    clothing: string;
    color_palette: string[];
    distinguishing_features: string[];
  };
  // Full scene breakdown
  scenes: Veo3Scene[];
  // Master prompt (for single-shot generation)
  master_veo3_prompt: string;
  // Caption ready to post
  caption: string;
  hashtags: string[];
  // Hook for thumbnail
  thumbnail_concept: string;
}

export async function generateVeo3Package(
  script: {
    title: string;
    hook: string;
    content: string;
    scenes: Array<{
      scene_number: number;
      description: string;
      dialogue: string;
      visual_direction: string;
      duration_estimate_seconds: number;
    }>;
    duration_estimate_seconds: number | null;
    voice_style: string | null;
    pacing_style: string | null;
    humor_type: string | null;
    emotional_tone: string | null;
  },
  character: {
    name: string;
    description: string;
    visual_style: string;
    personality: string[];
  } | null,
  platform: 'tiktok' | 'instagram'
): Promise<Veo3ProductionPackage> {

  const characterContext = character
    ? `Character: ${character.name} — ${character.description}. Visual style: ${character.visual_style}. Personality: ${character.personality.join(', ')}.`
    : 'Create an original character consistent across all scenes.';

  const prompt = `You are a world-class creative director and Veo 3 expert.
Your job is to transform a script into a complete, production-ready Veo 3 package.

Veo 3 is Google's AI video model. It generates video with native audio, realistic physics,
consistent characters, and responds best to highly specific, vivid visual prompts.

## Script to adapt

Title: ${script.title}
Hook: ${script.hook}
Full script: ${script.content}
Duration: ~${script.duration_estimate_seconds ?? 30} seconds
Voice style: ${script.voice_style ?? 'natural'}
Pacing: ${script.pacing_style ?? 'medium'}
Humor: ${script.humor_type ?? 'none'}
Tone: ${script.emotional_tone ?? 'neutral'}
Platform: ${platform} (vertical 9:16)

${characterContext}

## Scenes
${script.scenes.map(s => `Scene ${s.scene_number} (~${s.duration_estimate_seconds}s):
  Action: ${s.description}
  Dialogue: "${s.dialogue}"
  Visual direction: ${s.visual_direction}`).join('\n\n')}

---

## Your task

Produce a COMPLETE Veo 3 production package. Be extremely specific and vivid.

For each scene:
- Describe EXACTLY what the camera sees (not abstract, fully concrete)
- Specify camera angle and movement precisely
- Describe character appearance in full detail (same across all scenes for consistency)
- Write the exact dialogue with delivery notes
- Specify audio: voice tone, background music style, sound effects
- Write a complete Veo 3 prompt for that scene (ready to paste)

For the master prompt:
- Write a single cohesive Veo 3 prompt that captures the entire video concept
- Include character consistency instructions
- Include audio direction
- Optimized for Veo 3's understanding

Return ONLY valid JSON in this exact format:
{
  "title": "...",
  "concept_summary": "One sentence that captures exactly what this video is",
  "total_duration_seconds": 30,
  "platform": "tiktok",
  "aspect_ratio": "9:16",
  "character_bible": {
    "name": "...",
    "visual_identity": "Complete physical description: height, build, skin tone, hair, face — enough to generate consistently",
    "clothing": "Exact outfit description with colors",
    "color_palette": ["#hex1", "#hex2", "#hex3"],
    "distinguishing_features": ["feature1", "feature2"]
  },
  "scenes": [
    {
      "scene_number": 1,
      "duration_seconds": 5,
      "visual_description": "Extremely detailed description of exactly what the viewer sees",
      "camera_angle": "extreme close-up on face",
      "camera_movement": "slow push in",
      "lighting": "warm golden hour light from left, slight rim light",
      "environment": "Detailed setting: location, time of day, atmosphere, background elements",
      "character_description": "Full visual description repeated for consistency",
      "character_action": "Exactly what the character does physically, frame by frame",
      "character_expression": "Precise facial expression and body language",
      "dialogue": "Exact words spoken",
      "voice_tone": "Delivery: deadpan, slow, slight pause after 'banana'",
      "background_music": "Lo-fi hip hop, slow tempo, melancholic piano",
      "sound_effects": ["ambient kitchen sounds", "clock ticking"],
      "veo3_prompt": "Complete ready-to-use Veo 3 prompt for this scene. Include: visual style, character appearance, action, camera, lighting, audio direction. Be specific and vivid. 3-5 sentences."
    }
  ],
  "master_veo3_prompt": "Single complete Veo 3 prompt for the full video. Describe the character, setting, story arc, visual style, and audio. Optimized for Veo 3. 4-6 sentences.",
  "caption": "Ready-to-post caption under 100 chars",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "thumbnail_concept": "Describe the perfect thumbnail frame from this video"
}`;

  const response = await callGemini(prompt, {
    model: 'gemini-2.0-flash',
    temperature: 0.75,
    maxOutputTokens: 8192,
  });

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Veo 3 package response');

  return JSON.parse(jsonMatch[0]) as Veo3ProductionPackage;
}
