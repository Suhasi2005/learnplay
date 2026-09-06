import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { sceneFor } from '../sceneAssets';

// A world built from stacked bands rather than one flat picture.
//
// Every band and prop declares a `depth`, and drift is multiplied by it, so
// the ground slides further than the hills and the clouds barely move. That
// difference is the entire illusion of depth — it's why this reads as a place
// the child is standing in rather than wallpaper behind some buttons.
//
// The motion is deliberately slow. On a screen a child is trying to think on,
// anything faster competes with the actual task.

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SWAY = 16; // px of travel at depth 1

// A creature living in the scene.
//
// Each one owns its animation with its own period, so they never bob in
// unison — synchronised movement reads as a screensaver, staggered movement
// reads as a place with things living in it. They're decoration and are not
// tappable: a child who taps a rabbit and gets nothing learns the screen
// lies, so ambient life stays visibly separate from the interactive layer.
function AmbientCreature({ item }) {
  const hop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hop, {
          toValue: 1, duration: item.period, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(hop, {
          toValue: 0, duration: item.period, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = hop.interpolate({ inputRange: [0, 1], outputRange: [0, -item.hop] });
  const size = item.size * SCREEN_W;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: item.x * SCREEN_W,
        bottom: item.bottom * SCREEN_H,
        width: size,
        height: size,
        transform: [{ translateY }],
      }}
    >
      <Image source={item.image} style={styles.propImage} resizeMode="contain" />
    </Animated.View>
  );
}

export default function ParallaxWorld({
  scene = 'meadow',
  children,
  style,
  animate = true,
  scrimBoost = 0,
  edgeFade = true,
}) {
  const s = sceneFor(scene);
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, scene]);

  function shift(depth) {
    return drift.interpolate({
      inputRange: [0, 1],
      outputRange: [-SWAY * depth, SWAY * depth],
    });
  }

  const scrim = Math.min(0.7, (s.scrim ?? 0.16) + scrimBoost);

  return (
    <View style={[styles.root, style]}>
      {/* Sky plate, stretched to cover. */}
      <Image source={s.sky} style={styles.sky} resizeMode="cover" />

      {/* Landform bands, back to front. Each is wider than the screen so the
          drift never pulls an edge into view. */}
      {s.bands.map((b) => (
        <Animated.View
          key={b.key}
          pointerEvents="none"
          style={[
            styles.band,
            {
              bottom: b.bottom * SCREEN_H,
              height: b.height * SCREEN_H,
              transform: [{ translateX: shift(b.depth) }],
            },
          ]}
        >
          <Image source={b.image} style={styles.bandImage} resizeMode="stretch" />
        </Animated.View>
      ))}

      {/* Scattered props — fixed positions so a world is recognisably the
          same place every time it's opened. */}
      {s.props?.map((p) => (
        <Animated.View
          key={p.key}
          pointerEvents="none"
          style={[
            styles.prop,
            {
              left: p.x * SCREEN_W,
              bottom: p.bottom * SCREEN_H,
              width: p.size * SCREEN_W,
              height: p.size * SCREEN_W * 1.2,
              transform: [{ translateX: shift(p.depth) }],
            },
          ]}
        >
          <Image source={p.image} style={styles.propImage} resizeMode="contain" />
        </Animated.View>
      ))}

      {/* Ambient life, in front of the scenery but behind the scrim, so the
          creatures sit in the world rather than on top of the interface. */}
      {animate && s.ambient?.map((a) => <AmbientCreature key={a.key} item={a} />)}

      {/* Contrast guarantee. The art is fixed but the UI on top varies, so a
          screen can ask for extra protection without editing the scene. */}
      {scrim > 0 && (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(14,12,30,${scrim})` }]}
          pointerEvents="none"
        />
      )}

      {edgeFade && (
        <>
          <LinearGradient
            colors={['rgba(14,12,30,0.5)', 'rgba(14,12,30,0)']}
            style={[styles.edge, { top: 0, height: 180 }]}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['rgba(14,12,30,0)', 'rgba(14,12,30,0.55)']}
            style={[styles.edge, { bottom: 0, height: 210 }]}
            pointerEvents="none"
          />
        </>
      )}

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: '#BFE9F5' },
  sky: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  band: { position: 'absolute', left: -SWAY * 2, right: -SWAY * 2 },
  bandImage: { width: '100%', height: '100%' },
  prop: { position: 'absolute' },
  propImage: { width: '100%', height: '100%' },
  edge: { position: 'absolute', left: 0, right: 0 },
  content: { flex: 1 },
});
