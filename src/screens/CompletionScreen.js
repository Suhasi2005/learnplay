import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import BouncyButton from '../components/BouncyButton';
import { useSound } from '../context/SoundContext';
import { clearProgress } from '../storage';
import { colors, fonts, radius, spacing } from '../theme';

export default function CompletionScreen({ route, navigation }) {
  const {
    gameId = 'abc',
    stars = 0,
    replayScreen = 'AlphabetGame',
    title = 'You did it!',
    subtitle = 'Great job!',
  } = route.params ?? {};

  const { speak } = useSound();
  const spin = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(null);

  useEffect(() => {
    clearProgress(gameId);
    speak(`${title} ${subtitle}`, { rate: 0.95, pitch: 1.15 });
    spinAnim.current = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 3000, useNativeDriver: true }),
    );
    spinAnim.current.start();
    return () => spinAnim.current?.stop();
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <LinearGradient colors={[colors.sun, colors.coral]} style={styles.container}>
      <StatusBar style="light" />
      <ConfettiCannon count={120} origin={{ x: 0, y: 0 }} fadeOut fallSpeed={3200} />
      <ConfettiCannon count={120} origin={{ x: 400, y: 0 }} fadeOut fallSpeed={3200} />

      <Animated.Text style={[styles.trophy, { transform: [{ rotate }] }]}>🏆</Animated.Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <Text style={styles.starsText}>⭐ {stars} Stars</Text>

      <BouncyButton
        style={styles.button}
        onPress={() => navigation.navigate(replayScreen)}
      >
        <Text style={styles.buttonText}>Play Again 🔁</Text>
      </BouncyButton>
      <BouncyButton
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => navigation.navigate('Welcome')}
      >
        <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Back Home 🏠</Text>
      </BouncyButton>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  trophy: { fontSize: 100, marginBottom: spacing.sm },
  title: { fontFamily: fonts.displayBold, fontSize: 34, color: colors.white, textAlign: 'center' },
  subtitle: { fontFamily: fonts.body, fontSize: 16, color: colors.white, marginTop: spacing.xs, marginBottom: spacing.md, textAlign: 'center' },
  starsText: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.white, marginBottom: spacing.xl },
  button: {
    backgroundColor: colors.white, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl,
    borderRadius: radius.pill, marginBottom: spacing.sm, minWidth: 220, alignItems: 'center',
  },
  buttonText: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.coralDeep },
  buttonSecondary: { backgroundColor: 'rgba(255,255,255,0.25)' },
  buttonTextSecondary: { color: colors.white },
});
