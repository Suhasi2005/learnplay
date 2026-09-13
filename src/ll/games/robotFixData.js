import { shuffle } from '../../utils';

// A robot reads a sentence with exactly one broken word. Step one: find it.
// Step two: pick the fix. Each round targets one Grade 1 grammar rule —
// a/an, is/are, has/have, plurals, he/she, past tense, capitals — and the
// robot says the rule once it's fixed.
const ROUNDS = [
  { words: ['I', 'saw', 'a', 'elephant', 'at', 'the', 'zoo.'], wrong: 2, fix: 'an', others: ['are', 'two'], rule: 'We say an before a vowel sound.' },
  { words: ['The', 'cats', 'is', 'sleeping.'], wrong: 2, fix: 'are', others: ['am', 'be'], rule: 'Many cats are. One cat is.' },
  { words: ['She', 'have', 'a', 'red', 'ball.'], wrong: 1, fix: 'has', others: ['having', 'haves'], rule: 'She has. I have.' },
  { words: ['I', 'have', 'two', 'pencil.'], wrong: 3, fix: 'pencils.', others: ['penciles.', 'pencilz.'], rule: 'More than one pencil is pencils.' },
  { words: ['Ravi', 'is', 'a', 'boy.', 'She', 'likes', 'cricket.'], wrong: 4, fix: 'He', others: ['It', 'They'], rule: 'For a boy we say he.' },
  { words: ['Yesterday', 'we', 'go', 'to', 'the', 'park.'], wrong: 2, fix: 'went', others: ['goes', 'going'], rule: 'Yesterday is in the past, so we went.' },
  { words: ['The', 'sun', 'are', 'very', 'hot.'], wrong: 2, fix: 'is', others: ['am', 'were'], rule: 'There is one sun, so the sun is.' },
  { words: ['my', 'name', 'is', 'Mia.'], wrong: 0, fix: 'My', others: ['Me', 'Mine'], rule: 'A sentence starts with a capital letter.' },
];

export const TOTAL_ROUNDS = ROUNDS.length;

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  const fixedWords = r.words.map((w, i) => (i === r.wrong ? r.fix : w));
  return {
    ...r,
    options: shuffle([r.fix, ...r.others]),
    sentence: r.words.join(' '),
    fixedSentence: fixedWords.join(' '),
  };
}
