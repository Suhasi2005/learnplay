import { shuffle } from '../../utils';

// Word order, taught with a picture. The child sees what the sentence is
// about, hears it, then taps the blocks in reading order. Four or five words:
// enough that order matters, short enough to hold in a five-year-old's head.
export const ROUNDS = [
  { emoji: '🐶', words: ['The', 'dog', 'can', 'run'] },
  { emoji: '🍎', words: ['I', 'like', 'red', 'apples'] },
  { emoji: '🐟', words: ['A', 'fish', 'can', 'swim'] },
  { emoji: '☀️', words: ['The', 'sun', 'is', 'hot'] },
  { emoji: '🐱', words: ['The', 'cat', 'is', 'sleeping'] },
  { emoji: '🚌', words: ['We', 'go', 'by', 'bus'] },
  { emoji: '🎈', words: ['My', 'balloon', 'is', 'big'] },
  { emoji: '🐦', words: ['Birds', 'fly', 'in', 'the', 'sky'] },
];

export const TOTAL_ROUNDS = ROUNDS.length;

const BLOCK_COLORS = ['#F4699A', '#4B7BE0', '#9169EA', '#4FAE7B', '#FFB020'];

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  const blocks = r.words.map((word, i) => ({ id: i, word, color: BLOCK_COLORS[i % BLOCK_COLORS.length] }));
  // Never deal the blocks already in order — the round would solve itself.
  let dealt = shuffle(blocks);
  while (dealt.every((b, i) => b.id === i)) dealt = shuffle(blocks);
  return { emoji: r.emoji, words: r.words, sentence: `${r.words.join(' ')}.`, blocks: dealt };
}
