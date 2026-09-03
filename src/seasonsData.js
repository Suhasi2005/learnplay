import { shuffle } from './utils';

export const SEASONS = [
  { id: 'summer', label: 'Summer', emoji: '☀️', correctWear: { id: 'shorts', label: 'Shorts', emoji: '🩳' } },
  { id: 'winter', label: 'Winter', emoji: '❄️', correctWear: { id: 'sweater', label: 'Sweater', emoji: '🧥' } },
  { id: 'rainy', label: 'Rainy', emoji: '🌧️', correctWear: { id: 'umbrella', label: 'Umbrella', emoji: '☂️' } },
];

const ALL_WEAR = [
  { id: 'shorts', label: 'Shorts', emoji: '🩳' },
  { id: 'sweater', label: 'Sweater', emoji: '🧥' },
  { id: 'umbrella', label: 'Umbrella', emoji: '☂️' },
  { id: 'sunglasses', label: 'Sunglasses', emoji: '🕶️' },
  { id: 'boots', label: 'Boots', emoji: '🥾' },
  { id: 'scarf', label: 'Scarf', emoji: '🧣' },
];

export const TOTAL_ROUNDS = SEASONS.length * 2; // play through the 3 seasons twice, shuffled

export function buildRound(index) {
  const season = SEASONS[index % SEASONS.length];
  const wrongOptions = shuffle(ALL_WEAR.filter((w) => w.id !== season.correctWear.id)).slice(0, 3);
  const options = shuffle([season.correctWear, ...wrongOptions]);
  return { season, correctId: season.correctWear.id, options };
}
