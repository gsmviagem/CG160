import { getDB } from '@/lib/supabase';
import { GenerateButton } from '@/components/ActionButton';
import { GeneratingBanner } from '@/components/GeneratingBanner';
import { ApiUsageWidget } from '@/components/ApiUsageWidget';

export const revalidate = 60;

async function getStats() {
  const db = getDB();
  const [stats, today] = await Promise.all([
    db.getDashboardStats(),
    db.getTodayStats(),
  ]);
  return { ...stats, ...today };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const statCards = [
    { label: 'Ideias Pendentes',    value: stats.ideas_pending,           color: 'text-violet-400' },
    { label: 'Scripts Pendentes',   value: stats.scripts_pending,         color: 'text-blue-400'   },
    { label: 'Vídeos para Revisar', value: stats.videos_pending_approval, color: 'text-indigo-400' },
    { label: 'Publicados (7d)',      value: stats.videos_published_7d,    color: 'text-cyan-400'   },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-white/30 mt-1.5 text-sm">Status do content engine</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <GenerateButton type="ideas" count={5} label="+ Ideias" variant="primary" currentCount={stats.ideas_pending} />
          <a href="/approval"
            className="text-sm px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-white/60 hover:text-white rounded-xl font-medium transition-all duration-200">
            Aprovação →
          </a>
          <a href="/scripts"
            className="text-sm px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-white/60 hover:text-white rounded-xl font-medium transition-all duration-200">
            Scripts →
          </a>
        </div>
      </div>

      <GeneratingBanner itemCount={stats.ideas_pending + stats.scripts_pending} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="bg-white/[0.04] hover:bg-white/[0.06] transition-colors duration-200 rounded-2xl p-5">
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-white/30 font-medium mt-1.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* API Usage */}
      <div className="mb-6">
        <ApiUsageWidget ideasToday={stats.ideas_today} scriptsToday={stats.scripts_today} />
      </div>

      {/* Pipeline */}
      <div className="bg-white/[0.03] rounded-2xl p-6">
        <div className="text-xs text-white/25 font-semibold uppercase tracking-widest mb-5">Pipeline</div>
        <div className="space-y-1">
          {[
            { stage: 'Geração de Ideias',  desc: 'Roda 1×/dia via Vercel Cron + manual',       active: true  },
            { stage: 'Geração de Script',  desc: 'Dispara ao aprovar uma ideia',                active: true  },
            { stage: 'Scoring (14 dims)',  desc: 'Avalia o script automaticamente',             active: true  },
            { stage: 'Geração de Vídeo',   desc: 'Manual via Veo 3',                           active: true  },
            { stage: 'Métricas',           desc: 'Sync manual por enquanto',                   active: false },
            { stage: 'Learning Loop',      desc: 'Roda diário às 3h — ajusta pesos do ML',     active: true  },
          ].map(item => (
            <div
              key={item.stage}
              className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-colors duration-150 group"
            >
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.active ? 'bg-emerald-400' : 'bg-white/15'}`}
                style={item.active ? { boxShadow: '0 0 6px rgba(52,211,153,0.8)' } : {}} />
              <span className="text-sm text-white/70 font-medium group-hover:text-white transition-colors">{item.stage}</span>
              <span className="text-sm text-white/25 ml-1">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
