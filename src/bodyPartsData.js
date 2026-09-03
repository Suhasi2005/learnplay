import { shuffle } from './utils';

export const BODY_PARTS = [
  { id: 'eye', label: 'Eye', emoji: '👁️' },
  { id: 'ear', label: 'Ear', emoji: '👂' },
  { id: 'nose', label: 'Nose', emoji: '👃' },
  { id: 'mouth', label: 'Mouth', emoji: '👄' },
  { id: 'hand', label: 'Hand', emoji: '✋' },
  { id: 'foot', label: 'Foot', emoji: '🦶' },
];

export const TOTAL_ROUNDS = BODY_PARTS.length;

// Spoken the part's name, tap the matching icon among 4.
export function buildRound(index) {
  const target = BODY_PARTS[index];
  const wrongOptions = shuffle(BODY_PARTS.filter((p) => p.id !== target.id)).slice(0, 3);
  const options = shuffle([target, ...wrongOptions]);
  return { label: target.label, correctId: target.id, options };
}
