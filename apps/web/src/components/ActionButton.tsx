'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setGenerating } from '@/components/GeneratingBanner';

type Variant = 'success' | 'danger' | 'neutral' | 'primary';

const COLORS: Record<Variant, string> = {
  success: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 disabled:opacity-30',
  danger:  'bg-red-500/15 hover:bg-red-500/25 text-red-300 disabled:opacity-30',
  neutral: 'bg-white/[0.06] hover:bg-white/[0.10] text-white/60 hover:text-white/80 disabled:opacity-30',
  primary: 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-200 disabled:opacity-30',
};

// ─── Approval Button ────────────────────────────────────────────────────────
export function ApprovalButton({
  entityType, entityId, action, label, variant, redirectTo,
}: {
  entityType: string; entityId: string; action: string;
  label: string; variant: Variant; redirectTo?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleClick() {
    setState('loading');
    try {
      const res = await fetch('/api/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId, action }),
      });
      if (!res.ok) throw new Error(await res.text());
      setState('done');
      setTimeout(() => { router.refresh(); setState('idle'); }, 800);
      if (redirectTo) router.push(redirectTo);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  }

  const display = state === 'loading' ? '…' : state === 'done' ? '✓' : state === 'error' ? '✗' : label;
  const extra   = state === 'done'  ? 'bg-emerald-500/20 text-emerald-300'
                : state === 'error' ? 'bg-red-500/20 text-red-300' : '';

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading' || state === 'done'}
      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${extra || COLORS[variant]}`}
    >
      {display}
    </button>
  );
}

// ─── Generate Button ────────────────────────────────────────────────────────
export function GenerateButton({
  type, ideaId, count = 5, label, variant = 'primary', className = '', currentCount = 0,
}: {
  type: 'ideas' | 'script'; ideaId?: string; count?: number;
  label: string; variant?: Variant; className?: string; currentCount?: number;
}) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleClick() {
    setState('loading'); setErrorMsg('');
    try {
      const body: Record<string, unknown> = { type };
      if (type === 'ideas') body.count = count;
      if (type === 'script' && ideaId) body.idea_id = ideaId;
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(data.detail ?? data.error ?? res.statusText);
      }
      setGenerating(type, currentCount);
      setState('done');
      if (type === 'script') setTimeout(() => router.push('/scripts'), 1200);
      else setTimeout(() => setState('idle'), 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setState('error');
      setTimeout(() => { setState('idle'); setErrorMsg(''); }, 6000);
    }
  }

  const display = state === 'loading' ? 'Iniciando…'
                : state === 'done'    ? '✓ Enviado!'
                : state === 'error'   ? '✗ Falhou'
                : label;
  const extra   = state === 'done'  ? 'bg-emerald-500/20 text-emerald-300'
                : state === 'error' ? 'bg-red-500/20 text-red-300' : '';

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={state === 'loading' || state === 'done'}
        className={`text-sm px-4 py-2 rounded-xl font-medium transition-all duration-200 ${extra || COLORS[variant]} ${className}`}
      >
        {display}
      </button>
      {state === 'error' && errorMsg && (
        <span className="text-xs text-red-400/80 max-w-xs break-words">{errorMsg}</span>
      )}
    </div>
  );
}

// ─── Generate Ideas Box ─────────────────────────────────────────────────────
export function GenerateIdeasBox({ currentCount = 0 }: { currentCount?: number }) {
  const router = useRouter();
  const [theme, setTheme]   = useState('');
  const [state, setState]   = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading'); setErrorMsg('');
    try {
      const body: Record<string, unknown> = { type: 'ideas', count: 5 };
      if (theme.trim()) body.theme = theme.trim();
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(data.detail ?? data.error ?? res.statusText);
      }
      setGenerating('ideas', currentCount);
      setState('done'); setTheme('');
      setTimeout(() => { setState('idle'); router.refresh(); }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg); setState('error');
      setTimeout(() => { setState('idle'); setErrorMsg(''); }, 6000);
    }
  }

  const isLoading = state === 'loading';
  const isDone    = state === 'done';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
      <div className="flex gap-2">
        <input
          type="text"
          value={theme}
          onChange={e => setTheme(e.target.value)}
          placeholder="Tema (opcional) — ex: frutinhas com corpo humano"
          disabled={isLoading || isDone}
          className="
            flex-1 text-sm px-4 py-2.5 rounded-xl
            bg-white/[0.05] hover:bg-white/[0.07] focus:bg-white/[0.07]
            text-white placeholder-white/25
            focus:outline-none focus:ring-1 focus:ring-indigo-500/30
            transition-all duration-200 disabled:opacity-40
          "
        />
        <button
          type="submit"
          disabled={isLoading || isDone}
          className={`
            text-sm px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap
            ${isDone        ? 'bg-emerald-500/20 text-emerald-300'
            : state === 'error' ? 'bg-red-500/20 text-red-300'
            : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 disabled:opacity-40'}
          `}
        >
          {isLoading ? 'Gerando…' : isDone ? '✓ Enviado!' : '+ Gerar 5 ideias'}
        </button>
      </div>
      {state === 'error' && errorMsg && (
        <span className="text-xs text-red-400/80">{errorMsg}</span>
      )}
    </form>
  );
}

// ─── Delete Button ──────────────────────────────────────────────────────────
export function DeleteButton({ type, id }: { type: 'idea' | 'script'; id: string }) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'confirm' | 'loading' | 'done'>('idle');

  if (state === 'confirm') {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-xs text-white/30">Confirmar?</span>
        <button
          onClick={async () => {
            setState('loading');
            await fetch('/api/delete', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, id }),
            });
            setState('done'); router.refresh();
          }}
          className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
        >
          Sim
        </button>
        <button
          onClick={() => setState('idle')}
          className="text-xs px-2 py-1 bg-white/[0.06] hover:bg-white/[0.10] text-white/40 rounded-lg transition-colors"
        >
          Não
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setState('confirm')}
      disabled={state === 'loading' || state === 'done'}
      className="text-xs px-2 py-1 bg-white/[0.04] hover:bg-red-500/15 text-white/20 hover:text-red-400 rounded-lg transition-all duration-200"
    >
      {state === 'loading' ? '…' : state === 'done' ? '✓' : 'Deletar'}
    </button>
  );
}
