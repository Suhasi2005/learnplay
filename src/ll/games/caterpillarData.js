import { shuffle } from '../../utils';

// Build a sentence that matches a picture, one caterpillar segment at a
// time, then give it the right tail: a full stop for telling, a question
// mark for asking. Every wrong word still makes a grammatical sentence —
// only the picture rules it out — so the child is reading for meaning.
//
// In `parts`, a string is fixed text and an array is a blank whose FIRST
// entry is the answer.
const ROUNDS = [
  { emoji: '🐦', parts: ['The', ['bird', 'fish', 'cow'], 'can', ['fly', 'swim', 'moo']], mark: '.' },
  { emoji: '🐟', parts: ['Can', 'the', ['fish', 'dog', 'hen'], ['swim', 'bark', 'fly']], mark: '?' },
  { emoji: '🐄', parts: ['The', ['cow', 'cat', 'duck'], 'gives us', ['milk', 'eggs', 'wool']], mark: '.' },
  { emoji: '🌧️', parts: ['Is', 'it', ['raining', 'sunny', 'snowing']], mark: '?' },
  { emoji: '🍎', parts: ['I', ['eat', 'drink', 'wear'], 'a red', ['apple', 'shoe', 'cup']], mark: '.' },
  { emoji: '🐘', parts: ['Where does the', ['elephant', 'mouse', 'ant'], 'live'], mark: '?' },
  { emoji: '📖', parts: ['She is', ['reading', 'eating', 'kicking'], 'a', ['book', 'ball', 'kite']], mark: '.' },
  { emoji: '🚌', parts: ['Do you go to school by', ['bus', 'boat', 'plane']], mark: '?' },
];

export const TOTAL_ROUNDS = ROUNDS.length;

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  const segments = r.parts.map((p, i) => (typeof p === 'string'
    ? { id: `s${i}`, text: p }
    : { id: `s${i}`, answer: p[0], options: shuffle(p) }));

  const steps = [
    ...segments.filter((s) => s.answer).map((s) => ({ segId: s.id, kind: 'word', answer: s.answer, options: s.options })),
    { segId: 'mark', kind: 'mark', answer: r.mark, options: ['.', '?'] },
  ];

  const sentence = `${r.parts.map((p) => (typeof p === 'string' ? p : p[0])).join(' ')}${r.mark}`;
  return { emoji: r.emoji, segments, steps, mark: r.mark, sentence };
}
