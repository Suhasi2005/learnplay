import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { NUMBERS, buildRound } from '../numberGameData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import GameObject from '../ll/objects';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../ll/tokens';

// "Count to 10" — Numbers & counting (Junior KG).
//
// A number is shown and the child picks the group that has that many things.
//
// The single biggest change here is the ten-frame. The old version wrapped
// the emoji into a free-flowing cluster, so a group of 7 and a group of 8
// looked like two similar blobs and the only way to tell them apart was to
// count one by one. A ten-frame — two rows of five — is the standard early-
// years manipulative precisely because it makes quantity *visible*: seven
// fills the top row and two more, and a child learns to see "five and two"
// without counting. Comparing groups becomes comparing shapes.
//
// The empty cells stay drawn, which is what gives the frame its power: you
// can see how far from ten a group is.
const WRONG_ATTEMPTS_BEFORE_HINT = 2;

// A ten-frame: five columns, two rows, filled left-to-right, top row first.
function TenFrame({ emoji, count, cell = 22 }) {
  return (
    <View style={styles.frame}>
      {[0, 1].map((row) => (
        <View key={row} style={styles.frameRow}>
          {Array.from({ length: 5 }, (_, col) => {
            const n = row * 5 + col;
            const filled = n < count;
            return (
              <View
                key={col}
                style={[
                  styles.cell,
                  { width: cell, height: cell },
                  filled ? styles.cellFilled : styles.cellEmpty,
                ]}
              >
                {filled ? <GameObject emoji={emoji} size={cell * 0.78} /> : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default function NumberGameScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'jk-ma-numbers';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongOption, setWrongOption] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    hintPulse.setValue(0);
    speak(`Find the group with ${round.number}`, { rate: 0.95, pitch: 1.15 });
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
  function handleAnswer(optionCount) {
    if (showCelebration || isProcessing) return;

    if (optionCount === round.number) {
      setIsProcessing(true);
      const newStars = stars + 1;
      const newStreak = streak + 1;
      setStars(newStars);
      setStreak(newStreak);
      setShowCelebration(true);
      triggerPop();
      confettiRef.current?.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSuccess();
      speak(`Yes! That's ${round.number}!`, { rate: 0.95, pitch: 1.15 });
      saveProgress(GAME_ID, index + 1, newStars);

      advanceTimeout.current = setTimeout(() => {
        if (!isMounted.current) return;
        setShowCelebration(false);
        setIsProcessing(false);
        if (index + 1 < NUMBERS.length) {
          setIndex((i) => i + 1);
        } else {
          navigation.replace('Completion', {
            gameId: GAME_ID,
            stars: newStars,
            total: NUMBERS.length,
            replayScreen: 'NumberGame',
            title: 'Counting Champion!',
            subtitle: `You counted all the way to ${NUMBERS.length}!`,
          });
        }
      }, 1400);
    } else {
      setWrongOption(optionCount);
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
  const cell = compact ? 19 : 22;

  return (
    <LinearGradient colors={['#E7F1FF', '#F1ECFF', '#FFF3F8']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Count to 10" bg={ll.blueSoft} color={ll.blueDeep} style={styles.titlePill} />
        <StarChip count={stars} />
      </View>

      <View style={styles.streakWrap}>
        <StreakBadge streak={streak} />
      </View>

      <View style={styles.progressRow}>
        {NUMBERS.map((item, i) => (
          <View
            key={item.number}
            style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]}
          />
        ))}
      </View>

      {/* THE TARGET NUMBER — on a counter tile. ------------------------ */}
      <View style={styles.numberCast}>
        <LinearGradient colors={[ll.blueLight, ll.blueDeep]} style={styles.numberTile}>
          <Sheen variant="strong" radius={24} />
          <Text style={[styles.numberBig, compact && { fontSize: 62, lineHeight: 70 }]}>{round.number}</Text>
          <View style={styles.numberLip} pointerEvents="none" />
        </LinearGradient>
      </View>

      <Text style={styles.prompt}>
        Which group has {round.number}?
      </Text>

      {/* THE TEN-FRAMES ------------------------------------------------- */}
      <View style={styles.grid}>
        {round.options.map((optionCount, i) => {
          const isWrong = wrongOption === optionCount;
          const isHintTarget = wrongAttempts >= WRONG_ATTEMPTS_BEFORE_HINT && optionCount === round.number;
          return (
            <Animated.View
              key={`${optionCount}-${i}`}
              style={[
                isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined,
                isHintTarget && {
                  shadowColor: ll.amber,
                  shadowOpacity: hintGlow,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}
            >
              <Pressable
                onPress={() => handleAnswer(optionCount)}
                disabled={isProcessing || showCelebration}
                accessibilityRole="button"
                accessibilityLabel={`Group of ${optionCount}`}
                style={({ pressed }) => [
                  styles.frameCast,
                  isHintTarget && { shadowColor: ll.amber, shadowOpacity: 0.5 },
                  isWrong && { shadowColor: ll.pink, shadowOpacity: 0.4 },
                  pressed && { transform: [{ translateY: 2 }, { scale: 0.98 }] },
                ]}
              >
                <LinearGradient
                  colors={llSurface.white}
                  style={[
                    styles.frameCard,
                    isWrong ? styles.frameWrong : isHintTarget ? styles.frameHint : llRing.faint,
                  ]}
                >
                  <TopHighlight radius={llRadius.lg} />
                  <TenFrame emoji={round.emoji} count={optionCount} cell={cell} />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Mascot mood="cheer" size={78} />
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: popScale }] }]}>
            {round.emoji}
          </Animated.Text>
          <Text style={styles.celebrationText}>That's {round.number}!</Text>
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

  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 10, maxWidth: 300 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ll.lilac },
  dotDone: { backgroundColor: ll.green },
  dotActive: { backgroundColor: ll.blue, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: ll.white },

  numberCast: {
    marginTop: 16, borderRadius: 24,
    shadowColor: '#2F55A8', shadowOpacity: 0.4, shadowRadius: 22,
    shadowOffset: { width: 0, height: 13 }, elevation: 10,
  },
  numberTile: {
    width: 108, height: 108, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)',
  },
  numberBig: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 70, lineHeight: 80, color: ll.white,
    textShadowColor: 'rgba(20,30,80,0.32)', textShadowRadius: 5, textShadowOffset: { width: 0, height: 2 },
  },
  numberLip: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 5,
    backgroundColor: 'rgba(0,0,0,0.16)',
  },

  prompt: { ...llType.h4, color: ll.ink, marginTop: 14, marginBottom: 16, textAlign: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  frameCast: {
    borderRadius: llRadius.lg,
    shadowColor: '#6054BE', shadowOpacity: 0.2, shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 }, elevation: 5,
  },
  frameCard: {
    borderRadius: llRadius.lg, padding: 10, overflow: 'hidden',
  },
  frameWrong: { borderWidth: 3, borderColor: '#FFB3C9' },
  frameHint: { borderWidth: 3, borderColor: ll.amber },

  // The frame itself: a visible 5×2 grid, empty cells included.
  frame: { gap: 3 },
  frameRow: { flexDirection: 'row', gap: 3 },
  cell: {
    borderRadius: 5, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  cellFilled: {
    backgroundColor: withAlpha(ll.amber, 0.2),
    borderColor: withAlpha(ll.amberInk, 0.35),
  },
  cellEmpty: {
    backgroundColor: 'rgba(139,134,184,0.07)',
    borderColor: 'rgba(139,134,184,0.28)',
  },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 110 },
  celebrationText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.greenDeep, marginTop: 8 },
});
