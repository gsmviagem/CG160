import { getDB } from '@/lib/supabase';
import { scoreColor } from '@/lib/utils';
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
  const pct   = Math.min(100, Math.round((weight.current_weight / 2) * 100));
  const above = weight.current_weight >= 1.2;
  const below = weight.current_weight < 0.8;
  const [g1, g2, glow] = above
    ? ['from-emerald-500', 'to-green-400',  '0 0 8px rgba(52,211,153,0.5)']
    : below
    ? ['from-red-500',     'to-rose-400',   '0 0 8px rgba(239,68,68,0.4)']
    : ['from-blue-500',    'to-indigo-400', '0 0 8px rgba(99,102,241,0.4)'];

  const label = weight.feature_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-white/60">{label}</span>
        <span className={`text-xs font-mono font-bold ${above ? 'text-emerald-400' : below ? 'text-red-400' : 'text-white/50'}`}>
          {weight.current_weight.toFixed(3)}
        </span>
      </div>
      <div className="h-[5px] bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${g1} ${g2}`}
          style={{ width: `${pct}%`, boxShadow: pct > 10 ? glow : 'none', transition: 'width 0.8s cubic-bezier(0.34,1.2,0.64,1)' }}
        />
      </div>
    </div>
  );
}

function MetricRow({ video, metrics }: { video: Video; metrics: PerformanceMetrics }) {
  return (
    <div className="bg-white/[0.04] hover:bg-white/[0.06] transition-colors duration-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white/90 truncate">{video.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            {video.platform && (
              <span className="text-xs bg-white/[0.07] text-white/50 px-2 py-0.5 rounded-lg capitalize">{video.platform}</span>
            )}
            <span className="text-xs text-white/25">
              {new Date(metrics.measured_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        {metrics.performance_score !== null && metrics.performance_score !== undefined && (
          <div className="text-right flex-shrink-0">
            <div className={`text-2xl font-bold ${scoreColor(metrics.performance_score * 10)}`}>
              {metrics.performance_score.toFixed(2)}
            </div>
            <div className="text-[11px] text-white/20">perf score</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {[
          { label: 'Views',      value: metrics.views?.toLocaleString() },
          { label: 'Likes',      value: metrics.likes?.toLocaleString() },
          { label: 'Comentários',value: metrics.comments?.toLocaleString() },
          { label: 'Shares',     value: metrics.shares?.toLocaleString() },
          { label: 'Saves',      value: metrics.saves?.toLocaleString() },
          { label: 'Follows',    value: metrics.follows_from_video?.toLocaleString() },
          { label: 'Completion', value: metrics.completion_rate != null ? `${(metrics.completion_rate * 100).toFixed(0)}%` : null },
          { label: 'Engajamento',value: metrics.engagement_ratio  != null ? `${(metrics.engagement_ratio * 100).toFixed(1)}%` : null },
        ].map(({ label, value }) => (
          <div key={label} className="text-center bg-white/[0.03] rounded-xl py-2">
            <div className="text-[10px] text-white/25">{label}</div>
            <div className="text-sm font-semibold text-white/80 mt-0.5">{value ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const { stats, weights, stabilized } = await getAnalyticsData();

  const totalViews    = stabilized.reduce((s, { metrics }) => s + (metrics.views ?? 0), 0);
  const avgCompletion = stabilized.length > 0
    ? stabilized.reduce((s, { metrics }) => s + (metrics.completion_rate ?? 0), 0) / stabilized.length : null;
  const avgEngagement = stabilized.length > 0
    ? stabilized.reduce((s, { metrics }) => s + (metrics.engagement_ratio ?? 0), 0) / stabilized.length : null;

  const sortedWeights = [...weights].sort((a, b) => b.current_weight - a.current_weight);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-white/30 mt-1.5 text-sm">Performance e evolução dos pesos de aprendizado</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { label: 'Publicados (7d)',    value: stats.videos_published_7d,                                              sub: 'últimos 7 dias',    color: 'text-emerald-400' },
          { label: 'Views totais',       value: totalViews.toLocaleString(),                                             sub: 'todo o tempo',      color: 'text-blue-400'    },
          { label: 'Conclusão média',    value: avgCompletion != null ? `${(avgCompletion * 100).toFixed(0)}%` : '—',   sub: 'vídeos estáveis',   color: 'text-violet-400'  },
          { label: 'Engajamento médio',  value: avgEngagement != null ? `${(avgEngagement * 100).toFixed(1)}%` : '—',  sub: 'vídeos estáveis',   color: 'text-amber-400'   },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white/[0.04] hover:bg-white/[0.06] transition-colors rounded-2xl p-5">
            <div className="text-[11px] text-white/25 font-medium mb-2">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-[11px] text-white/20 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Learning Weights */}
        <div>
          <div className="text-xs text-white/25 font-semibold uppercase tracking-widest mb-5">Learning Weights</div>
          <div className="bg-white/[0.03] rounded-2xl p-5">
            {sortedWeights.length === 0 ? (
              <div className="text-sm text-white/30 text-center py-6">Nenhum peso carregado</div>
            ) : (
              <div className="space-y-4">
                {sortedWeights.map(w => <WeightBar key={w.feature_name} weight={w} />)}
              </div>
            )}
            <div className="mt-6 pt-4 flex gap-4 flex-wrap">
              {[
                { color: 'bg-emerald-400', label: 'Acima da baseline' },
                { color: 'bg-red-400',     label: 'Abaixo da baseline' },
                { color: 'bg-blue-400',    label: 'Na baseline (1.0)' },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-[11px] text-white/30">
                  <span className={`w-1.5 h-1.5 rounded-full ${color}`} /> {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline health */}
        <div>
          <div className="text-xs text-white/25 font-semibold uppercase tracking-widest mb-5">Pipeline Health</div>
          <div className="bg-white/[0.03] rounded-2xl p-5 space-y-4 mb-4">
            {[
              { label: 'Ideias pendentes',        value: stats.ideas_pending,           color: 'text-violet-400' },
              { label: 'Scripts pendentes',       value: stats.scripts_pending,         color: 'text-blue-400'   },
              { label: 'Vídeos para aprovar',     value: stats.videos_pending_approval, color: 'text-indigo-400' },
              { label: 'Publicados (7d)',          value: stats.videos_published_7d,     color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-white/50">{label}</span>
                <span className={`text-xl font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="text-xs text-white/25 font-semibold uppercase tracking-widest mb-4">
            Vídeos estáveis ({stabilized.length})
          </div>
          <div className="bg-white/[0.03] rounded-2xl p-5">
            {stabilized.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-sm text-white/30">Nenhum dado estável ainda</div>
                <div className="text-xs text-white/20 mt-1">Vídeos estabilizam após 48h de métricas</div>
              </div>
            ) : (
              <div className="text-xs text-white/30">
                {stabilized.length} vídeos com métricas estáveis alimentam o loop
              </div>
            )}
          </div>
        </div>
      </div>

      {stabilized.length > 0 && (
        <section className="mt-10">
          <div className="text-xs text-white/25 font-semibold uppercase tracking-widest mb-5">Detalhes de Performance</div>
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
