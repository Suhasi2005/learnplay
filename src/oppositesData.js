import { shuffle } from './utils';

export const OPPOSITE_PAIRS = [
  { pairId: 0, a: { label: 'Big', emoji: '🐘' }, b: { label: 'Small', emoji: '🐜' } },
  { pairId: 1, a: { label: 'Hot', emoji: '🔥' }, b: { label: 'Cold', emoji: '❄️' } },
  { pairId: 2, a: { label: 'Day', emoji: '☀️' }, b: { label: 'Night', emoji: '🌙' } },
  { pairId: 3, a: { label: 'Happy', emoji: '😄' }, b: { label: 'Sad', emoji: '😢' } },
  { pairId: 4, a: { label: 'Fast', emoji: '🐆' }, b: { label: 'Slow', emoji: '🐢' } },
  { pairId: 5, a: { label: 'Wet', emoji: '💧' }, b: { label: 'Dry', emoji: '🏜️' } },
  { pairId: 6, a: { label: 'Open', emoji: '🔓' }, b: { label: 'Closed', emoji: '🔒' } },
  { pairId: 7, a: { label: 'Up', emoji: '⬆️' }, b: { label: 'Down', emoji: '⬇️' } },
];

const PAIRS_PER_LEVEL = 4;
export const TOTAL_LEVELS = Math.ceil(OPPOSITE_PAIRS.length / PAIRS_PER_LEVEL);

// A level is a shuffled board of cards (two per pair). Cards carry a stable
// `id` so React can key them, and a `pairId` the game checks for a match.
export function buildLevel(levelIndex) {
  const start = levelIndex * PAIRS_PER_LEVEL;
  const pairsForLevel = OPPOSITE_PAIRS.slice(start, start + PAIRS_PER_LEVEL);
  const cards = pairsForLevel.flatMap((pair) => [
    { id: `${pair.pairId}-a`, pairId: pair.pairId, label: pair.a.label, emoji: pair.a.emoji },
    { id: `${pair.pairId}-b`, pairId: pair.pairId, label: pair.b.label, emoji: pair.b.emoji },
  ]);
  return shuffle(cards);
}
