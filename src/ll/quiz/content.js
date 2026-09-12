// Quiz content, keyed by curriculum topic id.
//
// Written against the same Indian preschool / NCERT Class 1 scope the rest of
// curriculum.js follows. Rules held to throughout:
//
//   - Every distractor is plausible. "Which is a fruit? Apple / Chair" teaches
//     nothing; "Apple / Carrot" makes a child actually think about the
//     difference between a fruit and a vegetable.
//   - Hints explain the idea, never just restate the answer.
//   - Language stays inside the age band: short sentences, familiar objects,
//     Indian context where it's natural (roti, auto-rickshaw, monsoon).

export const QUIZZES = {
  // ---------------------------------------------------------------- Junior KG
  'jk-en-letters': [
    { prompt: 'Which is the small letter for  A ?', choices: [{ label: 'a' }, { label: 'e' }, { label: 'o' }], answer: 0,
      hint: 'Small "a" looks like a tiny circle with a line down its right side.' },
    { prompt: 'Which is the small letter for  B ?', choices: [{ label: 'b' }, { label: 'd' }, { label: 'p' }], answer: 0,
      hint: 'Small "b" has its tummy on the right, like a big B does.' },
    { prompt: 'Which is the CAPITAL letter for  m ?', choices: [{ label: 'M' }, { label: 'N' }, { label: 'W' }], answer: 0,
      hint: 'Capital M has two pointy hills standing up.' },
    { prompt: 'Which is the small letter for  T ?', choices: [{ label: 't' }, { label: 'f' }, { label: 'l' }], answer: 0,
      hint: 'Small "t" has a short line crossing near the top.' },
    { prompt: 'Which is the CAPITAL letter for  s ?', choices: [{ label: 'S' }, { label: 'Z' }, { label: 'C' }], answer: 0,
      hint: 'S curves like a snake, one way then the other.' },
    { prompt: 'Which is the small letter for  D ?', choices: [{ label: 'd' }, { label: 'b' }, { label: 'q' }], answer: 0,
      hint: 'Small "d" has its tummy on the left side.' },
  ],

  'jk-ev-habits': [
    { prompt: 'Someone gives you a gift. What do you say?', show: '🎁',
      choices: [{ label: 'Thank you', emoji: '😊' }, { label: 'Give me more', emoji: '🙃' }, { label: 'Nothing', emoji: '😐' }], answer: 0,
      hint: 'We say thank you when someone does something kind for us.' },
    { prompt: 'What should you do before eating?', show: '🍽️',
      choices: [{ label: 'Wash hands', emoji: '🧼' }, { label: 'Watch TV', emoji: '📺' }, { label: 'Run outside', emoji: '🏃' }], answer: 0,
      hint: 'Hands pick up germs all day. Water and soap wash them away.' },
    { prompt: 'You want to walk past someone. What do you say?', show: '🚶',
      choices: [{ label: 'Excuse me', emoji: '🙋' }, { label: 'Move!', emoji: '😠' }, { label: 'Push them', emoji: '✋' }], answer: 0,
      hint: '"Excuse me" is the polite way to ask for space.' },
    { prompt: 'Where does rubbish go?', show: '🍌',
      choices: [{ label: 'In the bin', emoji: '🗑️' }, { label: 'On the floor', emoji: '🏠' }, { label: 'Out the window', emoji: '🪟' }], answer: 0,
      hint: 'Rubbish in the bin keeps everyone’s home and street clean.' },
    { prompt: 'Your friend is sad. What is the kind thing to do?', show: '😢',
      choices: [{ label: 'Ask if they are okay', emoji: '💛' }, { label: 'Laugh', emoji: '😂' }, { label: 'Walk away', emoji: '🚶' }], answer: 0,
      hint: 'Being kind means noticing how someone feels.' },
    { prompt: 'When someone is talking, you should…', show: '💬',
      choices: [{ label: 'Listen', emoji: '👂' }, { label: 'Shout', emoji: '📢' }, { label: 'Interrupt', emoji: '🗣️' }], answer: 0,
      hint: 'Listening is how we show someone their words matter.' },
  ],

  'jk-ev-veggies': [
    { prompt: 'Which one is a fruit?', choices: [{ label: 'Mango', emoji: '🥭' }, { label: 'Carrot', emoji: '🥕' }, { label: 'Onion', emoji: '🧅' }], answer: 0,
      hint: 'Fruits are usually sweet and hold the seeds of the plant.' },
    { prompt: 'Which one is a vegetable?', choices: [{ label: 'Brinjal', emoji: '🍆' }, { label: 'Banana', emoji: '🍌' }, { label: 'Grapes', emoji: '🍇' }], answer: 0,
      hint: 'Vegetables are the leaves, roots or stems we cook and eat.' },
    { prompt: 'Which one grows UNDER the ground?', choices: [{ label: 'Potato', emoji: '🥔' }, { label: 'Apple', emoji: '🍎' }, { label: 'Mango', emoji: '🥭' }], answer: 0,
      hint: 'We dig this one out of the soil — it grows on the root.' },
    { prompt: 'Which one is red inside and sweet?', choices: [{ label: 'Watermelon', emoji: '🍉' }, { label: 'Cabbage', emoji: '🥬' }, { label: 'Garlic', emoji: '🧄' }], answer: 0,
      hint: 'It is big, green outside, and full of juice and seeds.' },
    { prompt: 'Which one do we peel before eating?', choices: [{ label: 'Banana', emoji: '🍌' }, { label: 'Tomato', emoji: '🍅' }, { label: 'Spinach', emoji: '🥬' }], answer: 0,
      hint: 'Its soft yellow skin comes off in strips.' },
    { prompt: 'Which of these is a green leafy vegetable?', choices: [{ label: 'Spinach', emoji: '🥬' }, { label: 'Corn', emoji: '🌽' }, { label: 'Lemon', emoji: '🍋' }], answer: 0,
      hint: 'Leafy means we eat the leaves — palak is one of these.' },
  ],

  // ---------------------------------------------------------------- Senior KG
  'sk-en-phonics': [
    { prompt: 'Which word starts with the  /s/  sound?', choices: [{ label: 'Sun', emoji: '☀️' }, { label: 'Moon', emoji: '🌙' }, { label: 'Cat', emoji: '🐱' }], answer: 0,
      hint: 'Say each word slowly. Listen for the hiss at the very start.' },
    { prompt: 'Which word starts with the  /b/  sound?', choices: [{ label: 'Ball', emoji: '⚽' }, { label: 'Doll', emoji: '🪆' }, { label: 'Tree', emoji: '🌳' }], answer: 0,
      hint: '/b/ is made by popping your lips open.' },
    { prompt: 'Which word ENDS with the  /t/  sound?', choices: [{ label: 'Cat', emoji: '🐱' }, { label: 'Dog', emoji: '🐶' }, { label: 'Cow', emoji: '🐄' }], answer: 0,
      hint: 'Say the word and stop at the very last sound.' },
    { prompt: 'Which word starts with the  /m/  sound?', choices: [{ label: 'Mango', emoji: '🥭' }, { label: 'Apple', emoji: '🍎' }, { label: 'Kite', emoji: '🪁' }], answer: 0,
      hint: '/m/ hums with your lips closed together.' },
    { prompt: 'Which word starts with the  /f/  sound?', choices: [{ label: 'Fish', emoji: '🐟' }, { label: 'Ship', emoji: '🚢' }, { label: 'Bird', emoji: '🐦' }], answer: 0,
      hint: 'Put your top teeth on your bottom lip and blow gently.' },
    { prompt: 'Which two words RHYME?', choices: [{ label: 'Cat and Hat' }, { label: 'Cat and Dog' }, { label: 'Cat and Fish' }], answer: 0,
      hint: 'Rhyming words end with the same sound.' },
  ],

  'sk-en-case': [
    { prompt: 'Match the pair: which is  G  and  g ?', choices: [{ label: 'G g' }, { label: 'G q' }, { label: 'G j' }], answer: 0,
      hint: 'The small letter is the same shape, just smaller.' },
    { prompt: 'Which sentence starts correctly?', choices: [{ label: 'My name is Ravi.' }, { label: 'my name is Ravi.' }, { label: 'MY NAME IS ravi.' }], answer: 0,
      hint: 'Every sentence begins with a capital letter.' },
    { prompt: 'Names of people start with…', choices: [{ label: 'A capital letter' }, { label: 'A small letter' }, { label: 'A number' }], answer: 0,
      hint: 'Meera, Arjun, Delhi — all begin with capitals.' },
    { prompt: 'Which is written correctly?', choices: [{ label: 'India' }, { label: 'india' }, { label: 'iNDIA' }], answer: 0,
      hint: 'The name of a country is special, so it gets a capital.' },
    { prompt: 'Which is the CAPITAL letter for  r ?', choices: [{ label: 'R' }, { label: 'P' }, { label: 'B' }], answer: 0,
      hint: 'R has a straight back, a round tummy and one kicking leg.' },
    { prompt: 'How many letters are in the English alphabet?', choices: [{ label: '26' }, { label: '20' }, { label: '30' }], answer: 0,
      hint: 'A to Z — sing it and count.' },
  ],

  // ------------------------------------------------------------------ Grade 1
  'g1-ev-body': [
    { prompt: 'Which part do we use to SEE?', choices: [{ label: 'Eyes', emoji: '👀' }, { label: 'Ears', emoji: '👂' }, { label: 'Nose', emoji: '👃' }], answer: 0,
      hint: 'Cover them and the world goes dark.' },
    { prompt: 'Which part do we use to SMELL?', choices: [{ label: 'Nose', emoji: '👃' }, { label: 'Hands', emoji: '✋' }, { label: 'Feet', emoji: '🦶' }], answer: 0,
      hint: 'It is how you know food is ready before you see it.' },
    { prompt: 'How many fingers are on ONE hand?', show: '✋', choices: [{ label: '5' }, { label: '4' }, { label: '10' }], answer: 0,
      hint: 'Hold up one hand and count them.' },
    { prompt: 'Which part helps us HEAR?', choices: [{ label: 'Ears', emoji: '👂' }, { label: 'Eyes', emoji: '👀' }, { label: 'Tongue', emoji: '👅' }], answer: 0,
      hint: 'You have one on each side of your head.' },
    { prompt: 'Which part do we use to TASTE?', choices: [{ label: 'Tongue', emoji: '👅' }, { label: 'Nose', emoji: '👃' }, { label: 'Hair', emoji: '💇' }], answer: 0,
      hint: 'It tells you if something is sweet, salty or sour.' },
    { prompt: 'Which part do we use to WALK?', choices: [{ label: 'Legs', emoji: '🦵' }, { label: 'Arms', emoji: '💪' }, { label: 'Ears', emoji: '👂' }], answer: 0,
      hint: 'They carry you from place to place.' },
  ],

  'g1-ev-food': [
    { prompt: 'Which of these is a healthy food?', choices: [{ label: 'Fruit', emoji: '🍎' }, { label: 'Candy', emoji: '🍬' }, { label: 'Cake', emoji: '🍰' }], answer: 0,
      hint: 'Healthy food helps you grow and gives you energy to play.' },
    { prompt: 'Which food comes from a COW?', choices: [{ label: 'Milk', emoji: '🥛' }, { label: 'Rice', emoji: '🍚' }, { label: 'Mango', emoji: '🥭' }], answer: 0,
      hint: 'We drink it, and cheese and curd are made from it.' },
    { prompt: 'Roti and rice give us mostly…', choices: [{ label: 'Energy', emoji: '⚡' }, { label: 'Water', emoji: '💧' }, { label: 'Air', emoji: '💨' }], answer: 0,
      hint: 'These are the foods that keep you going all day.' },
    { prompt: 'Which of these grows on a plant?', choices: [{ label: 'Tomato', emoji: '🍅' }, { label: 'Egg', emoji: '🥚' }, { label: 'Milk', emoji: '🥛' }], answer: 0,
      hint: 'Two of these come from animals. One grows in the soil.' },
    { prompt: 'What should we drink lots of every day?', choices: [{ label: 'Water', emoji: '💧' }, { label: 'Cold drink', emoji: '🥤' }, { label: 'Ice cream', emoji: '🍨' }], answer: 0,
      hint: 'Your body is mostly made of it.' },
    { prompt: 'We should wash fruits before eating because…', choices: [{ label: 'They may have dirt', emoji: '🧼' }, { label: 'They taste better', emoji: '😋' }, { label: 'They get bigger', emoji: '📏' }], answer: 0,
      hint: 'Washing removes dust and germs you cannot see.' },
  ],

  'g1-ev-water': [
    { prompt: 'Where does rain come from?', show: '🌧️', choices: [{ label: 'Clouds', emoji: '☁️' }, { label: 'Trees', emoji: '🌳' }, { label: 'Rocks', emoji: '🪨' }], answer: 0,
      hint: 'Look up when it rains — it falls from the sky.' },
    { prompt: 'Which one do we use water for?', choices: [{ label: 'Drinking', emoji: '🥛' }, { label: 'Reading', emoji: '📖' }, { label: 'Sleeping', emoji: '😴' }], answer: 0,
      hint: 'Your body needs it every single day.' },
    { prompt: 'When water gets very cold it becomes…', choices: [{ label: 'Ice', emoji: '🧊' }, { label: 'Steam', emoji: '💨' }, { label: 'Sand', emoji: '🏖️' }], answer: 0,
      hint: 'Think about what is in the freezer.' },
    { prompt: 'What should we do when brushing teeth?', choices: [{ label: 'Close the tap', emoji: '🚰' }, { label: 'Let it run', emoji: '💧' }, { label: 'Use more water', emoji: '🌊' }], answer: 0,
      hint: 'Clean water is precious — we should not waste it.' },
    { prompt: 'Which of these is a source of water?', choices: [{ label: 'River', emoji: '🏞️' }, { label: 'Road', emoji: '🛣️' }, { label: 'Wall', emoji: '🧱' }], answer: 0,
      hint: 'Rivers, wells and rain all bring us water.' },
    { prompt: 'Dirty water can make us…', choices: [{ label: 'Ill', emoji: '🤒' }, { label: 'Tall', emoji: '📏' }, { label: 'Fast', emoji: '🏃' }], answer: 0,
      hint: 'That is why we boil or filter water before drinking.' },
  ],

  'g1-ev-safety': [
    { prompt: 'The traffic light is RED. What do you do?', show: '🔴', choices: [{ label: 'Stop', emoji: '✋' }, { label: 'Run across', emoji: '🏃' }, { label: 'Close your eyes', emoji: '🙈' }], answer: 0,
      hint: 'Red always means stop and wait.' },
    { prompt: 'Where should you cross the road?', choices: [{ label: 'Zebra crossing', emoji: '🦓' }, { label: 'Anywhere', emoji: '🛣️' }, { label: 'Between cars', emoji: '🚗' }], answer: 0,
      hint: 'The white stripes are the safe place to walk across.' },
    { prompt: 'A stranger offers you sweets. What do you do?', choices: [{ label: 'Say no and tell an adult', emoji: '🙅' }, { label: 'Take them', emoji: '🍬' }, { label: 'Go with them', emoji: '🚶' }], answer: 0,
      hint: 'Always tell a grown-up you trust.' },
    { prompt: 'You see a fire. What should you do?', choices: [{ label: 'Tell an adult', emoji: '🗣️' }, { label: 'Touch it', emoji: '🔥' }, { label: 'Hide', emoji: '🙈' }], answer: 0,
      hint: 'Never try to handle fire yourself — get help fast.' },
    { prompt: 'In a car, you should always…', choices: [{ label: 'Wear a seat belt', emoji: '💺' }, { label: 'Stand up', emoji: '🧍' }, { label: 'Open the door', emoji: '🚪' }], answer: 0,
      hint: 'It holds you safely if the car stops suddenly.' },
    { prompt: 'Which is safe to play with?', choices: [{ label: 'A ball', emoji: '⚽' }, { label: 'A knife', emoji: '🔪' }, { label: 'Matches', emoji: '🔥' }], answer: 0,
      hint: 'Sharp and hot things are tools, not toys.' },
  ],

  'g1-ev-transport': [
    { prompt: 'Which one travels on WATER?', choices: [{ label: 'Boat', emoji: '⛵' }, { label: 'Bus', emoji: '🚌' }, { label: 'Cycle', emoji: '🚲' }], answer: 0,
      hint: 'It floats instead of rolling.' },
    { prompt: 'Which one travels in the AIR?', choices: [{ label: 'Aeroplane', emoji: '✈️' }, { label: 'Train', emoji: '🚆' }, { label: 'Car', emoji: '🚗' }], answer: 0,
      hint: 'It has wings and flies above the clouds.' },
    { prompt: 'Which one runs on rails?', choices: [{ label: 'Train', emoji: '🚆' }, { label: 'Auto-rickshaw', emoji: '🛺' }, { label: 'Boat', emoji: '⛵' }], answer: 0,
      hint: 'It follows two long metal tracks.' },
    { prompt: 'Which has only TWO wheels?', choices: [{ label: 'Cycle', emoji: '🚲' }, { label: 'Car', emoji: '🚗' }, { label: 'Bus', emoji: '🚌' }], answer: 0,
      hint: 'You pedal it with your feet.' },
    { prompt: 'Which one carries the most people?', choices: [{ label: 'Bus', emoji: '🚌' }, { label: 'Cycle', emoji: '🚲' }, { label: 'Scooter', emoji: '🛵' }], answer: 0,
      hint: 'It has many seats in long rows.' },
    { prompt: 'Which vehicle helps people who are ill?', choices: [{ label: 'Ambulance', emoji: '🚑' }, { label: 'Truck', emoji: '🚚' }, { label: 'Taxi', emoji: '🚕' }], answer: 0,
      hint: 'It has a siren and rushes to the hospital.' },
  ],

  'g1-ev-plants': [
    { prompt: 'What do plants need to grow?', choices: [{ label: 'Water and sunlight', emoji: '💧' }, { label: 'Milk', emoji: '🥛' }, { label: 'Sand only', emoji: '🏖️' }], answer: 0,
      hint: 'Two things: one from the sky, one from the tap.' },
    { prompt: 'Which part of the plant is UNDER the ground?', choices: [{ label: 'Roots', emoji: '🌱' }, { label: 'Leaves', emoji: '🍃' }, { label: 'Flower', emoji: '🌸' }], answer: 0,
      hint: 'They hold the plant steady and drink water from the soil.' },
    { prompt: 'Which part makes food for the plant?', choices: [{ label: 'Leaves', emoji: '🍃' }, { label: 'Roots', emoji: '🌱' }, { label: 'Stem', emoji: '🎋' }], answer: 0,
      hint: 'They are flat and green, and they catch the sunlight.' },
    { prompt: 'Which of these comes from a tree?', choices: [{ label: 'Mango', emoji: '🥭' }, { label: 'Stone', emoji: '🪨' }, { label: 'Plastic', emoji: '🧴' }], answer: 0,
      hint: 'You can eat it, and it grows on a branch.' },
    { prompt: 'A very big plant with a hard trunk is a…', choices: [{ label: 'Tree', emoji: '🌳' }, { label: 'Grass', emoji: '🌿' }, { label: 'Flower', emoji: '🌼' }], answer: 0,
      hint: 'You can sit in its shade.' },
    { prompt: 'Why should we not pluck leaves and flowers?', choices: [{ label: 'It hurts the plant', emoji: '🌱' }, { label: 'They are heavy', emoji: '⚖️' }, { label: 'They are dirty', emoji: '🧼' }], answer: 0,
      hint: 'Plants are living things and need all their parts.' },
  ],

  'g1-ev-helpers': [
    { prompt: 'Who helps us when we are ill?', choices: [{ label: 'Doctor', emoji: '👩‍⚕️' }, { label: 'Driver', emoji: '🚌' }, { label: 'Farmer', emoji: '🧑‍🌾' }], answer: 0,
      hint: 'You visit them at a clinic or hospital.' },
    { prompt: 'Who grows the food we eat?', choices: [{ label: 'Farmer', emoji: '🧑‍🌾' }, { label: 'Teacher', emoji: '👩‍🏫' }, { label: 'Pilot', emoji: '👨‍✈️' }], answer: 0,
      hint: 'They work in the fields with crops and soil.' },
    { prompt: 'Who teaches us at school?', choices: [{ label: 'Teacher', emoji: '👩‍🏫' }, { label: 'Postman', emoji: '📮' }, { label: 'Chef', emoji: '👨‍🍳' }], answer: 0,
      hint: 'They explain new things and check your work.' },
    { prompt: 'Who brings us letters and parcels?', choices: [{ label: 'Postman', emoji: '📮' }, { label: 'Doctor', emoji: '👩‍⚕️' }, { label: 'Police', emoji: '👮' }], answer: 0,
      hint: 'They carry a bag full of post to every house.' },
    { prompt: 'Who keeps us safe and helps if we are lost?', choices: [{ label: 'Police officer', emoji: '👮' }, { label: 'Painter', emoji: '👨‍🎨' }, { label: 'Barber', emoji: '💈' }], answer: 0,
      hint: 'They wear a uniform and you can always ask them for help.' },
    { prompt: 'Who puts out fires?', choices: [{ label: 'Firefighter', emoji: '👨‍🚒' }, { label: 'Tailor', emoji: '🧵' }, { label: 'Gardener', emoji: '🌷' }], answer: 0,
      hint: 'They arrive in a red truck with a long hose.' },
  ],

  'g1-ev-sky': [
    { prompt: 'What do we see in the sky during the DAY?', choices: [{ label: 'Sun', emoji: '☀️' }, { label: 'Moon', emoji: '🌙' }, { label: 'Stars', emoji: '⭐' }], answer: 0,
      hint: 'It is bright and gives us light and warmth.' },
    { prompt: 'What do we see in the sky at NIGHT?', choices: [{ label: 'Stars', emoji: '⭐' }, { label: 'Sun', emoji: '☀️' }, { label: 'Rainbow', emoji: '🌈' }], answer: 0,
      hint: 'Tiny lights, far far away.' },
    { prompt: 'What appears in the sky after rain?', choices: [{ label: 'Rainbow', emoji: '🌈' }, { label: 'Snow', emoji: '❄️' }, { label: 'Sand', emoji: '🏖️' }], answer: 0,
      hint: 'It has seven colours in a big curve.' },
    { prompt: 'Clouds are made of…', choices: [{ label: 'Tiny water drops', emoji: '💧' }, { label: 'Cotton', emoji: '🧵' }, { label: 'Smoke', emoji: '💨' }], answer: 0,
      hint: 'They look soft, but they are really water.' },
    { prompt: 'The moon looks brightest…', choices: [{ label: 'At night', emoji: '🌙' }, { label: 'At noon', emoji: '🕛' }, { label: 'In the rain', emoji: '🌧️' }], answer: 0,
      hint: 'When the sky is dark, its light shows best.' },
    { prompt: 'Which of these flies in the sky?', choices: [{ label: 'Bird', emoji: '🐦' }, { label: 'Fish', emoji: '🐟' }, { label: 'Cow', emoji: '🐄' }], answer: 0,
      hint: 'It has feathers and wings.' },
  ],
};

export function quizFor(topicId) {
  return QUIZZES[topicId] ?? null;
}

export const QUIZ_TOPIC_IDS = Object.keys(QUIZZES);
