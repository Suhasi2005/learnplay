import { shuffle } from './utils';

// O'clock times only (minute hand always at 12) — the right first step
// before introducing half-past or quarter-past.
export const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
export const TOTAL_ROUNDS = HOURS.length;

export function buildRound(index) {
  const hour = HOURS[index];
  const label = `${hour}:00`;
  const wrongPool = HOURS.filter((h) => h !== hour).map((h) => `${h}:00`);
  const wrongOptions = shuffle(wrongPool).slice(0, 3);
  const options = shuffle([label, ...wrongOptions]);
  return { hour, label, options };
}
