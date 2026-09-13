import { shuffle } from '../../utils';

// Hear a three-letter word, see its picture, find the missing sound. The gap
// moves between the beginning, middle and end, because children who can
// hear a first sound often still can't isolate a middle vowel. Vowel gaps
// get other vowels as options; consonant gaps get the letters they're
// usually confused with.
const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const CONFUSE = {
  c: ['k', 's'], d: ['b', 'p'], n: ['m', 'r'], x: ['s', 'k'], h: ['n', 'f'],
  p: ['b', 'd'], b: ['d', 'p'], g: ['j', 'q'], t: ['f', 'd'],
};

const ROUNDS = [
  { emoji: '🐱', word: 'cat', missing: 1 },
  { emoji: '🐶', word: 'dog', missing: 0 },
  { emoji: '☀️', word: 'sun', missing: 2 },
  { emoji: '🐷', word: 'pig', missing: 1 },
  { emoji: '🛏️', word: 'bed', missing: 1 },
  { emoji: '🦊', word: 'fox', missing: 2 },
  { emoji: '🎩', word: 'hat', missing: 0 },
  { emoji: '🐛', word: 'bug', missing: 1 },
  { emoji: '🗺️', word: 'map', missing: 2 },
  { emoji: '🦇', word: 'bat', missing: 0 },
];

export const TOTAL_ROUNDS = ROUNDS.length;

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  const answer = r.word[r.missing];
  const wrong = VOWELS.includes(answer) ? shuffle(VOWELS.filter((v) => v !== answer)).slice(0, 2) : CONFUSE[answer];
  return {
    ...r,
    answer,
    options: shuffle([answer, ...wrong]),
    position: ['beginning', 'middle', 'end'][r.missing],
  };
}
