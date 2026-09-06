// Scenery registry — Kenney CC0 art, see ASSET_LICENSES.md.
//
// Worlds are composed from layers rather than shipped as single flat images,
// which is what produces real depth: each band drifts at its own speed, so
// near things move more than far things exactly as they do in life. A single
// background image can't do that no matter how good the image is.

export const SKY = {
  grass: require('../assets/game/environments/backgrounds/backgroundColorGrass.png'),
  forest: require('../assets/game/environments/backgrounds/backgroundColorForest.png'),
  fall: require('../assets/game/environments/backgrounds/backgroundColorFall.png'),
  desert: require('../assets/game/environments/backgrounds/backgroundColorDesert.png'),
};

export const TERRAIN = {
  mountains: require('../assets/game/environments/terrain/mountains.png'),
  mountainA: require('../assets/game/environments/terrain/mountainA.png'),
  mountainB: require('../assets/game/environments/terrain/mountainB.png'),
  hills: require('../assets/game/environments/terrain/hills.png'),
  hillsLarge: require('../assets/game/environments/terrain/hillsLarge.png'),
  ground1: require('../assets/game/environments/terrain/groundLayer1.png'),
  ground2: require('../assets/game/environments/terrain/groundLayer2.png'),
};

export const SKY_ELEMENTS = {
  cloudLayer1: require('../assets/game/environments/sky/cloudLayer1.png'),
  cloudLayer2: require('../assets/game/environments/sky/cloudLayer2.png'),
  cloud1: require('../assets/game/environments/sky/cloud1.png'),
  cloud2: require('../assets/game/environments/sky/cloud2.png'),
  cloud3: require('../assets/game/environments/sky/cloud3.png'),
  sun: require('../assets/game/environments/sky/sun.png'),
  moon: require('../assets/game/environments/sky/moonFull.png'),
};

export const FOLIAGE = {
  tree: require('../assets/game/environments/foliage/tree.png'),
  treePine: require('../assets/game/environments/foliage/treePine.png'),
  treePalm: require('../assets/game/environments/foliage/treePalm.png'),
  treeSmall1: require('../assets/game/environments/foliage/treeSmall_green1.png'),
  treeSmall2: require('../assets/game/environments/foliage/treeSmall_green2.png'),
  treeSmall3: require('../assets/game/environments/foliage/treeSmall_green3.png'),
  bush1: require('../assets/game/environments/foliage/bush1.png'),
  bush2: require('../assets/game/environments/foliage/bush2.png'),
  bush3: require('../assets/game/environments/foliage/bush3.png'),
};

export const PROPS = {
  house: require('../assets/game/environments/props/house1.png'),
  houseSmall: require('../assets/game/environments/props/houseSmall1.png'),
  fence: require('../assets/game/environments/props/fence.png'),
  castle: require('../assets/game/environments/props/castleSmall.png'),
  tower: require('../assets/game/environments/props/tower.png'),
};

export const ANIMALS = {
  bear: require('../assets/game/animals/bear.png'),
  chick: require('../assets/game/animals/chick.png'),
  chicken: require('../assets/game/animals/chicken.png'),
  cow: require('../assets/game/animals/cow.png'),
  dog: require('../assets/game/animals/dog.png'),
  duck: require('../assets/game/animals/duck.png'),
  elephant: require('../assets/game/animals/elephant.png'),
  frog: require('../assets/game/animals/frog.png'),
  giraffe: require('../assets/game/animals/giraffe.png'),
  goat: require('../assets/game/animals/goat.png'),
  horse: require('../assets/game/animals/horse.png'),
  monkey: require('../assets/game/animals/monkey.png'),
  owl: require('../assets/game/animals/owl.png'),
  panda: require('../assets/game/animals/panda.png'),
  penguin: require('../assets/game/animals/penguin.png'),
  pig: require('../assets/game/animals/pig.png'),
  rabbit: require('../assets/game/animals/rabbit.png'),
  parrot: require('../assets/game/animals/parrot.png'),
  zebra: require('../assets/game/animals/zebra.png'),
  snake: require('../assets/game/animals/snake.png'),
};

// A scene is a stack of bands, back to front. `depth` is how strongly a band
// reacts to the drift: 0 is painted-on-the-sky-far-away, 1 is right in front
// of the player. `bottom` positions the band as a fraction of screen height.
//
// Props are scattered at fixed positions rather than randomly, so a world
// looks the same every visit — a child builds a memory of a place, and a
// scene that reshuffles itself never becomes one.
export const SCENES = {
  meadow: {
    sky: SKY.grass,
    scrim: 0.14,
    bands: [
      { key: 'clouds', image: SKY_ELEMENTS.cloudLayer1, depth: 0.15, bottom: 0.62, height: 0.26 },
      { key: 'mountains', image: TERRAIN.mountains, depth: 0.3, bottom: 0.42, height: 0.22 },
      { key: 'hills', image: TERRAIN.hillsLarge, depth: 0.55, bottom: 0.26, height: 0.24 },
      { key: 'ground', image: TERRAIN.ground1, depth: 1, bottom: -0.02, height: 0.32 },
    ],
    props: [
      { key: 'tree-l', image: FOLIAGE.tree, x: 0.06, bottom: 0.2, size: 0.3, depth: 0.85 },
      { key: 'tree-r', image: FOLIAGE.treeSmall1, x: 0.82, bottom: 0.21, size: 0.2, depth: 0.8 },
      { key: 'bush', image: FOLIAGE.bush1, x: 0.36, bottom: 0.18, size: 0.13, depth: 0.9 },
      { key: 'sun', image: SKY_ELEMENTS.sun, x: 0.78, bottom: 0.84, size: 0.16, depth: 0.05 },
    ],
  },

  forest: {
    sky: SKY.forest,
    scrim: 0.2,
    bands: [
      { key: 'clouds', image: SKY_ELEMENTS.cloudLayer2, depth: 0.15, bottom: 0.66, height: 0.22 },
      { key: 'mountains', image: TERRAIN.mountainA, depth: 0.32, bottom: 0.44, height: 0.2 },
      { key: 'hills', image: TERRAIN.hills, depth: 0.58, bottom: 0.26, height: 0.24 },
      { key: 'ground', image: TERRAIN.ground2, depth: 1, bottom: -0.02, height: 0.32 },
    ],
    props: [
      { key: 'pine-l', image: FOLIAGE.treePine, x: 0.02, bottom: 0.2, size: 0.32, depth: 0.88 },
      { key: 'pine-r', image: FOLIAGE.treePine, x: 0.78, bottom: 0.21, size: 0.28, depth: 0.82 },
      { key: 'tree-m', image: FOLIAGE.tree, x: 0.55, bottom: 0.24, size: 0.2, depth: 0.7 },
      { key: 'bush', image: FOLIAGE.bush2, x: 0.3, bottom: 0.18, size: 0.12, depth: 0.92 },
    ],
  },

  autumn: {
    sky: SKY.fall,
    scrim: 0.18,
    bands: [
      { key: 'clouds', image: SKY_ELEMENTS.cloudLayer1, depth: 0.15, bottom: 0.64, height: 0.24 },
      { key: 'hills', image: TERRAIN.hillsLarge, depth: 0.5, bottom: 0.28, height: 0.24 },
      { key: 'ground', image: TERRAIN.ground1, depth: 1, bottom: -0.02, height: 0.32 },
    ],
    props: [
      { key: 'house', image: PROPS.houseSmall, x: 0.66, bottom: 0.22, size: 0.24, depth: 0.75 },
      { key: 'tree', image: FOLIAGE.treeSmall2, x: 0.12, bottom: 0.21, size: 0.22, depth: 0.85 },
      { key: 'fence', image: PROPS.fence, x: 0.38, bottom: 0.18, size: 0.18, depth: 0.95 },
    ],
  },

  desert: {
    sky: SKY.desert,
    scrim: 0.16,
    bands: [
      { key: 'clouds', image: SKY_ELEMENTS.cloudLayer2, depth: 0.12, bottom: 0.68, height: 0.2 },
      { key: 'mountains', image: TERRAIN.mountainB, depth: 0.34, bottom: 0.42, height: 0.22 },
      { key: 'ground', image: TERRAIN.ground2, depth: 1, bottom: -0.02, height: 0.3 },
    ],
    props: [
      { key: 'palm', image: FOLIAGE.treePalm, x: 0.08, bottom: 0.2, size: 0.28, depth: 0.86 },
      { key: 'tower', image: PROPS.tower, x: 0.74, bottom: 0.22, size: 0.22, depth: 0.7 },
      { key: 'sun', image: SKY_ELEMENTS.sun, x: 0.2, bottom: 0.84, size: 0.14, depth: 0.05 },
    ],
  },
};

export function sceneFor(key) {
  return SCENES[key] ?? SCENES.meadow;
}

export function animalFor(key) {
  return ANIMALS[key] ?? null;
}
