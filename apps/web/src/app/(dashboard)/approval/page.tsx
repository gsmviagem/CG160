import { getDB } from '@/lib/supabase';
import { formatScore, scoreColor, statusBadgeColor, relativeTime } from '@/lib/utils';
import type { Idea, Script, Video } from '@cg160/types';

export const revalidate = 0;

async function getApprovalQueue() {
  const db = getDB();
  const [ideas, scripts, videos] = await Promise.all([
    db.getIdeasByStatus('pending', 20),
    db.getScriptsByStatus('pending', 20),
    db.getVideosByStatus('ready', 20),
  ]);
  return { ideas, scripts, videos };
}

function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wider">Idea</span>
          <h3 className="text-sm font-semibold text-white mt-0.5">{idea.title}</h3>
        </div>
        <div className={`text-lg font-bold ${scoreColor(idea.total_score)}`}>
          {formatScore(idea.total_score)}
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-3">{idea.concept}</p>
      {idea.hook_summary && (
        <p className="text-xs text-blue-400 italic mb-3">Hook: "{idea.hook_summary}"</p>
      )}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {idea.narrative_type && (
          <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{idea.narrative_type}</span>
        )}
        {idea.format_type && (
          <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{idea.format_type}</span>
        )}
        {idea.target_emotion && (
          <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{idea.target_emotion}</span>
        )}
      </div>
      <div className="flex gap-2">
        <ApprovalButton entityType="idea" entityId={idea.id} action="approved" label="Approve" variant="success" />
        <ApprovalButton entityType="idea" entityId={idea.id} action="rejected" label="Reject" variant="danger" />
        <ApprovalButton entityType="idea" entityId={idea.id} action="regenerate_requested" label="Regenerate" variant="neutral" />
      </div>
    </div>
  );
}

function ScriptCard({ script }: { script: Script }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wider">Script</span>
          <h3 className="text-sm font-semibold text-white mt-0.5">{script.title}</h3>
        </div>
        <div className={`text-lg font-bold ${scoreColor(script.total_score)}`}>
          {formatScore(script.total_score)}
        </div>
      </div>
      <p className="text-xs text-blue-400 italic mb-3">Hook: "{script.hook}"</p>
      <p className="text-sm text-gray-400 mb-3 line-clamp-3">{script.content}</p>
      <div className="grid grid-cols-7 gap-1 mb-3">
        {[
          ['H', script.hook_strength],
          ['C', script.clarity_score],
          ['E', script.emotional_trigger_score],
          ['Q', script.curiosity_gap_score],
          ['P', script.punchline_strength],
          ['S', script.shareability_score],
          ['N', script.novelty_score],
        ].map(([label, score]) => (
          <div key={String(label)} className="text-center">
            <div className="text-xs text-gray-600">{label}</div>
            <div className={`text-xs font-bold ${scoreColor((score as number | null) ? (score as number) * 10 : null)}`}>
              {score !== null && score !== undefined ? Number(score).toFixed(1) : '—'}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <ApprovalButton entityType="script" entityId={script.id} action="approved" label="Approve" variant="success" />
        <ApprovalButton entityType="script" entityId={script.id} action="rejected" label="Reject" variant="danger" />
        <ApprovalButton entityType="script" entityId={script.id} action="regenerate_requested" label="Regenerate" variant="neutral" />
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: Video }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt="" className="w-16 h-28 object-cover rounded flex-shrink-0 bg-gray-800" />
        ) : (
          <div className="w-16 h-28 rounded bg-gray-800 flex items-center justify-center flex-shrink-0">
            <span className="text-gray-600 text-xs">No thumb</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Video</span>
          <h3 className="text-sm font-semibold text-white mt-0.5">{video.title}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {video.platform && (
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded capitalize">{video.platform}</span>
            )}
            {video.duration_seconds && (
              <span className="text-xs text-gray-500">{video.duration_seconds.toFixed(0)}s</span>
            )}
            {video.ai_provider && (
              <span className="text-xs text-gray-500">{video.ai_provider}</span>
            )}
          </div>
          {video.storage_url && (
            <a href={video.storage_url} target="_blank" rel="noopener noreferrer"
               className="text-xs text-blue-400 hover:text-blue-300 mt-2 block">
              Preview video
            </a>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <ApprovalButton entityType="video" entityId={video.id} action="approved" label="Approve" variant="success" />
        <ApprovalButton entityType="video" entityId={video.id} action="rejected" label="Reject" variant="danger" />
        <ApprovalButton entityType="video" entityId={video.id} action="regenerate_requested" label="Regenerate" variant="neutral" />
      </div>
    </div>
  );
}

function ApprovalButton({
  entityType, entityId, action, label, variant,
}: {
  entityType: string; entityId: string; action: string; label: string;
  variant: 'success' | 'danger' | 'neutral';
}) {
  const colors = {
    success: 'bg-green-800 hover:bg-green-700 text-green-100',
    danger: 'bg-red-900 hover:bg-red-800 text-red-100',
    neutral: 'bg-gray-800 hover:bg-gray-700 text-gray-300',
  };

  return (
    <form action={`/api/approval`} method="POST">
      <input type="hidden" name="entity_type" value={entityType} />
      <input type="hidden" name="entity_id" value={entityId} />
      <input type="hidden" name="action" value={action} />
      <button type="submit"
        className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${colors[variant]}`}>
        {label}
      </button>
    </form>
  );
}

export default async function ApprovalPage() {
  const { ideas, scripts, videos } = await getApprovalQueue();
  const total = ideas.length + scripts.length + videos.length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Approval Queue</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {total} item{total !== 1 ? 's' : ''} waiting for review
        </p>
      </div>

      {total === 0 && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">✓</div>
          <div className="text-lg">Queue is empty</div>
          <div className="text-sm mt-1">All caught up</div>
        </div>
      )}

      {/* Videos first — highest priority */}
      {videos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">
            Videos ({videos.length})
          </h2>
          <div className="space-y-3">
            {videos.map(video => <VideoCard key={video.id} video={video} />)}
          </div>
        </section>
      )}

      {/* Scripts */}
      {scripts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">
            Scripts ({scripts.length})
          </h2>
          <div className="space-y-3">
            {scripts.map(script => <ScriptCard key={script.id} script={script} />)}
          </div>
        </section>
      )}

      {/* Ideas */}
      {ideas.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3">
            Ideas ({ideas.length})
          </h2>
          <div className="space-y-3">
            {ideas.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
          </div>
        </section>
      )}
    </div>
  );
}
