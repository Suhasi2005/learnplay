import { shuffle } from '../../utils';
import { ll } from '../tokens';

export const ANIMALS = [
  { id: 'fish', label: 'Fish', emoji: '🐟', habitat: 'water' },
  { id: 'bird', label: 'Bird', emoji: '🐦', habitat: 'sky' },
  { id: 'dog', label: 'Dog', emoji: '🐶', habitat: 'land' },
  { id: 'duck', label: 'Duck', emoji: '🦆', habitat: 'water' },
  { id: 'butterfly', label: 'Butterfly', emoji: '🦋', habitat: 'sky' },
  { id: 'cow', label: 'Cow', emoji: '🐄', habitat: 'land' },
  { id: 'crab', label: 'Crab', emoji: '🦀', habitat: 'water' },
  { id: 'bee', label: 'Bee', emoji: '🐝', habitat: 'sky' },
];

export const TOTAL_ROUNDS = ANIMALS.length;

// Three zones rather than the usual two bins — the extra category is what
// keeps this from being a reskin of the existing Living/Not-Living sort.
export const ZONES = [
  { id: 'land', label: 'Land', emoji: '🌳', color: ll.green, deep: ll.greenDeep },
  { id: 'water', label: 'Water', emoji: '🌊', color: ll.blue, deep: ll.blueDeep },
  { id: 'sky', label: 'Sky', emoji: '☁️', color: ll.purple, deep: ll.purpleDeep },
];

export function buildRound(index) {
  return { ...ANIMALS[index % ANIMALS.length], zones: shuffle(ZONES) };
}
