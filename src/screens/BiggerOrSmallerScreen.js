import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import BackButton from '../components/BackButton';
import BouncyButton from '../components/BouncyButton';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { TOTAL_ROUNDS, buildRound } from '../measurementData';
import { saveProgress } from '../storage';
import { bgGradient, colors, fonts, radius, spacing } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function BiggerOrSmallerScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'g1-ma-measurement';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongSide, setWrongSide] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const round = useMemo(() => buildRound(index), [index]);
  const biggerSide = round.leftIsBigger ? 'left' : 'right';
  const correctSide = round.askBigger ? biggerSide : (biggerSide === 'left' ? 'right' : 'left');

  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
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
    speak(`Which one is ${round.askBigger ? 'bigger' : 'smaller'}?`, { rate: 0.95, pitch: 1.15 });
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

  function handleAnswer(side) {
    if (showCelebration || isProcessing) return;

    if (side === correctSide) {
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
      speak('Yes! Well done!', { rate: 0.95, pitch: 1.15 });
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
            replayScreen: 'BiggerOrSmaller',
            title: 'Measuring Master!',
            subtitle: `You compared all ${TOTAL_ROUNDS} objects!`,
          });
        }
      }, 1300);
    } else {
      setWrongSide(side);
      setStreak(0);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playWrong();
      speak('Try again!', { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongSide(null);
      }, 400);
    }
  }

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });

  return (
    <LinearGradient colors={bgGradient} style={styles.container}>
      <StatusBar style="dark" />
      <BackButton onPress={() => navigation.goBack()} />
      <StreakBadge streak={streak} />

      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <View key={i} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      <Text style={styles.prompt}>Which one is {round.askBigger ? 'BIGGER' : 'SMALLER'}?</Text>

      <View style={styles.compareRow}>
        {['left', 'right'].map((side) => {
          const isThisBigger = biggerSide === side;
          const isWrong = wrongSide === side;
          return (
            <Animated.View
              key={side}
              style={isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined}
            >
              <BouncyButton
                style={styles.compareBox}
                onPress={() => handleAnswer(side)}
                accessibilityLabel={`${side} object`}
              >
                <Text style={[styles.compareEmoji, { fontSize: isThisBigger ? 92 : 42 }]}>{round.emoji}</Text>
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
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: popScale }] }]}>{round.emoji}</Animated.Text>
          <Text style={styles.celebrationText}>Great eye!</Text>
        </View>
      )}

      <ConfettiCannon
        ref={confettiRef}
        count={35}
        origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
        autoStart={false}
        fadeOut
        fallSpeed={2400}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, alignItems: 'center' },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: spacing.sm, maxWidth: 260 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.disabled },
  dotDone: { backgroundColor: colors.grassDeep },
  dotActive: { backgroundColor: colors.sunDeep, width: 10, height: 10, borderRadius: 5 },
  prompt: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.lg, textAlign: 'center' },
  compareRow: { flexDirection: 'row', gap: spacing.lg },
  compareBox: {
    width: 140, height: 160, borderRadius: radius.lg, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.border,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  compareEmoji: { textAlign: 'center' },
  starsRow: { marginTop: spacing.xl },
  starsText: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.sunDeep },
  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 90 },
  celebrationText: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.grassDeep, marginTop: spacing.sm },
});
