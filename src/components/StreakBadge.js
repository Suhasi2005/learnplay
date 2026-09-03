import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../theme';

export default function StreakBadge({ streak }) {
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (streak >= 2) {
      pop.setValue(0.5);
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 4, tension: 120 }).start();
    }
  }, [streak]);

  if (streak < 2) return null;

  return (
    <Animated.View style={[styles.badge, { transform: [{ scale: pop }] }]}>
      <Text style={styles.text}>🔥 {streak} in a row!</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute', top: 60, alignSelf: 'center',
    backgroundColor: colors.sun, borderRadius: radius.pill,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
    borderWidth: 3, borderColor: colors.white,
    ...shadow.md,
  },
  // Gold rather than alarm-coral: a streak is a reward, and it shares the
  // star colour it's rewarding. Ink on sun measures 8.4:1 — the most legible
  // pairing in the palette, which matters for something this small.
  text: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13 },
});
