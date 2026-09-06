# Asset Licenses

Every externally sourced file shipped in this app, where it came from, and
under what terms. Nothing is used that isn't listed here.

**Summary: all external art is Kenney CC0 (public domain). Attribution is not
legally required; it is given below anyway because it costs nothing and is the
decent thing to do.**

Original upstream licence files are preserved in `assets/game/licenses/`.

---

## Packs used

| Pack | Source | License | Attribution required | Files shipped |
|---|---|---|---|---|
| Background Elements Remastered | [kenney.nl/assets/background-elements-remastered](https://kenney.nl/assets/background-elements-remastered) | CC0 1.0 | No | 32 |
| Animal Pack Redux (Round, outline) | [kenney.nl/assets/animal-pack-redux](https://kenney.nl/assets/animal-pack-redux) — mirrored via [series-ai/jam-ready-assets](https://github.com/series-ai/jam-ready-assets) | CC0 1.0 | No | 20 |

Both are by **Kenney** (<https://kenney.nl>), released under
[Creative Commons Zero 1.0](http://creativecommons.org/publicdomain/zero/1.0/).

---

## Files

### `assets/game/environments/backgrounds/` — sky plates
`backgroundColorGrass` · `backgroundColorForest` · `backgroundColorFall` · `backgroundColorDesert`
Used as the rearmost layer of each world scene.

### `assets/game/environments/terrain/` — parallax landform layers
`mountains` · `mountainA` · `mountainB` · `hills` · `hillsLarge` · `groundLayer1` · `groundLayer2`
Midground and foreground bands in `ParallaxWorld`.

### `assets/game/environments/sky/` — sky elements
`cloudLayer1` · `cloudLayer2` · `cloud1` · `cloud2` · `cloud3` · `sun` · `moonFull`
Drifting layers and single props.

### `assets/game/environments/foliage/` — plants
`tree` · `treePine` · `treePalm` · `treeSmall_green1..3` · `bush1..3`
Scattered as scene props.

### `assets/game/environments/props/` — structures
`house1` · `houseSmall1` · `fence` · `castleSmall` · `tower`
Landmarks on world scenes and the level trail.

### `assets/game/animals/` — animal sprites
`bear` `chick` `chicken` `cow` `dog` `duck` `elephant` `frog` `giraffe` `goat`
`horse` `monkey` `owl` `panda` `penguin` `pig` `rabbit` `parrot` `zebra` `snake`

From the **Round (outline)** variant specifically, because its outlines match
this app's own outlined-sticker components. Used for animal-topic games and as
world decoration.

---

## Deliberately NOT used

**Kenney UI Pack** — downloaded and inspected, then rejected. It's a
thin-bordered, muted interface kit that reads as a game-jam settings menu; this
app's controls are chunky, outlined and press-to-compress. Dropping it in would
have made the product look *worse* and less coherent, which is the trap of
picking an asset because it is free rather than because it fits.

**Kenney Nature Kit / Foliage Pack** — 3D models, incompatible with a 2D app.

---

## Assets that are NOT external

`assets/game/characters/hero-*.png` — the hero character. Custom, because the
hero defines the product's identity and must not look borrowed from a free
pack. Currently placeholder art; see `ASSETS.md`.

`assets/sounds/*.wav` — synthesized by `tools/generate-sounds.mjs`. Generated
maths, not a recording, so there is no rights question at all.

---

## Adding an asset later

1. Confirm the licence permits commercial use, and record it here before shipping.
2. Check it against what's already in — matching line weight, saturation,
   perspective and complexity. A technically valid PNG is not automatically a
   visually compatible one.
3. Copy only the files you need. Never a whole pack.
4. Keep the upstream licence file in `assets/game/licenses/`.
