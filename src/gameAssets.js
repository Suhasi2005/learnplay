// The asset manifest — the one place artwork is registered.
//
// Metro resolves require() at build time, so every path here must exist or the
// bundle fails. That's why placeholder PNGs ship at each path: the app runs
// before any real art exists, and adding art is overwriting a file, never
// editing this file. See ASSETS.md for the exact sizes and prompts.
//
// Only add an entry here when introducing a genuinely NEW slot.

import { colors } from './theme';

export const CHARACTER_POSES = {
  // Resting. Used whenever nothing else applies.
  idle: require('../assets/game/characters/hero-idle.png'),
  // Greeting the child; home screen and between rounds.
  happy: require('../assets/game/characters/hero-happy.png'),
  // Correct answer and reward screens.
  cheer: require('../assets/game/characters/hero-cheer.png'),
  // Waiting for an answer.
  think: require('../assets/game/characters/hero-think.png'),
  // A wrong answer — sympathetic, never scolding.
  oops: require('../assets/game/characters/hero-oops.png'),
  // Directing attention at the next thing to tap.
  point: require('../assets/game/characters/hero-point.png'),
};

// Worlds carry both the artwork and the colour personality that the UI on top
// of them adopts, so a screen tinted for "ocean" can never end up wearing the
// forest's palette.
//
// `scrim` is the darkness (0–1) laid under text on this world. Artwork is
// arbitrary — a bright sky will destroy white text without it — so every world
// declares how much protection its UI needs rather than hoping for the best.
export const WORLDS = {
  home: {
    id: 'home',
    label: 'Home',
    image: require('../assets/game/worlds/home.png'),
    tint: colors.sun,
    deep: colors.sunDeep,
    scrim: 0.18,
    onImage: 'dark',
  },
  forest: {
    id: 'forest',
    label: 'Whispering Woods',
    image: require('../assets/game/worlds/forest.png'),
    tint: colors.grass,
    deep: colors.grassDeep,
    scrim: 0.26,
    onImage: 'light',
  },
  ocean: {
    id: 'ocean',
    label: 'Coral Cove',
    image: require('../assets/game/worlds/ocean.png'),
    tint: colors.sky,
    deep: colors.skyDeep,
    scrim: 0.26,
    onImage: 'light',
  },
  farm: {
    id: 'farm',
    label: 'Sunny Meadow',
    image: require('../assets/game/worlds/farm.png'),
    tint: colors.sun,
    deep: colors.sunDeep,
    scrim: 0.2,
    onImage: 'dark',
  },
  space: {
    id: 'space',
    label: 'Star Harbour',
    image: require('../assets/game/worlds/space.png'),
    tint: colors.grape,
    deep: colors.grapeDeep,
    scrim: 0.34,
    onImage: 'light',
  },
};

export const WORLD_ORDER = ['forest', 'farm', 'ocean', 'space'];

// Which world each grade/subject is set in. Keeping this as data means a world
// can be re-themed without touching a screen.
export const WORLD_BY_SUBJECT = {
  English: 'forest',
  Math: 'space',
  EVS: 'farm',
};

export function worldFor(key) {
  return WORLDS[key] ?? WORLDS.home;
}

export function poseFor(mood) {
  return CHARACTER_POSES[mood] ?? CHARACTER_POSES.idle;
}
