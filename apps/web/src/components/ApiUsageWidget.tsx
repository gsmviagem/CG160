// ============================================================
// CG 160 — API Usage Widget
//
// Shows estimated Groq token consumption today vs daily limits,
// and how many more ideas/scripts can be generated.
//
// Token estimates (conservative averages):
//   Idea (per unit): ~360 tokens  (1,800 / 5-idea batch)
//   Script:          ~5,200 tokens (1,200 input + 4,000 output)
//   Score:           ~  800 tokens (included in script total)
//
// Groq free tier limits (primary model llama-3.3-70b-versatile):
//   500,000 tokens/day (TPD)
//   6,000 tokens/minute (TPM) — affects fallback models most
// ============================================================

const TOKENS_PER_IDEA   = 360;   // per individual idea
const TOKENS_PER_SCRIPT = 5_200; // generation + scoring combined
const GROQ_DAILY_LIMIT  = 500_000;

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface Props {
  ideasToday: number;
  scriptsToday: number;
}

export function ApiUsageWidget({ ideasToday, scriptsToday }: Props) {
  const tokensUsed     = ideasToday * TOKENS_PER_IDEA + scriptsToday * TOKENS_PER_SCRIPT;
  const tokensLeft     = Math.max(0, GROQ_DAILY_LIMIT - tokensUsed);
  const usagePct       = Math.min(100, Math.round((tokensUsed / GROQ_DAILY_LIMIT) * 100));

  const ideasLeft      = Math.floor(tokensLeft / TOKENS_PER_IDEA);
  const scriptsLeft    = Math.floor(tokensLeft / TOKENS_PER_SCRIPT);

  const barColor = usagePct >= 90 ? 'bg-red-500'
                 : usagePct >= 70 ? 'bg-yellow-500'
                 : 'bg-green-500';

  function fmt(n: number) {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Uso de API — Hoje</h2>
        <span className="text-xs text-gray-600">Groq free tier · resets à meia-noite</span>
      </div>

      {/* Token progress */}
      <div className="mb-5">
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-xs text-gray-500">Tokens estimados</span>
          <span className="text-xs font-mono text-gray-400">
            {fmt(tokensUsed)} <span className="text-gray-600">/ {fmt(GROQ_DAILY_LIMIT)}</span>
          </span>
        </div>
        <ProgressBar value={tokensUsed} max={GROQ_DAILY_LIMIT} color={barColor} />
        <div className="text-xs text-gray-600 mt-1">{usagePct}% usado — {fmt(tokensLeft)} tokens restantes</div>
      </div>

      {/* Capacity breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {/* Ideas */}
        <div className="bg-gray-800/60 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-yellow-400 font-semibold">Ideias</span>
            <span className="text-xs text-gray-500">hoje: {ideasToday}</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{ideasLeft.toLocaleString()}</div>
          <div className="text-xs text-gray-600">ainda posso gerar</div>
          <div className="mt-2">
            <ProgressBar value={ideasToday} max={ideasToday + ideasLeft} color="bg-yellow-500" />
          </div>
        </div>

        {/* Scripts */}
        <div className="bg-gray-800/60 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-blue-400 font-semibold">Scripts</span>
            <span className="text-xs text-gray-500">hoje: {scriptsToday}</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{scriptsLeft}</div>
          <div className="text-xs text-gray-600">ainda posso gerar</div>
          <div className="mt-2">
            <ProgressBar value={scriptsToday} max={scriptsToday + scriptsLeft} color="bg-blue-500" />
          </div>
        </div>
      </div>

      {/* Model info */}
      <div className="mt-4 pt-3 border-t border-gray-800 flex items-center gap-4 flex-wrap">
        <span className="text-xs text-gray-600">
          Modelo: <span className="text-gray-500">llama-3.3-70b-versatile</span>
        </span>
        <span className="text-xs text-gray-600">
          Fallback: <span className="text-gray-500">llama-3.1-8b → gemma2-9b</span>
        </span>
        <span className="text-xs text-gray-600">
          ~{TOKENS_PER_IDEA} tok/ideia · ~{fmt(TOKENS_PER_SCRIPT)} tok/script
        </span>
      </div>
    </div>
  );
}
