'use client';

import { useState } from 'react';

const PLATFORMS = [
  { name: 'TikTok',           icon: '◆' },
  { name: 'Instagram Reels',  icon: '◈' },
  { name: 'YouTube Shorts',   icon: '▶' },
];

export default function Publicar() {
  const [postsPerDay, setPostsPerDay] = useState('2');
  const [baseTime, setBaseTime]       = useState('18:00');

  return (
    <div className="p-8 max-w-3xl mx-auto">

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Publicar</h1>
        <p className="text-white/30 mt-1.5 text-sm">
          Configure plataformas, horários e postagem automática.
        </p>
      </div>

      {/* Platforms */}
      <div className="mb-8">
        <div className="text-xs text-white/25 font-semibold uppercase tracking-widest mb-4">
          Plataformas conectadas
        </div>
        <div className="space-y-2">
          {PLATFORMS.map(p => (
            <div
              key={p.name}
              className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.05] rounded-2xl px-5 py-4 transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-white/20 text-sm">{p.icon}</span>
                <span className="text-sm font-medium text-white/60">{p.name}</span>
              </div>
              <button className="
                text-xs font-semibold px-4 py-1.5 rounded-lg
                bg-white/[0.05] hover:bg-red-600/40 text-white/35 hover:text-white
                transition-all duration-200
              ">
                Conectar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule */}
      <div className="mb-8">
        <div className="text-xs text-white/25 font-semibold uppercase tracking-widest mb-4">
          Agendamento
        </div>
        <div className="bg-white/[0.03] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/50">Posts por dia</label>
            <div className="flex gap-1">
              {['1','2','3','4'].map(n => (
                <button
                  key={n}
                  onClick={() => setPostsPerDay(n)}
                  className={`
                    w-9 h-9 rounded-lg text-sm font-semibold transition-all duration-200
                    ${postsPerDay === n
                      ? 'bg-red-600/50 text-white'
                      : 'bg-white/[0.05] text-white/30 hover:text-white/60'
                    }
                  `}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/50">Horário base</label>
            <input
              type="time"
              value={baseTime}
              onChange={e => setBaseTime(e.target.value)}
              className="
                bg-white/[0.05] rounded-lg px-3 py-2 text-sm text-white/70
                focus:outline-none focus:ring-1 focus:ring-red-500/30
                transition-all
              "
            />
          </div>
        </div>
      </div>

      {/* Queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-white/25 font-semibold uppercase tracking-widest">
            Fila de postagem
          </div>
          <span className="text-xs text-white/15">0 prontos</span>
        </div>
        <div className="bg-white/[0.03] rounded-2xl p-14 text-center">
          <div className="text-white/30 text-sm font-medium mb-1">Fila vazia</div>
          <p className="text-white/15 text-xs">Clipes com legenda prontos aparecem aqui</p>
        </div>
      </div>

    </div>
  );
}
