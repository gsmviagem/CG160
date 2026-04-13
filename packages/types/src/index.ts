// ============================================================
// CG 160 — Shared TypeScript Types
// ============================================================

// ---- Enums / Union Types -----------------------------------

export type Platform = 'tiktok' | 'instagram';
export type VideoProvider = 'runway' | 'kling' | 'luma';

export type IdeaStatus = 'pending' | 'approved' | 'rejected' | 'scripting' | 'scripted';
export type ScriptStatus = 'pending' | 'approved' | 'rejected' | 'images_ready' | 'generating_video' | 'video_ready';
export type VideoStatus = 'generating' | 'ready' | 'approved' | 'rejected' | 'scheduled' | 'publishing' | 'published' | 'failed';
export type PublishStatus = 'pending' | 'published' | 'failed' | 'cancelled';

export type NarrativeType = 'loop' | 'escalation' | 'twist' | 'absurd' | 'relatable' | 'observation';
export type HookType = 'question' | 'action' | 'statement' | 'visual' | 'sound' | 'relatable';
export type HumorType = 'absurd' | 'dry' | 'slapstick' | 'observational' | 'surreal' | 'dark' | 'none';
export type EmotionalTone = 'funny' | 'heartwarming' | 'tense' | 'surprising' | 'satisfying' | 'melancholic';
export type PacingStyle = 'fast' | 'medium' | 'slow' | 'variable' | 'rapid-fire';
export type VoiceStyle = 'energetic' | 'calm' | 'comedic' | 'dramatic' | 'deadpan' | 'warm';
export type CaptionStyle = 'minimal' | 'expressive' | 'none' | 'subtitle' | 'kinetic';
export type FormatType = 'micro-scene' | 'character-arc' | 'reaction' | 'observation' | 'tutorial-parody' | 'monologue';

export type PatternType = 'hook' | 'narrative' | 'pacing' | 'visual' | 'humor' | 'emotional' | 'structure';
export type LearningWeightCategory = 'script_scoring' | 'generation' | 'idea_scoring';
export type ApprovalAction = 'approved' | 'rejected' | 'regenerate_requested' | 'scheduled';
export type SnapshotType = 'hourly' | '6h' | 'daily' | '72h' | 'weekly' | 'monthly';

// ---- Core Domain Types -------------------------------------

export interface Character {
  id: string;
  name: string;
  slug: string;
  description: string;
  visual_style: string;
  personality: string[];
  voice_style: string | null;
  universe: string | null;
  video_count: number;
  avg_performance_score: number | null;
  performance_trend: 'rising' | 'falling' | 'neutral';
  active: boolean;
  retired_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Trend {
  id: string;
  source: string;
  topic: string;
  keywords: string[];
  description: string | null;
  estimated_virality_score: number | null;
  relevance_score: number | null;
  category: string | null;
  discovered_at: string;
  valid_until: string | null;
  active: boolean;
  processed: boolean;
  metadata: Record<string, unknown>;
}

export interface PatternLibraryEntry {
  id: string;
  pattern_type: PatternType;
  name: string;
  slug: string;
  description: string;
  example: string | null;
  usage_count: number;
  avg_performance_score: number;
  success_rate: number;
  weight: number;
  baseline_weight: number;
  platform_bias: Platform | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Idea {
  id: string;
  title: string;
  concept: string;
  character_id: string | null;
  trend_id: string | null;
  hook_summary: string | null;
  narrative_type: NarrativeType | null;
  target_emotion: EmotionalTone | null;
  format_type: FormatType | null;
  source_patterns: string[];
  predicted_retention_score: number | null;
  novelty_score: number | null;
  diversity_score: number | null;
  total_score: number | null;
  score_breakdown: IdeaScoreBreakdown;
  status: IdeaStatus;
  rejection_reason: string | null;
  rejected_at: string | null;
  generation_model: string | null;
  generation_prompt: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // joins
  character?: Character;
  trend?: Trend;
}

export interface IdeaScoreBreakdown {
  predicted_retention?: { score: number; rationale: string };
  novelty?: { score: number; rationale: string };
  diversity?: { score: number; rationale: string };
  [key: string]: { score: number; rationale: string } | undefined;
}

export interface ScriptScene {
  scene_number: number;
  description: string;
  dialogue: string;
  visual_direction: string;
  duration_estimate_seconds: number;
  sound_notes?: string;
}

export interface Script {
  id: string;
  idea_id: string;
  title: string;
  content: string;
  hook: string;
  scenes: ScriptScene[];
  duration_estimate_seconds: number | null;
  voice_style: VoiceStyle | null;
  pacing_style: PacingStyle | null;
  humor_type: HumorType | null;
  emotional_tone: EmotionalTone | null;
  caption_style: CaptionStyle | null;
  // 14-dimension scores
  hook_strength: number | null;
  clarity_score: number | null;
  emotional_trigger_score: number | null;
  curiosity_gap_score: number | null;
  pacing_density_score: number | null;
  setup_simplicity_score: number | null;
  punchline_strength: number | null;
  loop_potential: number | null;
  shareability_score: number | null;
  memorability_score: number | null;
  novelty_score: number | null;
  absurdity_balance: number | null;
  visual_feasibility: number | null;
  viral_structure_alignment: number | null;
  total_score: number | null;
  score_breakdown: ScriptScoreBreakdown;
  version: number;
  parent_script_id: string | null;
  status: ScriptStatus;
  rejection_reason: string | null;
  rejected_at: string | null;
  approved_at: string | null;
  generation_model: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // joins
  idea?: Idea;
}

export interface ScriptScoreDimension {
  score: number;      // 0–10
  weight: number;     // current learning weight
  weighted_score: number;
  rationale: string;
}

export interface ScriptScoreBreakdown {
  hook_strength?: ScriptScoreDimension;
  clarity_score?: ScriptScoreDimension;
  emotional_trigger_score?: ScriptScoreDimension;
  curiosity_gap_score?: ScriptScoreDimension;
  pacing_density_score?: ScriptScoreDimension;
  setup_simplicity_score?: ScriptScoreDimension;
  punchline_strength?: ScriptScoreDimension;
  loop_potential?: ScriptScoreDimension;
  shareability_score?: ScriptScoreDimension;
  memorability_score?: ScriptScoreDimension;
  novelty_score?: ScriptScoreDimension;
  absurdity_balance?: ScriptScoreDimension;
  visual_feasibility?: ScriptScoreDimension;
  viral_structure_alignment?: ScriptScoreDimension;
}

export interface Video {
  id: string;
  script_id: string;
  title: string;
  storage_path: string | null;
  thumbnail_path: string | null;
  storage_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  ai_provider: VideoProvider | null;
  generation_prompt: string | null;
  generation_params: Record<string, unknown>;
  generation_job_id: string | null;
  // ML features
  character_used: string | null;
  narrative_structure_type: NarrativeType | null;
  hook_type: HookType | null;
  pacing_style: PacingStyle | null;
  voice_style: VoiceStyle | null;
  caption_style: CaptionStyle | null;
  visual_complexity: number | null;
  scene_count: number | null;
  emotional_tone: EmotionalTone | null;
  humor_type: HumorType | null;
  format_type: FormatType | null;
  posting_hour: number | null;
  posting_day_of_week: number | null;
  // versioning
  version: number;
  parent_video_id: string | null;
  // workflow
  status: VideoStatus;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  platform: Platform | null;
  platform_video_id: string | null;
  platform_url: string | null;
  platform_status: string | null;
  caption: string | null;
  hashtags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // joins
  script?: Script;
  latest_metrics?: PerformanceMetrics;
}

export interface PerformanceMetrics {
  id: string;
  video_id: string;
  platform: Platform;
  snapshot_type: SnapshotType;
  measured_at: string;
  hours_since_publish: number | null;
  views: number;
  watch_time_seconds: number | null;
  completion_rate: number | null;
  avg_watch_duration_seconds: number | null;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  profile_visits: number | null;
  follows_from_video: number | null;
  engagement_ratio: number | null;
  retention_score: number | null;
  performance_score: number | null;
  is_stabilized: boolean;
  metadata: Record<string, unknown>;
}

export interface LearningWeight {
  id: string;
  feature_name: string;
  category: LearningWeightCategory;
  description: string | null;
  current_weight: number;
  baseline_weight: number;
  correlation_with_performance: number;
  sample_size: number;
  confidence: number;
  last_adjusted_at: string;
  adjustment_count: number;
  adjustment_history: WeightAdjustmentHistoryEntry[];
  weight_min: number;
  weight_max: number;
  locked: boolean;
  lock_reason: string | null;
  notes: string | null;
  updated_at: string;
}

export interface WeightAdjustmentHistoryEntry {
  adjusted_at: string;
  old_weight: number;
  new_weight: number;
  reason: string;
  sample_size: number;
  correlation: number;
}

export interface PatternCorrelation {
  id: string;
  pattern_feature: string;
  pattern_value: string;
  metric: string;
  correlation_coefficient: number;
  sample_size: number;
  confidence_level: number | null;
  platform: Platform | null;
  computed_at: string;
  valid: boolean;
  metadata: Record<string, unknown>;
}

export interface ViralSignal {
  id: string;
  source_platform: Platform | 'youtube';
  content_type: string;
  topic: string | null;
  category: string | null;
  estimated_views: number | null;
  estimated_engagement: number | null;
  hook_structure: string | null;
  narrative_type: NarrativeType | null;
  duration_seconds: number | null;
  pacing_notes: string | null;
  humor_type: HumorType | null;
  emotional_tone: EmotionalTone | null;
  key_characteristics: string[];
  extracted_patterns: string[];
  structural_notes: string | null;
  virality_score: number | null;
  discovered_at: string;
  analyzed_at: string | null;
  processed: boolean;
  source_reference: string | null;
  metadata: Record<string, unknown>;
}

// ---- API Request/Response Types ----------------------------

export interface GenerateIdeasRequest {
  count?: number;
  character_id?: string;
  trend_id?: string;
  force_novelty?: boolean;
}

export interface GenerateScriptRequest {
  idea_id: string;
  target_duration_seconds?: number;
  style_overrides?: Partial<Pick<Script, 'voice_style' | 'pacing_style' | 'humor_type'>>;
}

export interface GenerateVideoRequest {
  script_id: string;
  platform: Platform;
  provider?: VideoProvider;
}

export interface ApprovalRequest {
  entity_type: 'idea' | 'script' | 'video';
  entity_id: string;
  action: ApprovalAction;
  reason?: string;
  notes?: string;
  scheduled_at?: string; // for 'scheduled' action on videos
}

export interface ScriptScore {
  total_score: number;
  dimensions: ScriptScoreBreakdown;
  passes_threshold: boolean;
  threshold_used: number;
  weights_version: string;
}

export interface LearningLoopResult {
  run_id: string;
  videos_analyzed: number;
  weights_adjusted: number;
  new_correlations: number;
  patterns_updated: number;
  summary: string;
  completed_at: string;
}

// ---- Dashboard/UI Types ------------------------------------

export interface ApprovalQueueItem {
  type: 'idea' | 'script' | 'video';
  id: string;
  title: string;
  score: number | null;
  created_at: string;
  preview_text: string;
  data: Idea | Script | Video;
}

export interface DashboardStats {
  ideas_pending: number;
  scripts_pending: number;
  videos_pending_approval: number;
  videos_published_7d: number;
  avg_performance_score_7d: number | null;
  learning_loop_last_run: string | null;
  top_performing_pattern: string | null;
}
