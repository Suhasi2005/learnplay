import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import GameButton from '../components/GameButton';
import Mascot from '../components/Mascot';
import StarRow from '../components/StarRow';
import { useSound } from '../context/SoundContext';
import { clearProgress } from '../storage';
import { colors, fonts, radius, shadow, skyGradient, spacing, type } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

// The reward moment.
//
// Sequenced rather than simultaneous: the card lands, then Pip cheers, then
// the stars pop in one at a time. Everything arriving at once reads as a
// single flash; staggering it makes the stars feel *earned* one by one,
// which is the entire emotional payload of this screen.

function badgeStars(stars, total) {
  if (!total) return 0;
  const pct = stars / total;
  if (pct >= 1) return 3;
  if (pct >= 0.8) return 2;
  if (pct >= 0.6) return 1;
  return 0;
}

export default function CompletionScreen({ route, navigation }) {
  const {
    gameId = 'abc',
    stars = 0,
    total = 0,
    replayScreen = 'AlphabetGame',
    title = 'You did it!',
    subtitle = 'Great job!',
  } = route.params ?? {};

  const { speak, playComplete } = useSound();
  const enter = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const earned = badgeStars(stars, total);

  useEffect(() => {
    clearProgress(gameId);
    playComplete();
    speak(`${title} ${subtitle}`, { rate: 0.95, pitch: 1.15 });

    const entrance = Animated.spring(enter, {
      toValue: 1, friction: 7, tension: 70, useNativeDriver: true,
    });
    entrance.start();

    const halo = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    halo.start();

    return () => { entrance.stop(); halo.stop(); };
  }, []);

  const cardTranslate = enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const haloScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <LinearGradient colors={skyGradient} style={styles.container}>
      <StatusBar style="light" />
      <ConfettiCannon count={90} origin={{ x: 0, y: 0 }} fadeOut fallSpeed={3200} />
      <ConfettiCannon count={90} origin={{ x: SCREEN_WIDTH, y: 0 }} fadeOut fallSpeed={3200} />

      <Animated.View style={[styles.card, { opacity: enter, transform: [{ translateY: cardTranslate }] }]}>
        <View style={styles.mascotWrap}>
          <Animated.View style={[styles.halo, { transform: [{ scale: haloScale }] }]} />
          <Mascot mood="cheer" size={130} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <StarRow earned={earned} size={44} animate style={styles.stars} />

        <View style={styles.scorePill}>
          <Text style={styles.scoreText}>⭐ {stars}{total ? ` / ${total}` : ''} correct</Text>
        </View>
      </Animated.View>

      <View style={styles.actions}>
        <GameButton
          label="Play again"
          icon="↻"
          size="lg"
          // Replace rather than push, so the reward screen doesn't linger
          // underneath the replay. topicId is passed explicitly: without it
          // the game falls back to its own default id, which happens to match
          // today but would silently write progress to the wrong key the
          // moment one screen serves two topics.
          onPress={() => navigation.replace(replayScreen, {
            startIndex: 0, startStars: 0, topicId: gameId,
          })}
          fullWidth
        />
        <GameButton
          label="Back home"
          icon="🏠"
          variant="soft"
          size="md"
          onPress={() => navigation.navigate('Welcome')}
          fullWidth
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    paddingVertical: spacing.lg, paddingHorizontal: spacing.lg,
    alignItems: 'center', alignSelf: 'stretch', ...shadow.lg,
  },
  mascotWrap: { alignItems: 'center', justifyContent: 'center' },
  // A soft halo behind the character rather than a hard ring — it reads as
  // glow, and it pulses slowly enough not to compete with the star pops.
  halo: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    backgroundColor: colors.sunSoft,
  },
  title: { ...type.title, color: colors.ink, textAlign: 'center', marginTop: spacing.xs },
  subtitle: { ...type.body, color: colors.muted, textAlign: 'center', marginTop: 2 },
  stars: { marginTop: spacing.md },
  scorePill: {
    marginTop: spacing.md, backgroundColor: colors.grapeSoft,
    paddingVertical: 8, paddingHorizontal: spacing.md, borderRadius: radius.pill,
  },
  scoreText: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },

  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg },
});
