import { shuffle } from './utils';

export const HELPERS = [
  { id: 'doctor', label: 'Doctor', emoji: '👨‍⚕️', tool: '🩺' },
  { id: 'firefighter', label: 'Firefighter', emoji: '👨‍🚒', tool: '🚒' },
  { id: 'teacher', label: 'Teacher', emoji: '👩‍🏫', tool: '📚' },
  { id: 'police', label: 'Police Officer', emoji: '👮', tool: '🚓' },
  { id: 'chef', label: 'Chef', emoji: '👨‍🍳', tool: '🍳' },
  { id: 'farmer', label: 'Farmer', emoji: '👨‍🌾', tool: '🌾' },
  { id: 'postman', label: 'Postman', emoji: '📮', tool: '✉️' },
  { id: 'pilot', label: 'Pilot', emoji: '👨‍✈️', tool: '✈️' },
];

export const TOTAL_ROUNDS = HELPERS.length;

// Shown the tool, tap the helper who uses it.
export function buildRound(index) {
  const target = HELPERS[index];
  const wrongOptions = shuffle(HELPERS.filter((h) => h.id !== target.id)).slice(0, 3);
  const options = shuffle([target, ...wrongOptions]);
  return { tool: target.tool, correctId: target.id, options };
}
