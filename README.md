# LearnPlay

A React Native learning-games app for young kids. A parent picks a grade and subject, then the child plays a mini-game that teaches the topic — no worksheets, no typing, just tapping and hearing.

## What's built

**9 fully playable games across all 3 grades**, each with a genuinely different mechanic — this is not the same game reskinned nine times:

| Grade | Subject | Game | Mechanic |
|---|---|---|---|
| Junior KG | English | Learn ABC | Tap the picture matching the letter shown |
| Junior KG | Math | Count to 10 | Tap the picture-group with the matching count |
| Junior KG | Math | Shape Sort | Tap a shape, then tap the bin it belongs in — categorization, not multiple-choice |
| Junior KG | World Around Us | Stop or Go | A traffic light appears with a live countdown bar — tap the right action before time runs out |
| Senior KG | Math | Opposites Match | Tap two cards that go together — memory-style pairing |
| Senior KG | Math | Odd One Out | 4 tiles, 3 match, 1 doesn't — no verbal prompt at all, purely visual scanning |
| Grade 1 | Math | Add It Up | An animated equation builds on screen (🍎🍎 + 🍎), then tap the correct sum |
| Grade 1 | Math | What Comes Next? | A pattern plays out (🍎🍊🍎🍊🍎?) — tap what continues it |
| Grade 1 | Math | Bigger or Smaller | Two objects side by side at different sizes — tap the one asked for (binary choice, not 4 options) |

Every other topic — 51 of them — is real, researched curriculum content shown as an honest **"Coming Soon"** card, not invented filler. `src/curriculum.js` is the single source of truth the whole app (grade unlocking, subject unlocking, topic lists) reads from — mark a topic `playable` there and it's live everywhere at once.

**Shared across every game:**
- Confetti burst + haptic buzz + spoken feedback on every answer, right or wrong
- Streak badges, and per-game progress saved locally (each game remembers its own "Continue" point)
- A trophy celebration screen at the end, generalized to any game via route params

## Premium UI
- Every selection screen sits on a soft warm gradient instead of a flat fill, with cards fading and scaling in with a staggered spring animation on load
- Grade/subject/topic availability is *derived* from the curriculum data (`isGradeAvailable`, `isSubjectAvailable`) instead of hardcoded booleans that could drift out of sync with what's actually built

## Why it's built this way
- **One game engine, many games** — every game screen shares the same shape (round/level data → shuffle → animated feedback → streak/confetti/progress-save), which is what made building 5 more games in this pass mostly a matter of writing new data files and swapping the interaction, not re-solving the same problems each time. `storage.js`'s progress functions are scoped by topic ID so every game persists independently.
- **Genuinely different mechanics, chosen on purpose:**
  - *Shape Sort* is a 2-step tap (pick item, pick bin) — categorization, not "spot the match"
  - *Stop or Go* is the only game with a real clock — an `Animated.timing` countdown that actually gates the correct answer, not a decorative bar
  - *Odd One Out* is the only game with **no spoken prompt content** — visual scanning has to work without a hint from language
  - *What Comes Next?* is a sequence-extrapolation task, not a lookup
  - *Bigger or Smaller* is binary (2 options), not 4 — comparison is a different cognitive task than "pick the match"
- **No backend, no images to license** — every "picture" is an emoji, crisp at any size, free to use, and instantly recognizable to a young child.
- **Speech, not just text** — `expo-speech` reads every prompt and answer aloud. A mute toggle (top-right of the landing page) persists across sessions.
- **Curriculum content is researched, not invented** — all 60 topics come from real Indian LKG/UKG preschool curricula and CBSE's NCERT "Mridang" (English) and "Joyful Mathematics" (Math) textbooks for Class 1.

## A note on QA
This app went through actual bug-fixing passes, not just feature passes:
- **Speech/timers could outlive their screen** — backing out right after a correct answer could try to update state on an unmounted screen. Fixed with a mount-tracking ref that cancels pending timers, animations, and speech on unmount, in every game screen.
- **Rapid-tapping could overlap answers** — a fast double-tap could fire two answers before the first animation finished. Fixed with an `isProcessing` lock during the correct-answer sequence.
- **Status bar icons were invisible on light screens** — fixed per-screen instead of one global style.
- **Back button disagreed with the hardware back button** — fixed to behave the same.
- **Opposites Match: rapid tapping during the "wrong" shake could compare a new tap against an already-shaking stale card** — fixed by clearing the selection immediately on a mismatch instead of only after the shake animation finishes.
- **Stop or Go's timer needed explicit lifecycle handling** — stopping the countdown animation early (on a correct answer) fires its completion callback with `finished: false`; the timeout handler only fires on `finished: true`, so answering correctly can never accidentally trigger a "too slow" penalty on top of the win. Verified by reading through Animated's stop/completion contract, not just assumed.
- Full codebase re-linted (`oxlint`) after this round — zero warnings.

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
  curriculum.js               # single source of truth: every grade/subject/topic, which ones are playable
  gameData.js                  # Learn ABC
  numberGameData.js             # Count to 10
  oppositesData.js               # Opposites Match
  addItUpData.js                  # Add It Up
  shapesData.js                    # Shape Sort
  trafficData.js                    # Stop or Go
  patternsData.js                    # What Comes Next?
  measurementData.js                  # Bigger or Smaller
  oddOneOutData.js                     # Odd One Out
  utils.js                              # shared shuffle() used by every game data file
  storage.js                             # AsyncStorage-backed progress (per topic ID) + sound-setting persistence
  theme.js                                # colors, spacing, fonts, gradients — the whole design system in one file
  context/
    SoundContext.js                       # app-wide mute toggle + a speak() that respects it
  components/
    BouncyButton.js                        # shared tap animation used by every button in the app
    BackButton.js
    StreakBadge.js
    FadeInCard.js                           # staggered entrance animation for selection-screen cards
  screens/
    WelcomeScreen.js
    GradeSelectScreen.js / SubjectSelectScreen.js / TopicSelectScreen.js   # all derived from curriculum.js
    AlphabetGameScreen.js / NumberGameScreen.js / OppositesMatchScreen.js /
    AddItUpScreen.js / ShapeSortScreen.js / StopOrGoScreen.js /
    WhatComesNextScreen.js / BiggerOrSmallerScreen.js / OddOneOutScreen.js
    CompletionScreen.js                                                    # generalized via route params
```

## Roadmap
9 of 60 researched topics are playable. Deliberately not built yet: real bundled sound effects distinct from the spoken-word feedback (needs licensed or self-recorded audio, not something to fake); any drag-and-drop interaction (the one style in this app that can't be verified correct without a physical device — everything shipped so far uses tap input, which is safe to reason about from code alone). Next batch of topics should keep prioritizing new *kinds* of interaction over repeating the nine mechanics already proven here.
