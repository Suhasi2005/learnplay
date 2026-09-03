import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import BackButton from '../components/BackButton';
import BouncyButton from '../components/BouncyButton';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { ALPHABET, buildRound } from '../gameData';
import { saveProgress } from '../storage';
import { cardPalette, colors, fonts, radius, spacing } from '../theme';

const WRONG_ATTEMPTS_BEFORE_HINT = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GAME_ID = 'abc';

export default function AlphabetGameScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;

  const { speak } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongId, setWrongId] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const round = useMemo(() => buildRound(index), [index]);
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef(null);

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
    speak(`Find the picture that starts with ${round.letter}`, { rate: 0.95, pitch: 1.15 });
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

  function handleAnswer(option) {
    if (showCelebration || isProcessing) return;

    if (option.letter === round.letter) {
      setIsProcessing(true);
      const newStars = stars + 1;
      const newStreak = streak + 1;
      setStars(newStars);
      setStreak(newStreak);
      setShowCelebration(true);
      triggerPop();
      confettiRef.current?.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      speak(`Yes! ${round.letter} is for ${round.word}!`, { rate: 0.95, pitch: 1.15 });
      saveProgress(GAME_ID, index + 1, newStars);

      advanceTimeout.current = setTimeout(() => {
        if (!isMounted.current) return;
        setShowCelebration(false);
        setIsProcessing(false);
        if (index + 1 < ALPHABET.length) {
          setIndex((i) => i + 1);
        } else {
          navigation.replace('Completion', {
            gameId: GAME_ID,
            stars: newStars,
            total: ALPHABET.length,
            replayScreen: 'AlphabetGame',
            title: 'You did it!',
            subtitle: `You learned all ${ALPHABET.length} letters!`,
          });
        }
      }, 1400);
    } else {
      setWrongId(option.letter);
      setStreak(0);
      setWrongAttempts((n) => n + 1);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      speak('Try again!', { rate: 0.95, pitch: 1.15 });

      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongId(null);
      }, 400);
    }
  }

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });
  const hintGlow = hintPulse.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <BackButton onPress={() => { navigation.goBack(); }} />
      <StreakBadge streak={streak} />

      <View style={styles.progressRow}>
        {ALPHABET.map((item, i) => (
          <View
            key={item.letter}
            style={[
              styles.dot,
              i < index && styles.dotDone,
              i === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.letterBox}>
        <Text style={styles.letterBig}>{round.letter}</Text>
        <Text style={styles.letterSmall}>{round.letter.toLowerCase()}</Text>
      </View>
      <Text style={styles.prompt}>Tap the picture that starts with "{round.letter}"</Text>

      <View style={styles.grid}>
        {round.options.map((option, i) => {
          const palette = cardPalette[i % cardPalette.length];
          const isWrong = wrongId === option.letter;
          const isHintTarget = wrongAttempts >= WRONG_ATTEMPTS_BEFORE_HINT && option.letter === round.letter;
          return (
            <Animated.View
              key={option.letter}
              style={[
                isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined,
                isHintTarget && {
                  shadowColor: colors.sunDeep,
                  shadowOpacity: hintGlow,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}
            >
              <BouncyButton
                style={[styles.option, { backgroundColor: palette.bg }]}
                onPress={() => handleAnswer(option)}
                accessibilityLabel={`Picture option ${i + 1}`}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
              </BouncyButton>
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.starsRow}>
        <Text style={styles.starsText}>⭐ {stars}</Text>
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: popScale }] }]}>
            {round.emoji}
          </Animated.Text>
          <Text style={styles.celebrationText}>{round.letter} is for {round.word}!</Text>
        </View>
      )}

      <ConfettiCannon
        ref={confettiRef}
        count={40}
        origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
        autoStart={false}
        fadeOut
        fallSpeed={2500}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.md, alignItems: 'center' },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: spacing.sm, maxWidth: 320 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E4DED6' },
  dotDone: { backgroundColor: colors.grassDeep },
  dotActive: { backgroundColor: colors.sunDeep, width: 10, height: 10, borderRadius: 5 },
  letterBox: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, marginTop: spacing.lg },
  letterBig: { fontFamily: fonts.displayBold, fontSize: 90, color: colors.grapeDeep, lineHeight: 92 },
  letterSmall: { fontFamily: fonts.displayBold, fontSize: 56, color: colors.grape, lineHeight: 64 },
  prompt: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink, marginTop: spacing.xs, marginBottom: spacing.lg, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md, maxWidth: 340 },
  option: {
    width: 130, height: 130, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  optionEmoji: { fontSize: 64 },
  starsRow: { marginTop: spacing.lg },
  starsText: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.sunDeep },
  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 110 },
  celebrationText: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.grassDeep, marginTop: spacing.sm },
});
