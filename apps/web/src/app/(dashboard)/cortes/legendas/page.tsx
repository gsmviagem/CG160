export const revalidate = 0;

export default function Legendas() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-red-200">Legendas</h1>
        <p className="text-red-900/80 mt-1 text-sm">
          Geração automática de legendas com sincronização frame a frame.
        </p>
      </div>

      {/* Config */}
      <div className="border border-red-950 rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-3 bg-red-950/20 border-b border-red-950">
          <div className="text-xs font-bold uppercase tracking-wider text-red-500">Configuração de Legendas</div>
        </div>
        <div className="p-4 bg-[#0f0303] space-y-4">
          <div>
            <label className="text-xs text-red-700 font-medium block mb-1">Idioma</label>
            <select className="bg-red-950/20 border border-red-950 rounded px-3 py-1.5 text-sm text-red-300 focus:outline-none focus:border-red-700 w-48">
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es">Español</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-red-700 font-medium block mb-1">Estilo</label>
            <div className="flex gap-2">
              {['Minimal', 'Destaque', 'Cinético', 'Clássico'].map(s => (
                <button key={s} className="text-xs px-3 py-1 rounded border border-red-950 text-red-800 hover:text-red-400 hover:border-red-700 transition-colors first:bg-red-900/40 first:text-red-300 first:border-red-800">
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-red-700 font-medium block mb-1">Posição</label>
            <div className="flex gap-2">
              {['Topo', 'Centro', 'Base'].map(p => (
                <button key={p} className="text-xs px-3 py-1 rounded border border-red-950 text-red-800 hover:text-red-400 hover:border-red-700 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Queue */}
      <div className="border border-red-950 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-red-950/20 border-b border-red-950 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-red-500">Clipes aguardando legenda</div>
          <span className="text-xs text-red-900">0 clipes</span>
        </div>
        <div className="p-8 text-center bg-[#0f0303]">
          <div className="text-red-800 text-sm">Nenhum clipe aguardando</div>
          <p className="text-red-900 text-xs mt-1">Clipes cortados aparecem aqui automaticamente</p>
        </div>
      </div>
    </div>
  );
}
