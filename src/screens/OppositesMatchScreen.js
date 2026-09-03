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
import { TOTAL_LEVELS, buildLevel } from '../oppositesData';
import { saveProgress } from '../storage';
import { bgGradient, colors, fonts, radius, spacing } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

function Card({ card, state, onPress }) {
  // state: 'idle' | 'selected' | 'wrong' | 'matched'
  const shake = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'wrong') {
      shake.setValue(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 55, useNativeDriver: true }),
      ]).start();
    }
    if (state === 'matched') {
      Animated.timing(scale, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }
  }, [state]);

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });

  return (
    // Fixed-size slot so a matched card shrinking to scale:0 doesn't
    // reflow the rest of the grid — it just becomes an invisible gap.
    <View style={styles.cardSlot} pointerEvents={state === 'matched' ? 'none' : 'auto'}>
      <Animated.View style={{ transform: [{ translateX }, { scale }] }}>
        <BouncyButton
          style={[
            styles.card,
            state === 'selected' && styles.cardSelected,
          ]}
          onPress={onPress}
          accessibilityLabel={card.label}
        >
          <Text style={styles.cardEmoji}>{card.emoji}</Text>
          <Text style={styles.cardLabel}>{card.label}</Text>
        </BouncyButton>
      </Animated.View>
    </View>
  );
}

export default function OppositesMatchScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'sk-ma-opposites';

  const { speak, playSuccess, playWrong } = useSound();
  const [level, setLevel] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [wrongIds, setWrongIds] = useState([]);
  const [matchedPairIds, setMatchedPairIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const cards = useMemo(() => buildLevel(level), [level]);
  const confettiRef = useRef(null);
  const isMounted = useRef(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setSelectedId(null);
    setWrongIds([]);
    setMatchedPairIds([]);
    speak('Tap two cards that are opposites', { rate: 0.95, pitch: 1.15 });
  }, [level]);

  function cardState(card) {
    if (matchedPairIds.includes(card.pairId)) return 'matched';
    if (wrongIds.includes(card.id)) return 'wrong';
    if (selectedId === card.id) return 'selected';
    return 'idle';
  }

  function handlePress(card) {
    if (isProcessing || matchedPairIds.includes(card.pairId) || card.id === selectedId) return;

    if (!selectedId) {
      setSelectedId(card.id);
      return;
    }

    const firstCard = cards.find((c) => c.id === selectedId);
    if (firstCard.pairId === card.pairId) {
      // match!
      setIsProcessing(true);
      const newStars = stars + 1;
      const newStreak = streak + 1;
      setStars(newStars);
      setStreak(newStreak);
      setSelectedId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSuccess();
      speak(`Yes! ${firstCard.label} and ${card.label} are opposites!`, { rate: 0.95, pitch: 1.15 });
      confettiRef.current?.start();

      const nextMatched = [...matchedPairIds, card.pairId];
      setMatchedPairIds(nextMatched);
      saveProgress(GAME_ID, level, newStars);

      timeoutRef.current = setTimeout(() => {
        if (!isMounted.current) return;
        setIsProcessing(false);
        if (nextMatched.length === cards.length / 2) {
          if (level + 1 < TOTAL_LEVELS) {
            setLevel((l) => l + 1);
          } else {
            navigation.replace('Completion', {
              gameId: GAME_ID,
              stars: newStars,
              total: TOTAL_LEVELS,
              replayScreen: 'OppositesMatch',
              title: 'Opposites Master!',
              subtitle: 'You matched every pair!',
            });
          }
        }
      }, 900);
    } else {
      setWrongIds([selectedId, card.id]);
      // Clear the selection right away (not just after the shake finishes) so
      // a fast third tap starts a fresh pick instead of being compared
      // against a card that's already mid-shake from the last wrong guess.
      setSelectedId(null);
      setStreak(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playWrong();
      speak('Try again!', { rate: 0.95, pitch: 1.15 });
      timeoutRef.current = setTimeout(() => {
        if (isMounted.current) setWrongIds([]);
      }, 500);
    }
  }

  return (
    <LinearGradient colors={bgGradient} style={styles.container}>
      <StatusBar style="dark" />
      <BackButton onPress={() => navigation.goBack()} />
      <StreakBadge streak={streak} />

      <Text style={styles.eyebrow}>Level {level + 1} of {TOTAL_LEVELS}</Text>
      <Text style={styles.prompt}>Tap two cards that are opposites</Text>

      <View style={styles.grid}>
        {cards.map((card) => (
          <Card key={card.id} card={card} state={cardState(card)} onPress={() => handlePress(card)} />
        ))}
      </View>

      <View style={styles.starsRow}>
        <Text style={styles.starsText}>⭐ {stars}</Text>
      </View>

      <ConfettiCannon
        ref={confettiRef}
        count={30}
        origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
        autoStart={false}
        fadeOut
        fallSpeed={2200}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, alignItems: 'center' },
  eyebrow: { fontFamily: fonts.bodyBold, color: colors.grapeDeep, fontSize: 13, marginTop: spacing.md },
  prompt: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink, marginTop: spacing.xs, marginBottom: spacing.lg, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 340 },
  cardSlot: { width: 82, height: 100, margin: 4, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: 82, height: 100, borderRadius: radius.md, backgroundColor: colors.white,
    borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.ink, shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardSelected: { borderColor: colors.grapeDeep, borderWidth: 3, backgroundColor: colors.grape + '22' },
  cardEmoji: { fontSize: 32 },
  cardLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink, marginTop: 2 },
  starsRow: { marginTop: spacing.lg },
  starsText: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.sunDeep },
});
