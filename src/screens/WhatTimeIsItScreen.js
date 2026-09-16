import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import ClockFace from '../components/ClockFace';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { TOTAL_ROUNDS, buildRound } from '../timeData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llType } from '../ll/tokens';

// "What Time Is It?" — Time (Senior KG).
//
// The existing ClockFace component draws the dial and hands; it is kept
// exactly as-is. What's new is everything around it.
//
// The clock is now housed in a mantel clock — a wooden case with a brass
// bezel, feet and a pendulum window. That matters because "reading a clock"
// is a skill about a physical object in a room, and a bare dial floating on
// a gradient is a diagram, not a clock.
//
// The answer tiles are the real teaching change. They're set in the clock's
// own numeral style — same face, same ink — and a small hand-shaped pointer
// sits on each. For o'clock times the whole skill is "which number is the
// short hand pointing at", so making the tiles look like the numbers *on the
// dial* closes the gap between the question and the answer instead of
// translating it into unrelated coloured buttons.
export default function WhatTimeIsItScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'sk-ma-time';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongOption, setWrongOption] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // Presentation-only: fills the digital readout once solved.
  const [solved, setSolved] = useState(false);

  const round = useMemo(() => buildRound(index), [index]);
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const swing = useRef(new Animated.Value(0)).current;
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
    setSolved(false);
    speak('What time does the clock show?', { rate: 0.95, pitch: 1.15 });
  }, [index]);

  // The pendulum ticks the whole time — a clock that isn't moving is stopped.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(swing, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(swing, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

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

    if (option === round.label) {
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
      speak(`Yes! It's ${round.label}!`, { rate: 0.95, pitch: 1.15 });
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
            replayScreen: 'WhatTimeIsIt',
            title: 'Time Teller!',
            subtitle: `You read every clock!`,
          });
        }
      }, 1400);
    } else {
      setWrongOption(option);
      setStreak(0);
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
  const pendulum = swing.interpolate({ inputRange: [0, 1], outputRange: ['-13deg', '13deg'] });

  const compact = width < 360;

  return (
    <LinearGradient colors={['#EAF2FF', '#F2EEFC', '#FFF6EE']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Time" bg={ll.blueSoft} color={ll.blueDeep} style={styles.titlePill} />
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

      <Text style={styles.prompt}>What time does the clock show?</Text>

      {/* THE MANTEL CLOCK ---------------------------------------------- */}
      <View style={styles.clockCast}>
        {/* Crown moulding. */}
        <LinearGradient colors={['#C79A70', '#A9784F']} style={styles.crown} />

        <LinearGradient colors={['#B9865C', '#96683F']} style={styles.case}>
          {/* Brass bezel holding the dial. */}
          <View style={styles.bezel}>
            <LinearGradient colors={['#FFE9A8', '#D6A94C']} style={styles.bezelRing}>
              <View style={styles.dial}>
                <ClockFace hour={round.hour} />
              </View>
              <Sheen variant="tile" radius={999} />
            </LinearGradient>
          </View>

          {/* Digital readout — blank until solved, so it never gives the
              answer away, and confirms it when earned. */}
          <View style={styles.readout}>
            <Text style={styles.readoutText}>{solved ? round.label : '— —'}</Text>
          </View>

          {/* Pendulum window. */}
          <View style={styles.window}>
            <Animated.View style={[styles.pendulumArm, { transform: [{ rotate: pendulum }] }]}>
              <View style={styles.pendulumRod} />
              <LinearGradient colors={['#FFE9A8', '#C08F26']} style={styles.pendulumBob} />
            </Animated.View>
          </View>
        </LinearGradient>

        {/* Feet. */}
        <View style={styles.feet}>
          <View style={styles.foot} />
          <View style={styles.foot} />
        </View>
      </View>

      {/* THE ANSWER TILES — in the clock's own numeral style. ---------- */}
      <View style={styles.grid}>
        {round.options.map((option) => {
          const isWrong = wrongOption === option;
          return (
            <Animated.View key={option} style={isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined}>
              <Pressable
                onPress={() => handleAnswer(option)}
                disabled={isProcessing || showCelebration}
                accessibilityRole="button"
                accessibilityLabel={option}
                style={({ pressed }) => [
                  styles.tileCast,
                  isWrong && { shadowColor: ll.pink, shadowOpacity: 0.4 },
                  pressed && { transform: [{ translateY: 2 }, { scale: 0.97 }] },
                ]}
              >
                <LinearGradient
                  colors={['#FFFDF6', '#F6EFDD']}
                  style={[
                    styles.tile,
                    { width: compact ? 84 : 92 },
                    isWrong ? styles.tileWrong : styles.tileRing,
                  ]}
                >
                  <TopHighlight radius={llRadius.md} />
                  {/* A short hand, echoing the dial's own pointer. */}
                  <View style={styles.handHint} pointerEvents="none" />
                  <Text style={styles.tileText} numberOfLines={1} adjustsFontSizeToFit>{option}</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Mascot mood="cheer" size={78} />
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: popScale }] }]}>🕐</Animated.Text>
          <Text style={styles.celebrationText}>It's {round.label}!</Text>
        </View>
      )}

      <ConfettiCannon ref={confettiRef} count={35} origin={{ x: width / 2, y: 0 }} autoStart={false} fadeOut fallSpeed={2400} />
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

  prompt: { ...llType.h4, color: ll.ink, marginTop: 12, marginBottom: 12, textAlign: 'center' },

  clockCast: {
    alignItems: 'center',
    shadowColor: '#5B3A1E', shadowOpacity: 0.34, shadowRadius: 26,
    shadowOffset: { width: 0, height: 15 }, elevation: 11,
  },
  crown: {
    width: 176, height: 13,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
  },
  case: {
    width: 164, alignItems: 'center', paddingTop: 12, paddingBottom: 10,
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
  },
  // Unused visual fallback kept out of the tree; see bezel below.
  bezel: {
    shadowColor: '#3A2410', shadowOpacity: 0.4, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
  bezelRing: {
    width: 128, height: 128, borderRadius: 64,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  dial: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#FFFDF6', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },

  readout: {
    marginTop: 9, paddingVertical: 3, paddingHorizontal: 12, borderRadius: 6,
    backgroundColor: 'rgba(30,18,8,0.5)', minWidth: 96, alignItems: 'center',
  },
  readoutText: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 1.4,
    color: '#FFE9A8',
  },

  window: {
    marginTop: 9, width: 62, height: 46, borderRadius: 7,
    backgroundColor: 'rgba(30,18,8,0.34)', overflow: 'hidden', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,233,168,0.3)',
  },
  pendulumArm: { alignItems: 'center' },
  pendulumRod: { width: 2.5, height: 26, backgroundColor: '#D6A94C' },
  pendulumBob: { width: 15, height: 15, borderRadius: 8, marginTop: -1 },

  feet: { flexDirection: 'row', gap: 96, marginTop: -2 },
  foot: { width: 20, height: 9, borderRadius: 4, backgroundColor: '#7C5535' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 20, maxWidth: 320 },
  tileCast: {
    borderRadius: llRadius.md,
    shadowColor: '#6054BE', shadowOpacity: 0.18, shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 }, elevation: 4,
  },
  tile: {
    height: 58, borderRadius: llRadius.md, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', paddingHorizontal: 8,
  },
  tileRing: { borderWidth: 1.5, borderColor: 'rgba(124,85,53,0.22)' },
  tileWrong: { borderWidth: 3, borderColor: '#FFB3C9' },
  // The little pointer that ties a tile to the dial's short hand.
  handHint: {
    position: 'absolute', top: 7, width: 2, height: 9,
    borderRadius: 2, backgroundColor: 'rgba(46,42,99,0.3)',
  },
  tileText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, color: '#4A3A22', marginTop: 5 },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 90 },
  celebrationText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.greenDeep, marginTop: 8 },
});
