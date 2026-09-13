import { shuffle } from '../../utils';

// Numbers 21 to 99 as tens rods and ones cubes. "Build" rounds give a
// number to make with the rods; "read" rounds show the rods and ask for
// the number, with the swapped-digit number (47 ↔ 74) always among the
// options when it exists.
const ROUNDS = [
  { kind: 'build', n: 34 },
  { kind: 'read', n: 52 },
  { kind: 'build', n: 71 },
  { kind: 'read', n: 29 },
  { kind: 'build', n: 46 },
  { kind: 'read', n: 83 },
  { kind: 'build', n: 90 },
  { kind: 'read', n: 67 },
  { kind: 'build', n: 25 },
  { kind: 'read', n: 38 },
];

export const TOTAL_ROUNDS = ROUNDS.length;
export const MAX_ONES = 9;
export const MAX_TENS = 9;

function readOptions(n) {
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const candidates = [ones !== 0 && ones !== tens ? ones * 10 + tens : null, ...shuffle([n + 10, n - 10, n + 1, n - 1])];
  const wrong = [];
  for (const c of candidates) {
    if (c !== null && c >= 10 && c <= 99 && c !== n && !wrong.includes(c)) wrong.push(c);
    if (wrong.length === 2) break;
  }
  return shuffle([n, ...wrong]);
}

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  const tens = Math.floor(r.n / 10);
  const ones = r.n % 10;
  return { ...r, tens, ones, options: r.kind === 'read' ? readOptions(r.n) : null };
}
