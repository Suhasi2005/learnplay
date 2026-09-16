import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { TOTAL_ROUNDS, buildRound } from '../multiplicationData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import GameObject from '../ll/objects';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../ll/tokens';

// "Groups Of" — Multiplication (Grade 1).
//
// N groups of M; how many in all.
//
// The old layout wrapped the groups into a flowing row, so "3 groups of 4"
// could land as a ragged 2-then-1 arrangement — which destroys the one thing
// that makes early multiplication legible. Groups of equal size laid out in
// **equal rows** form a rectangle, and a rectangle can be counted two ways:
// along the rows, or along the columns. That's not decoration, it's the
// commutative property made visible, and it's why arrays are the standard
// tool for teaching this.
//
// So each group is now a row in a stacked array, with the row count down one
// side and the per-group count along the top. The child can read 3 × 4 off
// the edges of the shape instead of counting twelve objects.
//
// The equation underneath gives the same statement in numerals, and the
// answer box stays a dashed socket until solved.
const WRONG_ATTEMPTS_BEFORE_HINT = 2;

export default function GroupsOfScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'g1-ma-multiplication';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongOption, setWrongOption] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [solved, setSolved] = useState(false);

  const round = useMemo(() => buildRound(index), [index]);
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
    speak(`${round.groups} groups of ${round.perGroup}. How many in all?`, { rate: 0.9, pitch: 1.15 });
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
  function handleAnswer(option) {
    if (showCelebration || isProcessing) return;

    if (option === round.total) {
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
      speak(`Yes! ${round.groups} groups of ${round.perGroup} is ${round.total}!`, { rate: 0.95, pitch: 1.15 });
      saveProgress(GAME_ID, index + 1, newStars);

      advanceTimeout.current = setTimeout(() => {
        if (!isMounted.current) return;
        setShowCelebration(false);
        setIsProcessing(false);
        if (index + 1 < TOTAL_ROUNDS) {
          setIndex((i) => i + 1);
        } else {
          navigation.replace('Completion', {
            gameId: GAME_ID,
            stars: newStars,
            total: TOTAL_ROUNDS,
            replayScreen: 'GroupsOf',
            title: 'Grouping Genius!',
            subtitle: `You solved every group!`,
          });
        }
      }, 1500);
    } else {
      setWrongOption(option);
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

  const compact = width < 360;
  // Cell size derives from the widest row so any N × M array fits.
  const cell = Math.max(20, Math.min(compact ? 26 : 30, (Math.min(width, 520) - 120) / round.perGroup));

  return (
    <LinearGradient colors={['#EDF7F0', '#F2F0FC', '#FFF5EE']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Multiplication" bg={ll.blueSoft} color={ll.blueDeep} style={styles.titlePill} />
        <StarChip count={stars} />
      </View>

      <View style={styles.streakWrap}>
        <StreakBadge streak={streak} />
      </View>

      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <View key={i} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      <Text style={styles.prompt}>
        {round.groups} groups of {round.perGroup}
      </Text>

      {/* THE ARRAY — equal rows, so the rectangle can be read. --------- */}
      <View style={styles.arrayCast}>
        <LinearGradient colors={llSurface.white} style={[styles.arrayCard, llRing.faint]}>
          <TopHighlight radius={llRadius.xl} />

          {/* Per-group count along the top. */}
          <View style={styles.topAxis}>
            <View style={{ width: 26 }} />
            <View style={[styles.axisBar, { width: cell * round.perGroup }]}>
              <Text style={styles.axisText}>{round.perGroup} in each group</Text>
            </View>
          </View>

          <View style={styles.arrayBody}>
            {/* Row count down the side. */}
            <View style={styles.sideAxis}>
              <View style={[styles.axisBarV, { height: cell * round.groups + (round.groups - 1) * 6 }]}>
                <Text style={styles.axisTextV}>{round.groups}</Text>
              </View>
            </View>

            <View style={styles.rows}>
              {Array.from({ length: round.groups }).map((_, g) => (
                <View key={g} style={[styles.row, { height: cell }]}>
                  {Array.from({ length: round.perGroup }).map((_, i) => (
                    <View key={i} style={[styles.cell, { width: cell, height: cell }]}>
                      <GameObject emoji={round.emoji} size={cell * 0.74} />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* The same statement, in numerals. */}
          <View style={styles.sumRow}>
            <Text style={styles.sumNum}>{round.groups}</Text>
            <Text style={styles.sumOp}>×</Text>
            <Text style={styles.sumNum}>{round.perGroup}</Text>
            <Text style={styles.sumOp}>=</Text>
            <View style={[styles.answerBox, solved && styles.answerBoxOk]}>
              <Text style={[styles.answerText, solved && { color: ll.white }]}>
                {solved ? round.total : '?'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.grid}>
        {round.options.map((option, i) => {
          const isWrong = wrongOption === option;
          const isHintTarget = wrongAttempts >= WRONG_ATTEMPTS_BEFORE_HINT && option === round.total;
          return (
            <Animated.View
              key={`${option}-${i}`}
              style={[
                isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined,
                isHintTarget && {
                  shadowColor: ll.amber, shadowOpacity: hintGlow, shadowRadius: 16, shadowOffset: { width: 0, height: 0 },
                },
              ]}
            >
              <Pressable
                onPress={() => handleAnswer(option)}
                disabled={isProcessing || showCelebration}
                accessibilityRole="button"
                accessibilityLabel={`Answer ${option}`}
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
                    { width: compact ? 68 : 74, height: compact ? 68 : 74 },
                    isWrong ? styles.tileWrong : isHintTarget ? styles.tileHint : llRing.faint,
                  ]}
                >
                  <Sheen variant="tile" radius={llRadius.md} />
                  <TopHighlight radius={llRadius.md} />
                  <Text style={[styles.tileText, compact && { fontSize: 24 }]}>{option}</Text>
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
            {round.groups} × {round.perGroup} = {round.total}
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

  prompt: { ...llType.h4, color: ll.ink, marginTop: 14, marginBottom: 14, textAlign: 'center' },

  arrayCast: {
    borderRadius: llRadius.xl, alignSelf: 'stretch',
    shadowColor: '#5442A8', shadowOpacity: 0.2, shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  arrayCard: {
    borderRadius: llRadius.xl, paddingVertical: 14, paddingHorizontal: 12,
    alignItems: 'center', overflow: 'hidden',
  },

  // Edge labels: the array is readable as N × M from its sides.
  topAxis: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  axisBar: {
    borderTopWidth: 2, borderTopColor: withAlpha(ll.blueDeep, 0.3),
    borderLeftWidth: 2, borderLeftColor: withAlpha(ll.blueDeep, 0.3),
    borderRightWidth: 2, borderRightColor: withAlpha(ll.blueDeep, 0.3),
    borderTopLeftRadius: 6, borderTopRightRadius: 6,
    alignItems: 'center', paddingTop: 2, paddingBottom: 3,
  },
  axisText: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 9, letterSpacing: 0.8,
    color: ll.blueDeep, textTransform: 'uppercase',
  },
  arrayBody: { flexDirection: 'row', alignItems: 'center' },
  sideAxis: { width: 26, alignItems: 'center' },
  axisBarV: {
    width: 20, justifyContent: 'center', alignItems: 'center',
    borderLeftWidth: 2, borderLeftColor: withAlpha(ll.purpleDeep, 0.35),
    borderTopWidth: 2, borderTopColor: withAlpha(ll.purpleDeep, 0.35),
    borderBottomWidth: 2, borderBottomColor: withAlpha(ll.purpleDeep, 0.35),
    borderTopLeftRadius: 6, borderBottomLeftRadius: 6,
  },
  axisTextV: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: ll.purpleDeep },

  rows: { gap: 6 },
  row: { flexDirection: 'row', gap: 0 },
  cell: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 5, margin: 0,
  },

  sumRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13,
    paddingVertical: 6, paddingHorizontal: 16, borderRadius: 12,
    backgroundColor: 'rgba(126,110,200,0.07)',
  },
  sumNum: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.ink },
  sumOp: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: ll.muted },
  answerBox: {
    minWidth: 44, paddingVertical: 2, paddingHorizontal: 10, borderRadius: 9,
    alignItems: 'center', backgroundColor: ll.blueSoft,
    borderWidth: 2, borderStyle: 'dashed', borderColor: withAlpha(ll.blue, 0.5),
  },
  answerBoxOk: { backgroundColor: ll.green, borderStyle: 'solid', borderColor: ll.greenDeep },
  answerText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.blueDeep },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 11, marginTop: 20, maxWidth: 340 },
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
  tileText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 27, color: ll.ink },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationSum: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 32, lineHeight: 40, color: ll.greenDeep,
    marginTop: 8, textAlign: 'center', paddingHorizontal: 20,
  },
});
