export const revalidate = 0;

export default function FilaDeCortes() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-red-200">Fila de Cortes</h1>
        <p className="text-red-900/80 mt-1 text-sm">
          Vídeos importados. Defina os cortes, ajuste timing e exporte os clipes.
        </p>
      </div>

      <div className="border border-red-950 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-red-950/20 border-b border-red-950 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-red-500">Vídeos na fila</div>
          <span className="text-xs text-red-900">0 vídeos</span>
        </div>
        <div className="p-8 text-center bg-[#0f0303]">
          <div className="text-red-800 text-sm mb-2">Nenhum vídeo na fila</div>
          <p className="text-red-900 text-xs mb-4">Importe vídeos na aba Buscar para começar a editar</p>
          <a
            href="/cortes/buscar"
            className="inline-block text-xs px-3 py-1.5 rounded border border-red-900 text-red-700 hover:text-red-400 hover:border-red-700 transition-colors"
          >
            Ir para Buscar
          </a>
        </div>
      </div>

      <div className="mt-6 p-4 bg-red-950/10 border border-red-950/50 rounded-lg">
        <div className="text-xs font-semibold text-red-800 uppercase tracking-wider mb-2">Como funciona</div>
        <ul className="text-xs text-red-900 space-y-1">
          <li>• Importe um vídeo longo na aba Buscar</li>
          <li>• Defina os pontos de entrada e saída de cada corte</li>
          <li>• O sistema gera os clipes em 9:16 automaticamente</li>
          <li>• Cada clipe vai para a fila de Legendas</li>
        </ul>
      </div>
    </div>
  );
}
