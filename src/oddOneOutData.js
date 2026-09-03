import { shuffle } from './utils';

const COLOR_SETS = {
  circle: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤'],
  square: ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫'],
};

export const TOTAL_ROUNDS = 10;

export function buildRound(index) {
  const shapeSet = index % 2 === 0 ? COLOR_SETS.circle : COLOR_SETS.square;
  const [sameColor, diffColor] = shuffle(shapeSet);
  const oddPosition = Math.floor(Math.random() * 4);
  const tiles = Array.from({ length: 4 }, (_, i) => ({
    id: i,
    emoji: i === oddPosition ? diffColor : sameColor,
    isOdd: i === oddPosition,
  }));
  return { tiles };
}
