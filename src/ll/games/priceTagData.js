import { shuffle } from '../../utils';

// Reading two-digit numbers off price tags.
//
// Two kinds of round. "Find" names a price aloud and hides it among the
// mistakes children actually make: the digits swapped (47 → 74), the tens
// wrong (47 → 57), the ones off by one (47 → 46). "Most" shows three prices
// that share digits (38, 83, 58), so comparing means reading the tens place
// rather than spotting the bigger-looking number.
const TOYS = ['🧸', '🚂', '🪀', '⚽', '🪁', '🎨', '🧩', '🥁', '🎺', '🛴', '🏀', '🚁'];

const FIND_PRICES = [23, 47, 16, 89, 34, 71, 62];
const MOST_TRIPLES = [[38, 83, 58], [64, 46, 61], [29, 92, 72]];

export const TOTAL_ROUNDS = FIND_PRICES.length + MOST_TRIPLES.length;

function nearMisses(price) {
  const tens = Math.floor(price / 10);
  const ones = price % 10;
  const reversed = ones * 10 + tens;
  const candidates = [
    ones !== 0 && ones !== tens ? reversed : null,
    ...shuffle([price + 10, price - 10, price + 1, price - 1]),
  ];
  const picked = [];
  for (const c of candidates) {
    if (c !== null && c >= 1 && c <= 99 && c !== price && !picked.includes(c)) picked.push(c);
    if (picked.length === 2) break;
  }
  return picked;
}

export function buildRound(index) {
  const toys = shuffle(TOYS).slice(0, 3);
  // Every third round is a "which costs the most" round.
  const isMost = index % 10 === 2 || index % 10 === 5 || index % 10 === 8;

  if (isMost) {
    const triple = MOST_TRIPLES[[2, 5, 8].indexOf(index % 10)];
    const prices = shuffle(triple);
    const answer = Math.max(...prices);
    return { kind: 'most', answer, items: prices.map((price, i) => ({ id: i, toy: toys[i], price })) };
  }

  const findIndex = [0, 1, 3, 4, 6, 7, 9].indexOf(index % 10);
  const answer = FIND_PRICES[findIndex];
  const prices = shuffle([answer, ...nearMisses(answer)]);
  return { kind: 'find', answer, items: prices.map((price, i) => ({ id: i, toy: toys[i], price })) };
}
