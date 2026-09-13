import { shuffle } from '../../utils';

// Cloze reading: the blank is always the sentence's meaning-carrying word, so
// a child has to understand the whole sentence rather than pattern-match a
// part of speech. Distractors are real nouns that fit grammatically but not
// sensibly — "the dog jumped into the chair" is a valid sentence and a wrong
// answer, which is the point.
export const ROUNDS = [
  { before: 'The sun was hot, so the dog jumped into the', after: '.', answer: 'Pond', distractors: ['Chair', 'Cloud'] },
  { before: 'It was raining, so Mia opened her', after: '.', answer: 'Umbrella', distractors: ['Ice cream', 'Kite'] },
  { before: 'The cat was hungry and drank some', after: '.', answer: 'Milk', distractors: ['Shoe', 'Book'] },
  { before: 'At night, we can see the moon and the', after: '.', answer: 'Stars', distractors: ['Sand', 'Spoon'] },
  { before: 'The bird built a', after: 'in the tree.', answer: 'Nest', distractors: ['Boat', 'Bed'] },
  { before: 'Leo was cold, so he wore a warm', after: '.', answer: 'Sweater', distractors: ['Swimsuit', 'Sandals'] },
  { before: 'The farmer picked ripe', after: 'from the tree.', answer: 'Apples', distractors: ['Shoes', 'Chairs'] },
  { before: 'Birdie flew high up into the', after: '.', answer: 'Sky', distractors: ['Sea', 'Soil'] },
];

export const TOTAL_ROUNDS = ROUNDS.length;

// Balloon colours cycle so three balloons on screen are never the same shade.
export const BALLOON_COLORS = ['#F4699A', '#4B7BE0', '#9169EA', '#4FAE7B', '#FFC844'];

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  const words = shuffle([r.answer, ...r.distractors]);
  return {
    before: r.before,
    after: r.after,
    answer: r.answer,
    balloons: words.map((word, i) => ({
      word,
      color: BALLOON_COLORS[(index + i) % BALLOON_COLORS.length],
      // Staggered so the three never bob in unison.
      delay: i * 380,
      duration: 2600 + i * 320,
    })),
  };
}
