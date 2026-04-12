# CG 160 — AI-Native Viral Content Engine

CG 160 is a self-improving content lab that continuously generates, evaluates, improves, and publishes short-form videos optimized for TikTok and Instagram Reels.

The system learns from every video it publishes. Scoring weights adjust daily based on performance correlations. Each generation cycle is smarter than the last.

---

## Architecture

```
Trend Signals + Pattern Library + Learning Weights
           ↓
     Idea Generator (Claude)
           ↓
     Script Generator (Claude)
           ↓
     Script Scorer (Claude, 14 dimensions, adaptive weights)
           ↓
     Human Approval Queue (web dashboard)
           ↓
     Video Generator (RunwayML / Kling)
           ↓
     Human Video Approval
           ↓
     Scheduler → Publisher (TikTok / Instagram)
           ↓
     Metrics Sync (1h / 6h / 24h / 72h snapshots)
           ↓
     Learning Loop (daily, Pearson correlation + EMA weight adjustment)
           ↓
     ← feeds back into generation
```

## Stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js 15 on Vercel |
| Database + Auth + Storage | Supabase |
| Job Queue | Inngest |
| Script/Idea AI | Anthropic Claude (claude-sonnet-4-6) |
| Video Generation | RunwayML Gen-3 / Kling |
| Monorepo | Turborepo |
| Repository | GitHub |

## Monorepo Structure

```
cg160/
├── apps/
│   └── web/                    # Next.js app (dashboard + API + workers)
│       ├── src/app/            # App router pages + API routes
│       ├── src/workers/        # Inngest function definitions
│       └── src/lib/            # Supabase client, Inngest client, utils
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── db/                     # Supabase client + query helpers
│   ├── scoring/                # Script scoring engine (14 dimensions)
│   ├── ai/                     # AI provider abstraction (Claude + video)
│   └── learning/               # Learning loop (features, correlations, weights)
├── supabase/
│   └── migrations/001_init.sql # Full database schema
├── vercel.json                 # Cron job definitions
└── .env.example                # All environment variables
```

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_ORG/cg160.git
cd cg160
npm install
```

### 2. Environment

```bash
cp .env.example .env.local
# Fill in all values — see .env.example for documentation
```

### 3. Database

```bash
npx supabase start          # Start local Supabase
npx supabase db push        # Run migrations
```

### 4. Development

```bash
npm run dev                 # Start Next.js + all packages
```

### 5. Inngest local dev

```bash
npx inngest-cli dev         # Start Inngest dev server
# Visit http://localhost:8288 to trigger functions
```

---

## Learning Loop

Every night at 3am UTC, the learning loop:

1. Loads all videos with stabilized (72h+) performance metrics
2. Extracts feature vectors (14 scoring dimensions + content attributes)
3. Computes Pearson correlations between each dimension and `performance_score`
4. Adjusts scoring weights via EMA: `w_new = 0.85×w_old + 0.15×target`
5. Clamps weights to `[0.3, 3.0]` — prevents collapse or explosion
6. Stores updated weights — next generation cycle uses them automatically

**Minimum sample size before first adjustment: 20 videos** (configurable via `LEARNING_MIN_SAMPLE_SIZE`).

## Script Scoring (14 Dimensions)

| Dimension | Description |
|---|---|
| hook_strength | First 1–3 second scroll-stopping power |
| clarity_score | Immediate understanding with zero context |
| emotional_trigger_score | Visceral emotional response |
| curiosity_gap_score | Must-watch-to-end tension |
| pacing_density_score | Information density per second |
| setup_simplicity_score | Minimal, fast setup |
| punchline_strength | Payoff quality |
| loop_potential | Rewatch value |
| shareability_score | Send-to-someone impulse |
| memorability_score | Still-thinking-about-it-tomorrow |
| novelty_score | Genuinely original |
| absurdity_balance | Calibrated weird (not chaotic) |
| visual_feasibility | Achievable with AI video generation |
| viral_structure_alignment | Matches proven viral patterns |

## Cron Schedule

| Job | Schedule | Purpose |
|---|---|---|
| generate-ideas | Every 6h | 10 new scored ideas |
| sync-metrics | Every 1h | Platform performance sync |
| learning-loop | Daily 3am | Weight adjustment |

Scripts and videos generate on-demand after approval events.

## Human Approval Flow

`/dashboard/approval` shows three queues in priority order:
1. **Videos** — review generated videos, approve/reject/regenerate
2. **Scripts** — review scored scripts
3. **Ideas** — review generated concepts

Approving a script automatically triggers video generation.
Approving a video sets it to `scheduled` status for publishing.

---

## AI Providers

### Text (Claude)
- Idea generation: `claude-sonnet-4-6`, temperature 0.9
- Script generation: `claude-sonnet-4-6`, temperature 0.85
- Script scoring: `claude-sonnet-4-6`, temperature 0.2

### Video
- Default: RunwayML Gen-3 Alpha Turbo
- Alternative: Kling v1.5
- Set via `VIDEO_PROVIDER` env var: `runway` | `kling` | `luma`

---

## Environment Variables

See `.env.example` for all required variables with documentation.

Key vars:
- `ANTHROPIC_API_KEY` — Claude access
- `RUNWAY_API_KEY` / `KLING_API_KEY` — video generation
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — database
- `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` — job queue
- `CRON_SECRET` — secures Vercel cron endpoints
