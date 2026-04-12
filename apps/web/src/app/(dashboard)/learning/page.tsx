import { getDB } from '@/lib/supabase';

export const revalidate = 300;

async function getLearningData() {
  const db = getDB();
  const weights = await db.getLearningWeights('script_scoring');
  return { weights };
}

export default async function LearningPage() {
  const { weights } = await getLearningData();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Learning Loop</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Dimension weights adjust daily based on performance correlations.
        </p>
      </div>

      {/* Scoring Dimension Weights */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          Scoring Weights
        </h2>
        <div className="space-y-2">
          {weights
            .sort((a, b) => b.current_weight - a.current_weight)
            .map(w => {
              const normalized = (w.current_weight - 0.3) / (3.0 - 0.3);
              const barWidth = Math.round(normalized * 100);
              const isAboveBaseline = w.current_weight > w.baseline_weight;
              const isBelowBaseline = w.current_weight < w.baseline_weight;

              return (
                <div key={w.feature_name} className="flex items-center gap-3">
                  <div className="w-44 text-xs text-gray-400 font-mono flex-shrink-0">
                    {w.feature_name.replace(/_/g, ' ')}
                  </div>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isAboveBaseline ? 'bg-green-500' : isBelowBaseline ? 'bg-red-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="w-12 text-right">
                    <span className={`text-xs font-mono font-bold ${
                      isAboveBaseline ? 'text-green-400' : isBelowBaseline ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {w.current_weight.toFixed(3)}
                    </span>
                  </div>
                  <div className="w-10 text-right">
                    <span className="text-xs text-gray-600 font-mono">
                      r={w.correlation_with_performance?.toFixed(2) ?? '—'}
                    </span>
                  </div>
                  <div className="w-8 text-right">
                    <span className="text-xs text-gray-600">n={w.sample_size}</span>
                  </div>
                  {w.locked && (
                    <span className="text-xs bg-yellow-900 text-yellow-300 px-1.5 py-0.5 rounded">locked</span>
                  )}
                </div>
              );
            })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-800 flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full inline-block" /> Above baseline</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-red-500 rounded-full inline-block" /> Below baseline</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-gray-500 rounded-full inline-block" /> At baseline (1.0)</span>
        </div>
      </div>

      {/* Learning Loop Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Loop Logic</h2>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex gap-3">
            <span className="text-blue-400 font-mono w-6 flex-shrink-0">1.</span>
            <span>Collect stabilized 72h performance metrics from all published videos</span>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 font-mono w-6 flex-shrink-0">2.</span>
            <span>Extract feature vectors (14 scoring dimensions + content attributes)</span>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 font-mono w-6 flex-shrink-0">3.</span>
            <span>Compute Pearson correlation between each dimension and performance_score</span>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 font-mono w-6 flex-shrink-0">4.</span>
            <span>Apply EMA adjustment: w_new = 0.85×w_old + 0.15×(1 + r×2.0×confidence)</span>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 font-mono w-6 flex-shrink-0">5.</span>
            <span>Clamp weights to [0.3, 3.0]. Write to database. Future scoring uses new weights.</span>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 font-mono w-6 flex-shrink-0">6.</span>
            <span>Minimum 20 videos required before first adjustment (prevents signal noise).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
