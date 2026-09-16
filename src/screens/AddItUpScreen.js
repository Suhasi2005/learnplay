import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { PROBLEMS, buildRound } from '../addItUpData';
import { useSound } from '../context/SoundContext';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import GameObject from '../ll/objects';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../ll/tokens';

// "Add It Up" — Addition (Grade 1).
//
// Two groups of objects; how many altogether.
//
// The old version wrapped each group into a free-flowing cluster, so "4 + 5"
// was two similar-looking blobs and the only route to the answer was counting
// every object one at a time. That's the slowest possible strategy and the
// screen was enforcing it.
//
// Each group now sits in its own **tray with a five-line**: the first five
// slots, then a visible divider, then the rest. A group of 7 reads as "a full
// five and two more" at a glance. This is the single most useful thing an
// addition screen can do, because it's what lets a child move from counting
// to *seeing* — 4 + 5 becomes "a five and a four", and later, a fact they
// know.
//
// The trays sit on a workbench and the equation is written underneath in
// numerals, so the objects and the arithmetic are the same statement twice.
const WRONG_ATTEMPTS_BEFORE_HINT = 2;

// A group of objects in a slotted tray, with the five-boundary marked.
function Tray({ emoji, count, cell = 20, tone = 'blue' }) {
  const tint = tone === 'blue' ? ll.blue : ll.purple;
  const deep = tone === 'blue' ? ll.blueDeep : ll.purpleDeep;
  const soft = tone === 'blue' ? ll.blueSoft : ll.purpleSoft;
  // Always render ten slots so both trays are the same size and the
  // comparison is honest.
  return (
    <View style={[styles.tray, { borderColor: withAlpha(deep, 0.3), backgroundColor: soft }]}>
      <View style={styles.trayRows}>
        {[0, 1].map((row) => (
          <View key={row} style={styles.trayRow}>
            {Array.from({ length: 5 }, (_, col) => {
              const n = row * 5 + col;
              const filled = n < count;
              return (
                <View
                  key={col}
                  style={[
                    styles.slot,
                    { width: cell, height: cell },
                    filled
                      ? { backgroundColor: withAlpha(tint, 0.22), borderColor: withAlpha(deep, 0.42) }
                      : styles.slotEmpty,
                  ]}
                >
                  {filled ? <GameObject emoji={emoji} size={cell * 0.76} /> : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>
      {/* The count, printed on the tray. */}
      <View style={[styles.trayPlate, { backgroundColor: withAlpha(deep, 0.14) }]}>
        <Text style={[styles.trayCount, { color: deep }]}>{count}</Text>
      </View>
    </View>
  );
}

export default function AddItUpScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'g1-ma-addition';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongOption, setWrongOption] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // Presentation-only: fills the answer box once solved.
  const [solved, setSolved] = useState(false);

  const round = useMemo(() => buildRound(index), [index]);
  const equationIn = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef(null);
  const { width } = useWindowDimensions();

  const isMounted = useRef(true);
  const advanceTimeout = useRef(null);
  const wrongTimeout = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (advanceTimeout.current) clearTimeout(advanceTimeout.current);
      if (wrongTimeout.current) clearTimeout(wrongTimeout.current);
    };
  }, []);

  useEffect(() => {
    setWrongAttempts(0);
    setSolved(false);
    hintPulse.setValue(0);
    equationIn.setValue(0);
    Animated.spring(equationIn, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }).start();
    speak(`${round.a} plus ${round.b}. How many altogether?`, { rate: 0.9, pitch: 1.15 });
  }, [index]);

  useEffect(() => {
    if (wrongAttempts >= WRONG_ATTEMPTS_BEFORE_HINT) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(hintPulse, { toValue: 1, duration: 500, useNativeDriver: false }),
          Animated.timing(hintPulse, { toValue: 0, duration: 500, useNativeDriver: false }),
        ]),
      ).start();
    }
  }, [wrongAttempts]);

  function triggerShake() {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function triggerPop() {
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  }

  // ---------------------------------------------------------------------
  // Unchanged answer logic.
  function handleAnswer(optionValue) {
    if (showCelebration || isProcessing) return;

    if (optionValue === round.sum) {
      setIsProcessing(true);
      setSolved(true);
      const newStars = stars + 1;
      const newStreak = streak + 1;
      setStars(newStars);
      setStreak(newStreak);
      setShowCelebration(true);
      triggerPop();
      confettiRef.current?.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSuccess();
      speak(`Yes! ${round.a} plus ${round.b} is ${round.sum}!`, { rate: 0.95, pitch: 1.15 });
      saveProgress(GAME_ID, index + 1, newStars);

      advanceTimeout.current = setTimeout(() => {
        if (!isMounted.current) return;
        setShowCelebration(false);
        setIsProcessing(false);
        if (index + 1 < PROBLEMS.length) {
          setIndex((i) => i + 1);
        } else {
          navigation.replace('Completion', {
            gameId: GAME_ID,
            stars: newStars,
            total: PROBLEMS.length,
            replayScreen: 'AddItUp',
            title: 'Addition Ace!',
            subtitle: `You solved all ${PROBLEMS.length} problems!`,
          });
        }
      }, 1500);
    } else {
      setWrongOption(optionValue);
      setStreak(0);
      setWrongAttempts((n) => n + 1);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playWrong();
      speak('Try again!', { rate: 0.95, pitch: 1.15 });

      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongOption(null);
      }, 400);
    }
  }
  // ---------------------------------------------------------------------

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });
  const hintGlow = hintPulse.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const equationScale = equationIn.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const secondGroupIn = equationIn.interpolate({ inputRange: [0, 1], outputRange: [36, 0] });

  const compact = width < 360;
  const cell = compact ? 17 : 20;

  return (
    <LinearGradient colors={['#EDF3FF', '#F2EEFC', '#FFF4F8']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Addition" bg={ll.blueSoft} color={ll.blueDeep} style={styles.titlePill} />
        <StarChip count={stars} />
      </View>

      <View style={styles.streakWrap}>
        <StreakBadge streak={streak} />
      </View>

      <View style={styles.progressRow}>
        {PROBLEMS.map((_, i) => (
          <View key={i} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      {/* THE WORKBENCH — two trays, grouped in fives. ------------------ */}
      <View style={styles.benchCast}>
        <LinearGradient colors={['#E4CFAE', '#CDB086']} style={styles.bench}>
          <Sheen variant="tile" radius={llRadius.xl} />

          <Animated.View style={[styles.trayRowWrap, { transform: [{ scale: equationScale }], opacity: equationIn }]}>
            <Tray emoji={round.emoji} count={round.a} cell={cell} tone="blue" />
            <Text style={styles.operator}>+</Text>
            <Animated.View style={{ transform: [{ translateX: secondGroupIn }] }}>
              <Tray emoji={round.emoji} count={round.b} cell={cell} tone="purple" />
            </Animated.View>
          </Animated.View>

          {/* The same statement in numerals, underneath the objects. */}
          <View style={styles.sumRow}>
            <Text style={styles.sumNum}>{round.a}</Text>
            <Text style={styles.sumOp}>+</Text>
            <Text style={styles.sumNum}>{round.b}</Text>
            <Text style={styles.sumOp}>=</Text>
            <View style={[styles.answerBox, solved && styles.answerBoxOk]}>
              <Text style={[styles.answerText, solved && { color: ll.white }]}>
                {solved ? round.sum : '?'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <Text style={styles.prompt}>How many altogether?</Text>

      <View style={styles.grid}>
        {round.options.map((optionValue, i) => {
          const isWrong = wrongOption === optionValue;
          const isHintTarget = wrongAttempts >= WRONG_ATTEMPTS_BEFORE_HINT && optionValue === round.sum;
          return (
            <Animated.View
              key={`${optionValue}-${i}`}
              style={[
                isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined,
                isHintTarget && {
                  shadowColor: ll.amber, shadowOpacity: hintGlow, shadowRadius: 16, shadowOffset: { width: 0, height: 0 },
                },
              ]}
            >
              <Pressable
                onPress={() => handleAnswer(optionValue)}
                disabled={isProcessing || showCelebration}
                accessibilityRole="button"
                accessibilityLabel={`Answer ${optionValue}`}
                style={({ pressed }) => [
                  styles.tileCast,
                  isHintTarget && { shadowColor: ll.amber, shadowOpacity: 0.5 },
                  isWrong && { shadowColor: ll.pink, shadowOpacity: 0.4 },
                  pressed && { transform: [{ translateY: 2 }, { scale: 0.96 }] },
                ]}
              >
                <LinearGradient
                  colors={llSurface.whiteBlue}
                  style={[
                    styles.tile,
                    { width: compact ? 68 : 76, height: compact ? 68 : 76 },
                    isWrong ? styles.tileWrong : isHintTarget ? styles.tileHint : llRing.faint,
                  ]}
                >
                  <Sheen variant="tile" radius={llRadius.md} />
                  <TopHighlight radius={llRadius.md} />
                  <Text style={[styles.tileText, compact && { fontSize: 26 }]}>{optionValue}</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Mascot mood="cheer" size={78} />
          <Animated.Text style={[styles.celebrationSum, { transform: [{ scale: popScale }] }]}>
            {round.a} + {round.b} = {round.sum}
          </Animated.Text>
        </View>
      )}

      <ConfettiCannon ref={confettiRef} count={40} origin={{ x: width / 2, y: 0 }} autoStart={false} fadeOut fallSpeed={2500} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', marginTop: 54 },
  titlePill: { flex: 1, alignSelf: 'center' },
  streakWrap: { alignSelf: 'flex-end', marginTop: 8, minHeight: 4 },

  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 10, maxWidth: 260 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ll.lilac },
  dotDone: { backgroundColor: ll.green },
  dotActive: { backgroundColor: ll.blue, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: ll.white },

  benchCast: {
    marginTop: 14, borderRadius: llRadius.xl, alignSelf: 'stretch',
    shadowColor: '#8A5E34', shadowOpacity: 0.3, shadowRadius: 24,
    shadowOffset: { width: 0, height: 13 }, elevation: 9,
  },
  bench: {
    borderRadius: llRadius.xl, paddingVertical: 14, paddingHorizontal: 12,
    alignItems: 'center', overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)',
  },
  trayRowWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Ten slots per tray, so both groups are the same size on screen.
  tray: {
    borderRadius: 12, padding: 6, borderWidth: 2, alignItems: 'center',
  },
  trayRows: { gap: 3 },
  trayRow: { flexDirection: 'row', gap: 3 },
  slot: {
    borderRadius: 5, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  slotEmpty: {
    backgroundColor: 'rgba(255,255,255,0.4)', borderColor: 'rgba(139,134,184,0.28)',
  },
  trayPlate: {
    marginTop: 5, minWidth: 30, paddingVertical: 1, paddingHorizontal: 8, borderRadius: 7,
    alignItems: 'center',
  },
  trayCount: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17 },

  operator: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#6B4A28',
    textShadowColor: 'rgba(255,255,255,0.5)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 },
  },

  sumRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
    paddingVertical: 6, paddingHorizontal: 16, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  sumNum: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.ink },
  sumOp: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: ll.muted },
  answerBox: {
    minWidth: 42, paddingVertical: 2, paddingHorizontal: 10, borderRadius: 9,
    alignItems: 'center', backgroundColor: ll.blueSoft,
    borderWidth: 2, borderStyle: 'dashed', borderColor: withAlpha(ll.blue, 0.5),
  },
  answerBoxOk: { backgroundColor: ll.green, borderStyle: 'solid', borderColor: ll.greenDeep },
  answerText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.blueDeep },

  prompt: { ...llType.h4, color: ll.ink, marginTop: 16, marginBottom: 16, textAlign: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 11, maxWidth: 340 },
  tileCast: {
    borderRadius: llRadius.md,
    shadowColor: '#2F55A8', shadowOpacity: 0.22, shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 }, elevation: 5,
  },
  tile: {
    borderRadius: llRadius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  tileWrong: { borderWidth: 3, borderColor: '#FFB3C9' },
  tileHint: { borderWidth: 3, borderColor: ll.amber },
  tileText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 29, color: ll.ink },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationSum: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, lineHeight: 42, color: ll.greenDeep,
    marginTop: 8, textAlign: 'center', paddingHorizontal: 20,
  },
});
