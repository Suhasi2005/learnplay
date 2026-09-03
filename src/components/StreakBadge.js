import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

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
    backgroundColor: colors.coral, borderRadius: radius.pill,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
    borderWidth: 2, borderColor: colors.white,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  // White on coral measures ~2.7:1 (fails WCAG AA even for large text);
  // ink on coral measures ~4.8:1 (passes normal-text AA).
  text: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13 },
});
