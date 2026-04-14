export const revalidate = 0;

export default function CortesOverview() {
  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
        <p className="text-white/30 mt-1.5 text-sm">
          Importe vídeos, recorte os melhores momentos, adicione legendas e publique automaticamente.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Importados',       value: '0', color: 'text-white' },
          { label: 'Cortes prontos',   value: '0', color: 'text-white' },
          { label: 'Aguard. legenda',  value: '0', color: 'text-white' },
          { label: 'Fila de postagem', value: '0', color: 'text-white' },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.04] hover:bg-white/[0.06] transition-colors rounded-2xl p-5">
            <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-xs text-white/30 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline steps */}
      <div className="mb-8">
        <h2 className="text-xs text-white/25 font-semibold uppercase tracking-widest mb-4">Pipeline</h2>
        <div className="space-y-2">
          {[
            { step: '01', label: 'Buscar Vídeos', desc: 'Importe por URL ou upload direto', href: '/cortes/buscar' },
            { step: '02', label: 'Fila de Cortes', desc: 'Recorte os melhores momentos', href: '/cortes/editar' },
            { step: '03', label: 'Legendas', desc: 'Geração automática com sync frame a frame', href: '/cortes/legendas' },
            { step: '04', label: 'Publicar', desc: 'Agendamento e postagem automática', href: '/cortes/publicar' },
          ].map((s, i) => (
            <a
              key={s.step}
              href={s.href}
              className="flex items-center gap-5 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl px-6 py-4 transition-all duration-200 group"
            >
              <span className="text-xs font-bold text-red-500/50 group-hover:text-red-400 transition-colors w-6">{s.step}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{s.label}</div>
                <div className="text-xs text-white/25 mt-0.5">{s.desc}</div>
              </div>
              <svg className="w-4 h-4 text-white/15 group-hover:text-white/40 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
