import { getDB } from '@/lib/supabase';
import { formatScore, scoreColor, statusBadgeColor, relativeTime } from '@/lib/utils';
import { ApprovalButton, GenerateButton, DeleteButton } from '@/components/ActionButton';
import { GeneratingBanner } from '@/components/GeneratingBanner';
import type { Idea } from '@cg160/types';

export const revalidate = 0;

async function getAllIdeas() {
  const db = getDB();
  return db.getAllIdeas(80);
}

function IdeaRow({ idea, showActions = false, showScriptBtn = false }: {
  idea: Idea;
  showActions?: boolean;
  showScriptBtn?: boolean;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadgeColor(idea.status)}`}>
              {idea.status}
            </span>
            {idea.narrative_type && (
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{idea.narrative_type}</span>
            )}
            {idea.format_type && (
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{idea.format_type}</span>
            )}
            {idea.target_emotion && (
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{idea.target_emotion}</span>
            )}
            <span className="text-xs text-gray-600 ml-auto">
              {idea.created_at ? relativeTime(idea.created_at) : ''}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white">{idea.title}</h3>
          <p className="text-sm text-gray-400 mt-1">{idea.concept}</p>
          {idea.hook_summary && (
            <p className="text-xs text-blue-400 italic mt-1">"{idea.hook_summary}"</p>
          )}
          {idea.rejection_reason && (
            <p className="text-xs text-red-400 mt-1">Motivo: {idea.rejection_reason}</p>
          )}

          {(showActions || showScriptBtn) && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {showActions && (
                <>
                  <ApprovalButton entityType="idea" entityId={idea.id} action="approved" label="Aprovar" variant="success" />
                  <ApprovalButton entityType="idea" entityId={idea.id} action="rejected" label="Rejeitar" variant="danger" />
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
            <div className={`text-xl font-bold ${scoreColor(idea.total_score)}`}>
              {formatScore(idea.total_score)}
            </div>
            <div className="text-xs text-gray-600">score</div>
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Ideias</h1>
          <p className="text-gray-500 mt-1 text-sm">{ideas.length} ideias no total</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-yellow-400 font-bold text-lg">{byStatus.pending.length}</div>
              <div className="text-gray-600 text-xs">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-bold text-lg">{byStatus.approved.length}</div>
              <div className="text-gray-600 text-xs">Aprovadas</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-bold text-lg">{byStatus.scripted.length}</div>
              <div className="text-gray-600 text-xs">Com Script</div>
            </div>
          </div>
          <GenerateButton type="ideas" count={5} label="+ Gerar Ideias" variant="primary" currentCount={ideas.length} />
        </div>
      </div>

      <GeneratingBanner itemCount={activeCount} />

      {/* Pending */}
      {byStatus.pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3">
            Pendentes ({byStatus.pending.length})
          </h2>
          <div className="space-y-3">
            {byStatus.pending.map(idea => <IdeaRow key={idea.id} idea={idea} showActions />)}
          </div>
        </section>
      )}

      {/* Approved waiting for script */}
      {byStatus.approved.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">
            Aprovadas — aguardando script ({byStatus.approved.length})
          </h2>
          <div className="space-y-3">
            {byStatus.approved.map(idea => <IdeaRow key={idea.id} idea={idea} showScriptBtn />)}
          </div>
        </section>
      )}

      {/* Scripted */}
      {byStatus.scripted.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">
            Script gerado ({byStatus.scripted.length})
          </h2>
          <div className="space-y-3">
            {byStatus.scripted.map(idea => <IdeaRow key={idea.id} idea={idea} showScriptBtn />)}
          </div>
        </section>
      )}

      {/* Rejected */}
      {byStatus.rejected.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">
            Rejeitadas ({byStatus.rejected.length})
          </h2>
          <div className="space-y-3 opacity-70">
            {byStatus.rejected.map(idea => <IdeaRow key={idea.id} idea={idea} />)}
          </div>
        </section>
      )}

      {ideas.length === 0 && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">💡</div>
          <div className="text-lg text-gray-500">Nenhuma ideia ainda</div>
          <div className="text-sm mt-2">
            Clique em <strong className="text-indigo-400">+ Gerar Ideias</strong> para começar
          </div>
        </div>
      )}
    </div>
  );
}
