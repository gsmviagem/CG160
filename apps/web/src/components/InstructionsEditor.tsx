'use client';

import { useState } from 'react';

interface InstructionsEditorProps {
  settingKey: 'idea_instructions' | 'script_instructions';
  label: string;
  description: string;
  placeholder: string;
  initialValue: string;
  accentColor: 'yellow' | 'green';
}

export function InstructionsEditor({
  settingKey, label, description, placeholder, initialValue, accentColor,
}: InstructionsEditorProps) {
  const [value, setValue] = useState(initialValue);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const accent = accentColor === 'yellow'
    ? { border: 'border-yellow-900/50', header: 'bg-yellow-950/30', tag: 'text-yellow-400', btn: 'bg-yellow-700 hover:bg-yellow-600' }
    : { border: 'border-green-900/50', header: 'bg-green-950/30', tag: 'text-green-400', btn: 'bg-green-700 hover:bg-green-600' };

  async function save() {
    setState('saving');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: settingKey, value }),
      });
      if (!res.ok) throw new Error(await res.text());
      setState('saved');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  }

  return (
    <div className={`border ${accent.border} rounded-lg overflow-hidden`}>
      <div className={`px-4 py-3 ${accent.header} border-b border-gray-800`}>
        <div className={`text-xs font-bold uppercase tracking-wider ${accent.tag} mb-0.5`}>{label}</div>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <div className="p-4 bg-gray-900">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          rows={6}
          className="w-full text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-y font-mono leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-600">
            {value.length > 0 ? `${value.length} caracteres` : 'Vazio — nenhuma instrução extra será usada'}
          </span>
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
            {state === 'saving' ? 'Salvando...' : state === 'saved' ? '✓ Salvo' : state === 'error' ? '✗ Erro' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
