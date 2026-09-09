import { ActivityIndicator, StyleSheet, View } from 'react-native';
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
  return (
    <View style={[{ height }, style]}>
      <Canvas
        camera={{ position: [0, 0.35, 4.2], fov: 42 }}
        gl={{ antialias: true }}
        style={styles.canvas}
      >
        <MiaScene mood={mood} onSettled={onSettled} />
      </Canvas>
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
  loading: { alignItems: 'center', justifyContent: 'center' },
});
