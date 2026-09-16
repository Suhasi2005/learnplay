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

// ---------------------------------------------------------------------------
// PREMIUM LAYER (additive — nothing above is changed or removed)
//
// The CSS pass these come from stacks several shadows on one element:
//
//   box-shadow: 0 1px 2px rgba(46,42,99,.07),      <- contact
//               0 16px 30px rgba(96,84,190,.16),   <- cast
//               inset 0 1px 0 #fff,                <- top highlight
//               inset 0 0 0 1px rgba(...,.10);     <- inner ring
//
// React Native gives one shadow per View, so the stack is split into parts
// that compose: `contact` and `cast` go on two nested Views (see
// PremiumSurface in premium.js), while `highlight` and `ring` are border and
// overlay styles that need no shadow at all. Every part is usable on its own —
// a single `...llElevation.cast` on an existing card is already an upgrade.
// ---------------------------------------------------------------------------

// The tight dark shadow directly under an object. This is what makes a
// surface read as *resting on* the screen rather than floating above it; it
// is the single most missed ingredient in the flat version.
export const llElevation = {
  contact: {
    shadowColor: '#2E2A63', shadowOpacity: 0.1, shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  // Mid-distance ambient occlusion. Sits between contact and cast.
  ambient: {
    shadowColor: '#6054BE', shadowOpacity: 0.14, shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 }, elevation: 3,
  },
  // The soft far shadow — the halo that gives the pastel ground its depth.
  cast: {
    shadowColor: '#6054BE', shadowOpacity: 0.16, shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 }, elevation: 6,
  },
  // Big hero surfaces: game stages, reward cards, the device bezel.
  castDeep: {
    shadowColor: '#5442A8', shadowOpacity: 0.3, shadowRadius: 60,
    shadowOffset: { width: 0, height: 34 }, elevation: 14,
  },
  // A coloured cast for tinted objects (a green correct tile, a pink CTA).
  // Pass any rgba/hex; opacity rides on the colour where the platform allows.
  tinted(color, { opacity = 0.42, radius = 24, height = 14, elevation = 7 } = {}) {
    return {
      shadowColor: color, shadowOpacity: opacity, shadowRadius: radius,
      shadowOffset: { width: 0, height: height }, elevation,
    };
  },
};

// Hairline inner ring. RN has no inset box-shadow, so the ring is a real
// border — hairline width keeps it from reading as a drawn outline. Always
// translucent white over a light surface, never a grey stroke.
export const llRing = {
  // 1px of white inside the edge: the "wet" look on glass and gradient tiles.
  light: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.62)' },
  // A faint purple containment line for white cards on a pastel ground.
  faint: { borderWidth: 1, borderColor: 'rgba(126,110,200,0.1)' },
  // Subject-tinted ring, for cards that belong to a coloured world.
  tinted(color, opacity = 0.12) {
    return { borderWidth: 1, borderColor: withAlpha(color, opacity) };
  },
};

// Surface fills. Every "white" card in the premium pass is actually a very
// short vertical gradient — pure #FFF at the top edge catching the light,
// settling into a tinted white. Feed these straight to <LinearGradient>.
export const llSurface = {
  white: ['#FFFFFF', '#FBF8FF'],
  whitePink: ['#FFFFFF', '#FFF8FB'],
  whiteBlue: ['#FFFFFF', '#F7FAFF'],
  whiteAmber: ['#FFFBF0', '#FFF2DC'],
  // Chrome surfaces: icon buttons, hint chips.
  chrome: ['#FFFFFF', '#F8F5FF'],
  // The warm multi-stop device bezel from the prototype frames.
  bezel: ['#FFFFFF', '#F0EAFF', '#FFE9F2'],
  // Translucent glass, for overlays above a busy stage.
  glass: ['rgba(255,255,255,0.86)', 'rgba(255,255,255,0.68)'],
};

// Gloss overlays. A top-down white-to-transparent wash that sits *above* a
// coloured fill and below its content — what makes the saturated zone tiles
// and beads look moulded rather than printed.
export const llSheen = {
  // Standard tile gloss: bright top, clear middle, faint dark bottom lip.
  tile: {
    colors: ['rgba(255,255,255,0.34)', 'rgba(255,255,255,0.04)', 'rgba(20,10,60,0.1)'],
    locations: [0, 0.52, 1],
  },
  // Stronger, for large solid-colour surfaces.
  strong: {
    colors: ['rgba(255,255,255,0.46)', 'rgba(255,255,255,0.06)', 'rgba(20,10,60,0.14)'],
    locations: [0, 0.48, 1],
  },
  // A recessed trough — dark at the top edge, for insides of tracks and belts.
  trough: {
    colors: ['rgba(48,30,104,0.26)', 'rgba(48,30,104,0)', 'rgba(48,30,104,0.14)'],
    locations: [0, 0.44, 1],
  },
  // Specular highlight for spheres (beads, coins, bubbles). Radial in CSS;
  // in RN it is a small soft ellipse positioned at the object's top-left.
  specular: ['rgba(255,255,255,0.72)', 'rgba(255,255,255,0)'],
};

// rgba() from a hex + alpha. Small helper so tinted rings and glows can be
// derived from the palette instead of hand-written rgba strings.
export function withAlpha(hex, alpha = 1) {
  const h = String(hex).replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
