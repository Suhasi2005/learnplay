// Little Learners design tokens.
//
// Lifted directly from Little Learners.dc.html rather than eyeballed — every
// hex, radius and type size below appears in that file. This is the app's
// visual system now; the older `colors`/`shell` sets in theme.js belong to
// screens not yet migrated.

export const ll = {
  // Ink. #2E2A63 is the single most-used colour in the design (46 uses) and
  // carries every heading.
  ink: '#2E2A63',
  inkDeep: '#3B3675',
  body: '#8B86B8',
  muted: '#9A93C7',
  soft: '#847FB3',
  faint: '#7E7AAE',

  // Pink is the primary action and the brand's warmth.
  pink: '#F4699A',
  pinkLight: '#FF93B9',
  pinkDeep: '#D9558B',
  pinkSoft: '#FFE3EE',
  pinkTint: '#FFEBF3',

  // Blue carries "continue"/secondary actions and Buddy.
  blue: '#4B7BE0',
  blueLight: '#6E9BF0',
  blueDeep: '#3E6FD6',
  blueInk: '#3E5C9A',
  blueSoft: '#E8F0FF',
  blueTint: '#EEF4FF',

  // Purple is progression — levels, XP, "enter the world".
  purple: '#9169EA',
  purpleLight: '#B197F5',
  purpleDeep: '#7A5FD0',
  purpleMid: '#9B7BF0',
  purpleSoft: '#EDE6FF',
  purpleTint: '#F3EFFC',
  lilac: '#E2DAF6',

  // Green is correctness only. Never decoration.
  green: '#4FAE7B',
  greenLight: '#8ED9A8',
  greenDeep: '#3F9A6C',

  // Amber is stars, badges and Birdie.
  amber: '#FFC844',
  amberWarm: '#FFD166',
  amberSoft: '#FFF6E3',
  amberInk: '#96702B',
  clay: '#C05A2E',

  white: '#FFFFFF',
  cream: '#FFF7EE',
  track: '#F0ECFB',
};

// Screen grounds. The design gives almost every screen its own gradient;
// these are the exact stops, so a screen never invents its own.
export const llGradients = {
  onb1: ['#E9E0FF', '#F3E9FF', '#FFF1E4', '#FFF7EE'],
  onb2: ['#E7EEFF', '#F1EAFF', '#FFF2F7'],
  onb3: ['#FFF0E6', '#F4ECFF', '#EAF1FF'],
  home: ['#E9E1FF', '#EFEAFF', '#F6F1FF', '#FFF6EF'],
  game: ['#DCE9FF', '#EDE6FF', '#FFF0F5'],
  reward: ['#F3E7FF', '#EDE9FF', '#FFEFF6'],
  sheet: ['#FFECF6', '#E8F0FF'],
  screen: ['#F3EFFC', '#EDE9F9', '#FBF3E9'],
};

// Button fills are all vertical two-stop gradients with an inset bottom edge.
export const llButtons = {
  pink: { from: '#FF93B9', to: '#F4699A', glow: 'rgba(244,105,154,.4)' },
  blue: { from: '#6E9BF0', to: '#4B7BE0', glow: 'rgba(75,123,224,.36)' },
  purple: { from: '#B197F5', to: '#9169EA', glow: 'rgba(145,105,234,.36)' },
  green: { from: '#8ED9A8', to: '#4FAE7B', glow: 'rgba(79,174,123,.36)' },
};

export const llRadius = {
  sm: 13, md: 20, lg: 22, xl: 26, xxl: 30, sheet: 38, screen: 44, pill: 999,
};

export const llSpace = { xs: 4, sm: 8, md: 13, lg: 18, xl: 22, xxl: 30 };

// Baloo 2 for display, Nunito for everything else — the design never mixes
// them the other way round.
export const llFonts = {
  display: 'Baloo2_800ExtraBold',
  displaySemi: 'Baloo2_600SemiBold',
  body: 'Nunito_700Bold',
  bodyBlack: 'Nunito_800ExtraBold',
  bodyMid: 'Nunito_600SemiBold',
};

export const llType = {
  h1: { fontFamily: llFonts.display, fontSize: 33, lineHeight: 36 },
  h2: { fontFamily: llFonts.display, fontSize: 29, lineHeight: 33 },
  h3: { fontFamily: llFonts.display, fontSize: 25, lineHeight: 28 },
  h4: { fontFamily: llFonts.display, fontSize: 22, lineHeight: 26 },
  cardTitle: { fontFamily: llFonts.display, fontSize: 18, lineHeight: 22 },
  button: { fontFamily: llFonts.display, fontSize: 18 },
  body: { fontFamily: llFonts.body, fontSize: 14, lineHeight: 21 },
  small: { fontFamily: llFonts.body, fontSize: 12.5, lineHeight: 18 },
  tiny: { fontFamily: llFonts.bodyBlack, fontSize: 11 },
  // Uppercase eyebrows always carry letter-spacing in the design.
  eyebrow: { fontFamily: llFonts.bodyBlack, fontSize: 10, letterSpacing: 1.6 },
};

// Shadows are purple-tinted throughout — never neutral grey.
export const llShadow = {
  card: {
    shadowColor: '#6054BE', shadowOpacity: 0.14, shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 }, elevation: 4,
  },
  soft: {
    shadowColor: '#6054BE', shadowOpacity: 0.1, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 3,
  },
  lift: {
    shadowColor: '#6054BE', shadowOpacity: 0.2, shadowRadius: 34,
    shadowOffset: { width: 0, height: 18 }, elevation: 8,
  },
  sheet: {
    shadowColor: '#6054BE', shadowOpacity: 0.24, shadowRadius: 44,
    shadowOffset: { width: 0, height: -18 }, elevation: 16,
  },
};
