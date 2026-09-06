# Artwork guide

Every file below already exists as a placeholder, so the app builds and runs
right now. **To add real art, overwrite the file at the same path with the same
name.** Nothing in the code needs to change — not even the manifest.

Placeholders are obvious on purpose: flat gradients with diagonal stripes for
worlds, a plain purple blob for the character. If you see stripes, that slot is
still empty.

---

## 1. The character — 6 poses

`assets/game/characters/hero-<pose>.png`

| File | When it shows |
|---|---|
| `hero-idle.png` | Resting; the default |
| `hero-happy.png` | Greeting on the home screen |
| `hero-cheer.png` | Correct answer, reward screen |
| `hero-think.png` | Waiting for an answer |
| `hero-oops.png` | Wrong answer — sympathetic, never scolding |
| `hero-point.png` | Pointing at what to tap next |

**Format:** PNG with a **transparent background**, 600 × 800, character facing
slightly right, full body, feet near the bottom edge.

**The one rule that matters: it must be the same character in all six.**
Generate a single character once, then ask for pose variations of *that*
character. Six unrelated cute animals will look broken, and it's the single
most common way this goes wrong.

Suggested workflow: generate `idle` first and get it right. Then for each other
pose, feed that image back in and ask for the same character in the new pose.

**Starter prompt** (edit the creature to taste):

> A friendly cartoon owl character for a children's mobile game, full body,
> standing, facing slightly right, big expressive eyes, soft rounded shapes,
> warm purple and cream colours, polished 2.5D game illustration with soft
> shadows and gentle highlights, clean silhouette, transparent background,
> centred, no text, no logo

Then per pose, append one of:

- `idle` — calm, relaxed, arms at sides
- `happy` — smiling warmly, one hand waving
- `cheer` — jumping with both arms up, eyes closed with joy, celebrating
- `think` — one hand on chin, looking up, curious
- `oops` — small apologetic shrug, gentle confused smile, kind expression
- `point` — pointing forward and to the right with one arm, encouraging

**Removing backgrounds:** if your tool won't produce transparency, use
remove.bg or Photopea. A leftover white box behind the character is very
visible against the world art.

---

## 2. World backgrounds — 5 scenes

`assets/game/worlds/<world>.png`

| File | World | Used for |
|---|---|---|
| `home.png` | Home | The home screen |
| `forest.png` | Whispering Woods | English |
| `farm.png` | Sunny Meadow | World Around Us |
| `space.png` | Star Harbour | Math |
| `ocean.png` | Coral Cove | Spare — not wired to a subject yet |

**Format:** PNG, **1080 × 1920** (portrait), full-bleed, no transparency.

**Compose for UI.** This is the part that's easy to get wrong: keep the
**centre and lower third relatively calm and uncluttered**. That's where
buttons, cards and the character sit. Put the interesting detail — canopy,
mountains, planets — in the **upper third**. A gorgeous background with a busy
middle makes the whole screen unreadable.

**Starter prompt:**

> A children's storybook illustration of a magical forest, tall friendly trees,
> soft rolling hills, small flowers, warm sunlight filtering through leaves,
> gentle atmospheric depth, soft shadows, vertical portrait composition,
> uncluttered open space in the lower half, polished 2.5D game art,
> no characters, no text, no UI

Swap the scene for the others:

- **farm** — rolling fields, red barn, windmill, haystacks, blue sky, fluffy clouds
- **space** — deep violet space, planets with rings, distant stars, soft nebula glow
- **ocean** — underwater, coral, seaweed, drifting bubbles, light rays from above
- **home** — a warm cosy hilltop at golden hour, a winding path leading away

---

## 3. Checks before you drop files in

- Correct **file name** and **folder** — the code looks for exact names
- Character PNGs actually **transparent** (open one; no white box)
- Backgrounds are **1080 × 1920 portrait**, not landscape or square
- Each file under ~600 KB; these ship inside the app and the web build
- Same character across all six poses
- **Commercial-use terms** of whatever tool generated them are OK for a
  portfolio project you'll show publicly

---

## 4. Adding a new world later

1. Drop `assets/game/worlds/<name>.png`
2. Add an entry to `WORLDS` in `src/gameAssets.js` (copy an existing one)
3. Point a subject at it in `WORLD_BY_SUBJECT`, or add it to `WORLD_ORDER`

`scrim` in that entry is how much dark wash sits under the UI (0–1). Raise it
if text looks hard to read on your art; lower it if the world looks muddy.
`onImage` says whether that world's loose text runs light or dark.
