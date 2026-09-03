import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import BackButton from '../components/BackButton';
import BouncyButton from '../components/BouncyButton';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { COINS, TOTAL_ROUNDS, buildRound } from '../moneyData';
import { saveProgress } from '../storage';
import { colors, fonts, radius, spacing } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MakeAmountScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'sk-ma-money';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState([]); // array of coin values tapped this round
  const [wrongPulse, setWrongPulse] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const round = buildRound(index);
  const total = picked.reduce((sum, v) => sum + v, 0);

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
    setPicked([]);
    speak(`Make ${round.target} rupees using the coins`, { rate: 0.95, pitch: 1.15 });
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

  function addCoin(value) {
    if (isProcessing) return;
    Haptics.selectionAsync();
    setPicked((prev) => [...prev, value]);
  }

  function resetCoins() {
    if (isProcessing) return;
    setPicked([]);
    Haptics.selectionAsync();
  }

  // Overshooting a target previously had no fix except a full reset, which
  // is a harsh penalty for one misplaced coin — let a child tap a coin they
  // already placed to take just that one back.
  function removeCoinAt(index) {
    if (isProcessing) return;
    setPicked((prev) => prev.filter((_, i) => i !== index));
    Haptics.selectionAsync();
  }

  function handleDone() {
    if (isProcessing || picked.length === 0) return;

    if (total === round.target) {
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
      speak(`Yes! That's ${round.target} rupees!`, { rate: 0.95, pitch: 1.15 });
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
            replayScreen: 'MakeAmount',
            title: 'Money Master!',
            subtitle: `You made every amount!`,
          });
        }
      }, 1400);
    } else {
      setWrongPulse(true);
      setStreak(0);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playWrong();
      speak(total > round.target ? "That's too much! Try again." : "Not quite enough! Try again.", { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongPulse(false);
      }, 400);
    }
  }

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });

  return (
    <LinearGradient colors={[colors.cream, colors.sun + '33']} style={styles.container}>
      <StatusBar style="dark" />
      <BackButton onPress={() => navigation.goBack()} />
      <StreakBadge streak={streak} />

      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <View key={i} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      <Text style={styles.prompt}>Make ₹{round.target} using coins</Text>

      <Animated.View style={[styles.totalBox, wrongPulse && { transform: [{ translateX: shakeTranslate }] }]}>
        <Text style={styles.totalText}>₹{total}</Text>
      </Animated.View>

      <View style={styles.pickedRow}>
        {picked.map((v, i) => (
          <BouncyButton key={i} onPress={() => removeCoinAt(i)} accessibilityLabel={`Remove this coin`}>
            <Text style={styles.pickedCoin}>{COINS.find((c) => c.value === v)?.emoji}</Text>
          </BouncyButton>
        ))}
      </View>
      {picked.length > 0 && <Text style={styles.pickedHint}>Tap a coin above to take it back</Text>}

      <View style={styles.coinRow}>
        {COINS.map((coin) => (
          <BouncyButton key={coin.value} style={styles.coinButton} onPress={() => addCoin(coin.value)} accessibilityLabel={coin.label}>
            <Text style={styles.coinEmoji}>{coin.emoji}</Text>
            <Text style={styles.coinLabel}>{coin.label}</Text>
          </BouncyButton>
        ))}
      </View>

      <View style={styles.actionRow}>
        <BouncyButton style={styles.resetButton} onPress={resetCoins}>
          <Text style={styles.resetText}>Reset ↺</Text>
        </BouncyButton>
        <BouncyButton style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneText}>Done ✓</Text>
        </BouncyButton>
      </View>

      <View style={styles.starsRow}>
        <Text style={styles.starsText}>⭐ {stars}</Text>
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Mascot mood="cheer" size={78} />
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: popScale }] }]}>🪙</Animated.Text>
          <Text style={styles.celebrationText}>₹{round.target} exactly!</Text>
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
  prompt: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink, marginTop: spacing.md, marginBottom: spacing.sm, textAlign: 'center' },
  totalBox: {
    backgroundColor: colors.white, borderRadius: radius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl,
    shadowColor: colors.ink, shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  totalText: { fontFamily: fonts.displayBold, fontSize: 36, color: colors.sunDeep },
  pickedRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', minHeight: 30, marginTop: spacing.sm, maxWidth: 260 },
  pickedCoin: { fontSize: 20, marginHorizontal: 2 },
  pickedHint: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  coinRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  coinButton: {
    width: 84, height: 84, borderRadius: radius.lg, backgroundColor: colors.grape, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.ink, shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  coinEmoji: { fontSize: 28 },
  coinLabel: { fontFamily: fonts.displayBold, fontSize: 13, color: colors.ink, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  resetButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.disabled },
  resetText: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 14 },
  doneButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, borderRadius: radius.pill, backgroundColor: colors.grassDeep },
  doneText: { fontFamily: fonts.displayBold, color: colors.ink, fontSize: 16 },
  starsRow: { marginTop: spacing.lg },
  starsText: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.sunDeep },
  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 90 },
  celebrationText: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.grassDeep, marginTop: spacing.sm },
});
