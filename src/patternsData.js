import { shuffle } from './utils';

// Each theme is an alternating A-B-A-B-A-? pattern; the child completes it
// with B. Kept to simple alternation (not AAB or growing patterns) since
// this is the *first* patterns exposure for this age group.
const PATTERN_THEMES = [
  ['🍎', '🍊'], ['⭐', '🌙'], ['🐶', '🐱'], ['🔵', '🟥'], ['🌸', '🍀'],
  ['🎈', '🎁'], ['☀️', '☁️'], ['🐟', '🐠'], ['🍪', '🧁'], ['🚗', '🚌'],
];

export const TOTAL_ROUNDS = PATTERN_THEMES.length;

export function buildRound(index) {
  const [a, b] = PATTERN_THEMES[index];
  const sequence = [a, b, a, b, a];
  const correct = b;

  const distractorPool = PATTERN_THEMES
    .flat()
    .filter((emoji) => emoji !== a && emoji !== b);
  const wrongOptions = shuffle(distractorPool).slice(0, 2);
  const options = shuffle([correct, ...wrongOptions]);

  return { sequence, correct, options };
}
