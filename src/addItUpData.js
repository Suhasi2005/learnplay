import { shuffle } from './utils';

// A curated, gently increasing progression rather than random numbers —
// starts at 1+1 and works up to sums of 10, so the difficulty ramp is
// intentional, not luck of the draw.
export const PROBLEMS = [
  { a: 1, b: 1 },
  { a: 1, b: 2 },
  { a: 2, b: 2 },
  { a: 2, b: 3 },
  { a: 3, b: 3 },
  { a: 3, b: 4 },
  { a: 4, b: 4 },
  { a: 4, b: 5 },
  { a: 5, b: 5 },
  { a: 6, b: 4 },
];

const OBJECT_EMOJIS = ['🍎', '⭐', '🎈', '🧸', '🍪', '🚗', '🐟', '🌸', '🍇', '🎁'];

export function buildRound(index) {
  const { a, b } = PROBLEMS[index];
  const sum = a + b;
  const candidates = [sum - 2, sum - 1, sum + 1, sum + 2].filter((n) => n > 0 && n !== sum);
  const wrongOptions = shuffle(candidates).slice(0, 3);
  const options = shuffle([sum, ...wrongOptions]);
  return { a, b, sum, emoji: OBJECT_EMOJIS[index % OBJECT_EMOJIS.length], options };
}
