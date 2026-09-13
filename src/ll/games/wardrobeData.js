import { shuffle } from '../../utils';

// "Our Clothes": dress for the weather, the job or the occasion, one body
// part at a time. Weather rounds cover why we wear what we wear; job and
// occasion rounds cover special clothes — both are in the NCERT chapter.
const ROUNDS = [
  { emoji: '🌧️', scene: 'a rainy day', steps: [
    ['Body', ['🧥', 'raincoat'], [['🩱', 'swimsuit'], ['🎽', 'vest']]],
    ['Carry', ['☂️', 'umbrella'], [['🕶️', 'sunglasses'], ['🪁', 'kite']]],
    ['Feet', ['🥾', 'boots'], [['👠', 'high heels'], ['⛸️', 'ice skates']]],
  ] },
  { emoji: '❄️', scene: 'playing in the snow', steps: [
    ['Body', ['🧥', 'warm coat'], [['🩱', 'swimsuit'], ['🎽', 'vest']]],
    ['Neck', ['🧣', 'scarf'], [['👔', 'tie'], ['📿', 'beads']]],
    ['Hands', ['🧤', 'gloves'], [['💍', 'ring'], ['⌚', 'watch']]],
  ] },
  { emoji: '🏖️', scene: 'a day at the beach', steps: [
    ['Head', ['👒', 'sun hat'], [['⛑️', 'helmet'], ['🎓', 'graduation cap']]],
    ['Body', ['🩱', 'swimsuit'], [['🧥', 'winter coat'], ['🥼', 'lab coat']]],
    ['Feet', ['🩴', 'flip-flops'], [['🥾', 'boots'], ['⛸️', 'ice skates']]],
  ] },
  { emoji: '🏥', scene: 'the doctor at work', steps: [
    ['Body', ['🥼', "doctor's coat"], [['🩱', 'swimsuit'], ['🦺', 'safety vest']]],
    ['Neck', ['🩺', 'stethoscope'], [['🧣', 'scarf'], ['📿', 'beads']]],
  ] },
  { emoji: '🚒', scene: 'the firefighter at work', steps: [
    ['Head', ['⛑️', 'helmet'], [['👒', 'sun hat'], ['🎩', 'top hat']]],
    ['Body', ['🦺', 'safety jacket'], [['👗', 'dress'], ['🩱', 'swimsuit']]],
    ['Feet', ['🥾', 'boots'], [['🩴', 'flip-flops'], ['👠', 'high heels']]],
  ] },
  { emoji: '🏏', scene: 'a cricket match', steps: [
    ['Head', ['🧢', 'cap'], [['👑', 'crown'], ['🎩', 'top hat']]],
    ['Body', ['👕', 't-shirt'], [['🧥', 'winter coat'], ['👗', 'party dress']]],
    ['Feet', ['👟', 'sports shoes'], [['👠', 'high heels'], ['🩴', 'flip-flops']]],
  ] },
  { emoji: '💐', scene: 'a wedding', steps: [
    ['Body', ['🥻', 'sari'], [['🦺', 'safety vest'], ['🩱', 'swimsuit']]],
    ['Neck', ['📿', 'necklace'], [['🩺', 'stethoscope'], ['🧣', 'woolly scarf']]],
    ['Feet', ['👡', 'sandals'], [['🥾', 'gum boots'], ['⛸️', 'ice skates']]],
  ] },
  { emoji: '☀️', scene: 'a hot sunny day', steps: [
    ['Head', ['👒', 'sun hat'], [['⛑️', 'helmet'], ['🎓', 'graduation cap']]],
    ['Body', ['👕', 'cotton t-shirt'], [['🧥', 'woolly coat'], ['🥼', 'lab coat']]],
    ['Eyes', ['🕶️', 'sunglasses'], [['🤿', 'diving mask'], ['🎭', 'masks']]],
  ] },
];

export const TOTAL_ROUNDS = ROUNDS.length;

const toOption = ([emoji, label]) => ({ id: emoji, emoji, label });

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  return {
    emoji: r.emoji,
    scene: r.scene,
    steps: r.steps.map(([slot, answer, wrong]) => ({
      slot,
      answer: toOption(answer),
      options: shuffle([answer, ...wrong]).map(toOption),
    })),
  };
}
