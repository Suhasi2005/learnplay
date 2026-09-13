import { shuffle } from '../../utils';

// Pre-number concepts from NCERT Class 1, chapter 1: more/fewer, tallest/
// shortest/biggest, and "the same number". Three different kinds of round
// in one game, because comparing without counting is the whole chapter.
// The close comparisons (7 vs 8, 9 vs 7) can't be judged by glance.
const ROUNDS = [
  { kind: 'compare', ask: 'more', counts: [5, 3], emoji: '🍎' },
  { kind: 'compare', ask: 'fewer', counts: [4, 6], emoji: '🐤' },
  { kind: 'size', ask: 'tallest', emoji: '🌳' },
  { kind: 'same', n: 4, emoji: '⭐' },
  { kind: 'compare', ask: 'more', counts: [7, 8], emoji: '🎈' },
  { kind: 'size', ask: 'shortest', emoji: '🦒' },
  { kind: 'same', n: 6, emoji: '🍪' },
  { kind: 'compare', ask: 'fewer', counts: [9, 7], emoji: '🐟' },
  { kind: 'size', ask: 'biggest', emoji: '🐘' },
  { kind: 'same', n: 3, emoji: '🌸' },
];

export const TOTAL_ROUNDS = ROUNDS.length;

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];

  if (r.kind === 'compare') {
    const options = shuffle(r.counts.map((count, i) => ({ id: `g${i}`, count })));
    const target = r.ask === 'more' ? Math.max(...r.counts) : Math.min(...r.counts);
    return { ...r, options, answerId: options.find((o) => o.count === target).id };
  }

  if (r.kind === 'size') {
    const options = shuffle([0.55, 0.8, 1.05].map((scale, i) => ({ id: `z${i}`, scale })));
    const target = r.ask === 'shortest' ? 0.55 : 1.05;
    return { ...r, options, answerId: options.find((o) => o.scale === target).id };
  }

  const options = shuffle([r.n, r.n + 1, r.n - 1]).map((count, i) => ({ id: `c${i}`, count }));
  return { ...r, options, answerId: options.find((o) => o.count === r.n).id };
}
