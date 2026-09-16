import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { llElevation, llRing, llSheen, llSurface } from './tokens';

// Premium surface helpers.
//
// One CSS rule in the design does four things at once:
//
//   box-shadow: 0 1px 2px rgba(46,42,99,.07),    contact
//               0 16px 30px rgba(96,84,190,.16), cast
//               inset 0 1px 0 #fff,              top highlight
//               inset 0 0 0 1px rgba(...,.10);   inner ring
//
// React Native allows one shadow per View and no inset shadows at all, so
// each piece is rebuilt from parts that a native view *can* do:
//
//   outer View   -> cast shadow (the wide soft halo)
//   inner View   -> contact shadow (the tight dark line underneath)
//   LinearGradient -> the surface fill, near-white but never flat
//   border       -> the hairline inner ring
//   overlay View -> the white top highlight and the gloss sheen
//
// Nothing here holds state or intercepts touches: PremiumSurface renders a
// plain View tree, so it can wrap an existing card body without changing a
// single interaction. Overlays are all pointerEvents="none".

// A card/tile with the full elevation stack. Drop-in replacement for a
// `<View style={[styles.card, llShadow.card]}>` wrapper.
//
//   depth="flat"  — contact only, for things sitting almost on the surface
//   depth="card"  — contact + cast (the default)
//   depth="hero"  — contact + deep cast, for stages and reward panels
export function PremiumSurface({
  children,
  radius = 26,
  surface = llSurface.white,
  depth = 'card',
  ring = 'faint',
  highlight = true,
  sheen = null,
  tint = null,
  style,
  contentStyle,
  pointerEvents,
}) {
  const cast = depth === 'hero' ? llElevation.castDeep : depth === 'flat' ? null : llElevation.cast;
  const ringStyle = ring === 'light' ? llRing.light : ring === 'none' ? null : llRing.faint;
  const sheenSpec = typeof sheen === 'string' ? llSheen[sheen] : sheen;

  return (
    <View style={[cast, tint ? { shadowColor: tint } : null, { borderRadius: radius }, style]} pointerEvents={pointerEvents}>
      <View style={[llElevation.contact, { borderRadius: radius }]}>
        <LinearGradient
          colors={surface}
          style={[{ borderRadius: radius, overflow: 'hidden' }, ringStyle, contentStyle]}
        >
          {sheenSpec ? (
            <LinearGradient
              colors={sheenSpec.colors}
              locations={sheenSpec.locations}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          ) : null}
          {highlight ? <View style={[styles.topHighlight, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]} pointerEvents="none" /> : null}
          {children}
        </LinearGradient>
      </View>
    </View>
  );
}

// A gloss wash to lay over an already-coloured fill (a solid zone tile, a
// gradient button). Absolute-positioned; give the parent a borderRadius and
// overflow:'hidden'.
export function Sheen({ variant = 'tile', radius, style }) {
  const spec = llSheen[variant] ?? llSheen.tile;
  return (
    <LinearGradient
      colors={spec.colors}
      locations={spec.locations}
      style={[StyleSheet.absoluteFill, radius ? { borderRadius: radius } : null, style]}
      pointerEvents="none"
    />
  );
}

// The white top edge on its own, for surfaces that already have their own
// background and only need the light-catch.
export function TopHighlight({ radius = 26, style }) {
  return (
    <View
      style={[styles.topHighlight, { borderTopLeftRadius: radius, borderTopRightRadius: radius }, style]}
      pointerEvents="none"
    />
  );
}

// Specular highlight for round objects — beads, coins, bubbles. CSS does this
// with a radial-gradient; here it's a soft white ellipse at the top-left,
// which reads identically at these sizes.
export function Specular({ size, style }) {
  return (
    <LinearGradient
      colors={llSheen.specular}
      start={{ x: 0.15, y: 0.1 }}
      end={{ x: 0.85, y: 0.9 }}
      style={[
        {
          position: 'absolute',
          left: size * 0.16,
          top: size * 0.12,
          width: size * 0.52,
          height: size * 0.42,
          borderRadius: size,
          opacity: 0.9,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

// A recessed track — the inside of a conveyor belt, a progress groove, a
// necklace channel. Dark at the top edge so content reads as sunk into it.
export function Trough({ height = 54, radius = 15, children, style }) {
  return (
    <View style={[{ height, borderRadius: radius, overflow: 'hidden' }, styles.troughEdge, style]}>
      {children}
      <Sheen variant="trough" />
    </View>
  );
}

// The conveyor tread itself. CSS used repeating-linear-gradient(115deg, …);
// RN has no repeating gradients, so the stripes are real skewed Views. Count
// is derived from width so the pitch stays constant on any screen size.
//
// `running` translates the stripe bank by exactly one pitch and loops, which
// reads as continuous motion because stripe n+1 lands where stripe n was.
// Native-driven, so it costs nothing on the JS thread while a child plays.
export function BeltTread({ width, height = 54, radius = 15, pitch = 30, running = false, speed = 1600, style }) {
  const stripes = Math.ceil(width / pitch) + 4;
  const march = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!running) return undefined;
    march.setValue(0);
    const loop = Animated.loop(
      Animated.timing(march, { toValue: 1, duration: speed, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [running, speed]);

  const translateX = march.interpolate({ inputRange: [0, 1], outputRange: [0, pitch] });

  return (
    <View style={[{ height, borderRadius: radius, overflow: 'hidden', backgroundColor: '#D8D2F0' }, styles.troughEdge, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, running ? { transform: [{ translateX }] } : null]}>
        {Array.from({ length: stripes }, (_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: -height,
              left: i * pitch - height - pitch,
              width: pitch * 0.46,
              height: height * 3,
              backgroundColor: '#BEB6E0',
              transform: [{ rotate: '25deg' }],
            }}
          />
        ))}
      </Animated.View>
      <Sheen variant="trough" />
    </View>
  );
}

const styles = StyleSheet.create({
  // `inset 0 1px 0 #fff` — a one-pixel white line along the top edge only.
  topHighlight: {
    position: 'absolute', left: 0, right: 0, top: 0, height: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  // Recessed surfaces get a dark hairline at the top and a light one below,
  // the reverse of a raised card.
  troughEdge: {
    borderTopWidth: 1, borderTopColor: 'rgba(48,30,104,0.18)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.5)',
  },
});
