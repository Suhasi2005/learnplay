import { shuffle } from '../../utils';

// Numbers 1 to 9, four ways: count a group, read a number word, find one
// more, find one less. Three fish in the pond. For one-more and one-less
// rounds the starting number itself swims among the fish — picking it
// means "I found the number you said", which is the usual mistake.
export const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

const ROUNDS = [
  { kind: 'count', n: 3 },
  { kind: 'word', n: 7 },
  { kind: 'more', n: 4 },
  { kind: 'count', n: 8 },
  { kind: 'less', n: 6 },
  { kind: 'word', n: 2 },
  { kind: 'count', n: 6 },
  { kind: 'less', n: 9 },
  { kind: 'more', n: 1 },
  { kind: 'word', n: 5 },
];

export const TOTAL_ROUNDS = ROUNDS.length;

const FISH_COLORS = ['#FF9FC0', '#8FB4F5', '#B9A2F7', '#8ED9A8', '#FFD166'];

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  const answer = r.kind === 'more' ? r.n + 1 : r.kind === 'less' ? r.n - 1 : r.n;

  const preferred = [r.kind === 'more' || r.kind === 'less' ? r.n : null, ...shuffle([answer + 1, answer - 1])];
  const pool = [...preferred, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])];
  const wrong = [];
  for (const c of pool) {
    if (c !== null && c >= 1 && c <= 9 && c !== answer && !wrong.includes(c)) wrong.push(c);
    if (wrong.length === 2) break;
  }

  const fish = shuffle([answer, ...wrong]).map((number, i) => ({
    id: `f${i}`, number, color: FISH_COLORS[(index + i) % FISH_COLORS.length],
  }));
  return { ...r, answer, word: WORDS[r.n], fish };
}
