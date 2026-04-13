import { getDB } from '@/lib/supabase';
import { scoreColor, statusBadgeColor, relativeTime } from '@/lib/utils';
import { GeneratingBanner } from '@/components/GeneratingBanner';
import { CopyButton } from '@/components/CopyButton';
import type { Script } from '@cg160/types';

export const revalidate = 0;

async function getScripts() {
  const db = getDB();
  const [pending, approved] = await Promise.all([
    db.getScriptsByStatus('pending', 30),
    db.getScriptsByStatus('approved', 10),
  ]);
  return { pending, approved };
}

// Build a complete, ready-to-paste Veo 3 prompt for a single scene
function buildScenePrompt(
  scene: Script['scenes'][number],
  characterProfile: string,
  audioDirection: string
): string {
  const parts: string[] = [];

  // Character block (English — for Veo 3)
  if (characterProfile) {
    parts.push(`CHARACTER PROFILE:\n${characterProfile}`);
  }

  // Scene header
  parts.push(`SCENE ${scene.scene_number} — ${scene.duration_estimate_seconds}s`);

  // Dialogue (can be PT-BR — Veo 3 handles it)
  if (scene.dialogue) {
    parts.push(`Dialogue: "${scene.dialogue}"`);
  }

  // Visual direction (English)
  if (scene.visual_direction) {
    parts.push(`Visual: ${scene.visual_direction}`);
  }

  // Audio (English)
  if (scene.sound_notes) {
    parts.push(`Audio: ${scene.sound_notes}`);
  } else if (audioDirection) {
    parts.push(`Audio: ${audioDirection}`);
  }

  return parts.join('\n\n');
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  const pct = Math.round(value * 10);
  const color = value >= 7 ? 'bg-green-500' : value >= 5 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-32 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-6 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

function ScenePromptBlock({
  scene,
  characterProfile,
  audioDirection,
}: {
  scene: Script['scenes'][number];
  characterProfile: string;
  audioDirection: string;
}) {
  const prompt = buildScenePrompt(scene, characterProfile, audioDirection);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {/* Scene header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white">Cena {scene.scene_number}</span>
          <span className="text-xs text-gray-500">{scene.duration_estimate_seconds}s</span>
          {scene.dialogue && (
            <span className="text-xs text-blue-400 italic truncate max-w-xs">"{scene.dialogue}"</span>
          )}
        </div>
        <CopyButton text={prompt} />
      </div>

      {/* Prompt content */}
      <pre className="px-3 py-3 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-900/60 font-mono">
        {prompt}
      </pre>
    </div>
  );
}

function ScriptCard({ script }: { script: Script }) {
  const metadata = script.metadata as Record<string, string>;
  const characterProfile: string = metadata?.character_visual_bible ?? '';
  const audioDirection: string = metadata?.audio_direction ?? '';
  const scenes = Array.isArray(script.scenes) ? script.scenes : [];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadgeColor(script.status)}`}>
              {script.status}
            </span>
            {script.version > 1 && (
              <span className="text-xs text-gray-600">v{script.version}</span>
            )}
          </div>
          <h3 className="font-semibold text-white">{script.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{relativeTime(script.created_at)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-2xl font-bold ${scoreColor(script.total_score)}`}>
            {script.total_score?.toFixed(1) ?? '—'}
          </div>
          <div className="text-xs text-gray-600">score</div>
        </div>
      </div>

      {/* Hook */}
      <div className="px-4 py-3 bg-blue-950/30 border-b border-gray-800">
        <div className="text-xs text-blue-400 font-medium mb-1">HOOK</div>
        <p className="text-sm text-white italic">"{script.hook}"</p>
      </div>

      {/* Script content */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="text-xs text-gray-500 font-medium mb-2">SCRIPT</div>
        <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{script.content}</p>
      </div>

      {/* ── PROMPTS VEO 3 — one per scene, ready to paste ── */}
      {scenes.length > 0 && (
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-green-400 font-bold uppercase tracking-wider">
              Prompts Veo 3 — {scenes.length} cenas prontas para colar
            </div>
            <span className="text-xs text-gray-600">1 prompt por cena</span>
          </div>
          <div className="space-y-3">
            {scenes.map((scene) => (
              <ScenePromptBlock
                key={scene.scene_number}
                scene={scene}
                characterProfile={characterProfile}
                audioDirection={audioDirection}
              />
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Cole cada prompt diretamente no Veo 3. O perfil do personagem está incluído em cada um para manter consistência visual.
          </p>
        </div>
      )}

      {/* Perfil do Personagem */}
      {characterProfile && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="text-xs text-yellow-400 font-medium mb-2">PERFIL DO PERSONAGEM</div>
          <p className="text-sm text-gray-300">{characterProfile}</p>
        </div>
      )}

      {/* Direção de Áudio */}
      {audioDirection && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="text-xs text-purple-400 font-medium mb-2">DIREÇÃO DE ÁUDIO</div>
          <p className="text-sm text-gray-300">{audioDirection}</p>
        </div>
      )}

      {/* Notas de Produção */}
      {metadata?.production_notes && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="text-xs text-orange-400 font-medium mb-2">NOTAS DE PRODUÇÃO</div>
          <p className="text-sm text-gray-300">{metadata.production_notes}</p>
        </div>
      )}

      {/* Scores */}
      {script.total_score !== null && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="text-xs text-gray-500 font-medium mb-3">PONTUAÇÃO — 14 DIMENSÕES</div>
          <div className="space-y-1.5">
            <ScoreBar label="Hook strength"    value={script.hook_strength} />
            <ScoreBar label="Clarity"          value={script.clarity_score} />
            <ScoreBar label="Emotional trigger" value={script.emotional_trigger_score} />
            <ScoreBar label="Curiosity gap"    value={script.curiosity_gap_score} />
            <ScoreBar label="Pacing density"   value={script.pacing_density_score} />
            <ScoreBar label="Setup simplicity" value={script.setup_simplicity_score} />
            <ScoreBar label="Punchline"        value={script.punchline_strength} />
            <ScoreBar label="Loop potential"   value={script.loop_potential} />
            <ScoreBar label="Shareability"     value={script.shareability_score} />
            <ScoreBar label="Memorability"     value={script.memorability_score} />
            <ScoreBar label="Novelty"          value={script.novelty_score} />
            <ScoreBar label="Absurdity balance" value={script.absurdity_balance} />
            <ScoreBar label="Visual feasibility" value={script.visual_feasibility} />
            <ScoreBar label="Viral alignment"  value={script.viral_structure_alignment} />
          </div>
        </div>
      )}

      {/* Meta tags */}
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
        {script.duration_estimate_seconds && (
          <span className="text-xs text-gray-500">{script.duration_estimate_seconds}s</span>
        )}
        {script.pacing_style && (
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{script.pacing_style}</span>
        )}
        {script.humor_type && script.humor_type !== 'none' && (
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{script.humor_type}</span>
        )}
        {script.emotional_tone && (
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{script.emotional_tone}</span>
        )}
      </div>
    </div>
  );
}

export default async function ScriptsPage() {
  const { pending, approved } = await getScripts();
  const total = pending.length + approved.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Scripts</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {total} script{total !== 1 ? 's' : ''} — prompts Veo 3 prontos por cena
        </p>
      </div>

      <GeneratingBanner itemCount={total} />

      {total === 0 && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">📝</div>
          <div className="text-lg">Nenhum script ainda</div>
          <div className="text-sm mt-1">Aprove uma ideia para gerar o primeiro script</div>
        </div>
      )}

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3">
            Aguardando aprovação ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map(s => <ScriptCard key={s.id} script={s} />)}
          </div>
        </section>
      )}

      {approved.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">
            Aprovados ({approved.length})
          </h2>
          <div className="space-y-4">
            {approved.map(s => <ScriptCard key={s.id} script={s} />)}
          </div>
        </section>
      )}
    </div>
  );
}
