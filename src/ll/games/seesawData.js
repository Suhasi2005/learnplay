import { shuffle } from '../../utils';

// Balance the seesaw: the left seat holds a sum or a take-away, the right
// seat holds the child's answer. Numbers stay within 10.
//
// The seesaw is the feedback. A wrong answer doesn't just buzz — too small
// and the left side stays down, too big and the right side drops — so a
// child learns which way to adjust without being told.
const ROUNDS = [
  { op: '+', a: 2, b: 3 },
  { op: '+', a: 4, b: 1 },
  { op: '-', a: 5, b: 2 },
  { op: '+', a: 3, b: 3 },
  { op: '-', a: 7, b: 3 },
  { op: '+', a: 5, b: 4 },
  { op: '-', a: 6, b: 1 },
  { op: '+', a: 2, b: 6 },
  { op: '-', a: 9, b: 4 },
  { op: '+', a: 4, b: 5 },
];

export const TOTAL_ROUNDS = ROUNDS.length;

const FRUITS = ['🍎', '🍊', '🍓', '🍐', '🍋'];

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  const answer = r.op === '+' ? r.a + r.b : r.a - r.b;
  const near = [answer - 1, answer + 1, answer + 2, answer - 2].filter((n) => n >= 0 && n <= 10);
  const options = shuffle([answer, ...near.slice(0, 2)]);
  return { ...r, answer, options, fruit: FRUITS[index % FRUITS.length] };
}
