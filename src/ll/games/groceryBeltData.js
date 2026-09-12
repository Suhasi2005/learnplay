import { shuffle } from '../../utils';

// Everyday objects a Junior KG child meets daily. Deliberately concrete and
// nameable — no abstract nouns — since this is vocabulary-by-picture, not
// vocabulary-by-definition.
export const ITEMS = [
  { id: 'spoon', label: 'Spoon', emoji: '🥄' },
  { id: 'cup', label: 'Cup', emoji: '☕' },
  { id: 'chair', label: 'Chair', emoji: '🪑' },
  { id: 'umbrella', label: 'Umbrella', emoji: '☂️' },
  { id: 'shoe', label: 'Shoe', emoji: '👟' },
  { id: 'bag', label: 'Bag', emoji: '🎒' },
  { id: 'key', label: 'Key', emoji: '🔑' },
  { id: 'ball', label: 'Ball', emoji: '⚽' },
  { id: 'book', label: 'Book', emoji: '📖' },
  { id: 'hat', label: 'Hat', emoji: '🎩' },
];

export const TOTAL_ROUNDS = ITEMS.length;

// Birdie names an item; three others ride the belt as distractors.
export function buildRound(index) {
  const target = ITEMS[index % ITEMS.length];
  const distractors = shuffle(ITEMS.filter((i) => i.id !== target.id)).slice(0, 3);
  const options = shuffle([target, ...distractors]);
  return { target, options };
}
