import { shuffle } from '../../utils';

// Find every shape of one kind hidden in a 3×3 board.
//
// The board is deliberately unfair in one way: each target shows up next to
// its look-alike (circle beside oval, square beside rectangle), in different
// sizes and colours. Telling a circle from a square is Junior KG; telling a
// circle from an oval is what Senior KG is for.
export const SHAPES = ['circle', 'oval', 'square', 'rectangle', 'triangle'];

const LOOKALIKE = { circle: 'oval', oval: 'circle', square: 'rectangle', rectangle: 'square', triangle: null };

const TARGETS = ['circle', 'square', 'triangle', 'rectangle', 'oval', 'triangle', 'circle', 'square'];

export const TOTAL_ROUNDS = TARGETS.length;

const COLORS = ['#F4699A', '#4B7BE0', '#9169EA', '#4FAE7B', '#FFB020', '#FF8A5B'];
const CELLS = 9;

export function buildRound(index) {
  const target = TARGETS[index % TARGETS.length];
  const count = 2 + (index % 2); // alternates 2 and 3 to find
  const others = SHAPES.filter((s) => s !== target);
  const twin = LOOKALIKE[target];

  const kinds = Array.from({ length: count }, () => target);
  if (twin) kinds.push(twin, twin);
  const fillers = shuffle(others.filter((s) => s !== twin));
  while (kinds.length < CELLS) kinds.push(fillers[kinds.length % fillers.length]);

  const cells = shuffle(kinds).map((shape, i) => ({
    id: i,
    shape,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    // 0.62–1.0 of the cell: size must never be the clue.
    scale: 0.62 + Math.random() * 0.38,
  }));

  return { target, count, cells };
}
