import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';
import { GROUND, MAT, SPEC } from './palette';

// Everyday objects — the Grocery Belt set, plus the household things Rhyme
// Train and Room Catch reuse.
//
// Each is a function of nothing: they draw into a 100×100 box and the
// registry scales them. Keeping them prop-less means an object can be
// swapped for a PNG later without any caller changing.
//
// Every object opens with its ground shadow ellipse so the whole set sits on
// the same plane, then builds up base → lit plane → shadow plane.

export function Spoon() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="52" cy="88" rx="26" ry="6" fill={GROUND} />
      {/* Handle, angled so it doesn't look like a lollipop. */}
      <Path d="M56 38 L74 80 Q76 85 71 86 Q66 87 64 82 L48 42 Z" fill={MAT.steel.base} />
      <Path d="M56 38 L62 52 L52 56 L48 42 Z" fill={MAT.steel.lit} opacity="0.8" />
      {/* Bowl. */}
      <Ellipse cx="45" cy="30" rx="21" ry="26" fill={MAT.steel.base} />
      <Ellipse cx="45" cy="30" rx="15" ry="19" fill={MAT.steel.dark} opacity="0.55" />
      <Ellipse cx="39" cy="21" rx="7" ry="10" fill={SPEC} transform="rotate(-18 39 21)" />
    </Svg>
  );
}

export function Cup() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="86" rx="30" ry="6" fill={GROUND} />
      {/* Handle behind the body. */}
      <Path d="M72 42 q18 2 18 15 t-18 15" stroke={MAT.cream.dark} strokeWidth="9" fill="none" strokeLinecap="round" />
      {/* Body: a tapered mug, wider at the rim. */}
      <Path d="M22 34 L78 34 L72 80 Q71 86 64 86 L36 86 Q29 86 28 80 Z" fill={MAT.cream.base} />
      <Path d="M22 34 L36 34 L33 86 L36 86 Q29 86 28 80 Z" fill={MAT.cream.lit} />
      <Path d="M66 34 L78 34 L72 80 Q71 86 64 86 L62 86 Z" fill={MAT.cream.dark} opacity="0.6" />
      {/* Rim and the drink inside. */}
      <Ellipse cx="50" cy="34" rx="28" ry="8" fill={MAT.cream.lit} />
      <Ellipse cx="50" cy="35" rx="22" ry="5.5" fill={MAT.brown.base} />
      <Ellipse cx="43" cy="34" rx="7" ry="2" fill={MAT.brown.lit} opacity="0.7" />
    </Svg>
  );
}

export function Chair() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="92" rx="30" ry="5" fill={GROUND} />
      {/* Back, tilted slightly so it reads three-quarter rather than flat. */}
      <Rect x="26" y="10" width="10" height="46" rx="5" fill={MAT.wood.dark} />
      <Rect x="64" y="10" width="10" height="46" rx="5" fill={MAT.wood.base} />
      <Rect x="26" y="18" width="48" height="9" rx="4.5" fill={MAT.wood.base} />
      <Rect x="26" y="34" width="48" height="9" rx="4.5" fill={MAT.wood.base} />
      {/* Seat. */}
      <Rect x="18" y="52" width="64" height="13" rx="5" fill={MAT.wood.lit} />
      <Rect x="18" y="61" width="64" height="5" rx="2.5" fill={MAT.wood.dark} opacity="0.7" />
      {/* Legs. */}
      <Rect x="24" y="64" width="9" height="27" rx="4" fill={MAT.wood.dark} />
      <Rect x="67" y="64" width="9" height="27" rx="4" fill={MAT.wood.base} />
    </Svg>
  );
}

export function Umbrella() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="52" cy="92" rx="18" ry="5" fill={GROUND} />
      {/* Shaft and the crook handle. */}
      <Rect x="47" y="40" width="6" height="42" rx="3" fill={MAT.woodDark.base} />
      <Path d="M50 78 q0 12 -12 12 t-12 -10" stroke={MAT.woodDark.base} strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* Canopy in three panels — the scallops are what make it an umbrella
          rather than a mushroom. */}
      <Path d="M8 46 Q10 12 50 12 Q90 12 92 46 Q80 38 74 46 Q62 36 50 46 Q38 36 26 46 Q20 38 8 46 Z" fill={MAT.pink.base} />
      <Path d="M8 46 Q10 12 50 12 L50 46 Q38 36 26 46 Q20 38 8 46 Z" fill={MAT.pink.lit} opacity="0.65" />
      <Path d="M50 12 Q90 12 92 46 Q80 38 74 46 Q62 36 50 46 Z" fill={MAT.pink.dark} opacity="0.4" />
      <Circle cx="50" cy="12" r="4" fill={MAT.steel.base} />
    </Svg>
  );
}

export function Shoe() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="86" rx="36" ry="6" fill={GROUND} />
      {/* A trainer: high heel counter dropping to a low toe. */}
      <Path d="M14 74 L14 52 Q14 44 24 44 L36 44 L44 54 Q58 58 78 60 Q90 62 90 72 L90 76 Q90 80 84 80 L20 80 Q14 80 14 74 Z" fill={MAT.white.base} />
      <Path d="M14 52 Q14 44 24 44 L36 44 L40 50 L14 62 Z" fill={MAT.white.lit} />
      <Path d="M44 54 Q58 58 78 60 Q90 62 90 72 L60 72 Z" fill={MAT.blue.base} opacity="0.85" />
      {/* Sole. */}
      <Rect x="12" y="74" width="80" height="10" rx="5" fill={MAT.blue.dark} />
      <Rect x="12" y="74" width="80" height="4" rx="2" fill={MAT.white.lit} opacity="0.7" />
      {/* Laces. */}
      <Path d="M26 52 L40 58 M26 60 L40 66" stroke={MAT.steel.lit} strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

export function Bag() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="30" ry="5" fill={GROUND} />
      {/* Straps behind. */}
      <Rect x="30" y="16" width="9" height="22" rx="4.5" fill={MAT.purple.dark} />
      <Rect x="61" y="16" width="9" height="22" rx="4.5" fill={MAT.purple.dark} />
      {/* Body. */}
      <Path d="M20 40 Q20 26 50 26 Q80 26 80 40 L80 78 Q80 88 70 88 L30 88 Q20 88 20 78 Z" fill={MAT.purple.base} />
      <Path d="M20 40 Q20 26 50 26 L50 88 L30 88 Q20 88 20 78 Z" fill={MAT.purple.lit} opacity="0.4" />
      {/* Front pocket and buckle. */}
      <Path d="M28 58 L72 58 L72 78 Q72 84 66 84 L34 84 Q28 84 28 78 Z" fill={MAT.purple.dark} opacity="0.55" />
      <Rect x="42" y="54" width="16" height="8" rx="3" fill={MAT.amber.base} />
      <Rect x="44" y="56" width="12" height="2.5" rx="1.2" fill={MAT.amber.lit} />
    </Svg>
  );
}

export function Key() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="86" rx="28" ry="5" fill={GROUND} />
      <G transform="rotate(-28 50 50)">
        {/* Bow. */}
        <Circle cx="28" cy="50" r="20" fill={MAT.gold.base} />
        <Circle cx="28" cy="50" r="9" fill={MAT.cream.lit} />
        <Path d="M14 36 a20 20 0 0 1 14 -6 l0 8 a12 12 0 0 0 -8 4 Z" fill={MAT.gold.lit} />
        {/* Shaft and teeth. */}
        <Rect x="46" y="44" width="40" height="12" rx="4" fill={MAT.gold.base} />
        <Rect x="46" y="44" width="40" height="4" rx="2" fill={MAT.gold.lit} />
        <Rect x="62" y="54" width="7" height="12" rx="2" fill={MAT.gold.dark} />
        <Rect x="75" y="54" width="7" height="9" rx="2" fill={MAT.gold.dark} />
      </G>
    </Svg>
  );
}

export function Ball() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="28" ry="5" fill={GROUND} />
      <Circle cx="50" cy="50" r="38" fill={MAT.white.base} />
      {/* Football panels, kept few and large so they read at 34px. */}
      <Polygon points="50,28 63,38 58,54 42,54 37,38" fill={MAT.ink.base} />
      <Path d="M50 12 a38 38 0 0 0 -30 15 l17 11 Z" fill={MAT.ink.base} opacity="0.85" />
      <Path d="M50 12 a38 38 0 0 1 30 15 l-17 11 Z" fill={MAT.ink.base} opacity="0.85" />
      <Path d="M20 74 a38 38 0 0 0 26 14 l-4 -20 Z" fill={MAT.ink.base} opacity="0.7" />
      <Path d="M80 74 a38 38 0 0 1 -26 14 l4 -20 Z" fill={MAT.ink.base} opacity="0.7" />
      <Circle cx="50" cy="50" r="38" fill="none" stroke={MAT.white.dark} strokeWidth="2" />
      <Ellipse cx="35" cy="32" rx="11" ry="8" fill={SPEC} opacity="0.55" transform="rotate(-28 35 32)" />
    </Svg>
  );
}

export function Book() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="86" rx="34" ry="5" fill={GROUND} />
      {/* An open book, seen from slightly above. */}
      <Path d="M50 30 Q32 20 12 24 L12 74 Q32 70 50 80 Z" fill={MAT.white.base} />
      <Path d="M50 30 Q68 20 88 24 L88 74 Q68 70 50 80 Z" fill={MAT.white.lit} />
      {/* Page lines — three a side is enough to read as text. */}
      <Path d="M20 36 L42 41 M20 46 L42 51 M20 56 L42 61" stroke={MAT.grey.base} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <Path d="M58 41 L80 36 M58 51 L80 46 M58 61 L80 56" stroke={MAT.grey.base} strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      {/* Covers, showing under the pages. */}
      <Path d="M50 80 Q32 70 12 74 L12 80 Q32 76 50 86 Z" fill={MAT.pink.base} />
      <Path d="M50 80 Q68 70 88 74 L88 80 Q68 76 50 86 Z" fill={MAT.pink.dark} />
      <Rect x="47" y="28" width="6" height="58" rx="3" fill={MAT.pink.dark} />
    </Svg>
  );
}

export function Hat() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="82" rx="40" ry="7" fill={GROUND} />
      {/* Brim. */}
      <Ellipse cx="50" cy="72" rx="42" ry="12" fill={MAT.ink.base} />
      <Ellipse cx="50" cy="70" rx="42" ry="12" fill={MAT.ink.lit} opacity="0.5" />
      {/* Crown. */}
      <Path d="M28 70 L28 24 Q28 16 50 16 Q72 16 72 24 L72 70 Z" fill={MAT.ink.base} />
      <Path d="M28 70 L28 24 Q28 16 40 16 L40 70 Z" fill={MAT.ink.lit} opacity="0.35" />
      <Ellipse cx="50" cy="24" rx="22" ry="8" fill={MAT.ink.lit} opacity="0.5" />
      {/* Band. */}
      <Rect x="27" y="56" width="46" height="12" fill={MAT.red.base} />
      <Rect x="27" y="56" width="46" height="4" fill={MAT.red.lit} opacity="0.8" />
    </Svg>
  );
}
