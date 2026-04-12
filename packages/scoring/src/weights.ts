// ============================================================
// CG 160 — Scoring Dimension Definitions
// Default weights start at 1.0 (equal).
// The learning loop adjusts these based on performance correlation.
// ============================================================

export interface ScoringDimension {
  key: string;
  label: string;
  description: string;
  /** What a 0 score looks like */
  low_anchor: string;
  /** What a 10 score looks like */
  high_anchor: string;
  default_weight: number;
}

export const SCORING_DIMENSIONS: ScoringDimension[] = [
  {
    key: 'hook_strength',
    label: 'Hook Strength',
    description: 'How compelling the first 1–3 seconds are. Does it stop the scroll immediately?',
    low_anchor: 'Generic, slow, no reason to keep watching',
    high_anchor: 'Instantly arresting — viewer cannot look away',
    default_weight: 1.0,
  },
  {
    key: 'clarity_score',
    label: 'Opening Clarity',
    description: 'Is the premise immediately understandable within the first 3 seconds?',
    low_anchor: 'Confusing, requires prior context, alienating',
    high_anchor: 'Zero-context entry — anyone understands immediately',
    default_weight: 1.0,
  },
  {
    key: 'emotional_trigger_score',
    label: 'Emotional Trigger',
    description: 'Does the script reliably produce an emotional response (laughter, surprise, delight, recognition)?',
    low_anchor: 'Flat, emotionally inert',
    high_anchor: 'Guaranteed visceral reaction',
    default_weight: 1.0,
  },
  {
    key: 'curiosity_gap_score',
    label: 'Curiosity Gap',
    description: 'Does the opening create tension or a question that must be resolved?',
    low_anchor: 'No tension, fully predictable',
    high_anchor: 'Impossible to not watch to the end',
    default_weight: 1.0,
  },
  {
    key: 'pacing_density_score',
    label: 'Pacing Density',
    description: 'Is every second doing work? Is information dense without being overwhelming?',
    low_anchor: 'Bloated, slow, padded',
    high_anchor: 'Every beat earns its time, relentless forward motion',
    default_weight: 1.0,
  },
  {
    key: 'setup_simplicity_score',
    label: 'Setup Simplicity',
    description: 'Is the setup clean, minimal, and fast? Less exposition is better.',
    low_anchor: 'Overexplained, complex setup, loses people early',
    high_anchor: 'One-sentence setup, immediately understood',
    default_weight: 1.0,
  },
  {
    key: 'punchline_strength',
    label: 'Punchline / Payoff',
    description: 'Is the ending satisfying, funny, or surprising? Does it deliver on setup promise?',
    low_anchor: 'Flat ending, payoff not worth the setup',
    high_anchor: 'Ending is the entire reason you share it',
    default_weight: 1.0,
  },
  {
    key: 'loop_potential',
    label: 'Loop Potential',
    description: 'Does the ending flow back to the beginning? Does rewatching add value?',
    low_anchor: 'Dead end, no reason to rewatch',
    high_anchor: 'Perfect loop, rewatching reveals new layers',
    default_weight: 1.0,
  },
  {
    key: 'shareability_score',
    label: 'Shareability',
    description: 'Does this make people want to send it to someone specific right now?',
    low_anchor: 'No referential value',
    high_anchor: '"I immediately thought of you" content',
    default_weight: 1.0,
  },
  {
    key: 'memorability_score',
    label: 'Memorability',
    description: 'Will people remember this tomorrow? Does it leave a distinct impression?',
    low_anchor: 'Forgotten immediately',
    high_anchor: 'Still thinking about it a week later',
    default_weight: 1.0,
  },
  {
    key: 'novelty_score',
    label: 'Novelty',
    description: 'Is this genuinely original? Does it avoid clichés and familiar patterns?',
    low_anchor: 'Seen a hundred times before',
    high_anchor: 'First time this specific thing has been done',
    default_weight: 1.0,
  },
  {
    key: 'absurdity_balance',
    label: 'Absurdity Balance',
    description: 'Is the level of absurdity calibrated? Too chaotic loses people; too bland is forgettable.',
    low_anchor: 'Either completely random/incoherent OR completely mundane',
    high_anchor: 'Perfectly calibrated absurdity — weird but followable',
    default_weight: 1.0,
  },
  {
    key: 'visual_feasibility',
    label: 'Visual Feasibility',
    description: 'Can this actually be realized with AI video generation tools?',
    low_anchor: 'Requires impossible visual consistency or complex interactions',
    high_anchor: 'Perfectly achievable with current AI video generation',
    default_weight: 1.0,
  },
  {
    key: 'viral_structure_alignment',
    label: 'Viral Structure Alignment',
    description: 'How closely does this match known high-performing structural patterns?',
    low_anchor: 'No recognizable viral pattern',
    high_anchor: 'Textbook execution of proven viral structure',
    default_weight: 1.0,
  },
];

export const DIMENSION_KEYS = SCORING_DIMENSIONS.map(d => d.key);

export type DimensionKey = typeof DIMENSION_KEYS[number];

/** Build a dimension lookup map */
export const DIMENSION_MAP = Object.fromEntries(
  SCORING_DIMENSIONS.map(d => [d.key, d])
) as Record<string, ScoringDimension>;
