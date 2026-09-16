// The Little Learners object system.
//
// Games are full of small nameable things — a spoon, a bead, a fox, a coin.
// Emoji were standing in for all of them, which meant the art style changed
// with the child's device font and nothing matched anything else. These are
// the real objects: drawn as SVG, in one style, from one palette.
//
// The rules every object follows, so twenty of them look like a set:
//
//   LIGHT comes from the top-left, always. Highlights go top-left, the
//   occlusion shadow goes bottom-right. Nothing is lit from below.
//   FORM is built from a base fill, one lighter plane and one darker plane —
//   three tones, never a smooth gradient mesh. That's what reads as "soft
//   3D" rather than flat vector or rendered CG.
//   SILHOUETTE is closed and chunky. At 34px on a phone a thin outline
//   disappears; a solid shape with a generous radius survives.
//   PROPORTIONS are friendly — heads and tops oversized, bases stable.
//   NO outlines around the whole object. Edges are separated by tone.
//
// Everything is drawn in a 100×100 viewBox so objects are interchangeable
// and scale from a 20px domino pip to a 90px hero without redrawing.

// Three tones per material: base, lit plane, shadow plane. Picked from the
// app's pastel palette rather than invented, so objects sit inside the same
// world as the cards they're on.
export const MAT = {
  // Metals
  steel: { base: '#C7CEDB', lit: '#EDF1F7', dark: '#97A2B5' },
  gold: { base: '#F2C14E', lit: '#FFE9A8', dark: '#C08F26' },
  // Ceramics and plastics
  cream: { base: '#F6EFE2', lit: '#FFFDF8', dark: '#D9CDB8' },
  white: { base: '#F4F6FB', lit: '#FFFFFF', dark: '#D2D8E6' },
  // Woods
  wood: { base: '#D9A972', lit: '#F0CFA3', dark: '#A97A48' },
  woodDark: { base: '#B4804F', lit: '#D6A877', dark: '#8A5E34' },
  // The palette colours, as materials
  pink: { base: '#F4699A', lit: '#FFA8C4', dark: '#C2436F' },
  blue: { base: '#4B7BE0', lit: '#8FB2F2', dark: '#2F55A8' },
  purple: { base: '#9169EA', lit: '#BFA3F5', dark: '#6743B0' },
  green: { base: '#4FAE7B', lit: '#8BD9AC', dark: '#2F7A54' },
  amber: { base: '#FFC844', lit: '#FFE49A', dark: '#D19A18' },
  red: { base: '#EF6B62', lit: '#FFA69F', dark: '#BC4239' },
  teal: { base: '#4FC3C7', lit: '#95E4E6', dark: '#2E8E92' },
  brown: { base: '#A9784F', lit: '#CFA079', dark: '#7C5535' },
  grey: { base: '#B7B2C9', lit: '#DAD6E6', dark: '#8B86A0' },
  ink: { base: '#3B3675', lit: '#6A63A8', dark: '#282350' },
  sky: { base: '#9CC9F5', lit: '#CCE6FF', dark: '#6E9CD1' },
  leaf: { base: '#6FBF73', lit: '#A6DFA8', dark: '#488A4C' },
  sand: { base: '#E8D4A8', lit: '#F7ECD2', dark: '#C3A874' },
  charcoal: { base: '#5B5570', lit: '#837C9B', dark: '#3C3750' },
};

// The standard soft shadow every object sits on. Drawn first, under
// everything, so objects share a ground plane.
export const GROUND = 'rgba(46,42,99,0.16)';

// Where the specular highlight goes on a round form. Consistent across every
// sphere in the app — beads, balls, coins, fruit.
export const SPEC = 'rgba(255,255,255,0.72)';
