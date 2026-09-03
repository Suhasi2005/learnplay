# LearnPlay

A React Native learning-games app for young kids. A parent picks a grade and subject, then the child plays a mini-game that teaches the topic — no worksheets, no typing, just tapping and hearing.

## What's built (v1)
**Junior KG**, two fully playable games sharing one game engine:

- **English → Learn ABC** — a big letter appears, spoken aloud ("Find the picture that starts with A"), tap the matching picture out of four
- **Math → Count to 10** — a number appears, tap the picture-group with the matching count out of four
- Fun animated landing page (floating clouds/stars, a mute toggle) → grade picker → subject picker → game picker, each a real screen (not a mockup)
- **Real feedback on every answer:** correct taps trigger a confetti burst, a success haptic buzz, a pop-and-scale celebration animation, and the answer spoken aloud; wrong taps shake, buzz differently, and ask them to try again
- **Streak tracking** — 2+ correct in a row shows a "🔥 N in a row!" badge; a miss resets it
- **Adaptive hints** — after 2 wrong taps on the same round, the correct answer starts gently glowing
- **Progress is remembered per game** — closing the app mid-alphabet (or mid-count) and reopening it offers "Continue" or "Start Over" on the topic screen, independently for each game
- A trophy celebration screen at the end of either game, with a two-cannon confetti finale and a "Play Again" option

Other grades (Senior KG, Grade 1) and other topics (Rhyme Time, Sight Words, Fractions Fun, Shapes, Color Match) are shown as **"Coming Soon"** cards — visible on purpose, so the growth path is obvious, but not faked as working.

## Why it's built this way
- **One game engine, two games** — `AlphabetGameScreen.js` and `NumberGameScreen.js` share the exact same pattern (round data → shuffle distractors → animated feedback → streak/hint/confetti/progress-save), proven out by building the second game as a near-mirror of the first rather than a one-off. `storage.js`'s progress functions are scoped by a `gameId` so both games persist independently without stepping on each other.
- **No backend, no images to license** — every "picture" is an emoji, which is crisp at any size, free to use, and instantly recognizable to a 4-year-old (🍎 reads as "apple" faster than most stock photos would).
- **Speech, not just text** — `expo-speech` reads prompts and answers aloud, since the target user often can't read yet. This is the actual point of the app, not a nice-to-have. A mute toggle (top-right of the landing page) turns it off for quiet environments, persisted across sessions.
- **Distractor options are randomized per round** (`src/gameData.js`, `src/numberGameData.js`, sharing a `shuffle` helper in `src/utils.js`) — pulled from the rest of the set and shuffled, so replaying doesn't just mean memorizing button positions.
- **Real animations, not CSS transitions** — built with React Native's `Animated` API directly (a bouncy press on every button, a shake on a wrong answer, a pop-and-scale on a correct one, a spinning trophy, floating landing-page decorations) to make it feel like a game, not a form.
- **Haptics + confetti as real feedback, not decoration** — `expo-haptics` fires a distinct pulse for right vs. wrong so the feel of an answer doesn't depend on looking at the screen, and `react-native-confetti-cannon` gives correct answers a payoff that matches the celebration text.

## A note on QA
This app went through an actual bug-fixing pass, not just a features pass. Worth knowing what was found and fixed, since it's evidence of the process, not just the output:
- **Speech/timers could outlive their screen** — if a child answered correctly and then immediately backed out before the 1.4s advance-timer fired, the app would still try to update state and navigate on an unmounted screen. Fixed with a mount-tracking ref that cancels pending timers and speech on unmount, in both game screens.
- **Rapid-tapping could overlap answers** — nothing stopped a fast double-tap from firing two answers (and two overlapping speech calls) before the first one's animation finished. Fixed with an explicit `isProcessing` lock during the correct-answer sequence.
- **Status bar icons were invisible on light screens** — one global `light` status bar style was set for the whole app, which is correct on the blue/orange gradient screens but made the icons nearly invisible on the cream-colored game screens. Fixed by letting each screen set its own bar style.
- **Back button was inconsistent with the hardware back button** — the in-game back button jumped straight to the home screen while Android's hardware back button would only go back one screen, so the two didn't agree. Fixed by making both do the same thing.

## Tech Stack
React Native, Expo, React Navigation, `expo-speech`, `expo-haptics`, `expo-linear-gradient`, `react-native-confetti-cannon`, `@react-native-async-storage/async-storage`, Google Fonts (Fredoka + Baloo 2) via `@expo-google-fonts`

## Run
```bash
npm install
npx expo start
```
Press `a` for Android emulator, `i` for iOS simulator, or scan the QR code with Expo Go on a phone. No backend, no API key, no setup beyond `npm install`.

## Project structure
```
src/
  gameData.js               # the 26-letter dataset + round-builder for Learn ABC
  numberGameData.js          # the 1-10 dataset + round-builder for Count to 10
  utils.js                   # shared shuffle() used by both game data files
  storage.js                 # AsyncStorage-backed progress (per gameId) + sound-setting persistence
  theme.js                   # colors, spacing, fonts — the whole app's design system in one file
  context/
    SoundContext.js           # app-wide mute toggle + a speak() that respects it
  components/
    BouncyButton.js           # shared tap animation used by every button in the app
    BackButton.js
    StreakBadge.js
  screens/
    WelcomeScreen.js
    GradeSelectScreen.js
    SubjectSelectScreen.js
    TopicSelectScreen.js       # subject-aware topic list + per-topic "Continue where you left off"
    AlphabetGameScreen.js       # Learn ABC
    NumberGameScreen.js         # Count to 10
    CompletionScreen.js         # generalized via route params (title/subtitle/replayScreen/gameId)
```

## Roadmap
Next up (not built yet, deliberately): real bundled sound effects (a chime/buzz, distinct from the spoken-word feedback — held off on this because it needs licensed or self-recorded audio assets, not something to fake); a Fractions Fun topic under Math (visual "split the pizza" style interaction); and Senior KG / Grade 1 content, which the two-games-on-one-engine pattern here is meant to make straightforward.
