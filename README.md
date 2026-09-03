# LearnPlay

A React Native learning-games app for young kids. A parent picks a grade and subject, then the child plays a mini-game that teaches the topic — no worksheets, no typing, just tapping and hearing.

## What's built (v1)
**Junior KG → English → Learn ABC**, fully playable end to end:
- Fun animated landing page → grade picker → subject picker → game picker, each a real screen (not a mockup)
- **The game itself:** a big letter appears, spoken aloud ("Find the picture that starts with A"), and the child taps one of four pictures — the correct one plays a celebration animation and speaks the answer ("Yes! A is for Apple!"); a wrong one gently shakes and asks them to try again
- All 26 letters, a progress dial of dots across the top, and a star count
- A trophy celebration screen at the end with a "Play Again" option

Other grades (Senior KG, Grade 1) and other subjects (Math, Colors) are shown as **"Coming Soon"** cards on their selection screens — visible on purpose, so the growth path is obvious, but not faked as working.

## Why it's built this way
- **No backend, no images to license** — every "picture" is an emoji, which is crisp at any size, free to use, and instantly recognizable to a 4-year-old (🍎 reads as "apple" faster than most stock photos would).
- **Speech, not just text** — `expo-speech` reads prompts and answers aloud, since the target user often can't read yet. This is the actual point of the app, not a nice-to-have.
- **Distractor options are randomized per round** (`src/gameData.js`) — pulled from the rest of the alphabet and shuffled, so replaying doesn't just mean memorizing button positions.
- **Real animations, not CSS transitions** — built with React Native's `Animated` API directly (a bouncy press on every button, a shake on a wrong answer, a pop-and-scale on a correct one, a spinning trophy) to make it feel like a game, not a form.

## Tech Stack
React Native, Expo, React Navigation, `expo-speech`, `expo-linear-gradient`, Google Fonts (Fredoka + Baloo 2) via `@expo-google-fonts`

## Run
```bash
npm install
npx expo start
```
Press `a` for Android emulator, `i` for iOS simulator, or scan the QR code with Expo Go on a phone. No backend, no API key, no setup beyond `npm install`.

## Project structure
```
src/
  gameData.js              # the 26-letter dataset + round-builder (shuffling/distractors)
  theme.js                 # colors, spacing, fonts — the whole app's design system in one file
  components/
    BouncyButton.js         # shared tap animation used by every button in the app
    BackButton.js
  screens/
    WelcomeScreen.js
    GradeSelectScreen.js
    SubjectSelectScreen.js
    TopicSelectScreen.js
    AlphabetGameScreen.js    # the actual game
    CompletionScreen.js
```

## Roadmap
Next up (not built yet, deliberately): a Math subject starting with a fractions mini-game (visual "split the pizza" style interaction), and Senior KG / Grade 1 content once the game-engine pattern here (round data → shuffle → animated feedback) is proven out on a second subject.
