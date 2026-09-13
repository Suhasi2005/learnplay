import { shuffle } from '../../utils';

// Four lanes — road, rail, water, sky — and vehicles that race along them.
//
// Rounds alternate direction so this isn't one more three-way sort:
//   vehicle rounds show a vehicle and ask which lane it travels in;
//   lane rounds light up a lane with a journey and ask which vehicle can
//   make it. Either way the right answer ends with the vehicle zooming
//   down its lane.
export const LANES = [
  { id: 'road', label: 'Road', emoji: '🛣️', bg: '#FFE9C9', ink: '#96702B' },
  { id: 'rail', label: 'Rail', emoji: '🛤️', bg: '#EDE6FF', ink: '#7A5FD0' },
  { id: 'water', label: 'Water', emoji: '🌊', bg: '#DDEBFF', ink: '#3E6FD6' },
  { id: 'sky', label: 'Sky', emoji: '☁️', bg: '#E4F6FF', ink: '#3E5C9A' },
];

export const VEHICLES = [
  { id: 'car', label: 'car', emoji: '🚗', lane: 'road' },
  { id: 'bus', label: 'bus', emoji: '🚌', lane: 'road' },
  { id: 'bicycle', label: 'bicycle', emoji: '🚲', lane: 'road' },
  { id: 'train', label: 'train', emoji: '🚆', lane: 'rail' },
  { id: 'engine', label: 'steam engine', emoji: '🚂', lane: 'rail' },
  { id: 'tram', label: 'tram', emoji: '🚋', lane: 'rail' },
  { id: 'boat', label: 'boat', emoji: '⛵', lane: 'water' },
  { id: 'ship', label: 'ship', emoji: '🚢', lane: 'water' },
  { id: 'ferry', label: 'ferry', emoji: '⛴️', lane: 'water' },
  { id: 'plane', label: 'aeroplane', emoji: '✈️', lane: 'sky' },
  { id: 'helicopter', label: 'helicopter', emoji: '🚁', lane: 'sky' },
];

const ROUNDS = [
  { kind: 'vehicle', vehicle: 'bus' },
  { kind: 'lane', lane: 'water', journey: 'cross the big sea' },
  { kind: 'vehicle', vehicle: 'helicopter' },
  { kind: 'lane', lane: 'rail', journey: 'ride along the tracks' },
  { kind: 'vehicle', vehicle: 'ship' },
  { kind: 'lane', lane: 'sky', journey: 'fly over the mountains' },
  { kind: 'vehicle', vehicle: 'engine' },
  { kind: 'lane', lane: 'road', journey: 'drive to the market' },
];

export const TOTAL_ROUNDS = ROUNDS.length;

export function buildRound(index) {
  const r = ROUNDS[index % ROUNDS.length];

  if (r.kind === 'vehicle') {
    const vehicle = VEHICLES.find((v) => v.id === r.vehicle);
    return { kind: 'vehicle', lane: vehicle.lane, vehicle };
  }

  const pickFrom = (laneId) => shuffle(VEHICLES.filter((v) => v.lane === laneId))[0];
  // Distractors come from two *different* wrong lanes, so no two options
  // could both be defended.
  const wrongLanes = shuffle(LANES.filter((l) => l.id !== r.lane)).slice(0, 2);
  const options = shuffle([pickFrom(r.lane), ...wrongLanes.map((l) => pickFrom(l.id))]);
  return { kind: 'lane', lane: r.lane, journey: r.journey, options };
}
