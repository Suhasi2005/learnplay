import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import BouncyButton from '../components/BouncyButton';
import { ALPHABET } from '../gameData';
import { colors, fonts, radius, spacing } from '../theme';

export default function CompletionScreen({ route, navigation }) {
  const { stars } = route.params;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Speech.speak("You did it! You learned the whole alphabet!", { rate: 0.95, pitch: 1.15 });
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 3000, useNativeDriver: true }),
    ).start();
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <LinearGradient colors={[colors.sun, colors.coral]} style={styles.container}>
      <Animated.Text style={[styles.trophy, { transform: [{ rotate }] }]}>🏆</Animated.Text>
      <Text style={styles.title}>You did it!</Text>
      <Text style={styles.subtitle}>You learned all {ALPHABET.length} letters!</Text>

      <Text style={styles.starsText}>⭐ {stars} Stars</Text>

      <BouncyButton
        style={styles.button}
        onPress={() => navigation.navigate('AlphabetGame')}
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
  title: { fontFamily: fonts.displayBold, fontSize: 34, color: colors.white },
  subtitle: { fontFamily: fonts.body, fontSize: 16, color: colors.white, marginTop: spacing.xs, marginBottom: spacing.md },
  starsText: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.white, marginBottom: spacing.xl },
  button: {
    backgroundColor: colors.white, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl,
    borderRadius: radius.pill, marginBottom: spacing.sm, minWidth: 220, alignItems: 'center',
  },
  buttonText: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.coralDeep },
  buttonSecondary: { backgroundColor: 'rgba(255,255,255,0.25)' },
  buttonTextSecondary: { color: colors.white },
});
