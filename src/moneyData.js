export const COINS = [
  { value: 1, emoji: '🪙', label: '₹1' },
  { value: 2, emoji: '🟡', label: '₹2' },
  { value: 5, emoji: '🟠', label: '₹5' },
];

// Gently increasing targets, each reachable with the coins above.
export const TARGETS = [2, 3, 5, 4, 6, 7, 10, 8, 12, 15];
export const TOTAL_ROUNDS = TARGETS.length;

export function buildRound(index) {
  return { target: TARGETS[index] };
}
