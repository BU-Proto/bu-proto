# Award-recognised sites with a dark blue ground and a blue-to-pink colour scheme

Target palette: ground #061a2e, cerulean #1a8fc0, sky #7cc7f4, iris #ab9dff, rose #f4a2c0, raspberry #c2407a, mint accent #9df0a8.

Research date: 6 Nov 2026.

**How to read the evidence labels**
- `[Awwwards palette]`: swatches on the site's Awwwards page. #ededed is on every page checked, so it was treated as an Awwwards default and dropped.
- `[live CSS]`: hex values in the live HTML and stylesheets, or CSS custom properties.
- `[computed]`: read from the rendered page with `getComputedStyle` in headless Chrome at 1440x900.
- `[estimate]`: colour quantised from a screenshot or Awwwards thumbnail. Approximate.
- Gradient share figures are my own estimates from four scroll positions, not measurements.

**Method and coverage**
- Awwwards: crawled the SOTD archive. It returned 1,736 sites from Feb 2022 to Nov 2026; pages past 56 added nothing. Each thumbnail was scored for navy, pink, blue and violet pixels, then the top scorers were checked by eye. Source: [SOTD archive](https://www.awwwards.com/websites/sites_of_the_day/).
- CSS Design Awards: same scoring on 1,167 WOTD winners from the first 65 listing pages. Source: [WOTD winners](https://www.cssdesignawards.com/wotd-award-winners).
- Thumbnail scoring finds sites whose Awwwards image shows the palette. It can miss a site whose hero is plain. This shortlist is strong, not exhaustive.
- FWA and Webby got no equivalent scan. See the Gaps under question 1.

---

## Which award-recognised sites use a blue-to-pink gradient on a dark ground?

### Takeaway
13 real sites with confirmed awards are listed below: 8 strong or partial live matches, 3 that have gone, and 2 near-misses. An exact match is rare: the 8 live sites use several different treatments, and only MSI "I want it all" has a true multi-stop blue-to-pink CSS gradient on a dark ground.

### Cited Findings

**Live, with the palette at least partly present**

| # | Site | URL | Award and year | Award page |
|---|---|---|---|---|
| 1 | Cerebrium | https://cerebrium.ai/ | Awwwards SOTD, 10 Sep 2026, score 7.39 | [Awwwards](https://www.awwwards.com/sites/cerebrium) |
| 2 | Studio375 | https://375.studio/en | Awwwards SOTD, 30 Apr 2026, score 7.33. Also CSSDA Special Kudos, 8 Mar 2026 | [Awwwards](https://www.awwwards.com/sites/studio375-2), [CSSDA](https://www.cssdesignawards.com/sites/studio375/48996/) |
| 3 | MSI "I want it all" | https://iwantitall.merci-michel.com/ | Awwwards SOTD, 4 Sep 2022, score 7.45 | [Awwwards](https://www.awwwards.com/sites/msi-i-want-it-all) |
| 4 | Be The Buzz | https://www.bethebuzz.co/ | Awwwards SOTD, 4 Aug 2024, score 7.19 | [Awwwards](https://www.awwwards.com/sites/be-the-buzz) |
| 5 | Plugged Live Shows | https://pluggedliveshows.com/ | Awwwards SOTD, 6 Jan 2023, score 7.46 | [Awwwards](https://www.awwwards.com/sites/plugged-live-shows) |
| 6 | Keikku | https://keikku.madebyburo.com/ | Awwwards SOTD, 13 Dec 2024, score 7.41. CSSDA WOTD, 17 Jan 2025. FWA of the Day, Dec 2024 (see Gaps) | [Awwwards](https://www.awwwards.com/sites/keikku-next-gen-stethoscope), [CSSDA](https://www.cssdesignawards.com/sites/keikku/46872/), [FWA](https://thefwa.com/cases/keikku) |
| 7 | Hatom | https://www.hatom.com/ | Awwwards SOTD, 4 Nov 2024, score 7.96. CSSDA WOTD, 31 Oct 2024. CSSDA WOTY 2024 nominee | [Awwwards](https://www.awwwards.com/sites/hatom), [CSSDA](https://www.cssdesignawards.com/sites/hatom/46463), [WOTY](https://www.cssdesignawards.com/woty2024/sites/Hatom) |
| 8 | SETA | https://www.setaprint.ch/en/ | Awwwards SOTD, 30 Sep 2023, score 7.37 | [Awwwards](https://www.awwwards.com/sites/seta) |

**Gone or unreachable** (award confirmed, colour known only from the award thumbnail)

| # | Site | URL | Award and year | Award page |
|---|---|---|---|---|
| 9 | TOKYO BEAST | https://www.tokyo-beast.com/ | CSSDA WOTD, 23 Feb 2024 | [CSSDA](https://www.cssdesignawards.com/sites/tokyo-beast/45102/) |
| 10 | Cedro web 3.0 | https://cedroweb3.ai | CSSDA WOTD, 15 Jun 2024 | [CSSDA](https://www.cssdesignawards.com/sites/cedro-web-3-0/45721/) |
| 11 | Jantana Hennard portfolio | https://jant.fr/ | Awwwards SOTD, 10 Apr 2022, score 7.3 | [Awwwards](https://www.awwwards.com/sites/jantana-hennard-portfolio) |

**Near-misses, useful as contrast**

| # | Site | URL | Award and year | Award page |
|---|---|---|---|---|
| 12 | Madar | https://madarplatform.com/en | Awwwards SOTD, 19 Sep 2025, score 7.29 | [Awwwards](https://www.awwwards.com/sites/madar) |
| 13 | Mission Control | https://missioncontrol.co | CSSDA WOTD, 9 Jan 2026 | [CSSDA](https://www.cssdesignawards.com/sites/mission-control/48282/) |

**Checked and rejected**
- Tesoro: [SOTD 25 Dec 2025](https://www.awwwards.com/sites/tesoro-1). Hero photo is magenta and blue, but the page is a light pink #f8d0f6 ground `[computed]`.
- Emotion Agency Promo: [SOTD 29 Sep 2024](https://www.awwwards.com/sites/emotion-agency-promo). Purple only, #7367F0 and #5123AF `[Awwwards palette]`.
- Kaleida: [SOTD 5 Nov 2025](https://www.awwwards.com/sites/kaleida). Black ground, #4B00FF `[Awwwards palette]`, no pink in its palette or tokens.

### Inferences
- Dark navy plus blue-to-pink is uncommon among winners. After scoring 1,736 SOTDs, only 58 passed loose navy-plus-pink filters, and most of those failed visual review.
- Web3 and AI products are over-represented here (Cerebrium, Hatom, Cedro), but the sample is small.

### Gaps
- **FWA:** thefwa.com case pages returned 404 to both WebFetch and curl today, although the home page returned 200. A search snippet from an FWA profile page (exact URL not recorded) said a new site takes over in the first week of November, which may explain this. Keikku's FWA of the Day (Dec 2024, 81 points) rests on a search index snippet only, so re-check that link. No other site here could be confirmed for FWA.
- **Webby:** no Webby-recognised site with this palette was confirmed. I read only the [Best Visual Design - Aesthetic list](https://winners.webbyawards.com/winners/websites-and-mobile-sites/features-design/best-visual-design-aesthetic) for 2024 to 2026, and did not colour-check its entries.
- **Developer Award:** none confirmed. Cerebrium's page shows a developer score of 7.5, but no Developer Award badge text was found on any Awwwards page checked.
- **SOTM and SOTY:** none of the 13 was found to hold one. Awwwards page text showed only SOTD for the 10 Awwwards entries.
- **Awwwards before Feb 2022:** not scanned, per the brief's 2022 preference.
- Keikku's CSSDA date and scores, and Studio375's Special Kudos, come from search results for those CSSDA pages, not from a direct page fetch.

---

## How is colour actually used on each site?

### Takeaway
Most of these sites keep the gradient out of CSS: it lives in WebGL, video or imagery, while CSS holds a flat dark ground and one or two accents. Body text is white, off-white or cream on dark, and cards are mostly separated by a tone step or an inverted section, not a border.

### Cited Findings

**1. Cerebrium** — [Awwwards](https://www.awwwards.com/sites/cerebrium), [live](https://cerebrium.ai/)
- Ground: #101421 on `html`, plus black sections `[computed]`. Mid-page sections switch to #ffffff and #eef2f5 `[computed]`, so it is a mixed dark and light page, not all dark.
- Awwwards palette: #172B76, #902177.
- Tokens `[live CSS]`: navy #172b76, #586490. Pink scale #fdcdeb, #f8a2d3, #f480c0, #ff488b, #f6186a. Purple #e33adb.
- Gradient: `linear-gradient(to right in oklab, #ff488b, #e33adb)` `[computed]`. It is pink-to-magenta rather than blue-to-pink. The hero word "scales" appears in pink in my screenshot; the gradient's exact element was not isolated.
- Hero: magenta 3D ribbons, about #540b44 to #6f3765 `[estimate, Awwwards thumbnail]`. Tagged Three.js and Cinema 4D on Awwwards.
- Gradient share: hero area and accents, about 15 to 25% `[estimate]`.
- Accent: #ff488b sign-up button. Dark sections use white text; light sections use #172b76 with #586490 secondary `[computed]`.
- Surfaces: one card type is #101421, radius 15px, no border, no shadow `[computed]`.

**2. Studio375** — [Awwwards](https://www.awwwards.com/sites/studio375-2), [live](https://375.studio/en)
- Ground: #000000 `[computed]`.
- Palette: #cc0597 and #11baff `[Awwwards palette, live CSS]`. There are almost no other colours in the CSS `[live CSS]`.
- Gradient: 3D only. No CSS gradient was found `[computed]`. The hero is lit louvres running cyan to magenta on near-black, about #2375a5, #26456e, #2f072a, #082736 `[estimate, thumbnail]`.
- Gradient share: hero about 15%, then project photography with its own colours `[estimate]`.
- Accent: the same two colours as solid buttons, magenta and cyan, seen on the cookie panel `[computed]`.
- Text: white, with #808080 secondary `[computed]`.
- Surfaces: no cards. Full-bleed project images on black.

**3. MSI "I want it all"** — [Awwwards](https://www.awwwards.com/sites/msi-i-want-it-all), [live](https://iwantitall.merci-michel.com/)
- Ground: #000000 on `html`, with #140853 surface `[computed]`. The loader is saturated blue. The 3D scene is near #380147 to #630179 `[estimate]`, so it reads purple rather than navy.
- Awwwards palette: #2779a7, #49c5b6, #D14836. These do not reflect the page well.
- Gradient `[live CSS]`: `linear-gradient(88deg, #fe0291 -6%, #b762ff 29%, #5143ff 55%, #005cff 79%, #8fd7ff 104%)`. This is the closest stop sequence to the brief: raspberry, iris, blue, sky.
- Where: UI gradient plus 3D scene, in about 80% or more of the screen `[estimate]`. A variant uses `#b602d7, #593aff, #3a31c8, #b602d7, #140853`.
- Accents: #4cfeaa mint and rgb(57,243,254) cyan appear in CSS `[live CSS]`. A cyan glowing orb is visible in the scene.
- Text: white `[computed]`.
- Surfaces: pill and panel UI over a 3D scene. No conventional cards.

**4. Be The Buzz** — [Awwwards](https://www.awwwards.com/sites/be-the-buzz), [live](https://www.bethebuzz.co/)
- Ground: fixed canvas background. Near black in the corners, about #01000c, #030029 `[estimate]`.
- Tokens `[computed]`: --color-dark-blue #010561, --color-violet #5e29f9, --color-pink #e60696, --color-red #f35356, --color-orange #fe9421, #f2f2f7, #e6e6f0.
- Gradient: animated in canvas, not CSS. It runs navy to magenta (#7f034a, #8a0251 `[estimate]`) to orange. The warm end leaves the brief's palette.
- Gradient share: about 50 to 60% of the page, with white card sections on top `[estimate]`.
- Text: white on the gradient, #010561 on white `[computed]`.
- Surfaces: white cards on the gradient, separated by strong contrast. A solid #5e29f9 band is used for a call to action.

**5. Plugged Live Shows** — [Awwwards](https://www.awwwards.com/sites/plugged-live-shows), [live](https://pluggedliveshows.com/)
- Ground: #05021d, with #080429 and #0b0730 steps `[computed]`. Awwwards lists #090528 and #ECE5DB.
- Gradient: `radial-gradient(50% 155% at 70% 55%, #01017e 0%, #040232 100%)` `[computed]`. It is a blue-only glow.
- Pink: #ee58c2 and #205cd4 each appear only twice in CSS `[live CSS]`. Their use was not traced. Pink is not a visible page colour in my samples.
- Gradient share: low-contrast ground glow across about 60% `[estimate]`, plus colourful photography.
- Accent: cream #ece5db. Red #ae0000 is a token.
- Text: cream #ece5db `[computed]`, #9b9dba muted `[live CSS]`.
- Surfaces: inverted cream sections, and transparent cards with no border `[computed]`.

**6. Keikku** — [Awwwards](https://www.awwwards.com/sites/keikku-next-gen-stethoscope), [live](https://keikku.madebyburo.com/)
- Ground: #12131d `[computed, meta theme-color]`, with #1e1328 steps. Light section #f4fbff.
- Awwwards palette: #0A36FF, #12131D.
- Tokens `[live CSS]`: --color-midnightDarkBlue #1f2130, --color-midnightLightBlue #1c1e31, --color-midnightBlue #2f3247, --color-blue #0a36ff, plus #224aff, #14bcff, #8a14ff, #5f20e4, #ffdada, #d2c2e6.
- Gradients `[computed]`: `#8a14ff` to `#224aff`, `#224aff` to `#14bcff`, and `#5f20e4` to `#ffdada`. The last is the only violet-to-pale-pink one.
- Where: blue gradient headline text, and radial glow behind the product `[screenshot]`. 16 canvases.
- Gradient share: about 10 to 15% `[estimate]`. Mostly plain ground.
- Text: white at 70 to 100%, #2f3247 on light `[computed]`.
- Surfaces: tone steps #1c1e31 and #1f2130. This is the cleanest token ladder in the set. Card rules show no border or shadow `[computed]`.

**7. Hatom** — [Awwwards](https://www.awwwards.com/sites/hatom), [CSSDA](https://www.cssdesignawards.com/sites/hatom/46463), [live](https://www.hatom.com/)
- Awwwards palette: #F76CFE pink, #C1FF12 lime. #c1ff12 is the top CSS hex, 80 uses `[live CSS]`.
- Ground: about #0e0e21 and #0c071d, with violet #2d1a4f, #462c69 `[estimate, thumbnail]`.
- Gradient: 3D world only. Violet mountains with a glowing iridescent griffin egg, per the thumbnail and the [WOTY entry](https://www.cssdesignawards.com/woty2024/sites/Hatom). Gradient share not measured.
- Accent: lime. It is the nearest analogue here to a small green accent on a blue-pink scheme.
- Text and surfaces: not measured. The page stayed on a white loader in headless Chrome, and body computes to #fff before load `[computed]`.

**8. SETA** — [Awwwards](https://www.awwwards.com/sites/seta), [live](https://www.setaprint.ch/en/)
- Ground: #000000 `[computed]`, with about #090909 `[estimate]`. Awwwards palette: #000000, #C4C4C4.
- Gradient: WebGL aura that grows on scroll. Pink, blue and violet, about #754e9a, #7470cd, #bda5e9, blowing out to white `[estimate]`. A small green passage appears at one scroll position.
- Gradient share: small in the hero, about 50%+ of the viewport later `[estimate]`. No CSS gradient `[computed]`.
- Text: looks pale grey in screenshots. Computed values are unreliable: #000000 and #00bfff. A blend mode may be the cause, not confirmed.
- Surfaces: none. Thin crosshair and corner marks, no cards.

**9. TOKYO BEAST** — [CSSDA](https://www.cssdesignawards.com/sites/tokyo-beast/45102/). Thumbnail only: #212c68, #141c4f navy, #6d2f5d, #661839 magenta, #7a6b98 `[estimate]`. A 3D beast character in neon blue and pink.

**10. Cedro web 3.0** — [CSSDA](https://www.cssdesignawards.com/sites/cedro-web-3-0/45721/). Thumbnail only: #070707 ground, #9371aa, #47104f, #280726 `[estimate]`. Glossy 3D forms in magenta and blue. Ground is black.

**11. Jantana Hennard** — [Awwwards](https://www.awwwards.com/sites/jantana-hennard-portfolio). Thumbnail only: a full-page soft gradient from slate to rose on black. Awwwards palette #000, #ffffff. Closest calm use of the idea, but no CSS survives.

**12. Madar** — [Awwwards](https://www.awwwards.com/sites/madar), [live](https://madarplatform.com/en)
- Tokens `[computed]`: --color-blue #172E64, --color-blue-dark #060A3D, --color-blue-light #89AEFF, --color-pink #A65DB4, --color-orange #FF6340.
- `html` is #172e64 and body is #ffffff, so sections alternate dark and light `[computed]`.
- Hero chart lines run blue to orange and red, not pink `[Awwwards thumbnail]`. CSS glow: `radial-gradient(... rgba(255,66,0,.18) ...), radial-gradient(... rgba(19,103,254,.18) ...)` `[live CSS]`.
- Cards: rgba(23,46,100,.05) with 5px radius, and 1px rgba(23,46,100,.2) lines `[computed]`.
- Text: white on dark, #172E64 on light.

**13. Mission Control** — [CSSDA](https://www.cssdesignawards.com/sites/mission-control/48282/), [live](https://missioncontrol.co)
- Live page is light: #f8f8f7 ground, #161716 text, lime --primary #d6ff53 `[computed]`.
- Its award thumbnail shows a black hero with a blue-magenta-orange dawn horizon. The live hero keeps a smaller dawn image inside a card `[screenshot]`.
- Pastel cards use mint #b0f0cb and lilac #cab1f7 with matching 1px borders and 28px radius `[computed]`. This is a useful reference for tinted cards, though on a light ground.

### Inferences
- The gradient sits mostly in canvas, video or image. That lets the design tokens stay small and keeps text legible.
- Flat text on dark is the norm in this set. Gradient text is limited to a word or a headline (Cerebrium, Keikku).
- A dark-only page is less common than expected. Cerebrium, Be The Buzz, Keikku and Madar all bring in light sections.

### Gaps
- Scroll-driven sites may show colours my four samples missed. Plugged and MSI do not scroll normally.
- WebGL content was rendered in software. Cerebrium and Hatom timed out on screenshots, so their hero notes rely on thumbnails.
- Mobile layouts were not checked.

---

## Which sites are the closest match to the palette, and why?

### Takeaway
Cerebrium is the closest overall, Studio375 the closest pure two-colour scheme, and MSI "I want it all" the closest gradient. None matches the ground: every verified ground is more indigo or more neutral than #061a2e.

### Cited Findings

Ranking is my judgement, based on the values above.

1. **Cerebrium:** navy #172b76 and #101421, and #f8a2d3 is very close to rose #f4a2c0. #ff488b sits between rose and raspberry. Weak point: pink dominates, and no sky or cerulean tone was found. Source: [live](https://cerebrium.ai/).
2. **Studio375:** #11baff is near the sky-cerulean range and #cc0597 is a brighter raspberry, on black. Closest in spirit: two hues, one ground. Source: [Awwwards](https://www.awwwards.com/sites/studio375-2).
3. **MSI "I want it all":** the only CSS sequence running raspberry, iris, blue, sky (#fe0291, #b762ff, #005cff, #8fd7ff), with a mint-like #4cfeaa accent. Much more saturated and violet-heavy than the target. Source: [live](https://iwantitall.merci-michel.com/).
4. **Keikku:** best surface system and restraint, with #12131d, #1c1e31, #1f2130. Blue-violet with only a faint pink, so a model for structure rather than hue. Source: [live](https://keikku.madebyburo.com/).
5. **Hatom:** pink #F76CFE plus lime #C1FF12 on deep violet-navy is the best match for the pink-plus-small-green structure. Source: [Awwwards](https://www.awwwards.com/sites/hatom).
6. **SETA:** best soft aura, and closest to the pastel feel of iris and rose. Ground is black. Source: [Awwwards](https://www.awwwards.com/sites/seta).

Ground hue comparison, calculated from the hex values above:

| Ground | Hue (degrees) | Source site |
|---|---|---|
| #061a2e | 210 | Target |
| #172e64 | 222 | Madar |
| #101421 | 226 | Cerebrium |
| #172b76 | 227 | Cerebrium (navy token) |
| #12131d | 235 | Keikku |
| #060a3d | 236 | Madar (dark token) |
| #010561 | 238 | Be The Buzz |
| #05021d | 247 | Plugged |

### Inferences
- #061a2e leans teal compared with all of these. That gives the target palette a distinct look, and it may also make pink feel more separate from the ground than on indigo grounds. This is a design judgement and was not tested.
- On violet-leaning grounds, the blue-to-pink midpoint merges with the ground. Keeping iris as a defined stop should matter more on a teal-leaning ground.
- Hatom and MSI support using green sparingly: lime or mint serves as the one colour outside the blue-pink range.

### Gaps
- No site here pairs a hue-210 ground with pastel rose and iris at the target's lightness. The scan found none, but it was limited to thumbnails.
- No perceptual colour distance (Delta E) was calculated.

---

## Is any site gone or changed since the award?

### Takeaway
Three of the 13 are gone or unreachable, one looks redesigned, and one is a finished campaign still online.

### Cited Findings
- **jant.fr, gone:** the domain now shows a parked page reading "Information about jant.fr: Buy this domain", with automotive filler text. Checked directly on 6 Nov 2026. Award: [Awwwards](https://www.awwwards.com/sites/jantana-hennard-portfolio).
- **tokyo-beast.com, unreachable:** `www.tokyo-beast.com` did not resolve in curl or Chrome today. Award: [CSSDA](https://www.cssdesignawards.com/sites/tokyo-beast/45102/).
- **cedroweb3.ai, unreachable:** curl and dig could not resolve it, and Chrome reported a certificate name error. Award: [CSSDA](https://www.cssdesignawards.com/sites/cedro-web-3-0/45721/).
- **Mission Control, apparently changed:** the award thumbnail shows a black hero, while the [live page](https://missioncontrol.co) is light. Award: [CSSDA](https://www.cssdesignawards.com/sites/mission-control/48282/).
- **MSI "I want it all", stale campaign:** still online, and its page says "The campaign ends on Aug 21st, 2022". Source: [live](https://iwantitall.merci-michel.com/).
- **MSI palette mismatch:** Awwwards lists #2779a7, #49c5b6 and #D14836, which do not reflect the live gradient tokens. Source: [Awwwards](https://www.awwwards.com/sites/msi-i-want-it-all).

### Inferences
- The other live sites were not compared against their award-date versions, so "no change noted" does not mean unchanged.
- Awwwards palettes are a weak signal on their own. For Cerebrium they fit the site well; for MSI and Jantana they do not.

### Gaps
- DNS failures could be temporary or local to this network. Re-check tokyo-beast.com and cedroweb3.ai from another connection before calling them permanently dead.
- Keikku is hosted on a studio subdomain (madebyburo.com). Its status as a long-term URL is unknown.
