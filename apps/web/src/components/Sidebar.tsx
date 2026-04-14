'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const CRIACAO_NAV = [
  { href: '/dashboard',  label: 'Dashboard' },
  { href: '/approval',   label: 'Approval Queue' },
  { href: '/ideas',      label: 'Ideas' },
  { href: '/scripts',    label: 'Scripts' },
  { href: '/videos',     label: 'Videos' },
  { href: '/analytics',  label: 'Analytics' },
  { href: '/learning',   label: 'Learning Loop' },
  { href: '/characters', label: 'Characters' },
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
  const pathname = usePathname();
  const [mode, setMode] = useState<Mode>('criacao');

  useEffect(() => {
    const saved = localStorage.getItem('cg160_mode') as Mode | null;
    if (saved === 'criacao' || saved === 'cortes') setMode(saved);
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    localStorage.setItem('cg160_mode', next);
  }

  const isCortes = mode === 'cortes';
  const nav = isCortes ? CORTES_NAV : CRIACAO_NAV;

  // Sidebar chrome
  const sidebarBg  = isCortes ? 'bg-[#150505] border-red-950' : 'bg-gray-900 border-gray-800';
  const headerBg   = isCortes ? 'border-red-950/80' : 'border-gray-800';
  const footerBg   = isCortes ? 'border-red-950/80' : 'border-gray-800';
  const logoSub    = isCortes ? 'text-red-700' : 'text-gray-500';

  // Nav item
  const itemBase   = 'block px-3 py-2 rounded-md text-sm transition-colors';
  const itemIdle   = isCortes
    ? 'text-red-400/70 hover:text-red-200 hover:bg-red-950/60'
    : 'text-gray-400 hover:text-white hover:bg-gray-800';
  const itemActive = isCortes
    ? 'bg-red-900/40 text-red-200 font-medium'
    : 'bg-gray-800 text-white font-medium';

  // Mode button
  const btnBase    = 'text-xs px-2 py-0.5 rounded font-semibold transition-all border';
  const btnCriacao = mode === 'criacao'
    ? 'bg-gray-700 text-white border-gray-600'
    : 'text-gray-500 border-gray-700 hover:text-gray-300';
  const btnCortes  = mode === 'cortes'
    ? 'bg-red-900 text-red-200 border-red-800'
    : 'text-red-700 border-red-900/50 hover:text-red-400';

  return (
    <aside className={`w-56 flex-shrink-0 border-r flex flex-col transition-colors duration-200 ${sidebarBg}`}>
      {/* Header */}
      <div className={`p-4 border-b ${headerBg}`}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className={`text-lg font-bold tracking-tight ${isCortes ? 'text-red-200' : 'text-white'}`}>
            CG 160
          </div>
          <div className="flex gap-1">
            <button onClick={() => switchMode('criacao')} className={`${btnBase} ${btnCriacao}`}>
              Criação
            </button>
            <button onClick={() => switchMode('cortes')} className={`${btnBase} ${btnCortes}`}>
              Cortes
            </button>
          </div>
        </div>
        <div className={`text-xs ${logoSub}`}>
          {isCortes ? 'Modo Cortes' : 'Content Engine'}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/cortes' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${itemBase} ${active ? itemActive : itemIdle}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`p-3 border-t ${footerBg}`}>
        <div className={`text-xs ${isCortes ? 'text-red-900' : 'text-gray-600'}`}>v0.1.0</div>
      </div>
    </aside>
  );
}
