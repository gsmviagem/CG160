'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Variant = 'success' | 'danger' | 'neutral' | 'primary';

const COLORS: Record<Variant, string> = {
  success: 'bg-green-800 hover:bg-green-700 text-green-100 disabled:bg-green-900 disabled:text-green-700',
  danger:  'bg-red-900 hover:bg-red-800 text-red-100 disabled:bg-red-950 disabled:text-red-800',
  neutral: 'bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:bg-gray-900 disabled:text-gray-600',
  primary: 'bg-indigo-700 hover:bg-indigo-600 text-white disabled:bg-indigo-900 disabled:text-indigo-700',
};

// ─── Approval Button ───────────────────────────────────────────────────────────
// POST /api/approval — approve, reject or regenerate an idea/script/video

interface ApprovalButtonProps {
  entityType: string;
  entityId: string;
  action: string;
  label: string;
  variant: Variant;
  redirectTo?: string;
}

export function ApprovalButton({
  entityType, entityId, action, label, variant, redirectTo,
}: ApprovalButtonProps) {
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
      // Refresh current page data after short delay so user sees the "done" flash
      setTimeout(() => {
        router.refresh();
        setState('idle');
      }, 800);
      if (redirectTo) router.push(redirectTo);
    } catch (err) {
      console.error('ApprovalButton error:', err);
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  }

  const isLoading = state === 'loading';
  const isDone    = state === 'done';
  const isError   = state === 'error';

  const displayLabel = isLoading ? '...' : isDone ? '✓' : isError ? '✗' : label;
  const extraColor   = isDone ? 'bg-green-700 text-green-100' : isError ? 'bg-red-700 text-red-100' : '';

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isDone}
      className={`text-xs px-3 py-1.5 rounded font-medium transition-all ${extraColor || COLORS[variant]}`}
    >
      {displayLabel}
    </button>
  );
}

// ─── Generate Button ───────────────────────────────────────────────────────────
// POST /api/generate — trigger idea or script generation

interface GenerateButtonProps {
  type: 'ideas' | 'script';
  ideaId?: string;
  count?: number;
  label: string;
  variant?: Variant;
  className?: string;
}

export function GenerateButton({
  type, ideaId, count = 5, label, variant = 'primary', className = '',
}: GenerateButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleClick() {
    setState('loading');
    try {
      const body: Record<string, unknown> = { type };
      if (type === 'ideas') body.count = count;
      if (type === 'script' && ideaId) body.idea_id = ideaId;

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      setState('done');
      setTimeout(() => {
        router.refresh();
        setState('idle');
      }, 1500);
    } catch (err) {
      console.error('GenerateButton error:', err);
      setState('error');
      setTimeout(() => setState('idle'), 2500);
    }
  }

  const isLoading = state === 'loading';
  const isDone    = state === 'done';
  const isError   = state === 'error';

  const displayLabel = isLoading
    ? 'Iniciando...'
    : isDone
    ? '✓ Job enviado!'
    : isError
    ? '✗ Erro — tente novamente'
    : label;

  const extraColor = isDone
    ? 'bg-green-700 text-green-100'
    : isError
    ? 'bg-red-800 text-red-100'
    : '';

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isDone}
      className={`text-sm px-4 py-2 rounded-lg font-medium transition-all ${extraColor || COLORS[variant]} ${className}`}
    >
      {displayLabel}
    </button>
  );
}
