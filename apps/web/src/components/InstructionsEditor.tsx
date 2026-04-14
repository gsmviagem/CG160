'use client';

import { useState, useCallback } from 'react';

interface Block { id: string; title: string; content: string; }

function genId() { return Math.random().toString(36).slice(2, 10); }

function parseBlocks(raw: string): Block[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Block[];
  } catch {}
  return [{ id: genId(), title: '', content: raw }];
}

function BlockCard({ block, onChange, onDelete }: {
  block: Block; onChange: (b: Block) => void; onDelete: () => void;
}) {
  return (
    <div className="bg-white/[0.04] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03]">
        <input
          type="text"
          value={block.title}
          onChange={e => onChange({ ...block, title: e.target.value })}
          placeholder="Título do bloco (opcional)"
          className="flex-1 text-xs font-semibold bg-transparent text-white/70 placeholder-white/20 focus:outline-none"
        />
        <button
          onClick={onDelete}
          className="text-white/20 hover:text-red-400 transition-colors text-sm px-1"
        >
          ✕
        </button>
      </div>
      <textarea
        value={block.content}
        onChange={e => onChange({ ...block, content: e.target.value })}
        placeholder="Escreva a instrução aqui..."
        rows={6}
        className="w-full text-sm bg-transparent px-4 py-3 text-white/70 placeholder-white/20 focus:outline-none resize-y font-mono leading-relaxed"
      />
    </div>
  );
}

interface InstructionsEditorProps {
  settingKey: 'idea_instructions' | 'script_instructions';
  label: string; description: string;
  initialValue: string; accentColor: 'yellow' | 'green';
}

export function InstructionsEditor({ settingKey, label, description, initialValue, accentColor }: InstructionsEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseBlocks(initialValue));
  const [state, setState]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const tagColor = accentColor === 'yellow' ? 'text-amber-400' : 'text-emerald-400';
  const btnColor = accentColor === 'yellow'
    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300'
    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300';
  const addColor = accentColor === 'yellow'
    ? 'text-amber-500/50 hover:text-amber-300 hover:bg-amber-500/[0.07]'
    : 'text-emerald-500/50 hover:text-emerald-300 hover:bg-emerald-500/[0.07]';

  const updateBlock = useCallback((id: string, updated: Block) => {
    setBlocks(bs => bs.map(b => b.id === id ? updated : b));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks(bs => bs.filter(b => b.id !== id));
  }, []);

  async function save() {
    setState('saving'); setErrorMsg('');
    try {
      const payload = JSON.stringify(blocks.filter(b => b.content.trim()));
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: settingKey, value: payload }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? res.statusText);
      setState('saved');
      setTimeout(() => setState('idle'), 2000);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setState('error');
      setTimeout(() => { setState('idle'); setErrorMsg(''); }, 6000);
    }
  }

  const filledBlocks = blocks.filter(b => b.content.trim()).length;

  return (
    <div className="bg-white/[0.03] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-3">
        <div>
          <div className={`text-xs font-bold uppercase tracking-widest ${tagColor} mb-0.5`}>{label}</div>
          <p className="text-xs text-white/30">{description}</p>
        </div>
        <span className="text-xs text-white/20 whitespace-nowrap mt-0.5">
          {filledBlocks} bloco{filledBlocks !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Blocks */}
      <div className="px-5 pb-5 space-y-3">
        {blocks.length === 0 && (
          <p className="text-xs text-white/20 text-center py-6">
            Nenhuma instrução ainda — clique em + Adicionar bloco
          </p>
        )}

        {blocks.map(block => (
          <BlockCard
            key={block.id}
            block={block}
            onChange={updated => updateBlock(block.id, updated)}
            onDelete={() => deleteBlock(block.id)}
          />
        ))}

        <button
          onClick={() => setBlocks(bs => [...bs, { id: genId(), title: '', content: '' }])}
          className={`w-full text-xs py-2.5 px-3 rounded-xl transition-all duration-200 ${addColor}`}
        >
          + Adicionar bloco
        </button>

        <div className="flex items-center justify-between pt-1">
          {state === 'error' && errorMsg
            ? <span className="text-xs text-red-400/80 break-words max-w-sm">{errorMsg}</span>
            : <span className="text-xs text-white/20">
                {state === 'saved' ? 'Salvo com sucesso' : 'Alterações não salvas até clicar em Salvar'}
              </span>
          }
          <button
            onClick={save}
            disabled={state === 'saving' || state === 'saved'}
            className={`
              text-xs px-4 py-1.5 rounded-lg font-semibold transition-all duration-200
              ${state === 'saved'  ? 'bg-emerald-500/20 text-emerald-300'
              : state === 'error'  ? 'bg-red-500/20 text-red-300'
              : state === 'saving' ? 'bg-white/[0.05] text-white/25'
              : `${btnColor}`}
            `}
          >
            {state === 'saving' ? 'Salvando…' : state === 'saved' ? '✓ Salvo' : 'Salvar tudo'}
          </button>
        </div>
      </div>
    </div>
  );
}
