import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, ImageBackground, StyleSheet, View } from 'react-native';
import { worldFor } from '../gameAssets';

// A screen set inside a world.
//
// The artwork is full-bleed and slowly drifts, which is what separates "a
// scene" from "a background image" — a still photo behind a UI reads as
// wallpaper, a moving one reads as a place.
//
// The scrim is the important part. Artwork is arbitrary and will not respect
// our contrast decisions: a bright sky destroys white text, a dark cave
// destroys dark text. Every world declares how much protection it needs, and
// UI text sits on top of that guarantee rather than on top of a hope.

export default function WorldScene({
  world = 'home',
  children,
  style,
  drift = true,
  // Extra darkening on top of the world's own, for screens with dense UI.
  scrimBoost = 0,
  // Fades the very top and bottom so headers and action bars always have
  // something to sit against, whatever the art does there.
  edgeFade = true,
}) {
  const w = worldFor(world);
  const pan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!drift) return undefined;
    // Slow enough to be felt rather than watched. A fast pan is distracting
    // and, on a learning screen, actively unhelpful.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pan, {
          toValue: 1, duration: 18000, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
        Animated.timing(pan, {
          toValue: 0, duration: 18000, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, world]);

  const translateX = pan.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] });
  const translateY = pan.interpolate({ inputRange: [0, 1], outputRange: [6, -6] });
  const scrim = Math.min(0.75, (w.scrim ?? 0.25) + scrimBoost);

  return (
    <View style={[styles.root, style]}>
      {/* Oversized so the drift never exposes an edge. */}
      <Animated.View
        style={[styles.layer, { transform: [{ translateX }, { translateY }, { scale: 1.06 }] }]}
        pointerEvents="none"
      >
        <ImageBackground source={w.image} style={styles.fill} resizeMode="cover" />
      </Animated.View>

      <View style={[styles.layer, { backgroundColor: `rgba(12,10,28,${scrim})` }]} pointerEvents="none" />

      {edgeFade && (
        <>
          <LinearGradient
            colors={['rgba(12,10,28,0.55)', 'rgba(12,10,28,0)']}
            style={[styles.edge, { top: 0, height: 190 }]}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['rgba(12,10,28,0)', 'rgba(12,10,28,0.6)']}
            style={[styles.edge, { bottom: 0, height: 230 }]}
            pointerEvents="none"
          />
        </>
      )}

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: '#0C0A1C' },
  layer: { ...StyleSheet.absoluteFillObject },
  fill: { flex: 1 },
  edge: { position: 'absolute', left: 0, right: 0 },
  content: { flex: 1 },
});
