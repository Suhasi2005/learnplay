import { shuffle } from '../../utils';

// Alphabet order as a ladder: five consecutive letters from the bottom rung
// up, one or two missing. Later rounds switch to lowercase and plant the
// classic mirror-image letter (b/d, p/q, m/n) among the options.
const ABC = 'abcdefghijklmnopqrstuvwxyz'.split('');
const LOOKALIKE = { b: 'd', d: 'b', p: 'q', q: 'p', m: 'n', n: 'm', i: 'l', l: 'i' };

export const RUNGS = 5;

const ROUNDS = [
  { start: 0, hidden: [2] },
  { start: 5, hidden: [3] },
  { start: 10, hidden: [1] },
  { start: 14, hidden: [4] },
  { start: 18, hidden: [0, 3] },
  { start: 1, hidden: [1, 3], lower: true },
  { start: 11, hidden: [2, 4], lower: true },
  { start: 20, hidden: [0, 2], lower: true },
];

export const TOTAL_ROUNDS = ROUNDS.length;

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  const fmt = (c) => (r.lower ? c : c.toUpperCase());
  const shown = ABC.slice(r.start, r.start + RUNGS);

  const steps = r.hidden.map((pos) => {
    const answer = shown[pos];
    const near = ABC.filter((c, i) => Math.abs(i - (r.start + pos)) <= 4 && !shown.includes(c));
    const twin = r.lower && LOOKALIKE[answer] && !shown.includes(LOOKALIKE[answer]) ? [LOOKALIKE[answer]] : [];
    const wrong = [...twin, ...shuffle(near.filter((c) => !twin.includes(c)))].slice(0, 2);
    return { pos, answer: fmt(answer), options: shuffle([answer, ...wrong]).map(fmt) };
  });

  return { letters: shown.map(fmt), lower: !!r.lower, steps };
}
