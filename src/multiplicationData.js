import { shuffle } from './utils';

// Kept to small, friendly facts (up to 4x4) since this is Grade 1's first
// exposure to multiplication as "groups of," not times tables.
export const PROBLEMS = [
  { groups: 2, perGroup: 2, emoji: '🍎' },
  { groups: 2, perGroup: 3, emoji: '⭐' },
  { groups: 3, perGroup: 2, emoji: '🎈' },
  { groups: 2, perGroup: 4, emoji: '🍪' },
  { groups: 3, perGroup: 3, emoji: '🐟' },
  { groups: 4, perGroup: 2, emoji: '🌸' },
  { groups: 3, perGroup: 4, emoji: '🚗' },
  { groups: 4, perGroup: 3, emoji: '🎁' },
];

export const TOTAL_ROUNDS = PROBLEMS.length;

export function buildRound(index) {
  const { groups, perGroup, emoji } = PROBLEMS[index];
  const total = groups * perGroup;
  const candidates = [total - 2, total - 1, total + 1, total + 2].filter((n) => n > 0 && n !== total);
  const wrongOptions = shuffle(candidates).slice(0, 3);
  const options = shuffle([total, ...wrongOptions]);
  return { groups, perGroup, emoji, total, options };
}
