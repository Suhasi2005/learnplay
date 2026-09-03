import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

// Three stars is the whole reward vocabulary of the app — earned stars are
// gold and full, unearned ones are a hollow outline rather than absent, so a
// child can always see how many are still there to win.

function Star({ filled, size, delay, animate }) {
  const pop = useRef(new Animated.Value(animate && filled ? 0 : 1)).current;

  useEffect(() => {
    if (!animate || !filled) return undefined;
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [filled, animate]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M12 2.6 L15.1 9 L22 10 L17 14.9 L18.2 21.8 L12 18.5 L5.8 21.8 L7 14.9 L2 10 L8.9 9 Z"
          fill={filled ? colors.sun : 'transparent'}
          stroke={filled ? colors.sunDeep : colors.lock}
          strokeWidth={filled ? 1.2 : 1.8}
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}

export default function StarRow({ earned = 0, total = 3, size = 28, animate = false, style }) {
  return (
    <View style={[styles.row, style]} accessibilityLabel={`${earned} of ${total} stars`}>
      {Array.from({ length: total }, (_, i) => (
        <Star key={i} filled={i < earned} size={size} delay={i * 160} animate={animate} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, alignItems: 'center' },
});
