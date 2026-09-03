import { shuffle } from './utils';

export const ACTIONS = [
  { id: 'stop', label: 'STOP', emoji: '✋' },
  { id: 'wait', label: 'WAIT', emoji: '⏳' },
  { id: 'go', label: 'GO', emoji: '🚶' },
];

const LIGHTS = [
  { light: 'red', emoji: '🔴', correctAction: 'stop' },
  { light: 'green', emoji: '🟢', correctAction: 'go' },
  { light: 'yellow', emoji: '🟡', correctAction: 'wait' },
];

// 3 rounds of each light, shuffled once so the order isn't predictable but
// is still fixed for the whole session (built once, not re-shuffled per
// render, or the round list would change under the player's feet).
export const ROUNDS = shuffle([...LIGHTS, ...LIGHTS, ...LIGHTS]);
