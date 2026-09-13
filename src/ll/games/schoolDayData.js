// "Where should Mia go?" — a little map of a child's world: home, the
// classroom, the playground, the library. A moment from the day is read out
// and the child sends Mia to the place it happens.
//
// The map never reshuffles between rounds. Knowing the library is "the one
// at the bottom right" by round five is the point — it's a map.
export const PLACES = [
  { id: 'home', label: 'Home', emoji: '🏠', bg: '#FFE3EE', ink: '#D9558B' },
  { id: 'classroom', label: 'Classroom', emoji: '🏫', bg: '#E8F0FF', ink: '#3E6FD6' },
  { id: 'playground', label: 'Playground', emoji: '⚽', bg: '#E3F5EA', ink: '#3F9A6C' },
  { id: 'library', label: 'Library', emoji: '📚', bg: '#FFF1D6', ink: '#96702B' },
];

export const ROUNDS = [
  { moment: 'Teacher is writing new words on the board.', emoji: '✏️', place: 'classroom' },
  { moment: 'It is time to eat dinner with Mummy and Papa.', emoji: '🍲', place: 'home' },
  { moment: 'Mia wants to swing and slide with her friends.', emoji: '🤸', place: 'playground' },
  { moment: 'Mia wants to borrow a storybook to read.', emoji: '📖', place: 'library' },
  { moment: 'Grandma tells a bedtime story.', emoji: '🌙', place: 'home' },
  { moment: 'Recess! Let\'s run and play catch.', emoji: '🏃', place: 'playground' },
  { moment: 'We sit at our desks and count with teacher.', emoji: '🔢', place: 'classroom' },
  { moment: 'Shh! Everyone reads quietly here.', emoji: '🤫', place: 'library' },
];

export const TOTAL_ROUNDS = ROUNDS.length;

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  return { ...r, placeLabel: PLACES.find((p) => p.id === r.place)?.label };
}
