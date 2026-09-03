import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

// "Pip" — the companion character.
//
// Drawn rather than imported so every expression is the same shape with
// different eyes and mouth, which is what makes a character read as one
// creature reacting instead of a set of unrelated stickers. Emoji can't do
// that: 🦉 and 🎉 are two different drawings by two different hands.
//
// Moods: idle | happy | cheer | think | oops
const AnimatedG = Animated.createAnimatedComponent(G);

const BODY = '#7C5CE6';
const BODY_LIGHT = '#9B80F0';
const BELLY = '#FFF3D6';
const BEAK = '#FFB53C';
const BEAK_DEEP = '#E09600';

function Eyes({ mood }) {
  // Closed, happy arcs — used when celebrating, where round eyes look blank.
  if (mood === 'cheer' || mood === 'happy') {
    return (
      <G>
        <Path d="M28 40 q7 -9 14 0" stroke={colors.ink} strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <Path d="M58 40 q7 -9 14 0" stroke={colors.ink} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      </G>
    );
  }
  // Downturned, soft — gentle disappointment, never a scowl.
  if (mood === 'oops') {
    return (
      <G>
        <Path d="M28 36 q7 7 14 0" stroke={colors.ink} strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <Path d="M58 36 q7 7 14 0" stroke={colors.ink} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      </G>
    );
  }
  // Open eyes. Looking up-and-aside while thinking, straight ahead otherwise.
  const pupilDx = mood === 'think' ? 3 : 0;
  const pupilDy = mood === 'think' ? -3 : 0;
  return (
    <G>
      <Ellipse cx="35" cy="39" rx="9.5" ry="10.5" fill={colors.white} />
      <Ellipse cx="65" cy="39" rx="9.5" ry="10.5" fill={colors.white} />
      <Circle cx={35 + pupilDx} cy={39 + pupilDy} r="5.2" fill={colors.ink} />
      <Circle cx={65 + pupilDx} cy={39 + pupilDy} r="5.2" fill={colors.ink} />
      {/* Catchlights sell "alive" more than any other single detail. */}
      <Circle cx={37 + pupilDx} cy={36.5 + pupilDy} r="1.9" fill={colors.white} />
      <Circle cx={67 + pupilDx} cy={36.5 + pupilDy} r="1.9" fill={colors.white} />
    </G>
  );
}

function Mouth({ mood }) {
  if (mood === 'cheer') {
    return <Path d="M42 60 q8 12 16 0 q-8 5 -16 0" fill={BEAK_DEEP} stroke={BEAK_DEEP} strokeWidth="1.5" />;
  }
  if (mood === 'oops') {
    return <Path d="M43 63 q7 -5 14 0" stroke={BEAK_DEEP} strokeWidth="3" fill="none" strokeLinecap="round" />;
  }
  if (mood === 'think') {
    return <Path d="M44 62 h10" stroke={BEAK_DEEP} strokeWidth="3" fill="none" strokeLinecap="round" />;
  }
  // Little beak for idle/happy.
  return <Path d="M50 55 l7 8 l-14 0 z" fill={BEAK} stroke={BEAK_DEEP} strokeWidth="1.2" strokeLinejoin="round" />;
}

export default function Mascot({ mood = 'idle', size = 120, animate = true }) {
  const bob = useRef(new Animated.Value(0)).current;
  const wing = useRef(new Animated.Value(0)).current;

  // Breathing bob. Every mood gets it so the character never looks frozen;
  // cheering just breathes faster.
  useEffect(() => {
    if (!animate) return undefined;
    const duration = mood === 'cheer' ? 380 : 1500;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, mood]);

  useEffect(() => {
    if (!animate || mood !== 'cheer') {
      wing.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wing, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(wing, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, mood]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, mood === 'cheer' ? -10 : -5] });
  const wingRotate = wing.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-24deg'] });

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ translateY }] }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="body" cx="40%" cy="30%" r="75%">
            <Stop offset="0" stopColor={BODY_LIGHT} />
            <Stop offset="1" stopColor={BODY} />
          </RadialGradient>
        </Defs>

        {/* Contact shadow — grounds the character instead of floating it. */}
        <Ellipse cx="50" cy="93" rx="24" ry="4.5" fill={colors.ink} opacity="0.13" />

        {/* Feet */}
        <Path d="M40 84 l-5 6 M40 84 l0 7 M40 84 l5 6" stroke={BEAK_DEEP} strokeWidth="2.6" strokeLinecap="round" />
        <Path d="M60 84 l-5 6 M60 84 l0 7 M60 84 l5 6" stroke={BEAK_DEEP} strokeWidth="2.6" strokeLinecap="round" />

        {/* Body */}
        <Ellipse cx="50" cy="52" rx="34" ry="34" fill="url(#body)" />
        {/* Belly patch, offset slightly low — reads as weight, not a bullseye. */}
        <Ellipse cx="50" cy="60" rx="21" ry="22" fill={BELLY} opacity="0.95" />

        {/* Ear tufts */}
        <Path d="M24 26 q3 -12 12 -8" stroke={BODY} strokeWidth="7" fill="none" strokeLinecap="round" />
        <Path d="M76 26 q-3 -12 -12 -8" stroke={BODY} strokeWidth="7" fill="none" strokeLinecap="round" />

        <Eyes mood={mood} />
        <Mouth mood={mood} />

        {/* Wings. The right one flaps on cheer; both rest otherwise. */}
        <Ellipse cx="17" cy="55" rx="8" ry="15" fill={BODY} />
        <AnimatedG
          origin="83, 45"
          style={{ transform: [{ rotate: wingRotate }] }}
        >
          <Ellipse cx="83" cy="55" rx="8" ry="15" fill={BODY} />
        </AnimatedG>

        {/* Cheek blush — only when pleased. */}
        {(mood === 'happy' || mood === 'cheer') && (
          <G opacity="0.5">
            <Ellipse cx="26" cy="52" rx="6" ry="4" fill={colors.coral} />
            <Ellipse cx="74" cy="52" rx="6" ry="4" fill={colors.coral} />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
}

// A small inline version for headers and rows, where the full character
// with its shadow and feet would be too busy at 40px.
export function MascotBadge({ size = 44, mood = 'happy' }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="20 15 60 60">
        <Ellipse cx="50" cy="52" rx="34" ry="34" fill={BODY} />
        <Ellipse cx="50" cy="60" rx="21" ry="22" fill={BELLY} opacity="0.95" />
        <Path d="M24 26 q3 -12 12 -8" stroke={BODY} strokeWidth="7" fill="none" strokeLinecap="round" />
        <Path d="M76 26 q-3 -12 -12 -8" stroke={BODY} strokeWidth="7" fill="none" strokeLinecap="round" />
        <Eyes mood={mood} />
        <Mouth mood={mood} />
      </Svg>
    </View>
  );
}
