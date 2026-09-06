import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { OUTLINE_WIDTH, PRESS_DEPTH, colors, shade } from '../theme';

// Every tappable surface in the app.
//
// This renders a solid darker base with the real surface floating above it;
// pressing drops the surface into the base and it springs back, so a card
// physically compresses instead of just dimming. A flat rectangle that only
// changes opacity doesn't read as pressable to a five-year-old.
//
// It takes the same props it always did, so the 19 game screens get depth
// without any of them changing: the caller's `style` still describes the
// visible surface, and the base is derived from that surface's own fill.

// Style properties that position the button within its parent. These belong
// to the outer wrapper — left on the face they would slide the surface out
// of alignment with the base sitting behind it.
const WRAPPER_KEYS = [
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'marginHorizontal', 'marginVertical', 'marginStart', 'marginEnd',
  'alignSelf', 'flex', 'flexGrow', 'flexShrink', 'flexBasis',
  'position', 'top', 'bottom', 'left', 'right', 'zIndex',
];

// Shadow lives on the base so the whole unit casts one shadow. Android needs
// a background colour for elevation to render, which the base has and the
// transparent wrapper does not.
const SHADOW_KEYS = [
  'shadowColor', 'shadowOpacity', 'shadowRadius', 'shadowOffset', 'elevation',
];

const RADIUS_KEYS = [
  'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius',
  'borderBottomLeftRadius', 'borderBottomRightRadius',
];

function pick(source, keys) {
  const out = {};
  for (const k of keys) if (source[k] !== undefined) out[k] = source[k];
  return out;
}

function omit(source, keys) {
  const out = { ...source };
  for (const k of keys) delete out[k];
  return out;
}

export default function BouncyButton({
  onPress,
  style,
  disabled,
  children,
  depth,
  baseColor,
  accessibilityLabel,
  accessibilityRole = 'button',
}) {
  const press = useRef(new Animated.Value(0)).current;

  const flat = StyleSheet.flatten(style) || {};
  const fill = flat.backgroundColor;

  // Only opaque hex fills get a base. Text-only, transparent and translucent
  // buttons keep the original squash animation instead: a base behind bare
  // text is a coloured slab, and a base under a translucent face shows
  // through it as a dark band.
  const isSolid = typeof fill === 'string' && fill.startsWith('#');

  // Bigger surfaces need more depth to read as chunky; a 44px icon button
  // with an 8px base looks broken rather than tactile.
  const height = typeof flat.height === 'number' ? flat.height : null;
  const resolvedDepth = depth ?? (height === null ? PRESS_DEPTH : height >= 100 ? 8 : height <= 56 ? 4 : PRESS_DEPTH);

  const wrapperStyle = pick(flat, WRAPPER_KEYS);
  const shadowStyle = pick(flat, SHADOW_KEYS);
  const radiusStyle = pick(flat, RADIUS_KEYS);
  const faceStyle = omit(flat, [...WRAPPER_KEYS, ...SHADOW_KEYS]);

  function pressIn() {
    if (disabled) return;
    Animated.timing(press, {
      toValue: 1, duration: 70, useNativeDriver: true,
    }).start();
  }

  function pressOut() {
    if (disabled) return;
    Animated.spring(press, {
      toValue: 0, friction: 5, tension: 220, useNativeDriver: true,
    }).start();
  }

  if (!isSolid) {
    const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });
    return (
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityState={{ disabled: !!disabled }}
        accessibilityLabel={accessibilityLabel}
      >
        <Animated.View style={[style, { transform: [{ scale }] }]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, resolvedDepth] });
  const base = disabled ? colors.border : (baseColor ?? shade(fill));

  // The sticker outline goes on both layers so the silhouette stays unbroken
  // while the surface travels: outlining only the face would leave the base's
  // exposed strip looking like a detached shadow. A caller that sets its own
  // border keeps it — some cards use a coloured border to signal state.
  const hasOwnBorder = faceStyle.borderWidth !== undefined;
  const outlineFace = hasOwnBorder ? null : { borderWidth: OUTLINE_WIDTH, borderColor: colors.outline };
  const outlineBase = hasOwnBorder ? null : {
    borderWidth: OUTLINE_WIDTH,
    borderColor: colors.outline,
    // The base's top edge is hidden behind the face at rest and covered by it
    // when pressed, so drawing it there would only ever show as a seam.
    borderTopWidth: 0,
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      style={wrapperStyle}
    >
      {/* Reserving the depth as padding keeps the base inside the layout box,
          so the button never relies on overflow that Android may clip. The
          flex passthrough matters for buttons that stretch to fill a row —
          without it the wrapper stretches but the surface inside doesn't. */}
      <View style={{ paddingBottom: resolvedDepth, flex: wrapperStyle.flex ? 1 : undefined }}>
        <View
          style={[
            styles.base,
            radiusStyle,
            shadowStyle,
            outlineBase,
            { backgroundColor: base, top: resolvedDepth },
          ]}
        />
        <Animated.View style={[faceStyle, outlineFace, { transform: [{ translateY }] }]}>
          {children}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
