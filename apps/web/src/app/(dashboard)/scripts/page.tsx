import { getDB } from '@/lib/supabase';
import { scoreColor, statusBadgeColor, relativeTime } from '@/lib/utils';
import { GeneratingBanner } from '@/components/GeneratingBanner';
import { CopyButton } from '@/components/CopyButton';
import { DeleteButton, ApprovalButton } from '@/components/ActionButton';
import { buildFileManifest } from '@/lib/filenames';
import type { Script, ScriptScene } from '@cg160/types';

export const revalidate = 0;

async function getScripts() {
  const db = getDB();
  return db.getAllScripts(60);
}

function buildScenePrompt(
  scene: ScriptScene, characterProfile: string, audioDirection: string, productionNotes: string
): string {
  const parts: string[] = [];
  if (characterProfile) parts.push(`CHARACTER PROFILE:\n${characterProfile}`);
  parts.push(`SCENE ${scene.scene_number} — ${scene.duration_estimate_seconds}s`);
  if (scene.dialogue)         parts.push(`Dialogue: "${scene.dialogue}"`);
  if (scene.visual_direction) parts.push(`Visual: ${scene.visual_direction}`);
  if (scene.sound_notes)      parts.push(`Audio: ${scene.sound_notes}`);
  else if (audioDirection)    parts.push(`Audio: ${audioDirection}`);
  if (productionNotes)        parts.push(`Production notes: ${productionNotes}`);
  return parts.join('\n\n');
}

function buildImagePrompt(scene: ScriptScene, characterProfile: string): string {
  const parts: string[] = [];
  if (characterProfile)  parts.push(`CHARACTER: ${characterProfile}`);
  if (scene.image_prompt) parts.push(scene.image_prompt);
  return parts.join('\n\n');
}

// ── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  const pct = Math.round(value * 10);
  const [g1, g2, glow] = value >= 7
    ? ['from-emerald-500', 'to-green-400',  '0 0 6px rgba(52,211,153,0.5)']
    : value >= 5
    ? ['from-amber-500',   'to-yellow-400', '0 0 6px rgba(251,191,36,0.4)']
    : ['from-red-500',     'to-rose-400',   '0 0 6px rgba(239,68,68,0.3)'];
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/35 w-36 flex-shrink-0">{label}</span>
      <div className="flex-1 h-[4px] bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${g1} ${g2}`}
          style={{ width: `${pct}%`, boxShadow: pct > 10 ? glow : 'none' }}
        />
      </div>
      <span className="text-xs text-white/40 w-6 text-right font-mono">{value.toFixed(1)}</span>
    </div>
  );
}

// ── Scene prompt block ───────────────────────────────────────────────────────
function ScenePromptBlock({
  scene, characterProfile, audioDirection, productionNotes, imageFilename,
}: {
  scene: ScriptScene; characterProfile: string;
  audioDirection: string; productionNotes: string; imageFilename: string;
}) {
  const veoPrompt   = buildScenePrompt(scene, characterProfile, audioDirection, productionNotes);
  const imagePrompt = buildImagePrompt(scene, characterProfile);
  return (
    <div className="bg-white/[0.04] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-white/70">Cena {scene.scene_number}</span>
          <span className="text-xs text-white/25">{scene.duration_estimate_seconds}s</span>
          {scene.dialogue && (
            <span className="text-xs text-indigo-400/70 italic truncate max-w-xs">"{scene.dialogue}"</span>
          )}
        </div>
        <CopyButton text={veoPrompt} />
      </div>
      <pre className="px-4 py-3 text-xs text-white/55 whitespace-pre-wrap leading-relaxed font-mono">
        {veoPrompt}
      </pre>
      {scene.image_prompt && (
        <>
          <div className="flex items-center justify-between px-4 py-2.5 bg-violet-500/[0.08]">
            <span className="text-xs font-semibold text-violet-300/80">Prompt Gemini — imagem estática</span>
            <CopyButton text={imagePrompt} />
          </div>
          <pre className="px-4 py-3 text-xs text-violet-300/60 whitespace-pre-wrap leading-relaxed font-mono bg-violet-500/[0.04]">
            {imagePrompt}
          </pre>
        </>
      )}
      <div className="px-4 py-2.5 bg-white/[0.02] flex items-center gap-2">
        <span className="text-xs text-white/20">Salvar como:</span>
        <code className="text-xs text-amber-400/80 bg-white/[0.05] px-2 py-0.5 rounded-lg font-mono select-all">
          {imageFilename}
        </code>
      </div>
    </div>
  );
}

// ── File manifest ────────────────────────────────────────────────────────────
function FileManifestBlock({ script, sceneCount }: { script: Script; sceneCount: number }) {
  const manifest = buildFileManifest(script.id, sceneCount);
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-amber-400/80 uppercase tracking-widest">Arquivos a criar</span>
        <span className="text-xs text-white/20">— bucket: <code className="text-white/30">cg160-media</code></span>
      </div>

      {/* Pipeline steps */}
      <div className="flex items-center gap-1.5 text-xs text-white/40 mb-4 flex-wrap">
        {[
          { c: 'text-emerald-400/80 bg-emerald-500/10', t: '✓ Script' },
          { c: 'text-amber-400/80 bg-amber-500/10',     t: '📸 Criar imagens' },
          { c: 'text-violet-400/80 bg-violet-500/10',   t: 'Aprovar imagens' },
          { c: 'text-blue-400/80 bg-blue-500/10',       t: '🎬 Animar → Vídeo' },
        ].map(({ c, t }, i) => (
          <>
            {i > 0 && <span key={`a${i}`} className="text-white/20">→</span>}
            <span key={t} className={`px-2 py-0.5 rounded-lg ${c}`}>{t}</span>
          </>
        ))}
      </div>

      {/* Files table */}
      <div className="bg-white/[0.03] rounded-xl overflow-hidden mb-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/[0.03]">
              <th className="text-left px-4 py-2.5 font-medium text-white/30">Tipo</th>
              <th className="text-left px-4 py-2.5 font-medium text-white/30">Arquivo</th>
              <th className="text-left px-4 py-2.5 font-medium text-white/30 hidden sm:table-cell">Caminho</th>
            </tr>
          </thead>
          <tbody>
            {manifest.scenes.map(s => (
              <tr key={s.sceneNumber} className="border-t border-white/[0.04]">
                <td className="px-4 py-2.5 text-white/30">Imagem cena {s.sceneNumber}</td>
                <td className="px-4 py-2.5"><code className="text-amber-400/80 select-all">{s.filename}</code></td>
                <td className="px-4 py-2.5 hidden sm:table-cell"><code className="text-white/25">{s.storagePath}</code></td>
              </tr>
            ))}
            <tr className="border-t border-white/[0.06] bg-white/[0.02]">
              <td className="px-4 py-2.5 text-white/30">Vídeo final</td>
              <td className="px-4 py-2.5"><code className="text-blue-400/80 select-all">{manifest.video.filename}</code></td>
              <td className="px-4 py-2.5 hidden sm:table-cell"><code className="text-white/25">{manifest.video.storagePath}</code></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-white/25">
        Crie os arquivos com esses nomes exatos e faça upload no bucket{' '}
        <code className="text-white/35">cg160-media</code> no Supabase Storage.
      </p>
    </div>
  );
}

// ── Script card ──────────────────────────────────────────────────────────────
function ScriptCard({ script }: { script: Script }) {
  const metadata = script.metadata as Record<string, unknown>;
  const safeStr  = (v: unknown): string =>
    typeof v === 'string' ? v : v ? JSON.stringify(v) : '';
  const characterProfile = safeStr(metadata?.character_visual_bible);
  const audioDirection   = safeStr(metadata?.audio_direction);
  const productionNotes  = safeStr(metadata?.production_notes);
  const scenes = Array.isArray(script.scenes) ? script.scenes : [];

  return (
    <div className="bg-white/[0.04] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${statusBadgeColor(script.status)}`}>
              {script.status}
            </span>
            {script.version > 1 && <span className="text-xs text-white/25">v{script.version}</span>}
            <span className="text-xs text-white/20">{relativeTime(script.created_at)}</span>
          </div>
          <h3 className="font-semibold text-white/90">{script.title}</h3>
          {script.rejection_reason && (
            <p className="text-xs text-red-400/70 mt-1">Rejeitado: {script.rejection_reason}</p>
          )}
        </div>
        <div className="flex items-start gap-2 flex-shrink-0">
          {script.status === 'pending' && (
            <div className="flex gap-1">
              <ApprovalButton entityType="script" entityId={script.id} action="approved"             label="Aprovar"   variant="success" />
              <ApprovalButton entityType="script" entityId={script.id} action="rejected"             label="Rejeitar"  variant="danger"  />
              <ApprovalButton entityType="script" entityId={script.id} action="regenerate_requested" label="Regenerar" variant="neutral" />
            </div>
          )}
          {script.status === 'approved' && (
            <ApprovalButton entityType="script" entityId={script.id} action="images_ready" label="📸 Imagens prontas" variant="neutral" />
          )}
          {script.status === 'generating_video' && (
            <a href={`/api/videos/mark-ready?script_id=${script.id}`}
               className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 font-medium transition-all duration-200">
              🎬 Vídeo pronto
            </a>
          )}
          <div className="text-right">
            <div className={`text-2xl font-bold ${scoreColor(script.total_score)}`}>
              {script.total_score?.toFixed(1) ?? '—'}
            </div>
            <div className="text-[11px] text-white/20">score</div>
          </div>
          <DeleteButton type="script" id={script.id} />
        </div>
      </div>

      {/* Hook */}
      <div className="px-5 py-4 bg-indigo-500/[0.06]">
        <div className="text-[11px] text-indigo-400/70 font-bold uppercase tracking-widest mb-1">Hook</div>
        <p className="text-sm text-white/80 italic">"{script.hook}"</p>
      </div>

      {/* Script content */}
      <div className="px-5 py-4">
        <div className="text-[11px] text-white/25 font-semibold uppercase tracking-widest mb-2">Script</div>
        <p className="text-sm text-white/55 whitespace-pre-line leading-relaxed">{script.content}</p>
      </div>

      {/* Veo 3 scene prompts */}
      {scenes.length > 0 && (
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] text-emerald-400/80 font-bold uppercase tracking-widest">
              Prompts Veo 3 — {scenes.length} cenas
            </div>
            <span className="text-xs text-white/20">1 prompt por cena</span>
          </div>
          <div className="space-y-3">
            {scenes.map(scene => (
              <ScenePromptBlock
                key={scene.scene_number}
                scene={scene}
                characterProfile={characterProfile}
                audioDirection={audioDirection}
                productionNotes={productionNotes}
                imageFilename={`${script.id.replace(/-/g, '').slice(0, 8)}_cena${scene.scene_number}.jpg`}
              />
            ))}
          </div>
        </div>
      )}

      {/* File manifest */}
      <div className="px-5 py-4 bg-white/[0.02]">
        <FileManifestBlock script={script} sceneCount={scenes.length} />
      </div>

      {/* Character / Audio / Production */}
      {(characterProfile || audioDirection || productionNotes) && (
        <div className="px-5 py-4 space-y-4">
          {characterProfile && (
            <div>
              <div className="text-[11px] text-amber-400/70 font-bold uppercase tracking-widest mb-1.5">Perfil do Personagem</div>
              <p className="text-sm text-white/55">{characterProfile}</p>
            </div>
          )}
          {audioDirection && (
            <div>
              <div className="text-[11px] text-violet-400/70 font-bold uppercase tracking-widest mb-1.5">Direção de Áudio</div>
              <p className="text-sm text-white/55">{audioDirection}</p>
            </div>
          )}
          {productionNotes && (
            <div>
              <div className="text-[11px] text-orange-400/70 font-bold uppercase tracking-widest mb-1.5">Notas de Produção</div>
              <p className="text-sm text-white/55">{productionNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Scores */}
      {script.total_score !== null && (
        <div className="px-5 py-4 bg-white/[0.02]">
          <div className="text-[11px] text-white/25 font-semibold uppercase tracking-widest mb-3">Pontuação — 14 dimensões</div>
          <div className="space-y-2">
            <ScoreBar label="Hook strength"      value={script.hook_strength} />
            <ScoreBar label="Clarity"            value={script.clarity_score} />
            <ScoreBar label="Emotional trigger"  value={script.emotional_trigger_score} />
            <ScoreBar label="Curiosity gap"      value={script.curiosity_gap_score} />
            <ScoreBar label="Pacing density"     value={script.pacing_density_score} />
            <ScoreBar label="Setup simplicity"   value={script.setup_simplicity_score} />
            <ScoreBar label="Punchline"          value={script.punchline_strength} />
            <ScoreBar label="Loop potential"     value={script.loop_potential} />
            <ScoreBar label="Shareability"       value={script.shareability_score} />
            <ScoreBar label="Memorability"       value={script.memorability_score} />
            <ScoreBar label="Novelty"            value={script.novelty_score} />
            <ScoreBar label="Absurdity balance"  value={script.absurdity_balance} />
            <ScoreBar label="Visual feasibility" value={script.visual_feasibility} />
            <ScoreBar label="Viral alignment"    value={script.viral_structure_alignment} />
          </div>
        </div>
      )}

      {/* Meta tags */}
      <div className="px-5 py-3.5 flex items-center gap-2 flex-wrap">
        {script.duration_estimate_seconds && (
          <span className="text-xs text-white/30">{script.duration_estimate_seconds}s</span>
        )}
        {[script.pacing_style, script.humor_type !== 'none' ? script.humor_type : null, script.emotional_tone]
          .filter(Boolean).map(tag => (
            <span key={tag} className="text-xs bg-white/[0.06] text-white/40 px-2 py-0.5 rounded-lg">{tag}</span>
          ))
        }
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function ScriptsPage() {
  const scripts = await getScripts();
  const byStatus = {
    pending:          scripts.filter(s => s.status === 'pending'),
    approved:         scripts.filter(s => s.status === 'approved'),
    images_ready:     scripts.filter(s => s.status === 'images_ready'),
    generating_video: scripts.filter(s => s.status === 'generating_video'),
    rejected:         scripts.filter(s => s.status === 'rejected'),
    other:            scripts.filter(s => !['pending','approved','images_ready','generating_video','rejected'].includes(s.status)),
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Scripts</h1>
        <p className="text-white/30 mt-1.5 text-sm">
          {scripts.length} script{scripts.length !== 1 ? 's' : ''} — prompts Veo 3 + nomes de arquivo por cena
        </p>
      </div>

      <GeneratingBanner itemCount={scripts.length} />

      {scripts.length === 0 && (
        <div className="text-center py-24">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-white/40 font-medium">Nenhum script ainda</div>
          <div className="text-white/20 text-sm mt-1">Aprove uma ideia para gerar o primeiro script</div>
        </div>
      )}

      {([
        { key: 'pending',          color: 'text-violet-300',  label: 'Aguardando aprovação'           },
        { key: 'approved',         color: 'text-emerald-400', label: 'Aprovados — criar imagens'      },
        { key: 'images_ready',     color: 'text-amber-400',   label: 'Imagens prontas — aguardando'   },
        { key: 'generating_video', color: 'text-blue-400',    label: 'Imagens aprovadas — criar vídeo'},
        { key: 'other',            color: 'text-violet-400',  label: 'Em produção'                    },
        { key: 'rejected',         color: 'text-red-400/70',  label: 'Rejeitados'                     },
      ] as const).map(({ key, color, label }) => {
        const list = byStatus[key];
        if (!list.length) return null;
        return (
          <section key={key} className={`mb-10 ${key === 'rejected' ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-bold uppercase tracking-widest ${color}`}>{label}</span>
              <span className="text-xs text-white/20">{list.length}</span>
            </div>
            <div className="space-y-4">
              {list.map(s => <ScriptCard key={s.id} script={s} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
