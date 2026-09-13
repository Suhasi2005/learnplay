import { shuffle } from '../../utils';

// Time for Class 1 is sequence, not clocks: what happens first, next, last,
// and the days of the week. "Order" rounds deal four cards to tap in the
// order they happen; "day" rounds ask what comes after or before a day,
// including the wrap-around from Saturday to Sunday.
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ROUNDS = [
  { kind: 'order', title: 'Getting ready', events: [['🌅', 'Wake up'], ['🪥', 'Brush teeth'], ['🎒', 'Go to school'], ['🛌', 'Go to sleep']] },
  { kind: 'day', dir: 'after', day: 'Monday' },
  { kind: 'order', title: 'Meals of the day', events: [['🥣', 'Breakfast'], ['🍱', 'Lunch'], ['🍪', 'Evening snack'], ['🍽️', 'Dinner']] },
  { kind: 'day', dir: 'before', day: 'Friday' },
  { kind: 'order', title: 'Growing a plant', events: [['🌰', 'Plant a seed'], ['💧', 'Water it'], ['🌱', 'It sprouts'], ['🌻', 'It flowers']] },
  { kind: 'day', dir: 'after', day: 'Saturday' },
  { kind: 'order', title: 'Parts of the day', events: [['🌅', 'Morning'], ['☀️', 'Afternoon'], ['🌇', 'Evening'], ['🌙', 'Night']] },
  { kind: 'day', dir: 'before', day: 'Sunday' },
];

export const TOTAL_ROUNDS = ROUNDS.length;

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];

  if (r.kind === 'order') {
    const events = r.events.map(([emoji, label], i) => ({ id: i, emoji, label }));
    let dealt = shuffle(events);
    while (dealt.every((e, i) => e.id === i)) dealt = shuffle(events);
    return { kind: 'order', title: r.title, events, dealt };
  }

  const i = DAYS.indexOf(r.day);
  const step = r.dir === 'after' ? 1 : -1;
  const at = (k) => DAYS[(i + k * step + 7) % 7];
  return { ...r, answer: at(1), options: shuffle([at(1), at(-1), at(2)]) };
}
