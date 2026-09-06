import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { poseFor } from '../gameAssets';

// The companion, rendered from artwork.
//
// Three things make a drawn character feel alive rather than pasted on, and
// all three are handled here so no screen has to think about it:
//
//   1. It never holds perfectly still — a slow breathing scale runs always.
//   2. Poses cross-fade instead of snapping, so a mood change reads as the
//      character reacting rather than as an image swap.
//   3. Reacting poses land with a spring overshoot, which is what sells a
//      celebration as excitement instead of a state change.
//
// Moods: idle | happy | cheer | think | oops | point

const REACTIONS = new Set(['cheer', 'oops']);

export default function Character({
  mood = 'idle',
  size = 200,
  flip = false,
  style,
  animate = true,
}) {
  const breathe = useRef(new Animated.Value(0)).current;
  const react = useRef(new Animated.Value(1)).current;

  // Two layers cross-fading: `shown` is what's on screen, `incoming` fades in
  // over it and then becomes `shown`.
  const [shown, setShown] = useState(mood);
  const [incoming, setIncoming] = useState(null);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mood === shown) return;
    setIncoming(mood);
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setShown(mood);
      setIncoming(null);
      fade.setValue(0);
    });
  }, [mood]);

  useEffect(() => {
    if (!animate) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1, duration: mood === 'cheer' ? 420 : 1900,
          easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0, duration: mood === 'cheer' ? 420 : 1900,
          easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, mood]);

  useEffect(() => {
    if (!animate || !REACTIONS.has(mood)) return undefined;
    react.setValue(0.86);
    const anim = Animated.spring(react, {
      toValue: 1, friction: 4, tension: 150, useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [mood, animate]);

  const bob = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [0, mood === 'cheer' ? -14 : -5],
  });
  const swell = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.018] });

  const frame = { width: size, height: size * 1.33 };

  return (
    <Animated.View
      style={[
        frame,
        style,
        {
          transform: [
            { translateY: bob },
            { scale: Animated.multiply(swell, react) },
            { scaleX: flip ? -1 : 1 },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <Animated.Image
        source={poseFor(shown)}
        style={[styles.pose, incoming ? { opacity: Animated.subtract(1, fade) } : null]}
        resizeMode="contain"
      />
      {incoming && (
        <Animated.Image
          source={poseFor(incoming)}
          style={[styles.pose, { opacity: fade }]}
          resizeMode="contain"
        />
      )}
    </Animated.View>
  );
}

// A character standing in the scene rather than floating in it — the shadow
// is what puts weight under a cutout and stops it looking like a sticker.
export function GroundedCharacter({ size = 200, shadow = true, ...props }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Character size={size} {...props} />
      {shadow && (
        <View
          style={[
            styles.shadow,
            { width: size * 0.52, height: size * 0.1, borderRadius: size * 0.26, marginTop: -size * 0.06 },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pose: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  shadow: { backgroundColor: 'rgba(12,10,28,0.28)' },
});
