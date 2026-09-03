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
import { TOTAL_ROUNDS, buildRound } from '../dataHandlingData';
import { saveProgress } from '../storage';
import { colors, fonts, radius, spacing } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_UNIT = 26;

export default function ReadTheChartScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'g1-ma-data';

  const { speak } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongLabel, setWrongLabel] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const round = useMemo(() => buildRound(index), [index]);
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
    speak(`Which one has the ${round.askMost ? 'most' : 'fewest'}?`, { rate: 0.95, pitch: 1.15 });
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

  function handleAnswer(bar) {
    if (showCelebration || isProcessing) return;

    if (bar.label === round.correctLabel) {
      setIsProcessing(true);
      const newStars = stars + 1;
      const newStreak = streak + 1;
      setStars(newStars);
      setStreak(newStreak);
      setShowCelebration(true);
      triggerPop();
      confettiRef.current?.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      speak(`Yes! ${bar.label}!`, { rate: 0.95, pitch: 1.15 });
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
            replayScreen: 'ReadTheChart',
            title: 'Chart Champion!',
            subtitle: `You read every chart!`,
          });
        }
      }, 1400);
    } else {
      setWrongLabel(bar.label);
      setStreak(0);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      speak('Try again!', { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongLabel(null);
      }, 400);
    }
  }

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });

  return (
    <LinearGradient colors={[colors.cream, colors.grape + '22']} style={styles.container}>
      <StatusBar style="dark" />
      <BackButton onPress={() => navigation.goBack()} />
      <StreakBadge streak={streak} />

      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <View key={i} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      <Text style={styles.prompt}>Which one has the {round.askMost ? 'MOST' : 'FEWEST'}?</Text>

      <View style={styles.chart}>
        {round.bars.map((bar) => {
          const isWrong = wrongLabel === bar.label;
          return (
            <Animated.View key={bar.label} style={[styles.barColumn, isWrong && { transform: [{ translateX: shakeTranslate }] }]}>
              <View style={styles.emojiStack}>
                {Array.from({ length: bar.count }).map((_, i) => (
                  <Text key={i} style={styles.stackEmoji}>{bar.emoji}</Text>
                ))}
              </View>
              <BouncyButton style={styles.barButton} onPress={() => handleAnswer(bar)} accessibilityLabel={bar.label}>
                <View style={[styles.bar, { height: bar.count * BAR_UNIT }]} />
                <Text style={styles.barLabel}>{bar.label}</Text>
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
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: popScale }] }]}>📊</Animated.Text>
          <Text style={styles.celebrationText}>{round.correctLabel}!</Text>
        </View>
      )}

      <ConfettiCannon ref={confettiRef} count={35} origin={{ x: SCREEN_WIDTH / 2, y: 0 }} autoStart={false} fadeOut fallSpeed={2400} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, alignItems: 'center' },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: spacing.sm, maxWidth: 260 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.disabled },
  dotDone: { backgroundColor: colors.grassDeep },
  dotActive: { backgroundColor: colors.sunDeep, width: 10, height: 10, borderRadius: 5 },
  prompt: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.ink, marginTop: spacing.md, marginBottom: spacing.lg, textAlign: 'center' },
  chart: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-end' },
  barColumn: { alignItems: 'center' },
  emojiStack: { alignItems: 'center', marginBottom: 4, minHeight: 30, justifyContent: 'flex-end' },
  stackEmoji: { fontSize: 16, lineHeight: 16 },
  barButton: { alignItems: 'center' },
  bar: { width: 56, backgroundColor: colors.sky, borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm },
  barLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink, marginTop: 4 },
  starsRow: { marginTop: spacing.xl },
  starsText: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.sunDeep },
  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 90 },
  celebrationText: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.grassDeep, marginTop: spacing.sm },
});
