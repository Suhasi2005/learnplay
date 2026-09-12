// The single source of truth for every grade/subject/topic the app knows
// about, researched from typical Indian preschool (LKG/UKG) and CBSE Class 1
// (NCERT "Mridang"/"Joyful Mathematics") curricula. Every topic here is real
// — nothing invented to pad the list — but only a few have `playable` set,
// meaning a screen actually exists for them. Everything else renders as an
// honest "Coming Soon" card: the full scope is visible, the working part
// isn't overstated.
//
// Playable entries also carry `total` — the exact round/level count from
// that game's own data file. TopicSelectScreen uses it to bound-check saved
// progress before offering "Continue": without it, a progress record saved
// at exactly the final round (a narrow race if the app closes in the ~1.4s
// window between the last correct answer and the completion screen clearing
// it) would let a child tap "Continue" straight into an out-of-range round
// and crash the screen. Keep this in sync with each *Data.js file's round
// count — it's re-verified by a QA script, not just eyeballed.

export const CURRICULUM = {
  'Junior KG': {
    English: [
      { id: 'jk-en-abc', label: 'Learn ABC', emoji: '🔠', description: 'Alphabet sounds & phonics', playable: 'AlphabetGame', total: 26 },
      { id: 'jk-en-letters', label: 'Capital & Small Letters', emoji: '🔡', description: 'Match capital letters with their small partners', playable: 'LLQuiz', total: 6 },
      { id: 'jk-en-vocab', label: 'Everyday Words', emoji: '💬', description: 'Spot the named object on the grocery belt', playable: 'GroceryBelt', total: 10 },
      { id: 'jk-en-rhymes', label: 'Rhymes & Stories', emoji: '📖', description: 'Couple the rhyming word onto the train', playable: 'RhymeTrain', total: 8 },
    ],
    Math: [
      { id: 'jk-ma-numbers', label: 'Count to 10', emoji: '🔢', description: 'Numbers & counting', playable: 'NumberGame', total: 10 },
      { id: 'jk-ma-shapes', label: 'Shapes', emoji: '🔺', description: 'Sort each shape into the right bin', playable: 'ShapeSort', total: 8 },
      { id: 'jk-ma-patterns', label: 'Patterns', emoji: '🧩', description: 'Thread the next bead to continue the pattern', playable: 'BeadNecklace', total: 8 },
    ],
    EVS: [
      { id: 'jk-ev-habits', label: 'Good Habits & Manners', emoji: '🙏', description: 'Choose the kind and polite thing to do', playable: 'LLQuiz', total: 6 },
      { id: 'jk-ev-living', label: 'Living & Non-Living Things', emoji: '🌱', description: 'Sort each thing into the right bin', playable: 'LivingOrNot', total: 8 },
      { id: 'jk-ev-traffic', label: 'Traffic Rules & Safety', emoji: '🚦', description: 'Beat the clock — Stop, Wait, or Go', playable: 'StopOrGo', total: 9 },
      { id: 'jk-ev-body', label: 'Parts of the Body', emoji: '🧍', description: 'Point to the body part named aloud', playable: 'PointToThe', total: 6 },
      { id: 'jk-ev-animals', label: 'Animals', emoji: '🐘', description: 'Send each animal parachuting to its home', playable: 'HabitatDrop', total: 8 },
      { id: 'jk-ev-veggies', label: 'Vegetables & Fruits', emoji: '🥕', description: 'Sort fruits from vegetables and learn where they grow', playable: 'LLQuiz', total: 6 },
      { id: 'jk-ev-helpers', label: 'Community Helpers', emoji: '👮', description: 'Match each tool to the helper who uses it', playable: 'WhoUsesThis', total: 8 },
    ],
  },

  'Senior KG': {
    English: [
      { id: 'sk-en-case', label: 'Uppercase & Lowercase', emoji: '🅰️', description: 'Capitals for names, sentences and places', playable: 'LLQuiz', total: 6 },
      { id: 'sk-en-phonics', label: 'Letter Sounds & Phonics', emoji: '🔤', description: 'Listen for the sound a word starts or ends with', playable: 'LLQuiz', total: 6 },
      { id: 'sk-en-vocab', label: 'Vocabulary from Stories', emoji: '📚' },
      { id: 'sk-en-sentences', label: 'Simple Sentences', emoji: '✏️' },
    ],
    Math: [
      { id: 'sk-ma-opposites', label: 'Opposites', emoji: '↔️', description: 'Match each word to its opposite', playable: 'OppositesMatch', total: 2 },
      { id: 'sk-ma-shapes', label: 'Shapes', emoji: '🔷' },
      { id: 'sk-ma-numbers100', label: 'Numbers up to 100', emoji: '💯' },
      { id: 'sk-ma-time', label: 'Time', emoji: '🕐', description: 'Read a real analog clock face', playable: 'WhatTimeIsIt', total: 12 },
      { id: 'sk-ma-addsub', label: 'Addition & Subtraction', emoji: '➕' },
      { id: 'sk-ma-money', label: 'Money', emoji: '🪙', description: 'Tap coins to make the target amount', playable: 'MakeAmount', total: 10 },
      { id: 'sk-ma-skipcount', label: 'Skip Counting', emoji: '⏭️' },
      { id: 'sk-ma-colors', label: 'Colors', emoji: '🎨', description: 'Spot the one that\'s different', playable: 'OddOneOut', total: 10 },
    ],
    EVS: [
      { id: 'sk-ev-self', label: 'Myself, Family & School', emoji: '👨‍👩‍👧' },
      { id: 'sk-ev-seasons', label: 'Seasons', emoji: '🍂', description: 'Pick the right outfit for the season', playable: 'DressForSeason', total: 6 },
      { id: 'sk-ev-transport', label: 'Transportation', emoji: '🚗' },
      { id: 'sk-ev-animals', label: 'Animals & Their Sounds', emoji: '🐄', description: 'Match the sound to the animal', playable: 'WhoSaysThat', total: 8 },
    ],
  },

  'Grade 1': {
    English: [
      { id: 'g1-en-alphabet', label: 'Alphabet Recognition', emoji: '🔠' },
      { id: 'g1-en-phonetics', label: 'Phonetics', emoji: '🔊' },
      { id: 'g1-en-sentences', label: 'Simple Sentence Formation', emoji: '📝' },
      { id: 'g1-en-grammar', label: 'Basic Grammar', emoji: '📘' },
    ],
    // Chapter names from NCERT "Joyful Mathematics" for Class 1
    Math: [
      { id: 'g1-ma-prenum', label: 'Pre-Number Concepts', emoji: '🐱' },
      { id: 'g1-ma-shapes', label: 'What is Long? What is Round?', emoji: '🔺' },
      { id: 'g1-ma-num1to9', label: 'Numbers 1 to 9', emoji: '9️⃣' },
      { id: 'g1-ma-num10to20', label: 'Numbers 10 to 20', emoji: '🔢', description: 'Fill the missing number in the sequence', playable: 'NumberLineGap', total: 10 },
      { id: 'g1-ma-addition', label: 'Addition & Subtraction', emoji: '➕', description: 'Build the equation and find the answer', playable: 'AddItUp', total: 10 },
      { id: 'g1-ma-addsub20', label: 'Addition & Subtraction up to 20', emoji: '➖' },
      { id: 'g1-ma-measurement', label: 'Measurement', emoji: '📏', description: 'Which one is bigger or smaller?', playable: 'BiggerOrSmaller', total: 10 },
      { id: 'g1-ma-num21to99', label: 'Numbers 21 to 99', emoji: '💯' },
      { id: 'g1-ma-patterns', label: 'Patterns', emoji: '🧩', description: 'Figure out what comes next', playable: 'WhatComesNext', total: 10 },
      { id: 'g1-ma-time', label: 'Time', emoji: '🕐' },
      { id: 'g1-ma-multiplication', label: 'Multiplication (Intro)', emoji: '✖️', description: 'Count groups to find the total', playable: 'GroupsOf', total: 8 },
      { id: 'g1-ma-money', label: 'Money', emoji: '🪙' },
      { id: 'g1-ma-data', label: 'Data Handling', emoji: '📊', description: 'Read the chart to find the answer', playable: 'ReadTheChart', total: 8 },
    ],
    EVS: [
      { id: 'g1-ev-body', label: 'Our Body', emoji: '🧍', description: 'Which part of you sees, hears, smells and tastes', playable: 'LLQuiz', total: 6 },
      { id: 'g1-ev-food', label: 'Our Food', emoji: '🍎', description: 'Healthy food, where it comes from, and why we wash it', playable: 'LLQuiz', total: 6 },
      { id: 'g1-ev-water', label: 'Water', emoji: '💧', description: 'Where water comes from and how not to waste it', playable: 'LLQuiz', total: 6 },
      { id: 'g1-ev-clothes', label: 'Our Clothes', emoji: '👕' },
      { id: 'g1-ev-house', label: 'Our House', emoji: '🏠' },
      { id: 'g1-ev-family', label: 'My Family', emoji: '👨‍👩‍👧‍👦' },
      { id: 'g1-ev-school', label: 'My School', emoji: '🏫' },
      { id: 'g1-ev-safety', label: 'Safety Rules', emoji: '⚠️', description: 'Roads, strangers, fire and staying safe', playable: 'LLQuiz', total: 6 },
      { id: 'g1-ev-plants', label: 'Plants Around Us', emoji: '🌳', description: 'Roots, leaves and what plants need to grow', playable: 'LLQuiz', total: 6 },
      { id: 'g1-ev-animals', label: 'Animals Around Us', emoji: '🐘' },
      { id: 'g1-ev-transport', label: 'Means of Transport', emoji: '🚂', description: 'Travel by land, water and air', playable: 'LLQuiz', total: 6 },
      { id: 'g1-ev-helpers', label: 'Our Helpers', emoji: '👮', description: 'The people who keep our town running', playable: 'LLQuiz', total: 6 },
      { id: 'g1-ev-sky', label: 'The Sky Above Us', emoji: '🌤️', description: 'Sun, moon, stars, clouds and rainbows', playable: 'LLQuiz', total: 6 },
    ],
  },
};

export function isGradeAvailable(grade) {
  const subjects = CURRICULUM[grade] ?? {};
  return Object.values(subjects).some((topics) => topics.some((t) => t.playable));
}

export function isSubjectAvailable(grade, subject) {
  const topics = CURRICULUM[grade]?.[subject] ?? [];
  return topics.some((t) => t.playable);
}
