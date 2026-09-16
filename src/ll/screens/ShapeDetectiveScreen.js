import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Pop } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/shapeDetectiveData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';

// "Shape Detective" — Shapes (Senior KG).
//
// A 3×3 evidence board of shapes in mixed sizes and colours. The detective is
// told what to find and how many; each find gets stamped.
//
// The board is deliberately unfair in one way — every target sits beside its
// look-alike (circle/oval, square/rectangle) at random sizes — so the child
// must check a *property*, not a silhouette. The clue card therefore states
// the property rather than just showing the shape: corner pips for a square,
// "no corners" for a circle, "4 equal sides" vs "2 long 2 short". That's the
// difference between Junior KG (circle vs square) and Senior KG (circle vs
// oval), and it's what this screen now teaches explicitly.
const BASE = 62;

// Shapes are drawn with a top-light gradient and a contact shadow so they read
// as solid objects on the board. Same props as before — `shape`, `color`,
// `scale` — since other screens import this.
export function ShapeDrawing({ shape, color, scale = 1 }) {
  const s = BASE * scale;
  const grad = [withAlpha('#FFFFFF', 0.42), color, color];
  const shade = { shadowColor: withAlpha('#2E2A63', 1), shadowOpacity: 0.28, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 3 };

  switch (shape) {
    case 'circle':
      return (
        <View style={[{ borderRadius: s / 2 }, shade]}>
          <LinearGradient colors={grad} locations={[0, 0.45, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
            style={{ width: s, height: s, borderRadius: s / 2 }} />
        </View>
      );
    case 'oval':
      return (
        <View style={[{ borderRadius: s / 2 }, shade]}>
          <LinearGradient colors={grad} locations={[0, 0.45, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
            style={{ width: s, height: s * 0.6, borderRadius: s / 2 }} />
        </View>
      );
    case 'square':
      return (
        <View style={[{ borderRadius: 5 }, shade]}>
          <LinearGradient colors={grad} locations={[0, 0.45, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
            style={{ width: s * 0.84, height: s * 0.84, borderRadius: 5 }} />
        </View>
      );
    case 'rectangle':
      return (
        <View style={[{ borderRadius: 5 }, shade]}>
          <LinearGradient colors={grad} locations={[0, 0.45, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
            style={{ width: s, height: s * 0.52, borderRadius: 5 }} />
        </View>
      );
    case 'triangle':
      // A triangle can't take a gradient via borders, so it keeps the solid
      // fill and gets a lighter twin behind it for the light-catch.
      return (
        <View style={shade}>
          <View
            style={{
              width: 0, height: 0, backgroundColor: 'transparent',
              borderLeftWidth: s / 2, borderRightWidth: s / 2, borderBottomWidth: s * 0.87,
              borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute', top: s * 0.1, left: s * 0.26,
              width: 0, height: 0, backgroundColor: 'transparent',
              borderLeftWidth: s * 0.24, borderRightWidth: s * 0.24, borderBottomWidth: s * 0.42,
              borderLeftColor: 'transparent', borderRightColor: 'transparent',
              borderBottomColor: 'rgba(255,255,255,0.3)',
            }}
          />
        </View>
      );
    default:
      return null;
  }
}

// What makes this shape this shape. The clue, in a child's terms.
const PROPERTY = {
  circle: 'Round all the way. No corners.',
  oval: 'Round, but longer than it is tall.',
  square: 'Four corners. All sides the same.',
  rectangle: 'Four corners. Two long, two short.',
  triangle: 'Three corners. Three sides.',
};
const CORNERS = { circle: 0, oval: 0, square: 4, rectangle: 4, triangle: 3 };

export default function ShapeDetectiveScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'sk-ma-shapes', subjectId: 'Math', standardId: 'Senior KG', title: 'Shapes' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [found, setFound] = useState([]);
  const [wrongId, setWrongId] = useState(null);
  const loupe = useRef(new Animated.Value(0)).current;

  const plural = `${round.target}s`;

  useEffect(() => {
    setFound([]);
    setWrongId(null);
    flow.say(`Detective! Find ${round.count} ${plural}.`);
  }, [flow.index]);

  // The magnifier on the clue card sweeps gently — it's a live investigation.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(loupe, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(loupe, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ---------------------------------------------------------------------
  // Unchanged find logic.
  function handleTap(cell) {
    if (flow.isProcessing || found.includes(cell.id)) return;
    if (cell.shape === round.target) {
      const next = [...found, cell.id];
      setFound(next);
      if (next.length === round.count) {
        flow.succeed(`Case closed! You found all the ${plural}.`, { hold: 1300 });
      } else {
        flow.cheer(`That's a ${round.target}!`);
      }
    } else {
      setWrongId(cell.id);
      flow.miss(`That's a ${cell.shape}. Look for a ${round.target}.`);
      flow.later(() => setWrongId(null), 420);
    }
  }
  // ---------------------------------------------------------------------

  // The board scales to the screen — 3 × 96 + 2 × 10 overflowed small phones.
  const cell = useMemo(() => {
    const avail = Math.min(width, 620) - 36;
    return Math.min(96, Math.floor((avail - 20) / 3));
  }, [width]);

  const loupeX = loupe.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] });
  const loupeR = loupe.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });
  const done = found.length;

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={`Find ${round.count} ${plural}`}>
      {/* THE CLUE CARD — the property, not just the picture. -------------- */}
      <View style={styles.caseCast}>
        <LinearGradient colors={llSurface.whiteBlue} style={[styles.caseCard, llRing.faint]}>
          <TopHighlight radius={llRadius.xl} />

          <View style={styles.clueRow}>
            <Animated.View style={[styles.clue, { transform: [{ translateX: loupeX }, { rotate: loupeR }] }]}>
              <ShapeDrawing shape={round.target} color={ll.blueDeep} scale={0.4} />
              {/* Corner pips: the property made countable. */}
              {Array.from({ length: CORNERS[round.target] }, (_, i) => (
                <View key={i} style={[styles.pip, pipPos(round.target, i)]} pointerEvents="none" />
              ))}
            </Animated.View>

            <View style={styles.clueTextWrap}>
              <Text style={styles.clueTitle}>Find the {plural}</Text>
              <Text style={styles.clueProp}>{PROPERTY[round.target]}</Text>
            </View>
          </View>

          {/* Evidence slots — one per shape still to find. */}
          <View style={styles.evidence}>
            {Array.from({ length: round.count }, (_, i) => (
              <View key={i} style={[styles.evSlot, i < done && styles.evSlotFilled]}>
                {i < done ? <Text style={styles.evTick}>✓</Text> : <Text style={styles.evQ}>?</Text>}
              </View>
            ))}
            <Text style={styles.evCount}>🔍 {done} of {round.count}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* THE EVIDENCE BOARD ---------------------------------------------- */}
      <View style={[styles.board, { width: cell * 3 + 20 }]}>
        {round.cells.map((c) => {
          const isFound = found.includes(c.id);
          const isHint = flow.hinting && !isFound && c.shape === round.target;
          return (
            <Animated.View key={`${flow.index}-${c.id}`} style={wrongId === c.id ? { transform: [{ translateX: flow.shakeX }] } : undefined}>
              <Pressable
                onPress={() => handleTap(c)}
                disabled={flow.isProcessing}
                accessibilityRole="button"
                accessibilityLabel={isFound ? `${c.shape}, found` : 'shape'}
                style={({ pressed }) => [
                  styles.cellCast,
                  isFound && styles.cellCastFound,
                  isHint && styles.cellCastHint,
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <LinearGradient
                  colors={isFound ? ['#F2FBF6', '#E2F5EA'] : llSurface.white}
                  style={[
                    styles.cell,
                    { width: cell, height: cell },
                    isFound ? styles.cellFound : llRing.faint,
                    isHint && styles.hint,
                  ]}
                >
                  <Sheen variant="tile" radius={llRadius.lg} />
                  <TopHighlight radius={llRadius.lg} />
                  <ShapeDrawing shape={c.shape} color={c.color} scale={c.scale} />

                  {/* A magnifier ring is drawn over a found shape, like a
                      detective circling it on the board. */}
                  {isFound ? (
                    <>
                      <View style={styles.loupeRing} pointerEvents="none" />
                      <Pop style={styles.badge} from={0.3}>
                        <LinearGradient colors={[ll.greenLight, ll.greenDeep]} style={styles.badgeInner}>
                          <Text style={styles.badgeText}>✓</Text>
                        </LinearGradient>
                      </Pop>
                    </>
                  ) : null}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </GameFrame>
  );
}

// Where the corner pips sit on the clue shape.
function pipPos(shape, i) {
  const spots = {
    square: [{ top: 4, left: 4 }, { top: 4, right: 4 }, { bottom: 4, left: 4 }, { bottom: 4, right: 4 }],
    rectangle: [{ top: 9, left: 2 }, { top: 9, right: 2 }, { bottom: 9, left: 2 }, { bottom: 9, right: 2 }],
    triangle: [{ top: 3, alignSelf: 'center', left: 18 }, { bottom: 5, left: 3 }, { bottom: 5, right: 3 }],
  };
  return spots[shape]?.[i] ?? { top: 0, left: 0 };
}

const styles = StyleSheet.create({
  caseCast: {
    alignSelf: 'stretch', borderRadius: llRadius.xl,
    shadowColor: '#6054BE', shadowOpacity: 0.16, shadowRadius: 22,
    shadowOffset: { width: 0, height: 11 }, elevation: 5,
  },
  caseCard: { borderRadius: llRadius.xl, padding: 14, overflow: 'hidden' },

  clueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clue: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: withAlpha(ll.blue, 0.12),
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: withAlpha(ll.blue, 0.3),
  },
  pip: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: ll.amber },
  clueTextWrap: { flex: 1 },
  clueTitle: { ...llType.cardTitle, color: ll.blueInk },
  clueProp: { fontFamily: 'Nunito_700Bold', fontSize: 12, lineHeight: 17, color: ll.body, marginTop: 1 },

  evidence: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  evSlot: {
    width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderStyle: 'dashed',
    borderColor: ll.lilac, alignItems: 'center', justifyContent: 'center',
  },
  evSlotFilled: {
    borderStyle: 'solid', borderColor: ll.greenDeep, backgroundColor: withAlpha(ll.green, 0.16),
  },
  evTick: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: ll.greenDeep },
  evQ: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 13, color: ll.muted },
  evCount: { marginLeft: 'auto', fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: ll.blueInk },

  board: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20, justifyContent: 'center' },
  cellCast: {
    borderRadius: llRadius.lg,
    shadowColor: '#6054BE', shadowOpacity: 0.15, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  cellCastFound: { shadowColor: ll.greenDeep, shadowOpacity: 0.32, shadowRadius: 20 },
  cellCastHint: { shadowColor: ll.amber, shadowOpacity: 0.55, shadowRadius: 18 },
  cell: {
    borderRadius: llRadius.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  cellFound: { borderWidth: 3, borderColor: ll.green },
  loupeRing: {
    position: 'absolute', width: '78%', height: '78%', borderRadius: 999,
    borderWidth: 3, borderColor: withAlpha(ll.greenDeep, 0.55),
  },
  hint: { borderWidth: 3, borderColor: ll.amber },
  badge: { position: 'absolute', top: -8, right: -8 },
  badgeInner: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: ll.white, overflow: 'hidden',
  },
  badgeText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, lineHeight: 20, color: ll.white },
});
