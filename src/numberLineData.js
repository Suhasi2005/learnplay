import { shuffle } from './utils';

// A 5-number window from the 10-20 range, with one number in the middle
// (never the first or last tile) blanked out — filling a mid-sequence gap
// is a different task than predicting what comes after the end.
export const TOTAL_ROUNDS = 10;

export function buildRound(index) {
  const start = 10 + index; // windows: 10-14, 11-15, ... 19-23 (nudges past 20 near the end, still fine as a counting exercise)
  const window = [start, start + 1, start + 2, start + 3, start + 4];
  const gapPos = 1 + (index % 3); // gap at position 1, 2, or 3 (never the ends)
  const correct = window[gapPos];
  const sequence = window.map((n, i) => (i === gapPos ? null : n));

  // Draw distractors from a wider ±5 band, not just the immediate
  // neighbors — the immediate neighbors are frequently *inside* the
  // visible window (and therefore useless as options), which left as few
  // as 1-2 valid candidates in testing instead of the 3 needed.
  const wrongPool = [];
  for (let n = correct - 5; n <= correct + 5; n++) {
    if (n > 0 && !window.includes(n)) wrongPool.push(n);
  }
  const wrongOptions = shuffle(wrongPool).slice(0, 3);
  const options = shuffle([correct, ...wrongOptions]);

  return { sequence, correct, options };
}
