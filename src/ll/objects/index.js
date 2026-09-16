import { StyleSheet, Text, View } from 'react-native';
import * as Everyday from './everyday';
import * as Creatures from './creatures';
import * as Nature from './nature';
import * as School from './school';
import { Bead } from './beads';

// The object registry.
//
// Games name the thing they want to draw; this decides how to draw it. The
// contract is deliberately one-way: a game passes an id and an emoji, and
// gets back the best available rendering of that object. It never has to
// know whether a real asset exists.
//
//   <GameObject id="spoon" emoji="🥄" size={40} />
//
// Resolution order:
//   1. a registered SVG component
//   2. a PNG in assets (when one is added — see IMAGES below)
//   3. the emoji the data already carries
//
// Because the emoji is always the last resort, a missing asset is never a
// crash and never an empty box: the game looks exactly as it did before.
// That's what makes it safe to fill this table in gradually, one game at a
// time, without touching a single data file or game screen again.
//
// Adding a real illustration later is a one-line change here. Nothing in any
// *Data.js or *Screen.js needs to move.

// SVG objects, keyed by the ids already used in the data files.
const SVGS = {
  // Grocery Belt — everyday vocabulary
  spoon: Everyday.Spoon,
  cup: Everyday.Cup,
  chair: Everyday.Chair,
  umbrella: Everyday.Umbrella,
  shoe: Everyday.Shoe,
  bag: Everyday.Bag,
  key: Everyday.Key,
  ball: Everyday.Ball,
  book: Everyday.Book,
  hat: Everyday.Hat,

  // Habitat Drop — creatures
  fish: Creatures.Fish,
  bird: Creatures.Bird,
  dog: Creatures.Dog,
  duck: Creatures.Duck,
  butterfly: Creatures.Butterfly,
  cow: Creatures.Cow,
  crab: Creatures.Crab,
  bee: Creatures.Bee,

  // Shared with Rhyme Train, Animal Riddle, Which More
  fox: Creatures.Fox,
  mouse: Creatures.Mouse,
  snake: Creatures.Snake,
  cat: Nature.Cat,
  pig: Nature.Pig,

  // Rhyme Train / Story Balloon / Day Order
  star: Nature.Star,
  moon: Nature.Moon,
  sun: Nature.Sun,
  tree: Nature.Tree,
  car: Nature.Car,
  house: Nature.House,
  box: Nature.Box,
  cake: Nature.Cake,
  crown: Nature.Crown,
  king: Nature.Crown,   // the rhyme is "king"; a crown is the readable object
  ring: Nature.Ring,
  balloon: School.Balloon,

  // Grade 1: school, home and money objects
  pencil: School.Pencil,
  ruler: School.Ruler,
  notebook: School.Notebook,
  bottle: School.WaterBottle,
  water: School.WaterBottle,
  apple: School.Apple,
  lunch: School.Apple,
  shell: School.Shell,
  coin: School.Coin,
  clock: School.Clock,
  sock: School.Sock,
  socks: School.Sock,
  teddy: School.Teddy,
  toy: School.Teddy,
  soap: School.Soap,
};

// Beads are parametric — colour comes from the pattern data, so they can't
// live in the fixed table. Exported separately for Bead Necklace.
export { Bead };

// Reserved for real illustration files. Empty by design: when a PNG lands in
// assets/ll/objects/, add `spoon: require('../../../assets/ll/objects/spoon.png')`
// and it takes precedence over the SVG with no other change anywhere.
const IMAGES = {};

// Rhyme Train and several Grade 1 games carry labels rather than ids, so the
// registry also accepts a word. Lowercased and singularised on lookup.
const ALIASES = {
  // Plural → singular, and label → object where the word and the drawn
  // thing differ.
  stars: 'star', coins: 'coin', books: 'book', apples: 'apple',
  shells: 'shell', pencils: 'pencil', balloons: 'balloon',
  cars: 'car', trees: 'tree', cups: 'cup', beads: 'bead',
  bear: 'teddy', crayon: 'pencil', notebook: 'notebook',
  'water bottle': 'bottle', lunchbox: 'apple', 'tiffin box': 'apple',
  football: 'ball', umbrella: 'umbrella',
};

export function resolve(id) {
  if (!id) return null;
  const raw = String(id).toLowerCase().trim();
  const key = ALIASES[raw] ?? raw;
  return SVGS[key] ?? null;
}

export function hasObject(id) {
  return resolve(id) != null;
}

// One game object. `size` is the box it draws into; SVGs fill it exactly, so
// a row of mixed objects lines up regardless of which are drawn and which
// are still emoji.
export default function GameObject({ id, emoji, size = 40, style, accessibilityLabel }) {
  const Art = resolve(id);

  if (Art) {
    return (
      <View
        style={[{ width: size, height: size }, style]}
        accessibilityLabel={accessibilityLabel}
        accessible={!!accessibilityLabel}
      >
        <Art />
      </View>
    );
  }

  // Fallback: the emoji the data already carries, sized to match the box so
  // a half-converted screen still reads as one row.
  return (
    <View style={[styles.fallback, { width: size, height: size }, style]}>
      <Text
        style={{ fontSize: size * 0.78, lineHeight: size * 0.95 }}
        accessibilityLabel={accessibilityLabel}
      >
        {emoji}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
