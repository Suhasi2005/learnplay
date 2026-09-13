import { shuffle } from '../../utils';

// Equation dominoes, within 20. Each round is a chain of three: the answer
// to one sum becomes the first number of the next (8 + 5 = 13, then
// 13 − 4 = 9, then 9 + 7 = 16), so one slip carries forward the way it
// would on paper. Wrong tiles are off by one or two, or by ten — the
// tens-place slip.
const ROUNDS = [
  { start: 8, ops: [['+', 5], ['-', 4], ['+', 7]] },
  { start: 6, ops: [['+', 6], ['+', 3], ['-', 5]] },
  { start: 15, ops: [['-', 7], ['+', 9], ['-', 8]] },
  { start: 9, ops: [['+', 9], ['-', 9], ['+', 11]] },
  { start: 4, ops: [['+', 8], ['-', 6], ['+', 13]] },
  { start: 20, ops: [['-', 12], ['+', 5], ['-', 6]] },
  { start: 7, ops: [['+', 7], ['-', 3], ['+', 4]] },
  { start: 11, ops: [['+', 8], ['-', 10], ['+', 10]] },
];

export const TOTAL_ROUNDS = ROUNDS.length;

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  let current = r.start;
  const links = r.ops.map(([op, b]) => {
    const a = current;
    const answer = op === '+' ? a + b : a - b;
    current = answer;
    const near = shuffle([answer + 1, answer - 1, answer + 2, answer - 2]).filter((n) => n >= 0 && n <= 20);
    const tens = [answer + 10, answer - 10].filter((n) => n >= 0 && n <= 20);
    const wrong = [near[0], ...shuffle([...near.slice(1), ...tens])].slice(0, 2);
    return { a, op, b, answer, options: shuffle([answer, ...wrong]) };
  });
  return { start: r.start, links };
}
