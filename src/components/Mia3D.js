import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Canvas } from './mia/bindings';
import MiaScene from './mia/MiaScene';
import { shell } from '../theme';

// One component for every platform.
//
// The native/web difference is confined to ./mia/bindings, which swaps the
// fiber and drei entrypoints and the form the model is loaded in. Everything
// visual — lighting, framing, the animation state machine — is shared, so the
// browser and the phone cannot drift apart.

export default function Mia3D({ mood = 'idle', onSettled, height = 300, style }) {
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  return (
    <View style={[{ height }, style]}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 42 }}
        gl={{ antialias: true }}
        style={styles.canvas}
      >
        <MiaScene mood={mood} onSettled={onSettled} onReady={markReady} />
      </Canvas>

      {/* The model is several megabytes. Until it arrives the canvas is empty,
          which is indistinguishable from a broken screen — so say what's
          happening instead of showing nothing. */}
      {!ready && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color={shell.primary} />
          <Text style={styles.loadingText}>Waking Mia up…</Text>
        </View>
      )}
    </View>
  );
}

export function LoadingBlock({ height = 300 }) {
  return (
    <View style={[styles.loading, { height }]}>
      <ActivityIndicator color={shell.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: 'transparent' },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: shell.inkMuted },
});
