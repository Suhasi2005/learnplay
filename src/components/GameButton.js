import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { PRESS_DEPTH, colors, fonts, radius, shadow, spacing } from '../theme';

// The app's primary control.
//
// A flat rectangle that only changes opacity doesn't read as pressable to a
// five-year-old. This renders a darker base with a lighter face floating
// PRESS_DEPTH above it; pressing drops the face into the base, so the button
// physically compresses and springs back. That single detail is most of the
// difference between "web page" and "game".

const SIZES = {
  lg: { height: 64, fontSize: 22, paddingHorizontal: spacing.xl, iconSize: 26 },
  md: { height: 52, fontSize: 18, paddingHorizontal: spacing.lg, iconSize: 22 },
  sm: { height: 42, fontSize: 15, paddingHorizontal: spacing.md, iconSize: 18 },
};

export default function GameButton({
  onPress,
  label,
  icon,
  variant = 'primary',
  color,
  size = 'md',
  disabled = false,
  haptic = true,
  fullWidth = false,
  style,
  accessibilityLabel,
}) {
  const press = useRef(new Animated.Value(0)).current;
  const dims = SIZES[size] ?? SIZES.md;

  // `soft` is the quiet variant — a tinted surface with dark text, for
  // secondary actions that shouldn't compete with the primary CTA.
  const isSoft = variant === 'soft';
  const isGhost = variant === 'ghost';

  let faceColor = color ?? colors.grape;
  let baseColor = colors.grapeDeep;
  let textColor = colors.white;

  if (variant === 'accent' && color) {
    faceColor = color.bg ?? color;
    baseColor = color.deep ?? colors.inkSoft;
    textColor = colors.ink; // accents are light; ink clears 5.3:1 on all of them
  } else if (isSoft) {
    faceColor = colors.white;
    baseColor = colors.border;
    textColor = colors.ink;
  } else if (isGhost) {
    faceColor = 'transparent';
    baseColor = 'transparent';
    textColor = colors.grapeDeep;
  }

  if (disabled) {
    faceColor = colors.disabled;
    baseColor = colors.border;
    textColor = colors.lock;
  }

  function pressIn() {
    Animated.timing(press, { toValue: 1, duration: 70, useNativeDriver: true }).start();
  }
  function pressOut() {
    Animated.spring(press, { toValue: 0, friction: 5, tension: 200, useNativeDriver: true }).start();
  }
  function handlePress() {
    if (disabled) return;
    // Haptics are separate from the sound toggle on purpose: a muted app is
    // usually muted for the room's sake, and touch feedback still helps.
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  }

  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, PRESS_DEPTH] });

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[fullWidth && styles.fullWidth, style]}
    >
      <View
        style={[
          styles.base,
          { backgroundColor: baseColor, height: dims.height + PRESS_DEPTH },
          !isGhost && !disabled && shadow.sm,
        ]}
      >
        <Animated.View
          style={[
            styles.face,
            {
              backgroundColor: faceColor,
              height: dims.height,
              paddingHorizontal: dims.paddingHorizontal,
              transform: [{ translateY }],
            },
            isSoft && styles.softFace,
          ]}
        >
          {icon ? <Text style={[styles.icon, { fontSize: dims.iconSize }]}>{icon}</Text> : null}
          {label ? (
            <Text
              style={[styles.label, { fontSize: dims.fontSize, color: textColor }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          ) : null}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: { alignSelf: 'stretch' },
  base: { borderRadius: radius.pill, justifyContent: 'flex-start' },
  face: {
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  softFace: { borderWidth: 2, borderColor: colors.border },
  icon: { includeFontPadding: false },
  label: { fontFamily: fonts.displayBold, includeFontPadding: false },
});
