'use client';

import { useState, useCallback } from 'react';

interface Block {
  id: string;
  title: string;
  content: string;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function parseBlocks(raw: string): Block[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Block[];
  } catch {}
  // legacy plain text → single block
  return [{ id: genId(), title: '', content: raw }];
}

function BlockCard({
  block,
  onChange,
  onDelete,
}: {
  block: Block;
  onChange: (b: Block) => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
        <input
          type="text"
          value={block.title}
          onChange={e => onChange({ ...block, title: e.target.value })}
          placeholder="Título do bloco (opcional)"
          className="flex-1 text-xs font-semibold bg-transparent text-gray-200 placeholder-gray-600 focus:outline-none"
        />
        <button
          onClick={onDelete}
          className="text-gray-600 hover:text-red-400 transition-colors text-sm px-1"
          title="Remover bloco"
        >
          ✕
        </button>
      </div>
      <textarea
        value={block.content}
        onChange={e => onChange({ ...block, content: e.target.value })}
        placeholder="Escreva a instrução aqui..."
        rows={6}
        className="w-full text-sm bg-gray-900/50 px-3 py-2 text-gray-300 placeholder-gray-600 focus:outline-none resize-y font-mono leading-relaxed"
      />
    </div>
  );
}

interface InstructionsEditorProps {
  settingKey: 'idea_instructions' | 'script_instructions';
  label: string;
  description: string;
  initialValue: string;
  accentColor: 'yellow' | 'green';
}

export function InstructionsEditor({
  settingKey, label, description, initialValue, accentColor,
}: InstructionsEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseBlocks(initialValue));
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const accent = accentColor === 'yellow'
    ? { border: 'border-yellow-900/50', header: 'bg-yellow-950/30', tag: 'text-yellow-400', btn: 'bg-yellow-700 hover:bg-yellow-600', add: 'text-yellow-500 hover:text-yellow-300 border-yellow-900/50 hover:border-yellow-700' }
    : { border: 'border-green-900/50',  header: 'bg-green-950/30',  tag: 'text-green-400',  btn: 'bg-green-700 hover:bg-green-600',  add: 'text-green-500 hover:text-green-300 border-green-900/50 hover:border-green-700'   };

  const updateBlock = useCallback((id: string, updated: Block) => {
    setBlocks(bs => bs.map(b => b.id === id ? updated : b));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks(bs => bs.filter(b => b.id !== id));
  }, []);

  const addBlock = () => {
    setBlocks(bs => [...bs, { id: genId(), title: '', content: '' }]);
  };

  async function save() {
    setState('saving');
    setErrorMsg('');
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
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(msg);
      setState('error');
      setTimeout(() => { setState('idle'); setErrorMsg(''); }, 6000);
    }
  }

  const filledBlocks = blocks.filter(b => b.content.trim()).length;

  return (
    <div className={`border ${accent.border} rounded-lg overflow-hidden`}>
      {/* Header */}
      <div className={`px-4 py-3 ${accent.header} border-b border-gray-800 flex items-start justify-between gap-3`}>
        <div>
          <div className={`text-xs font-bold uppercase tracking-wider ${accent.tag} mb-0.5`}>{label}</div>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <span className="text-xs text-gray-600 whitespace-nowrap mt-0.5">
          {filledBlocks} bloco{filledBlocks !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Blocks */}
      <div className="p-4 bg-gray-900 space-y-3">
        {blocks.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-4">
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

        {/* Add block */}
        <button
          onClick={addBlock}
          className={`w-full text-xs py-2 px-3 rounded-lg border border-dashed transition-colors ${accent.add}`}
        >
          + Adicionar bloco
        </button>

        {/* Save */}
        <div className="flex items-center justify-between pt-1">
          {state === 'error' && errorMsg
            ? <span className="text-xs text-red-400 break-words max-w-sm">{errorMsg}</span>
            : <span className="text-xs text-gray-600">
                {state === 'saved' ? 'Salvo com sucesso' : 'Alterações não salvas até clicar em Salvar'}
              </span>
          }
          <button
            onClick={save}
            disabled={state === 'saving' || state === 'saved'}
            className={`text-xs px-4 py-1.5 rounded font-medium text-white transition-all ${
              state === 'saved'  ? 'bg-green-700 text-green-100' :
              state === 'error'  ? 'bg-red-700 text-red-100' :
              state === 'saving' ? 'bg-gray-600 text-gray-400' :
              `${accent.btn} text-white`
            }`}
          >
            {state === 'saving' ? 'Salvando...' : state === 'saved' ? '✓ Salvo' : 'Salvar tudo'}
          </button>
        </div>
      </div>
    </div>
  );
}
