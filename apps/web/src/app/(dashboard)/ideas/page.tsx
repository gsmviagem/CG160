import { getDB } from '@/lib/supabase';
import { formatScore, scoreColor, statusBadgeColor, relativeTime } from '@/lib/utils';
import { ApprovalButton, GenerateButton, GenerateIdeasBox, DeleteButton } from '@/components/ActionButton';
import { GeneratingBanner } from '@/components/GeneratingBanner';
import type { Idea } from '@cg160/types';

export const revalidate = 0;

async function getAllIdeas() {
  const db = getDB();
  return db.getAllIdeas(80);
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="text-xs bg-white/[0.07] text-white/50 px-2 py-0.5 rounded-lg">{children}</span>;
}

function IdeaRow({ idea, showActions = false, showScriptBtn = false }: {
  idea: Idea; showActions?: boolean; showScriptBtn?: boolean;
}) {
  return (
    <div className="bg-white/[0.04] hover:bg-white/[0.06] transition-all duration-200 rounded-2xl p-5 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${statusBadgeColor(idea.status)}`}>
              {idea.status}
            </span>
            {idea.narrative_type && <Tag>{idea.narrative_type}</Tag>}
            {idea.format_type    && <Tag>{idea.format_type}</Tag>}
            {idea.target_emotion && <Tag>{idea.target_emotion}</Tag>}
            <span className="text-xs text-white/20 ml-auto">
              {idea.created_at ? relativeTime(idea.created_at) : ''}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white/90">{idea.title}</h3>
          <p className="text-sm text-white/45 mt-1">{idea.concept}</p>
          {idea.hook_summary && (
            <p className="text-xs text-indigo-400/70 italic mt-1.5">"{idea.hook_summary}"</p>
          )}
          {idea.rejection_reason && (
            <p className="text-xs text-red-400/70 mt-1.5">Motivo: {idea.rejection_reason}</p>
          )}

          {(showActions || showScriptBtn) && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {showActions && (
                <>
                  <ApprovalButton entityType="idea" entityId={idea.id} action="approved" label="Aprovar"  variant="success" />
                  <ApprovalButton entityType="idea" entityId={idea.id} action="rejected" label="Rejeitar" variant="danger"  />
                </>
              )}
              {showScriptBtn && (
                <GenerateButton type="script" ideaId={idea.id} label="Gerar Script" variant="primary" className="text-xs px-3 py-1.5" />
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="text-right">
            <div className={`text-2xl font-bold ${scoreColor(idea.total_score)}`}>
              {formatScore(idea.total_score)}
            </div>
            <div className="text-[11px] text-white/20">score</div>
          </div>
          <DeleteButton type="idea" id={idea.id} />
        </div>
      </div>
    </div>
  );
}

export default async function IdeasPage() {
  const ideas = await getAllIdeas();

  const byStatus = {
    pending:  ideas.filter(i => i.status === 'pending'),
    approved: ideas.filter(i => i.status === 'approved'),
    scripted: ideas.filter(i => i.status === ('scripted' as never)),
    rejected: ideas.filter(i => i.status === 'rejected'),
  };

  const activeCount = byStatus.pending.length + byStatus.approved.length + byStatus.scripted.length;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Ideias</h1>
          <p className="text-white/30 mt-1.5 text-sm">{ideas.length} ideias no total</p>
        </div>
        <div className="flex gap-5">
          {[
            { n: byStatus.pending.length,  label: 'Pendentes',  color: 'text-violet-400' },
            { n: byStatus.approved.length, label: 'Aprovadas',  color: 'text-emerald-400' },
            { n: byStatus.scripted.length, label: 'Com Script', color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.n}</div>
              <div className="text-[11px] text-white/25">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <GenerateIdeasBox currentCount={ideas.length} />
      </div>

      <GeneratingBanner itemCount={activeCount} />

      {byStatus.pending.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-400">Pendentes</span>
            <span className="text-xs text-white/20">{byStatus.pending.length}</span>
          </div>
          <div className="space-y-2">
            {byStatus.pending.map(idea => <IdeaRow key={idea.id} idea={idea} showActions />)}
          </div>
        </section>
      )}

      {byStatus.approved.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Aprovadas — aguardando script</span>
            <span className="text-xs text-white/20">{byStatus.approved.length}</span>
          </div>
          <div className="space-y-2">
            {byStatus.approved.map(idea => <IdeaRow key={idea.id} idea={idea} showScriptBtn />)}
          </div>
        </section>
      )}

      {byStatus.scripted.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Script gerado</span>
            <span className="text-xs text-white/20">{byStatus.scripted.length}</span>
          </div>
          <div className="space-y-2">
            {byStatus.scripted.map(idea => <IdeaRow key={idea.id} idea={idea} showScriptBtn />)}
          </div>
        </section>
      )}

      {byStatus.rejected.length > 0 && (
        <section className="mb-10 opacity-50">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-red-400/70">Rejeitadas</span>
            <span className="text-xs text-white/20">{byStatus.rejected.length}</span>
          </div>
          <div className="space-y-2">
            {byStatus.rejected.map(idea => <IdeaRow key={idea.id} idea={idea} />)}
          </div>
        </section>
      )}

      {ideas.length === 0 && (
        <div className="text-center py-24">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="text-white/40 font-medium">Nenhuma ideia ainda</div>
          <div className="text-white/20 text-sm mt-1">Clique em <strong className="text-indigo-400/80">+ Gerar 5 ideias</strong> para começar</div>
        </div>
      )}
    </div>
  );
}
