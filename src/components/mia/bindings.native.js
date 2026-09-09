// Native bindings for the 3D scene.
//
// React Three Fiber and drei ship separate entrypoints for React Native, and
// they take the model in a different form: drei/native accepts the Metro
// module that `require` returns, while the web build wants a URL string.
// Isolating both differences here means MiaScene.js is identical on every
// platform.
export { Canvas } from '@react-three/fiber/native';
export { useAnimations, useGLTF } from '@react-three/drei/native';

export const modelSource = require('../../../assets/models/mia.glb');
