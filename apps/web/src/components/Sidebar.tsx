'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const CRIACAO_NAV = [
  { href: '/dashboard',  label: 'Dashboard' },
  { href: '/approval',   label: 'Fila de Aprovação' },
  { href: '/ideas',      label: 'Ideias' },
  { href: '/scripts',    label: 'Scripts' },
  { href: '/videos',     label: 'Vídeos' },
  { href: '/analytics',  label: 'Analytics' },
  { href: '/learning',   label: 'Learning Loop' },
  { href: '/characters', label: 'Personagens' },
  { href: '/settings',   label: 'Instruções' },
];

const CORTES_NAV = [
  { href: '/cortes',          label: 'Overview' },
  { href: '/cortes/buscar',   label: 'Buscar Vídeos' },
  { href: '/cortes/editar',   label: 'Fila de Cortes' },
  { href: '/cortes/legendas', label: 'Legendas' },
  { href: '/cortes/publicar', label: 'Publicar' },
];

type Mode = 'criacao' | 'cortes';

export function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [mode, setMode]       = useState<Mode>('criacao');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cg160_mode') as Mode | null;
    if (saved === 'criacao' || saved === 'cortes') setMode(saved);
    setMounted(true);
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    localStorage.setItem('cg160_mode', next);
    router.push(next === 'cortes' ? '/cortes' : '/dashboard');
  }

  const isCortes = mode === 'cortes';
  const nav = isCortes ? CORTES_NAV : CRIACAO_NAV;

  /* ── Colors ── */
  const sidebarBg  = isCortes ? 'bg-[#0e0506]' : 'bg-[#080a12]';
  const accentBar  = isCortes ? 'bg-red-400'   : 'bg-indigo-400';
  const activeBg   = isCortes ? 'bg-red-500/10' : 'bg-indigo-500/10';
  const pillActive = isCortes ? 'left-[50%] bg-red-600/50' : 'left-[2px] bg-indigo-600/50';
  const logoGlow   = isCortes ? 'text-red-400'  : 'text-indigo-400';
  const modeSub    = isCortes ? 'Modo Cortes'   : 'Content Engine';

  if (!mounted) {
    return <aside className={`w-56 flex-shrink-0 ${sidebarBg}`} />;
  }

  return (
    <aside
      className={`
        w-56 flex-shrink-0 flex flex-col
        transition-colors duration-300
        ${sidebarBg}
      `}
    >
      {/* ── Logo ── */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className={`text-xl font-black tracking-tight text-white`}>CG</span>
          <span className={`text-xl font-black tracking-tight logo-glow ${logoGlow}`}>160</span>
        </div>
        <div className="text-[11px] text-white/25 font-medium tracking-widest uppercase">
          {modeSub}
        </div>
      </div>

      {/* ── Mode toggle ── */}
      <div className="px-3 mb-5">
        <div className="relative flex bg-white/[0.05] rounded-xl p-[3px]">
          {/* sliding pill */}
          <div
            className={`
              absolute top-[3px] bottom-[3px]
              w-[calc(50%-3px)] rounded-[9px]
              transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
              ${pillActive}
            `}
          />
          <button
            onClick={() => switchMode('criacao')}
            className={`
              relative z-10 flex-1 text-[11px] py-1.5 font-semibold rounded-[9px]
              transition-colors duration-200
              ${!isCortes ? 'text-white' : 'text-white/35 hover:text-white/60'}
            `}
          >
            Criação
          </button>
          <button
            onClick={() => switchMode('cortes')}
            className={`
              relative z-10 flex-1 text-[11px] py-1.5 font-semibold rounded-[9px]
              transition-colors duration-200
              ${isCortes ? 'text-white' : 'text-white/35 hover:text-white/60'}
            `}
          >
            Cortes
          </button>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {nav.map(item => {
          const exact  = item.href === '/dashboard' || item.href === '/cortes';
          const active = exact ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center px-4 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 overflow-hidden
                ${active
                  ? `text-white ${activeBg}`
                  : 'text-white/35 hover:text-white/70 hover:bg-white/[0.04]'
                }
              `}
            >
              {active && (
                <span
                  className={`
                    absolute left-0 inset-y-[10px] w-[3px] rounded-r-full
                    ${accentBar}
                  `}
                />
              )}
              <span className="pl-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="px-5 py-4">
        <div className="text-[10px] text-white/10 font-medium tracking-wider">v0.1.0</div>
      </div>
    </aside>
  );
}
