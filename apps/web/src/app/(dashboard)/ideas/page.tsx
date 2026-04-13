import { getDB } from '@/lib/supabase';
import { formatScore, scoreColor, statusBadgeColor, relativeTime } from '@/lib/utils';
import { ApprovalButton, GenerateButton } from '@/components/ActionButton';
import { GeneratingBanner } from '@/components/GeneratingBanner';
import type { Idea } from '@cg160/types';

export const revalidate = 0;

async function getAllIdeas() {
  const db = getDB();
  const [pending, approved, scripted, rejected] = await Promise.all([
    db.getIdeasByStatus('pending', 30),
    db.getIdeasByStatus('approved', 30),
    db.getIdeasByStatus('scripted' as never, 30),
    db.getIdeasByStatus('rejected', 20),
  ]);
  return { pending, approved, scripted, rejected };
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
                <GenerateButton type="script" ideaId={idea.id} label="Gerar Script" variant="primary" className="text-xs px-3 py-1.5 text-sm" />
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 text-right">
          <div className={`text-xl font-bold ${scoreColor(idea.total_score)}`}>
            {formatScore(idea.total_score)}
          </div>
          <div className="text-xs text-gray-600">score</div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <h2 className={`text-sm font-semibold ${color} uppercase tracking-wider mb-3`}>
      {label} ({count})
    </h2>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-8 text-gray-700 border border-dashed border-gray-800 rounded-lg">
      <div className="text-sm">Nenhuma ideia {label}</div>
    </div>
  );
}

export default async function IdeasPage() {
  const { pending, approved, scripted, rejected } = await getAllIdeas();
  const total = pending.length + approved.length + scripted.length + rejected.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Ideias</h1>
          <p className="text-gray-500 mt-1 text-sm">{total} ideias no total</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-yellow-400 font-bold text-lg">{pending.length}</div>
              <div className="text-gray-600 text-xs">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-bold text-lg">{approved.length}</div>
              <div className="text-gray-600 text-xs">Aprovadas</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-bold text-lg">{scripted.length}</div>
              <div className="text-gray-600 text-xs">Com Script</div>
            </div>
          </div>
          <GenerateButton type="ideas" count={5} label="+ Gerar Ideias" variant="primary" currentCount={total} />
        </div>
      </div>

      <GeneratingBanner itemCount={total} />

      {/* Pending */}
      <section className="mb-8">
        <SectionHeader label="Pendentes" count={pending.length} color="text-yellow-400" />
        {pending.length === 0
          ? <EmptyState label="pendente" />
          : <div className="space-y-3">
              {pending.map(idea => <IdeaRow key={idea.id} idea={idea} showActions />)}
            </div>
        }
      </section>

      {/* Approved — waiting for script */}
      <section className="mb-8">
        <SectionHeader label="Aprovadas — aguardando script" count={approved.length} color="text-green-400" />
        {approved.length === 0
          ? <EmptyState label="aprovada aguardando script" />
          : <div className="space-y-3">
              {approved.map(idea => <IdeaRow key={idea.id} idea={idea} showScriptBtn />)}
            </div>
        }
      </section>

      {/* Scripted */}
      {scripted.length > 0 && (
        <section className="mb-8">
          <SectionHeader label="Script gerado" count={scripted.length} color="text-blue-400" />
          <div className="space-y-3">
            {scripted.map(idea => <IdeaRow key={idea.id} idea={idea} showScriptBtn />)}
          </div>
        </section>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <section className="mb-8">
          <SectionHeader label="Rejeitadas" count={rejected.length} color="text-red-400" />
          <div className="space-y-3">
            {rejected.map(idea => <IdeaRow key={idea.id} idea={idea} />)}
          </div>
        </section>
      )}

      {total === 0 && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">💡</div>
          <div className="text-lg text-gray-500">Nenhuma ideia ainda</div>
          <div className="text-sm mt-2 text-gray-600">
            Clique em <strong className="text-indigo-400">+ Gerar Ideias</strong> para começar
          </div>
        </div>
      )}
    </div>
  );
}
