// LearnPlay design system — "Sticker Book".
//
// Modelled on the reference set: saturated primaries, thick dark outlines and
// a hard bottom edge on every surface, so controls read as chunky physical
// stickers rather than flat rectangles. The earlier pastel palette was pretty
// but quiet; these hues carry at arm's length on a cheap tablet in daylight,
// which is where this app actually gets used.
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
  grape: { soft: '#EDE6FF', base: '#7B4FE0', deep: '#5326B8' },
  coral: { soft: '#FFE3DE', base: '#FF6B5A', deep: '#D63B29' },
  sun: { soft: '#FFF0C9', base: '#FFC42B', deep: '#D18E00' },
  grass: { soft: '#D8F7DF', base: '#3FCE6E', deep: '#1E9B4A' },
  sky: { soft: '#DCF0FE', base: '#33B5F5', deep: '#0A7CBF' },
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
  border: '#E7DFF2',
  disabled: '#E2DCEC',
  lock: '#B0A8C6',

  // The outline that makes a surface read as a sticker. Every card, button and
  // badge is drawn with it, which is what holds a saturated palette together —
  // without a shared outline, five bright fills next to each other just look
  // noisy. Slightly softer than `ink` so it frames rather than cages.
  outline: '#3B3560',
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

// A warm paper ground for the stickers to sit on. Deliberately low-chroma:
// the saturated cards carry the colour, and a busy backdrop under them turns
// the screen to mush.
export const bgGradient = ['#FFF6E4', '#FFEFDA'];
// Hero gradient for full-bleed screens that carry white text. Both endpoints
// clear 4.5:1 against white, so the title stays legible across the whole
// sweep without leaning on a text shadow to rescue it.
// #1E7FC4 was the first pick for the blue end but measured 4.30:1 against
// white — just under the AA floor. This is 4.85:1.
export const skyGradient = ['#6231C9', '#1B76B8'];
export const sunsetGradient = ['#D63B29', '#D18E00'];

export const spacing = { xs: 6, sm: 12, md: 20, lg: 28, xl: 40, xxl: 56 };
export const radius = { sm: 12, md: 20, lg: 28, xl: 36, pill: 999 };

// The sticker outline, applied as a real border. 3px reads as deliberate at
// phone density; 2px disappears and 4px starts to look like a colouring book.
export const OUTLINE_WIDTH = 3;
export const outlined = {
  borderWidth: OUTLINE_WIDTH,
  borderColor: colors.outline,
};

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

// ---------------------------------------------------------------------------
// SHELL — the app around the games.
//
// A deliberate second register. The shell is where a child browses and a
// parent looks over their shoulder: calm, light, unhurried. The games keep
// the saturated sticker palette above, because that's where the noise belongs.
//
// This is a separate token set rather than a replacement so the two can't
// bleed into each other: a game screen importing `colors` cannot accidentally
// go pastel, and a shell screen importing `shell` cannot go loud.
export const shell = {
  // Grounds
  bg: '#F4F1FB',
  bgDeep: '#EBE5F7',
  surface: '#FFFFFF',
  // Tinted card fills, alternated so a list of cards has rhythm.
  tintLavender: '#EDE7FA',
  tintPeach: '#FCEDE4',
  tintMint: '#E4F5EE',

  // Brand
  primary: '#7B5CE6',
  primaryDeep: '#5F3FCB',
  primarySoft: '#E9E2FB',

  // The warm counterweight. Every primary call-to-action is peach, which is
  // what stops a violet app reading as cold.
  //
  // Peach ALWAYS takes ink text, never white: white on it measures 2.05:1,
  // far under the 4.5:1 floor, while ink measures 8.15:1. This is the one
  // rule of this palette that's easy to break by habit — a filled button
  // "wants" white text — so it's written down rather than remembered.
  accent: '#F0A473',
  accentDeep: '#D68252',
  accentSoft: '#FCEDE4',
  onAccent: '#1E1B33',

  // Ink. Near-black with a violet cast so it belongs to the same family as
  // the brand rather than sitting on top of it as neutral grey.
  ink: '#1E1B33',
  inkMuted: '#615C7A',
  line: '#E6E0F2',
  // Darkened from #A9A2BF, which measured 2.19:1 on the lavender ground —
  // under the 3:1 floor for meaningful non-text UI, so lock icons and
  // disabled states were fading into the background.
  lock: '#8F87A9',
  white: '#FFFFFF',
};

// Softer and larger than the game radii — the shell is rounded rectangles and
// pills, not stickers.
export const shellRadius = { sm: 14, md: 20, lg: 26, xl: 32, pill: 999 };

// Shadows here are wide and faint. A hard sticker edge would fight the calm.
export const shellShadow = {
  card: {
    shadowColor: '#2A2145', shadowOpacity: 0.07, shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }, elevation: 3,
  },
  raised: {
    shadowColor: '#2A2145', shadowOpacity: 0.12, shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 }, elevation: 7,
  },
  nav: {
    shadowColor: '#1E1B33', shadowOpacity: 0.28, shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },
};

export const shellType = {
  display: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 36 },
  title: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 27 },
  cardTitle: { fontFamily: fonts.displayBold, fontSize: 16.5, lineHeight: 21 },
  body: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 18.5 },
  small: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 15 },
  label: { fontFamily: fonts.bodyBold, fontSize: 12.5 },
};

// Derives the shadow-side colour sitting under a tactile surface.
//
// Every card in the app gets its base shade from this rather than from a
// hand-picked pair, so a card tinted with any colour — including one a game
// computes at runtime — still gets a correct, consistent base. Mixing toward
// the ink hue rather than toward black keeps the darker edge in the same
// colour world as the rest of the palette; pure black bases look muddy
// against warm fills.
const INK_RGB = [46, 42, 74];

export function shade(color, amount = 0.26) {
  if (typeof color !== 'string') return colors.border;
  let hex = color.trim();
  if (hex[0] !== '#') return colors.border;
  hex = hex.slice(1);
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  if (hex.length !== 6) return colors.border;

  const n = parseInt(hex, 16);
  if (Number.isNaN(n)) return colors.border;

  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const mixed = rgb.map((c, i) => Math.round(c + (INK_RGB[i] - c) * amount));
  return '#' + mixed.map((c) => c.toString(16).padStart(2, '0')).join('');
}
