import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { modelSource, useAnimations, useGLTF } from './bindings';

// Mia's scene — shared by native and web.
//
// assets/models/mia.glb is a rigged export: one skin ("rig", 160 joints) and
// three baked clips. Skeletal animation is the live path; the whole-body tween
// at the bottom survives only as a visible failure mode if a model ever loads
// without clips.

const CLIPS = { idle: 'Mia_Idle', wave: 'Mia_Wave', point: 'Mia_Point' };

const FADE = 0.25;               // crossfade seconds between clips
const PROCEDURAL_HOLD_MS = 1800; // only used by the no-clip failure path

// Temporary — remove once the device log confirms the clips load.
const LOG_CLIPS = true;

function MiaMesh({ mood, onSettled }) {
  const group = useRef();
  const { scene, animations } = useGLTF(modelSource);

  // SkeletonUtils.clone, NOT scene.clone(). Object3D.clone() copies the mesh
  // but leaves it bound to the ORIGINAL skeleton's bones, so a cloned skinned
  // mesh either refuses to deform or fights the source instance for the same
  // bones. Invisible with a static model; breaks everything once it's rigged.
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

    // Loop mode before play(): setting it afterwards can let a frame render
    // under the previous mode.
    action.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat, oneShot ? 1 : Infinity);
    action.clampWhenFinished = oneShot;

    // reset() zeroes the time and forces weight to 1; fadeIn overrides that to
    // ramp 0 → 1. React runs the previous effect's cleanup first, which fades
    // the outgoing clip out — so the two overlap and read as a crossfade.
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
  // Dead code while the rigged file is in place. It moves the whole mesh as
  // one rigid object — she cannot lift an arm — so if you ever see the body
  // tipping instead of the arm moving, the clips did not load.
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

export default function MiaScene({ mood, onSettled }) {
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
