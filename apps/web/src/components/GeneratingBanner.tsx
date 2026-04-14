'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'cg160_generating';
const MAX_MS = 3 * 60 * 1000;
const POLL_MS = 5_000;

interface GeneratingState {
  type: 'ideas' | 'script';
  startedAt: number;
  label: string;
  initialCount: number;
}

export function setGenerating(type: 'ideas' | 'script', currentCount = 0) {
  const state: GeneratingState = {
    type, startedAt: Date.now(),
    label: type === 'ideas' ? 'Gerando novas ideias' : 'Gerando script',
    initialCount: currentCount,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('cg160:generating'));
}

export function clearGenerating() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('cg160:generating'));
}

export function GeneratingBanner({ itemCount = 0 }: { itemCount?: number }) {
  const router = useRouter();
  const [state, setState] = useState<GeneratingState | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const prevCountRef = useRef<number>(itemCount);

  const readState = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { setState(null); return; }
      const parsed = JSON.parse(raw) as GeneratingState;
      if (Date.now() - parsed.startedAt > MAX_MS) {
        localStorage.removeItem(STORAGE_KEY); setState(null); return;
      }
      setState(parsed);
    } catch { setState(null); }
  }, []);

  useEffect(() => {
    readState();
    window.addEventListener('cg160:generating', readState);
    return () => window.removeEventListener('cg160:generating', readState);
  }, [readState]);

  useEffect(() => {
    if (!state) return;
    if (itemCount > state.initialCount && itemCount > prevCountRef.current) clearGenerating();
    prevCountRef.current = itemCount;
  }, [itemCount, state]);

  useEffect(() => {
    if (!state) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - state.startedAt) / 1000));
      router.refresh();
      if (Date.now() - state.startedAt > MAX_MS) clearGenerating();
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [state, router]);

  if (!state) return null;

  const statusText =
    elapsed < 10 ? 'iniciando job no Inngest…' :
    elapsed < 30 ? 'modelo gerando conteúdo…' :
    elapsed < 60 ? 'quase pronto…' :
    `${elapsed}s — pode levar até 2 min`;

  return (
    <div className="flex items-center gap-3 bg-indigo-500/10 rounded-2xl px-5 py-3.5 mb-6"
      style={{ boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.15)' }}>
      <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-white/80 font-medium">{state.label}… </span>
        <span className="text-xs text-indigo-400/70">{statusText}</span>
      </div>
      <button onClick={clearGenerating} className="text-white/20 hover:text-white/50 text-xs transition-colors">
        ×
      </button>
    </div>
  );
}
