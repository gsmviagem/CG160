// ============================================================
// CG 160 — Inngest Client + All Background Job Definitions
// ============================================================

import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'cg160',
  name: 'CG 160 Content Engine',
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// ---- Event Types -------------------------------------------
export type Events = {
  'cg160/ideas.generate': {
    data: { count?: number; character_id?: string; trend_id?: string };
  };
  'cg160/scripts.generate': {
    data: { idea_id: string };
  };
  'cg160/scripts.score': {
    data: { script_id: string };
  };
  'cg160/videos.generate': {
    data: { script_id: string; platform: string; provider?: string };
  };
  'cg160/videos.poll': {
    data: { video_id: string; job_id: string; provider: string };
  };
  'cg160/videos.publish': {
    data: { video_id: string; platform: string; scheduled_at?: string };
  };
  'cg160/metrics.sync': {
    data: { video_id?: string }; // empty = sync all published
  };
  'cg160/learning.run': {
    data: { force?: boolean };
  };
};
