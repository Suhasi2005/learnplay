import { shuffle } from '../../utils';

// "Our House": which room things belong in. "Place" rounds hand the child
// an object to send to its room; "misfit" rounds show a room with one thing
// that doesn't belong — spot it, then send it where it goes. The house
// fills up across the game, so by the end every room is furnished.
export const ROOMS = [
  { id: 'kitchen', label: 'Kitchen', emoji: '🍴', bg: '#FFE9C9' },
  { id: 'bedroom', label: 'Bedroom', emoji: '🌙', bg: '#EDE6FF' },
  { id: 'bathroom', label: 'Bathroom', emoji: '🚿', bg: '#DDEBFF' },
  { id: 'living', label: 'Living room', emoji: '🏠', bg: '#E3F5EA' },
];

export const ITEMS = {
  pan: { emoji: '🍳', label: 'frying pan', room: 'kitchen' },
  teapot: { emoji: '🫖', label: 'teapot', room: 'kitchen' },
  spoon: { emoji: '🥄', label: 'spoon', room: 'kitchen' },
  plate: { emoji: '🍽️', label: 'plate', room: 'kitchen' },
  bed: { emoji: '🛏️', label: 'bed', room: 'bedroom' },
  alarm: { emoji: '⏰', label: 'alarm clock', room: 'bedroom' },
  teddy: { emoji: '🧸', label: 'teddy bear', room: 'bedroom' },
  bathtub: { emoji: '🛁', label: 'bathtub', room: 'bathroom' },
  toothbrush: { emoji: '🪥', label: 'toothbrush', room: 'bathroom' },
  soap: { emoji: '🧼', label: 'soap', room: 'bathroom' },
  toilet: { emoji: '🚽', label: 'toilet', room: 'bathroom' },
  sofa: { emoji: '🛋️', label: 'sofa', room: 'living' },
  tv: { emoji: '📺', label: 'TV', room: 'living' },
  plant: { emoji: '🪴', label: 'plant pot', room: 'living' },
};

const ROUNDS = [
  { kind: 'place', item: 'toothbrush' },
  { kind: 'place', item: 'pan' },
  { kind: 'misfit', room: 'kitchen', misfit: 'soap' },
  { kind: 'place', item: 'tv' },
  { kind: 'place', item: 'bed' },
  { kind: 'misfit', room: 'bathroom', misfit: 'teddy' },
  { kind: 'place', item: 'teapot' },
  { kind: 'place', item: 'alarm' },
  { kind: 'misfit', room: 'living', misfit: 'toilet' },
  { kind: 'place', item: 'soap' },
];

export const TOTAL_ROUNDS = ROUNDS.length;

const item = (id) => ({ id, ...ITEMS[id] });

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];
  if (r.kind === 'place') return { kind: 'place', item: item(r.item) };

  const natives = shuffle(Object.keys(ITEMS).filter((id) => ITEMS[id].room === r.room)).slice(0, 3);
  return {
    kind: 'misfit',
    room: ROOMS.find((rm) => rm.id === r.room),
    item: item(r.misfit),
    lineup: shuffle([...natives, r.misfit]).map(item),
  };
}
