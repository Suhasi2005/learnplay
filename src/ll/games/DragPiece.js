import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { Animated, PanResponder, View } from 'react-native';

// A game object a child can pick up and put somewhere.
//
// Every "learn by doing" mechanic in Little Learners is some version of the
// same gesture: lift a thing, carry it toward a place, let go. Beads onto a
// string, carriages onto a train, animals into a habitat, coins onto a price
// tag. Doing that once here keeps the *feel* identical across games — the
// same lift, the same weight, the same spring home — while each game decides
// what "somewhere" means.
//
// Three deliberate choices, all about the age band:
//
//  - A tap counts as a placement. A three-year-old aiming for a drag very
//    often produces a tap; refusing it would teach them the game is broken,
//    not that their gesture was short.
//  - The threshold is generous and directional. The child must move the
//    piece *the right way* (up toward the string, sideways toward the train)
//    but nowhere near precisely.
//  - Release anywhere else springs the piece home rather than failing. Only a
//    committed move in the target direction is an answer, so exploratory
//    dragging costs nothing — no hearts, no wrong-answer sound.
//
// The component owns no game state and validates nothing: it reports "the
// child placed this" and the screen's existing handler decides if it was
// right. That keeps scoring logic exactly where it already lives.
//
// onDrop receives (placed, gesture). `gesture.moveX/moveY` are absolute
// screen coordinates, so a game with several drop targets can hit-test the
// release point instead of relying on direction alone.
export default function DragPiece({
  children,
  onLift,
  onMove,
  onDrop,
  disabled = false,
  // 'up' | 'down' | 'right' | 'left' | 'any' — which way counts as a placement.
  direction = 'up',
  threshold = 52,
  liftTo = 1.12,
  // An external Animated value that replaces the lift scale (a wrong-answer
  // bounce, say), so feedback animations stay owned by the screen.
  overrideScale = null,
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
}) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lift = useRef(new Animated.Value(0)).current;
  const moved = useRef(false);

  // The PanResponder below is created once, so anything it reads directly is
  // frozen at the first render. Screens pass handlers that close over live
  // state (the current step, what's already placed, the flow's round index),
  // so reading them straight from props would score every later tap against
  // stale state. Refreshing this ref each render keeps the responder current.
  const latest = useRef(null);
  latest.current = { onLift, onMove, onDrop, disabled, direction, threshold };

  function springHome() {
    Animated.parallel([
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, tension: 160, useNativeDriver: true }),
      Animated.spring(lift, { toValue: 0, friction: 6, tension: 220, useNativeDriver: true }),
    ]).start();
  }

  function didPlace(gesture) {
    // A tap — no meaningful travel — is a placement.
    if (!moved.current) return true;
    const { direction: dir, threshold: min } = latest.current;
    switch (dir) {
      case 'up': return gesture.dy < -min;
      case 'down': return gesture.dy > min;
      case 'right': return gesture.dx > min;
      case 'left': return gesture.dx < -min;
      default: return Math.abs(gesture.dx) > min || Math.abs(gesture.dy) > min;
    }
  }

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !latest.current.disabled,
      onMoveShouldSetPanResponder: () => !latest.current.disabled,
      onPanResponderGrant: () => {
        moved.current = false;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        Animated.spring(lift, { toValue: 1, friction: 6, tension: 220, useNativeDriver: true }).start();
        latest.current.onLift?.();
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dy) > 4 || Math.abs(gesture.dx) > 4) moved.current = true;
        pan.setValue({ x: gesture.dx, y: gesture.dy });
        // Lets a screen highlight whichever drop target the finger is over.
        latest.current.onMove?.(gesture);
      },
      onPanResponderRelease: (_, gesture) => {
        const placed = didPlace(gesture);
        springHome();
        // The gesture is passed on so a screen with several drop targets can
        // hit-test the release point against its own measured zones.
        latest.current.onDrop?.(placed, gesture);
      },
      onPanResponderTerminate: () => {
        springHome();
        latest.current.onDrop?.(false, null);
      },
    }),
  ).current;

  const liftScale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, liftTo] });

  return (
    <Animated.View
      {...responder.panHandlers}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={[
        style,
        {
          transform: [
            ...pan.getTranslateTransform(),
            { scale: overrideScale ?? liftScale },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// A puff of steam / dust where a piece lands. Purely decorative; mount it
// keyed on the placement so it replays each time.
export function Puff({ size = 34, color = 'rgba(255,255,255,0.9)', delay = 0, style }) {
  const v = useRef(new Animated.Value(0)).current;
  const started = useRef(false);
  if (!started.current) {
    started.current = true;
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration: 620, useNativeDriver: true }),
    ]).start();
  }
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.9] });
  const opacity = v.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.85, 0] });
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -26] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        { opacity, transform: [{ scale }, { translateY }] },
        style,
      ]}
    />
  );
}

// A row of sleepers + rail. Used by any game that needs a track to sit on.
export function Rail({ width, sleepers = 8, style }) {
  const gap = width / sleepers;
  return (
    <View style={[{ width, height: 16 }, style]} pointerEvents="none">
      <View style={{ position: 'absolute', top: 6, left: 0, right: 0, height: 4, borderRadius: 2, backgroundColor: '#B3A9D6' }} />
      <View style={{ position: 'absolute', top: 11, left: 0, right: 0, height: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.6)' }} />
      {Array.from({ length: sleepers }, (_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute', top: 2, left: i * gap + gap * 0.3,
            width: 5, height: 12, borderRadius: 2, backgroundColor: '#C8BEE8',
          }}
        />
      ))}
    </View>
  );
}
