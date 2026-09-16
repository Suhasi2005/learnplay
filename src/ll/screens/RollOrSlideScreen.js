import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Choice from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/rollSlideData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, withAlpha } from '../tokens';
import GameObject from '../objects';

// "Roll or Slide?" — What is Long? What is Round? (Grade 1).
//
// Decide whether an object rolls or slides, or is long or round; a right
// answer is acted out on the ramp.
//
// The teaching device is the contact patch. NCERT's actual rule is that
// curved surfaces roll and flat ones slide, so under the object sits a small
// diagram of how it meets the ground: a single point for a curved thing, a
// full flat line for a boxy one. A child can check the rule against the
// object before answering rather than recalling which category it was in.
//
// The ramp is a real ramp now — a wooden slope with a floor, edge shading and
// a stop block — and the object leaves a dust puff where it lands, so the
// difference between rolling and sliding is visible in the motion itself:
// a roller spins two full turns, a slider stays flat and skids.
const CURVED = ['rolls', 'round'];

export default function RollOrSlideScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ma-shapes', subjectId: 'Math', standardId: 'Grade 1', title: 'What is Long? What is Round?' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const go = useRef(new Animated.Value(0)).current;
  const idle = useRef(new Animated.Value(0)).current;

  const prompt = round.kind === 'move' ? `Will the ${round.label} roll or slide?` : `Is the ${round.label} long or round?`;

  useEffect(() => {
    go.setValue(0);
    flow.say(prompt);
  }, [flow.index]);

  // The object rocks a little at the top of the ramp, waiting to be let go.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(idle, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(idle, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ---------------------------------------------------------------------
  // Unchanged pick logic.
  function pick(option) {
    if (option.id === round.answer) {
      Animated.timing(go, { toValue: 1, duration: 1000, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
      flow.succeed(round.kind === 'move' ? `Yes! A ${round.label} ${round.answer}.` : `Yes! A ${round.label} is ${round.answer}.`, { hold: 1500 });
    } else {
      flow.missOn(option.id, round.kind === 'move'
        ? `Think: does a ${round.label} have a curved side or a flat side?`
        : `Look at the ${round.label}'s shape again.`);
    }
  }
  // ---------------------------------------------------------------------

  const rolls = CURVED.includes(round.answer);
  const compact = width < 360;
  const stageW = Math.min(width - 40, 320);

  const rock = idle.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });
  const transform = [
    { translateX: go.interpolate({ inputRange: [0, 1], outputRange: [0, stageW * 0.62] }) },
    { translateY: go.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) },
    { rotate: go.interpolate({ inputRange: [0, 1], outputRange: ['0deg', rolls ? '720deg' : '12deg'] }) },
  ];

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={prompt}>
      {/* THE RAMP -------------------------------------------------------- */}
      <View style={[styles.stage, { width: stageW, height: compact ? 172 : 190 }]}>
        <Animated.View style={[styles.objectWrap, { transform }]}>
          <Animated.Text style={[styles.object, compact && { fontSize: 54 }, { transform: [{ rotate: rock }] }]}>
            {round.emoji}
          </Animated.Text>
        </Animated.View>

        {/* Wooden ramp with a lit top edge and a shaded underside. */}
        <LinearGradient
          colors={['#E4C49B', '#C69C6D']}
          style={[styles.ramp, { width: stageW + 40 }]}
        >
          <View style={styles.rampTop} pointerEvents="none" />
          <View style={styles.rampUnder} pointerEvents="none" />
        </LinearGradient>

        {/* Floor and stop block, so the run visibly ends somewhere. */}
        <View style={[styles.floor, { width: stageW }]} pointerEvents="none" />
        <View style={styles.stopBlock} pointerEvents="none" />
      </View>

      {/* THE CONTACT PATCH — the rule, drawn. --------------------------- */}
      <View style={styles.patchRow}>
        <Text style={styles.patchLabel}>touches the ground</Text>
        <View style={styles.patchBox}>
          {rolls ? (
            <>
              <View style={styles.patchCurve} />
              <View style={styles.patchPoint} />
            </>
          ) : (
            <>
              <View style={styles.patchFlatBody} />
              <View style={styles.patchFlatLine} />
            </>
          )}
        </View>
        <Text style={styles.patchHint}>{rolls ? 'one point' : 'a flat side'}</Text>
      </View>

      <View style={styles.options}>
        {round.options.map((option) => (
          <Choice
            key={option.id}
            flow={flow}
            id={option.id}
            isAnswer={option.id === round.answer}
            onPress={() => pick(option)}
            style={[styles.option, compact && { width: 116, height: 110 }]}
            accessibilityLabel={option.label}
          >
            <GameObject id={option.id} emoji={option.emoji} size={40} accessibilityLabel={option.label} />
            <Text style={styles.optionLabel}>{option.label}</Text>
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { justifyContent: 'flex-end', overflow: 'hidden' },
  objectWrap: { position: 'absolute', left: 20, top: 30, zIndex: 2 },
  object: { fontSize: 60 },

  ramp: {
    height: 16, marginLeft: -14, marginBottom: 40, borderRadius: 8,
    transform: [{ rotate: '12deg' }],
    shadowColor: '#7A5730', shadowOpacity: 0.3, shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  rampTop: {
    position: 'absolute', left: 0, right: 0, top: 0, height: 3,
    borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)',
  },
  rampUnder: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 5,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    backgroundColor: 'rgba(94,64,24,0.24)',
  },
  floor: {
    position: 'absolute', bottom: 18, left: 0, height: 4, borderRadius: 3,
    backgroundColor: withAlpha('#8B86B8', 0.3),
  },
  stopBlock: {
    position: 'absolute', bottom: 20, right: 6, width: 10, height: 26,
    borderRadius: 3, backgroundColor: '#C69C6D',
  },

  patchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: llRadius.pill,
    backgroundColor: withAlpha('#FFFFFF', 0.7),
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
  },
  patchLabel: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 9, letterSpacing: 1.1,
    color: ll.muted, textTransform: 'uppercase',
  },
  patchBox: { width: 34, height: 26, alignItems: 'center', justifyContent: 'flex-end' },
  patchCurve: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2.5, borderColor: ll.blue, backgroundColor: withAlpha(ll.blue, 0.12),
  },
  patchPoint: {
    width: 5, height: 3, borderRadius: 2, marginTop: 1, backgroundColor: ll.pink,
  },
  patchFlatBody: {
    width: 22, height: 16, borderRadius: 3,
    borderWidth: 2.5, borderColor: ll.blue, backgroundColor: withAlpha(ll.blue, 0.12),
  },
  patchFlatLine: { width: 24, height: 3, borderRadius: 2, marginTop: 1, backgroundColor: ll.pink },
  patchHint: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 13, color: ll.blueDeep },

  options: { flexDirection: 'row', gap: 16, marginTop: 18 },
  option: { width: 130, height: 118, borderRadius: llRadius.xl },
  optionLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.ink },
});
