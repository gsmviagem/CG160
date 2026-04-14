// ============================================================
// CG 160 — API Usage Widget (redesigned)
// Token estimates:
//   Idea:   ~360 tokens   (per unit, batch of 5)
//   Script: ~5,200 tokens (gen + scoring combined)
// Groq free tier: 500k TPD, 6k TPM
// ============================================================

const TOKENS_PER_IDEA   = 360;
const TOKENS_PER_SCRIPT = 5_200;
const GROQ_DAILY_LIMIT  = 500_000;

// ── Gauge SVG (half-circle speedometer) ───────────────────
function Gauge({ pct }: { pct: number }) {
  // Half-circle: M 8 52 A 42 42 0 0 1 92 52
  // Arc length ≈ π × 42 ≈ 131.95
  const ARC   = 131.95;
  const filled = Math.min(ARC, (pct / 100) * ARC);

  const [c1, c2] =
    pct >= 90 ? ['#f87171', '#dc2626'] :
    pct >= 70 ? ['#fbbf24', '#d97706'] :
                ['#818cf8', '#6366f1'];

  return (
    <svg viewBox="0 0 100 58" className="w-full max-w-[180px] mx-auto select-none">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
        <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track */}
      <path
        d="M 8 52 A 42 42 0 0 1 92 52"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Filled arc */}
      {pct > 0 && (
        <path
          d="M 8 52 A 42 42 0 0 1 92 52"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${ARC}`}
          filter="url(#gaugeGlow)"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.2,0.64,1)' }}
        />
      )}

      {/* Percentage */}
      <text
        x="50" y="46"
        textAnchor="middle"
        fill="white"
        fontSize="15"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.5"
      >
        {pct}%
      </text>
    </svg>
  );
}

// ── Gradient progress bar ─────────────────────────────────
function Bar({
  value, max, gradient, glow,
}: {
  value: number; max: number;
  gradient: string; glow: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-[5px] bg-white/[0.06] rounded-full overflow-visible relative">
      <div
        className={`h-full rounded-full ${gradient}`}
        style={{
          width: `${pct}%`,
          transition: 'width 0.8s cubic-bezier(0.34,1.2,0.64,1)',
          boxShadow: pct > 0 ? glow : 'none',
        }}
      />
    </div>
  );
}

function fmt(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
       : n >= 1_000     ? `${(n / 1_000).toFixed(1)}k`
       : String(n);
}

interface Props { ideasToday: number; scriptsToday: number; }

export function ApiUsageWidget({ ideasToday, scriptsToday }: Props) {
  const tokensUsed  = ideasToday * TOKENS_PER_IDEA + scriptsToday * TOKENS_PER_SCRIPT;
  const tokensLeft  = Math.max(0, GROQ_DAILY_LIMIT - tokensUsed);
  const usagePct    = Math.min(100, Math.round((tokensUsed / GROQ_DAILY_LIMIT) * 100));
  const ideasLeft   = Math.floor(tokensLeft / TOKENS_PER_IDEA);
  const scriptsLeft = Math.floor(tokensLeft / TOKENS_PER_SCRIPT);

  return (
    <div className="bg-white/[0.03] rounded-2xl p-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-xs text-white/25 font-semibold uppercase tracking-widest">Uso de API</div>
          <div className="text-white font-semibold mt-0.5">Groq · Hoje</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/20">reset à meia-noite</div>
          <div className="text-xs text-white/15 mt-0.5">llama-3.3-70b</div>
        </div>
      </div>

      {/* Gauge */}
      <div className="mb-2">
        <Gauge pct={usagePct} />
      </div>

      {/* Token counts below gauge */}
      <div className="flex justify-between text-xs mb-6 px-1">
        <div>
          <div className="text-white/60 font-semibold">{fmt(tokensUsed)}</div>
          <div className="text-white/20 mt-0.5">usados</div>
        </div>
        <div className="text-right">
          <div className="text-white/60 font-semibold">{fmt(tokensLeft)}</div>
          <div className="text-white/20 mt-0.5">restantes</div>
        </div>
      </div>

      {/* Capacity cards */}
      <div className="grid grid-cols-2 gap-3">

        {/* Ideas */}
        <div className="bg-white/[0.04] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-white/30 font-semibold uppercase tracking-widest">Ideias</span>
            <span className="text-[11px] text-white/20">{ideasToday} hoje</span>
          </div>
          <div className="text-2xl font-bold text-white mb-0.5">{ideasLeft.toLocaleString()}</div>
          <div className="text-[11px] text-white/25 mb-3">ainda posso gerar</div>
          <Bar
            value={ideasToday}
            max={ideasToday + ideasLeft}
            gradient="bg-gradient-to-r from-violet-500 to-indigo-400"
            glow="0 0 8px rgba(139,92,246,0.6)"
          />
        </div>

        {/* Scripts */}
        <div className="bg-white/[0.04] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-white/30 font-semibold uppercase tracking-widest">Scripts</span>
            <span className="text-[11px] text-white/20">{scriptsToday} hoje</span>
          </div>
          <div className="text-2xl font-bold text-white mb-0.5">{scriptsLeft}</div>
          <div className="text-[11px] text-white/25 mb-3">ainda posso gerar</div>
          <Bar
            value={scriptsToday}
            max={scriptsToday + scriptsLeft}
            gradient="bg-gradient-to-r from-blue-500 to-cyan-400"
            glow="0 0 8px rgba(59,130,246,0.6)"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-white/15">
          ~{TOKENS_PER_IDEA} tok/ideia
        </span>
        <span className="text-white/10">·</span>
        <span className="text-[11px] text-white/15">
          ~{fmt(TOKENS_PER_SCRIPT)} tok/script
        </span>
        <span className="text-white/10">·</span>
        <span className="text-[11px] text-white/15">
          fallback: llama-3.1-8b → gemma2-9b
        </span>
      </div>
    </div>
  );
}
