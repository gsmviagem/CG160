import { getDB } from '@/lib/supabase';
import { formatScore, scoreColor, statusBadgeColor, relativeTime } from '@/lib/utils';
import { ApprovalButton } from '@/components/ActionButton';
import type { Idea, Script, Video } from '@cg160/types';

export const revalidate = 0;

async function getApprovalQueue() {
  const db = getDB();
  const [ideas, scripts, imagesReady, videos] = await Promise.all([
    db.getIdeasByStatus('pending', 20),
    db.getScriptsByStatus('pending', 20),
    db.getScriptsByStatus('images_ready', 20),
    db.getVideosByStatus('ready', 20),
  ]);
  return { ideas, scripts, imagesReady, videos };
}

// ── shared section heading ──────────────────────────────────────────────────
function SectionHeading({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className={`text-xs font-bold uppercase tracking-widest ${color}`}>{label}</span>
      <span className="text-xs text-white/20">{count}</span>
    </div>
  );
}

// ── shared tag pill ──────────────────────────────────────────────────────────
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs bg-white/[0.07] text-white/50 px-2 py-0.5 rounded-lg">{children}</span>
  );
}

// ── IdeaCard ─────────────────────────────────────────────────────────────────
function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <div className="bg-white/[0.04] hover:bg-white/[0.06] transition-colors duration-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-[11px] text-white/25 font-semibold uppercase tracking-widest">Ideia</span>
          <h3 className="text-sm font-semibold text-white mt-0.5">{idea.title}</h3>
        </div>
        <div className={`text-xl font-bold flex-shrink-0 ${scoreColor(idea.total_score)}`}>
          {formatScore(idea.total_score)}
        </div>
      </div>
      <p className="text-sm text-white/50 mb-3">{idea.concept}</p>
      {idea.hook_summary && (
        <p className="text-xs text-indigo-400/80 italic mb-3">"{idea.hook_summary}"</p>
      )}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        {idea.narrative_type && <Tag>{idea.narrative_type}</Tag>}
        {idea.format_type    && <Tag>{idea.format_type}</Tag>}
        {idea.target_emotion && <Tag>{idea.target_emotion}</Tag>}
        {idea.created_at && (
          <span className="text-xs text-white/20 ml-auto">{relativeTime(idea.created_at)}</span>
        )}
      </div>
      <div className="flex gap-2">
        <ApprovalButton entityType="idea" entityId={idea.id} action="approved"               label="Aprovar"   variant="success" />
        <ApprovalButton entityType="idea" entityId={idea.id} action="rejected"               label="Rejeitar"  variant="danger"  />
        <ApprovalButton entityType="idea" entityId={idea.id} action="regenerate_requested"   label="Regenerar" variant="neutral" />
      </div>
    </div>
  );
}

// ── ScriptCard ───────────────────────────────────────────────────────────────
function ScriptCard({ script }: { script: Script }) {
  return (
    <div className="bg-white/[0.04] hover:bg-white/[0.06] transition-colors duration-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-[11px] text-white/25 font-semibold uppercase tracking-widest">Script</span>
          <h3 className="text-sm font-semibold text-white mt-0.5">{script.title}</h3>
        </div>
        <div className={`text-xl font-bold flex-shrink-0 ${scoreColor(script.total_score)}`}>
          {formatScore(script.total_score)}
        </div>
      </div>
      <p className="text-xs text-indigo-400/80 italic mb-2">Hook: "{script.hook}"</p>
      <p className="text-sm text-white/50 mb-3 line-clamp-3">{script.content}</p>

      {/* Mini score grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {([
          ['H', script.hook_strength],
          ['C', script.clarity_score],
          ['E', script.emotional_trigger_score],
          ['Q', script.curiosity_gap_score],
          ['P', script.punchline_strength],
          ['S', script.shareability_score],
          ['N', script.novelty_score],
        ] as [string, number | null][]).map(([lbl, score]) => (
          <div key={lbl} className="text-center bg-white/[0.04] rounded-lg py-1.5">
            <div className="text-[10px] text-white/25">{lbl}</div>
            <div className={`text-xs font-bold ${scoreColor(score !== null && score !== undefined ? score * 10 : null)}`}>
              {score !== null && score !== undefined ? Number(score).toFixed(1) : '—'}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <ApprovalButton entityType="script" entityId={script.id} action="approved"             label="Aprovar"   variant="success" />
        <ApprovalButton entityType="script" entityId={script.id} action="rejected"             label="Rejeitar"  variant="danger"  />
        <ApprovalButton entityType="script" entityId={script.id} action="regenerate_requested" label="Regenerar" variant="neutral" />
      </div>
    </div>
  );
}

// ── ImageReviewCard ──────────────────────────────────────────────────────────
function ImageReviewCard({ script }: { script: Script }) {
  const scenes = Array.isArray(script.scenes) ? script.scenes : [];
  const sid    = script.id.replace(/-/g, '').slice(0, 8);
  return (
    <div className="bg-amber-500/[0.05] hover:bg-amber-500/[0.08] transition-colors duration-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-[11px] text-amber-400/70 font-semibold uppercase tracking-widest">
            Imagens · {scenes.length} cenas
          </span>
          <h3 className="text-sm font-semibold text-white mt-0.5">{script.title}</h3>
        </div>
        <span className="text-xs text-white/20 font-mono flex-shrink-0">{sid}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {scenes.map(s => (
          <code key={s.scene_number} className="text-xs text-amber-400/80 bg-white/[0.06] px-2 py-1 rounded-lg font-mono">
            {sid}_cena{s.scene_number}.jpg
          </code>
        ))}
      </div>
      <p className="text-xs text-white/25 mb-4">
        Bucket: <code className="text-white/40">cg160-media/cenas/{sid}/</code>
      </p>
      <div className="flex gap-2">
        <ApprovalButton entityType="script" entityId={script.id} action="images_approved" label="Aprovar imagens" variant="success" />
        <ApprovalButton entityType="script" entityId={script.id} action="images_rejected" label="Rejeitar"        variant="danger"  />
      </div>
    </div>
  );
}

// ── VideoCard ────────────────────────────────────────────────────────────────
function VideoCard({ video }: { video: Video }) {
  return (
    <div className="bg-white/[0.04] hover:bg-white/[0.06] transition-colors duration-200 rounded-2xl p-5">
      <div className="flex items-start gap-4">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt="" className="w-14 h-24 object-cover rounded-xl flex-shrink-0 bg-white/[0.05]" />
        ) : (
          <div className="w-14 h-24 rounded-xl bg-white/[0.05] flex items-center justify-center flex-shrink-0">
            <span className="text-white/20 text-[10px] text-center leading-tight px-1">sem thumb</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-[11px] text-white/25 font-semibold uppercase tracking-widest">Vídeo</span>
          <h3 className="text-sm font-semibold text-white mt-0.5">{video.title}</h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {video.platform && <Tag>{video.platform}</Tag>}
            {video.duration_seconds && (
              <span className="text-xs text-white/30">{video.duration_seconds.toFixed(0)}s</span>
            )}
          </div>
          {video.storage_url && (
            <a href={video.storage_url} target="_blank" rel="noopener noreferrer"
               className="text-xs text-indigo-400/70 hover:text-indigo-300 mt-2 block transition-colors">
              Preview →
            </a>
          )}
          <div className="flex gap-2 mt-4">
            <ApprovalButton entityType="video" entityId={video.id} action="approved"             label="Aprovar"   variant="success" />
            <ApprovalButton entityType="video" entityId={video.id} action="rejected"             label="Rejeitar"  variant="danger"  />
            <ApprovalButton entityType="video" entityId={video.id} action="regenerate_requested" label="Regenerar" variant="neutral" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function ApprovalPage() {
  const { ideas, scripts, imagesReady, videos } = await getApprovalQueue();
  const total = ideas.length + scripts.length + imagesReady.length + videos.length;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Fila de Aprovação</h1>
        <p className="text-white/30 mt-1.5 text-sm">
          {total} item{total !== 1 ? 's' : ''} aguardando revisão
        </p>
      </div>

      {total === 0 && (
        <div className="text-center py-24">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-white/50 font-medium">Fila vazia</div>
          <div className="text-white/25 text-sm mt-1">Tudo em dia</div>
        </div>
      )}

      {videos.length > 0 && (
        <section className="mb-10">
          <SectionHeading label="Vídeos" count={videos.length} color="text-violet-400" />
          <div className="space-y-3">{videos.map(v => <VideoCard key={v.id} video={v} />)}</div>
        </section>
      )}

      {imagesReady.length > 0 && (
        <section className="mb-10">
          <SectionHeading label="Imagens das cenas" count={imagesReady.length} color="text-amber-400" />
          <div className="space-y-3">{imagesReady.map(s => <ImageReviewCard key={s.id} script={s} />)}</div>
        </section>
      )}

      {scripts.length > 0 && (
        <section className="mb-10">
          <SectionHeading label="Scripts" count={scripts.length} color="text-blue-400" />
          <div className="space-y-3">{scripts.map(s => <ScriptCard key={s.id} script={s} />)}</div>
        </section>
      )}

      {ideas.length > 0 && (
        <section className="mb-10">
          <SectionHeading label="Ideias" count={ideas.length} color="text-violet-300" />
          <div className="space-y-3">{ideas.map(i => <IdeaCard key={i.id} idea={i} />)}</div>
        </section>
      )}
    </div>
  );
}
