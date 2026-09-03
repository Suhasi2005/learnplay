import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import BouncyButton from '../components/BouncyButton';
import { useSound } from '../context/SoundContext';
import { colors, fonts, radius, spacing } from '../theme';

function FloatingEmoji({ emoji, style, duration = 2600, delay = 0, distance = 12 }) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });

  return (
    <Animated.Text style={[styles.floatingEmoji, style, { transform: [{ translateY }] }]}>
      {emoji}
    </Animated.Text>
  );
}

export default function WelcomeScreen({ navigation }) {
  const { soundOn, toggleSound } = useSound();
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });

  return (
    <LinearGradient colors={[colors.sky, colors.skyDeep]} style={styles.container}>
      <StatusBar style="light" />

      <BouncyButton style={styles.soundToggle} onPress={toggleSound}>
        <Text style={styles.soundIcon}>{soundOn ? '🔊' : '🔇'}</Text>
      </BouncyButton>

      <FloatingEmoji emoji="☁️" style={styles.cloud1} duration={3200} distance={10} />
      <FloatingEmoji emoji="☁️" style={styles.cloud2} duration={3600} delay={400} distance={8} />
      <FloatingEmoji emoji="⭐" style={styles.star1} duration={2000} distance={14} />
      <FloatingEmoji emoji="🌟" style={styles.star2} duration={2400} delay={300} distance={16} />
      <FloatingEmoji emoji="✨" style={styles.star3} duration={2200} delay={600} distance={12} />

      <Animated.Text style={[styles.mascot, { transform: [{ translateY }] }]}>🦉</Animated.Text>
      <Text style={styles.title}>LearnPlay</Text>
      <Text style={styles.subtitle}>Fun games that teach real things!</Text>

      <BouncyButton style={styles.cta} onPress={() => navigation.navigate('GradeSelect')}>
        <Text style={styles.ctaText}>Let's Play! 🎉</Text>
      </BouncyButton>

      <View style={styles.badgeRow}>
        <Text style={styles.badge}>🔤 English</Text>
        <Text style={styles.badge}>🔢 Math</Text>
        <Text style={styles.badge}>🌎 World Around Us</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  soundToggle: {
    position: 'absolute', top: 14, right: 14, zIndex: 10,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center',
  },
  soundIcon: { fontSize: 20 },
  floatingEmoji: { position: 'absolute', fontSize: 34, opacity: 0.85 },
  cloud1: { top: '12%', left: '10%', fontSize: 44 },
  cloud2: { top: '20%', right: '8%', fontSize: 36 },
  star1: { top: '30%', left: '18%' },
  star2: { bottom: '28%', right: '14%' },
  star3: { bottom: '16%', left: '12%' },
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
