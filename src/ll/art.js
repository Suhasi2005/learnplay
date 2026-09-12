// Little Learners art manifest.
//
// Metro resolves require() at build time, so every path is spelled out here
// and screens reference art by name. One place to look when an image is
// missing, and no screen ever holds a file path.

export const CHAR = {
  mia: require('../../assets/ll/char-mia.png'),
  leo: require('../../assets/ll/char-leo.png'),
  birdie: require('../../assets/ll/char-birdie.png'),
  buddy: require('../../assets/ll/char-buddy.png'),
};

// Round headshots, used for avatars and speech-bubble rows.
//
// Every character has the same four expressions, which is what lets a screen
// pick a mood by name instead of hunting for whichever file happens to exist.
export const FACE = {
  miaHappy: require('../../assets/ll/ex-mia-happy.png'),
  miaExcited: require('../../assets/ll/ex-mia-excited.png'),
  miaLaughing: require('../../assets/ll/ex-mia-laughing.png'),
  miaWink: require('../../assets/ll/ex-mia-wink.png'),

  leoHappy: require('../../assets/ll/ex-leo-happy.png'),
  leoExcited: require('../../assets/ll/ex-leo-excited.png'),
  leoLaughing: require('../../assets/ll/ex-leo-laughing.png'),
  leoWink: require('../../assets/ll/ex-leo-wink.png'),

  birdieHappy: require('../../assets/ll/ex-birdie-happy.png'),
  birdieExcited: require('../../assets/ll/ex-birdie-excited.png'),
  birdieLaughing: require('../../assets/ll/ex-birdie-laughing.png'),
  birdieWink: require('../../assets/ll/ex-birdie-wink.png'),

  buddyHappy: require('../../assets/ll/ex-buddy-happy.png'),
  buddyExcited: require('../../assets/ll/ex-buddy-excited.png'),
  buddyLaughing: require('../../assets/ll/ex-buddy-laughing.png'),
  buddyWink: require('../../assets/ll/ex-buddy-wink.png'),
};

// Pick an expression by character and mood — screens say what they mean
// rather than naming a file.
export function faceOf(who, mood = 'happy') {
  const key = `${who}${mood[0].toUpperCase()}${mood.slice(1)}`;
  return FACE[key] ?? FACE[`${who}Happy`] ?? FACE.miaHappy;
}

// Full-body art for hero moments. Note these are NOT transparent cutouts —
// every supplied image is fully opaque (corner alpha 255), which is why they
// live inside rounded containers with `cover` rather than floating free.
// That's also what made converting the large ones to JPEG safe: 4.33 MB of
// PNG became 0.39 MB with nothing lost.
export const HERO = {
  mia: require('../../assets/ll/hero-mia.jpg'),
  leo: require('../../assets/ll/hero-leo.jpg'),
  buddy: require('../../assets/ll/hero-buddy.jpg'),
};

export const POSE = {
  miaWave: require('../../assets/ll/pose-mia-wave.png'),
  miaJump: require('../../assets/ll/pose-mia-jump.png'),
  miaPoint: require('../../assets/ll/pose-mia-point.png'),
  miaRead: require('../../assets/ll/pose-mia-read.png'),
  miaBooks: require('../../assets/ll/pose-mia-books.png'),
  leoJump: require('../../assets/ll/pose-leo-jump.png'),
  leoPoint: require('../../assets/ll/pose-leo-point.png'),
  leoWave: require('../../assets/ll/pose-leo-wave.png'),
  leoBook: require('../../assets/ll/pose-leo-book.png'),
  leoSit: require('../../assets/ll/pose-leo-sit.png'),
  birdieFly: require('../../assets/ll/pose-birdie-fly.png'),
  birdieCheer: require('../../assets/ll/pose-birdie-cheer.png'),
  birdieStar: require('../../assets/ll/pose-birdie-star.png'),
  birdieThink: require('../../assets/ll/pose-birdie-think.png'),
  birdieSleep: require('../../assets/ll/pose-birdie-sleep.png'),
  buddyFloat: require('../../assets/ll/pose-buddy-float.png'),
  buddyThink: require('../../assets/ll/pose-buddy-think.png'),
  buddyWave: require('../../assets/ll/pose-buddy-wave.png'),
  buddyCelebrate: require('../../assets/ll/pose-buddy-celebrate.png'),
  buddyLaptop: require('../../assets/ll/pose-buddy-laptop.png'),
};

// Full illustrated moments.
export const SCENE = {
  miaHello: require('../../assets/ll/scene-mia-hello.png'),
  miaHome: require('../../assets/ll/scene-mia-home.png'),
  miaIdle: require('../../assets/ll/scene-mia-idle.png'),
  miaLesson: require('../../assets/ll/scene-mia-lesson.png'),
  miaReward: require('../../assets/ll/scene-mia-reward.png'),
  leoHome: require('../../assets/ll/scene-leo-home.png'),
  leoIdle: require('../../assets/ll/scene-leo-idle.png'),
  leoLesson: require('../../assets/ll/scene-leo-lesson.png'),
  leoGame: require('../../assets/ll/scene-leo-game.png'),
  leoOnboard: require('../../assets/ll/scene-leo-onboard.png'),
  leoReward: require('../../assets/ll/scene-leo-reward.png'),
  buddyCorrect: require('../../assets/ll/scene-buddy-correct.png'),
  buddyHint: require('../../assets/ll/scene-buddy-hint.png'),
  buddyHome: require('../../assets/ll/scene-buddy-home.png'),
  buddyLesson: require('../../assets/ll/scene-buddy-lesson.png'),
  buddyLevelUp: require('../../assets/ll/scene-buddy-levelup.png'),
  buddyOnboard: require('../../assets/ll/scene-buddy-onboard.png'),
};

export const WORLD_ART = {
  garden: require('../../assets/ll/world-garden.jpg'),
  numbers: require('../../assets/ll/world-numbers.jpg'),
  castle: require('../../assets/ll/world-castle.jpg'),
  lab: require('../../assets/ll/world-lab.jpg'),
  library: require('../../assets/ll/world-library.jpg'),
};

export const ICON = {
  back: require('../../assets/ll/icon-back.png'),
  next: require('../../assets/ll/icon-next.png'),
  bell: require('../../assets/ll/icon-bell.png'),
  search: require('../../assets/ll/icon-search.png'),
  settings: require('../../assets/ll/icon-settings.png'),
  star: require('../../assets/ll/icon-star.png'),
  heart: require('../../assets/ll/icon-heart.png'),
  hint: require('../../assets/ll/icon-hint.png'),
  lock: require('../../assets/ll/icon-lock.png'),
  home: require('../../assets/ll/icon-home.png'),
  games: require('../../assets/ll/icon-games.png'),
  lessons: require('../../assets/ll/icon-lessons.png'),
  rewards: require('../../assets/ll/icon-rewards.png'),
  profile: require('../../assets/ll/icon-profile.png'),
  coins: require('../../assets/ll/icon-coins.png'),
};

export const REWARD_ART = {
  coin: require('../../assets/ll/rw-coin.png'),
  gem: require('../../assets/ll/rw-gem.png'),
  gift: require('../../assets/ll/rw-gift.png'),
  medal: require('../../assets/ll/rw-medal.png'),
  star3: require('../../assets/ll/rw-star3.png'),
  trophy: require('../../assets/ll/rw-trophy.png'),
};

export const ANIMAL = {
  bunny: require('../../assets/ll/animal-bunny.png'),
  fox: require('../../assets/ll/animal-fox.png'),
  panda: require('../../assets/ll/animal-panda.png'),
  turtle: require('../../assets/ll/animal-turtle.png'),
};

// The four companions, as data. Screens read this rather than hard-coding a
// name next to a picture, so a character can be re-cast in one place.
export const CREW = [
  { id: 'mia', name: 'Mia', role: 'Your guide. Loves stories and big questions.', img: CHAR.mia, face: FACE.miaHappy, soft: '#FFE3EE' },
  { id: 'leo', name: 'Leo', role: 'Brave explorer. First to try anything new.', img: CHAR.leo, face: FACE.leoHappy, soft: '#E8F0FF' },
  { id: 'birdie', name: 'Birdie', role: 'Cheers you on and counts every star.', img: CHAR.birdie, face: FACE.birdieHappy, soft: '#FFF6E3' },
  { id: 'buddy', name: 'Buddy', role: 'Gives friendly hints, never a wrong buzz.', img: CHAR.buddy, face: FACE.buddyHappy, soft: '#EDE6FF' },
];
