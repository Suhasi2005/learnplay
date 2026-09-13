import { shuffle } from '../../utils';

// "My Family" as riddles over a family tree. The tree is on screen the
// whole time with faces but no names; each solved riddle writes a name onto
// its branch, so the child is reading relationships off the tree rather
// than recalling words.
export const MEMBERS = [
  { id: 'grandfather', label: 'Grandfather', emoji: '👴', row: 0 },
  { id: 'grandmother', label: 'Grandmother', emoji: '👵', row: 0 },
  { id: 'father', label: 'Father', emoji: '👨', row: 1 },
  { id: 'mother', label: 'Mother', emoji: '👩', row: 1 },
  { id: 'uncle', label: 'Uncle', emoji: '🧔', row: 1 },
  { id: 'me', label: 'Me', emoji: '🧒', row: 2 },
  { id: 'brother', label: 'Brother', emoji: '👦', row: 2 },
  { id: 'sister', label: 'Sister', emoji: '👧', row: 2 },
  { id: 'cousin', label: 'Cousin', emoji: '🧑', row: 2 },
];

const ROUNDS = [
  { riddle: "My father's father is my…", answer: 'grandfather', wrong: ['uncle', 'brother'] },
  { riddle: "My father's brother is my…", answer: 'uncle', wrong: ['grandfather', 'cousin'] },
  { riddle: "My mother's son, who is not me, is my…", answer: 'brother', wrong: ['cousin', 'uncle'] },
  { riddle: "My father's mother is my…", answer: 'grandmother', wrong: ['mother', 'sister'] },
  { riddle: "My uncle's child is my…", answer: 'cousin', wrong: ['sister', 'brother'] },
  { riddle: "My father's wife is my…", answer: 'mother', wrong: ['grandmother', 'sister'] },
  { riddle: "My parents' daughter, who is not me, is my…", answer: 'sister', wrong: ['cousin', 'mother'] },
  { riddle: "Grandfather has two sons. One is my father, the other is my…", answer: 'uncle', wrong: ['brother', 'cousin'] },
];

export const TOTAL_ROUNDS = ROUNDS.length;

const member = (id) => MEMBERS.find((m) => m.id === id);

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  return {
    riddle: r.riddle,
    answer: r.answer,
    solved: r.riddle.replace('…', ` ${member(r.answer).label.toLowerCase()}.`),
    options: shuffle([r.answer, ...r.wrong]).map(member),
  };
}
