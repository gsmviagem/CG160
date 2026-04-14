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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Learning Loop</h1>
        <p className="text-white/30 mt-1.5 text-sm">
          Pesos das dimensões ajustados diariamente com base em correlações de performance.
        </p>
      </div>

      {/* Weight bars */}
      <div className="bg-white/[0.03] rounded-2xl p-6 mb-6">
        <div className="text-xs text-white/25 font-semibold uppercase tracking-widest mb-6">Scoring Weights</div>
        <div className="space-y-3">
          {weights
            .sort((a, b) => b.current_weight - a.current_weight)
            .map(w => {
              const normalized = (w.current_weight - 0.3) / (3.0 - 0.3);
              const barWidth   = Math.round(normalized * 100);
              const above      = w.current_weight > w.baseline_weight;
              const below      = w.current_weight < w.baseline_weight;
              const [g1, g2, glow] = above
                ? ['from-emerald-500', 'to-green-400',  '0 0 8px rgba(52,211,153,0.5)']
                : below
                ? ['from-red-500',     'to-rose-400',   '0 0 8px rgba(239,68,68,0.4)']
                : ['from-blue-500',    'to-indigo-400', '0 0 8px rgba(99,102,241,0.3)'];

              return (
                <div key={w.feature_name} className="flex items-center gap-3">
                  <div className="w-44 text-xs text-white/55 font-mono flex-shrink-0 truncate">
                    {w.feature_name.replace(/_/g, ' ')}
                  </div>
                  <div className="flex-1 h-[5px] bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${g1} ${g2}`}
                      style={{
                        width: `${barWidth}%`,
                        boxShadow: barWidth > 10 ? glow : 'none',
                        transition: 'width 0.8s cubic-bezier(0.34,1.2,0.64,1)',
                      }}
                    />
                  </div>
                  <div className="w-14 text-right">
                    <span className={`text-xs font-mono font-bold ${above ? 'text-emerald-400' : below ? 'text-red-400' : 'text-white/40'}`}>
                      {w.current_weight.toFixed(3)}
                    </span>
                  </div>
                  <div className="w-12 text-right">
                    <span className="text-[11px] text-white/25 font-mono">
                      r={w.correlation_with_performance?.toFixed(2) ?? '—'}
                    </span>
                  </div>
                  <div className="w-8 text-right">
                    <span className="text-[11px] text-white/20">n={w.sample_size}</span>
                  </div>
                  {w.locked && (
                    <span className="text-[10px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-lg">locked</span>
                  )}
                </div>
              );
            })}
        </div>

        <div className="mt-6 pt-5 flex gap-5 flex-wrap">
          {[
            { color: 'bg-emerald-400', label: 'Acima da baseline' },
            { color: 'bg-red-400',     label: 'Abaixo da baseline' },
            { color: 'bg-blue-400',    label: 'Na baseline (1.0)' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-[11px] text-white/30">
              <span className={`w-1.5 h-1.5 rounded-full ${color}`} style={color === 'bg-emerald-400' ? { boxShadow: '0 0 6px rgba(52,211,153,0.7)' } : {}} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Loop logic */}
      <div className="bg-white/[0.03] rounded-2xl p-6">
        <div className="text-xs text-white/25 font-semibold uppercase tracking-widest mb-5">Loop Logic</div>
        <div className="space-y-4">
          {[
            'Coleta métricas de performance estabilizadas (72h) de todos os vídeos publicados',
            'Extrai vetores de features (14 dimensões + atributos de conteúdo)',
            'Calcula correlação de Pearson entre cada dimensão e o performance_score',
            'Aplica ajuste EMA: w_new = 0.85×w_old + 0.15×(1 + r×2.0×confidence)',
            'Clamp dos pesos para [0.3, 3.0]. Escreve no banco. Próximo scoring usa os novos pesos.',
            'Mínimo de 20 vídeos necessários antes do primeiro ajuste (evita ruído de sinal).',
          ].map((step, i) => (
            <div key={i} className="flex gap-4 group">
              <span className="text-xs font-bold text-indigo-400/50 group-hover:text-indigo-400 transition-colors font-mono w-5 flex-shrink-0 mt-0.5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors leading-relaxed">
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
