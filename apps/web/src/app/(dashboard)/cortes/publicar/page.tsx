export const revalidate = 0;

export default function Publicar() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-red-200">Publicar</h1>
        <p className="text-red-900/80 mt-1 text-sm">
          Fila de postagem automática. Configure horários e plataformas alvo.
        </p>
      </div>

      {/* Platforms */}
      <div className="border border-red-950 rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-3 bg-red-950/20 border-b border-red-950">
          <div className="text-xs font-bold uppercase tracking-wider text-red-500">Plataformas conectadas</div>
        </div>
        <div className="p-4 bg-[#0f0303] space-y-2">
          {[
            { name: 'TikTok', status: 'disconnected' },
            { name: 'Instagram Reels', status: 'disconnected' },
            { name: 'YouTube Shorts', status: 'disconnected' },
          ].map(p => (
            <div key={p.name} className="flex items-center justify-between py-2 border-b border-red-950/50 last:border-0">
              <span className="text-sm text-red-400">{p.name}</span>
              <button className="text-xs px-3 py-1 rounded border border-red-900 text-red-700 hover:text-red-400 hover:border-red-700 transition-colors">
                Conectar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule */}
      <div className="border border-red-950 rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-3 bg-red-950/20 border-b border-red-950">
          <div className="text-xs font-bold uppercase tracking-wider text-red-500">Agendamento</div>
        </div>
        <div className="p-4 bg-[#0f0303] space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs text-red-700 w-32">Posts por dia</label>
            <select className="bg-red-950/20 border border-red-950 rounded px-3 py-1.5 text-sm text-red-300 focus:outline-none focus:border-red-700">
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-red-700 w-32">Horário base</label>
            <input
              type="time"
              defaultValue="18:00"
              className="bg-red-950/20 border border-red-950 rounded px-3 py-1.5 text-sm text-red-300 focus:outline-none focus:border-red-700"
            />
          </div>
        </div>
      </div>

      {/* Queue */}
      <div className="border border-red-950 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-red-950/20 border-b border-red-950 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-red-500">Fila de postagem</div>
          <span className="text-xs text-red-900">0 prontos</span>
        </div>
        <div className="p-8 text-center bg-[#0f0303]">
          <div className="text-red-800 text-sm">Fila vazia</div>
          <p className="text-red-900 text-xs mt-1">Clipes com legenda prontos aparecerão aqui</p>
        </div>
      </div>
    </div>
  );
}
