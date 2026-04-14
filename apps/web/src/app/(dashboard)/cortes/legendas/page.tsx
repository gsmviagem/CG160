'use client';

import { useState } from 'react';

const STYLES  = ['Minimal', 'Destaque', 'Cinético', 'Clássico'] as const;
const POSITIONS = ['Topo', 'Centro', 'Base'] as const;

export default function Legendas() {
  const [lang,  setLang]  = useState('pt-BR');
  const [style, setStyle] = useState<string>('Minimal');
  const [pos,   setPos]   = useState<string>('Base');

  return (
    <div className="p-8 max-w-3xl mx-auto">

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Legendas</h1>
        <p className="text-white/30 mt-1.5 text-sm">
          Geração automática com sincronização frame a frame.
        </p>
      </div>

      {/* Config */}
      <div className="space-y-6 mb-10">

        {/* Idioma */}
        <div>
          <label className="text-xs text-white/25 font-semibold uppercase tracking-widest mb-3 block">Idioma</label>
          <div className="flex gap-2">
            {[['pt-BR','Português (BR)'], ['en-US','English (US)'], ['es','Español']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setLang(v)}
                className={`
                  text-xs px-4 py-2 rounded-xl font-medium transition-all duration-200
                  ${lang === v
                    ? 'bg-red-600/50 text-white'
                    : 'bg-white/[0.04] text-white/35 hover:text-white/60 hover:bg-white/[0.07]'
                  }
                `}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Estilo */}
        <div>
          <label className="text-xs text-white/25 font-semibold uppercase tracking-widest mb-3 block">Estilo</label>
          <div className="flex gap-2">
            {STYLES.map(s => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`
                  text-xs px-4 py-2 rounded-xl font-medium transition-all duration-200
                  ${style === s
                    ? 'bg-red-600/50 text-white'
                    : 'bg-white/[0.04] text-white/35 hover:text-white/60 hover:bg-white/[0.07]'
                  }
                `}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Posição */}
        <div>
          <label className="text-xs text-white/25 font-semibold uppercase tracking-widest mb-3 block">Posição</label>
          <div className="flex gap-2">
            {POSITIONS.map(p => (
              <button
                key={p}
                onClick={() => setPos(p)}
                className={`
                  text-xs px-4 py-2 rounded-xl font-medium transition-all duration-200
                  ${pos === p
                    ? 'bg-red-600/50 text-white'
                    : 'bg-white/[0.04] text-white/35 hover:text-white/60 hover:bg-white/[0.07]'
                  }
                `}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-white/25 font-semibold uppercase tracking-widest">
            Clipes aguardando
          </div>
          <span className="text-xs text-white/15">0 clipes</span>
        </div>

        <div className="bg-white/[0.03] rounded-2xl p-14 text-center">
          <div className="text-white/30 text-sm font-medium mb-1">Nenhum clipe aguardando</div>
          <p className="text-white/15 text-xs">Clipes cortados aparecem aqui automaticamente</p>
        </div>
      </div>

    </div>
  );
}
