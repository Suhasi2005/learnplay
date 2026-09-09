import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ICON } from './art';
import { ll, llButtons, llRadius, llShadow, llType } from './tokens';

// Little Learners component kit.
//
// The design repeats a small number of shapes with great discipline — a
// gradient pill button with an inset bottom edge, a white card with a
// purple-tinted shadow, a pill badge, a rounded progress track. Each one is
// built once here so the sixteen screens stay identical where the design is
// identical.

// ---------------------------------------------------------------------------
// Motion. The design declares these as CSS keyframes; these are the RN
// equivalents, with the same periods.

export function useLoop({ duration = 4000, delay = 0, enabled = true } = {}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [duration, delay, enabled]);
  return v;
}

// ll-float / ll-bob / ll-float2 — a gentle vertical drift, optionally rocking.
export function Floating({ children, distance = 11, rotate = 0, duration = 4000, delay = 0, style }) {
  const v = useLoop({ duration, delay });
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });
  const rot = v.interpolate({ inputRange: [0, 1], outputRange: [`-${rotate}deg`, `${rotate}deg`] });
  return (
    <Animated.View style={[style, { transform: rotate ? [{ translateY }, { rotate: rot }] : [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

// ll-rise — content entering from below. Used on every bottom sheet.
export function Rise({ children, delay = 0, distance = 22, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(v, { toValue: 1, duration: 600, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [delay]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

// ll-pop / ll-burst — rewards arriving with overshoot.
export function Pop({ children, delay = 0, from = 0.6, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(v, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
    ]);
    a.start();
    return () => a.stop();
  }, [delay]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [from, 1] });
  return <Animated.View style={[style, { opacity: v, transform: [{ scale }] }]}>{children}</Animated.View>;
}

// ---------------------------------------------------------------------------
// Buttons

// The design's primary control: a vertical gradient, a coloured glow beneath,
// and an inset dark line along the bottom edge that reads as thickness.
export function LLButton({
  label, tone = 'pink', onPress, disabled, full = true, size = 'lg', style, shine = false, icon,
}) {
  const press = useRef(new Animated.Value(0)).current;
  const g = llButtons[tone] ?? llButtons.pink;
  const pad = size === 'lg' ? 18 : size === 'md' ? 15 : 13;
  const fontSize = size === 'lg' ? 18 : size === 'md' ? 16 : 14;

  function down() { Animated.timing(press, { toValue: 1, duration: 80, useNativeDriver: true }).start(); }
  function up() { Animated.spring(press, { toValue: 0, friction: 6, tension: 200, useNativeDriver: true }).start(); }

  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, 2] });

  return (
    <Pressable
      onPress={() => { if (!disabled) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress?.(); } }}
      onPressIn={down}
      onPressOut={up}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={[full && { alignSelf: 'stretch' }, style]}
    >
      <Animated.View
        style={[
          styles.btnWrap,
          { transform: [{ translateY }] },
          !disabled && { shadowColor: g.to, shadowOpacity: 0.42, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 6 },
        ]}
      >
        <LinearGradient
          colors={disabled ? [ll.lilac, ll.lilac] : [g.from, g.to]}
          style={[styles.btn, { paddingVertical: pad }]}
        >
          {icon ? <Image source={icon} style={styles.btnIcon} /> : null}
          <Text style={[styles.btnText, { fontSize, color: disabled ? ll.muted : ll.white }]} numberOfLines={1}>
            {label}
          </Text>
          {/* The sweeping highlight on the onboarding CTA. */}
          {shine && !disabled ? <Shine /> : null}
          {/* Inset bottom edge — the design draws this on every filled button. */}
          <View style={styles.btnInset} pointerEvents="none" />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function Shine() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 3600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const translateX = v.interpolate({ inputRange: [0, 1], outputRange: [-90, 320] });
  return (
    <Animated.View style={[styles.shine, { transform: [{ translateX }] }]} pointerEvents="none">
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// A quiet text button — "Skip for now", "Back home".
export function LLTextButton({ label, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.textBtn, style]} accessibilityRole="button">
      <Text style={styles.textBtnLabel}>{label}</Text>
    </Pressable>
  );
}

// The 40–44px rounded-square icon buttons in headers.
export function IconButton({ icon, onPress, label, size = 44, style }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.iconBtn, { width: size, height: size }, style]}
    >
      <Image source={icon} style={{ width: size * 0.68, height: size * 0.68, borderRadius: 10 }} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Surfaces

export function Card({ children, style, radius = llRadius.xxl, pad = 18, tone = ll.white }) {
  return <View style={[{ backgroundColor: tone, borderRadius: radius, padding: pad }, llShadow.card, style]}>{children}</View>;
}

export function Pill({ label, bg = ll.white, color = ll.ink, style, spaced = false }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      <Text style={[styles.pillText, { color }, spaced && { letterSpacing: 1.1 }]}>{label}</Text>
    </View>
  );
}

// The rounded progress track used for XP, question progress and lesson bars.
export function Track({ value = 0, height = 14, colors = [ll.amberWarm, ll.pink, ll.purpleMid], bg = ll.track, glow = false }) {
  const w = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(1, value));
  useEffect(() => {
    const a = Animated.timing(w, { toValue: clamped, duration: 1100, delay: 150, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [clamped]);
  const width = w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const inner = height - 6;
  return (
    <View style={{ height, borderRadius: 99, backgroundColor: bg, padding: 3, overflow: 'hidden' }}>
      <Animated.View style={{ width, height: inner }}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            { flex: 1, borderRadius: 99 },
            glow && { shadowColor: ll.pink, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
          ]}
        />
      </Animated.View>
    </View>
  );
}

// The three-dot page indicator on the onboarding screens.
export function Dots({ count = 3, index = 0, active = ll.pink }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === index ? { width: 26, backgroundColor: active } : { width: 8, backgroundColor: ll.lilac },
          ]}
        />
      ))}
    </View>
  );
}

// A character speaking. The tail sits on whichever side the face is.
export function SpeechRow({ face, children, tone = ll.blueTint, textColor = ll.blueInk, faceSize = 62, float = true }) {
  const bubble = (
    <View style={[styles.bubble, { backgroundColor: tone }]}>
      <Text style={[styles.bubbleText, { color: textColor }]}>{children}</Text>
    </View>
  );
  return (
    <View style={styles.speechRow}>
      {float ? (
        <Floating duration={3800} distance={6}>
          <Image source={face} style={[styles.speechFace, { width: faceSize, height: faceSize, borderRadius: faceSize / 2 }]} />
        </Floating>
      ) : (
        <Image source={face} style={[styles.speechFace, { width: faceSize, height: faceSize, borderRadius: faceSize / 2 }]} />
      )}
      {bubble}
    </View>
  );
}

// Hearts = lives. Spent hearts stay visible at low opacity so a child can see
// what they had, not just what's left.
export function Hearts({ total = 3, left = 3 }) {
  return (
    <View style={styles.hearts} accessibilityLabel={`${left} of ${total} lives left`}>
      {Array.from({ length: total }, (_, i) => (
        <Image key={i} source={ICON.heart} style={[styles.heart, { opacity: i < left ? 1 : 0.28 }]} />
      ))}
    </View>
  );
}

export function StarRow({ count = 3, size = 44, animate = true }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: count }, (_, i) =>
        animate ? (
          <Pop key={i} delay={100 + i * 100}>
            <Image source={ICON.star} style={{ width: size, height: size, borderRadius: size / 3 }} />
          </Pop>
        ) : (
          <Image key={i} source={ICON.star} style={{ width: size, height: size, borderRadius: size / 3 }} />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  btnWrap: { borderRadius: llRadius.xl, overflow: 'visible' },
  btn: {
    borderRadius: llRadius.xl, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 9, overflow: 'hidden',
  },
  btnIcon: { width: 26, height: 26, borderRadius: 9 },
  btnText: { ...llType.button, includeFontPadding: false },
  btnInset: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 3,
    backgroundColor: 'rgba(0,0,0,0.09)',
  },
  shine: { position: 'absolute', top: 0, bottom: 0, width: 60 },

  textBtn: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 10 },
  textBtnLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: ll.muted },

  iconBtn: {
    borderRadius: 16, backgroundColor: ll.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6054BE', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3,
  },

  pill: { alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 13, borderRadius: 99 },
  pillText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11 },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, paddingVertical: 4 },
  dot: { height: 8, borderRadius: 99 },

  speechRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  speechFace: { flexShrink: 0 },
  bubble: { flex: 1, borderRadius: 20, borderBottomLeftRadius: 6, paddingVertical: 12, paddingHorizontal: 14 },
  bubbleText: { fontFamily: 'Nunito_700Bold', fontSize: 13.5, lineHeight: 19.5 },

  hearts: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  heart: { width: 26, height: 26, borderRadius: 9 },

  starRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
