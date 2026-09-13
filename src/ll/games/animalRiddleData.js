import { shuffle } from '../../utils';

// "Animals Around Us" as a guessing game. Clues arrive one at a time —
// where it lives, then what it's like, then the giveaway — and the child
// can guess whenever they're sure. The first clue always fits more than one
// of the four animals on purpose; a wrong guess greys that animal out and
// reveals the next clue.
const ROUNDS = [
  { answer: ['🦁', 'lion'], others: [['🐯', 'tiger'], ['🐒', 'monkey'], ['🐄', 'cow']],
    clues: ['I live in the forest.', 'I have a big furry mane.', 'I roar very loudly!'] },
  { answer: ['🐟', 'fish'], others: [['🐸', 'frog'], ['🦆', 'duck'], ['🐢', 'turtle']],
    clues: ['I live in water.', 'I have fins, not legs.', 'I breathe with gills.'] },
  { answer: ['🐔', 'hen'], others: [['🐄', 'cow'], ['🦆', 'duck'], ['🐐', 'goat']],
    clues: ['I live on a farm.', 'I lay eggs.', 'I have feathers and I say cluck!'] },
  { answer: ['🐪', 'camel'], others: [['🐎', 'horse'], ['🐍', 'snake'], ['🦁', 'lion']],
    clues: ['I live in the desert.', 'I can go many days without water.', 'I have a hump on my back.'] },
  { answer: ['🐸', 'frog'], others: [['🐢', 'turtle'], ['🐊', 'crocodile'], ['🦆', 'duck']],
    clues: ['I live on land and in water.', 'I start my life as a tadpole.', 'I say ribbit!'] },
  { answer: ['🐄', 'cow'], others: [['🐐', 'goat'], ['🐑', 'sheep'], ['🐎', 'horse']],
    clues: ['I eat grass.', 'I give us milk.', 'I say moo!'] },
  { answer: ['🐧', 'penguin'], others: [['🦆', 'duck'], ['🐟', 'fish'], ['🐻', 'bear']],
    clues: ['I live where it is very cold.', 'I am a bird, but I cannot fly.', 'I waddle and slide on the ice.'] },
  { answer: ['🐝', 'bee'], others: [['🦋', 'butterfly'], ['🐜', 'ant'], ['🐞', 'ladybird']],
    clues: ['I am very small.', 'I have wings and I buzz.', 'I make honey.'] },
];

export const TOTAL_ROUNDS = ROUNDS.length;

const toAnimal = ([emoji, label]) => ({ id: label, emoji, label });

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  return {
    answer: r.answer[1],
    clues: r.clues,
    options: shuffle([r.answer, ...r.others]).map(toAnimal),
  };
}
