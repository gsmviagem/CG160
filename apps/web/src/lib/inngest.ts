// ============================================================
// CG 160 — Inngest Client + All Background Job Definitions
// ============================================================

import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'cg160',
  name: 'CG 160 Content Engine',
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// ---- Direct REST send (bypasses SDK environment detection) -----------------
// Use this instead of inngest.send() to avoid "Branch environment does not exist" errors.

export async function sendInngestEvent(
  name: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const eventKey = process.env.INNGEST_EVENT_KEY;
  if (!eventKey) {
    return { ok: false, error: 'INNGEST_EVENT_KEY not set' };
  }
  try {
    const res = await fetch(`https://inn.gs/e/${eventKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ name, data }]),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Inngest HTTP ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

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
