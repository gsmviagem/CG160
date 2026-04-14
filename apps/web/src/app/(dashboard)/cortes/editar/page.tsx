export const revalidate = 0;

export default function FilaDeCortes() {
  return (
    <div className="p-8 max-w-4xl mx-auto">

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Fila de Cortes</h1>
        <p className="text-white/30 mt-1.5 text-sm">
          Vídeos importados prontos para recortar e exportar em 9:16.
        </p>
      </div>

      {/* Empty state */}
      <div className="bg-white/[0.03] rounded-2xl p-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="text-white/40 text-sm font-medium mb-1">Nenhum vídeo na fila</div>
        <p className="text-white/20 text-xs mb-6">Importe vídeos na aba Buscar para começar a editar</p>
        <a
          href="/cortes/buscar"
          className="inline-block text-xs font-semibold px-4 py-2 rounded-xl bg-red-600/60 hover:bg-red-500/60 text-white transition-colors duration-200"
        >
          Ir para Buscar
        </a>
      </div>

      {/* How it works */}
      <div className="mt-8">
        <div className="text-xs text-white/20 font-semibold uppercase tracking-widest mb-4">Como funciona</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { n: '1', t: 'Importe', d: 'Cole URL ou upload de vídeo longo' },
            { n: '2', t: 'Defina os cortes', d: 'Marque entrada e saída de cada clipe' },
            { n: '3', t: 'Export automático', d: 'Clipes gerados em 9:16 vertical' },
            { n: '4', t: 'Fila de Legendas', d: 'Clipes vão direto para legenda automática' },
          ].map(s => (
            <div key={s.n} className="bg-white/[0.03] rounded-xl p-4">
              <div className="text-xs font-bold text-red-500/40 mb-1">{s.n.padStart(2,'0')}</div>
              <div className="text-sm font-semibold text-white/60 mb-0.5">{s.t}</div>
              <div className="text-xs text-white/25">{s.d}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
