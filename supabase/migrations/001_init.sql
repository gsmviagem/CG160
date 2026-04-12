-- ============================================================
-- CG 160 — Initial Database Schema
-- ============================================================
-- Run order matters. All tables with foreign keys come after
-- the tables they reference.
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text similarity

-- ============================================================
-- CHARACTERS
-- Recurring AI characters. Can evolve based on performance.
-- ============================================================
CREATE TABLE characters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT NOT NULL,
  visual_style  TEXT NOT NULL,
  personality   JSONB NOT NULL DEFAULT '[]', -- array of trait strings
  voice_style   TEXT,
  universe      TEXT, -- the world/context this character lives in
  -- performance tracking
  video_count   INT NOT NULL DEFAULT 0,
  avg_performance_score FLOAT,
  performance_trend TEXT DEFAULT 'neutral', -- 'rising' | 'falling' | 'neutral'
  -- state
  active        BOOLEAN NOT NULL DEFAULT true,
  retired_at    TIMESTAMPTZ,
  notes         TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TRENDS
-- Viral trend signals discovered from external sources or
-- identified through internal analysis.
-- ============================================================
CREATE TABLE trends (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT NOT NULL, -- 'tiktok' | 'instagram' | 'youtube' | 'internal' | 'manual'
  topic           TEXT NOT NULL,
  keywords        JSONB NOT NULL DEFAULT '[]',
  description     TEXT,
  estimated_virality_score FLOAT,         -- 0–100
  relevance_score FLOAT,                  -- 0–100, how relevant to our content style
  category        TEXT,                   -- 'comedy' | 'educational' | 'emotional' | etc
  -- time window
  discovered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until     TIMESTAMPTZ,
  -- state
  active          BOOLEAN NOT NULL DEFAULT true,
  processed       BOOLEAN NOT NULL DEFAULT false,
  metadata        JSONB NOT NULL DEFAULT '{}'
);

-- ============================================================
-- PATTERN LIBRARY
-- Extracted structural patterns from high-performing content.
-- Weights are adjusted by the learning loop.
-- ============================================================
CREATE TABLE pattern_library (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type    TEXT NOT NULL, -- 'hook' | 'narrative' | 'pacing' | 'visual' | 'humor' | 'emotional' | 'structure'
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT NOT NULL,
  example         TEXT,
  -- performance stats
  usage_count     INT NOT NULL DEFAULT 0,
  avg_performance_score FLOAT DEFAULT 0,
  success_rate    FLOAT DEFAULT 0,        -- % of uses that hit performance threshold
  -- learning weight (adjusted by learning loop)
  weight          FLOAT NOT NULL DEFAULT 1.0,
  baseline_weight FLOAT NOT NULL DEFAULT 1.0,
  -- metadata
  platform_bias   TEXT,                  -- 'tiktok' | 'instagram' | null (works on both)
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- IDEAS
-- Generated content concepts, before scripting.
-- ============================================================
CREATE TABLE ideas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  concept         TEXT NOT NULL,          -- 1–2 sentence concept description
  character_id    UUID REFERENCES characters(id),
  trend_id        UUID REFERENCES trends(id),
  -- key elements
  hook_summary    TEXT,                   -- the opening hook idea
  narrative_type  TEXT,                  -- 'loop' | 'escalation' | 'twist' | 'absurd' | 'relatable'
  target_emotion  TEXT,                  -- 'funny' | 'surprising' | 'satisfying' | 'relatable'
  format_type     TEXT,                  -- 'micro-scene' | 'character-arc' | 'reaction' | 'observation'
  source_patterns JSONB NOT NULL DEFAULT '[]', -- array of pattern_library ids that influenced this
  -- scoring
  predicted_retention_score FLOAT,       -- 0–100
  novelty_score   FLOAT,                 -- 0–100
  diversity_score FLOAT,                 -- 0–100 (vs recent content)
  total_score     FLOAT,                 -- 0–100 composite
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  -- workflow
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'scripting' | 'scripted'
  rejection_reason TEXT,
  rejected_at     TIMESTAMPTZ,
  -- generation metadata
  generation_model TEXT,
  generation_prompt TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SCRIPTS
-- Full scripts generated from approved ideas.
-- Each script is scored on 14 dimensions.
-- ============================================================
CREATE TABLE scripts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id         UUID NOT NULL REFERENCES ideas(id),
  title           TEXT NOT NULL,
  -- content
  content         TEXT NOT NULL,          -- full script text
  hook            TEXT NOT NULL,          -- the opening hook (first ~3 seconds)
  scenes          JSONB NOT NULL DEFAULT '[]', -- array of { scene_number, description, dialogue, visual_direction, duration_estimate }
  -- production specs
  duration_estimate_seconds INT,
  voice_style     TEXT,                  -- 'energetic' | 'calm' | 'comedic' | 'dramatic'
  pacing_style    TEXT,                  -- 'fast' | 'medium' | 'slow' | 'variable'
  humor_type      TEXT,                  -- 'absurd' | 'dry' | 'slapstick' | 'observational' | 'surreal'
  emotional_tone  TEXT,                  -- 'funny' | 'heartwarming' | 'tense' | 'surprising'
  caption_style   TEXT,                  -- 'minimal' | 'expressive' | 'none' | 'subtitle'
  -- 14-dimension score
  hook_strength               FLOAT,     -- 0–10
  clarity_score               FLOAT,     -- 0–10
  emotional_trigger_score     FLOAT,     -- 0–10
  curiosity_gap_score         FLOAT,     -- 0–10
  pacing_density_score        FLOAT,     -- 0–10
  setup_simplicity_score      FLOAT,     -- 0–10
  punchline_strength          FLOAT,     -- 0–10
  loop_potential              FLOAT,     -- 0–10
  shareability_score          FLOAT,     -- 0–10
  memorability_score          FLOAT,     -- 0–10
  novelty_score               FLOAT,     -- 0–10
  absurdity_balance           FLOAT,     -- 0–10
  visual_feasibility          FLOAT,     -- 0–10
  viral_structure_alignment   FLOAT,     -- 0–10
  total_score                 FLOAT,     -- 0–100 weighted composite
  score_breakdown             JSONB NOT NULL DEFAULT '{}', -- { dimension: { score, weight, rationale } }
  -- versioning
  version         INT NOT NULL DEFAULT 1,
  parent_script_id UUID REFERENCES scripts(id),
  -- workflow
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'generating_video' | 'video_ready'
  rejection_reason TEXT,
  rejected_at     TIMESTAMPTZ,
  approved_at     TIMESTAMPTZ,
  -- generation metadata
  generation_model TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- VIDEOS
-- Generated videos. Each video stores full content attributes
-- for ML feature extraction.
-- ============================================================
CREATE TABLE videos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id       UUID NOT NULL REFERENCES scripts(id),
  title           TEXT NOT NULL,
  -- storage
  storage_path    TEXT,                  -- Supabase storage path
  thumbnail_path  TEXT,
  storage_url     TEXT,                  -- signed or public URL
  thumbnail_url   TEXT,
  duration_seconds FLOAT,
  -- generation
  ai_provider     TEXT,                  -- 'runway' | 'kling' | 'luma'
  generation_prompt TEXT,
  generation_params JSONB NOT NULL DEFAULT '{}',
  generation_job_id TEXT,               -- provider-specific job ID
  -- content attributes (ML features)
  character_used          TEXT,
  narrative_structure_type TEXT,
  hook_type               TEXT,         -- 'question' | 'action' | 'statement' | 'visual' | 'sound'
  pacing_style            TEXT,
  voice_style             TEXT,
  caption_style           TEXT,
  visual_complexity       INT,          -- 1–10
  scene_count             INT,
  emotional_tone          TEXT,
  humor_type              TEXT,
  format_type             TEXT,
  posting_hour            INT,          -- 0–23, used for time correlation
  posting_day_of_week     INT,          -- 0–6
  -- versioning
  version         INT NOT NULL DEFAULT 1,
  parent_video_id UUID REFERENCES videos(id),
  -- workflow
  status          TEXT NOT NULL DEFAULT 'generating',
  -- 'generating' | 'ready' | 'approved' | 'rejected' | 'scheduled' | 'publishing' | 'published' | 'failed'
  rejection_reason TEXT,
  approved_by     TEXT,
  approved_at     TIMESTAMPTZ,
  scheduled_at    TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  -- platform
  platform        TEXT,                 -- 'tiktok' | 'instagram'
  platform_video_id TEXT,
  platform_url    TEXT,
  platform_status TEXT,                 -- platform-specific status
  -- caption / hashtags
  caption         TEXT,
  hashtags        JSONB NOT NULL DEFAULT '[]',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PERFORMANCE METRICS
-- Snapshot-based performance data per video per platform.
-- Snapshots are taken at: 1h, 6h, 24h, 72h, 7d, 30d
-- ============================================================
CREATE TABLE performance_metrics (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id                UUID NOT NULL REFERENCES videos(id),
  platform                TEXT NOT NULL,
  snapshot_type           TEXT NOT NULL DEFAULT 'daily', -- 'hourly' | '6h' | 'daily' | '72h' | 'weekly' | 'monthly'
  measured_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  hours_since_publish     INT,
  -- raw metrics
  views                   BIGINT NOT NULL DEFAULT 0,
  watch_time_seconds      BIGINT DEFAULT 0,
  completion_rate         FLOAT,         -- 0–1
  avg_watch_duration_seconds FLOAT,
  likes                   BIGINT NOT NULL DEFAULT 0,
  comments                BIGINT NOT NULL DEFAULT 0,
  shares                  BIGINT NOT NULL DEFAULT 0,
  saves                   BIGINT NOT NULL DEFAULT 0,
  profile_visits          BIGINT DEFAULT 0,
  follows_from_video      BIGINT DEFAULT 0,
  -- computed
  engagement_ratio        FLOAT,         -- (likes+comments+shares+saves) / views
  retention_score         FLOAT,         -- composite: completion_rate × 50 + (avg_watch / duration) × 50
  performance_score       FLOAT,         -- composite 0–100 for learning loop
  -- metadata
  is_stabilized           BOOLEAN DEFAULT false, -- true after 72h
  metadata                JSONB NOT NULL DEFAULT '{}'
);

-- ============================================================
-- LEARNING WEIGHTS
-- Adjustable weights for each scoring dimension and generation feature.
-- Updated by the learning loop after each run.
-- ============================================================
CREATE TABLE learning_weights (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name            TEXT NOT NULL UNIQUE,
  category                TEXT NOT NULL, -- 'script_scoring' | 'generation' | 'idea_scoring'
  description             TEXT,
  current_weight          FLOAT NOT NULL DEFAULT 1.0,
  baseline_weight         FLOAT NOT NULL DEFAULT 1.0,
  -- learning stats
  correlation_with_performance FLOAT DEFAULT 0,
  sample_size             INT NOT NULL DEFAULT 0,
  confidence              FLOAT DEFAULT 0,    -- 0–1
  -- history
  last_adjusted_at        TIMESTAMPTZ DEFAULT now(),
  adjustment_count        INT NOT NULL DEFAULT 0,
  adjustment_history      JSONB NOT NULL DEFAULT '[]', -- [ { adjusted_at, old_weight, new_weight, reason, sample_size } ]
  -- bounds
  weight_min              FLOAT NOT NULL DEFAULT 0.3,
  weight_max              FLOAT NOT NULL DEFAULT 3.0,
  -- lock override (manual control)
  locked                  BOOLEAN NOT NULL DEFAULT false,
  lock_reason             TEXT,
  notes                   TEXT,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PATTERN CORRELATIONS
-- Computed correlations between content features and performance.
-- Recomputed by the learning loop.
-- ============================================================
CREATE TABLE pattern_correlations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_feature         TEXT NOT NULL,    -- e.g. 'hook_type', 'humor_type', 'duration_bucket'
  pattern_value           TEXT NOT NULL,    -- e.g. 'question', 'absurd', '30-45s'
  metric                  TEXT NOT NULL,    -- e.g. 'completion_rate', 'performance_score', 'shares'
  correlation_coefficient FLOAT NOT NULL,  -- Pearson r, -1 to 1
  sample_size             INT NOT NULL,
  confidence_level        FLOAT,           -- 0–1
  platform                TEXT,            -- null = all platforms
  computed_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid                   BOOLEAN NOT NULL DEFAULT true,
  metadata                JSONB NOT NULL DEFAULT '{}'
);

-- ============================================================
-- PUBLISHING SCHEDULE
-- ============================================================
CREATE TABLE publishing_schedule (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id        UUID NOT NULL REFERENCES videos(id),
  platform        TEXT NOT NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'published' | 'failed' | 'cancelled'
  published_at    TIMESTAMPTZ,
  attempts        INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  error           TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'
);

-- ============================================================
-- VIRAL SIGNALS
-- External content analyzed for pattern extraction.
-- The system extracts patterns; does NOT copy content.
-- ============================================================
CREATE TABLE viral_signals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_platform     TEXT NOT NULL,           -- 'tiktok' | 'instagram' | 'youtube'
  content_type        TEXT NOT NULL DEFAULT 'video',
  -- signal metadata (no copyrighted content stored)
  topic               TEXT,
  category            TEXT,
  estimated_views     BIGINT,
  estimated_engagement FLOAT,
  -- structural analysis
  hook_structure      TEXT,
  narrative_type      TEXT,
  duration_seconds    FLOAT,
  pacing_notes        TEXT,
  humor_type          TEXT,
  emotional_tone      TEXT,
  -- extracted patterns (the intelligence, not the content)
  key_characteristics JSONB NOT NULL DEFAULT '[]',
  extracted_patterns  JSONB NOT NULL DEFAULT '[]', -- array of pattern_library ids
  structural_notes    TEXT,
  virality_score      FLOAT,                    -- 0–100
  -- workflow
  discovered_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  analyzed_at         TIMESTAMPTZ,
  processed           BOOLEAN NOT NULL DEFAULT false,
  -- source reference (URL for internal tracking only, not scraped content)
  source_reference    TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}'
);

-- ============================================================
-- APPROVAL EVENTS
-- Full audit trail for all approval decisions.
-- ============================================================
CREATE TABLE approval_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT NOT NULL,   -- 'idea' | 'script' | 'video'
  entity_id       UUID NOT NULL,
  action          TEXT NOT NULL,   -- 'approved' | 'rejected' | 'regenerate_requested' | 'scheduled'
  performed_by    TEXT,            -- user id or 'system'
  reason          TEXT,
  notes           TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- GENERATION RUNS
-- Log of each pipeline run for debugging and performance tracking.
-- ============================================================
CREATE TABLE generation_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type        TEXT NOT NULL,   -- 'ideas' | 'scripts' | 'videos' | 'metrics_sync' | 'learning_loop' | 'publish'
  status          TEXT NOT NULL DEFAULT 'running', -- 'running' | 'completed' | 'failed'
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  duration_ms     INT,
  items_processed INT NOT NULL DEFAULT 0,
  items_succeeded INT NOT NULL DEFAULT 0,
  items_failed    INT NOT NULL DEFAULT 0,
  error           TEXT,
  summary         JSONB NOT NULL DEFAULT '{}',
  metadata        JSONB NOT NULL DEFAULT '{}'
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Ideas
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_total_score ON ideas(total_score DESC);
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC);

-- Scripts
CREATE INDEX idx_scripts_status ON scripts(status);
CREATE INDEX idx_scripts_total_score ON scripts(total_score DESC);
CREATE INDEX idx_scripts_idea_id ON scripts(idea_id);

-- Videos
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_platform ON videos(platform);
CREATE INDEX idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX idx_videos_script_id ON videos(script_id);

-- Performance metrics
CREATE INDEX idx_performance_video_id ON performance_metrics(video_id);
CREATE INDEX idx_performance_platform ON performance_metrics(platform);
CREATE INDEX idx_performance_measured_at ON performance_metrics(measured_at DESC);
CREATE INDEX idx_performance_stabilized ON performance_metrics(is_stabilized);

-- Pattern correlations
CREATE INDEX idx_correlations_feature ON pattern_correlations(pattern_feature, pattern_value);
CREATE INDEX idx_correlations_metric ON pattern_correlations(metric);

-- Approval events
CREATE INDEX idx_approval_entity ON approval_events(entity_type, entity_id);

-- Viral signals
CREATE INDEX idx_viral_processed ON viral_signals(processed);
CREATE INDEX idx_viral_platform ON viral_signals(source_platform);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_pattern_library_updated_at BEFORE UPDATE ON pattern_library FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON ideas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON scripts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_learning_weights_updated_at BEFORE UPDATE ON learning_weights FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- SEED: Initial learning weights for all 14 scoring dimensions
-- ============================================================
INSERT INTO learning_weights (feature_name, category, description, current_weight, baseline_weight) VALUES
  ('hook_strength',             'script_scoring', 'Strength of the opening hook', 1.0, 1.0),
  ('clarity_score',             'script_scoring', 'Clarity within first 3 seconds', 1.0, 1.0),
  ('emotional_trigger_score',   'script_scoring', 'Presence of emotional triggers', 1.0, 1.0),
  ('curiosity_gap_score',       'script_scoring', 'Strength of curiosity gap created', 1.0, 1.0),
  ('pacing_density_score',      'script_scoring', 'Information density and pacing quality', 1.0, 1.0),
  ('setup_simplicity_score',    'script_scoring', 'Simplicity and accessibility of setup', 1.0, 1.0),
  ('punchline_strength',        'script_scoring', 'Strength of punchline or payoff', 1.0, 1.0),
  ('loop_potential',            'script_scoring', 'Potential to loop and rewatch', 1.0, 1.0),
  ('shareability_score',        'script_scoring', 'Likelihood of being shared', 1.0, 1.0),
  ('memorability_score',        'script_scoring', 'How memorable the concept is', 1.0, 1.0),
  ('novelty_score',             'script_scoring', 'Novelty vs existing content', 1.0, 1.0),
  ('absurdity_balance',         'script_scoring', 'Balance of absurdity (not too chaotic, not too bland)', 1.0, 1.0),
  ('visual_feasibility',        'script_scoring', 'How achievable with AI video generation', 1.0, 1.0),
  ('viral_structure_alignment', 'script_scoring', 'Alignment with known viral structures', 1.0, 1.0);

-- Seed initial patterns
INSERT INTO pattern_library (pattern_type, name, slug, description, example, weight) VALUES
  ('hook', 'Question Hook', 'question-hook', 'Opens with a compelling question that demands an answer', '"What if your fruit could talk back?"', 1.0),
  ('hook', 'Shocking Statement Hook', 'shocking-statement-hook', 'Opens with a surprising or counterintuitive statement', '"The strawberry has been lying to you this whole time."', 1.0),
  ('hook', 'Action Hook', 'action-hook', 'Starts mid-action with no preamble', 'Character already in the middle of a bizarre situation', 1.0),
  ('hook', 'Relatable Observation Hook', 'relatable-observation-hook', 'Opens by naming a universal experience', '"You know when you wake up and immediately regret existing?"', 1.0),
  ('narrative', 'Escalating Absurdity', 'escalating-absurdity', 'Starts grounded, each beat gets more absurd', 'Normal fruit → existential crisis → becomes a philosopher', 1.0),
  ('narrative', 'Twist Reveal', 'twist-reveal', 'Setup appears one way; last beat reveals the opposite', 'The antagonist was the protagonist all along', 1.0),
  ('narrative', 'Loop Structure', 'loop-structure', 'Ending connects back to beginning, creates rewatch desire', 'Final beat is the first beat seen in a new light', 1.0),
  ('narrative', 'Relatable Struggle Arc', 'relatable-struggle-arc', 'Character faces familiar problem in unfamiliar way', 'Banana trying to fit in at a vegetable party', 1.0),
  ('humor', 'Surreal Absurdism', 'surreal-absurdism', 'Logic exists but is completely sideways from reality', 'Gravity works, but emotions are measured in kilograms', 1.0),
  ('humor', 'Dry Deadpan', 'dry-deadpan', 'Absurd events treated as completely normal', 'Character calmly discusses the end of the world over breakfast', 1.0),
  ('pacing', 'Rapid Fire Beats', 'rapid-fire-beats', '3+ micro-beats in under 15 seconds', 'Setup, escalation, twist, payoff, button', 1.0),
  ('pacing', 'Slow Burn Build', 'slow-burn-build', 'Deliberate buildup with satisfying release', 'Tension builds across 30 seconds; single-beat payoff', 1.0),
  ('visual', 'Single Character Focus', 'single-character-focus', 'One character, one environment, maximum expressiveness', 'Full attention on one character reaction', 1.0),
  ('visual', 'Contrast Cut', 'contrast-cut', 'Visual contrast between scenes for comedic/dramatic effect', 'Luxury setting → chaotic reality cut', 1.0),
  ('structure', '15-Second Loop', '15s-loop', 'Complete story in 15 seconds, designed to loop', 'Ultra-dense, max-retention format', 1.0),
  ('structure', '30-Second Escalation', '30s-escalation', '30-second arc with 4 clear beats', 'Hook, setup, escalation, payoff', 1.0),
  ('structure', '45-Second Full Arc', '45s-full-arc', 'Full character-based story in 45 seconds', 'Complete micro-narrative with emotional resolution', 1.0);
