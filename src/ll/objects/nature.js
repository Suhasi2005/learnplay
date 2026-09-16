import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';
import { GROUND, MAT, SPEC } from './palette';

// Nature, sky and playthings — the objects Rhyme Train, Story Balloon, Lily
// Pad, Day Order and Animal Riddle draw from.
//
// Same house rules as everyday.js and creatures.js: 100×100 box, light from
// top-left, three tones per material, closed silhouette, no outline.

export function Star() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="24" ry="5" fill={GROUND} />
      {/* A rounded five-point star — sharp points vanish at 30px. */}
      <Path
        d="M50 10 L62 38 L92 42 L70 62 L76 92 L50 77 L24 92 L30 62 L8 42 L38 38 Z"
        fill={MAT.amber.base}
        strokeLinejoin="round"
        stroke={MAT.amber.base}
        strokeWidth="8"
      />
      <Path d="M50 10 L62 38 L50 45 L38 38 Z" fill={MAT.amber.lit} />
      <Path d="M70 62 L76 92 L50 77 L50 60 Z" fill={MAT.amber.dark} opacity="0.45" />
      <Ellipse cx="40" cy="34" rx="7" ry="5" fill={SPEC} opacity="0.6" transform="rotate(-25 40 34)" />
    </Svg>
  );
}

export function Moon() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="52" cy="90" rx="22" ry="4" fill={GROUND} />
      {/* Crescent cut from one circle by another. */}
      <Path d="M64 12 a40 40 0 1 0 22 62 A34 34 0 1 1 64 12 Z" fill={MAT.amber.base} />
      <Path d="M64 12 a40 40 0 0 0 -32 20 a34 34 0 0 1 28 -12 Z" fill={MAT.amber.lit} />
      {/* Craters give it scale. */}
      <Circle cx="36" cy="44" r="6" fill={MAT.amber.dark} opacity="0.35" />
      <Circle cx="30" cy="64" r="4" fill={MAT.amber.dark} opacity="0.3" />
      <Circle cx="48" cy="72" r="3" fill={MAT.amber.dark} opacity="0.25" />
    </Svg>
  );
}

export function Sun() {
  return (
    <Svg viewBox="0 0 100 100">
      {/* Rays as rounded spokes, not triangles. */}
      <G stroke={MAT.amber.base} strokeWidth="7" strokeLinecap="round">
        <Path d="M50 6 L50 18 M50 82 L50 94 M6 50 L18 50 M82 50 L94 50" />
        <Path d="M19 19 L28 28 M72 72 L81 81 M81 19 L72 28 M28 72 L19 81" />
      </G>
      <Circle cx="50" cy="50" r="27" fill={MAT.amber.base} />
      <Path d="M50 23 a27 27 0 0 0 -19 8 a27 27 0 0 1 30 -6 Z" fill={MAT.amber.lit} />
      <Ellipse cx="40" cy="40" rx="9" ry="7" fill={SPEC} opacity="0.55" transform="rotate(-30 40 40)" />
    </Svg>
  );
}

export function Tree() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="92" rx="28" ry="5" fill={GROUND} />
      <Rect x="44" y="60" width="12" height="32" rx="5" fill={MAT.brown.base} />
      <Rect x="44" y="60" width="5" height="32" rx="2.5" fill={MAT.brown.lit} opacity="0.7" />
      {/* Canopy as three overlapping blobs — reads as foliage, not a ball. */}
      <Circle cx="34" cy="46" r="20" fill={MAT.leaf.base} />
      <Circle cx="66" cy="46" r="20" fill={MAT.leaf.base} />
      <Circle cx="50" cy="30" r="23" fill={MAT.leaf.base} />
      <Path d="M50 7 a23 23 0 0 0 -20 12 q14 -8 26 -4 Z" fill={MAT.leaf.lit} />
      <Circle cx="66" cy="46" r="20" fill={MAT.leaf.dark} opacity="0.28" />
    </Svg>
  );
}

export function Car() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="86" rx="38" ry="5" fill={GROUND} />
      {/* Cabin, then body — a rounded hatchback silhouette. */}
      <Path d="M28 50 L36 32 Q38 27 44 27 L62 27 Q68 27 71 32 L80 50 Z" fill={MAT.red.lit} />
      <Path d="M40 32 L34 48 L50 48 L50 32 Z" fill={MAT.sky.lit} />
      <Path d="M56 32 L56 48 L74 48 L66 32 Z" fill={MAT.sky.lit} opacity="0.85" />
      <Path d="M10 62 Q10 48 26 48 L82 48 Q92 48 92 60 L92 70 Q92 76 86 76 L16 76 Q10 76 10 70 Z" fill={MAT.red.base} />
      <Path d="M10 62 Q10 48 26 48 L40 48 L34 76 L16 76 Q10 76 10 70 Z" fill={MAT.red.lit} opacity="0.5" />
      {/* Lights. */}
      <Circle cx="88" cy="60" r="5" fill={MAT.amber.lit} />
      <Circle cx="14" cy="60" r="4" fill={MAT.red.dark} />
      {/* Wheels. */}
      <Circle cx="30" cy="76" r="12" fill={MAT.charcoal.dark} />
      <Circle cx="30" cy="76" r="5" fill={MAT.steel.lit} />
      <Circle cx="72" cy="76" r="12" fill={MAT.charcoal.dark} />
      <Circle cx="72" cy="76" r="5" fill={MAT.steel.lit} />
    </Svg>
  );
}

export function House() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="92" rx="34" ry="5" fill={GROUND} />
      {/* Walls. */}
      <Rect x="20" y="46" width="60" height="44" rx="4" fill={MAT.cream.base} />
      <Rect x="20" y="46" width="16" height="44" fill={MAT.cream.lit} />
      {/* Roof overhanging both sides. */}
      <Polygon points="50,14 92,48 8,48" fill={MAT.red.base} />
      <Polygon points="50,14 50,48 8,48" fill={MAT.red.lit} opacity="0.6" />
      <Rect x="66" y="20" width="10" height="16" rx="2" fill={MAT.brown.base} />
      {/* Door and window. */}
      <Rect x="42" y="64" width="18" height="26" rx="3" fill={MAT.brown.base} />
      <Circle cx="56" cy="78" r="2.5" fill={MAT.amber.base} />
      <Rect x="26" y="56" width="14" height="14" rx="2" fill={MAT.sky.lit} />
      <Path d="M33 56 L33 70 M26 63 L40 63" stroke={MAT.cream.base} strokeWidth="2" />
    </Svg>
  );
}

export function Box() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="32" ry="5" fill={GROUND} />
      {/* A cardboard carton in three-quarter view — two visible faces plus
          the open top, which is what makes it a box and not a square. */}
      <Polygon points="14,38 50,24 86,38 50,52" fill={MAT.sand.lit} />
      <Polygon points="14,38 50,52 50,88 14,74" fill={MAT.sand.base} />
      <Polygon points="86,38 50,52 50,88 86,74" fill={MAT.sand.dark} />
      {/* Open flaps. */}
      <Polygon points="14,38 50,24 40,20 6,34" fill={MAT.sand.base} opacity="0.8" />
      <Polygon points="86,38 50,24 60,20 94,34" fill={MAT.sand.dark} opacity="0.7" />
      {/* Tape line. */}
      <Path d="M50 52 L50 88" stroke={MAT.brown.base} strokeWidth="3" opacity="0.45" />
    </Svg>
  );
}

export function Cake() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="32" ry="5" fill={GROUND} />
      {/* Two tiers. */}
      <Rect x="18" y="58" width="64" height="28" rx="6" fill={MAT.cream.base} />
      <Ellipse cx="50" cy="58" rx="32" ry="8" fill="#F6D9E4" />
      <Rect x="26" y="38" width="48" height="22" rx="5" fill={MAT.cream.lit} />
      <Ellipse cx="50" cy="38" rx="24" ry="7" fill="#F6D9E4" />
      {/* Icing drips — the detail that says "cake". */}
      <Path d="M26 44 q6 8 12 0 q6 8 12 0 q6 8 12 0 q6 8 12 0 L74 38 L26 38 Z" fill="#F4A6C0" />
      <Path d="M18 64 q8 9 16 0 q8 9 16 0 q8 9 16 0 q8 9 16 0 L82 58 L18 58 Z" fill="#F4A6C0" opacity="0.9" />
      {/* Candle. */}
      <Rect x="47" y="20" width="6" height="18" rx="3" fill={MAT.pink.base} />
      <Path d="M50 10 q6 6 0 10 q-6 -4 0 -10 Z" fill={MAT.amber.base} />
      <Circle cx="34" cy="72" r="3" fill={MAT.red.base} />
      <Circle cx="62" cy="74" r="3" fill={MAT.teal.base} />
    </Svg>
  );
}

export function Crown() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="86" rx="30" ry="5" fill={GROUND} />
      <Path d="M16 72 L10 30 L30 46 L50 20 L70 46 L90 30 L84 72 Z" fill={MAT.gold.base} />
      <Path d="M16 72 L10 30 L30 46 L50 20 L50 72 Z" fill={MAT.gold.lit} opacity="0.55" />
      <Rect x="14" y="70" width="72" height="12" rx="5" fill={MAT.gold.dark} />
      <Rect x="14" y="70" width="72" height="4" rx="2" fill={MAT.gold.lit} opacity="0.7" />
      <Circle cx="10" cy="28" r="5" fill={MAT.red.base} />
      <Circle cx="50" cy="18" r="5" fill={MAT.teal.base} />
      <Circle cx="90" cy="28" r="5" fill={MAT.red.base} />
      <Circle cx="34" cy="76" r="3.5" fill={MAT.teal.lit} />
      <Circle cx="66" cy="76" r="3.5" fill={MAT.red.lit} />
    </Svg>
  );
}

export function Ring() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="88" rx="22" ry="5" fill={GROUND} />
      {/* Band. */}
      <Ellipse cx="50" cy="62" rx="26" ry="24" fill="none" stroke={MAT.gold.base} strokeWidth="10" />
      <Path d="M28 48 a26 24 0 0 1 18 -10" stroke={MAT.gold.lit} strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* Gem: a cut stone, not a ball. */}
      <Polygon points="50,8 68,26 50,46 32,26" fill={MAT.teal.lit} />
      <Polygon points="50,8 68,26 50,26" fill={MAT.teal.base} />
      <Polygon points="50,26 68,26 50,46" fill={MAT.teal.dark} />
      <Polygon points="32,26 50,26 50,46" fill={MAT.teal.base} opacity="0.8" />
    </Svg>
  );
}

export function Pig() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="28" ry="5" fill={GROUND} />
      <Ellipse cx="44" cy="62" rx="30" ry="22" fill="#F0A9B8" />
      <Path d="M14 62 Q14 40 44 40 Q50 40 54 42 Q22 48 20 72 Z" fill="#F8C6D1" />
      <Path d="M16 54 q-8 -6 -2 -10 q6 2 6 8 Z" fill="#E08B9D" />
      <Rect x="26" y="78" width="10" height="12" rx="4" fill="#E08B9D" />
      <Rect x="52" y="78" width="10" height="12" rx="4" fill="#E08B9D" />
      {/* Head. */}
      <Circle cx="72" cy="44" r="20" fill="#F0A9B8" />
      <Path d="M72 24 a20 20 0 0 0 -17 10 q10 -6 17 -4 Z" fill="#F8C6D1" />
      <Polygon points="58,28 54,14 68,22" fill="#E08B9D" />
      <Polygon points="86,28 90,14 76,22" fill="#E08B9D" />
      {/* Snout — the identifying feature. */}
      <Ellipse cx="80" cy="52" rx="13" ry="10" fill="#E893A6" />
      <Ellipse cx="76" cy="52" rx="2.5" ry="3.5" fill="#B9576C" />
      <Ellipse cx="85" cy="52" rx="2.5" ry="3.5" fill="#B9576C" />
      <Circle cx="66" cy="40" r="4" fill={MAT.ink.dark} />
      <Circle cx="65" cy="38.5" r="1.4" fill="#FFFFFF" />
    </Svg>
  );
}

export function Cat() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="28" ry="5" fill={GROUND} />
      {/* Curled tail. */}
      <Path d="M20 72 q-14 -4 -10 -18" stroke="#9A8FB5" strokeWidth="7" fill="none" strokeLinecap="round" />
      <Ellipse cx="46" cy="66" rx="27" ry="20" fill="#A99DC4" />
      <Path d="M19 66 Q19 46 46 46 Q52 46 56 48 Q26 54 24 74 Z" fill="#C4BBD9" />
      {/* Head with pointed ears. */}
      <Circle cx="66" cy="38" r="21" fill="#A99DC4" />
      <Path d="M66 17 a21 21 0 0 0 -18 11 q11 -6 18 -4 Z" fill="#C4BBD9" />
      <Polygon points="50,22 46,4 62,16" fill="#A99DC4" />
      <Polygon points="82,22 86,4 70,16" fill="#A99DC4" />
      <Polygon points="51,20 49,10 58,17" fill="#E8AFC0" />
      <Polygon points="81,20 83,10 74,17" fill="#E8AFC0" />
      {/* Face. */}
      <Circle cx="58" cy="36" r="4.5" fill={MAT.ink.dark} />
      <Circle cx="56.5" cy="34" r="1.6" fill="#FFFFFF" />
      <Circle cx="75" cy="35" r="4.5" fill={MAT.ink.dark} />
      <Circle cx="73.5" cy="33" r="1.6" fill="#FFFFFF" />
      <Polygon points="66,44 70,48 62,48" fill="#E8778F" />
      <Path d="M52 50 L38 47 M52 54 L38 56 M80 49 L94 46 M80 53 L94 55" stroke="#7C7095" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}
