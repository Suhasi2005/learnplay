import { shuffle } from '../../utils';

// "My School": pack the bag for today's timetable. Tap things into the bag
// (tap again to take them out), then zip it. Zipping checks both ways —
// something missing, or something that shouldn't come to school today —
// and says which, so a wrong zip teaches rather than just buzzes.
export const ITEMS = {
  notebook: { emoji: '📓', label: 'notebook' },
  pencil: { emoji: '✏️', label: 'pencil' },
  ruler: { emoji: '📏', label: 'ruler' },
  lunch: { emoji: '🍱', label: 'lunch box' },
  crayons: { emoji: '🖍️', label: 'crayons' },
  paints: { emoji: '🎨', label: 'paints' },
  shoes: { emoji: '👟', label: 'sports shoes' },
  bottle: { emoji: '🥤', label: 'water bottle' },
  storybook: { emoji: '📚', label: 'library book' },
  cap: { emoji: '🧢', label: 'cap' },
  magnifier: { emoji: '🔍', label: 'magnifying glass' },
  teddy: { emoji: '🧸', label: 'teddy bear' },
  game: { emoji: '🎮', label: 'video game' },
  ball: { emoji: '🏀', label: 'basketball' },
};

const ROUNDS = [
  { plan: 'Maths class and lunch', needed: ['notebook', 'ruler', 'lunch'], extras: ['teddy', 'game', 'crayons'] },
  { plan: 'Drawing class', needed: ['crayons', 'paints'], extras: ['game', 'teddy', 'ruler', 'ball'] },
  { plan: 'Sports day and lunch', needed: ['shoes', 'bottle', 'lunch'], extras: ['game', 'crayons', 'teddy'] },
  { plan: 'Library day', needed: ['storybook', 'notebook'], extras: ['ball', 'game', 'paints', 'teddy'] },
  { plan: 'English class and a water bottle', needed: ['notebook', 'pencil', 'bottle'], extras: ['game', 'ball', 'teddy'] },
  { plan: 'Class picnic', needed: ['lunch', 'bottle', 'cap'], extras: ['ruler', 'game', 'paints'] },
  { plan: 'Maths test', needed: ['pencil', 'ruler', 'notebook'], extras: ['teddy', 'paints', 'ball'] },
  { plan: 'Science walk in the garden', needed: ['notebook', 'pencil', 'magnifier'], extras: ['game', 'teddy', 'paints'] },
];

export const TOTAL_ROUNDS = ROUNDS.length;

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  return {
    plan: r.plan,
    needed: r.needed,
    tray: shuffle([...r.needed, ...r.extras]).map((id) => ({ id, ...ITEMS[id] })),
  };
}
