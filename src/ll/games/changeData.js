import { shuffle } from '../../utils';

// Money at the school shop, three ways: add two prices, work out change
// from a note, and decide whether the wallet is enough. The change rounds
// always offer the item's price as a wrong answer — handing back the price
// instead of the difference is the mistake children actually make.
const ROUNDS = [
  { kind: 'total', items: [['🍭', 'lollipop', 3], ['🧃', 'juice', 5]] },
  { kind: 'change', item: ['🍌', 'bananas', 7], paid: 10 },
  { kind: 'afford', item: ['🧸', 'teddy', 12], wallet: 10 },
  { kind: 'total', items: [['✏️', 'pencil', 4], ['📒', 'notebook', 9]] },
  { kind: 'change', item: ['🍦', 'ice cream', 15], paid: 20 },
  { kind: 'afford', item: ['🎈', 'balloon', 6], wallet: 20 },
  { kind: 'change', item: ['🥤', 'milkshake', 12], paid: 20 },
  { kind: 'total', items: [['🍪', 'cookies', 6], ['🍎', 'apple', 7]] },
  { kind: 'afford', item: ['🍫', 'chocolate', 8], wallet: 5 },
  { kind: 'change', item: ['📕', 'storybook', 35], paid: 50 },
];

export const TOTAL_ROUNDS = ROUNDS.length;

const toItem = ([emoji, label, price]) => ({ emoji, label, price });

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];

  if (r.kind === 'total') {
    const items = r.items.map(toItem);
    const answer = items[0].price + items[1].price;
    return { kind: 'total', items, answer, options: shuffle([answer, answer + 1, answer - 1]) };
  }

  if (r.kind === 'change') {
    const item = toItem(r.item);
    const answer = r.paid - item.price;
    const wrong = [item.price, ...shuffle([answer + 1, answer - 1])].filter((n) => n > 0 && n !== answer).slice(0, 2);
    return { kind: 'change', item, paid: r.paid, answer, options: shuffle([answer, ...wrong]) };
  }

  const item = toItem(r.item);
  return { kind: 'afford', item, wallet: r.wallet, answer: r.wallet >= item.price ? 'Yes' : 'No', options: ['Yes', 'No'] };
}
