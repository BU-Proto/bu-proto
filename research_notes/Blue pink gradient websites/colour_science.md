# Colour science and technique for dark-ground blue-to-pink gradient interfaces

Reading key. "Cited Findings" holds facts: either sourced, or tagged **[Computed]** / **[Tested]** (run for this note). "Inferences" holds judgement and opinion.

Method for **[Computed]** values: own Python implementation of the [Oklab matrices](https://bottosson.github.io/posts/oklab/), WCAG 2 relative luminance and APCA-W3 0.0.98G constants. OKLCH and contrast for all 15 colours were cross-checked against [culori](https://www.npmjs.com/package/culori) 4.0.2 and [apca-w3](https://www.npmjs.com/package/apca-w3) 0.1.9; all matched to the printed precision. CVD distances use culori's deficiency filters at severity 1. Scripts are in the session scratchpad (temporary), so the numbers below are the record.

Palette scope note: the repo also has `--lagoon-rgb: 63 184 208` (#3fb8d0, OKLCH 0.726 / 0.110 / 213.7), which was not in the brief but is in `--field-sweep` (`/Users/cjxsez/Desktop/bu-proto/src/index.css`). It is included where relevant.

## What are these colours in OKLCH, and are hue, lightness and chroma steps consistent?

### Takeaway
The system is well built: the light and deep tiers share hue almost exactly, and surfaces step evenly. Four things are out of family: iris (L 0.05 low, C 0.04 high, on the sRGB edge), raspberry (lowest L in the deep tier), coral (too close to rose) and muted (passes WCAG but misses APCA Lc 60).

### Cited Findings

**[Computed] Full table.** "% max" is C as a share of the maximum sRGB chroma at that L and h. 100% means a channel is at 255 or 0, with no headroom.

| Token | Hex | L | C | h | % max | Role tier |
|---|---|---|---|---|---|---|
| harbor | #061a2e | 0.213 | 0.048 | 250.5 | 77 | ground |
| raised 1 | #0b2a46 | 0.278 | 0.063 | 249.3 | 81 | surface |
| raised 2 | #123a5c | 0.339 | 0.074 | 247.9 | 82 | surface |
| frost | #f6fbff | 0.985 | 0.008 | 241.7 | 100 | text |
| body | #c9d6e2 | 0.870 | 0.022 | 245.9 | 32 | text |
| muted | #8fa6b8 | 0.714 | 0.037 | 241.7 | 22 | text |
| sky | #7cc7f4 | 0.798 | 0.098 | 236.2 | 83 | light accent |
| iris | #ab9dff | 0.747 | 0.139 | 289.1 | 100 | light accent |
| rose | #f4a2c0 | 0.801 | 0.104 | 356.1 | 81 | light accent |
| cerulean | #1a8fc0 | 0.613 | 0.120 | 233.0 | 95 | deep accent |
| iris deep | #7a6ee0 | 0.605 | 0.167 | 285.0 | 75 | deep accent |
| raspberry | #c2407a | 0.572 | 0.174 | 356.6 | 74 | deep accent |
| mint | #9df0a8 | 0.884 | 0.128 | 147.7 | 57 | accent |
| amber | #ffd38a | 0.889 | 0.103 | 79.5 | 100 | status |
| coral | #ffb4a8 | 0.838 | 0.090 | 29.2 | 100 | status |

**[Computed] Step consistency**
- Hue pairing light to deep: sky/cerulean 3.2°, iris/iris deep 4.1°, rose/raspberry 0.5°. Very tight.
- Hue spacing along the arc: sky to iris 52.9°, iris to rose 67.0°. Whole arc 119.9°, centre about 296°.
- Light tier L: 0.798 / 0.747 / 0.801. Iris sits 0.05 below. C: 0.098 / 0.139 / 0.104. Iris sits 0.035 to 0.041 above.
- Deep tier L: 0.613 / 0.605 / 0.572. Raspberry sits 0.03 to 0.04 below. C: 0.120 / 0.167 / 0.174. Cerulean is capped: sRGB maximum at that L and h is 0.127. Display P3 maximum is 0.166, so equal chroma is possible only on wide-gamut screens.
- Surface ladder: ΔL +0.065 then +0.061; ΔC +0.016 then +0.011; Δh −1.2° then −1.4°. WCAG ratio per step 1.20 and 1.25; harbor to raised 2 is 1.49.
- Text ladder: L 0.985 / 0.870 / 0.714; C rises 0.008 / 0.022 / 0.037 as L falls.

**[Computed] Contrast on each surface.** Each cell is WCAG ratio / APCA |Lc|, for the listed colour as text.

| Text | harbor | raised 1 | raised 2 |
|---|---|---|---|
| frost | 16.87 / 103.4 | 14.06 / 101.0 | 11.29 / 97.2 |
| body | 11.88 / 79.3 | 9.90 / 76.9 | 7.95 / 73.1 |
| muted | 6.96 / 51.1 | 5.80 / 48.7 | 4.66 / 44.9 |
| sky | 9.48 / 66.4 | 7.90 / 64.1 | 6.35 / 60.3 |
| iris | 7.53 / 54.8 | 6.28 / 52.4 | 5.04 / 48.6 |
| rose | 9.02 / 63.8 | 7.52 / 61.4 | 6.04 / 57.6 |
| mint | 12.94 / 84.8 | 10.78 / 82.4 | 8.66 / 78.7 |
| amber | 12.50 / 82.6 | 10.42 / 80.2 | 8.37 / 76.4 |
| coral | 10.33 / 71.2 | 8.61 / 68.8 | 6.91 / 65.0 |
| cerulean | 4.80 / 36.6 | 4.00 / 34.2 | 3.21 / 30.4 |
| iris deep | 4.30 / 32.5 | 3.58 / 30.1 | 2.88 / 26.3 |
| raspberry | 3.61 / 27.5 | 3.00 / 25.1 | 2.41 / 21.3 |

**[Computed] Accents used as fills**, text colour on fill, WCAG / Lc:

| Fill | harbor text | frost text |
|---|---|---|
| cerulean | 4.80 / 38.6 | 3.52 / 66.1 |
| iris deep | 4.30 / 34.5 | 3.93 / 70.2 |
| raspberry | 3.61 / 29.5 | 4.68 / 75.1 |
| sky | 9.48 / 67.3 | 1.78 / 35.8 |
| iris | 7.53 / 56.3 | 2.24 / 47.7 |
| rose | 9.02 / 64.8 | 1.87 / 38.5 |
| mint | 12.94 / 84.5 | 1.30 / 16.8 |

**[Computed] Closest accent pairs** (ΔE in Oklab; [one JND is 0.02 per CSS Color 4](https://www.w3.org/TR/css-color-4/)): rose/coral 0.067, amber/coral 0.098, sky/iris 0.123.

**Repo context:** the source comment in `src/index.css` says the -deep tones are "for light in a ground only... never text" and "Mint stays apart... what's live, open or yours". So the deep-tier text failures above break no current rule. Weekly, monthly and semester events are coded sky, iris and rose.

### Inferences
- **Iris, the main outlier.** It is a darker, more saturated bump in the light tier. Proposed fix: `oklch(0.78 0.12 290)` = #b6aaff, in gamut, with 8.52 / 61, 7.10 / 58, 5.70 / 55 on the three surfaces **[Computed]**. It lands almost on Radix's measured dark step 11 values (violet #baa7ff 0.778 / 0.125 / 293; iris #b1a9ff 0.774 / 0.122 / 287).
- **Raspberry.** As a frost-text fill it is fine (4.68), and darkening or lifting it is a trade-off. Do not lift it for tier symmetry alone: `oklch(0.605 0.17 356)` = #cc4d85 drops frost text to 4.06. Accept the L gap, or keep two tokens (one fill, one ground).
- **Muted.** Lift to #a7bac9 (`oklch(0.78 0.03 242)`) for Lc ≥ 60 on harbor and raised 1: 8.80 / 62, 7.33 / 60, 5.89 / 56 **[Computed]**. Keep the current value only for text at 24px/700 or larger scale roles.
- **Coral.** It is the weakest status colour: same warm-pink neighbourhood as rose, only about 3.3 JND away, and at the sRGB edge. Either give coral a clear single meaning with an icon, or shift it redder and stronger. Rose and coral should never appear as peers in the same component.
- **Fill text.** For filled controls, these tuned fills pass both measures with frost text: cerulean → `oklch(0.54 0.105 233)` #1678a1 (4.76 / 76); iris deep → `oklch(0.57 0.165 285)` #7064d3 (4.53 / 75). `oklch(0.56 0.11 233)` #157eaa just fails at 4.39 **[Computed]**.

### Gaps
- `body` #c9d6e2 and `muted` #8fa6b8 were taken from the brief. The repo's `--ink-soft` and `--ink-dim` are frost at 78% and 58% alpha, which composite to #c1cad1 (10.57 / 72.3) and #919ca7 (6.29 / 46.7) on harbor **[Computed]**, slightly lower than the brief values. Which set is live on each page was not audited.
- Real rendered font sizes and weights were not audited, so APCA pass or fail per component is not established.

## Why do blue-to-pink gradients go muddy, and how do OKLCH, intermediate stops and `in oklch` fix it? What is browser support in 2026?

### Takeaway
Muddiness is mostly geometry: a straight line between two hues 120° apart passes close to the neutral axis, losing half the chroma in **any** rectangular space, including Oklab. `in oklch` or an iris mid stop fixes it. Plain `in oklab` does not. Support: every engine has had `in oklch` gradients since Firefox 127 (June 2024).

### Cited Findings

**[Computed] Midpoint of each gradient, L / C / h**

| Pair | sRGB (legacy default) | Oklab | OKLCH shorter |
|---|---|---|---|
| sky → rose | #b8b4da 0.786 / 0.054 / 290 | #c1b7da 0.799 / 0.050 / 298 | #c3b0f7 0.799 / 0.101 / 296 |
| cerulean → raspberry | #6e689d 0.545 / 0.082 / 289 | #8e719d 0.593 / 0.074 / 314 | #8569cb 0.592 / 0.147 / 295 |
| sky → raspberry | #9f84b7 0.657 / 0.080 / 308 | #b08ab5 0.684 / 0.075 / 323 | #a286e3 0.685 / 0.136 / 296 |
| cerulean → rose | #8798c0 0.681 / 0.062 / 267 | #9d9cc1 0.706 / 0.054 / 286 | #a592df 0.707 / 0.112 / 295 |
| raspberry → lagoon | #807ca5 0.605 / 0.062 / 289 | #9e85a4 0.650 / 0.054 / 320 | #8780e1 0.649 / 0.142 / 285 |

**[Computed] Two separate defects**
- Chroma collapse: chord midpoint chroma ≈ C × cos(Δh/2). At Δh 120° that is 50%, which matches sky → rose C falling from 0.10 to 0.054 (sRGB) and 0.050 (Oklab). Loss is 13% at 60° and only about 10% at 53°.
- Lightness dip: gamma-encoded sRGB only. Deep pair dips to L 0.545 against about 0.593 in the perceptual spaces. Light pair dips 0.014. Oklab and OKLCH hold L flat.
- Oklab's sky → rose midpoint has **less** chroma than sRGB's, so it is less vivid here. [Evil Martians says Oklab avoids a "grayish area in the middle"](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl). That does not hold for this pair at this hue distance.

**[Computed] OKLCH sky → rose path, 9 stops:** L 0.798 to 0.801 (flat), C 0.098 to 0.104 (flat), h 236 to 356 in 15° steps, fully inside sRGB.

**[Computed] Intermediate iris stop, leg midpoints**
- sky → iris: sRGB #93b2fa (C 0.109), OKLCH #8cb4ff (C 0.119).
- iris → rose: sRGB #d0a0e0 (C 0.103), OKLCH #db9be3 (C 0.121).
- So with an iris stop, even plain sRGB keeps C ≥ 0.098. The stop does most of the work.
- sky → iris `in oklch` leaves sRGB gamut at 4 of 9 samples, because iris sits on the edge (blue linear 1.018 at midpoint). Oklab leg stays inside.

**[Computed] Repo's `--field-sweep`** (cerulean 0%, iris deep 38%, raspberry 62%, lagoon 100%, plain sRGB):
- First two legs are fine: minimum C 0.120 and 0.148.
- Third leg collapses to C 0.062 at #807ca5, a grey-violet. Sampled C: 0.174, 0.143, 0.109, 0.079, 0.062, 0.064, 0.078, 0.095, 0.110.
- `in oklch` keeps C 0.142, but only by travelling back through violet (h 356 → 285 → 214).

**Spec rules**
- [CSS Color 4 is a Candidate Recommendation Draft dated 3 November 2026](https://www.w3.org/TR/css-color-4/).
- Interpolation between legacy sRGB formats must stay in gamma-encoded sRGB; ["If the host syntax does not define what color space interpolation should take place in, it defaults to Oklab."](https://www.w3.org/TR/css-color-4/)
- Hex colours therefore get the sRGB behaviour unless authors write `in …`. OKLCH without a hue keyword [defaults to `shorter`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/hue-interpolation-method).
- Non-opaque colours [are premultiplied before interpolation](https://www.w3.org/TR/css-color-4/).
- Gamut mapping algorithms in the spec [aim at "constant-lightness, constant-hue chroma reduction in the OkLCh color space"](https://www.w3.org/TR/css-color-4/). [Evil Martians says Chrome and Safari still clip](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl); that statement may be dated.

**Why Oklab exists:** [CIELAB predicts blue hues badly, and CIELAB, CIELUV and HSV shift toward purple when white blends with blue](https://bottosson.github.io/posts/oklab/). This matters on a blue-led palette.

**Tailwind's stance:** [v4 gradients default to Oklab, with `/oklch` for far-apart hues, because polar spaces make such gradients more vivid](https://tailwindcss.com/blog/tailwindcss-v4). The utility is `bg-linear-to-r/oklch`.

**Browser support**, first versions from [web-features](https://github.com/web-platform-dx/web-features) 3.45.0 (which draws on [MDN browser-compat-data](https://github.com/mdn/browser-compat-data), 8.1.8 installed):

| Feature | Chrome/Edge | Firefox | Safari | Baseline |
|---|---|---|---|---|
| `oklch()` / `oklab()` | 111 | 113 | 15.4 | Widely available since 2025-11-09 |
| `color-mix()` | 111 | 113 | 16.2 | Widely available since 2025-11-09 |
| Gradient `in <space>` and hue method | 111 | 127 | 16.2 | Newly available since 2024-06-11 |
| Relative colour, all forms | 125 | 128 | 18 | Newly available since 2024-09-16 |

Blog figures in search conflicted (Safari 15.4 versus 16.4 for OKLCH; Firefox 113 versus 127 for gradients). The table resolves this: Firefox 113 is the colour function, and 127 is the gradient syntax.

### Inferences
- Rule of thumb: choose by hue distance. Under about 60°, use `in oklab` (loss ≤ 13%, no gamut trouble, no hue curve). Over about 60°, use `in oklch` or add a stop. A blue-to-pink single span needs one of them.
- Best practice for this palette: keep an explicit mid stop **and** interpolate perceptually. The stop gives art direction and pins hue; the method keeps L flat. Use `in oklab` for legs, since sky → iris `in oklch` touches the gamut edge. Moving iris to #b6aaff also helps.
- Example:
  ```css
  background: linear-gradient(115deg, #7cc7f4, #b6aaff 50%, #f4a2c0); /* fallback */
  background: linear-gradient(115deg in oklab, #7cc7f4, #b6aaff 50%, #f4a2c0);
  ```
  The two-declaration fallback works because a browser drops a declaration it cannot parse. With the mid stop the fallback looks close, so failure is graceful.
- Fix `--field-sweep` by reordering, not by adding `in oklch`: lagoon → cerulean → iris deep → raspberry has monotonic hue (214 → 233 → 285 → 357) and no grey leg. If lagoon must follow pink for brand reasons, accept that the leg is a violet return. `longer hue` would run through red, yellow and green, so it is not an option.
- `in oklch` is safe to ship. Baseline Widely available is defined as 30 months after Newly available; the pattern matches `oklab` above, so `gradient-interpolation` should reach it around 2026-12-11. This is a projection, not a published status.
- Fade to the same colour at alpha 0 rather than the `transparent` keyword in polar spaces. `transparent` has no usable hue and L 0, so the fade can shift. This is reasoning from the spec's powerless-hue rules, not tested here.

### Gaps
- Live caniuse global usage share for gradient interpolation was not retrieved; blog estimates of 91 to 96.5% are unreliable.
- Current (2026) gamut-mapping behaviour per engine, clip versus chroma reduction, was not verified.

## What are the rules for dark UI: ground chroma, elevation, text whites, saturation, WCAG versus APCA?

### Takeaway
Harbor's hue and step sizes hold up well against Radix, Material and Tailwind, but it carries more chroma than most dark grounds, which is a brand choice rather than an error. Use lighter, softer accents as text, and test against WCAG 2 as the legal baseline with APCA as a second opinion for fonts. WCAG 3 has not adopted APCA.

### Cited Findings

**Ground chroma: [Computed] measured reference scales**
- [Radix dark](https://www.npmjs.com/package/@radix-ui/colors) 3.0.0 L / C: blue1 0.194 / 0.025, blue2 0.213 / 0.030, blue3 0.274 / 0.066, blue4 0.320 / 0.097, blue5 0.367 / 0.106. slate1 0.179 / 0.004, slate2 0.213 / 0.004.
- [Tailwind 4.3.4 theme.css](https://www.npmjs.com/package/tailwindcss): slate-950 0.129 / 0.042, slate-900 0.208 / 0.042, slate-800 0.279 / 0.041, sky-950 0.293 / 0.066.
- Harbor at L 0.213 carries C 0.048: 1.6× Radix blue2 (0.030), 1.14× Tailwind slate-900 (0.042). Raised 1 (0.278 / 0.063) nearly equals Radix blue3 (0.274 / 0.066).
- Material tints surfaces lightly: [an 8% primary overlay on #121212 gives #1F1B24](https://m2.material.io/design/color/dark-theme).

**Elevation**
- [Apple uses base and elevated background sets; elevated colours are brighter so foreground interfaces advance](https://developer.apple.com/design/human-interface-guidelines/dark-mode.md).
- [Material Color Utilities](https://github.com/material-foundation/material-color-utilities) 0.4.0 `color_spec_2021.js`, dark tones at default contrast **[read from source]**: surface 6, lowest 4, low 10, container 12, high 17, highest 22, bright 24. Text on_surface 90, on_surface_variant 80. M3 moved to [tone-based surfaces](https://material.io/blog/tone-based-surface-color-m3); it replaced M2's white overlay ([(4.5 × ln(elevation + 1) + 2)%](https://flutter.googlesource.com/mirrors/flutter/+/e17f8d367d1f1f01b99fd858881c70729fb27318%5E%21)).
- **[Computed]** In L* terms (equivalent to M3 tone): harbor ≈ 9, raised 1 ≈ 16, raised 2 ≈ 23. So the ladder runs about from low to bright in Material's terms, with roughly 7-tone steps.
- **[Computed]** Radix blue steps 2→3→4→5: ΔL 0.061, 0.046, 0.047. Harbor's steps of 0.065 and 0.061 are comparable or slightly larger.
- WCAG 2.2 1.4.11: [no 3:1 needed for a fill if text or an icon identifies the control, but inputs "differentiated only by a background color must have a 3:1 contrast ratio", and focus indicators need 3:1](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). **[Computed]** harbor/raised 1 is 1.20 and harbor/raised 2 is 1.49, so raised surfaces alone cannot define an input.

**Text whites**
- Material: [text at 87 / 60 / 38% emphasis on #121212](https://m2.material.io/design/color/dark-theme). That fetch returned a thin summary that mirrored the prompt, so treat as low confidence. M3 dark on_surface is tone 90, not 100 (above).
- **[Computed]** Radix dark step 12 L: slate 0.949, blue 0.907, violet 0.912, pink 0.905. Frost at L 0.985 is brighter than all of them.
- Halation: [reported, especially for astigmatic readers](https://www.levelaccess.com/blog/accessibility-for-people-with-astigmatism/); [APCA discussion suggests it is worse in dark mode](https://www.github.com/Myndex/SAPC-APCA/discussions/111). Evidence here is practitioner-level and I found no controlled study of off-white versus white.
- [Apple advises softening white image backgrounds to avoid glow in Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode.md).

**Saturation on dark**
- [Material's baseline dark theme uses the 200 tone of primary, passing 4.5:1 at all elevations](https://m2.material.io/design/color/dark-theme). M3 dark primary is [tone 80](https://aback-tools.pages.dev/tools/design/color-tools/material-design-colors) per a secondary reference.
- [Radix dark step 9 is the highest-chroma solid; step 11 and 12 are text, guaranteed Lc 60 and Lc 90 on step 2 of the same scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale).
- **[Computed]** Radix dark step 11: blue 0.764 / 0.126, violet 0.778 / 0.125, pink 0.785 / 0.155, sky 0.793 / 0.099. Sky and rose already sit on this band.

**WCAG versus APCA**
- WCAG 2.2: [4.5:1, or 3:1 for large text (18pt or 14pt bold); thresholds are not rounded; logos exempt](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- APCA: [Lc 90 preferred body at 14px/400+; 75 minimum body at 18px/400+; 60 content text at 24px/400 or 16px/700; 45 headlines at 36px/400 or 24px/700; 30 placeholder and large solid elements; 15 minimum for discernible non-text. Preliminary dark mode maximum Lc −90 for large fonts](https://git.apcacontrast.com/documentation/APCAeasyIntro).
- Status: [WCAG 3 Working Draft of 10 September 2026 says "The contrast algorithm used in WCAG 3 is yet to be determined" and it "still has several years of work"](https://www.w3.org/TR/wcag-3.0/). APCA is described by its own docs as [a candidate, still in development](https://git.apcacontrast.com/documentation/APCAeasyIntro). The two are not the same thing.
- Apple: [minimum 4.5:1; strive for 7:1 for custom pairs, especially small text](https://developer.apple.com/design/human-interface-guidelines/dark-mode.md).
- **[Computed] Where they disagree:** cerulean fill passes WCAG with harbor text (4.80) and fails with frost (3.52), but APCA says the reverse by a wide margin (Lc 38.6 versus 66.1). Muted passes WCAG everywhere at 4.66+ yet gets only Lc 45 to 51.

### Inferences
- Harbor's chroma: keep it. It is what makes the ground read as "harbor" and lets the field drain into it. Its 77 to 82% of gamut is high but not garish at this L. Caution applies to bigger surface areas: if panels feel saturated, reduce raised 2's C toward 0.06 before touching harbor.
- Rule for this system: ground C 0.03 to 0.05 at L 0.2; each elevation +0.05 to +0.07 L; hold hue within a few degrees; let C rise modestly. Harbor passes all of these. Add a 1px border role for inputs (≥ 3:1), since surfaces cannot provide it.
- Text rule: frost for headings and short UI labels, body for paragraphs. Paragraphs on raised 2 reach only Lc 73 at the body colour; raising body to #d4e0eb gives Lc 79 there and 86 on harbor **[Computed]**. Very large frost display type exceeds APCA's preliminary −90 ceiling, which is a mild argument for using a slightly softer tone on headlines over 48px. This is low-stakes.
- Saturation rule: text accents at L ≈ 0.77 to 0.80 and C ≈ 0.10 to 0.125; fills and glows at L ≈ 0.55 to 0.62 with higher C. That is the Radix 11 versus 9 split, and this palette nearly has it already.
- Contrast policy: WCAG 2.2 AA is the compliance gate. Use APCA as an extra check for fine type and for picking text colour on mid-tone fills, where WCAG misleads. Where they conflict on fills, tune the fill so both pass (see #1678a1, #7064d3), not picking one.
- Text over gradients: measure at the worst stop. Harbor text on sky → rose `in oklch` keeps ≥ 8.98:1. Frost on cerulean → raspberry bottoms out at 3.52:1, so it fails for body-size text until the cerulean end is darkened **[Computed]**.

### Gaps
- M3's and M2's live docs did not render through fetch. M3 values come from the library source, and role details for primary tone come from secondary sources.
- No controlled study was found quantifying the benefit of off-white over pure white, and no reliable source for a numeric ground-chroma ceiling.

## Is this analogous with a complementary accent? Is mint right? What about 60-30-10?

### Takeaway
It is a wide analogous arc (120°) with mint as a near-complement of the arc's centre, about 32° off exact. Mint is a defensible accent. Of the alternatives tested, only a yellower lime separates better under red-green CVD, and it does worse under tritan. 60-30-10 is an unproven heuristic that needs adapting for dark gradient sites.

### Cited Findings
- **[Computed] Hue geometry:** blue-pink arc 236° to 356°, centre 296°, true complement 116° (yellow-green). Mint at 147.7° is 31.7° off. Amber at 79.5° is 36.5° off the other side. Harbor's own complement (70.5°) is close to amber.
- **[Computed] Candidates at similar lightness, normal vision and severe CVD. ΔE Oklab versus rose:**

| Accent | Hex | Normal | Protan | Deutan | Tritan |
|---|---|---|---|---|---|
| mint (current) | #9df0a8 | 0.239 | 0.186 | 0.104 | 0.218 |
| lime `oklch(0.9 0.16 120)` | #d1ed6a | 0.253 | 0.231 | 0.185 | 0.145 |
| aqua mint `oklch(0.89 0.11 170)` | #8af3d0 | 0.232 | 0.173 | 0.080 | 0.250 |

- **[Computed] Other CVD pairs (normal / protan / deutan / tritan):** mint/amber 0.131 / 0.047 / 0.051 / 0.180; mint/coral 0.193 / 0.123 / 0.042 / 0.211; sky/rose 0.175 / 0.084 / 0.089 / 0.223; sky/iris 0.123 / 0.096 / 0.053 / 0.115; rose/coral 0.067 / 0.069 / 0.067 / 0.042.
- **[Computed] Mint's prominence** comes from lightness (L 0.884, 0.08 above sky and rose), with hue separation adding the rest. Against harbor it scores 12.94 / Lc 84.8.
- **Harmony evidence:** [Schloss and Palmer (48 participants, 992 pairs) found preference and harmony both rise with hue similarity](https://link.springer.com/article/10.3758/s13414-010-0027-0); [older studies conflict, with Granger (1955) finding the reverse and Allen and Guilford (1936) finding no clear overall effect](https://pmc.ncbi.nlm.nih.gov/articles/PMC3037488). Those findings are about rated pair aesthetics, not UI accent function.
- **60-30-10:** [interior designers treat it as a heuristic and warn against taking it literally](https://www.apartmenttherapy.com/interior-design-rule-60-30-10-explained-37504313). [UI writers adapt it as neutral, structural and accent, reserving the accent for main actions](https://www.visily.ai/?p=90572). Search found no peer-reviewed evidence and no traceable originator.

### Inferences
- Label: "wide analogous arc plus near-complementary accent", close to a split-complement with mint and amber straddling 116°. A 120° arc is wider than a strict analogous scheme, and iris is what makes it read as one family.
- The evidence favours the base idea: a near-hue arc is the harmonious part, and the accent needs to be different rather than harmonious. Accent function rests on salience, not on colour-wheel maths.
- Keep mint. Reasons: hue gap is big, it is lighter than the other accents bar amber, and chroma has spare headroom (57% of max). Lime would be stronger under deuteranopia but looks more acidic and is off-brand. Aqua mint is worse: it drifts toward lagoon and loses CVD separation.
- Real risk is mint versus amber and mint versus coral under red-green CVD (0.04 to 0.05). When these sit together as states, add icons or text. WCAG's rule against colour-only meaning applies to the event coding too, since sky/iris drops to 0.053 under deuteranopia: keep the labels.
- Mint used as "success" conflicts with "live, open or yours". Decide which one it means, and do not let both share one colour with no text.
- Proportion rule for dark gradient sites (opinion, starting values to tune by eye):
  - about 85 to 90%: harbor, raised surfaces and neutral text
  - about 8 to 12%: gradient field or sky, iris, rose, weighted to hero and big moments
  - 1 to 3%: mint
  - under 1%, situational: amber and coral
  The gradient is counted as one colour idea, not three. A strict 60-30-10 would flood the page with accent.

### Gaps
- Primary sources for Ou & Luo were not retrieved. Classic colour-wheel harmony definitions (Itten, etc.) were not sourced, and these have weak empirical support in any case.
- No study was found comparing mint, lime or amber accents on blue-pink specifically. Simulated CVD is a model, not a user test.

## How many saturated colours can a system carry? What do Material 3, Radix, Tailwind and Apple do?

### Takeaway
No source gives a validated "noise" limit for interfaces. Nearest evidence puts categorical accuracy falling beyond about six. Design systems avoid the problem by giving each hue many tones but limiting accent roles at any time. This palette has seven hue families, which is fine only if most never appear together.

### Cited Findings
- [A 2025 arXiv study reports categorical task accuracy stable for small sets and falling sharply beyond six categories](https://arxiv.org/pdf/2508.17460); that paper also reports palette advice of around eight distinct colours, and contrasts it with about thirteen nameable colours. These are data-visualisation tasks, not UI.
- [Marc Green argues the practical number is colour categories people readily perceive, which is relatively small](https://visualexpert.com/Resources/cfaqPart2.html).
- **Radix:** [12 steps per hue, each with a job: 1-2 backgrounds, 3-5 component states, 6-8 borders, 9-10 solids, 11-12 text](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale).
- **Tailwind:** [v4 palette in OKLCH](https://tailwindcss.com/blog/tailwindcss-v4). **[Computed]** 11 steps, 50 to 950. Chroma peaks mid-scale: sky peaks at 500 (0.169), violet at 600 (0.281), pink at 600 (0.249). sky-400 (0.160, sRGB max 0.153), sky-500 (0.169, max 0.150) and pink-600 (0.249, max 0.240) sit outside sRGB, so Tailwind leans on wider gamut; violet-600 stays inside (0.281, max 0.283).
- **Material:** tones 0 to 100 in HCT; [fixed hue and chroma sampled at different tones](https://react-native-dynamic-theme.vercel.app/docs/color-system); a scheme derives from one seed. Roles map to tones (see the dark tones listed above).
- **Apple:** [semantic colours that adapt; custom colours as Color Sets with bright and dim variants; avoid hard-coded values](https://developer.apple.com/design/human-interface-guidelines/dark-mode.md). Apple is role-first rather than scale-first.
- **[Computed] This palette:** seven hue families (blue, violet, pink, green, yellow, red-orange, plus teal lagoon), two tiers on three of them.

### Inferences
- Every system above splits "palette size" from "colours in use". The useful limit is per view: the gradient as one idea, plus one accent, plus at most one status colour at a time.
- Suggested rule: at most three saturated hues in text or UI per viewport outside the gradient itself. Do not put sky, iris and rose as adjacent flat chips unless they carry the event-cadence coding that is their job.
- This palette's tier idea is close to Radix's (9 vs 11). Upgrade path: define each of sky, iris, rose as a small role set (`-text`, `-fill`, `-glow`, `-tint`) rather than building 12-step scales the site will not use.
- Three light-tier accents at equal L is a plus for gradients but a minus for distinction: they differ by hue only, so they lean harder on labels.

### Gaps
- No credible study found on a saturated-colour count before a UI reads as noisy. Thresholds here are opinion.
- Material's accent role set (primary, secondary, tertiary, error) is from training knowledge, and was not re-read from a rendered doc this session. Ware, Healey and Munzner primary texts were not retrieved.

## How should large banding be prevented: dithering, noise, grain?

### Takeaway
Harbor-range gradients are prone to banding because few code values span many pixels. Chrome already dithers CSS gradients in the test run here, so grain overlays there are aesthetic rather than necessary. Noise laid over a finished 8-bit gradient hides steps but does not remove them; true dither happens before quantisation. Safari remains untested.

### Cited Findings
- **[Computed] Available steps** (linear sRGB-space interpolation, distinct 8-bit RGB triples):

| Gradient | Distinct colours | Largest channel Δ | px per dominant-channel step at 2560px |
|---|---|---|---|
| harbor → raised 1 | 46 | 24 | 107 |
| harbor → raised 2 | 91 | 46 | 56 |
| raised 1 → raised 2 | 46 | 22 | 116 |
| harbor → iris deep | 363 | 178 | 14 |
| harbor → raspberry | 302 | 188 | 14 |
| sky → rose | 208 | 120 | 21 |

- **[Computed]** One code value near harbor is ΔE 0.0012 to 0.0037, far below the spec's 0.02 JND. Bands are still reported in dark ranges, so the visible cue is likely the edge across a large smooth area rather than colour difference between flat patches (my reasoning). [Zed's gradient patch targets dark ranges of 5 to 15% lightness for this reason](https://git.secluded.site/zed/commit/a46858ac21ec43b1af94d8b2b9a5a8fde4ac4f01).
- **[Tested] Chrome 156 headless, macOS, sRGB profile, screenshot of 2000 × 100 harbor → raised 1 strips.** Sample columns contain different colours across rows on a gradient with no vertical component:
  - sRGB default: 1918 / 2000 columns vary; 74 unique colours (versus 46 undithered); longest same-colour run 13px.
  - `in oklch`: 1916 / 2000, 76 unique, longest run 20px.
  - `in oklab`: 1921 / 2000, 74 unique, longest run 16px.
  - Alpha gradient over solid: 1917 / 2000. Gradient at `opacity: .25`: 1866 / 2000.
  - So Chrome applies dither to CSS gradients in this configuration, and it survives alpha and opacity.
- **[Computed] Dither order simulation:** 2560px harbor → raised 1 blue channel, 256 rows, 64px smoothing window; error from ideal in code values:

| Method | Smoothed error | Pixel noise SD |
|---|---|---|
| None | 0.204 | 0 |
| TPDF ±1 before quantising | 0.013 | 0.50 |
| TPDF ±2 before quantising | 0.018 | 0.86 |
| Same ±1 after quantising (overlay) | 0.210 | 0.50 |
| Same ±2 after quantising | 0.209 | 0.86 |

  Before-quantise dither cuts staircase error about 15×. After-quantise noise leaves it unchanged and only masks it.
- [Gjøl: add noise before rounding, use triangular (TPDF) at 2 LSB, from two summed uniform randoms; average must equal the signal; near black and white limit amplitude to avoid clamping; blended layers can lose RGB noise, so INSIDE used more noise in alpha (about 10×)](https://pixelmager.github.io/linelight/banding). [Wronski reports triangular noise removes bands without over-noising](https://bartwronski.com/2016/10/30/dithering-part-three-real-world-2d-quantization-dithering/).
- Amplitude naming varies: [Zed's description says ±1/255 and its code comments ±2/255 for RGB, ±3/255 for alpha](https://git.secluded.site/zed/commit/a46858ac21ec43b1af94d8b2b9a5a8fde4ac4f01).
- Web technique: [SVG `feTurbulence`, e.g. `fractalNoise`, `baseFrequency=.65`, `numOctaves=3`, `stitchTiles=stitch`, layered with gradient, with `filter: contrast() brightness()` for grain and `mix-blend-mode` for refinement](https://css-tricks.com/grainy-gradients/). Blink and WebKit differ on blend-mode rendering, per that article, and reduced grain [weakens the fix](https://frontendmasters.com/blog/grainy-gradients/). That article uses noise as a displacement map as an alternative.

### Inferences
- Decision order:
  1. Avoid the worst case: do not stretch a tiny tonal gap across the full viewport. Harbor → raised 1 at 2560px gives one blue step per 107px. Radial pools with short falloff, or a wider tonal range, spread the risk.
  2. Rely on gradient dither first. In Chrome it is there already, so test Safari before adding anything.
  3. For canvas or WebGL fields, including the ASCII field, dither in the shader or output stage before 8-bit, with TPDF at about 1 to 2 LSB, using Gjøl's boundary limits. It is the only place you can do it correctly.
  4. Add a grain overlay only if it wins as texture or to mask Safari banding. Keep it subtle: about ±1 to 2 code values, measured in a screenshot, using a pre-rendered tile rather than a live `feTurbulence` over a large area. Extra colour stops do not help: they add no code values between two close tones.
- Overlay noise is masking. It works perceptually because noise hides edges, not because the data improves, so it needs more amplitude than true dither and can look dirty on a ground this dark.
- Grain over text harms legibility, so put it under content in the stacking order. Keep it off panels with small text.
- Do not use `feTurbulence` as a fixed full-viewport filter during scroll without profiling; the only performance remark found is a commenter's opinion, so treat as a test item.
- Screen recordings, PNG and video encoders can introduce banding or eat grain, so judge on a real display, not in a compressed preview.

### Gaps
- **Safari and Firefox were not tested.** Firefox is not installed here and Safari was not run. No source confirmed whether they dither. This is the top item to check, because Safari is common on the Mac displays where banding gets noticed.
- GPU raster is unconfirmed: a Metal-flag run gave identical counts, suggesting the same raster path, so it proves nothing further. Radial and `filter: blur()` tests were inconclusive, as they vary vertically by design. Blurred glows remain an open banding risk.
- The display's own panel behaviour (6+2-bit FRC, HDR, wide-gamut) was not assessed.
- Whether a browser composites at 8 bits, and hence how overlays quantise, was assumed from the Gjøl GPU case and not verified per browser. No peer-reviewed threshold was found for band visibility at these luminances.
