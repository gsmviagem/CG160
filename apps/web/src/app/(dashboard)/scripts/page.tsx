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
  scene: ScriptScene,
  characterProfile: string,
  audioDirection: string,
  productionNotes: string
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

function buildImagePrompt(
  scene: ScriptScene,
  characterProfile: string,
): string {
  const parts: string[] = [];
  if (characterProfile) parts.push(`CHARACTER: ${characterProfile}`);
  if (scene.image_prompt) parts.push(scene.image_prompt);
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
  scene, characterProfile, audioDirection, productionNotes, imageFilename,
}: {
  scene: ScriptScene;
  characterProfile: string;
  audioDirection: string;
  productionNotes: string;
  imageFilename: string;
}) {
  const veoPrompt   = buildScenePrompt(scene, characterProfile, audioDirection, productionNotes);
  const imagePrompt = buildImagePrompt(scene, characterProfile);
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-white">Cena {scene.scene_number}</span>
          <span className="text-xs text-gray-500">{scene.duration_estimate_seconds}s</span>
          {scene.dialogue && (
            <span className="text-xs text-blue-400 italic truncate max-w-xs">"{scene.dialogue}"</span>
          )}
        </div>
        <CopyButton text={veoPrompt} />
      </div>
      {/* Veo 3 prompt */}
      <pre className="px-3 py-3 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-900/60 font-mono">
        {veoPrompt}
      </pre>
      {/* Gemini image prompt */}
      {scene.image_prompt && (
        <div className="border-t border-gray-700">
          <div className="flex items-center justify-between px-3 py-2 bg-purple-950/40">
            <span className="text-xs font-semibold text-purple-300">📸 Prompt Gemini — imagem estática</span>
            <CopyButton text={imagePrompt} />
          </div>
          <pre className="px-3 py-2 text-xs text-purple-200 whitespace-pre-wrap leading-relaxed bg-purple-950/20 font-mono">
            {imagePrompt}
          </pre>
        </div>
      )}
      {/* Filename pill */}
      <div className="px-3 py-2 bg-gray-800/50 border-t border-gray-700 flex items-center gap-2">
        <span className="text-xs text-gray-500">📁 Salvar como:</span>
        <code className="text-xs text-amber-400 bg-gray-900 px-2 py-0.5 rounded font-mono select-all">
          {imageFilename}
        </code>
      </div>
    </div>
  );
}

function FileManifestBlock({ script, sceneCount }: { script: Script; sceneCount: number }) {
  const manifest = buildFileManifest(script.id, sceneCount);

  return (
    <div className="px-4 py-4 border-b border-gray-800 bg-gray-900/40">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">📁 Arquivos a criar</span>
        <span className="text-xs text-gray-600">— bucket: <code className="text-gray-400">cg160-media</code></span>
      </div>

      {/* Pipeline reminder */}
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
        <span className="px-2 py-0.5 rounded bg-green-900/40 text-green-400">✓ Script</span>
        <span>→</span>
        <span className="px-2 py-0.5 rounded bg-amber-900/40 text-amber-400 font-medium">📸 Criar imagens</span>
        <span>→</span>
        <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-400">Aprovar imagens</span>
        <span>→</span>
        <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-400">🎬 Animar → Vídeo</span>
      </div>

      {/* Scene files table */}
      <div className="rounded-lg overflow-hidden border border-gray-700 mb-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-800 text-gray-400">
              <th className="text-left px-3 py-2 font-medium">Tipo</th>
              <th className="text-left px-3 py-2 font-medium">Nome do arquivo</th>
              <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Caminho no bucket</th>
            </tr>
          </thead>
          <tbody>
            {manifest.scenes.map(s => (
              <tr key={s.sceneNumber} className="border-t border-gray-800">
                <td className="px-3 py-2 text-gray-500">Imagem cena {s.sceneNumber}</td>
                <td className="px-3 py-2">
                  <code className="text-amber-400 select-all">{s.filename}</code>
                </td>
                <td className="px-3 py-2 hidden sm:table-cell">
                  <code className="text-gray-500">{s.storagePath}</code>
                </td>
              </tr>
            ))}
            <tr className="border-t border-gray-700 bg-gray-800/30">
              <td className="px-3 py-2 text-gray-500">Vídeo final</td>
              <td className="px-3 py-2">
                <code className="text-blue-400 select-all">{manifest.video.filename}</code>
              </td>
              <td className="px-3 py-2 hidden sm:table-cell">
                <code className="text-gray-500">{manifest.video.storagePath}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600">
        Crie os arquivos com esses nomes exatos e faça upload no bucket{' '}
        <code className="text-gray-400">cg160-media</code> no Supabase Storage.
        O sistema identifica automaticamente pelos nomes.
      </p>
    </div>
  );
}

function ScriptCard({ script }: { script: Script }) {
  const metadata = script.metadata as Record<string, unknown>;
  const safeStr = (v: unknown): string =>
    typeof v === 'string' ? v : v ? JSON.stringify(v) : '';
  const characterProfile = safeStr(metadata?.character_visual_bible);
  const audioDirection   = safeStr(metadata?.audio_direction);
  const productionNotes  = safeStr(metadata?.production_notes);
  const scenes = Array.isArray(script.scenes) ? script.scenes : [];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadgeColor(script.status)}`}>
              {script.status}
            </span>
            {script.version > 1 && <span className="text-xs text-gray-600">v{script.version}</span>}
            <span className="text-xs text-gray-600">{relativeTime(script.created_at)}</span>
          </div>
          <h3 className="font-semibold text-white">{script.title}</h3>
          {script.rejection_reason && (
            <p className="text-xs text-red-400 mt-1">Rejeitado: {script.rejection_reason}</p>
          )}
        </div>
        <div className="flex items-start gap-2 flex-shrink-0">
          {/* Approval buttons for pending scripts */}
          {script.status === 'pending' && (
            <div className="flex gap-1">
              <ApprovalButton
                entityType="script" entityId={script.id}
                action="approved" label="Aprovar" variant="success"
              />
              <ApprovalButton
                entityType="script" entityId={script.id}
                action="rejected" label="Rejeitar" variant="danger"
              />
              <ApprovalButton
                entityType="script" entityId={script.id}
                action="regenerate_requested" label="Regenerar" variant="neutral"
              />
            </div>
          )}
          {/* Image confirmation for approved scripts */}
          {script.status === 'approved' && (
            <ApprovalButton
              entityType="script" entityId={script.id}
              action="images_ready" label="📸 Imagens prontas" variant="neutral"
            />
          )}
          {/* Video ready — creates the video record */}
          {script.status === 'generating_video' && (
            <a
              href={`/api/videos/mark-ready?script_id=${script.id}`}
              className="text-xs px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-600 text-white font-medium transition-colors"
            >
              🎬 Vídeo pronto
            </a>
          )}
          <div className="text-right">
            <div className={`text-2xl font-bold ${scoreColor(script.total_score)}`}>
              {script.total_score?.toFixed(1) ?? '—'}
            </div>
            <div className="text-xs text-gray-600">score</div>
          </div>
          <DeleteButton type="script" id={script.id} />
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

      {/* Prompts Veo 3 — with filenames embedded per scene */}
      {scenes.length > 0 && (
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-green-400 font-bold uppercase tracking-wider">
              Prompts Veo 3 — {scenes.length} cenas
            </div>
            <span className="text-xs text-gray-600">1 prompt por cena · pronto para colar</span>
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
          <p className="text-xs text-gray-600 mt-3">
            Perfil do personagem incluído em cada prompt para consistência visual no Veo 3.
          </p>
        </div>
      )}

      {/* File manifest — pipeline step */}
      <FileManifestBlock script={script} sceneCount={scenes.length} />

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
      {productionNotes && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="text-xs text-orange-400 font-medium mb-2">NOTAS DE PRODUÇÃO</div>
          <p className="text-sm text-gray-300">{productionNotes}</p>
        </div>
      )}

      {/* Scores */}
      {script.total_score !== null && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="text-xs text-gray-500 font-medium mb-3">PONTUAÇÃO — 14 DIMENSÕES</div>
          <div className="space-y-1.5">
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
  const scripts = await getScripts();
  const byStatus = {
    pending:          scripts.filter(s => s.status === 'pending'),
    approved:         scripts.filter(s => s.status === 'approved'),
    images_ready:     scripts.filter(s => s.status === 'images_ready'),
    generating_video: scripts.filter(s => s.status === 'generating_video'),
    rejected:         scripts.filter(s => s.status === 'rejected'),
    other:            scripts.filter(s => !['pending', 'approved', 'images_ready', 'generating_video', 'rejected'].includes(s.status)),
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Scripts</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {scripts.length} script{scripts.length !== 1 ? 's' : ''} — prompts Veo 3 + nomes de arquivo por cena
        </p>
      </div>

      <GeneratingBanner itemCount={scripts.length} />

      {scripts.length === 0 && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">📝</div>
          <div className="text-lg">Nenhum script ainda</div>
          <div className="text-sm mt-1">Aprove uma ideia para gerar o primeiro script</div>
        </div>
      )}

      {byStatus.pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3">
            Aguardando aprovação ({byStatus.pending.length})
          </h2>
          <div className="space-y-4">
            {byStatus.pending.map(s => <ScriptCard key={s.id} script={s} />)}
          </div>
        </section>
      )}

      {byStatus.approved.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">
            Aprovados — criar imagens ({byStatus.approved.length})
          </h2>
          <div className="space-y-4">
            {byStatus.approved.map(s => <ScriptCard key={s.id} script={s} />)}
          </div>
        </section>
      )}

      {byStatus.images_ready.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
            Imagens prontas — aguardando aprovação ({byStatus.images_ready.length})
          </h2>
          <div className="space-y-4">
            {byStatus.images_ready.map(s => <ScriptCard key={s.id} script={s} />)}
          </div>
        </section>
      )}

      {byStatus.generating_video.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">
            Imagens aprovadas — criar vídeo ({byStatus.generating_video.length})
          </h2>
          <div className="space-y-4">
            {byStatus.generating_video.map(s => <ScriptCard key={s.id} script={s} />)}
          </div>
        </section>
      )}

      {byStatus.other.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">
            Em produção ({byStatus.other.length})
          </h2>
          <div className="space-y-4">
            {byStatus.other.map(s => <ScriptCard key={s.id} script={s} />)}
          </div>
        </section>
      )}

      {byStatus.rejected.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">
            Rejeitados ({byStatus.rejected.length})
          </h2>
          <div className="space-y-4 opacity-60">
            {byStatus.rejected.map(s => <ScriptCard key={s.id} script={s} />)}
          </div>
        </section>
      )}
    </div>
  );
}
