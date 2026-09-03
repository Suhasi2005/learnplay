// LearnPlay design system — "Star Meadow".
//
// One brand hue (grape) carries identity and every primary action. The four
// accents are assigned by MEANING, not decoration: a subject keeps its colour
// everywhere it appears, so a child learns "green = World Around Us" without
// being told. Each hue has a soft/base/deep ramp — soft for surfaces, base for
// fills, deep for the pressed edge underneath a button and for text on soft.
//
// Every token name here predates the visual refresh and is still referenced by
// the 19 game screens, so changing values (not names) restyles the whole app.

const ramp = {
  grape: { soft: '#EFE9FF', base: '#7C5CE6', deep: '#5B3FD1' },
  coral: { soft: '#FFE8E4', base: '#FF7A6B', deep: '#E2543F' },
  sun: { soft: '#FFF2D4', base: '#FFC23C', deep: '#E09600' },
  grass: { soft: '#DEF7EC', base: '#45D9A0', deep: '#1FA877' },
  sky: { soft: '#E2F1FD', base: '#5BB8F5', deep: '#2589D6' },
};

export const colors = {
  // Brand + accents (existing names — the games depend on these).
  grape: ramp.grape.base,
  grapeDeep: ramp.grape.deep,
  coral: ramp.coral.base,
  coralDeep: ramp.coral.deep,
  sun: ramp.sun.base,
  sunDeep: ramp.sun.deep,
  grass: ramp.grass.base,
  grassDeep: ramp.grass.deep,
  sky: ramp.sky.base,
  skyDeep: ramp.sky.deep,

  // Soft tints — surfaces and haloes that carry a hue without shouting.
  grapeSoft: ramp.grape.soft,
  coralSoft: ramp.coral.soft,
  sunSoft: ramp.sun.soft,
  grassSoft: ramp.grass.soft,
  skySoft: ramp.sky.soft,

  // Neutrals. `ink` is a deep indigo rather than a true black so it sits in
  // the same world as the brand hue instead of punching a hole in it.
  ink: '#2E2A4A',
  inkSoft: '#4A4470',
  // Darkened from the first draft: the original #7B7694 measured 3.81:1 on the
  // lightest ground, under the 4.5:1 AA floor for secondary text. This is 5.11:1.
  muted: '#67627E',
  cream: '#FFF9F0',
  white: '#FFFFFF',
  border: '#EBE4F5',
  disabled: '#E4DFEE',
  lock: '#B9B2CE',
};

// Subject identity, keyed by the curriculum's subject ID (not its display
// label — EVS shows as "World Around Us"). A subject keeps its colour on the
// map, the level list and the reward screen, so the association is learnable.
export const subjectTheme = {
  English: { ...ramp.coral, emoji: '🔤', label: 'English' },
  Math: { ...ramp.sky, emoji: '🔢', label: 'Math' },
  EVS: { ...ramp.grass, emoji: '🌎', label: 'World Around Us' },
};

// A rotating palette so choice cards feel varied and playful, not uniform.
//
// Grape is deliberately NOT in here. It's the brand hue, reserved for primary
// actions, and it's the one accent dark enough that ink text fails on it
// (2.93:1 — under the 3:1 floor); everything below clears 5.3:1 with ink.
// Keeping it out fixes the contrast bug and the "what is this colour for?"
// question in one move.
export const cardPalette = [
  { bg: colors.sun, deep: colors.sunDeep, soft: colors.sunSoft },
  { bg: colors.coral, deep: colors.coralDeep, soft: colors.coralSoft },
  { bg: colors.grass, deep: colors.grassDeep, soft: colors.grassSoft },
  { bg: colors.sky, deep: colors.skyDeep, soft: colors.skySoft },
];

// Lavender drifting into warm cream — a sky that belongs to a meadow world,
// and light enough that dark text stays readable anywhere on top of it.
export const bgGradient = ['#F4EEFF', '#FFF6EC'];
// Hero gradient for full-bleed screens that carry white text. Both endpoints
// clear 4.5:1 against white (5.85:1 and 4.66:1), so the title stays legible
// across the whole sweep without leaning on a text shadow to rescue it.
export const skyGradient = ['#6A4BD6', '#2478BE'];
export const sunsetGradient = ['#E2543F', '#E09600'];

export const spacing = { xs: 6, sm: 12, md: 20, lg: 28, xl: 40, xxl: 56 };
export const radius = { sm: 12, md: 20, lg: 28, xl: 36, pill: 999 };

export const fonts = {
  display: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  body: 'Baloo2_500Medium',
  bodyBold: 'Baloo2_700Bold',
};

export const type = {
  hero: { fontFamily: fonts.displayBold, fontSize: 42, lineHeight: 48 },
  title: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 34 },
  heading: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 28 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 18 },
  // Uppercase eyebrows get letter-spacing; at this size it reads as
  // deliberate rather than cramped.
  eyebrow: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.1 },
  numeral: { fontFamily: fonts.displayBold, fontSize: 34 },
};

// Shadows are tinted with the ink hue rather than pure black — black shadows
// on warm surfaces read as grey smudge, tinted ones read as depth.
export const shadow = {
  sm: {
    shadowColor: '#2E2A4A', shadowOpacity: 0.1, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  md: {
    shadowColor: '#2E2A4A', shadowOpacity: 0.14, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  lg: {
    shadowColor: '#2E2A4A', shadowOpacity: 0.18, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
};

// How far a chunky button sinks when pressed. The button's resting state
// exposes this much of its darker base; pressing hides it, so the control
// physically compresses instead of just changing colour.
export const PRESS_DEPTH = 6;
