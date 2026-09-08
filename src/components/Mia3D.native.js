import { Canvas } from '@react-three/fiber/native';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei/native';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { shell } from '../theme';

// Mia, the 3D character.
//
// assets/models/mia.glb is a rigged export: one skin ("rig", 160 joints) with
// three baked clips — Mia_Idle, Mia_Wave, Mia_Point. Skeletal animation is the
// live path; the whole-body tween below survives only as a visible failure
// mode if a future model arrives with no clips.

export const MIA_MODEL = require('../../assets/models/mia.glb');

const CLIPS = { idle: 'Mia_Idle', wave: 'Mia_Wave', point: 'Mia_Point' };

const FADE = 0.25;              // crossfade seconds between clips
const PROCEDURAL_HOLD_MS = 1800; // only used by the no-clip failure path

// Temporary — remove once the device log confirms the clips load.
const LOG_CLIPS = true;

function MiaMesh({ mood, onSettled }) {
  const group = useRef();
  const { scene, animations } = useGLTF(MIA_MODEL);

  // SkeletonUtils.clone, NOT scene.clone(). Object3D.clone() copies the mesh
  // but leaves it pointing at the ORIGINAL skeleton's bones, so a cloned
  // skinned mesh either refuses to deform or fights the source instance for
  // control of the same bones. This is invisible with a static model and
  // breaks everything the moment the file is rigged.
  const model = useMemo(() => cloneSkinned(scene), [scene]);

  const { actions, names } = useAnimations(animations, group);
  const hasClips = names.length > 0;

  useEffect(() => {
    if (!LOG_CLIPS) return;
    // eslint-disable-next-line no-console
    console.log('[Mia3D] clips found:', JSON.stringify(Object.keys(actions)));
    // eslint-disable-next-line no-console
    console.log('[Mia3D] animation count from GLB:', animations.length);
  }, [actions, animations]);

  // Centre on the origin and scale to a known height, so a re-export at a
  // different scale doesn't send the camera hunting for her.
  const fitted = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const scale = 2 / (size.y || 1);
    model.position.set(-centre.x * scale, -box.min.y * scale - 1, -centre.z * scale);
    model.scale.setScalar(scale);
    return model;
  }, [model]);

  // --- Skeletal animation: the live path ----------------------------------
  useEffect(() => {
    if (!hasClips) return undefined;

    const wanted = CLIPS[mood] ?? CLIPS.idle;
    const action = actions[wanted] ?? actions[names[0]];
    if (!action) return undefined;

    const oneShot = mood !== 'idle';

    // Loop mode before play(). Setting it afterwards can let a frame render
    // under the previous mode.
    action.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat, oneShot ? 1 : Infinity);
    action.clampWhenFinished = oneShot;

    // reset() zeroes the time and forces weight to 1; fadeIn immediately
    // overrides that to ramp 0 → 1. The outgoing clip is faded out by the
    // previous effect's cleanup, which React runs first — so the two overlap
    // and it reads as a crossfade rather than a cut.
    action.reset().fadeIn(FADE).play();

    if (!oneShot) {
      return () => { action.fadeOut(FADE); };
    }

    // The mixer fires `finished` for every action it owns, so filter to this
    // one — otherwise any other clip ending would bounce us back to idle.
    const mixer = action.getMixer();
    const onFinished = (event) => {
      if (event.action === action) onSettled?.();
    };
    mixer.addEventListener('finished', onFinished);

    return () => {
      mixer.removeEventListener('finished', onFinished);
      action.fadeOut(FADE);
    };
  }, [mood, hasClips, actions, names, onSettled]);

  // --- Failure path: no clips in the file ---------------------------------
  //
  // Not the normal route. If a model ever loads without animations this keeps
  // her visibly alive rather than frozen, but it moves the whole mesh as one
  // rigid object — she cannot lift an arm. Every line below is dead while the
  // rigged file is in place.
  const t = useRef(0);
  useFrame((_, delta) => {
    if (hasClips || !group.current) return;
    t.current += delta;
    const g = group.current;
    const breathe = Math.sin(t.current * 1.6);
    g.position.y = breathe * 0.035;
    g.scale.setScalar(1 + breathe * 0.006);
    g.rotation.z = Math.sin(t.current * 0.9) * 0.015;
    if (mood === 'wave') {
      g.position.y += Math.abs(Math.sin(t.current * 7)) * 0.12;
      g.rotation.z += Math.sin(t.current * 7) * 0.07;
    } else if (mood === 'point') {
      g.rotation.y = 0.35;
      g.rotation.x = 0.08;
    } else {
      g.rotation.y += (0 - g.rotation.y) * Math.min(1, delta * 6);
      g.rotation.x += (0 - g.rotation.x) * Math.min(1, delta * 6);
    }
  });

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
      {/* Ambient-heavy on purpose: the textures are baked, and a strong key
          light washes the painted detail out. */}
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
