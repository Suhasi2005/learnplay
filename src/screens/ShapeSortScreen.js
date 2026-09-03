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
import { BINS, SHAPES } from '../shapesData';
import { saveProgress } from '../storage';
import { bgGradient, colors, fonts, radius, spacing } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ShapeSortScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'jk-ma-shapes';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongBin, setWrongBin] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const shape = SHAPES[index];
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
    speak(`Is the ${shape.label.toLowerCase()} round, or does it have points?`, { rate: 0.95, pitch: 1.15 });
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

  function handleBin(bin) {
    if (showCelebration || isProcessing) return;

    if (bin.id === shape.category) {
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
      speak(`Yes! The ${shape.label.toLowerCase()} is ${bin.label.toLowerCase()}!`, { rate: 0.95, pitch: 1.15 });
      saveProgress(GAME_ID, index + 1, newStars);

      advanceTimeout.current = setTimeout(() => {
        if (!isMounted.current) return;
        setShowCelebration(false);
        setIsProcessing(false);
        if (index + 1 < SHAPES.length) {
          setIndex((i) => i + 1);
        } else {
          navigation.replace('Completion', {
            gameId: GAME_ID,
            stars: newStars,
            total: SHAPES.length,
            replayScreen: 'ShapeSort',
            title: 'Shape Sorter!',
            subtitle: `You sorted all ${SHAPES.length} shapes!`,
          });
        }
      }, 1400);
    } else {
      setWrongBin(bin.id);
      setStreak(0);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playWrong();
      speak('Try again!', { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongBin(null);
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
        {SHAPES.map((s, i) => (
          <View key={s.id} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.shapeBox}>
        <Text style={styles.shapeEmoji}>{shape.emoji}</Text>
      </View>
      <Text style={styles.prompt}>Is it round, or does it have points?</Text>

      <View style={styles.binRow}>
        {BINS.map((bin) => {
          const isWrong = wrongBin === bin.id;
          return (
            <Animated.View
              key={bin.id}
              style={isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined}
            >
              <BouncyButton style={styles.bin} onPress={() => handleBin(bin)} accessibilityLabel={bin.label}>
                <Text style={styles.binEmoji}>{bin.emoji}</Text>
                <Text style={styles.binLabel}>{bin.label}</Text>
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
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: popScale }] }]}>{shape.emoji}</Animated.Text>
          <Text style={styles.celebrationText}>{shape.label} is {BINS.find((b) => b.id === shape.category)?.label}!</Text>
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
  shapeBox: {
    marginTop: spacing.lg, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  shapeEmoji: { fontSize: 90 },
  prompt: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink, marginTop: spacing.md, marginBottom: spacing.lg, textAlign: 'center' },
  binRow: { flexDirection: 'row', gap: spacing.md },
  bin: {
    width: 140, height: 110, borderRadius: radius.lg, backgroundColor: colors.grape, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  binEmoji: { fontSize: 36 },
  binLabel: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink, marginTop: 4 },
  starsRow: { marginTop: spacing.lg },
  starsText: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.sunDeep },
  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 100 },
  celebrationText: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.grassDeep, marginTop: spacing.sm, paddingHorizontal: spacing.lg, textAlign: 'center' },
});
