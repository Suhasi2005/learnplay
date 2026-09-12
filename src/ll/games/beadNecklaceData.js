import { shuffle } from '../../utils';
import { ll } from '../tokens';

const { pink: RED, blue: BLUE, amberWarm: YELLOW, green: GREEN, purple: PURPLE } = ll;

// Two pattern shapes appropriate for age 3–4: alternating (AB AB) and
// odd-one-out repeats (AAB AAB). Anything more irregular is too hard for the
// age band this topic targets — that restraint is deliberate, not a shortcut.
export const ROUNDS = [
  { sequence: [RED, BLUE, RED, BLUE, RED], next: BLUE, distractors: [YELLOW, GREEN] },
  { sequence: [YELLOW, YELLOW, GREEN, YELLOW, YELLOW], next: GREEN, distractors: [RED, BLUE] },
  { sequence: [BLUE, RED, BLUE, RED, BLUE], next: RED, distractors: [GREEN, YELLOW] },
  { sequence: [GREEN, GREEN, PURPLE, GREEN, GREEN], next: PURPLE, distractors: [RED, BLUE] },
  { sequence: [RED, YELLOW, RED, YELLOW, RED], next: YELLOW, distractors: [BLUE, GREEN] },
  { sequence: [PURPLE, BLUE, PURPLE, BLUE, PURPLE], next: BLUE, distractors: [RED, YELLOW] },
  { sequence: [BLUE, BLUE, RED, BLUE, BLUE], next: RED, distractors: [GREEN, PURPLE] },
  { sequence: [YELLOW, GREEN, YELLOW, GREEN, YELLOW], next: GREEN, distractors: [RED, PURPLE] },
];

export const TOTAL_ROUNDS = ROUNDS.length;

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  const options = shuffle([r.next, ...r.distractors]);
  return { sequence: r.sequence, options, answer: r.next };
}
