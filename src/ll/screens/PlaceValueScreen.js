import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Sheen, TopHighlight } from '../premium';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, MAX_ONES, MAX_TENS, TOTAL_ROUNDS } from '../games/placeValueData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, withAlpha } from '../tokens';

// "Place Value Tower" — Numbers 21 to 99 (Grade 1).
//
// Build a number from tens rods and ones cubes, or read the number a set of
// rods shows.
//
// The teaching device is the ones column's tenth socket. There are exactly
// nine places for ones cubes and a tenth drawn as a dashed outline labelled
// "→ swap for a ten". A child who tries to put ten ones in the column can
// *see* why they can't, which is the entire rule of place value: ten ones are
// a ten, so they don't live here. The existing logic already refuses the
// tenth cube and says so aloud; this makes the refusal visible before it
// happens rather than only after.
//
// Rods and cubes are also built as real base-ten blocks: a rod is ten cubes
// fused with visible segment lines, so "one rod = ten cubes" is verifiable by
// counting, not asserted.

// A tens rod: ten segments, top-lit, with a contact shadow.
function Rod({ height = 100, width = 16 }) {
  return (
    <View style={styles.rodCast}>
      <LinearGradient colors={[ll.blueLight, ll.blueDeep]} style={[styles.rod, { width, height }]}>
        <Sheen variant="tile" radius={4} />
        {Array.from({ length: 9 }, (_, j) => <View key={j} style={styles.rodLine} />)}
        <View style={styles.rodGloss} pointerEvents="none" />
      </LinearGradient>
    </View>
  );
}

// A ones cube.
function Cube({ size = 15 }) {
  return (
    <View style={styles.cubeCast}>
      <LinearGradient colors={[ll.amberWarm, '#E8A21F']} style={[styles.cube, { width: size, height: size }]}>
        <View style={styles.cubeTop} pointerEvents="none" />
      </LinearGradient>
    </View>
  );
}

function Blocks({ tens, ones, showSockets = false, compact = false }) {
  const rodH = compact ? 88 : 100;
  const cubeS = compact ? 13 : 15;
  return (
    <View style={styles.blocks}>
      {/* TENS ---------------------------------------------------------- */}
      <View style={styles.column}>
        <View style={styles.rods}>
          {Array.from({ length: tens }, (_, i) => <Rod key={i} height={rodH} width={compact ? 14 : 16} />)}
          {showSockets && tens === 0 ? <View style={[styles.rodSocket, { height: rodH, width: compact ? 14 : 16 }]} /> : null}
        </View>
        <Text style={styles.colLabel}>TENS</Text>
        <Text style={styles.colValue}>{tens}</Text>
      </View>

      <View style={styles.divider} />

      {/* ONES — nine sockets and a tenth that can't be used. ----------- */}
      <View style={styles.column}>
        <View style={[styles.cubes, { width: cubeS * 3 + 8 }]}>
          {Array.from({ length: ones }, (_, i) => <Cube key={i} size={cubeS} />)}
          {showSockets
            ? Array.from({ length: Math.max(0, MAX_ONES - ones) }, (_, i) => (
                <View key={`s${i}`} style={[styles.cubeSocket, { width: cubeS, height: cubeS }]} />
              ))
            : null}
          {showSockets ? (
            <View style={[styles.cubeBlocked, { width: cubeS, height: cubeS }]}>
              <Text style={styles.blockedMark}>×</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.colLabel}>ONES</Text>
        <Text style={styles.colValue}>{ones}</Text>
        {showSockets ? <Text style={styles.swapNote}>10 ones → swap for a ten</Text> : null}
      </View>
    </View>
  );
}

export default function PlaceValueScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ma-num21to99', subjectId: 'Math', standardId: 'Grade 1', title: 'Numbers 21 to 99' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [tens, setTens] = useState(0);
  const [ones, setOnes] = useState(0);
  const isBuild = round.kind === 'build';
  // Presentation-only: flashes the ones column when a tenth cube is refused.
  const blocked = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTens(0);
    setOnes(0);
    flow.say(isBuild ? `Build ${round.n} with tens and ones.` : 'What number do these blocks show?');
  }, [flow.index]);

  // ---------------------------------------------------------------------
  // Unchanged build logic.
  function addOne() {
    if (ones >= MAX_ONES) {
      // Same refusal as before; now it also flashes the column so the child
      // sees *where* the problem is.
      Animated.sequence([
        Animated.timing(blocked, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(blocked, { toValue: 0, duration: 340, useNativeDriver: true }),
      ]).start();
      flow.say('Ten ones make a ten. Use a ten rod instead!');
    } else setOnes(ones + 1);
  }

  function check() {
    const made = tens * 10 + ones;
    if (made === round.n) {
      flow.succeed(`${tens} tens and ${ones} ones make ${round.n}!`);
    } else if (flow.misses >= 1) {
      flow.missOn('check', `You made ${made}. ${round.n} needs ${round.tens} tens and ${round.ones} ones.`);
    } else {
      flow.missOn('check', `You made ${made}. Try again!`);
    }
  }

  function pick(n) {
    if (n === round.n) flow.succeed(`${round.tens} tens and ${round.ones} ones is ${round.n}.`);
    else flow.missOn(n, `${n} would be ${Math.floor(n / 10)} tens and ${n % 10} ones. Count the rods again.`);
  }
  // ---------------------------------------------------------------------

  const compact = width < 360;
  const made = tens * 10 + ones;
  const flash = blocked.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={isBuild ? `Build ${round.n}` : 'What number is this?'}>
      {/* THE TRAY -------------------------------------------------------- */}
      <View style={styles.trayCast}>
        <LinearGradient colors={llSurface.whiteBlue} style={[styles.tray, llRing.faint]}>
          <TopHighlight radius={llRadius.xl} />
          <Sheen variant="trough" radius={llRadius.xl} />

          <Animated.View style={{ opacity: flash, ...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(ll.pink, 0.16), borderRadius: llRadius.xl }} pointerEvents="none" />

          {isBuild
            ? <Blocks tens={tens} ones={ones} showSockets compact={compact} />
            : <Blocks tens={round.tens} ones={round.ones} compact={compact} />}

          {/* The running total, written as the place-value sum. */}
          {isBuild ? (
            <View style={styles.sumRow}>
              <Text style={styles.sumPart}>{tens} × 10</Text>
              <Text style={styles.sumPlus}>+</Text>
              <Text style={styles.sumPart}>{ones}</Text>
              <Text style={styles.sumPlus}>=</Text>
              <View style={[styles.sumTotal, made === round.n && styles.sumTotalOk]}>
                <Text style={[styles.sumTotalText, made === round.n && { color: ll.white }]}>{made}</Text>
              </View>
            </View>
          ) : null}
        </LinearGradient>
      </View>

      {isBuild ? (
        <>
          {/* CONTROLS — grouped by place, not one flat row. ------------- */}
          <View style={styles.controlBlock}>
            <View style={styles.controlGroup}>
              <Text style={[styles.groupLabel, { color: ll.blueDeep }]}>TENS</Text>
              <View style={styles.controlRow}>
                <Stepper label="−" tone="blue" disabled={tens === 0} onPress={() => setTens(tens - 1)} compact={compact} />
                <Stepper label="+" tone="blue" disabled={tens === MAX_TENS} onPress={() => setTens(tens + 1)} compact={compact} />
              </View>
            </View>

            <View style={styles.controlGroup}>
              <Text style={[styles.groupLabel, { color: ll.amberInk }]}>ONES</Text>
              <View style={styles.controlRow}>
                <Stepper label="−" tone="amber" disabled={ones === 0} onPress={() => setOnes(ones - 1)} compact={compact} />
                <Stepper label="+" tone="amber" onPress={addOne} compact={compact} />
              </View>
            </View>
          </View>

          <Choice flow={flow} id="check" label="Check ✓" onPress={check} style={styles.check} />
        </>
      ) : (
        <View style={styles.options}>
          {round.options.map((n) => (
            <Choice key={n} flow={flow} id={n} isAnswer={n === round.n} onPress={() => pick(n)} style={styles.option}>
              <Text style={choiceText.big}>{n}</Text>
            </Choice>
          ))}
        </View>
      )}
    </GameFrame>
  );
}

// A chunky +/− key, coloured by the place it controls.
function Stepper({ label, tone, disabled, onPress, compact }) {
  const fills = { blue: [ll.blueLight, ll.blue], amber: [ll.amberWarm, '#E8A21F'] };
  const edges = { blue: withAlpha('#22408C', 0.5), amber: withAlpha('#8A5E10', 0.5) };
  const size = compact ? 52 : 58;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${tone === 'blue' ? 'ten' : 'one'}`}
      style={({ pressed }) => [
        styles.stepCast,
        { shadowColor: tone === 'blue' ? ll.blueDeep : '#B07C12' },
        disabled && styles.stepDisabled,
        pressed && !disabled && { transform: [{ translateY: 2 }] },
      ]}
    >
      <LinearGradient
        colors={disabled ? [ll.lilac, ll.lilac] : fills[tone]}
        style={[styles.step, { width: size, height: size, borderBottomColor: disabled ? withAlpha('#8B86B8', 0.5) : edges[tone] }]}
      >
        <Sheen variant="strong" radius={llRadius.md} />
        <Text style={[styles.stepText, disabled && { color: ll.muted }]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trayCast: {
    alignSelf: 'stretch', borderRadius: llRadius.xl,
    shadowColor: '#5442A8', shadowOpacity: 0.22, shadowRadius: 28,
    shadowOffset: { width: 0, height: 15 }, elevation: 9,
  },
  tray: {
    minHeight: 156, paddingVertical: 16, paddingHorizontal: 14, borderRadius: llRadius.xl,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },

  blocks: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  column: { alignItems: 'center', minWidth: 78 },
  divider: {
    width: 1, height: 92, marginBottom: 30,
    backgroundColor: withAlpha('#8B86B8', 0.3),
  },
  colLabel: {
    marginTop: 8, fontFamily: 'Nunito_800ExtraBold', fontSize: 9,
    letterSpacing: 1.4, color: ll.muted,
  },
  colValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, lineHeight: 24, color: ll.ink },
  swapNote: {
    marginTop: 3, fontFamily: 'Nunito_700Bold', fontSize: 8.5,
    color: ll.amberInk, textAlign: 'center',
  },

  rods: { flexDirection: 'row', gap: 4, alignItems: 'flex-end', minHeight: 100 },
  rodCast: {
    borderRadius: 4,
    shadowColor: '#22408C', shadowOpacity: 0.34, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  rod: { borderRadius: 4, justifyContent: 'space-evenly', overflow: 'hidden' },
  rodLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.75)' },
  rodGloss: {
    position: 'absolute', top: 0, bottom: 0, left: 2, width: 3,
    borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)',
  },
  rodSocket: {
    borderRadius: 4, borderWidth: 2, borderStyle: 'dashed',
    borderColor: withAlpha(ll.blue, 0.45), backgroundColor: withAlpha(ll.blue, 0.06),
  },

  cubes: { flexDirection: 'row', flexWrap: 'wrap-reverse', gap: 3, minHeight: 100, alignContent: 'flex-end' },
  cubeCast: {
    borderRadius: 3,
    shadowColor: '#8A5E10', shadowOpacity: 0.32, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cube: { borderRadius: 3, overflow: 'hidden' },
  cubeTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  cubeSocket: {
    borderRadius: 3, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: withAlpha(ll.amberInk, 0.35),
  },
  // The tenth place, drawn but unusable — the rule, made visible.
  cubeBlocked: {
    borderRadius: 3, borderWidth: 1.5, borderColor: withAlpha(ll.pink, 0.6),
    backgroundColor: withAlpha(ll.pink, 0.12), alignItems: 'center', justifyContent: 'center',
  },
  blockedMark: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, color: ll.pinkDeep },

  sumRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 },
  sumPart: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, color: ll.blueInk },
  sumPlus: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: ll.muted },
  sumTotal: {
    minWidth: 46, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 14,
    backgroundColor: ll.blueSoft, alignItems: 'center',
  },
  sumTotalOk: { backgroundColor: ll.green },
  sumTotalText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, lineHeight: 25, color: ll.ink },

  controlBlock: { flexDirection: 'row', gap: 22, marginTop: 22 },
  controlGroup: { alignItems: 'center', gap: 6 },
  groupLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9.5, letterSpacing: 1.4 },
  controlRow: { flexDirection: 'row', gap: 9 },
  stepCast: {
    borderRadius: llRadius.md,
    shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  stepDisabled: { shadowOpacity: 0.1 },
  step: {
    borderRadius: llRadius.md, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderBottomWidth: 4,
  },
  stepText: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 28, lineHeight: 34, color: ll.white,
    textShadowColor: 'rgba(20,10,60,0.25)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },

  check: { marginTop: 18, minWidth: 170, backgroundColor: ll.greenLight },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 22 },
  option: { width: 92, height: 80 },
});
