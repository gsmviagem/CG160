// ============================================================
// CG 160 — Analytics Page
// ============================================================

import { getDB } from '@/lib/supabase';
import { formatScore, scoreColor } from '@/lib/utils';
import type { LearningWeight, PerformanceMetrics, Video } from '@cg160/types';

export const revalidate = 0;

async function getAnalyticsData() {
  const db = getDB();
  const [stats, weights, stabilized] = await Promise.all([
    db.getDashboardStats(),
    db.getLearningWeights('script_scoring'),
    db.getStabilizedMetricsWithVideos(),
  ]);
  return { stats, weights, stabilized };
}

function WeightBar({ weight }: { weight: LearningWeight }) {
  const pct = Math.min(100, Math.round((weight.current_weight / 2) * 100));
  const color = weight.current_weight >= 1.2
    ? 'bg-green-500'
    : weight.current_weight >= 0.8
    ? 'bg-blue-500'
    : 'bg-red-500';

  const label = weight.feature_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-300">{label}</span>
        <span className="text-xs font-mono text-gray-400">{weight.current_weight.toFixed(3)}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MetricRow({ video, metrics }: { video: Video; metrics: PerformanceMetrics }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{video.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            {video.platform && (
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded capitalize">{video.platform}</span>
            )}
            <span className="text-xs text-gray-600">
              {new Date(metrics.measured_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        {metrics.performance_score !== null && metrics.performance_score !== undefined && (
          <div className="text-right flex-shrink-0">
            <div className={`text-xl font-bold ${scoreColor(metrics.performance_score * 10)}`}>
              {metrics.performance_score.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">perf score</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {[
          { label: 'Views', value: metrics.views?.toLocaleString() },
          { label: 'Likes', value: metrics.likes?.toLocaleString() },
          { label: 'Comments', value: metrics.comments?.toLocaleString() },
          { label: 'Shares', value: metrics.shares?.toLocaleString() },
          { label: 'Saves', value: metrics.saves?.toLocaleString() },
          { label: 'Follows', value: metrics.follows_from_video?.toLocaleString() },
          {
            label: 'Completion',
            value: metrics.completion_rate !== null && metrics.completion_rate !== undefined
              ? `${(metrics.completion_rate * 100).toFixed(0)}%`
              : null,
          },
          {
            label: 'Engagement',
            value: metrics.engagement_ratio !== null && metrics.engagement_ratio !== undefined
              ? `${(metrics.engagement_ratio * 100).toFixed(1)}%`
              : null,
          },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-xs text-gray-600">{label}</div>
            <div className="text-sm font-semibold text-white">{value ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const { stats, weights, stabilized } = await getAnalyticsData();

  const totalViews = stabilized.reduce((sum, { metrics }) => sum + (metrics.views ?? 0), 0);
  const avgCompletion = stabilized.length > 0
    ? stabilized.reduce((sum, { metrics }) => sum + (metrics.completion_rate ?? 0), 0) / stabilized.length
    : null;
  const avgEngagement = stabilized.length > 0
    ? stabilized.reduce((sum, { metrics }) => sum + (metrics.engagement_ratio ?? 0), 0) / stabilized.length
    : null;

  const sortedWeights = [...weights].sort((a, b) => b.current_weight - a.current_weight);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Performance data and learning weight evolution
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Videos Published', value: stats.videos_published_7d, sub: 'last 7 days', color: 'text-green-400' },
          { label: 'Total Views', value: totalViews.toLocaleString(), sub: 'all time', color: 'text-blue-400' },
          {
            label: 'Avg Completion',
            value: avgCompletion !== null ? `${(avgCompletion * 100).toFixed(0)}%` : '—',
            sub: 'stabilized videos',
            color: 'text-purple-400',
          },
          {
            label: 'Avg Engagement',
            value: avgEngagement !== null ? `${(avgEngagement * 100).toFixed(1)}%` : '—',
            sub: 'stabilized videos',
            color: 'text-yellow-400',
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-600 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Learning Weights */}
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Learning Weights
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            {sortedWeights.length === 0 ? (
              <div className="text-sm text-gray-600 text-center py-4">No weights loaded</div>
            ) : (
              <div className="space-y-3">
                {sortedWeights.map(w => <WeightBar key={w.feature_name} weight={w} />)}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-600">
                Weights adjust automatically via EMA as videos accumulate performance data.
                {' '}Green = high importance, Red = being de-prioritised by ML.
              </p>
            </div>
          </div>
        </div>

        {/* Pipeline health */}
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Pipeline Health
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            {[
              { label: 'Ideas pending review', value: stats.ideas_pending, color: 'text-yellow-400' },
              { label: 'Scripts pending review', value: stats.scripts_pending, color: 'text-blue-400' },
              { label: 'Videos ready to approve', value: stats.videos_pending_approval, color: 'text-purple-400' },
              { label: 'Videos published (7d)', value: stats.videos_published_7d, color: 'text-green-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{label}</span>
                <span className={`text-lg font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mt-6 mb-4">
            Stabilized Videos ({stabilized.length})
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            {stabilized.length === 0 ? (
              <div className="text-center py-6 text-gray-600">
                <div className="text-sm">No stabilized data yet</div>
                <div className="text-xs mt-1">Videos stabilize after 48h of performance tracking</div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 mb-2">
                {stabilized.length} videos with stable metrics feed the learning loop
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance table */}
      {stabilized.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Performance Details
          </h2>
          <div className="space-y-3">
            {stabilized.map(({ video, metrics }) => (
              <MetricRow key={metrics.id} video={video} metrics={metrics} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
