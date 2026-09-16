import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { TOTAL_ROUNDS, buildRound } from '../patternsData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import GameObject from '../ll/objects';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../ll/tokens';

// "What Comes Next?" — Patterns (Grade 1).
//
// A repeating sequence with the next item missing.
//
// The teaching change is the **repeat brackets**. A pattern is defined by its
// repeating unit, and the old screen showed the sequence as a flat row of
// tiles — so the child had to infer where the cycle began and ended before
// they could extend it. Now the repeat unit is detected from the sequence
// itself and each complete cycle is drawn under its own bracket, with the
// unit's length labelled. The pattern's *structure* is visible, which is the
// actual skill: "AB AB AB ?" is trivially answerable once you can see the
// groups.
//
// The sequence sits on a beaded string that continues past the gap, so the
// pattern reads as ongoing rather than as a row that stopped.

// Find the shortest repeating unit in a sequence. Purely presentational —
// it reads the round's own data and never feeds back into answer checking.
function repeatUnit(seq) {
  for (let len = 1; len <= Math.floor(seq.length / 2); len += 1) {
    let ok = true;
    for (let i = len; i < seq.length; i += 1) {
      if (seq[i] !== seq[i % len]) { ok = false; break; }
    }
    if (ok) return len;
  }
  return seq.length;
}

const WRONG_ATTEMPTS_BEFORE_HINT = 2;

export default function WhatComesNextScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'g1-ma-patterns';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongOption, setWrongOption] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filled, setFilled] = useState(null);

  const round = useMemo(() => buildRound(index), [index]);
  const unit = useMemo(() => repeatUnit(round.sequence), [round]);
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
    setFilled(null);
    hintPulse.setValue(0);
    speak('What comes next?', { rate: 0.95, pitch: 1.15 });
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
      speak('Yes! That comes next!', { rate: 0.95, pitch: 1.15 });
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
            replayScreen: 'WhatComesNext',
            title: 'Pattern Pro!',
            subtitle: `You completed all ${TOTAL_ROUNDS} patterns!`,
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

  const compact = width < 360;
  const total = round.sequence.length + 1;
  const bead = Math.max(34, Math.min(compact ? 40 : 46, (Math.min(width, 560) - 70) / total));
  // How many complete cycles are fully visible, for the brackets.
  const cycles = Math.floor(round.sequence.length / unit);

  return (
    <LinearGradient colors={['#F3EEFC', '#F7F1FF', '#FFF4EF']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Patterns" bg={ll.purpleSoft} color={ll.purpleDeep} style={styles.titlePill} />
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

      <Text style={styles.prompt}>What comes next?</Text>

      {/* THE PATTERN STRIP --------------------------------------------- */}
      <View style={styles.stripCast}>
        <LinearGradient colors={llSurface.white} style={[styles.strip, llRing.faint]}>
          <TopHighlight radius={llRadius.xl} />

          {/* The string the beads are threaded on, continuing past the gap. */}
          <View style={[styles.string, { width: bead * total + 12 }]} pointerEvents="none" />

          <View style={styles.beadRow}>
            {round.sequence.map((emoji, i) => (
              <View key={i} style={[styles.beadSlot, { width: bead, height: bead }]}>
                <View style={styles.beadFace}>
                  <GameObject emoji={emoji} size={bead * 0.62} />
                </View>
              </View>
            ))}

            {/* The gap. */}
            <View style={[styles.beadSlot, { width: bead, height: bead }]}>
              {filled ? (
                <View style={[styles.beadFace, styles.beadFilled]}>
                  <GameObject emoji={filled} size={bead * 0.62} />
                </View>
              ) : (
                <View style={styles.gapFace}>
                  <Text style={styles.gapMark}>?</Text>
                </View>
              )}
            </View>
          </View>

          {/* REPEAT BRACKETS — the unit, made visible. ----------------- */}
          <View style={[styles.bracketRow, { width: bead * total }]} pointerEvents="none">
            {Array.from({ length: cycles }, (_, c) => (
              <View key={c} style={[styles.bracket, { width: bead * unit }]}>
                <View style={styles.bracketBar} />
                <View style={styles.bracketTickLeft} />
                <View style={styles.bracketTickRight} />
              </View>
            ))}
          </View>
          <Text style={styles.unitLabel}>
            the pattern repeats every {unit} {unit === 1 ? 'item' : 'items'}
          </Text>
        </LinearGradient>
      </View>

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
                accessibilityLabel={`Option ${i + 1}`}
                style={({ pressed }) => [
                  styles.optionCast,
                  isHintTarget && { shadowColor: ll.amber, shadowOpacity: 0.5 },
                  isWrong && { shadowColor: ll.pink, shadowOpacity: 0.4 },
                  pressed && { transform: [{ translateY: 2 }, { scale: 0.96 }] },
                ]}
              >
                <LinearGradient
                  colors={llSurface.white}
                  style={[
                    styles.option,
                    { width: compact ? 82 : 90, height: compact ? 82 : 90 },
                    isWrong ? styles.optionWrong : isHintTarget ? styles.optionHint : llRing.faint,
                  ]}
                >
                  <Sheen variant="tile" radius={llRadius.lg} />
                  <TopHighlight radius={llRadius.lg} />
                  <GameObject emoji={option} size={compact ? 42 : 48} />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Mascot mood="cheer" size={78} />
          <Animated.View style={{ transform: [{ scale: popScale }] }}>
            <GameObject emoji={round.correct} size={90} />
          </Animated.View>
          <Text style={styles.celebrationText}>That's the pattern!</Text>
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
  dotActive: { backgroundColor: ll.purple, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: ll.white },

  prompt: { ...llType.h4, color: ll.ink, marginTop: 16, marginBottom: 16, textAlign: 'center' },

  stripCast: {
    borderRadius: llRadius.xl,
    shadowColor: '#5442A8', shadowOpacity: 0.2, shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  strip: {
    borderRadius: llRadius.xl, paddingVertical: 14, paddingHorizontal: 10,
    alignItems: 'center', overflow: 'hidden',
  },
  string: {
    position: 'absolute', top: 14 + 22, height: 3, borderRadius: 2,
    backgroundColor: withAlpha('#8B86B8', 0.4),
  },
  beadRow: { flexDirection: 'row' },
  beadSlot: { alignItems: 'center', justifyContent: 'center' },
  beadFace: {
    width: '84%', height: '84%', borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: ll.purpleTint,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#5442A8', shadowOpacity: 0.2, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  beadFilled: { backgroundColor: '#DFF4E8', borderColor: ll.green },
  gapFace: {
    width: '84%', height: '84%', borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderStyle: 'dashed', borderColor: ll.purple,
    backgroundColor: withAlpha(ll.purple, 0.09),
  },
  gapMark: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: ll.purpleDeep },

  // The repeating unit, bracketed — the structure of the pattern.
  bracketRow: { flexDirection: 'row', marginTop: 6, height: 10 },
  bracket: { justifyContent: 'flex-start' },
  bracketBar: {
    height: 2.5, borderRadius: 2, marginHorizontal: 4,
    backgroundColor: withAlpha(ll.purpleDeep, 0.45),
  },
  bracketTickLeft: {
    position: 'absolute', left: 4, top: 0, width: 2.5, height: 8,
    borderRadius: 2, backgroundColor: withAlpha(ll.purpleDeep, 0.45),
  },
  bracketTickRight: {
    position: 'absolute', right: 4, top: 0, width: 2.5, height: 8,
    borderRadius: 2, backgroundColor: withAlpha(ll.purpleDeep, 0.45),
  },
  unitLabel: {
    marginTop: 5, fontFamily: 'Nunito_800ExtraBold', fontSize: 9.5,
    letterSpacing: 0.9, color: ll.purpleDeep, textTransform: 'uppercase', opacity: 0.8,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 24, maxWidth: 340 },
  optionCast: {
    borderRadius: llRadius.lg,
    shadowColor: '#5442A8', shadowOpacity: 0.22, shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 }, elevation: 5,
  },
  option: {
    borderRadius: llRadius.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  optionWrong: { borderWidth: 3, borderColor: '#FFB3C9' },
  optionHint: { borderWidth: 3, borderColor: ll.amber },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.greenDeep, marginTop: 8 },
});
