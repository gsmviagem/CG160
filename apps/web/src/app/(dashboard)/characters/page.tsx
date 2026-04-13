// ============================================================
// CG 160 — Characters Page
// ============================================================

import { getDB } from '@/lib/supabase';
import { formatScore, scoreColor } from '@/lib/utils';
import type { Character } from '@cg160/types';

export const revalidate = 0;

function CharacterCard({ character }: { character: Character }) {
  const personality = Array.isArray(character.personality) ? character.personality : [];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base font-bold text-white">{character.name}</h3>
          {character.universe && (
            <div className="text-xs text-gray-500 mt-0.5">{character.universe}</div>
          )}
        </div>
        {character.avg_performance_score !== null && character.avg_performance_score !== undefined && (
          <div className="text-right flex-shrink-0">
            <div className={`text-xl font-bold ${scoreColor(character.avg_performance_score * 10)}`}>
              {character.avg_performance_score.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">avg score</div>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-400 mb-3">{character.description}</p>

      {character.visual_style && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">Visual Style</div>
          <p className="text-xs text-gray-300">{character.visual_style}</p>
        </div>
      )}

      {personality.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">Personality</div>
          <div className="flex gap-1.5 flex-wrap">
            {personality.map((trait: string) => (
              <span key={trait} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {character.voice_style && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">Voice</div>
          <span className="text-xs text-gray-300">{character.voice_style}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
        <div className="flex gap-4 text-xs text-gray-500">
          {character.video_count !== null && character.video_count !== undefined && (
            <span>{character.video_count} videos</span>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
          character.active
            ? 'bg-green-900 text-green-200'
            : 'bg-gray-800 text-gray-500'
        }`}>
          {character.active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}

export default async function CharactersPage() {
  const db = getDB();
  const characters = await db.getActiveCharacters();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Characters</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {characters.length} active character{characters.length !== 1 ? 's' : ''} — the faces of your content
        </p>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-3">🎭</div>
          <div className="text-lg text-gray-500">No characters yet</div>
          <div className="text-sm mt-2 text-gray-600 max-w-sm mx-auto">
            Characters are created automatically when ideas are generated without a specific character assignment.
            You can also insert characters directly into the Supabase{' '}
            <code className="bg-gray-800 px-1 rounded text-xs">characters</code> table.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map(character => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      )}
    </div>
  );
}
