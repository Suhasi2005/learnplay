// Interleaved round/cornered so the category isn't predictable from streak
// position alone (e.g. "first four are always round").
export const SHAPES = [
  { id: 's-circle', emoji: '🔵', label: 'Circle', category: 'round' },
  { id: 's-triangle', emoji: '🔺', label: 'Triangle', category: 'cornered' },
  { id: 's-oval', emoji: '🥚', label: 'Oval', category: 'round' },
  { id: 's-square', emoji: '🟥', label: 'Square', category: 'cornered' },
  { id: 's-ball', emoji: '⚽', label: 'Ball', category: 'round' },
  { id: 's-diamond', emoji: '🔷', label: 'Diamond', category: 'cornered' },
  { id: 's-orange', emoji: '🟠', label: 'Circle', category: 'round' },
  { id: 's-star', emoji: '⭐', label: 'Star', category: 'cornered' },
];

export const BINS = [
  { id: 'round', label: 'Round', emoji: '🔵' },
  { id: 'cornered', label: 'Pointy', emoji: '🔺' },
];
