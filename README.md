# LearnPlay

A React Native learning-games app for young kids. A parent picks a grade and subject, then the child plays a mini-game that teaches the topic — no worksheets, no typing, just tapping and hearing.

## What's built

**19 fully playable games across all 3 grades.** Not the same game reskinned nineteen times — a genuine spread of mechanics:

| Grade | Subject | Game | Mechanic |
|---|---|---|---|
| Junior KG | English | Learn ABC | Tap the picture matching the letter shown |
| Junior KG | Math | Count to 10 | Tap the picture-group with the matching count |
| Junior KG | Math | Shape Sort | Tap a shape, then tap the bin it belongs in — categorization |
| Junior KG | World Around Us | Stop or Go | A live countdown bar — tap the right action before time runs out |
| Junior KG | World Around Us | Living or Not? | Sort each thing into a Living / Not Living bin |
| Junior KG | World Around Us | Who Uses This? | Shown a tool, tap the helper who uses it |
| Junior KG | World Around Us | Point to the... | Shown a body-part name, tap the matching icon |
| Senior KG | Math | Opposites Match | Tap two cards that go together — memory-style pairing |
| Senior KG | Math | Odd One Out | 4 tiles, 3 match, 1 doesn't — no verbal prompt at all |
| Senior KG | Math | What Time Is It? | A real custom-built analog clock face — read it, then tap the digital time |
| Senior KG | Math | Make the Amount | Tap coins repeatedly to build a target total, then confirm — the only accumulation-based game |
| Senior KG | World Around Us | Dress for the Season | Shown a season, tap the right thing to wear |
| Senior KG | World Around Us | Who Says That? | Shown a sound word ("Moo!"), tap the animal that makes it |
| Grade 1 | Math | Add It Up | An animated equation builds on screen (🍎🍎 + 🍎), tap the sum |
| Grade 1 | Math | What Comes Next? | A pattern plays out (🍎🍊🍎🍊🍎?) — tap what continues it |
| Grade 1 | Math | Bigger or Smaller | Two objects at different sizes — tap the one asked for (binary, not 4-option) |
| Grade 1 | Math | Groups Of | Visual repeated-groups (3 groups of 2 🍪) — tap the total, introducing multiplication as repeated addition |
| Grade 1 | Math | Read the Chart | A pictograph across 3 categories — tap the one with the most/fewest |
| Grade 1 | Math | Number Line Gap | A 5-number sequence with a gap *in the middle* — tap what's missing |

Every other topic — 41 of them — is real, researched curriculum content shown as an honest **"Coming Soon"** card, not invented filler. `src/curriculum.js` is the single source of truth the whole app (grade unlocking, subject unlocking, topic lists) reads from — mark a topic `playable` there and it's live everywhere at once.

**Shared across every game:**
- Confetti burst + haptic buzz + spoken feedback on every answer, right or wrong
- Streak badges, and per-game progress saved locally (each game remembers its own "Continue" point)
- A trophy celebration screen at the end, generalized to any game via route params

## Premium UI
- Every selection screen sits on a soft warm gradient instead of a flat fill, with cards fading and scaling in with a staggered spring animation on load
- Grade/subject/topic availability is *derived* from the curriculum data (`isGradeAvailable`, `isSubjectAvailable`) instead of hardcoded booleans that could drift out of sync with what's actually built
- A real analog clock face built from plain `View`s (no charting/clock library) — two rotated "hand" elements pivoting around the clock's exact center

## Why it's built this way
- **One game engine, many games** — every game screen shares the same shape (round/level data → shuffle → animated feedback → streak/confetti/progress-save). Adding 15 more games after the first 4 was mostly a matter of writing a new data file and swapping the interaction, not re-solving the same problems each time. `storage.js`'s progress functions are scoped by topic ID so every game persists independently.
- **Genuinely different mechanics, chosen on purpose** — a sample: *Shape Sort*/*Living or Not?* are 2-step categorization (pick item, pick bin), not "spot the match". *Stop or Go* is the only game with a real clock — an `Animated.timing` countdown that actually gates the correct answer. *Odd One Out* has **no spoken prompt content** at all — visual scanning without a language hint. *Make the Amount* is the only accumulation game (tap repeatedly toward a target) rather than single-choice. *Number Line Gap* asks for a number *inside* a sequence, not at the end of one — a different task than prediction.
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
- **Stop or Go's timer needed explicit lifecycle handling** — stopping the countdown animation early (on a correct answer) fires its completion callback with `finished: false`; the timeout handler only fires on `finished: true`, so answering correctly can never accidentally trigger a "too slow" penalty on top of the win.
- **Number Line Gap's distractor pool was too small in some cases** — found by actually *executing* the round-generation logic in Node for every round rather than trusting hand-traced math: the initial ±2 neighbor range frequently overlapped the visible sequence itself, leaving as few as 1 valid wrong option where 3 were needed. Fixed by drawing from a wider ±5 band excluding the visible window, then re-verified programmatically across all 10 rounds, 3 times, to catch anything random-seed-dependent.
- **White option text failed WCAG contrast almost everywhere** — measured with the actual relative-luminance formula (not eyeballed): white text on the game's bright palette (sun/coral/grass/sky/grape) came out between 1.5:1 and 2.7:1 in every case, when WCAG AA requires at least 3:1 even for large bold text. This meant option buttons on 12+ screens, the streak badge, the Welcome screen hero, and the Completion screen were all under-contrast — a real legibility problem for the actual target user (a young child), not a nitpick. Fixed by switching option/label text to dark ink (which measures 4.5-8.5:1 on the same colors) everywhere except the two gradient hero screens, where a text shadow was used instead to preserve the bright-white celebratory look while restoring real legibility.
- **"Continue" could crash if progress was saved at the very last round** — a narrow race: if the app closed in the ~1.4s window between a game's final correct answer and the completion screen clearing that game's progress, the saved index could equal the round count exactly. Returning to the topic screen would then offer "Continue" straight into a round past the end of that game's data array. Fixed by giving every playable topic a `total` in `curriculum.js` (cross-verified programmatically against each game's actual data file, not hand-counted) and bounding the "Continue" check against it.
- **Money's "Make the Amount" had no way to fix one wrong coin** — overshooting the target left only a full Reset, which is a harsh penalty for one misplaced coin. Added tap-to-remove on individual placed coins.
- Full codebase re-linted (`oxlint`) after every round of new games — zero warnings, every time.

## Tech Stack
React Native, Expo, React Navigation, `react-native-svg`, `expo-speech`, `expo-audio`, `expo-haptics`, `expo-linear-gradient`, `react-native-confetti-cannon`, `@react-native-async-storage/async-storage`, Google Fonts (Fredoka + Baloo 2) via `@expo-google-fonts`

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
  utils.js                     # shared shuffle() used by every game data file
  storage.js                    # AsyncStorage-backed progress (per topic ID) + sound-setting persistence
  theme.js                       # colors, spacing, fonts, gradients — the whole design system in one file
  *Data.js                        # one small data/round-builder file per game (gameData, numberGameData,
                                    #  oppositesData, addItUpData, shapesData, trafficData, patternsData,
                                    #  measurementData, oddOneOutData, moneyData, timeData, multiplicationData,
                                    #  dataHandlingData, numberLineData, helpersData, bodyPartsData, livingData,
                                    #  seasonsData, animalSoundsData)
  soundEffects.js                  # the three bundled chimes, as reusable expo-audio players
  context/
    SoundContext.js                # app-wide mute toggle + speak()/playSuccess()/playWrong()/playComplete()
  components/
    Mascot.js                       # Pip — the SVG companion character, one shape across 5 moods
    GameButton.js                   # the chunky press-to-compress button
    SceneBackground.js              # drifting blob/sparkle world behind every screen
    StarRow.js / ProgressRing.js    # the reward + progress vocabulary
    BouncyButton.js                 # shared tap animation used inside the games
    BackButton.js / StreakBadge.js / FadeInCard.js / ClockFace.js
  screens/
    WelcomeScreen.js                                                       # home
    GradeSelectScreen.js / SubjectSelectScreen.js / TopicSelectScreen.js   # all derived from curriculum.js
    [19 game screens, one per game above]
    CompletionScreen.js                                                    # generalized via route params
    ParentGateScreen.js / ParentAreaScreen.js                              # the grown-up side
assets/
  sounds/                          # success.wav / wrong.wav / complete.wav — generated, see below
tools/
  generate-sounds.mjs              # regenerates those three files from scratch
```

## Design system
Everything visual resolves through `src/theme.js`, which is why a palette change restyles 19 games without editing 19 files.

**One brand hue, four semantic accents.** Grape carries identity and every primary action. The other four are assigned by *meaning*, not decoration — a subject keeps its colour on the map, in the level list and on the reward screen, so the association is learnable rather than random. Grape is deliberately excluded from the answer-card palette for two reasons at once: it's the brand colour and shouldn't appear as a random option tint, and it's the one accent dark enough that dark text fails on it (2.93:1, under the 3:1 floor). Every remaining pairing clears 5.3:1.

**Contrast is measured, not eyeballed.** The palette was checked by computing WCAG relative luminance for every text/surface pairing the app actually renders. That caught three real failures in the first draft — the secondary text colour at 3.81:1, the hero gradient's light end, and the grape card above — all fixed before anything shipped.

**Buttons compress.** `GameButton` draws a darker base with a lighter face floating above it; pressing drops the face into the base and it springs back. A flat rectangle that only changes opacity doesn't read as pressable to a five-year-old, and that one detail is most of the difference between "web page" and "game".

**Pip is drawn, not imported.** The companion character is SVG, so all five moods are the same creature with different eyes and mouth. That's what makes it read as one character reacting rather than a set of unrelated stickers — two emoji can't do it, because they're two different drawings by two different hands. Pip greets on the home screen, comments on the subject screen, cheers inside every game's success overlay, and celebrates on the reward screen.

**A parental gate guards the grown-up side.** It's a two-digit multiplication, deliberately outside everything the app teaches — its own maths games top out at adding single digits. It protects settings and progress-reset, so the bar is "a young child can't pass it by accident", not real security.

## Sound effects
Every game now plays a short chime on a right answer, a wrong answer, and a finished topic, layered under the existing spoken feedback. The blocker here was never the code — it was that shipping audio means shipping someone's licensed work, and a kids' app is a bad place to be vague about rights.

So the three clips are generated rather than sourced: a small Node script writes raw 16-bit PCM samples and a RIFF header directly to `.wav`, so `success.wav` is a two-note rising chime, `wrong.wav` a soft descending tone, and `complete.wav` a three-note fanfare. Together they're ~43KB and there is no attribution or licence question to answer, because nothing was copied from anywhere.

They route through the same `SoundContext` as speech, so the existing mute toggle silences all of it with one switch — a parent turning sound off gets an actually-silent app, not a quieter one. Playback failures are swallowed on purpose: a missed chime is cosmetic, and it should never take a game down with it.

## Roadmap
19 of 60 researched topics are playable. Still deliberately not built: any drag-and-drop interaction — the one style in this app that can't be verified correct without a physical device to test on, where everything shipped so far uses tap input, which is safe to reason about from code alone. Next batch of topics should keep prioritizing new *kinds* of interaction over repeating the mechanics already proven here.
