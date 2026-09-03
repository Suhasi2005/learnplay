// The single source of truth for every grade/subject/topic the app knows
// about, researched from typical Indian preschool (LKG/UKG) and CBSE Class 1
// (NCERT "Mridang"/"Joyful Mathematics") curricula. Every topic here is real
// — nothing invented to pad the list — but only a few have `playable` set,
// meaning a screen actually exists for them. Everything else renders as an
// honest "Coming Soon" card: the full scope is visible, the working part
// isn't overstated.

export const CURRICULUM = {
  'Junior KG': {
    English: [
      { id: 'jk-en-abc', label: 'Learn ABC', emoji: '🔠', description: 'Alphabet sounds & phonics', playable: 'AlphabetGame' },
      { id: 'jk-en-letters', label: 'Capital & Small Letters', emoji: '🔡' },
      { id: 'jk-en-vocab', label: 'Everyday Words', emoji: '💬' },
      { id: 'jk-en-rhymes', label: 'Rhymes & Stories', emoji: '📖' },
    ],
    Math: [
      { id: 'jk-ma-numbers', label: 'Count to 10', emoji: '🔢', description: 'Numbers & counting', playable: 'NumberGame' },
      { id: 'jk-ma-shapes', label: 'Shapes', emoji: '🔺' },
      { id: 'jk-ma-patterns', label: 'Patterns', emoji: '🧩' },
    ],
    EVS: [
      { id: 'jk-ev-habits', label: 'Good Habits & Manners', emoji: '🙏' },
      { id: 'jk-ev-living', label: 'Living & Non-Living Things', emoji: '🌱' },
      { id: 'jk-ev-traffic', label: 'Traffic Rules & Safety', emoji: '🚦' },
      { id: 'jk-ev-body', label: 'Parts of the Body', emoji: '🧍' },
      { id: 'jk-ev-animals', label: 'Animals', emoji: '🐘' },
      { id: 'jk-ev-veggies', label: 'Vegetables & Fruits', emoji: '🥕' },
      { id: 'jk-ev-helpers', label: 'Community Helpers', emoji: '👮' },
    ],
  },

  'Senior KG': {
    English: [
      { id: 'sk-en-case', label: 'Uppercase & Lowercase', emoji: '🅰️' },
      { id: 'sk-en-phonics', label: 'Letter Sounds & Phonics', emoji: '🔤' },
      { id: 'sk-en-vocab', label: 'Vocabulary from Stories', emoji: '📚' },
      { id: 'sk-en-sentences', label: 'Simple Sentences', emoji: '✏️' },
    ],
    Math: [
      { id: 'sk-ma-opposites', label: 'Opposites', emoji: '↔️', description: 'Match each word to its opposite', playable: 'OppositesMatch' },
      { id: 'sk-ma-shapes', label: 'Shapes', emoji: '🔷' },
      { id: 'sk-ma-numbers100', label: 'Numbers up to 100', emoji: '💯' },
      { id: 'sk-ma-time', label: 'Time', emoji: '🕐' },
      { id: 'sk-ma-addsub', label: 'Addition & Subtraction', emoji: '➕' },
      { id: 'sk-ma-money', label: 'Money', emoji: '🪙' },
      { id: 'sk-ma-skipcount', label: 'Skip Counting', emoji: '⏭️' },
      { id: 'sk-ma-colors', label: 'Colors', emoji: '🎨' },
    ],
    EVS: [
      { id: 'sk-ev-self', label: 'Myself, Family & School', emoji: '👨‍👩‍👧' },
      { id: 'sk-ev-seasons', label: 'Seasons', emoji: '🍂' },
      { id: 'sk-ev-transport', label: 'Transportation', emoji: '🚗' },
      { id: 'sk-ev-animals', label: 'Animals & Their Sounds', emoji: '🐄' },
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
      { id: 'g1-ma-num10to20', label: 'Numbers 10 to 20', emoji: '🔢' },
      { id: 'g1-ma-addition', label: 'Addition & Subtraction', emoji: '➕', description: 'Build the equation and find the answer', playable: 'AddItUp' },
      { id: 'g1-ma-addsub20', label: 'Addition & Subtraction up to 20', emoji: '➖' },
      { id: 'g1-ma-measurement', label: 'Measurement', emoji: '📏' },
      { id: 'g1-ma-num21to99', label: 'Numbers 21 to 99', emoji: '💯' },
      { id: 'g1-ma-patterns', label: 'Patterns', emoji: '🧩' },
      { id: 'g1-ma-time', label: 'Time', emoji: '🕐' },
      { id: 'g1-ma-multiplication', label: 'Multiplication (Intro)', emoji: '✖️' },
      { id: 'g1-ma-money', label: 'Money', emoji: '🪙' },
      { id: 'g1-ma-data', label: 'Data Handling', emoji: '📊' },
    ],
    EVS: [
      { id: 'g1-ev-body', label: 'Our Body', emoji: '🧍' },
      { id: 'g1-ev-food', label: 'Our Food', emoji: '🍎' },
      { id: 'g1-ev-water', label: 'Water', emoji: '💧' },
      { id: 'g1-ev-clothes', label: 'Our Clothes', emoji: '👕' },
      { id: 'g1-ev-house', label: 'Our House', emoji: '🏠' },
      { id: 'g1-ev-family', label: 'My Family', emoji: '👨‍👩‍👧‍👦' },
      { id: 'g1-ev-school', label: 'My School', emoji: '🏫' },
      { id: 'g1-ev-safety', label: 'Safety Rules', emoji: '⚠️' },
      { id: 'g1-ev-plants', label: 'Plants Around Us', emoji: '🌳' },
      { id: 'g1-ev-animals', label: 'Animals Around Us', emoji: '🐘' },
      { id: 'g1-ev-transport', label: 'Means of Transport', emoji: '🚂' },
      { id: 'g1-ev-helpers', label: 'Our Helpers', emoji: '👮' },
      { id: 'g1-ev-sky', label: 'The Sky Above Us', emoji: '🌤️' },
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
