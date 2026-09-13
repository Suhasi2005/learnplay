// NCERT Class 1 "What is Long, What is Round?": objects with a curved
// surface roll, flat ones slide; things are long or round. Rounds alternate
// between the two questions about everyday objects, and the answer is
// acted out on a ramp.
const ROUNDS = [
  { kind: 'move', emoji: '⚽', label: 'ball', answer: 'rolls' },
  { kind: 'shape', emoji: '📏', label: 'ruler', answer: 'long' },
  { kind: 'move', emoji: '📦', label: 'box', answer: 'slides' },
  { kind: 'shape', emoji: '🌕', label: 'full moon', answer: 'round' },
  { kind: 'move', emoji: '🏀', label: 'basketball', answer: 'rolls' },
  { kind: 'shape', emoji: '🐍', label: 'snake', answer: 'long' },
  { kind: 'move', emoji: '📕', label: 'book', answer: 'slides' },
  { kind: 'shape', emoji: '🍩', label: 'doughnut', answer: 'round' },
  { kind: 'move', emoji: '🍊', label: 'orange', answer: 'rolls' },
  { kind: 'shape', emoji: '🥖', label: 'bread stick', answer: 'long' },
];

export const TOTAL_ROUNDS = ROUNDS.length;

export const OPTIONS = {
  move: [{ id: 'rolls', emoji: '🌀', label: 'Rolls' }, { id: 'slides', emoji: '➡️', label: 'Slides' }],
  shape: [{ id: 'long', emoji: '📏', label: 'Long' }, { id: 'round', emoji: '⚪', label: 'Round' }],
};

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  return { ...r, options: OPTIONS[r.kind] };
}
