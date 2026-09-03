import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { bgGradient, colors } from '../theme';

// The world the UI sits inside.
//
// A flat fill makes any screen read as a document. These are soft organic
// blobs drifting behind the content — enough to suggest depth and place
// without competing with anything a child needs to tap. Kept at low opacity
// on purpose: decoration that draws the eye is a bug here, not a feature.

function Drifter({ children, style, duration, delay = 0, distance = 14 }) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1, duration, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });
  return (
    <Animated.View style={[styles.drifter, style, { transform: [{ translateY }] }]} pointerEvents="none">
      {children}
    </Animated.View>
  );
}

export default function SceneBackground({ colors: gradientColors = bgGradient, variant = 'meadow', children, style }) {
  return (
    <LinearGradient colors={gradientColors} style={[styles.fill, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Big soft blobs, top-left and bottom-right, framing the content. */}
        <Drifter style={{ top: -40, left: -50 }} duration={5200} distance={16}>
          <Svg width={220} height={220} viewBox="0 0 100 100">
            <Path
              d="M50 5 C75 5 95 25 95 50 C95 78 72 96 48 94 C22 92 5 72 5 47 C5 22 25 5 50 5 Z"
              fill={colors.grape}
              opacity={variant === 'hero' ? 0.16 : 0.09}
            />
          </Svg>
        </Drifter>

        <Drifter style={{ bottom: -60, right: -60 }} duration={6400} delay={600} distance={20}>
          <Svg width={260} height={260} viewBox="0 0 100 100">
            <Path
              d="M52 6 C80 8 96 30 94 55 C92 80 70 96 45 93 C20 90 4 68 7 43 C10 20 28 4 52 6 Z"
              fill={variant === 'hero' ? colors.white : colors.sky}
              opacity={variant === 'hero' ? 0.12 : 0.1}
            />
          </Svg>
        </Drifter>

        {/* A few sparkles for life. Odd count, uneven spacing — a grid of
            these would read as a pattern rather than as stars. */}
        <Drifter style={{ top: '16%', right: '14%' }} duration={2600} distance={10}>
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill={colors.sun} opacity="0.75" />
          </Svg>
        </Drifter>
        <Drifter style={{ top: '38%', left: '8%' }} duration={3100} delay={400} distance={8}>
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Circle cx="12" cy="12" r="6" fill={colors.coral} opacity="0.5" />
          </Svg>
        </Drifter>
        <Drifter style={{ bottom: '24%', left: '18%' }} duration={2900} delay={800} distance={12}>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill={colors.grass} opacity="0.6" />
          </Svg>
        </Drifter>
      </View>

      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  drifter: { position: 'absolute' },
});
