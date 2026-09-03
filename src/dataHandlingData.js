import { shuffle } from './utils';

// Each chart is 3 categories with different counts (1-6), so "which has
// the most / fewest" always has one unambiguous answer.
const CHART_THEMES = [
  [{ emoji: '🍎', label: 'Apples' }, { emoji: '🍌', label: 'Bananas' }, { emoji: '🍇', label: 'Grapes' }],
  [{ emoji: '🐶', label: 'Dogs' }, { emoji: '🐱', label: 'Cats' }, { emoji: '🐰', label: 'Rabbits' }],
  [{ emoji: '⚽', label: 'Balls' }, { emoji: '🎈', label: 'Balloons' }, { emoji: '🪁', label: 'Kites' }],
  [{ emoji: '🌸', label: 'Flowers' }, { emoji: '🌳', label: 'Trees' }, { emoji: '🌱', label: 'Sprouts' }],
];

export const TOTAL_ROUNDS = CHART_THEMES.length * 2; // "most" and "fewest" for each theme

function countsFor(seed) {
  // Deterministic-but-varied counts per round so charts don't repeat exactly.
  const base = [2, 4, 6];
  const shifted = base.map((n) => ((n + seed) % 5) + 1);
  return shifted;
}

export function buildRound(index) {
  const themeIndex = index % CHART_THEMES.length;
  const askMost = index < CHART_THEMES.length;
  const theme = CHART_THEMES[themeIndex];
  const counts = shuffle(countsFor(index));

  const bars = theme.map((cat, i) => ({ ...cat, count: counts[i] }));
  const target = askMost
    ? bars.reduce((max, b) => (b.count > max.count ? b : max))
    : bars.reduce((min, b) => (b.count < min.count ? b : min));

  return { bars, askMost, correctLabel: target.label };
}
