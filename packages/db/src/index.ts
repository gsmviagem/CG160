// ============================================================
// CG 160 — Supabase Database Client
// ============================================================

import { createClient } from '@supabase/supabase-js';

// Server-side client (uses service role key — never expose to browser)
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase server credentials not configured');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// Browser-side client (uses anon key)
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase public credentials not configured');
  }

  return createClient(url, key);
}

export type SupabaseServerClient = ReturnType<typeof createServerClient>;
export type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;

// ---- Query Helpers -----------------------------------------

import type {
  Idea, Script, Video, PerformanceMetrics, LearningWeight,
  Character, PatternLibraryEntry, PatternCorrelation, ViralSignal,
  IdeaStatus, ScriptStatus, VideoStatus,
} from '@cg160/types';

export class DB {
  constructor(private client: SupabaseServerClient) {}

  // --- Characters ---
  async getActiveCharacters(): Promise<Character[]> {
    const { data, error } = await this.client
      .from('characters')
      .select('*')
      .eq('active', true)
      .order('avg_performance_score', { ascending: false, nullsFirst: false });
    if (error) throw error;
    return data ?? [];
  }

  async getCharacterById(id: string): Promise<Character | null> {
    const { data, error } = await this.client
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ?? null;
  }

  // --- Ideas ---
  async createIdea(idea: Omit<Idea, 'id' | 'created_at' | 'updated_at'>): Promise<Idea> {
    const { data, error } = await this.client
      .from('ideas')
      .insert(idea)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getIdeasByStatus(status: IdeaStatus, limit = 50): Promise<Idea[]> {
    const { data, error } = await this.client
      .from('ideas')
      .select('*, characters(*)')
      .eq('status', status)
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  async getIdeaById(id: string): Promise<Idea | null> {
    const { data, error } = await this.client
      .from('ideas')
      .select('*, characters(*)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  async updateIdeaStatus(id: string, status: IdeaStatus, extras?: Partial<Idea>): Promise<void> {
    const { error } = await this.client
      .from('ideas')
      .update({ status, ...extras })
      .eq('id', id);
    if (error) throw error;
  }

  async getRecentIdeas(limit = 50): Promise<Array<{ title: string; concept: string }>> {
    const { data, error } = await this.client
      .from('ideas')
      .select('title, concept')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  // --- Scripts ---
  async createScript(script: Omit<Script, 'id' | 'created_at' | 'updated_at'>): Promise<Script> {
    const { data, error } = await this.client
      .from('scripts')
      .insert(script)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getScriptsByStatus(status: ScriptStatus, limit = 50): Promise<Script[]> {
    const { data, error } = await this.client
      .from('scripts')
      .select('*, ideas(*, characters(*))')
      .eq('status', status)
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  async getScriptById(id: string): Promise<Script | null> {
    const { data, error } = await this.client
      .from('scripts')
      .select('*, ideas(*, characters(*))')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ?? null;
  }

  async updateScriptStatus(id: string, status: ScriptStatus, extras?: Partial<Script>): Promise<void> {
    const { error } = await this.client
      .from('scripts')
      .update({ status, ...extras })
      .eq('id', id);
    if (error) throw error;
  }

  // --- Videos ---
  async createVideo(video: Omit<Video, 'id' | 'created_at' | 'updated_at'>): Promise<Video> {
    const { data, error } = await this.client
      .from('videos')
      .insert(video)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getVideosByStatus(status: VideoStatus, limit = 50): Promise<Video[]> {
    const { data, error } = await this.client
      .from('videos')
      .select('*, scripts(*, ideas(*))')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  async getVideoById(id: string): Promise<Video | null> {
    const { data, error } = await this.client
      .from('videos')
      .select('*, scripts(*, ideas(*, characters(*)))')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ?? null;
  }

  async updateVideo(id: string, updates: Partial<Video>): Promise<void> {
    const { error } = await this.client
      .from('videos')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  }

  // Get videos published and needing metrics sync
  async getPublishedVideosForMetricsSync(): Promise<Video[]> {
    const { data, error } = await this.client
      .from('videos')
      .select('*')
      .eq('status', 'published')
      .not('platform_video_id', 'is', null);
    if (error) throw error;
    return data ?? [];
  }

  // --- Performance Metrics ---
  async insertMetricsSnapshot(metrics: Omit<PerformanceMetrics, 'id'>): Promise<void> {
    const { error } = await this.client
      .from('performance_metrics')
      .insert(metrics);
    if (error) throw error;
  }

  async getLatestMetrics(video_id: string): Promise<PerformanceMetrics | null> {
    const { data, error } = await this.client
      .from('performance_metrics')
      .select('*')
      .eq('video_id', video_id)
      .order('measured_at', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ?? null;
  }

  async getStabilizedMetricsWithVideos(): Promise<Array<{ video: Video; metrics: PerformanceMetrics }>> {
    const { data, error } = await this.client
      .from('performance_metrics')
      .select('*, videos(*, scripts(*))')
      .eq('is_stabilized', true)
      .order('measured_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => ({
      video: row.videos as unknown as Video,
      metrics: {
        id: row.id,
        video_id: row.video_id,
        platform: row.platform,
        snapshot_type: row.snapshot_type,
        measured_at: row.measured_at,
        hours_since_publish: row.hours_since_publish,
        views: row.views,
        watch_time_seconds: row.watch_time_seconds,
        completion_rate: row.completion_rate,
        avg_watch_duration_seconds: row.avg_watch_duration_seconds,
        likes: row.likes,
        comments: row.comments,
        shares: row.shares,
        saves: row.saves,
        profile_visits: row.profile_visits,
        follows_from_video: row.follows_from_video,
        engagement_ratio: row.engagement_ratio,
        retention_score: row.retention_score,
        performance_score: row.performance_score,
        is_stabilized: row.is_stabilized,
        metadata: row.metadata,
      } as PerformanceMetrics,
    }));
  }

  // --- Learning Weights ---
  async getLearningWeights(category?: string): Promise<LearningWeight[]> {
    let query = this.client.from('learning_weights').select('*');
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async updateLearningWeight(
    feature_name: string,
    updates: Partial<LearningWeight>
  ): Promise<void> {
    const { error } = await this.client
      .from('learning_weights')
      .update(updates)
      .eq('feature_name', feature_name);
    if (error) throw error;
  }

  // --- Patterns ---
  async getActivePatterns(): Promise<PatternLibraryEntry[]> {
    const { data, error } = await this.client
      .from('pattern_library')
      .select('*')
      .order('weight', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async upsertPatternCorrelation(
    correlation: Omit<PatternCorrelation, 'id' | 'computed_at'>
  ): Promise<void> {
    const { error } = await this.client
      .from('pattern_correlations')
      .upsert({
        ...correlation,
        computed_at: new Date().toISOString(),
      }, {
        onConflict: 'pattern_feature,pattern_value,metric',
      });
    if (error) throw error;
  }

  // --- Approval Events ---
  async logApprovalEvent(
    entity_type: string,
    entity_id: string,
    action: string,
    performed_by: string,
    reason?: string
  ): Promise<void> {
    const { error } = await this.client
      .from('approval_events')
      .insert({ entity_type, entity_id, action, performed_by, reason });
    if (error) throw error;
  }

  // --- Generation Runs ---
  async startGenerationRun(run_type: string): Promise<string> {
    const { data, error } = await this.client
      .from('generation_runs')
      .insert({ run_type, status: 'running' })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }

  async completeGenerationRun(
    id: string,
    result: { items_processed: number; items_succeeded: number; items_failed: number; summary?: object; error?: string }
  ): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await this.client
      .from('generation_runs')
      .update({
        status: result.error ? 'failed' : 'completed',
        completed_at: now,
        ...result,
      })
      .eq('id', id);
    if (error) throw error;
  }

  // --- Dashboard Stats ---
  // --- Delete ---
  async deleteIdea(id: string): Promise<void> {
    const { error } = await this.client.from('ideas').delete().eq('id', id);
    if (error) throw error;
  }

  async deleteScript(id: string): Promise<void> {
    const { error } = await this.client.from('scripts').delete().eq('id', id);
    if (error) throw error;
  }

  // --- Get all scripts (any status) ---
  async getAllScripts(limit = 50): Promise<Script[]> {
    const { data, error } = await this.client
      .from('scripts')
      .select('*, ideas(*)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  // --- Get all ideas (any status) ---
  async getAllIdeas(limit = 80): Promise<Idea[]> {
    const { data, error } = await this.client
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  // --- Operator Settings ---

  async getSetting(key: string): Promise<string> {
    try {
      const { data, error } = await this.client
        .from('operator_settings')
        .select('value')
        .eq('key', key)
        .single();
      if (error) return '';
      return (data as { value: string } | null)?.value ?? '';
    } catch {
      return '';
    }
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.client
      .from('operator_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });
  }

  async getDashboardStats() {
    const [ideas, scripts, videos_approval, videos_7d] = await Promise.all([
      this.client.from('ideas').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      this.client.from('scripts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      this.client.from('videos').select('id', { count: 'exact', head: true }).eq('status', 'ready'),
      this.client.from('videos').select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    return {
      ideas_pending: ideas.count ?? 0,
      scripts_pending: scripts.count ?? 0,
      videos_pending_approval: videos_approval.count ?? 0,
      videos_published_7d: videos_7d.count ?? 0,
    };
  }
}

export { createClient };
