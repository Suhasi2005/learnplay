import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';
import { GROUND, MAT, SPEC } from './palette';

// School and household objects — the Grade 1 sets: Backpack, Room Catch,
// Wardrobe, Number Fishing, Give Change.
//
// These are the objects a child actually handles at school, so they get
// slightly more detail than the Junior KG set: a pencil has a ferrule, a
// clock has hands. Still the same 100×100 box and top-left light.

export function Pencil() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="22" ry="5" fill={GROUND} />
      <G transform="rotate(28 50 50)">
        {/* Barrel. */}
        <Rect x="38" y="22" width="24" height="48" fill={MAT.amber.base} />
        <Rect x="38" y="22" width="9" height="48" fill={MAT.amber.lit} />
        <Rect x="56" y="22" width="6" height="48" fill={MAT.amber.dark} opacity="0.6" />
        {/* Ferrule and eraser. */}
        <Rect x="37" y="14" width="26" height="9" fill={MAT.steel.base} />
        <Rect x="37" y="14" width="26" height="3" fill={MAT.steel.lit} />
        <Rect x="38" y="4" width="24" height="11" rx="4" fill="#F0A9B8" />
        {/* Sharpened tip. */}
        <Polygon points="38,70 62,70 50,90" fill={MAT.sand.lit} />
        <Polygon points="44,80 56,80 50,90" fill={MAT.ink.dark} />
      </G>
    </Svg>
  );
}

export function Ruler() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="88" rx="34" ry="5" fill={GROUND} />
      <G transform="rotate(-18 50 50)">
        <Rect x="6" y="38" width="88" height="24" rx="4" fill="#F2D98C" />
        <Rect x="6" y="38" width="88" height="8" rx="4" fill="#F9EBBE" />
        {/* Graduations, alternating long and short. */}
        <G stroke={MAT.brown.base} strokeWidth="2" strokeLinecap="round">
          <Path d="M16 38 L16 52 M26 38 L26 46 M36 38 L36 52 M46 38 L46 46 M56 38 L56 52 M66 38 L66 46 M76 38 L76 52 M86 38 L86 46" />
        </G>
      </G>
    </Svg>
  );
}

export function Notebook() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="30" ry="5" fill={GROUND} />
      <Rect x="20" y="12" width="60" height="76" rx="6" fill={MAT.blue.base} />
      <Rect x="20" y="12" width="14" height="76" rx="6" fill={MAT.blue.dark} />
      <Rect x="34" y="16" width="42" height="68" rx="3" fill={MAT.white.lit} />
      {/* Spiral rings. */}
      <G stroke={MAT.steel.base} strokeWidth="3" strokeLinecap="round">
        <Path d="M22 24 L34 24 M22 38 L34 38 M22 52 L34 52 M22 66 L34 66 M22 78 L34 78" />
      </G>
      <G stroke={MAT.grey.base} strokeWidth="2" strokeLinecap="round" opacity="0.55">
        <Path d="M40 30 L70 30 M40 42 L70 42 M40 54 L70 54 M40 66 L62 66" />
      </G>
    </Svg>
  );
}

export function WaterBottle() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="92" rx="20" ry="4" fill={GROUND} />
      <Rect x="42" y="8" width="16" height="10" rx="3" fill={MAT.teal.dark} />
      <Rect x="38" y="16" width="24" height="8" rx="3" fill={MAT.teal.base} />
      <Path d="M32 30 Q32 24 42 24 L58 24 Q68 24 68 30 L68 84 Q68 92 58 92 L42 92 Q32 92 32 84 Z" fill={MAT.teal.lit} opacity="0.55" />
      {/* Water level. */}
      <Path d="M33 52 L67 52 L67 84 Q67 91 58 91 L42 91 Q33 91 33 84 Z" fill={MAT.teal.base} opacity="0.75" />
      <Rect x="37" y="30" width="5" height="50" rx="2.5" fill="rgba(255,255,255,0.7)" />
    </Svg>
  );
}

export function Apple() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="26" ry="5" fill={GROUND} />
      {/* Two lobes make an apple; one circle makes a ball. */}
      <Path d="M50 30 Q26 26 20 50 Q16 74 38 86 Q48 90 50 82 Q52 90 62 86 Q84 74 80 50 Q74 26 50 30 Z" fill={MAT.red.base} />
      <Path d="M50 30 Q26 26 20 50 Q18 62 24 72 Q22 44 50 38 Z" fill={MAT.red.lit} opacity="0.7" />
      <Path d="M48 32 Q48 18 42 10" stroke={MAT.brown.base} strokeWidth="5" fill="none" strokeLinecap="round" />
      <Path d="M52 26 Q66 16 74 22 Q64 34 52 30 Z" fill={MAT.leaf.base} />
      <Ellipse cx="34" cy="46" rx="8" ry="11" fill={SPEC} opacity="0.5" transform="rotate(-22 34 46)" />
    </Svg>
  );
}

export function Shell() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="88" rx="28" ry="5" fill={GROUND} />
      {/* Scallop: a fan with ribs radiating from the hinge. */}
      <Path d="M50 82 Q10 70 14 36 Q18 14 50 14 Q82 14 86 36 Q90 70 50 82 Z" fill="#F6C6C0" />
      <Path d="M50 82 Q10 70 14 36 Q18 14 50 14 L50 82 Z" fill="#FBDCD8" />
      <G stroke="#E29B94" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <Path d="M50 80 L26 30 M50 80 L38 22 M50 80 L50 18 M50 80 L62 22 M50 80 L74 30" />
      </G>
      <Path d="M42 80 Q50 86 58 80 Q50 84 42 80 Z" fill="#E29B94" />
    </Svg>
  );
}

export function Coin() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="88" rx="26" ry="5" fill={GROUND} />
      {/* Edge thickness, then face — a coin is a cylinder seen near-on. */}
      <Ellipse cx="50" cy="56" rx="34" ry="32" fill={MAT.gold.dark} />
      <Ellipse cx="50" cy="50" rx="34" ry="32" fill={MAT.gold.base} />
      <Ellipse cx="50" cy="50" rx="26" ry="24" fill={MAT.gold.lit} opacity="0.55" />
      <Ellipse cx="50" cy="50" rx="26" ry="24" fill="none" stroke={MAT.gold.dark} strokeWidth="2" opacity="0.6" />
      {/* Rupee mark. */}
      <Path d="M42 36 L60 36 M42 44 L60 44 M42 36 Q56 36 56 46 Q56 54 44 54 L60 66" stroke={MAT.gold.dark} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Ellipse cx="36" cy="34" rx="8" ry="5" fill={SPEC} opacity="0.5" transform="rotate(-25 36 34)" />
    </Svg>
  );
}

export function Clock() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="92" rx="26" ry="5" fill={GROUND} />
      {/* Bells and feet give it a child's-alarm-clock silhouette. */}
      <Circle cx="22" cy="22" r="11" fill={MAT.steel.base} />
      <Circle cx="78" cy="22" r="11" fill={MAT.steel.base} />
      <Rect x="26" y="82" width="12" height="10" rx="4" fill={MAT.steel.dark} transform="rotate(-18 32 87)" />
      <Rect x="62" y="82" width="12" height="10" rx="4" fill={MAT.steel.dark} transform="rotate(18 68 87)" />
      <Circle cx="50" cy="52" r="36" fill={MAT.red.base} />
      <Circle cx="50" cy="52" r="29" fill={MAT.cream.lit} />
      <Path d="M50 23 a29 29 0 0 0 -20 8 a29 29 0 0 1 34 -5 Z" fill="#FFFFFF" opacity="0.8" />
      {/* Hour marks at 12/3/6/9 only — twelve would be mush at 34px. */}
      <G stroke={MAT.ink.base} strokeWidth="3" strokeLinecap="round">
        <Path d="M50 28 L50 33 M74 52 L69 52 M50 76 L50 71 M26 52 L31 52" />
      </G>
      <Path d="M50 52 L50 36 M50 52 L64 58" stroke={MAT.ink.base} strokeWidth="4" strokeLinecap="round" fill="none" />
      <Circle cx="50" cy="52" r="4" fill={MAT.red.dark} />
    </Svg>
  );
}

export function Balloon() {
  return (
    <Svg viewBox="0 0 100 100">
      {/* String with a curl, drawn first. */}
      <Path d="M50 70 L50 84 q10 4 4 12" stroke={MAT.grey.dark} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Teardrop body — wider at top, tapering to the knot. */}
      <Path d="M50 6 Q82 6 82 38 Q82 62 50 72 Q18 62 18 38 Q18 6 50 6 Z" fill={MAT.pink.base} />
      <Path d="M50 6 Q30 6 22 24 Q30 14 44 12 Q40 26 38 40 Q34 20 50 6 Z" fill={MAT.pink.lit} opacity="0.85" />
      <Path d="M66 20 Q80 30 74 56 Q68 66 56 70 Q76 56 66 20 Z" fill={MAT.pink.dark} opacity="0.35" />
      <Polygon points="46,70 54,70 50,78" fill={MAT.pink.dark} />
      <Ellipse cx="36" cy="24" rx="7" ry="11" fill="rgba(255,255,255,0.6)" transform="rotate(-22 36 24)" />
    </Svg>
  );
}

export function Sock() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="52" cy="90" rx="28" ry="5" fill={GROUND} />
      <Path d="M34 12 L62 12 Q66 12 66 18 L66 54 Q66 62 74 66 L86 72 Q92 76 88 82 Q84 88 76 86 L44 74 Q30 68 30 52 L30 18 Q30 12 34 12 Z" fill={MAT.white.base} />
      <Path d="M34 12 L46 12 L46 56 Q46 66 54 70 L44 74 Q30 68 30 52 L30 18 Q30 12 34 12 Z" fill={MAT.white.lit} />
      {/* Cuff bands. */}
      <Rect x="30" y="12" width="36" height="7" fill={MAT.pink.base} />
      <Rect x="30" y="22" width="36" height="5" fill={MAT.teal.base} opacity="0.8" />
      <Path d="M74 66 L86 72 Q92 76 88 82 Q84 88 76 86 L62 80 Z" fill={MAT.white.dark} opacity="0.5" />
    </Svg>
  );
}

export function Teddy() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="92" rx="26" ry="5" fill={GROUND} />
      <Circle cx="26" cy="28" r="13" fill={MAT.brown.base} />
      <Circle cx="26" cy="28" r="6" fill="#D9A87E" />
      <Circle cx="74" cy="28" r="13" fill={MAT.brown.base} />
      <Circle cx="74" cy="28" r="6" fill="#D9A87E" />
      {/* Body and limbs. */}
      <Ellipse cx="50" cy="72" rx="26" ry="22" fill={MAT.brown.base} />
      <Ellipse cx="50" cy="76" rx="15" ry="13" fill="#D9A87E" />
      <Ellipse cx="22" cy="66" rx="11" ry="9" fill={MAT.brown.dark} />
      <Ellipse cx="78" cy="66" rx="11" ry="9" fill={MAT.brown.dark} />
      {/* Head. */}
      <Circle cx="50" cy="36" r="24" fill={MAT.brown.base} />
      <Path d="M50 12 a24 24 0 0 0 -20 12 q12 -7 20 -5 Z" fill="#C79A70" />
      <Ellipse cx="50" cy="44" rx="12" ry="9" fill="#D9A87E" />
      <Ellipse cx="50" cy="39" rx="4.5" ry="3.5" fill={MAT.ink.dark} />
      <Path d="M50 43 q0 5 -5 5 M50 43 q0 5 5 5" stroke={MAT.ink.dark} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Circle cx="41" cy="31" r="4" fill={MAT.ink.dark} />
      <Circle cx="40" cy="29.5" r="1.4" fill="#FFFFFF" />
      <Circle cx="59" cy="31" r="4" fill={MAT.ink.dark} />
      <Circle cx="58" cy="29.5" r="1.4" fill="#FFFFFF" />
    </Svg>
  );
}

export function Soap() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="84" rx="30" ry="5" fill={GROUND} />
      {/* Bar with a rounded top face. */}
      <Path d="M16 56 Q16 42 50 42 Q84 42 84 56 L84 66 Q84 80 50 80 Q16 80 16 66 Z" fill="#BFE3E6" />
      <Ellipse cx="50" cy="56" rx="34" ry="14" fill="#DCF2F4" />
      <Ellipse cx="50" cy="55" rx="22" ry="8" fill="#EEFAFB" opacity="0.8" />
      {/* Bubbles. */}
      <Circle cx="72" cy="30" r="9" fill="#EAF8FA" opacity="0.9" />
      <Circle cx="68" cy="26" r="3" fill="#FFFFFF" opacity="0.9" />
      <Circle cx="86" cy="42" r="5" fill="#EAF8FA" opacity="0.85" />
      <Circle cx="60" cy="18" r="4" fill="#EAF8FA" opacity="0.7" />
    </Svg>
  );
}
