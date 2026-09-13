import { shuffle } from '../../utils';

// Skip counting as a frog crossing a pond. Five pads; the first two are
// numbered, the frog hops onto each of the next three as the child picks its
// number. Distractors are the two classic slips: counting on by one instead
// of by the step (10 → 11), and jumping a pad too far (10 → 14 when counting
// by twos).
const ROUNDS = [
  { start: 2, step: 2 },
  { start: 10, step: 2 },
  { start: 5, step: 5 },
  { start: 20, step: 5 },
  { start: 10, step: 10 },
  { start: 30, step: 10 },
  { start: 14, step: 2 },
  { start: 45, step: 5 },
];

export const TOTAL_ROUNDS = ROUNDS.length;
export const PADS = 5;
export const GIVEN = 2;

export function buildRound(index) {
  const { start, step } = ROUNDS[index % ROUNDS.length];
  const sequence = Array.from({ length: PADS }, (_, i) => start + i * step);
  const hops = sequence.slice(GIVEN).map((answer, k) => {
    const wrong = [answer + 1, answer - 1, answer + step].filter((n) => n > 0 && n !== answer);
    return { pad: GIVEN + k, answer, options: shuffle([answer, ...shuffle(wrong).slice(0, 2)]) };
  });
  return { step, sequence, hops };
}
