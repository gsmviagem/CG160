import { getDB } from '@/lib/supabase';
import { scoreColor, formatScore, relativeTime } from '@/lib/utils';

export const revalidate = 60;

async function getStats() {
  const db = getDB();
  return db.getDashboardStats();
}

export default async function DashboardPage() {
  const stats = await getStats();

  const statCards = [
    { label: 'Ideas Pending', value: stats.ideas_pending, color: 'text-yellow-400' },
    { label: 'Scripts Pending', value: stats.scripts_pending, color: 'text-blue-400' },
    { label: 'Videos to Review', value: stats.videos_pending_approval, color: 'text-purple-400' },
    { label: 'Published (7d)', value: stats.videos_published_7d, color: 'text-green-400' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Content engine status</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline Status */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Pipeline</h2>
        <div className="space-y-3">
          {[
            { stage: 'Idea Generation', status: 'active', description: 'Runs every 6h via Vercel Cron' },
            { stage: 'Script Generation', status: 'active', description: 'Runs every 4h on approved ideas' },
            { stage: 'Scoring', status: 'active', description: 'Scores scripts on 14 dimensions' },
            { stage: 'Video Generation', status: 'active', description: 'Runs on approved scripts' },
            { stage: 'Publishing', status: 'active', description: 'Runs every 15min on scheduled videos' },
            { stage: 'Metrics Sync', status: 'active', description: 'Runs every 1h on published videos' },
            { stage: 'Learning Loop', status: 'active', description: 'Runs daily at 3am — adjusts weights' },
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
