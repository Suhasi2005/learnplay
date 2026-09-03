const OBJECTS = ['🐘', '🐭', '🌳', '🌱', '🏠', '🚗', '☂️', '🍇', '🎈', '🐜'];

export const TOTAL_ROUNDS = OBJECTS.length;

export function buildRound(index) {
  const emoji = OBJECTS[index];
  const askBigger = index % 2 === 0; // alternate the question so it's not always "bigger"
  const leftIsBigger = Math.random() < 0.5;
  return { emoji, askBigger, leftIsBigger };
}
