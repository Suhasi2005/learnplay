import { ANIMALS as SPRITES } from './sceneAssets';
import { shuffle } from './utils';

// Farm-and-pond animals: every one is familiar to a 4–7 year old, and every
// sound is distinct enough that no two rounds can be confused for each other.
//
// The set is drawn from the species the sprite pack actually provides. Cat,
// sheep and lion were in an earlier emoji version and are not in the pack;
// they were dropped rather than left as emoji, because a screen mixing flat
// illustrated sprites with emoji looks like two different games. Keeping the
// set to one coherent theme also lets this game sit in the farm world.
export const ANIMALS = [
  { id: 'cow', label: 'Cow', sprite: SPRITES.cow, sound: 'Moo!' },
  { id: 'dog', label: 'Dog', sprite: SPRITES.dog, sound: 'Woof!' },
  { id: 'duck', label: 'Duck', sprite: SPRITES.duck, sound: 'Quack!' },
  { id: 'pig', label: 'Pig', sprite: SPRITES.pig, sound: 'Oink!' },
  { id: 'horse', label: 'Horse', sprite: SPRITES.horse, sound: 'Neigh!' },
  { id: 'goat', label: 'Goat', sprite: SPRITES.goat, sound: 'Maa!' },
  { id: 'chicken', label: 'Hen', sprite: SPRITES.chicken, sound: 'Cluck!' },
  { id: 'frog', label: 'Frog', sprite: SPRITES.frog, sound: 'Ribbit!' },
];

export const TOTAL_ROUNDS = ANIMALS.length;

// Shown the sound word, tap the animal that makes it.
export function buildRound(index) {
  const target = ANIMALS[index];
  const wrongOptions = shuffle(ANIMALS.filter((a) => a.id !== target.id)).slice(0, 3);
  const options = shuffle([target, ...wrongOptions]);
  return { sound: target.sound, correctId: target.id, options };
}
