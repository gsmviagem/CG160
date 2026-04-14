export const revalidate = 0;

export default function CortesOverview() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-red-200">Modo Cortes</h1>
        <p className="text-red-900/80 mt-1 text-sm">
          Importe vídeos, recorte os melhores momentos, adicione legendas e publique automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard label="Vídeos importados" value="0" />
        <StatCard label="Cortes prontos" value="0" />
        <StatCard label="Aguardando legenda" value="0" />
        <StatCard label="Na fila de postagem" value="0" />
      </div>

      <div className="border border-red-950 rounded-lg p-6 bg-red-950/10 text-center">
        <div className="text-red-800 text-sm mb-3">Nenhum vídeo importado ainda</div>
        <a
          href="/cortes/buscar"
          className="inline-block text-sm px-4 py-2 rounded bg-red-900 hover:bg-red-800 text-red-200 transition-colors"
        >
          Buscar vídeos
        </a>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-red-950/20 border border-red-950 rounded-lg p-4">
      <div className="text-2xl font-bold text-red-300">{value}</div>
      <div className="text-xs text-red-800 mt-1">{label}</div>
    </div>
  );
}
