// ============================================================
// CG 160 — Videos Page
// ============================================================

import { getDB } from '@/lib/supabase';
import { statusBadgeColor, relativeTime } from '@/lib/utils';
import type { Video } from '@cg160/types';

export const revalidate = 0;

async function getAllVideos() {
  const db = getDB();
  const [ready, scheduled, published, rejected] = await Promise.all([
    db.getVideosByStatus('ready', 20),
    db.getVideosByStatus('scheduled', 20),
    db.getVideosByStatus('published', 30),
    db.getVideosByStatus('rejected', 10),
  ]);
  return { ready, scheduled, published, rejected };
}

function VideoCard({ video }: { video: Video }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start gap-3">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt=""
            className="w-14 h-24 object-cover rounded flex-shrink-0 bg-gray-800"
          />
        ) : (
          <div className="w-14 h-24 rounded bg-gray-800 flex items-center justify-center flex-shrink-0">
            <span className="text-gray-600 text-xs text-center leading-tight px-1">No thumb</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadgeColor(video.status)}`}>
              {video.status}
            </span>
            {video.platform && (
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded capitalize">{video.platform}</span>
            )}
            {video.duration_seconds && (
              <span className="text-xs text-gray-500">{video.duration_seconds.toFixed(0)}s</span>
            )}
            <span className="text-xs text-gray-600 ml-auto">
              {video.created_at ? relativeTime(video.created_at) : ''}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-white">{video.title}</h3>

          {video.caption && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{video.caption}</p>
          )}

          {video.hashtags && Array.isArray(video.hashtags) && video.hashtags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1">
              {(video.hashtags as string[]).slice(0, 5).map((tag: string) => (
                <span key={tag} className="text-xs text-blue-400">#{tag}</span>
              ))}
            </div>
          )}

          {video.scheduled_at && (
            <p className="text-xs text-indigo-400 mt-1">
              Scheduled: {new Date(video.scheduled_at).toLocaleString()}
            </p>
          )}

          {video.published_at && (
            <p className="text-xs text-green-400 mt-1">
              Published: {relativeTime(video.published_at)}
            </p>
          )}

          {video.storage_url && (
            <a
              href={video.storage_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
            >
              Preview →
            </a>
          )}

          {video.platform_url && (
            <a
              href={video.platform_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-400 hover:text-green-300 mt-2 inline-block ml-3"
            >
              View on {video.platform} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-8 text-gray-700 border border-dashed border-gray-800 rounded-lg">
      <div className="text-sm">No {label} videos</div>
    </div>
  );
}

export default async function VideosPage() {
  const { ready, scheduled, published, rejected } = await getAllVideos();
  const total = ready.length + scheduled.length + published.length + rejected.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Videos</h1>
          <p className="text-gray-500 mt-1 text-sm">{total} total videos</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-purple-400 font-bold text-lg">{ready.length}</div>
            <div className="text-gray-600 text-xs">Ready</div>
          </div>
          <div className="text-center">
            <div className="text-indigo-400 font-bold text-lg">{scheduled.length}</div>
            <div className="text-gray-600 text-xs">Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-bold text-lg">{published.length}</div>
            <div className="text-gray-600 text-xs">Published</div>
          </div>
        </div>
      </div>

      {/* Ready for approval */}
      {ready.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">
            Ready for Review ({ready.length})
          </h2>
          <div className="space-y-3">
            {ready.map(v => <VideoCard key={v.id} video={v} />)}
          </div>
        </section>
      )}

      {/* Scheduled */}
      {scheduled.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-3">
            Scheduled ({scheduled.length})
          </h2>
          <div className="space-y-3">
            {scheduled.map(v => <VideoCard key={v.id} video={v} />)}
          </div>
        </section>
      )}

      {/* Published */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">
          Published ({published.length})
        </h2>
        {published.length === 0
          ? <EmptyState label="published" />
          : <div className="space-y-3">{published.map(v => <VideoCard key={v.id} video={v} />)}</div>
        }
      </section>

      {total === 0 && (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">🎬</div>
          <div className="text-lg text-gray-500">No videos yet</div>
          <div className="text-sm mt-1">Approve ideas to generate scripts → approve scripts to produce videos</div>
        </div>
      )}
    </div>
  );
}
