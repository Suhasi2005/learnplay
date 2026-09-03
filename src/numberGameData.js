import { shuffle } from './utils';

// Each round teaches one number (1-10), paired with a themed emoji so the
// round's four options all show *the same* picture in different quantities —
// keeping the challenge purely about counting, not object recognition.
export const NUMBERS = [
  { number: 1, emoji: '⭐' },
  { number: 2, emoji: '🍎' },
  { number: 3, emoji: '🎈' },
  { number: 4, emoji: '🐟' },
  { number: 5, emoji: '🍇' },
  { number: 6, emoji: '🌸' },
  { number: 7, emoji: '🍪' },
  { number: 8, emoji: '🐝' },
  { number: 9, emoji: '🚗' },
  { number: 10, emoji: '🎁' },
];

// Builds one round: the correct count plus 3 random wrong counts (1-10,
// excluding the target), all shuffled into a random position.
export function buildRound(index) {
  const target = NUMBERS[index];
  const allCounts = NUMBERS.map((n) => n.number);
  const wrongCounts = shuffle(allCounts.filter((n) => n !== target.number)).slice(0, 3);
  const options = shuffle([target.number, ...wrongCounts]);
  return { number: target.number, emoji: target.emoji, options };
}
