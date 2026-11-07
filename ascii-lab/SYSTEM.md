# Partitive: the ASCII and gradient system for BU Proto

For the Builders team. Measured on one Mac in headless Chrome. No phone or real GPU tested.

## The direction

**No colour is ever blended. The gradient exists only in the eye.** Every cell holds two pure palette stops: a flat tile of one, and a glyph of its ladder neighbour. The glyph's measured ink coverage sets the mix. Up close it is type. From across the room it is a soft gradient.

- `r3/4d.html`: live hero candidate. Drifting mushroom, one WebGL2 draw call, roaming lens.
- `r3/4c.html`: the mark. A drawn mushroom sign in the same material.
- `r3/4b.html`: print. Square poster and die-cut sticker.

The lens shows the same cells blurred, as your eye does at distance.

Claim carefully. Two-colour shaded cells are old textmode practice. What we did not find is that method, palette-locked and rose-led on navy, used as a brand system. Soft Syntax and UX Pilot page text could not be read, so say "not found", never "never seen".

## Methodology

104 experiments, judged by eye on contact sheets, with no outside viewers.

1. **r1, 44 pieces:** 11 methods across 4 subjects (mushroom, gills, tides, field).
2. **r2, 40 pieces:** 8 parents, 5 mutations each: push pink, change glyphs, moving light, luminous depth, strip back.
3. **r3, 20 pieces:** 5 parents, each as hero, poster and sticker, sign, and performance pass.

The partitive line best survived leaving the hero.

## Colour rules

A cell may only use two adjacent rungs.

| Rung | Stop | Contrast to next |
|---|---|---|
| 0 | harbor `#061a2e` | 1.20 |
| 1 | raised `#0b2a46` | 1.25 |
| 2 | raised-hi `#123a5c` | 2.88 |
| 3 | iris deep `#7a6ee0` | 1.19 |
| 4 | raspberry `#c2407a` | 2.50 |
| 5 | rose `#f4a2c0` | 1.14 |
| 6 | peach `#f8928a` | 2.13 |
| 7 | frost `#f6fbff` | end |

- **Cool variant:** rung 4 becomes iris `#b6aaff` where hint < 0.3 and 0.3 < s < 0.55.
- **Position:** `s = tone^1.1 × (0.8 + 0.4 × hint) + 0.06 × edge × tone`, with `tone = min(1, 1.1 × L)`. Below L 0.12 it fades to harbor.
- **Rungs 2-3, 4-5 and 6-7 carry glyph shape.** The others read as texture.
- **Frost is blow-out only:** 1.3% of 4d's frame.
- **Mint means live:** one `*` on a harbor tile, hopping every 2.9s.
- **Copy:** frost on raised-hi or darker (11.3:1), or harbor on rose (9.0:1). Frost fails on rose (1.9:1).

## Glyph rules

- **Set:** `space . , : ; - = + * / \ | x o O # % @ 8`, plus a solid block.
- **Cell:** square, `max(8, ceil(max(W, H) / 170))` px. Weight 700, squashed to the cell.
- **Select by measured coverage:** render, count ink, normalise, bake a 256-step lookup. Never hand-order the ramp.
- **Mix ratio** is the fraction between rungs, plus Bayer 4×4 at ±0.06.
- **Line bias:** on edges (E > 0.3, L > 0.45), `/ \ | - x` get a 0.07 bonus.

## Motion rules

Slow light, not animation. Time runs at half real speed.

- **Subject:** tilt ±0.018 rad on a 40s cycle, slow glow and cloud drift. Cells update at 20Hz.
- **Lens:** radius 0.2 × min(W, H), 60s and 74s path periods, redrawn every frame. A pointer takes it over.
- **Governor:** over 90 frames, step down if p95 > max(24ms, 1.6 × median) or median > 20ms. Tiers: DPR 2, 1.5, 1, 1 at 20, 20, 12, 8Hz, then a still.
- **Reduced motion:** one still at t = 6, lens parked at 27%, 34%.

CPU update for 4d: 2.0ms at 1440×900, 0.7ms at 390×844. The software WebGL draw figure (0.006ms) is not credible, so GPU cost is unmeasured. The lens is the risk: 25 taps per pixel.

## Replacing the current hero

`AsciiField` mounts once in `Layout.tsx`, tuned per route through `GROUNDS`. It tints glyphs from a 48×30 colormap, with a fluid cursor trail and a `data-fog-clear` mask around copy.

Proposed, unbuilt:

1. Add a partitive renderer behind `AsciiField`, for the home ground only. Port 4d's cell records, atlas, shader and governor.
2. Keep `Hero.tsx` with copy at the foot, where the frame is already dark.
3. Reuse the `data-fog-clear` mask to clamp cells under copy to rung 2 or below. 4a's CSS gradient scrim blends colours, breaks the rule and dims the cap.
4. Keep the lens clear of the headline. Decide whether the lens replaces the cursor trail.
5. Align tokens. Site `--iris` is `#ab9dff`, the lab uses `#b6aaff`. Peach is not in `index.css`. The site's JetBrains Mono changes the coverage bake, so re-judge the look.
6. Ship the still frame first, as first paint and fallback.

Other pages keep the tinted field for now. Two looks on one site needs a decision.

## Tried and rejected

My reading.

**r1**
- **Reflected arc, hue arc:** tinted glyphs alone looked like the default.
- **Polarity:** thin at hero scale.
- **Two planes with fog:** muddy.
- **Quadtree:** clever, but busy.
- **Riso misregistration:** vibrated and drifted grey.

**r2**
- **Gill engravings:** beautiful detail, no silhouette.
- **Gill cutouts:** flat, little depth.
- **Giant cut glyphs:** loud, and the plain gradient does the work.
- **Eclipse:** read as a tree or cloud.
- **Gill bloom:** generic glow.
- **Blue-led partitive:** lovely, but leaves the unclaimed rose.

**r3**
- **Dissolving mushroom:** runner-up, but falls apart small.
- **Blue partitive:** cohesive, less ownable. Safest fallback.
- **Quiet engraving:** elegant, barely a subject.
- **Rose field, segment glyphs:** best abstract piece, but the sign fails. A candidate for non-hero pages.

**Not tried:** no experiment is titled for thin-light raymarching, draining film, hue sort, overstrike ribbon or mycelium, all from the research notes.

## Weaknesses

- **The hero is less rose-led than claimed.** Nearest-stop pixel share in 4d's capture: iris deep 15.9%, raspberry 10.9%, rose plus peach 7.3%. Its largest colour is the crowded violet the brief warned about. 4c does better: rose plus peach 7.8%, iris deep 2.5%. Remap 4d's halo toward raspberry.
- **Size meaning is gone.** Sky is not on the ladder, so small, medium and big have no expression. 4c's comment promises a lagoon-sky rim its code does not draw.
- **Phones are unsolved.** At 390×844, 4d cuts off the cap and the stem looks broken. 4c clips the cap and ring. Portrait needs framing.
- **4b and 4c are slow.** Per-cell `fillText`, no governor. Treat them as still sources. 4b's "tight crop" sticker is the whole field.
- **The lens can read as a glass ball,** and shows little over dark ground.
- **Likely bugs in 4d, from reading the code:** if the shader fails after the context is created, the 2D fallback gets no context and paints nothing. `pointerleave` is bound to `window`, so the lens may never return to its path.
- **System fonts change coverage.** Bundle one font.
- **It is busy.** Close up it is dense noise, and repeat-visit fatigue is untested.
