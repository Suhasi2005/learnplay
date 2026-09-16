import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';
import { GROUND, MAT } from './palette';

// Creatures — the Habitat Drop set, plus the animals Rhyme Train, Animal
// Riddle and Which More reuse.
//
// House style for animals, so eight of them look like one family:
//   - Head roughly 55% of the body. Friendly, not anatomical.
//   - Eyes are large solid dots with a single white catchlight top-left.
//   - No mouths unless the animal needs one to be identifiable (the duck's
//     bill, the fish's lips). A neutral face travels better across
//     correct/wrong states than a permanently grinning one.
//   - One accent shape per animal — the cow's patch, the bee's stripes —
//     because that's what makes a silhouette nameable at 34px.

// Shared eye. Every creature uses this so the gaze is consistent.
function Eye({ x, y, r = 5 }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={MAT.ink.dark} />
      <Circle cx={x - r * 0.3} cy={y - r * 0.35} r={r * 0.34} fill="#FFFFFF" />
    </G>
  );
}

export function Fish() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="88" rx="26" ry="5" fill={GROUND} />
      {/* Tail first, so the body overlaps it. */}
      <Path d="M14 50 L2 32 Q0 28 5 29 L26 42 L26 58 L5 71 Q0 72 2 68 Z" fill={MAT.teal.dark} />
      {/* Body. */}
      <Path d="M22 50 Q22 26 52 26 Q86 26 92 50 Q86 74 52 74 Q22 74 22 50 Z" fill={MAT.teal.base} />
      <Path d="M22 50 Q22 26 52 26 Q60 26 62 28 Q34 34 30 50 Z" fill={MAT.teal.lit} opacity="0.75" />
      {/* Top fin and side fin. */}
      <Path d="M48 27 Q54 12 66 18 Q62 24 58 27 Z" fill={MAT.teal.dark} />
      <Path d="M48 56 Q56 70 66 62 Q58 58 54 55 Z" fill={MAT.teal.dark} opacity="0.8" />
      <Eye x={74} y={44} r={5} />
      {/* Gill line — one stroke, but it's what says "fish". */}
      <Path d="M62 34 q-6 16 0 30" stroke={MAT.teal.dark} strokeWidth="2.5" fill="none" opacity="0.55" />
    </Svg>
  );
}

export function Bird() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="24" ry="5" fill={GROUND} />
      {/* Body. */}
      <Ellipse cx="46" cy="56" rx="30" ry="26" fill={MAT.sky.base} />
      <Path d="M16 56 Q16 30 46 30 Q54 30 58 32 Q28 40 26 66 Z" fill={MAT.sky.lit} opacity="0.8" />
      {/* Head. */}
      <Circle cx="68" cy="38" r="19" fill={MAT.sky.base} />
      <Path d="M68 19 a19 19 0 0 0 -17 11 q10 -6 17 -4 Z" fill={MAT.sky.lit} />
      {/* Wing. */}
      <Path d="M36 48 Q50 44 58 58 Q46 70 34 62 Z" fill={MAT.sky.dark} opacity="0.8" />
      {/* Beak and tail. */}
      <Polygon points="86,38 98,43 86,46" fill={MAT.amber.base} />
      <Path d="M18 54 L4 46 Q0 44 3 50 L10 62 Q14 66 18 62 Z" fill={MAT.sky.dark} />
      <Eye x={72} y={34} r={4.5} />
      {/* Legs. */}
      <Path d="M44 80 L44 88 M54 80 L54 88" stroke={MAT.amber.dark} strokeWidth="3.5" strokeLinecap="round" />
    </Svg>
  );
}

export function Dog() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="30" ry="5" fill={GROUND} />
      {/* Body and legs. */}
      <Ellipse cx="40" cy="66" rx="30" ry="21" fill={MAT.sand.base} />
      <Rect x="20" y="74" width="11" height="16" rx="5" fill={MAT.sand.dark} />
      <Rect x="48" y="74" width="11" height="16" rx="5" fill={MAT.sand.base} />
      {/* Tail. */}
      <Path d="M12 58 q-8 -14 2 -18" stroke={MAT.sand.dark} strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* Head. */}
      <Circle cx="70" cy="40" r="23" fill={MAT.sand.base} />
      <Path d="M70 17 a23 23 0 0 0 -20 12 q12 -7 20 -5 Z" fill={MAT.sand.lit} />
      {/* Ears — the floppy one is the identifying shape. */}
      <Ellipse cx="54" cy="28" rx="9" ry="15" fill={MAT.brown.base} transform="rotate(-22 54 28)" />
      <Ellipse cx="88" cy="30" rx="9" ry="15" fill={MAT.brown.base} transform="rotate(20 88 30)" />
      {/* Muzzle. */}
      <Ellipse cx="74" cy="50" rx="14" ry="11" fill={MAT.cream.lit} />
      <Ellipse cx="76" cy="45" rx="5" ry="4" fill={MAT.ink.dark} />
      <Eye x={62} y={36} r={4.5} />
      <Eye x={80} y={34} r={4.5} />
    </Svg>
  );
}

export function Duck() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="88" rx="28" ry="5" fill={GROUND} />
      {/* Water line, because a duck is defined by floating. */}
      <Path d="M8 76 q12 -5 22 0 t22 0 t22 0 t18 0" stroke={MAT.blue.lit} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* Body. */}
      <Ellipse cx="46" cy="60" rx="32" ry="20" fill={MAT.amber.base} />
      <Path d="M14 60 Q14 40 46 40 Q54 40 58 42 Q26 48 24 68 Z" fill={MAT.amber.lit} opacity="0.8" />
      {/* Tail flick. */}
      <Path d="M16 52 L4 44 Q0 42 3 48 L9 58 Z" fill={MAT.amber.dark} />
      {/* Neck and head. */}
      <Path d="M62 58 Q60 34 72 30 L84 34 Q76 40 78 58 Z" fill={MAT.amber.base} />
      <Circle cx="76" cy="28" r="15" fill={MAT.amber.base} />
      <Path d="M76 13 a15 15 0 0 0 -13 8 q8 -5 13 -3 Z" fill={MAT.amber.lit} />
      {/* Bill. */}
      <Path d="M88 28 Q100 28 98 34 Q90 36 86 33 Z" fill="#F2913B" />
      <Eye x={78} y={25} r={4} />
    </Svg>
  );
}

export function Butterfly() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="22" ry="4" fill={GROUND} />
      {/* Upper wings. */}
      <Path d="M48 48 Q26 10 10 26 Q2 40 20 52 Q34 58 48 52 Z" fill={MAT.purple.base} />
      <Path d="M52 48 Q74 10 90 26 Q98 40 80 52 Q66 58 52 52 Z" fill={MAT.purple.base} />
      <Path d="M48 48 Q26 10 10 26 Q6 34 16 40 Q30 34 48 48 Z" fill={MAT.purple.lit} opacity="0.7" />
      {/* Lower wings. */}
      <Path d="M48 52 Q30 76 18 68 Q12 58 26 54 Q38 50 48 52 Z" fill={MAT.pink.base} />
      <Path d="M52 52 Q70 76 82 68 Q88 58 74 54 Q62 50 52 52 Z" fill={MAT.pink.base} />
      {/* Wing spots — the thing that makes it a butterfly not a leaf. */}
      <Circle cx="26" cy="32" r="5" fill={MAT.amber.base} />
      <Circle cx="74" cy="32" r="5" fill={MAT.amber.base} />
      {/* Body and antennae. */}
      <Ellipse cx="50" cy="50" rx="5" ry="22" fill={MAT.ink.base} />
      <Path d="M48 30 q-6 -10 -12 -12 M52 30 q6 -10 12 -12" stroke={MAT.ink.base} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Circle cx="35" cy="17" r="3" fill={MAT.ink.base} />
      <Circle cx="65" cy="17" r="3" fill={MAT.ink.base} />
    </Svg>
  );
}

export function Cow() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="32" ry="5" fill={GROUND} />
      {/* Body. */}
      <Ellipse cx="42" cy="60" rx="34" ry="24" fill={MAT.white.base} />
      <Path d="M8 60 Q8 36 42 36 Q50 36 54 38 Q20 44 18 70 Z" fill={MAT.white.lit} opacity="0.9" />
      {/* Patches — a cow with no patches is just a large dog. */}
      <Ellipse cx="28" cy="52" rx="13" ry="10" fill={MAT.ink.base} opacity="0.85" transform="rotate(-16 28 52)" />
      <Ellipse cx="54" cy="68" rx="10" ry="8" fill={MAT.ink.base} opacity="0.85" />
      {/* Legs and udder. */}
      <Rect x="20" y="78" width="10" height="14" rx="4" fill={MAT.white.dark} />
      <Rect x="50" y="78" width="10" height="14" rx="4" fill={MAT.white.dark} />
      {/* Head. */}
      <Ellipse cx="76" cy="42" rx="20" ry="19" fill={MAT.white.base} />
      <Path d="M76 23 a20 19 0 0 0 -17 10 q10 -6 17 -4 Z" fill={MAT.white.lit} />
      {/* Horns and ears. */}
      <Path d="M62 26 q-6 -8 -2 -12 q6 2 8 10 Z" fill={MAT.sand.dark} />
      <Path d="M90 26 q6 -8 2 -12 q-6 2 -8 10 Z" fill={MAT.sand.dark} />
      <Ellipse cx="58" cy="38" rx="7" ry="5" fill={MAT.white.dark} />
      <Ellipse cx="94" cy="38" rx="7" ry="5" fill={MAT.white.dark} />
      {/* Muzzle. */}
      <Ellipse cx="80" cy="54" rx="13" ry="10" fill="#F2C4C9" />
      <Circle cx="76" cy="53" r="2.5" fill={MAT.ink.dark} opacity="0.6" />
      <Circle cx="85" cy="53" r="2.5" fill={MAT.ink.dark} opacity="0.6" />
      <Eye x={69} y={37} r={4} />
      <Eye x={86} y={36} r={4} />
    </Svg>
  );
}

export function Crab() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="86" rx="30" ry="5" fill={GROUND} />
      {/* Legs, drawn before the shell. */}
      <G stroke={MAT.red.dark} strokeWidth="5" fill="none" strokeLinecap="round">
        <Path d="M24 60 L10 66 M24 68 L12 78 M76 60 L90 66 M76 68 L88 78" />
      </G>
      {/* Claws. */}
      <Path d="M18 44 q-12 -6 -14 6 q8 8 16 2 Z" fill={MAT.red.base} />
      <Path d="M82 44 q12 -6 14 6 q-8 8 -16 2 Z" fill={MAT.red.base} />
      {/* Shell. */}
      <Path d="M20 62 Q20 38 50 38 Q80 38 80 62 Q80 76 50 76 Q20 76 20 62 Z" fill={MAT.red.base} />
      <Path d="M20 62 Q20 38 50 38 Q56 38 60 40 Q30 46 28 68 Z" fill={MAT.red.lit} opacity="0.7" />
      {/* Eye stalks. */}
      <Path d="M40 40 L38 26 M60 40 L62 26" stroke={MAT.red.dark} strokeWidth="4" strokeLinecap="round" />
      <Eye x={38} y={23} r={5} />
      <Eye x={62} y={23} r={5} />
    </Svg>
  );
}

export function Bee() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="22" ry="4" fill={GROUND} />
      {/* Wings behind the body, translucent. */}
      <Ellipse cx="34" cy="34" rx="17" ry="11" fill={MAT.sky.lit} opacity="0.75" transform="rotate(-28 34 34)" />
      <Ellipse cx="66" cy="34" rx="17" ry="11" fill={MAT.sky.lit} opacity="0.75" transform="rotate(28 66 34)" />
      {/* Body. */}
      <Ellipse cx="50" cy="58" rx="26" ry="22" fill={MAT.amber.base} />
      <Path d="M24 58 Q24 36 50 36 Q56 36 60 38 Q32 44 30 66 Z" fill={MAT.amber.lit} opacity="0.8" />
      {/* Stripes, clipped to the body by matching the ellipse curve. */}
      <Path d="M38 39 Q34 58 40 76 L50 78 Q44 58 48 38 Z" fill={MAT.ink.base} opacity="0.9" />
      <Path d="M60 40 Q56 58 60 75 L68 70 Q64 58 68 44 Z" fill={MAT.ink.base} opacity="0.9" />
      {/* Sting. */}
      <Polygon points="76,58 88,58 78,64" fill={MAT.ink.dark} />
      {/* Head. */}
      <Circle cx="30" cy="46" r="13" fill={MAT.ink.base} />
      <Path d="M26 36 q-4 -10 -10 -12 M34 36 q4 -10 10 -12" stroke={MAT.ink.base} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Circle cx="26" cy="43" r="3.5" fill="#FFFFFF" />
      <Circle cx="35" cy="43" r="3.5" fill="#FFFFFF" />
    </Svg>
  );
}

// Rhyme Train / Animal Riddle reuse these three.
export function Fox() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="90" rx="28" ry="5" fill={GROUND} />
      {/* Brush tail with a white tip. */}
      <Path d="M20 70 Q0 64 6 44 Q18 46 24 58 Z" fill="#E2833F" />
      <Path d="M8 50 Q2 46 6 44 Q12 45 14 49 Z" fill={MAT.white.lit} />
      {/* Body. */}
      <Ellipse cx="46" cy="66" rx="28" ry="19" fill="#E2833F" />
      {/* Head: the triangular muzzle is the whole identity. */}
      <Path d="M30 42 Q30 20 50 20 Q70 20 70 42 Q70 58 50 62 Q30 58 30 42 Z" fill="#E8934E" />
      <Polygon points="28,26 34,10 44,24" fill="#C96A2E" />
      <Polygon points="72,26 66,10 56,24" fill="#C96A2E" />
      <Path d="M38 50 Q50 46 62 50 Q56 62 50 63 Q44 62 38 50 Z" fill={MAT.white.lit} />
      <Circle cx="50" cy="55" r="4" fill={MAT.ink.dark} />
      <Eye x={41} y={38} r={4.5} />
      <Eye x={59} y={38} r={4.5} />
    </Svg>
  );
}

export function Mouse() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="88" rx="26" ry="5" fill={GROUND} />
      <Path d="M22 70 q-16 4 -14 -10" stroke={MAT.grey.dark} strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Big round ears first — the mouse signature. */}
      <Circle cx="34" cy="34" r="16" fill={MAT.grey.base} />
      <Circle cx="34" cy="34" r="9" fill="#F2C4C9" />
      <Circle cx="70" cy="32" r="14" fill={MAT.grey.base} />
      <Circle cx="70" cy="32" r="8" fill="#F2C4C9" />
      {/* Body. */}
      <Ellipse cx="52" cy="60" rx="28" ry="22" fill={MAT.grey.base} />
      <Path d="M24 60 Q24 40 52 40 Q58 40 62 42 Q32 48 30 70 Z" fill={MAT.grey.lit} opacity="0.8" />
      <Circle cx="78" cy="60" r="4" fill="#F2C4C9" />
      <Path d="M70 56 L88 52 M70 62 L88 64" stroke={MAT.grey.dark} strokeWidth="1.8" strokeLinecap="round" />
      <Eye x={66} y={52} r={4.5} />
    </Svg>
  );
}

export function Snake() {
  return (
    <Svg viewBox="0 0 100 100">
      <Ellipse cx="50" cy="88" rx="30" ry="5" fill={GROUND} />
      {/* Coiled S-body. */}
      <Path
        d="M20 78 Q10 60 30 54 Q56 48 46 34 Q38 22 58 18"
        stroke={MAT.leaf.base}
        strokeWidth="17"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M20 78 Q10 60 30 54 Q56 48 46 34 Q38 22 58 18"
        stroke={MAT.leaf.lit}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Head and tongue. */}
      <Ellipse cx="64" cy="18" rx="15" ry="12" fill={MAT.leaf.base} />
      <Path d="M64 6 a15 12 0 0 0 -12 6 q7 -4 12 -2 Z" fill={MAT.leaf.lit} />
      <Path d="M78 20 L92 22 M92 22 L88 18 M92 22 L88 26" stroke={MAT.red.base} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Eye x={68} y={15} r={3.5} />
    </Svg>
  );
}
