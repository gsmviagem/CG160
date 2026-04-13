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
    { label: 'Ideias Pendentes', value: stats.ideas_pending, color: 'text-yellow-400' },
    { label: 'Scripts Pendentes', value: stats.scripts_pending, color: 'text-blue-400' },
    { label: 'Vídeos para Revisar', value: stats.videos_pending_approval, color: 'text-purple-400' },
    { label: 'Publicados (7d)', value: stats.videos_published_7d, color: 'text-green-400' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Status do content engine</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <GenerateButton type="ideas" count={5} label="+ Gerar Ideias" variant="primary" currentCount={stats.ideas_pending} />
          <a href="/approval"
            className="text-sm px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-medium transition-colors">
            Fila de Aprovação →
          </a>
          <a href="/scripts"
            className="text-sm px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-medium transition-colors">
            Scripts →
          </a>
        </div>
      </div>

      <GeneratingBanner itemCount={stats.ideas_pending + stats.scripts_pending} />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* API Usage */}
      <div className="mb-6">
        <ApiUsageWidget ideasToday={stats.ideas_today} scriptsToday={stats.scripts_today} />
      </div>

      {/* Pipeline Status */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Pipeline</h2>
        <div className="space-y-3">
          {[
            { stage: 'Geração de Ideias',  description: 'Roda 1x/dia via Vercel Cron + manual' },
            { stage: 'Geração de Script',  description: 'Dispara ao aprovar uma ideia' },
            { stage: 'Scoring (14 dims)',  description: 'Avalia o script automaticamente' },
            { stage: 'Geração de Vídeo',   description: 'Manual via Veo 3 (script gerado pela IA)' },
            { stage: 'Métricas',           description: 'Sync manual por enquanto' },
            { stage: 'Learning Loop',      description: 'Roda diário às 3h — ajusta pesos do ML' },
          ].map(item => (
            <div key={item.stage} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white font-medium">{item.stage}</span>
                <span className="text-sm text-gray-500 ml-2">{item.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
