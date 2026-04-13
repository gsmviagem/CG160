// ============================================================
// CG 160 — Test script generation inline (bypasses Inngest)
// GET /api/test-generate?idea_id=xxx
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/supabase';
import { generateScript } from '@cg160/ai';

export async function GET(request: NextRequest) {
  const idea_id = request.nextUrl.searchParams.get('idea_id');
  if (!idea_id) {
    return NextResponse.json({ error: 'Pass ?idea_id=xxx' }, { status: 400 });
  }

  const db = getDB();
  const steps: Record<string, unknown> = {};

  // Step 1: Load idea
  let idea;
  try {
    idea = await db.getIdeaById(idea_id);
    steps.load_idea = idea ? `OK — "${idea.title}" (status: ${idea.status})` : 'NOT FOUND';
    if (!idea) return NextResponse.json({ steps }, { status: 404 });
  } catch (e) {
    steps.load_idea = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    return NextResponse.json({ steps }, { status: 500 });
  }

  // Step 2: Load context
  let character = null;
  let patterns: unknown[] = [];
  let weights: Record<string, number> = {};
  try {
    const [char, pats, weightRows] = await Promise.all([
      idea.character_id ? db.getCharacterById(idea.character_id) : Promise.resolve(null),
      db.getActivePatterns(),
      db.getLearningWeights('script_scoring'),
    ]);
    character = char;
    patterns = pats;
    weights = Object.fromEntries(weightRows.map((w: { feature_name: string; current_weight: number }) => [w.feature_name, w.current_weight]));
    steps.load_context = `OK — character: ${character?.name ?? 'none'}, patterns: ${patterns.length}, weights: ${Object.keys(weights).length}`;
  } catch (e) {
    steps.load_context = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    return NextResponse.json({ steps }, { status: 500 });
  }

  // Step 3: Generate script (Groq)
  let rawScript;
  try {
    rawScript = await generateScript({
      idea,
      character,
      patterns: patterns as never,
      scoring_weights: weights as never,
      target_duration_seconds: 30,
    });
    steps.generate_script = `OK — "${rawScript.title}", ${rawScript.scenes?.length ?? 0} scenes`;
  } catch (e) {
    steps.generate_script = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    return NextResponse.json({ steps }, { status: 500 });
  }

  // Step 4: Save to DB
  let script;
  try {
    script = await db.createScript({
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
      hook_strength: null, clarity_score: null, emotional_trigger_score: null,
      curiosity_gap_score: null, pacing_density_score: null, setup_simplicity_score: null,
      punchline_strength: null, loop_potential: null, shareability_score: null,
      memorability_score: null, novelty_score: null, absurdity_balance: null,
      visual_feasibility: null, viral_structure_alignment: null,
      total_score: null, score_breakdown: {},
      version: 1, parent_script_id: null, status: 'pending',
      rejection_reason: null, rejected_at: null, approved_at: null,
      generation_model: 'groq/llama-3.3-70b',
      metadata: {
        video_prompt: rawScript.video_prompt,
        character_visual_bible: rawScript.character_visual_bible,
        audio_direction: rawScript.audio_direction,
        production_notes: rawScript.production_notes,
      },
    });
    await db.updateIdeaStatus(idea_id, 'scripted');
    steps.save_script = `OK — script id: ${script.id}`;
  } catch (e) {
    steps.save_script = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    return NextResponse.json({ steps }, { status: 500 });
  }

  return NextResponse.json({ success: true, steps, script_id: script.id });
}
