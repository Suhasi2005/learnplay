import { Canvas } from '@react-three/fiber/native';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei/native';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { shell } from '../theme';

// Mia, the 3D character.
//
// The model currently in assets/models/mia.glb is STATIC — it has geometry and
// textures but no armature and no baked clips (verified by reading the glTF
// JSON: 0 skins, 0 animations). So this component does two things:
//
//   1. If the file has clips, it drives them with useAnimations and
//      crossfades between them — the intended behaviour, ready to go.
//   2. If it doesn't, it animates the whole object instead: a breathing
//      idle, a hop for "wave", a lean for "point".
//
// The distinction matters and isn't cosmetic. Procedural motion moves the
// entire mesh as one rigid object, so Mia cannot raise an arm — her whole
// body tips instead. It reads as alive, not as a character waving. Dropping
// in a rigged export with Mia_Idle / Mia_Wave / Mia_Point switches this to
// real skeletal animation with no code change.

export const MIA_MODEL = require('../../assets/models/mia.glb');

const CLIPS = { idle: 'Mia_Idle', wave: 'Mia_Wave', point: 'Mia_Point' };

// How long a triggered pose holds before returning to idle, when we're
// faking it. Real clips use their own duration instead.
const PROCEDURAL_HOLD_MS = 1800;

function MiaMesh({ mood, onSettled }) {
  const group = useRef();
  const { scene, animations } = useGLTF(MIA_MODEL);
  const { actions, names } = useAnimations(animations, group);
  const hasClips = names.length > 0;

  // Clone so the same model can appear twice on screen without the two
  // instances fighting over one scene graph.
  const model = useMemo(() => scene.clone(true), [scene]);

  // Normalise whatever arrives: centre it on the origin and scale it to a
  // known height, so swapping in a different export doesn't send the camera
  // hunting for a model that's suddenly 40 units tall or off to one side.
  const fitted = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const height = size.y || 1;
    const scale = 2 / height;
    model.position.set(-centre.x * scale, -box.min.y * scale - 1, -centre.z * scale);
    model.scale.setScalar(scale);
    return model;
  }, [model]);

  // --- Real skeletal animation, when the file provides it -----------------
  useEffect(() => {
    if (!hasClips) return undefined;
    const wanted = CLIPS[mood] ?? CLIPS.idle;
    const next = actions[wanted] ?? actions[names[0]];
    if (!next) return undefined;

    next.reset().fadeIn(0.25).play();

    // A one-shot pose should hand control back to idle when it ends.
    if (mood !== 'idle') {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
      const mixer = next.getMixer();
      const onFinished = () => onSettled?.();
      mixer.addEventListener('finished', onFinished);
      return () => {
        mixer.removeEventListener('finished', onFinished);
        next.fadeOut(0.25);
      };
    }

    next.setLoop(THREE.LoopRepeat, Infinity);
    return () => { next.fadeOut(0.25); };
  }, [mood, hasClips, actions, names, onSettled]);

  // --- Procedural motion, when it doesn't ---------------------------------
  const t = useRef(0);
  useFrame((_, delta) => {
    if (hasClips || !group.current) return;
    t.current += delta;
    const g = group.current;

    // Idle is always running underneath: a slow rise and fall plus a barely
    // perceptible swell. Perfect stillness is what makes a model look dead.
    const breathe = Math.sin(t.current * 1.6);
    g.position.y = breathe * 0.035;
    g.scale.setScalar(1 + breathe * 0.006);
    g.rotation.z = Math.sin(t.current * 0.9) * 0.015;

    if (mood === 'wave') {
      // A quick double bounce with a tilt — the closest a rigid mesh gets
      // to "excited".
      g.position.y += Math.abs(Math.sin(t.current * 7)) * 0.12;
      g.rotation.z += Math.sin(t.current * 7) * 0.07;
    } else if (mood === 'point') {
      // Lean in and turn slightly, as though indicating something ahead.
      g.rotation.y = 0.35;
      g.rotation.x = 0.08;
    } else {
      g.rotation.y += (0 - g.rotation.y) * Math.min(1, delta * 6);
      g.rotation.x += (0 - g.rotation.x) * Math.min(1, delta * 6);
    }
  });

  // Without clips nothing can tell us a pose "ended", so time it out.
  useEffect(() => {
    if (hasClips || mood === 'idle') return undefined;
    const id = setTimeout(() => onSettled?.(), PROCEDURAL_HOLD_MS);
    return () => clearTimeout(id);
  }, [mood, hasClips, onSettled]);

  return (
    <group ref={group} dispose={null}>
      <primitive object={fitted} />
    </group>
  );
}

function Scene({ mood, onSettled }) {
  return (
    <>
      {/* Baked-texture models carry their own shading, so this is deliberately
          ambient-heavy — a strong key light blows the painted detail out. */}
      <ambientLight intensity={1.6} />
      <directionalLight position={[3, 6, 4]} intensity={1.1} />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} />
      <Suspense fallback={null}>
        <MiaMesh mood={mood} onSettled={onSettled} />
      </Suspense>
    </>
  );
}

// Native only. The web build resolves Mia3D.web.js instead, which keeps
// three.js, drei and expo-gl out of that bundle entirely.
export default function Mia3D({ mood = 'idle', onSettled, height = 300, style }) {
  return (
    <View style={[{ height }, style]}>
      <Canvas
        camera={{ position: [0, 0.35, 4.2], fov: 42 }}
        gl={{ antialias: true }}
        style={styles.canvas}
      >
        <Scene mood={mood} onSettled={onSettled} />
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
