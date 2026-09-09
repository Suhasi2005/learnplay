import { useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
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

function MiaMesh({ mood, onSettled, onReady }) {
  const group = useRef();
  const fit = useRef();
  const { camera, size } = useThree();
  const { scene, animations } = useGLTF(modelSource);

  // SkeletonUtils.clone, NOT scene.clone(). Object3D.clone() copies the mesh
  // but leaves it bound to the ORIGINAL skeleton's bones, so a cloned skinned
  // mesh either refuses to deform or fights the source instance for the same
  // bones. Invisible with a static model; breaks everything once it's rigged.
  const model = useMemo(() => cloneSkinned(scene), [scene]);

  const { actions, names } = useAnimations(animations, group);
  const hasClips = names.length > 0;

  // useGLTF suspends until the model is parsed, so reaching this point means
  // it's ready. The wrapper uses this to drop its loading overlay — without
  // it, a slow download looks identical to a broken screen.
  useEffect(() => { onReady?.(); }, [onReady]);

  useEffect(() => {
    if (!LOG_CLIPS) return;
    // eslint-disable-next-line no-console
    console.log('[Mia3D] clips found:', JSON.stringify(Object.keys(actions)));
    // eslint-disable-next-line no-console
    console.log('[Mia3D] animation count from GLB:', animations.length);
    const b = new THREE.Box3().setFromObject(model);
    // eslint-disable-next-line no-console
    console.log('[Mia3D] bounds', JSON.stringify({
      min: b.min.toArray().map((n) => +n.toFixed(2)),
      max: b.max.toArray().map((n) => +n.toFixed(2)),
    }));
  }, [actions, animations, model]);

  // Frame the model from its own measurements, every time the canvas resizes.
  //
  // The previous version hardcoded a camera distance and a scale tuned to the
  // placeholder, which stood 1.99 units tall and centred on the origin. The
  // rigged export is 1.15 tall with its feet at y=0 — so those constants put
  // Mia outside the frustum and the canvas rendered empty. Nothing here is a
  // constant now: the scale comes from the measured height, and the camera is
  // pushed back far enough to satisfy BOTH the model's height and its width
  // at the canvas's actual aspect ratio.
  //
  // The transform also lives on an inner group rather than on the loaded scene
  // itself, so an animation track that touches the root node can't fight it.
  useLayoutEffect(() => {
    if (!fit.current) return;

    const box = new THREE.Box3().setFromObject(model);
    const dims = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    if (!Number.isFinite(dims.y) || dims.y <= 0) return;

    const TARGET_H = 2;
    const scale = TARGET_H / dims.y;

    fit.current.scale.setScalar(scale);
    fit.current.position.set(-centre.x * scale, -centre.y * scale, -centre.z * scale);

    const fov = (camera.fov * Math.PI) / 180;
    const aspect = size.height > 0 ? size.width / size.height : 1;
    const halfH = TARGET_H / 2;
    const halfW = (dims.x * scale) / 2;
    // Distance needed so the height fits, and so the width fits once the
    // frustum is narrowed by a portrait aspect ratio.
    const forHeight = halfH / Math.tan(fov / 2);
    const forWidth = halfW / (Math.tan(fov / 2) * Math.max(aspect, 0.0001));
    const distance = Math.max(forHeight, forWidth) * 1.25; // breathing room

    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [model, camera, size.width, size.height]);

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
    // Outer group is the mixer root — left untransformed so clip tracks and
    // our framing can't overwrite each other. Inner group carries the fit.
    <group ref={group} dispose={null}>
      <group ref={fit}>
        <primitive object={model} />
      </group>
    </group>
  );
}

export default function MiaScene({ mood, onSettled, onReady }) {
  return (
    <>
      {/* Ambient-heavy on purpose: the textures are baked, and a strong key
          light washes the painted detail out. */}
      <ambientLight intensity={1.6} />
      <directionalLight position={[3, 6, 4]} intensity={1.1} />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} />
      <Suspense fallback={null}>
        <MiaMesh mood={mood} onSettled={onSettled} onReady={onReady} />
      </Suspense>
    </>
  );
}
