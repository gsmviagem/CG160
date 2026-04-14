'use client';

import { useState } from 'react';

export default function BuscarVideos() {
  const [url, setUrl]       = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleImport() {
    if (!url.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res  = await fetch('/api/cortes/import', {
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
    <div className="p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Buscar Vídeos</h1>
        <p className="text-white/30 mt-1.5 text-sm">
          Cole uma URL ou faça upload direto para importar um vídeo.
        </p>
      </div>

      {/* URL import */}
      <div className="mb-6">
        <label className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3 block">
          Importar por URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleImport()}
            placeholder="https://youtube.com/watch?v=..."
            className="
              flex-1 bg-white/[0.05] hover:bg-white/[0.07] focus:bg-white/[0.07]
              rounded-xl px-4 py-3 text-sm text-white placeholder-white/20
              focus:outline-none focus:ring-1 focus:ring-red-500/40
              transition-all duration-200
            "
          />
          <button
            onClick={handleImport}
            disabled={status === 'loading' || !url.trim()}
            className="
              px-5 py-3 rounded-xl text-sm font-semibold
              bg-red-600/80 hover:bg-red-500/80 disabled:bg-white/[0.05]
              text-white disabled:text-white/20
              transition-all duration-200
            "
          >
            {status === 'loading' ? '...' : 'Importar'}
          </button>
        </div>

        {status === 'error' && errorMsg && (
          <p className="text-xs text-red-400/80 mt-2">{errorMsg}</p>
        )}
        {status === 'done' && (
          <p className="text-xs text-green-400/80 mt-2">Vídeo importado com sucesso</p>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 my-8">
        <div className="flex-1 h-px bg-white/[0.05]" />
        <span className="text-xs text-white/20 font-medium">ou</span>
        <div className="flex-1 h-px bg-white/[0.05]" />
      </div>

      {/* Upload */}
      <label
        htmlFor="video-upload"
        className="
          flex flex-col items-center justify-center gap-3
          bg-white/[0.03] hover:bg-white/[0.05] border border-dashed border-white/[0.08] hover:border-red-500/30
          rounded-2xl p-12 cursor-pointer
          transition-all duration-200 group
        "
      >
        <div className="w-10 h-10 rounded-2xl bg-white/[0.06] group-hover:bg-red-500/10 flex items-center justify-center transition-colors duration-200">
          <svg className="w-5 h-5 text-white/30 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-white/50 group-hover:text-white/70 transition-colors">Arraste um arquivo de vídeo</div>
          <div className="text-xs text-white/20 mt-1">MP4, MOV, WebM · máx 2GB</div>
        </div>
        <input type="file" id="video-upload" accept="video/*" className="hidden" />
      </label>

      {/* Supported platforms */}
      <div className="mt-8">
        <div className="text-xs text-white/20 font-semibold uppercase tracking-widest mb-3">Plataformas suportadas</div>
        <div className="flex gap-2 flex-wrap">
          {['YouTube', 'TikTok', 'Instagram', 'X / Twitter', 'Upload local'].map(p => (
            <span key={p} className="text-xs text-white/30 bg-white/[0.04] px-3 py-1.5 rounded-lg">
              {p}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
