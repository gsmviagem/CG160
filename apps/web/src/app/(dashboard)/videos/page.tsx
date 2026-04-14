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

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="text-xs bg-white/[0.07] text-white/50 px-2 py-0.5 rounded-lg capitalize">{children}</span>;
}

function VideoCard({ video }: { video: Video }) {
  return (
    <div className="bg-white/[0.04] hover:bg-white/[0.06] transition-all duration-200 rounded-2xl p-5">
      <div className="flex items-start gap-4">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt="" className="w-14 h-24 object-cover rounded-xl flex-shrink-0" />
        ) : (
          <div className="w-14 h-24 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${statusBadgeColor(video.status)}`}>
              {video.status}
            </span>
            {video.platform && <Tag>{video.platform}</Tag>}
            {video.duration_seconds && (
              <span className="text-xs text-white/30">{video.duration_seconds.toFixed(0)}s</span>
            )}
            <span className="text-xs text-white/20 ml-auto">
              {video.created_at ? relativeTime(video.created_at) : ''}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-white/90">{video.title}</h3>

          {video.caption && (
            <p className="text-xs text-white/40 mt-1.5 line-clamp-2">{video.caption}</p>
          )}

          {video.hashtags && Array.isArray(video.hashtags) && (video.hashtags as string[]).length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {(video.hashtags as string[]).slice(0, 5).map((tag: string) => (
                <span key={tag} className="text-xs text-indigo-400/60">#{tag}</span>
              ))}
            </div>
          )}

          {video.scheduled_at && (
            <p className="text-xs text-indigo-400/70 mt-1.5">
              Agendado: {new Date(video.scheduled_at).toLocaleString()}
            </p>
          )}
          {video.published_at && (
            <p className="text-xs text-emerald-400/70 mt-1.5">
              Publicado: {relativeTime(video.published_at)}
            </p>
          )}

          <div className="flex gap-3 mt-2">
            {video.storage_url && (
              <a href={video.storage_url} target="_blank" rel="noopener noreferrer"
                 className="text-xs text-indigo-400/60 hover:text-indigo-300 transition-colors">Preview →</a>
            )}
            {video.platform_url && (
              <a href={video.platform_url} target="_blank" rel="noopener noreferrer"
                 className="text-xs text-emerald-400/60 hover:text-emerald-300 transition-colors">
                Ver no {video.platform} →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className={`text-xs font-bold uppercase tracking-widest ${color}`}>{label}</span>
      <span className="text-xs text-white/20">{count}</span>
    </div>
  );
}

export default async function VideosPage() {
  const { ready, scheduled, published, rejected } = await getAllVideos();
  const total = ready.length + scheduled.length + published.length + rejected.length;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Vídeos</h1>
          <p className="text-white/30 mt-1.5 text-sm">{total} vídeos no total</p>
        </div>
        <div className="flex gap-5">
          {[
            { n: ready.length,     label: 'Para revisar', color: 'text-violet-400' },
            { n: scheduled.length, label: 'Agendados',    color: 'text-indigo-400' },
            { n: published.length, label: 'Publicados',   color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.n}</div>
              <div className="text-[11px] text-white/25">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {ready.length > 0 && (
        <section className="mb-10">
          <SectionHeading label="Para revisar" count={ready.length} color="text-violet-400" />
          <div className="space-y-3">{ready.map(v => <VideoCard key={v.id} video={v} />)}</div>
        </section>
      )}

      {scheduled.length > 0 && (
        <section className="mb-10">
          <SectionHeading label="Agendados" count={scheduled.length} color="text-indigo-400" />
          <div className="space-y-3">{scheduled.map(v => <VideoCard key={v.id} video={v} />)}</div>
        </section>
      )}

      <section className="mb-10">
        <SectionHeading label="Publicados" count={published.length} color="text-emerald-400" />
        {published.length === 0 ? (
          <div className="bg-white/[0.03] rounded-2xl p-10 text-center">
            <div className="text-white/25 text-sm">Nenhum vídeo publicado ainda</div>
          </div>
        ) : (
          <div className="space-y-3">{published.map(v => <VideoCard key={v.id} video={v} />)}</div>
        )}
      </section>

      {total === 0 && (
        <div className="text-center py-24">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-white/40 font-medium">Nenhum vídeo ainda</div>
          <div className="text-white/20 text-sm mt-1">Aprove ideias → gere scripts → produza vídeos</div>
        </div>
      )}
    </div>
  );
}
