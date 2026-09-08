import { StyleSheet, View } from 'react-native';
import { GroundedCharacter } from './Character';

// Web build: no 3D.
//
// This is a separate file rather than a Platform.OS branch on purpose. A
// runtime check still leaves `import ... from 'three'` at the top of the
// module, so Metro bundles three.js, drei and expo-gl into the web build even
// though none of it can ever run there — roughly 700 KB of dead weight on a
// demo that loads over a phone connection. Metro resolves `.web.js` ahead of
// the bare name, so this version means the 3D stack is never reached at all.
//
// Same props as the native component, so callers need no branching.

export const MIA_MODEL = null;

export default function Mia3D({ mood = 'idle', height = 300, style, fallbackSize = 190 }) {
  return (
    <View style={[styles.wrap, { height }, style]}>
      <GroundedCharacter mood={mood === 'wave' ? 'cheer' : mood} size={fallbackSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'flex-end' },
});
