// ============================================================
// CG 160 — Inngest Worker: Learning Loop
//
// Runs daily. Analyzes performance data and adjusts scoring weights.
// This is the intelligence core of CG 160.
// ============================================================

import { inngest } from '@/lib/inngest';
import { getDB } from '@/lib/supabase';
import {
  buildTrainingRecords,
  runCorrelationSweep,
  computeWeightUpdates,
  buildHistoryEntry,
  summarizeWeightUpdates,
} from '@cg160/learning';
import type { Script, Video } from '@cg160/types';

const MIN_SAMPLE = parseInt(process.env.LEARNING_MIN_SAMPLE_SIZE ?? '20');

export const fnRunLearningLoop = inngest.createFunction(
  { id: 'learning-loop', name: 'Run Learning Loop', concurrency: 1 },
  { event: 'cg160/learning.run' },
  async ({ event, step }) => {
    const db = getDB();
    const runId = await db.startGenerationRun('learning_loop');

    try {
      // Load all stabilized performance data with videos
      const data = await step.run('load-training-data', async () => {
        return db.getStabilizedMetricsWithVideos();
      });

      if (data.length < MIN_SAMPLE && !event.data.force) {
        await db.completeGenerationRun(runId, {
          items_processed: data.length,
          items_succeeded: 0,
          items_failed: 0,
          summary: { skipped_reason: `Only ${data.length}/${MIN_SAMPLE} stabilized videos` },
        });
        return { skipped: true, reason: `Insufficient data: ${data.length}/${MIN_SAMPLE} videos` };
      }

      // Build training records
      const trainingRecords = await step.run('build-training-records', async () => {
        const scriptIds = [...new Set(data.map(d => d.video.script_id))];
        const scripts = new Map<string, Script>();

        // Load scripts in batches
        for (const sid of scriptIds) {
          const s = await db.getScriptById(sid);
          if (s) scripts.set(sid, s);
        }

        const metricsMap = new Map(data.map(d => [d.video.id, d.metrics]));
        const videos = data.map(d => d.video);

        return buildTrainingRecords(videos as Video[], scripts, metricsMap);
      });

      // Run correlation analysis
      const { numerical, categorical } = await step.run('run-correlations', async () => {
        return runCorrelationSweep(trainingRecords);
      });

      // Compute and apply weight updates
      const { updated, summary } = await step.run('update-weights', async () => {
        const currentWeights = await db.getLearningWeights('script_scoring');
        const updates = computeWeightUpdates(currentWeights, numerical, 'performance_score');

        let updatedCount = 0;

        for (const update of updates) {
          if (update.skipped || Math.abs(update.new_weight - update.old_weight) < 0.001) continue;

          const currentWeight = currentWeights.find(w => w.feature_name === update.feature_name);
          if (!currentWeight) continue;

          const historyEntry = buildHistoryEntry(update);
          const updatedHistory = [...currentWeight.adjustment_history, historyEntry].slice(-50);

          await db.updateLearningWeight(update.feature_name, {
            current_weight: update.new_weight,
            correlation_with_performance: update.correlation,
            sample_size: update.sample_size,
            confidence: update.confidence,
            last_adjusted_at: new Date().toISOString(),
            adjustment_count: currentWeight.adjustment_count + 1,
            adjustment_history: updatedHistory,
          });

          updatedCount++;
        }

        return { updated: updatedCount, summary: summarizeWeightUpdates(updates) };
      });

      // Store pattern correlations
      await step.run('store-pattern-correlations', async () => {
        for (const corr of categorical.slice(0, 100)) {
          await db.upsertPatternCorrelation({
            pattern_feature: corr.feature,
            pattern_value: corr.value,
            metric: corr.metric,
            correlation_coefficient: corr.correlation,
            sample_size: corr.sample_size,
            confidence_level: corr.confidence,
            platform: null,
            valid: true,
            metadata: {},
          });
        }
      });

      await db.completeGenerationRun(runId, {
        items_processed: trainingRecords.length,
        items_succeeded: updated,
        items_failed: 0,
        summary: {
          training_records: trainingRecords.length,
          correlations_computed: numerical.length + categorical.length,
          weights_updated: updated,
          log: summary,
        },
      });

      return {
        training_records: trainingRecords.length,
        correlations: numerical.length + categorical.length,
        weights_updated: updated,
        summary,
      };

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await db.completeGenerationRun(runId, {
        items_processed: 0,
        items_succeeded: 0,
        items_failed: 1,
        error: msg,
      });
      throw error;
    }
  }
);
