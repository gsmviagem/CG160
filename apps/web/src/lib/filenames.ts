// ============================================================
// CG 160 — Deterministic Filename & Storage Path Generator
//
// All filenames are derived from the script UUID — no DB needed.
// Convention:
//   Bucket:      cg160-media  (Supabase Storage)
//   Scene imgs:  cenas/{sid}/{sid}_cena{N}.jpg
//   Video file:  videos/{sid}/{sid}_video.mp4
//
// The user creates files with these exact names; the system
// finds them automatically because it generated the names itself.
// ============================================================

const BUCKET = 'cg160-media';
const SUPABASE_STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`
  : null;

/** First 8 hex chars of the UUID (without hyphens). Stable, short, unique enough. */
export function shortId(scriptId: string): string {
  return scriptId.replace(/-/g, '').slice(0, 8);
}

// ── Filenames ────────────────────────────────────────────────

export function sceneImageFilename(scriptId: string, sceneNumber: number): string {
  return `${shortId(scriptId)}_cena${sceneNumber}.jpg`;
}

export function videoFilename(scriptId: string): string {
  return `${shortId(scriptId)}_video.mp4`;
}

// ── Storage paths (relative to bucket root) ─────────────────

export function sceneImagePath(scriptId: string, sceneNumber: number): string {
  const sid = shortId(scriptId);
  return `cenas/${sid}/${sceneImageFilename(scriptId, sceneNumber)}`;
}

export function videoPath(scriptId: string): string {
  const sid = shortId(scriptId);
  return `videos/${sid}/${videoFilename(scriptId)}`;
}

// ── Public URLs (once uploaded to Supabase Storage) ─────────

export function sceneImageUrl(scriptId: string, sceneNumber: number): string | null {
  if (!SUPABASE_STORAGE_URL) return null;
  return `${SUPABASE_STORAGE_URL}/${sceneImagePath(scriptId, sceneNumber)}`;
}

export function videoUrl(scriptId: string): string | null {
  if (!SUPABASE_STORAGE_URL) return null;
  return `${SUPABASE_STORAGE_URL}/${videoPath(scriptId)}`;
}

// ── Summary for a full script ────────────────────────────────

export interface ScriptFileManifest {
  bucket: string;
  shortId: string;
  scenes: Array<{
    sceneNumber: number;
    filename: string;
    storagePath: string;
  }>;
  video: {
    filename: string;
    storagePath: string;
  };
}

export function buildFileManifest(scriptId: string, sceneCount: number): ScriptFileManifest {
  const sid = shortId(scriptId);
  return {
    bucket: BUCKET,
    shortId: sid,
    scenes: Array.from({ length: sceneCount }, (_, i) => ({
      sceneNumber: i + 1,
      filename: sceneImageFilename(scriptId, i + 1),
      storagePath: sceneImagePath(scriptId, i + 1),
    })),
    video: {
      filename: videoFilename(scriptId),
      storagePath: videoPath(scriptId),
    },
  };
}
