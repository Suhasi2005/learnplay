import { shuffle } from '../../utils';

// The quiz engine.
//
// Nineteen topics have bespoke mechanics and keep them. The remaining
// forty-one are mostly "look at this, pick the right one" — building forty-one
// hand-rolled screens for that would be forty-one chances to introduce a bug
// and no more fun for the child. So those run on one engine and differ only
// in content.
//
// A question is deliberately small:
//
//   {
//     prompt:   'Which one is a fruit?'
//     show:     '🍎🍎🍎'          optional big visual above the choices
//     choices:  ['Apple','Chair'] or [{label,emoji}]
//     answer:   0                 index into choices
//     hint:     'Fruits grow on trees and you can eat them.'
//   }
//
// Choice order is shuffled per play so a child learns the content rather than
// the position of the right button.

export const LETTERS = ['A', 'B', 'C', 'D'];

function normaliseChoice(c) {
  if (typeof c === 'string') return { label: c, emoji: null };
  return { label: c.label ?? '', emoji: c.emoji ?? null };
}

// Builds one round: the question with its choices shuffled, and the index of
// the correct one after shuffling.
export function buildRound(question) {
  const choices = (question.choices ?? []).map(normaliseChoice);
  const correct = choices[question.answer];

  const order = shuffle(choices.map((c, i) => i));
  const shuffled = order.map((i) => choices[i]);
  const answerIndex = shuffled.indexOf(correct);

  return {
    prompt: question.prompt,
    show: question.show ?? null,
    hint: question.hint ?? null,
    choices: shuffled,
    answerIndex,
  };
}

// Stars are per correct answer, so a topic's `total` in curriculum.js is
// simply its question count. Keeping that identity means the progress bars,
// the "round N of M" labels and the resume bound all agree without anyone
// having to remember a second number.
export function totalFor(questions) {
  return questions.length;
}

// A gentle scoring rule: three hearts, and a wrong answer costs one. Running
// out doesn't end anything — it just means Buddy shows the answer and the
// round moves on. Nothing in this app should be able to fail a five-year-old.
export const MAX_HEARTS = 3;
