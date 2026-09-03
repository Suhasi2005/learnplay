import { shuffle } from './utils';

export const ANIMALS = [
  { id: 'cow', label: 'Cow', emoji: '🐄', sound: 'Moo!' },
  { id: 'dog', label: 'Dog', emoji: '🐶', sound: 'Woof!' },
  { id: 'cat', label: 'Cat', emoji: '🐱', sound: 'Meow!' },
  { id: 'duck', label: 'Duck', emoji: '🦆', sound: 'Quack!' },
  { id: 'sheep', label: 'Sheep', emoji: '🐑', sound: 'Baa!' },
  { id: 'lion', label: 'Lion', emoji: '🦁', sound: 'Roar!' },
  { id: 'pig', label: 'Pig', emoji: '🐷', sound: 'Oink!' },
  { id: 'horse', label: 'Horse', emoji: '🐴', sound: 'Neigh!' },
];

export const TOTAL_ROUNDS = ANIMALS.length;

// Shown the sound word, tap the animal that makes it.
export function buildRound(index) {
  const target = ANIMALS[index];
  const wrongOptions = shuffle(ANIMALS.filter((a) => a.id !== target.id)).slice(0, 3);
  const options = shuffle([target, ...wrongOptions]);
  return { sound: target.sound, correctId: target.id, options };
}
