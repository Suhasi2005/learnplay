import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import BackButton from '../components/BackButton';
import BouncyButton from '../components/BouncyButton';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { ACTIONS, ROUNDS } from '../trafficData';
import { saveProgress } from '../storage';
import { bgGradient, colors, fonts, radius, spacing } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ROUND_MS = 3500;

export default function StopOrGoScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'jk-ev-traffic';

  const { speak } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongActionId, setWrongActionId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const round = ROUNDS[index];
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const countdown = useRef(new Animated.Value(1)).current;
  const confettiRef = useRef(null);

  const isMounted = useRef(true);
  const advanceTimeout = useRef(null);
  const wrongTimeout = useRef(null);
  const countdownAnim = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      countdownAnim.current?.stop();
      if (advanceTimeout.current) clearTimeout(advanceTimeout.current);
      if (wrongTimeout.current) clearTimeout(wrongTimeout.current);
    };
  }, []);

  useEffect(() => {
    speak(`The light is ${round.light}!`, { rate: 0.95, pitch: 1.15 });
    startCountdown();
    return () => countdownAnim.current?.stop();
  }, [index]);

  function startCountdown() {
    countdown.setValue(1);
    countdownAnim.current = Animated.timing(countdown, {
      toValue: 0,
      duration: ROUND_MS,
      useNativeDriver: false,
    });
    countdownAnim.current.start(({ finished }) => {
      if (finished && isMounted.current) handleTimeout();
    });
  }

  function handleTimeout() {
    setStreak(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    speak('Too slow! Try again.', { rate: 0.95, pitch: 1.15 });
    startCountdown();
  }

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

  function handleAction(action) {
    if (showCelebration || isProcessing) return;

    if (action.id === round.correctAction) {
      countdownAnim.current?.stop();
      setIsProcessing(true);
      const newStars = stars + 1;
      const newStreak = streak + 1;
      setStars(newStars);
      setStreak(newStreak);
      setShowCelebration(true);
      triggerPop();
      confettiRef.current?.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      speak(`Yes! ${action.label}!`, { rate: 0.95, pitch: 1.15 });
      saveProgress(GAME_ID, index + 1, newStars);

      advanceTimeout.current = setTimeout(() => {
        if (!isMounted.current) return;
        setShowCelebration(false);
        setIsProcessing(false);
        if (index + 1 < ROUNDS.length) {
          setIndex((i) => i + 1);
        } else {
          navigation.replace('Completion', {
            gameId: GAME_ID,
            stars: newStars,
            total: ROUNDS.length,
            replayScreen: 'StopOrGo',
            title: 'Road Safety Star!',
            subtitle: `You got every light right!`,
          });
        }
      }, 1300);
    } else {
      setWrongActionId(action.id);
      setStreak(0);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      speak('Try again!', { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongActionId(null);
      }, 400);
    }
  }

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });
  const barWidth = countdown.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <LinearGradient colors={bgGradient} style={styles.container}>
      <StatusBar style="dark" />
      <BackButton onPress={() => navigation.goBack()} />
      <StreakBadge streak={streak} />

      <View style={styles.progressRow}>
        {ROUNDS.map((_, i) => (
          <View key={i} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.lightBox}>
        <Text style={styles.lightEmoji}>{round.emoji}</Text>
      </View>

      <View style={styles.timerTrack}>
        <Animated.View style={[styles.timerFill, { width: barWidth }]} />
      </View>

      <Text style={styles.prompt}>What do you do?</Text>

      <View style={styles.actionRow}>
        {ACTIONS.map((action) => {
          const isWrong = wrongActionId === action.id;
          return (
            <Animated.View
              key={action.id}
              style={isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined}
            >
              <BouncyButton style={styles.action} onPress={() => handleAction(action)} accessibilityLabel={action.label}>
                <Text style={styles.actionEmoji}>{action.emoji}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
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
          <Text style={styles.celebrationText}>Great job!</Text>
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
  lightBox: {
    marginTop: spacing.md, backgroundColor: colors.ink, borderRadius: radius.lg, padding: spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  lightEmoji: { fontSize: 80 },
  timerTrack: {
    width: 220, height: 10, borderRadius: 5, backgroundColor: colors.disabled,
    marginTop: spacing.sm, overflow: 'hidden',
  },
  timerFill: { height: '100%', backgroundColor: colors.coral, borderRadius: 5 },
  prompt: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink, marginTop: spacing.md, marginBottom: spacing.md, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  action: {
    width: 96, height: 96, borderRadius: radius.lg, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  actionEmoji: { fontSize: 30 },
  actionLabel: { fontFamily: fonts.displayBold, fontSize: 13, color: colors.white, marginTop: 4 },
  starsRow: { marginTop: spacing.lg },
  starsText: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.sunDeep },
  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 100 },
  celebrationText: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.grassDeep, marginTop: spacing.sm },
});
