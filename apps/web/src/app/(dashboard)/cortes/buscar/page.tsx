'use client';

import { useState } from 'react';

export default function BuscarVideos() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleImport() {
    if (!url.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/cortes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? res.statusText);
      setStatus('done');
      setUrl('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStatus('error');
      setTimeout(() => { setStatus('idle'); setErrorMsg(''); }, 6000);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-red-200">Buscar Vídeos</h1>
        <p className="text-red-900/80 mt-1 text-sm">
          Cole uma URL do YouTube, TikTok ou Instagram para importar o vídeo.
        </p>
      </div>

      {/* URL import */}
      <div className="border border-red-950 rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-3 bg-red-950/20 border-b border-red-950">
          <div className="text-xs font-bold uppercase tracking-wider text-red-500">Importar por URL</div>
        </div>
        <div className="p-4 bg-[#0f0303] space-y-3">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleImport()}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full bg-red-950/20 border border-red-950 rounded-lg px-3 py-2 text-sm text-red-200 placeholder-red-900 focus:outline-none focus:border-red-700"
          />
          <div className="flex items-center justify-between">
            {status === 'error' && errorMsg
              ? <span className="text-xs text-red-400">{errorMsg}</span>
              : status === 'done'
              ? <span className="text-xs text-green-400">Vídeo importado com sucesso</span>
              : <span className="text-xs text-red-900">Suporta YouTube, TikTok e Instagram</span>
            }
            <button
              onClick={handleImport}
              disabled={status === 'loading' || !url.trim()}
              className="text-sm px-4 py-1.5 rounded bg-red-900 hover:bg-red-800 disabled:bg-red-950 disabled:text-red-900 text-red-200 transition-colors font-medium"
            >
              {status === 'loading' ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="border border-dashed border-red-950 rounded-lg p-8 text-center bg-red-950/5">
        <div className="text-red-800 text-sm mb-1">Upload direto</div>
        <div className="text-red-900 text-xs">Arraste um arquivo de vídeo ou clique para selecionar</div>
        <input type="file" accept="video/*" className="hidden" id="video-upload" />
        <label
          htmlFor="video-upload"
          className="mt-4 inline-block text-xs px-3 py-1.5 rounded border border-red-900 text-red-700 hover:text-red-400 hover:border-red-700 cursor-pointer transition-colors"
        >
          Selecionar arquivo
        </label>
      </div>

      {/* Plataformas suportadas */}
      <div className="mt-6 p-4 bg-red-950/10 border border-red-950/50 rounded-lg">
        <div className="text-xs font-semibold text-red-800 uppercase tracking-wider mb-2">Plataformas suportadas</div>
        <div className="flex gap-3 flex-wrap">
          {['YouTube', 'TikTok', 'Instagram', 'X / Twitter', 'Upload local'].map(p => (
            <span key={p} className="text-xs text-red-700 border border-red-950 px-2 py-0.5 rounded">{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
