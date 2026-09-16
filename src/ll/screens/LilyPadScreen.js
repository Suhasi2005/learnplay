import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Sheen, TopHighlight } from '../premium';
import GameFrame from '../games/GameFrame';
import { buildRound, GIVEN, PADS, TOTAL_ROUNDS } from '../games/lilyPadData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llType, withAlpha } from '../tokens';

// "Lily Pad Hop" — Skip Counting (Senior KG).
//
// Five pads across a pond, the first two numbered. The frog sits on the last
// known number; each correct pick numbers the next pad and the frog hops onto
// it. Three hops per pond, so the step gets said three times in a row.
//
// The teaching device is the step arc. Between every pair of pads there's a
// little hop-arc labelled "+2" (or +5, +10), drawn the whole time — so the
// thing being repeated is visible as a *shape* on the pond rather than a
// number the child has to hold in their head. Skip counting is a rhythm, and
// the arcs are that rhythm written down.
//
// Everything else serves the pond: the frog travels with eased take-off and
// landing, lands with a ripple, and the water has moving light on it.
export default function LilyPadScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'sk-ma-skipcount', subjectId: 'Math', standardId: 'Senior KG', title: 'Skip Counting' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);

  // Pads scale to the screen so five never overflow a small phone.
  const geo = useMemo(() => {
    const avail = Math.min(width, 620) - 56;
    const gap = width < 360 ? 6 : 8;
    const pad = Math.min(56, Math.floor((avail - gap * (PADS - 1)) / PADS));
    return { pad, gap, frog: Math.round(pad * 0.7), rowW: pad * PADS + gap * (PADS - 1) };
  }, [width]);

  const padX = (i) => i * (geo.pad + geo.gap) + (geo.pad - geo.frog) / 2;

  const [hop, setHop] = useState(0);
  const [wrongPick, setWrongPick] = useState(null);
  const [splashAt, setSplashAt] = useState(null);
  const frogX = useRef(new Animated.Value(padX(GIVEN - 1))).current;
  const frogY = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  const current = round.hops[hop];
  const revealed = GIVEN + hop; // pads [0, revealed) show their numbers

  useEffect(() => {
    setHop(0);
    setWrongPick(null);
    setSplashAt(null);
    frogX.setValue(padX(GIVEN - 1));
    frogY.setValue(0);
    flow.say(`Count by ${round.step}s. ${round.sequence[0]}, ${round.sequence[1]}, what comes next?`);
  }, [flow.index]);

  // Light moving on the water.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ---------------------------------------------------------------------
  // Unchanged hop logic; richer animation, identical timing.
  function jumpTo(pad) {
    Animated.parallel([
      Animated.timing(frogX, { toValue: padX(pad), duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(frogY, { toValue: -30, duration: 210, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(frogY, { toValue: 0, duration: 210, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
    // A ripple where he lands, once he's down.
    flow.later(() => setSplashAt(pad), 400);
  }

  function handlePick(n) {
    if (flow.isProcessing || !current) return;
    if (n === current.answer) {
      jumpTo(current.pad);
      if (hop === round.hops.length - 1) {
        setHop(hop + 1);
        flow.succeed(`Counting by ${round.step}s: ${round.sequence.join(', ')}!`, { hold: 1900 });
      } else {
        setHop(hop + 1);
        flow.cheer(`${n}!`);
      }
    } else {
      setWrongPick(n);
      flow.miss(`Hop on by ${round.step}. Try again!`);
      flow.later(() => setWrongPick(null), 420);
    }
  }
  // ---------------------------------------------------------------------

  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-30, 30] });
  const compact = width < 360;
  const optionSize = compact ? 76 : 88;

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt="Help the frog hop across!">
      <View style={styles.stepCast}>
        <LinearGradient colors={['#FFFFFF', '#EEF5FF']} style={[styles.stepChip, llRing.faint]}>
          <TopHighlight radius={llRadius.pill} />
          <Text style={styles.stepText}>Counting by {round.step}s</Text>
        </LinearGradient>
      </View>

      {/* THE POND -------------------------------------------------------- */}
      <View style={styles.pondCast}>
        <LinearGradient colors={['#CFE6FC', '#A9CFF5']} style={styles.pond}>
          {/* Water: shifting light, still ripples, reeds at the edge. */}
          <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerX }, { rotate: '12deg' }] }]} pointerEvents="none" />
          <View style={[styles.ripple, { top: 30, left: 24, width: 54 }]} pointerEvents="none" />
          <View style={[styles.ripple, { bottom: 22, right: 30, width: 40 }]} pointerEvents="none" />
          <View style={styles.reed} pointerEvents="none" />
          <View style={[styles.reed, styles.reed2]} pointerEvents="none" />

          <View style={[styles.padRow, { width: geo.rowW, gap: geo.gap }]}>
            {round.sequence.map((value, i) => {
              const shown = i < revealed;
              const isNext = i === revealed && current;
              return (
                <View key={`${flow.index}-${i}`} style={{ width: geo.pad, alignItems: 'center' }}>
                  {/* A lily pad with veins, a notch and a shadow on the
                      water — not a flat circle. */}
                  <View style={[styles.padCast, { width: geo.pad, height: geo.pad }, shown && styles.padCastShown]}>
                    <LinearGradient
                      colors={shown ? [ll.greenLight, ll.greenDeep] : ['#A9DCBC', '#7FBF97']}
                      style={[
                        styles.pad,
                        { width: geo.pad, height: geo.pad, borderRadius: geo.pad / 2 },
                        isNext && styles.padNext,
                      ]}
                    >
                      <Sheen variant="tile" radius={geo.pad / 2} />
                      <View style={styles.vein} pointerEvents="none" />
                      <View style={[styles.vein, { transform: [{ rotate: '60deg' }] }]} pointerEvents="none" />
                      <View style={[styles.vein, { transform: [{ rotate: '-60deg' }] }]} pointerEvents="none" />
                      <View style={[styles.notch, { right: -1, top: geo.pad * 0.42 }]} pointerEvents="none" />
                      <Text style={[styles.padText, !shown && styles.padUnknown]}>
                        {shown ? value : isNext ? '?' : ''}
                      </Text>
                    </LinearGradient>
                  </View>
                  {splashAt === i ? <Ripple key={`sp-${flow.index}-${i}`} size={geo.pad} /> : null}
                </View>
              );
            })}

            {/* The step arcs — the rhythm of the count, drawn on the pond. */}
            {round.sequence.slice(0, -1).map((_, i) => (
              <View
                key={`arc-${i}`}
                style={[styles.arcWrap, { left: padX(i) + geo.frog / 2, width: geo.pad + geo.gap, top: -26 }]}
                pointerEvents="none"
              >
                <View style={[styles.arc, { width: geo.pad + geo.gap - 10 }]} />
                <Text style={styles.arcLabel}>+{round.step}</Text>
              </View>
            ))}

            <Animated.Text
              style={[
                styles.frog,
                { width: geo.frog, fontSize: geo.pad * 0.62, top: -geo.pad * 0.78 },
                { transform: [{ translateX: frogX }, { translateY: frogY }] },
              ]}
            >
              🐸
            </Animated.Text>
          </View>
        </LinearGradient>
      </View>

      {/* THE CHOICES — floating leaf pads. ------------------------------- */}
      <View style={styles.options}>
        {(current?.options ?? []).map((n) => {
          const isWrong = wrongPick === n;
          const isHint = flow.hinting && n === current.answer;
          return (
            <Animated.View key={`${flow.index}-${hop}-${n}`} style={isWrong ? { transform: [{ translateX: flow.shakeX }] } : undefined}>
              <Pressable
                onPress={() => handlePick(n)}
                disabled={flow.isProcessing}
                accessibilityRole="button"
                accessibilityLabel={`${n}`}
                style={({ pressed }) => [
                  styles.optionCast,
                  isHint && styles.optionCastHint,
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#EFFAF3']}
                  style={[styles.option, { width: optionSize, height: optionSize, borderRadius: optionSize / 2 }, isHint && styles.hint]}
                >
                  <Sheen variant="tile" radius={optionSize / 2} />
                  <TopHighlight radius={optionSize / 2} />
                  <Text style={styles.optionLeaf}>🍃</Text>
                  <Text style={styles.optionText}>{n}</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </GameFrame>
  );
}

// An expanding ring where the frog lands.
function Ripple({ size }) {
  const v = useRef(new Animated.Value(0)).current;
  const started = useRef(false);
  if (!started.current) {
    started.current = true;
    Animated.timing(v, { toValue: 1, duration: 760, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.7] });
  const opacity = v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.6, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', bottom: -6, width: size, height: size * 0.4,
        borderRadius: size, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)',
        opacity, transform: [{ scale }],
      }}
    />
  );
}

const styles = StyleSheet.create({
  stepCast: {
    borderRadius: llRadius.pill,
    shadowColor: '#6054BE', shadowOpacity: 0.14, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  stepChip: { borderRadius: llRadius.pill, paddingVertical: 7, paddingHorizontal: 18, overflow: 'hidden' },
  stepText: { ...llType.cardTitle, color: ll.blueInk },

  pondCast: {
    alignSelf: 'stretch', marginTop: 22, borderRadius: llRadius.screen,
    shadowColor: '#3B6BA8', shadowOpacity: 0.28, shadowRadius: 34,
    shadowOffset: { width: 0, height: 18 }, elevation: 10,
  },
  pond: {
    alignItems: 'center', paddingTop: 62, paddingBottom: 28, overflow: 'hidden',
    borderRadius: llRadius.screen, borderWidth: 4, borderColor: '#95C2EE',
  },
  shimmer: {
    position: 'absolute', top: 0, bottom: 0, left: '30%', width: 90,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  ripple: { position: 'absolute', height: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  reed: {
    position: 'absolute', bottom: 0, left: 14, width: 4, height: 40,
    borderRadius: 3, backgroundColor: withAlpha('#3F9A6C', 0.5),
  },
  reed2: { left: 24, height: 28 },

  padRow: { flexDirection: 'row' },
  padCast: {
    borderRadius: 60,
    shadowColor: '#1E4A7A', shadowOpacity: 0.3, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },
  padCastShown: { shadowColor: ll.greenDeep, shadowOpacity: 0.45, shadowRadius: 14 },
  pad: {
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderBottomWidth: 3, borderBottomColor: withAlpha('#2F7A54', 0.5),
  },
  padNext: { borderWidth: 3, borderColor: ll.amber },
  vein: { position: 'absolute', width: 1.5, height: '62%', backgroundColor: 'rgba(255,255,255,0.28)' },
  notch: {
    position: 'absolute', width: 10, height: 10, borderRadius: 2,
    backgroundColor: '#A9CFF5', transform: [{ rotate: '45deg' }],
  },
  padText: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, lineHeight: 24, color: ll.white,
    textShadowColor: 'rgba(20,60,40,0.3)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },
  padUnknown: { color: '#FFF4D6' },

  arcWrap: { position: 'absolute', alignItems: 'center' },
  arc: {
    height: 16, borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)', borderTopLeftRadius: 14, borderTopRightRadius: 14,
    borderStyle: 'dashed',
  },
  arcLabel: { marginTop: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 10, color: ll.white, opacity: 0.9 },

  frog: { position: 'absolute', left: 0, textAlign: 'center' },

  options: { flexDirection: 'row', gap: 14, marginTop: 28 },
  optionCast: {
    borderRadius: 50,
    shadowColor: ll.greenDeep, shadowOpacity: 0.3, shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 }, elevation: 5,
  },
  optionCastHint: { shadowColor: ll.amber, shadowOpacity: 0.6, shadowRadius: 20 },
  option: {
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 3, borderColor: ll.greenLight,
  },
  optionLeaf: { fontSize: 14, position: 'absolute', top: 9 },
  optionText: { ...llType.h2, color: ll.greenDeep, marginTop: 7 },
  hint: { borderColor: ll.amber },
});
