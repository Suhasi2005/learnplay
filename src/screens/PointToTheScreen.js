import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { TOTAL_ROUNDS, buildRound } from '../bodyPartsData';
import { useSound } from '../context/SoundContext';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, llType } from '../ll/tokens';

// "Point to the…" — Parts of the Body (Junior KG).
//
// A part is named aloud and the child picks it. The old screen was a grid of
// six differently-coloured cards, which made the choice look like six
// unrelated buttons and gave the rainbow of card colours a meaning it didn't
// have.
//
// The environment is now a mirror. Pointing to a body part is something a
// child does at a mirror, and the frame turns an abstract grid into a place
// where that gesture belongs. The cards inside it are uniform — one surface,
// one colour — because the colours were never carrying information; the
// *shapes* are the answer, so nothing should compete with them.
//
// The prompt is also spoken, so this round works for a pre-reader: the part
// name is large, the pointing finger cues the action, and no card colour
// hints at anything.
export default function PointToTheScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'jk-ev-body';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongId, setWrongId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // Presentation-only.
  const [pickedId, setPickedId] = useState(null);

  const round = useMemo(() => buildRound(index), [index]);
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
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
    setPickedId(null);
    speak(`Point to the ${round.label.toLowerCase()}`, { rate: 0.95, pitch: 1.15 });
  }, [index]);

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

    if (option.id === round.correctId) {
      setIsProcessing(true);
      setPickedId(option.id);
      const newStars = stars + 1;
      const newStreak = streak + 1;
      setStars(newStars);
      setStreak(newStreak);
      setShowCelebration(true);
      triggerPop();
      confettiRef.current?.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSuccess();
      speak(`Yes! That's the ${option.label.toLowerCase()}!`, { rate: 0.95, pitch: 1.15 });
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
            replayScreen: 'PointToThe',
            title: 'Body Part Pro!',
            subtitle: `You found every part!`,
          });
        }
      }, 1400);
    } else {
      setWrongId(option.id);
      setStreak(0);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playWrong();
      speak('Try again!', { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongId(null);
      }, 400);
    }
  }
  // ---------------------------------------------------------------------

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });

  const compact = width < 360;
  const tile = compact ? 82 : 92;

  return (
    <LinearGradient colors={['#EFF7F1', '#F5F0FF', '#FFF4EC']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Parts of the Body" bg="#E3F5EA" color={ll.greenDeep} style={styles.titlePill} />
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

      {/* THE ASK ------------------------------------------------------- */}
      <View style={styles.askCast}>
        <LinearGradient colors={llSurface.white} style={[styles.ask, llRing.faint]}>
          <TopHighlight radius={llRadius.xl} />
          <Sheen variant="tile" radius={llRadius.xl} />
          <Text style={styles.askLead}>👉 Point to the</Text>
          <Text style={[styles.askTarget, compact && { fontSize: 28 }]}>{round.label}</Text>
        </LinearGradient>
      </View>

      {/* THE MIRROR — where pointing at yourself happens. -------------- */}
      <View style={styles.mirrorCast}>
        <LinearGradient colors={['#E6DCFA', '#CDBEF0']} style={styles.mirrorFrame}>
          <LinearGradient
            colors={['rgba(255,255,255,0.96)', 'rgba(240,246,255,0.88)']}
            style={styles.mirrorGlass}
          >
            {/* The diagonal sheen that makes glass read as glass. */}
            <LinearGradient
              colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.7, y: 0.8 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            <View style={styles.grid}>
              {round.options.map((option) => {
                const isWrong = wrongId === option.id;
                const isPicked = pickedId === option.id;
                return (
                  <Animated.View
                    key={option.id}
                    style={isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined}
                  >
                    <Pressable
                      onPress={() => handleAnswer(option)}
                      disabled={isProcessing || showCelebration}
                      accessibilityRole="button"
                      accessibilityLabel={option.label}
                      style={({ pressed }) => [
                        styles.optionCast,
                        isPicked && { shadowColor: ll.greenDeep, shadowOpacity: 0.45, shadowRadius: 20 },
                        isWrong && { shadowColor: ll.pink, shadowOpacity: 0.4 },
                        pressed && { transform: [{ translateY: 2 }, { scale: 0.97 }] },
                      ]}
                    >
                      <LinearGradient
                        colors={isPicked ? ['#F2FBF6', '#DFF4E8'] : llSurface.white}
                        style={[
                          styles.option,
                          { width: tile, height: tile },
                          isPicked ? styles.optionPicked : isWrong ? styles.optionWrong : llRing.faint,
                        ]}
                      >
                        <Sheen variant="tile" radius={llRadius.md} />
                        <TopHighlight radius={llRadius.md} />
                        <Text style={styles.optionEmoji}>{option.emoji}</Text>
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </LinearGradient>
        </LinearGradient>
        {/* Mirror stand. */}
        <View style={styles.mirrorStand} />
        <View style={styles.mirrorFoot} />
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Mascot mood="cheer" size={78} />
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: popScale }] }]}>🎉</Animated.Text>
          <Text style={styles.celebrationText}>Great job!</Text>
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
  dotActive: { backgroundColor: ll.amber, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: ll.white },

  askCast: {
    marginTop: 16, borderRadius: llRadius.xl,
    shadowColor: '#6054BE', shadowOpacity: 0.16, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 5,
  },
  ask: {
    borderRadius: llRadius.xl, paddingVertical: 11, paddingHorizontal: 26,
    alignItems: 'center', overflow: 'hidden',
  },
  askLead: { ...llType.eyebrow, color: ll.muted, textTransform: 'uppercase' },
  askTarget: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 32, lineHeight: 38, color: ll.purpleDeep },

  mirrorCast: { alignItems: 'center', marginTop: 18 },
  mirrorFrame: {
    borderRadius: 34, padding: 11,
    shadowColor: '#5442A8', shadowOpacity: 0.3, shadowRadius: 28,
    shadowOffset: { width: 0, height: 15 }, elevation: 10,
  },
  mirrorGlass: {
    borderRadius: 26, padding: 13, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 300 },

  optionCast: {
    borderRadius: llRadius.md,
    shadowColor: '#6054BE', shadowOpacity: 0.18, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  option: {
    borderRadius: llRadius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  optionPicked: { borderWidth: 3, borderColor: ll.green },
  optionWrong: { borderWidth: 3, borderColor: '#FFB3C9' },
  optionEmoji: { fontSize: 40 },

  mirrorStand: { width: 16, height: 26, backgroundColor: '#B9A7E4', marginTop: -2 },
  mirrorFoot: { width: 62, height: 10, borderRadius: 6, backgroundColor: '#A692D8' },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 90 },
  celebrationText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.greenDeep, marginTop: 8 },
});
