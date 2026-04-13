// ============================================================
// CG 160 — Ideas Page
// ============================================================

import { getDB } from '@/lib/supabase';
import { formatScore, scoreColor, statusBadgeColor, relativeTime } from '@/lib/utils';
import type { Idea } from '@cg160/types';

export const revalidate = 0;

async function getAllIdeas() {
  const db = getDB();
  const [pending, approved, rejected] = await Promise.all([
    db.getIdeasByStatus('pending', 30),
    db.getIdeasByStatus('approved', 30),
    db.getIdeasByStatus('rejected', 20),
  ]);
  return { pending, approved, rejected };
}

function IdeaRow({ idea }: { idea: Idea }) {
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
            <p className="text-xs text-red-400 mt-1">Rejected: {idea.rejection_reason}</p>
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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-10 text-gray-700 border border-dashed border-gray-800 rounded-lg">
      <div className="text-sm">No {label} ideas</div>
    </div>
  );
}

export default async function IdeasPage() {
  const { pending, approved, rejected } = await getAllIdeas();
  const total = pending.length + approved.length + rejected.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ideas</h1>
          <p className="text-gray-500 mt-1 text-sm">{total} total ideas generated</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-yellow-400 font-bold text-lg">{pending.length}</div>
            <div className="text-gray-600 text-xs">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-bold text-lg">{approved.length}</div>
            <div className="text-gray-600 text-xs">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-red-400 font-bold text-lg">{rejected.length}</div>
            <div className="text-gray-600 text-xs">Rejected</div>
          </div>
        </div>
      </div>

      {/* Pending */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3">
          Pending Review ({pending.length})
        </h2>
        {pending.length === 0
          ? <EmptyState label="pending" />
          : <div className="space-y-3">{pending.map(idea => <IdeaRow key={idea.id} idea={idea} />)}</div>
        }
      </section>

      {/* Approved */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">
          Approved ({approved.length})
        </h2>
        {approved.length === 0
          ? <EmptyState label="approved" />
          : <div className="space-y-3">{approved.map(idea => <IdeaRow key={idea.id} idea={idea} />)}</div>
        }
      </section>

      {/* Rejected */}
      {rejected.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">
            Rejected ({rejected.length})
          </h2>
          <div className="space-y-3">
            {rejected.map(idea => <IdeaRow key={idea.id} idea={idea} />)}
          </div>
        </section>
      )}

      {total === 0 && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">💡</div>
          <div className="text-lg text-gray-500">No ideas yet</div>
          <div className="text-sm mt-1">The daily cron will generate ideas automatically</div>
        </div>
      )}
    </div>
  );
}
