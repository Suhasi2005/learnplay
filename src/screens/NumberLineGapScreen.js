import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { TOTAL_ROUNDS, buildRound } from '../numberLineData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, llType } from '../ll/tokens';

// "Number Line Gap" — Numbers 10 to 20 (Grade 1).
//
// A run of consecutive numbers with one missing. The old screen showed them
// as a row of loose tiles, which is a *list*: a child could only solve it by
// reciting, because nothing on screen said the numbers were spaced evenly
// along anything.
//
// It's a real number line now — a wooden ruler with tick marks, the numbers
// printed at their ticks, and a gap where one is missing. That's the whole
// lesson: a number line makes "what comes between 14 and 16" a question
// about *position*, answerable by looking, not by remembering. The gap is a
// visible notch in the ruler, so the child can see something is absent from
// a place rather than from a sequence.
//
// A marker hangs above the gap pointing down at it, so there's no ambiguity
// about which slot is being asked about.
const WRONG_ATTEMPTS_BEFORE_HINT = 2;

export default function NumberLineGapScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'g1-ma-num10to20';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongOption, setWrongOption] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // Presentation-only: fills the gap once solved.
  const [filled, setFilled] = useState(null);

  const round = useMemo(() => buildRound(index), [index]);
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
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
    setFilled(null);
    hintPulse.setValue(0);
    speak('What number is missing?', { rate: 0.95, pitch: 1.15 });
  }, [index]);

  // The marker nudges up and down so the gap is unmistakable.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

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

    if (option === round.correct) {
      setIsProcessing(true);
      setFilled(option);
      const newStars = stars + 1;
      const newStreak = streak + 1;
      setStars(newStars);
      setStreak(newStreak);
      setShowCelebration(true);
      triggerPop();
      confettiRef.current?.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSuccess();
      speak(`Yes! ${round.correct} goes there!`, { rate: 0.95, pitch: 1.15 });
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
            replayScreen: 'NumberLineGap',
            title: 'Number Line Ninja!',
            subtitle: `You filled every gap!`,
          });
        }
      }, 1400);
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
  const markerY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, 5] });

  const compact = width < 360;
  // Slot width derives from the run length so a 5- or 7-number line both fit.
  const slots = round.sequence.length;
  const slotW = Math.max(38, Math.min(compact ? 46 : 54, (Math.min(width, 560) - 74) / slots));

  return (
    <LinearGradient colors={['#EAF1FF', '#F1EDFC', '#FFF5EC']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Numbers 10 to 20" bg={ll.blueSoft} color={ll.blueDeep} style={styles.titlePill} />
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

      <Text style={styles.prompt}>What number is missing?</Text>

      {/* THE NUMBER LINE — a ruler, with ticks. ------------------------ */}
      <View style={styles.rulerCast}>
        <LinearGradient colors={['#F0D9B4', '#DCBB8C']} style={styles.ruler}>
          <Sheen variant="tile" radius={llRadius.md} />

          {/* Marker over the gap. */}
          <View style={[styles.markerRow, { width: slotW * slots }]} pointerEvents="none">
            {round.sequence.map((n, i) => (
              <View key={i} style={{ width: slotW, alignItems: 'center' }}>
                {n === null && !filled ? (
                  <Animated.View style={{ transform: [{ translateY: markerY }] }}>
                    <Text style={styles.marker}>▼</Text>
                  </Animated.View>
                ) : null}
              </View>
            ))}
          </View>

          {/* Printed numbers at their positions. */}
          <View style={styles.numbersRow}>
            {round.sequence.map((n, i) => {
              const isGap = n === null;
              const shown = isGap ? filled : n;
              return (
                <View key={i} style={[styles.slot, { width: slotW }]}>
                  {isGap && !filled ? (
                    <View style={styles.notch}>
                      <Text style={styles.notchMark}>?</Text>
                    </View>
                  ) : (
                    <View style={[styles.printed, isGap && styles.printedFilled]}>
                      <Text style={[styles.printedText, isGap && styles.printedTextFilled, compact && { fontSize: 16 }]}>
                        {shown}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* The line itself, with a tick under every number. */}
          <View style={[styles.line, { width: slotW * slots }]}>
            {round.sequence.map((_, i) => (
              <View key={i} style={{ width: slotW, alignItems: 'center' }}>
                <View style={styles.tick} />
              </View>
            ))}
          </View>
          <View style={[styles.rail, { width: slotW * slots }]} />

          {/* Half-ticks between the whole numbers, as on a real ruler. */}
          <View style={[styles.halfRow, { width: slotW * slots }]} pointerEvents="none">
            {round.sequence.map((_, i) => (
              <View key={i} style={{ width: slotW, alignItems: 'flex-end' }}>
                {i < slots - 1 ? <View style={styles.halfTick} /> : null}
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>

      {/* THE NUMBER TILES ---------------------------------------------- */}
      <View style={styles.grid}>
        {round.options.map((option, i) => {
          const isWrong = wrongOption === option;
          const isHintTarget = wrongAttempts >= WRONG_ATTEMPTS_BEFORE_HINT && option === round.correct;
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
                    { width: compact ? 66 : 74, height: compact ? 66 : 74 },
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
          <Animated.Text style={[styles.celebrationNum, { transform: [{ scale: popScale }] }]}>
            {round.correct}
          </Animated.Text>
          <Text style={styles.celebrationText}>That's the one!</Text>
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

  prompt: { ...llType.h4, color: ll.ink, marginTop: 18, marginBottom: 20, textAlign: 'center' },

  rulerCast: {
    borderRadius: llRadius.md,
    shadowColor: '#8A5E34', shadowOpacity: 0.3, shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  ruler: {
    borderRadius: llRadius.md, paddingTop: 6, paddingBottom: 12, paddingHorizontal: 10,
    alignItems: 'center', overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },

  markerRow: { flexDirection: 'row', height: 18 },
  marker: { fontSize: 13, color: ll.pinkDeep },

  numbersRow: { flexDirection: 'row' },
  slot: { alignItems: 'center' },
  printed: {
    width: '84%', height: 38, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(124,85,53,0.2)',
  },
  printedFilled: { backgroundColor: ll.greenLight, borderColor: ll.greenDeep },
  printedText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: '#5E3F27' },
  printedTextFilled: { color: ll.white },
  // The gap: a notch cut out of the ruler, not an empty list cell.
  notch: {
    width: '84%', height: 38, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(90,60,30,0.26)',
    borderWidth: 2, borderStyle: 'dashed', borderColor: ll.pinkDeep,
  },
  notchMark: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: ll.white },

  line: { flexDirection: 'row', marginTop: 4 },
  tick: { width: 2.5, height: 11, borderRadius: 2, backgroundColor: 'rgba(94,63,39,0.6)' },
  rail: { height: 3, borderRadius: 2, backgroundColor: 'rgba(94,63,39,0.55)', marginTop: -1 },
  halfRow: { flexDirection: 'row', marginTop: 1 },
  halfTick: { width: 2, height: 6, borderRadius: 1, backgroundColor: 'rgba(94,63,39,0.3)', marginRight: -1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 11, marginTop: 26, maxWidth: 340 },
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
  celebrationNum: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 86, lineHeight: 98, color: ll.blueDeep,
  },
  celebrationText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.greenDeep, marginTop: 4 },
});
