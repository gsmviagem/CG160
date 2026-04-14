import { getDB } from '@/lib/supabase';
import { scoreColor } from '@/lib/utils';
import type { Character } from '@cg160/types';

export const revalidate = 0;

function CharacterCard({ character }: { character: Character }) {
  const personality = Array.isArray(character.personality) ? character.personality : [];

  return (
    <div className="bg-white/[0.04] hover:bg-white/[0.06] transition-all duration-200 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-white">{character.name}</h3>
          {character.universe && (
            <div className="text-xs text-white/30 mt-0.5">{character.universe}</div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {character.avg_performance_score !== null && character.avg_performance_score !== undefined && (
            <div className="text-right">
              <div className={`text-xl font-bold ${scoreColor(character.avg_performance_score * 10)}`}>
                {character.avg_performance_score.toFixed(2)}
              </div>
              <div className="text-[11px] text-white/20">avg score</div>
            </div>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
            character.active
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-white/[0.06] text-white/30'
          }`}>
            {character.active ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      <p className="text-sm text-white/50 mb-4">{character.description}</p>

      {character.visual_style && (
        <div className="mb-4">
          <div className="text-[11px] text-white/25 font-semibold uppercase tracking-widest mb-1.5">Visual</div>
          <p className="text-xs text-white/60">{character.visual_style}</p>
        </div>
      )}

      {personality.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] text-white/25 font-semibold uppercase tracking-widest mb-1.5">Personalidade</div>
          <div className="flex gap-1.5 flex-wrap">
            {personality.map((trait: string) => (
              <span key={trait} className="text-xs bg-white/[0.07] text-white/55 px-2 py-0.5 rounded-lg">
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {character.voice_style && (
        <div className="mb-4">
          <div className="text-[11px] text-white/25 font-semibold uppercase tracking-widest mb-1.5">Voz</div>
          <span className="text-xs text-white/55">{character.voice_style}</span>
        </div>
      )}

      {character.video_count !== null && character.video_count !== undefined && (
        <div className="text-xs text-white/20 mt-2">{character.video_count} vídeos</div>
      )}
    </div>
  );
}

export default async function CharactersPage() {
  const db = getDB();
  const characters = await db.getActiveCharacters();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Personagens</h1>
        <p className="text-white/30 mt-1.5 text-sm">
          {characters.length} personagem{characters.length !== 1 ? 's' : ''} ativo{characters.length !== 1 ? 's' : ''}
        </p>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="text-white/40 font-medium">Nenhum personagem ainda</div>
          <div className="text-white/20 text-sm mt-2 max-w-sm mx-auto">
            Personagens são criados quando ideias são geradas. Você também pode inserir diretamente na tabela{' '}
            <code className="bg-white/[0.08] px-1 rounded text-xs text-white/40">characters</code> no Supabase.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map(c => <CharacterCard key={c.id} character={c} />)}
        </div>
      )}
    </div>
  );
}
