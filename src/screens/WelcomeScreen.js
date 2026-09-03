import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import BouncyButton from '../components/BouncyButton';
import { colors, fonts, radius, spacing } from '../theme';

export default function WelcomeScreen({ navigation }) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, [bob]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });

  return (
    <LinearGradient colors={[colors.sky, colors.skyDeep]} style={styles.container}>
      <Animated.Text style={[styles.mascot, { transform: [{ translateY }] }]}>🦉</Animated.Text>
      <Text style={styles.title}>LearnPlay</Text>
      <Text style={styles.subtitle}>Fun games that teach real things!</Text>

      <BouncyButton style={styles.cta} onPress={() => navigation.navigate('GradeSelect')}>
        <Text style={styles.ctaText}>Let's Play! 🎉</Text>
      </BouncyButton>

      <View style={styles.badgeRow}>
        <Text style={styles.badge}>🔤 Letters</Text>
        <Text style={styles.badge}>🔢 Numbers</Text>
        <Text style={styles.badge}>🎨 Colors</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  mascot: { fontSize: 96, marginBottom: spacing.md },
  title: { fontFamily: fonts.displayBold, fontSize: 44, color: colors.white, marginBottom: spacing.xs },
  subtitle: { fontFamily: fonts.body, fontSize: 17, color: colors.white, opacity: 0.95, marginBottom: spacing.xl, textAlign: 'center' },
  cta: {
    backgroundColor: colors.sun, paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    borderRadius: radius.pill, borderWidth: 4, borderColor: colors.white,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  ctaText: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  badge: {
    fontFamily: fonts.bodyBold, color: colors.white, backgroundColor: 'rgba(255,255,255,0.22)',
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.pill, fontSize: 13,
  },
});
