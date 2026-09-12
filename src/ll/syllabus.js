import { CURRICULUM } from '../curriculum';
import { FACE, HERO, POSE, SCENE, WORLD_ART } from './art';
import { ll } from './tokens';

// The syllabus, dressed for Little Learners.
//
// CURRICULUM stays the single source of truth for what a child learns — this
// file only says how each part of it looks and which companion hosts it.
// Keeping presentation separate means adding a topic never means touching a
// screen, and re-theming a grade never risks changing its content.

// A standard is a place with a host, not a dropdown row.
export const STANDARDS = [
  {
    id: 'Junior KG',
    name: 'Junior KG',
    tag: 'Ages 3–4',
    blurb: 'First letters, first numbers, first big questions.',
    host: 'birdie',
    face: FACE.birdieHappy,
    pose: POSE.birdieCheer,
    world: WORLD_ART.garden,
    scene: SCENE.buddyOnboard,
    tint: ll.green,
    soft: '#E4F6EC',
    deep: ll.greenDeep,
    button: 'green',
  },
  {
    id: 'Senior KG',
    name: 'Senior KG',
    tag: 'Ages 4–5',
    blurb: 'Reading words, counting higher, telling the time.',
    host: 'mia',
    face: FACE.miaHappy,
    pose: POSE.miaBooks,
    world: WORLD_ART.numbers,
    scene: SCENE.miaLesson,
    tint: ll.pink,
    soft: ll.pinkSoft,
    deep: ll.pinkDeep,
    button: 'pink',
  },
  {
    id: 'Grade 1',
    name: 'Grade 1',
    tag: 'Ages 5–7',
    blurb: 'Adding up, spotting patterns, reading charts.',
    host: 'leo',
    face: FACE.leoHappy,
    pose: POSE.leoBook,
    world: WORLD_ART.library,
    scene: SCENE.leoLesson,
    tint: ll.blue,
    soft: ll.blueSoft,
    deep: ll.blueDeep,
    button: 'blue',
  },
];

// Subjects keep their colour and their host wherever they appear, so a child
// learns "green with Birdie means World Around Us" without being told.
export const SUBJECTS = [
  {
    id: 'English',
    name: 'English',
    blurb: 'Letters, sounds and words',
    host: 'mia',
    face: FACE.miaExcited,
    pose: POSE.miaRead,
    world: WORLD_ART.library,
    tint: ll.pink,
    soft: ll.pinkSoft,
    deep: ll.pinkDeep,
    button: 'pink',
  },
  {
    id: 'Math',
    name: 'Math',
    blurb: 'Numbers, shapes and counting',
    host: 'buddy',
    face: FACE.buddyHappy,
    pose: POSE.buddyLaptop,
    world: WORLD_ART.numbers,
    tint: ll.blue,
    soft: ll.blueSoft,
    deep: ll.blueDeep,
    button: 'blue',
  },
  {
    id: 'EVS',
    name: 'World Around Us',
    blurb: 'Animals, nature and being safe',
    host: 'birdie',
    face: FACE.birdieHappy,
    pose: POSE.birdieStar,
    world: WORLD_ART.garden,
    tint: ll.green,
    soft: '#E4F6EC',
    deep: ll.greenDeep,
    button: 'green',
  },
];

export const HOST_ART = {
  mia: { face: FACE.miaHappy, hero: HERO.mia, scene: SCENE.miaIdle },
  leo: { face: FACE.leoHappy, hero: HERO.leo, scene: SCENE.leoIdle },
  buddy: { face: FACE.buddyHappy, hero: HERO.buddy, scene: SCENE.buddyHome },
  birdie: { face: FACE.birdieHappy, hero: null, scene: SCENE.buddyHint },
};

export function standard(id) {
  return STANDARDS.find((s) => s.id === id) ?? STANDARDS[0];
}

export function subject(id) {
  return SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0];
}

export function topicsFor(standardId, subjectId) {
  return CURRICULUM[standardId]?.[subjectId] ?? [];
}

// Counts used all over the syllabus screens. `playable` is what a child can
// actually open today; `total` is the researched curriculum, which is larger
// on purpose — the app shows the whole scope and is honest about the gap.
export function countsFor(standardId, subjectId = null) {
  const subjects = subjectId ? [subjectId] : SUBJECTS.map((s) => s.id);
  let total = 0;
  let playable = 0;
  for (const s of subjects) {
    const list = topicsFor(standardId, s);
    total += list.length;
    playable += list.filter((t) => t.playable).length;
  }
  return { total, playable };
}

// Folds saved progress into a topic list so a screen can render state without
// knowing how progress is stored.
export function decorate(topics, progressById) {
  return topics.map((t) => {
    const p = t.playable ? progressById[t.id] : null;
    const done = !!p && p.index >= t.total;
    const started = !!p && p.index > 0 && !done;
    return {
      ...t,
      progress: p ?? null,
      stars: p?.stars ?? 0,
      done,
      started,
      ratio: p && t.total ? Math.min(1, p.index / t.total) : 0,
      state: !t.playable ? 'soon' : done ? 'done' : started ? 'started' : 'new',
    };
  });
}
