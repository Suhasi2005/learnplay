import Svg, { Circle, Defs, Ellipse, G, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';
import { GROUND, MAT } from './palette';

// Beads.
//
// The one object in the app that is genuinely parametric: Bead Necklace
// drives colour from the pattern data, so a fixed set of drawn beads would
// be wrong. Instead this exports a component that takes a colour and builds
// the three-tone shading from it, which keeps every bead in the app lit the
// same way no matter what colour the pattern asks for.
//
// Shape carries meaning too. A pattern of red-blue-red-blue is a colour
// pattern; giving the child round/cube/gem variants means the same engine
// can later teach shape patterns with no new art. Round is the default and
// the only one the current data uses.

// Darken / lighten a hex without needing a colour library.
function shade(hex, amount) {
  const h = String(hex).replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const out = amount > 0 ? v + (255 - v) * amount : v * (1 + amount);
    return Math.max(0, Math.min(255, Math.round(out)));
  });
  return `rgb(${ch[0]},${ch[1]},${ch[2]})`;
}

// A single bead. `threaded` draws the string hole, which is what makes it a
// bead rather than a marble — and the hole is why a bead can sit ON a line.
export function Bead({ color = '#F05A5A', shape = 'round', threaded = true }) {
  const lit = shade(color, 0.45);
  const dark = shade(color, -0.32);
  const deepest = shade(color, -0.5);

  if (shape === 'cube') {
    return (
      <Svg viewBox="0 0 100 100">
        <Ellipse cx="50" cy="90" rx="26" ry="5" fill={GROUND} />
        <Polygon points="18,36 50,20 82,36 50,52" fill={lit} />
        <Polygon points="18,36 50,52 50,86 18,70" fill={color} />
        <Polygon points="82,36 50,52 50,86 82,70" fill={dark} />
        {threaded ? <Circle cx="50" cy="36" r="7" fill={deepest} /> : null}
        <Path d="M22 38 L48 24" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
      </Svg>
    );
  }

  if (shape === 'gem') {
    return (
      <Svg viewBox="0 0 100 100">
        <Ellipse cx="50" cy="90" rx="24" ry="5" fill={GROUND} />
        <Polygon points="50,10 84,40 50,90 16,40" fill={color} />
        <Polygon points="50,10 84,40 50,40" fill={lit} />
        <Polygon points="50,40 84,40 50,90" fill={dark} />
        <Polygon points="16,40 50,40 50,90" fill={color} />
        <Polygon points="50,10 16,40 50,40" fill={shade(color, 0.6)} />
        {threaded ? <Circle cx="50" cy="22" r="5" fill={deepest} opacity="0.7" /> : null}
      </Svg>
    );
  }

  // Round — a glass sphere with a rim light, a core shadow and a hole.
  return (
    <Svg viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="beadBody" cx="35%" cy="30%" r="75%">
          <Stop offset="0%" stopColor={lit} />
          <Stop offset="55%" stopColor={color} />
          <Stop offset="100%" stopColor={dark} />
        </RadialGradient>
      </Defs>
      <Ellipse cx="50" cy="90" rx="28" ry="5" fill={GROUND} />
      <Circle cx="50" cy="50" r="40" fill="url(#beadBody)" />
      {/* Rim light along the lower-right — the cue that says "sphere". */}
      <Path d="M50 90 a40 40 0 0 0 38 -28" stroke={shade(color, 0.3)} strokeWidth="5" fill="none" opacity="0.5" strokeLinecap="round" />
      {/* The string hole, recessed. */}
      {threaded ? (
        <G>
          <Ellipse cx="50" cy="50" rx="9" ry="7" fill={deepest} />
          <Ellipse cx="50" cy="48" rx="9" ry="5" fill="rgba(0,0,0,0.28)" />
        </G>
      ) : null}
      {/* Specular: one hard, one soft. Always top-left. */}
      <Ellipse cx="33" cy="30" rx="12" ry="9" fill="rgba(255,255,255,0.75)" transform="rotate(-30 33 30)" />
      <Ellipse cx="28" cy="42" rx="5" ry="3" fill="rgba(255,255,255,0.4)" transform="rotate(-30 28 42)" />
    </Svg>
  );
}

// A clasp for the ends of the necklace string.
export function Clasp() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="88" rx="16" ry="4" fill={GROUND} />
      <Rect x="34" y="30" width="32" height="40" rx="12" fill={MAT.gold.base} />
      <Rect x="34" y="30" width="12" height="40" rx="6" fill={MAT.gold.lit} opacity="0.8" />
      <Circle cx="50" cy="50" r="7" fill={MAT.gold.dark} />
    </Svg>
  );
}
