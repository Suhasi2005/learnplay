import { Asset } from 'expo-asset';

// Web bindings for the 3D scene.
//
// The browser build uses the standard three/fiber/drei entrypoints — the
// `/native` ones exist to route through expo-gl, which has no meaning here.
//
// The model also has to be resolved differently: drei's web `useGLTF` fetches
// a URL, so the Metro module is converted into the hashed, base-path-aware
// URL that Metro emitted for it. Hard-coding a path would break under the
// `/learnplay` base URL that GitHub Pages serves from.
export { Canvas } from '@react-three/fiber';
export { useAnimations, useGLTF } from '@react-three/drei';

export const modelSource = Asset.fromModule(
  require('../../../assets/models/mia.glb'),
).uri;
