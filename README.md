# LearnPlay

A React Native learning-games app for young kids. A parent picks a grade and subject, then the child plays a mini-game that teaches the topic — no worksheets, no typing, just tapping and hearing.

## What's built

**4 fully playable games across all 3 grades**, each with a genuinely different mechanic — this isn't the same game reskinned four times:

| Grade | Subject | Game | Mechanic |
|---|---|---|---|
| Junior KG | English | Learn ABC | Tap the picture matching the letter shown |
| Junior KG | Math | Count to 10 | Tap the picture-group with the matching count |
| Senior KG | Math | Opposites Match | Tap two cards that go together (memory-style pairing, not multiple-choice) |
| Grade 1 | Math | Add It Up | An animated equation builds on screen (🍎🍎 + 🍎), then tap the correct sum |

Every other topic — 56 of them — is real, researched curriculum content shown as an honest **"Coming Soon"** card, not invented filler. See `src/curriculum.js`, the single source of truth the whole app (grade unlocking, subject unlocking, topic lists) reads from.

**Shared across every game:**
- Confetti burst + haptic buzz + spoken feedback on every answer, right or wrong
- Streak badges, adaptive hints after 2 wrong tries, and per-game progress saved locally (each game remembers its own "Continue" point)
- A trophy celebration screen at the end, generalized to any game via route params

## Premium UI pass
- Every selection screen (grade/subject/topic) now sits on a soft warm gradient instead of a flat fill, with cards fading and scaling in with a staggered spring animation on load
- Grade/subject/topic availability is now *derived* from the curriculum data (`isGradeAvailable`, `isSubjectAvailable`) instead of separately hardcoded booleans that could drift out of sync with what's actually built

## Why it's built this way
- **One game engine, four games** — every game screen shares the same shape (round/level data → shuffle → animated feedback → streak/hint/confetti/progress-save), proven out by building three more games as variations on the first rather than one-offs. `storage.js`'s progress functions are scoped by topic ID so every game persists independently.
- **Genuinely different mechanics, not reskins** — Opposites Match uses a select-two-and-compare loop (different game *logic*, not just different content) because a topic like opposites is naturally about relationships between things, not picking one right answer. Add It Up visually builds the equation with real object clusters before asking the question, because addition is the first topic in this set that's actually abstract for a 6-year-old — the animation exists to make the abstraction concrete, not just for polish.
- **No backend, no images to license** — every "picture" is an emoji, crisp at any size, free to use, and instantly recognizable to a young child.
- **Speech, not just text** — `expo-speech` reads every prompt and answer aloud, since the target user often can't read yet. A mute toggle (top-right of the landing page) persists across sessions.
- **Curriculum content is researched, not invented** — all 60 topics come from real Indian LKG/UKG preschool curricula and CBSE's NCERT "Mridang" (English) and "Joyful Mathematics" (Math) textbooks for Class 1, not guessed at.

## A note on QA
This app went through actual bug-fixing passes, not just feature passes. Worth knowing what was found and fixed:
- **Speech/timers could outlive their screen** — backing out right after a correct answer could try to update state on an unmounted screen. Fixed with a mount-tracking ref that cancels pending timers and speech on unmount, in every game screen.
- **Rapid-tapping could overlap answers** — a fast double-tap could fire two answers before the first animation finished. Fixed with an `isProcessing` lock during the correct-answer sequence.
- **Status bar icons were invisible on light screens** — one global style didn't suit both the gradient and cream screens. Fixed per-screen.
- **Back button disagreed with the hardware back button** — fixed to behave the same.
- **Opposites Match: rapid tapping during the "wrong" shake could compare a new tap against an already-shaking stale card** — found while reasoning through the pairing logic (a bug class the tap-one-of-four games don't have, since pairing games hold onto a "first pick" across two taps). Fixed by clearing the selection immediately on a mismatch instead of only after the shake animation finishes.

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
  gameData.js                  # Learn ABC dataset + round-builder
  numberGameData.js             # Count to 10 dataset + round-builder
  oppositesData.js               # Opposites Match dataset + level-builder
  addItUpData.js                  # Add It Up problem set + round-builder
  utils.js                         # shared shuffle() used by every game data file
  storage.js                        # AsyncStorage-backed progress (per topic ID) + sound-setting persistence
  theme.js                           # colors, spacing, fonts, gradients — the whole design system in one file
  context/
    SoundContext.js                   # app-wide mute toggle + a speak() that respects it
  components/
    BouncyButton.js                    # shared tap animation used by every button in the app
    BackButton.js
    StreakBadge.js
    FadeInCard.js                       # staggered entrance animation for selection-screen cards
  screens/
    WelcomeScreen.js
    GradeSelectScreen.js                 # availability derived from curriculum.js
    SubjectSelectScreen.js                # same
    TopicSelectScreen.js                   # renders CURRICULUM[grade][subject] directly
    AlphabetGameScreen.js                   # Learn ABC
    NumberGameScreen.js                      # Count to 10
    OppositesMatchScreen.js                   # Opposites Match
    AddItUpScreen.js                           # Add It Up
    CompletionScreen.js                         # generalized via route params
```

## Roadmap
Next up (not built yet, deliberately): real bundled sound effects distinct from the spoken-word feedback (held off — needs licensed or self-recorded audio, not something to fake); Shapes as a drag-and-drop game (held off for now specifically because a real drag gesture is the one interaction style in this app I can't verify works correctly without a physical device to test on — everything shipped so far uses tap input, which is safe to reason about from code); and working through the remaining 56 researched-but-not-built topics, prioritizing whichever ones need a new *kind* of interaction rather than duplicating the four already-proven mechanics.
