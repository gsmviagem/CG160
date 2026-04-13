import { getDB } from '@/lib/supabase';
import { formatScore, scoreColor, statusBadgeColor, relativeTime } from '@/lib/utils';
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

function ScriptCard({ script }: { script: Script }) {
  const metadata = script.metadata as Record<string, string>;

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
        <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
          {script.content}
        </p>
      </div>

      {/* Scenes */}
      {script.scenes && script.scenes.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="text-xs text-gray-500 font-medium mb-2">
            CENAS ({script.scenes.length})
          </div>
          <div className="space-y-3">
            {script.scenes.map((scene) => (
              <div key={scene.scene_number} className="bg-gray-800/50 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                    Cena {scene.scene_number}
                  </span>
                  <span className="text-xs text-gray-500">{scene.duration_estimate_seconds}s</span>
                </div>
                {scene.dialogue && (
                  <p className="text-sm text-white mb-1">
                    <span className="text-gray-500">Diálogo:</span> "{scene.dialogue}"
                  </p>
                )}
                <p className="text-xs text-gray-400 mb-1">
                  <span className="text-gray-500">Visual:</span> {scene.visual_direction}
                </p>
                {scene.sound_notes && (
                  <p className="text-xs text-purple-400">
                    <span className="text-gray-500">Áudio:</span> {scene.sound_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Veo 3 Production Package */}
      {metadata?.video_prompt && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="text-xs text-green-400 font-medium mb-2">PROMPT VEO 3 — PRONTO PARA COLAR</div>
          <div className="bg-gray-800 rounded p-3">
            <p className="text-sm text-gray-200 leading-relaxed">{metadata.video_prompt}</p>
          </div>
        </div>
      )}

      {/* Character Bible */}
      {(metadata as Record<string, string>)?.character_visual_bible && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="text-xs text-yellow-400 font-medium mb-2">BÍBLIA DO PERSONAGEM</div>
          <p className="text-sm text-gray-300">{metadata.character_visual_bible}</p>
        </div>
      )}

      {/* Audio Direction */}
      {(metadata as Record<string, string>)?.audio_direction && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="text-xs text-purple-400 font-medium mb-2">DIREÇÃO DE ÁUDIO</div>
          <p className="text-sm text-gray-300">{metadata.audio_direction}</p>
        </div>
      )}

      {/* Production Notes */}
      {(metadata as Record<string, string>)?.production_notes && (
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
            <ScoreBar label="Hook strength" value={script.hook_strength} />
            <ScoreBar label="Clarity" value={script.clarity_score} />
            <ScoreBar label="Emotional trigger" value={script.emotional_trigger_score} />
            <ScoreBar label="Curiosity gap" value={script.curiosity_gap_score} />
            <ScoreBar label="Pacing density" value={script.pacing_density_score} />
            <ScoreBar label="Setup simplicity" value={script.setup_simplicity_score} />
            <ScoreBar label="Punchline" value={script.punchline_strength} />
            <ScoreBar label="Loop potential" value={script.loop_potential} />
            <ScoreBar label="Shareability" value={script.shareability_score} />
            <ScoreBar label="Memorability" value={script.memorability_score} />
            <ScoreBar label="Novelty" value={script.novelty_score} />
            <ScoreBar label="Absurdity balance" value={script.absurdity_balance} />
            <ScoreBar label="Visual feasibility" value={script.visual_feasibility} />
            <ScoreBar label="Viral alignment" value={script.viral_structure_alignment} />
          </div>
        </div>
      )}

      {/* Meta */}
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
          {total} script{total !== 1 ? 's' : ''} — com pacote completo para Veo 3
        </p>
      </div>

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
