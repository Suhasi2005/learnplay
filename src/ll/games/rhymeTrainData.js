import { shuffle } from '../../utils';

// Every pair is picture-able on both ends — a rhyme a child can hear AND see,
// which matters at this age since the word alone (without art) doesn't carry
// meaning yet. Distractors share no sound with the target, so a lucky guess
// isn't possible by process of elimination on rhyme alone.
export const ROUNDS = [
  { target: { label: 'Cat', emoji: '🐱' }, rhyme: { label: 'Hat', emoji: '🎩' }, distractors: [{ label: 'Dog', emoji: '🐶' }, { label: 'Sun', emoji: '☀️' }] },
  { target: { label: 'Box', emoji: '📦' }, rhyme: { label: 'Fox', emoji: '🦊' }, distractors: [{ label: 'Pig', emoji: '🐷' }, { label: 'Cup', emoji: '☕' }] },
  { target: { label: 'Star', emoji: '⭐' }, rhyme: { label: 'Car', emoji: '🚗' }, distractors: [{ label: 'Dog', emoji: '🐶' }, { label: 'Bag', emoji: '🎒' }] },
  { target: { label: 'Bee', emoji: '🐝' }, rhyme: { label: 'Tree', emoji: '🌳' }, distractors: [{ label: 'Fish', emoji: '🐟' }, { label: 'Hat', emoji: '🎩' }] },
  { target: { label: 'Moon', emoji: '🌙' }, rhyme: { label: 'Spoon', emoji: '🥄' }, distractors: [{ label: 'Cat', emoji: '🐱' }, { label: 'Ball', emoji: '⚽' }] },
  { target: { label: 'Snake', emoji: '🐍' }, rhyme: { label: 'Cake', emoji: '🍰' }, distractors: [{ label: 'Bird', emoji: '🐦' }, { label: 'Book', emoji: '📖' }] },
  { target: { label: 'King', emoji: '👑' }, rhyme: { label: 'Ring', emoji: '💍' }, distractors: [{ label: 'Sun', emoji: '☀️' }, { label: 'Cat', emoji: '🐱' }] },
  { target: { label: 'Mouse', emoji: '🐭' }, rhyme: { label: 'House', emoji: '🏠' }, distractors: [{ label: 'Tree', emoji: '🌳' }, { label: 'Star', emoji: '⭐' }] },
];

export const TOTAL_ROUNDS = ROUNDS.length;

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  const options = shuffle([r.rhyme, ...r.distractors]);
  return { target: r.target, options, answerLabel: r.rhyme.label };
}
