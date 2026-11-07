# Premium tech, AI, fintech, crypto, enterprise and creative-tool sites: navy with blue, violet and pink

Target palette: ground #061a2e, blue #1a8fc0, soft violet, pink #f4a2c0, raspberry #c2407a.

All sites checked 2026-11-06 in headless Chromium at 1440x900, sRGB. Numbers marked CSS are computed styles read from the live DOM. Numbers marked sampled are pixels from my screenshots. Numbers marked est are visual estimates. Distances are CIE76 delta-E to the target (under about 3 is hard to see, over 20 is a clearly different colour). "Source" links point to the page I loaded; the observation is my own capture of that page.

Method limits that affect every number below:
- Screenshots wrapped at about 8192 px, so the bottom of pages taller than that repeated the top of the page. Page-share figures below use DOM positions or the first 8192 px only.
- Full-page "closest pixel" matches are meaningless on photo-heavy pages, so I report colours that hold real area, not single-pixel hits.
- WebGL ran on a software renderer. Video colours are single frames. Frame.io's hero video did not render.

## Which sites match? (URL, date, page)

### Takeaway
Screening 163 sites gave no exact five-colour match. Ten are worth keeping: Gamma is the closest whole arc, Plaid the closest blue and ground, Okta the richest dark-to-raspberry glow, and the other seven are partial or mood references.

### Cited Findings
All checked 2026-11-06.

| Rank | Site | Sector | Page where look appears | Verdict |
|---|---|---|---|---|
| 1 | [Gamma](https://gamma.app) | AI creative tool | Home: hero, and closing band "How good ideas get into the universe" | Partial, closest arc |
| 2 | [Plaid](https://plaid.com) | Fintech | Home: hero, closing call to action, footer | Partial, closest ground and blue |
| 3 | [Okta](https://www.okta.com) | Enterprise security | Home: hero, "Transform your identity" panel | Partial |
| 4 | [Workato](https://www.workato.com) | Enterprise AI | Home: hero, "One unified AI platform" | Partial, ground only |
| 5 | [Moonbeam](https://moonbeam.network) | Crypto | Home: whole page | Partial, accent stops only |
| 6 | [Temporal](https://temporal.io) | AI infrastructure | Home: hero | Mood |
| 7 | [Superhuman](https://superhuman.com) | AI productivity | Home: hero | Mood |
| 8 | [Blockchain.com](https://www.blockchain.com) | Crypto | Home: hero card | Mood |
| 9 | [Frame.io](https://frame.io) | Creative tool | Home: whole page | Mood |
| 10 | [Ondo Finance](https://ondo.finance) | Crypto, finance | Home: hero | Mood |

- Scope: 163 unique URLs loaded. 13 timed out in the first pass from my own overload, and all 13 loaded on retry — [Temporal](https://temporal.io), [Pulumi](https://www.pulumi.com), [Together AI](https://www.together.ai), [Fireworks](https://fireworks.ai), [Arbitrum](https://www.arbitrum.io), [Sui](https://sui.io), [Krea](https://krea.ai), [Retool](https://retool.com), [Glean](https://glean.com), [Synthesia](https://www.synthesia.io), [Paxos](https://www.paxos.com), [Linea](https://linea.build), [Anchorage](https://www.anchorage.com).
- Expected matches that failed. These are worth reporting because older memories of these brands are now wrong:
  - Aave's home is on a white ground with WebGL canvases — [Aave](https://aave.com).
  - Wiz's home is 92% near-white in the hero — [Wiz](https://www.wiz.io). An audit calls its mark electric teal and says the category leans on navy-blue gradients — [STFO audit](https://www.stfo.io/research/audits/wiz/).
  - Starknet's ground is neutral #0b0b0b (CSS) — [Starknet](https://www.starknet.io).
  - LaunchDarkly's home is near-black and lime-led, with body #191919 (CSS) — [LaunchDarkly](https://launchdarkly.com).
- Navy grounds with no pink. Useful for ground reference only:
  - Workato's section #041c34 (sampled) is delta-E 3.0 from target — [Workato](https://www.workato.com).
  - Pyth's dark panels hold #0c1c2c (sampled, delta-E 3.3), but its hero is split with a light panel and its accent is teal — [Pyth](https://pyth.network).
  - MongoDB's hero is 76% within 10 delta-E of the target navy (sampled) — [MongoDB](https://www.mongodb.com).
  - Crypto.com's hero is 91% by the same test, with main colour about #0c0c1c — [Crypto.com](https://www.crypto.com).
  - Twilio's hero is 67% by the same test, around #040c24 — [Twilio](https://www.twilio.com).
- Lovable has a real blue, violet and pink field, but on a white page, so it fails the ground test — [Lovable](https://lovable.dev).

### Inferences
- The full target palette is rare in premium tech. Large brands that go dark tend to choose a neutral ground or one saturated hue, and pink usually arrives only inside imagery.
- Teal has replaced pink as the partner to navy in fintech and enterprise: Plaid, Workato and Pyth all do this.

### Gaps
- Godly, Land-book, Lapa Ninja and Awwwards gave no usable listing (see the last section). The sample came from my own candidate list, so a smaller studio-built match may exist that I never tested.
- I checked desktop only. Mobile rendering is untested.

## What are the ground, gradient stops, accent and text colours?

### Takeaway
Plaid's #01172e (delta-E 2.9) and Workato's #041c34 (3.0) nearly equal the target ground. No site has raspberry #c2407a as a large area; Gamma's pink stops #fa86c5 to #fd91d1 are the nearest pink with real area, and are hotter than target.

### Cited Findings
Each entry gives ground, stops, accent, text.

**[Gamma](https://gamma.app)**
- Ground: hero top #002253 (CSS, delta-E 20.9). Closing band top #021736 (sampled, delta-E 8.8).
- Hero gradient (CSS): `linear-gradient(#002253 0%, #0b2e79 30%, #0740df 60%, #2c88f7 85%, #63acf7 100%)`.
- Closing band stops at x=1400 (sampled, top to bottom): #021736, #011a40, #03214f, #113c76, #3c75d3, #8383df, #e796e6, #fd91d1.
- At x=40 the same band reads #e082e4 then #fa86c5, with images crossing the column.
- Accent: nav button #0540ad, primary button white with #002253 text (CSS).
- Text: #ffffff, sub-copy white at 92% (CSS).
- Hero area: #06296a holds 29%, #0a3fbf holds 27%, #12a5fb holds 12% (sampled).

**[Plaid](https://plaid.com)**
- Ground: `linear-gradient(95deg, #01172e 27.81%, #012e37 76.6%)` sits under the hero (CSS). #01172e is delta-E 2.9 from target. The dark footer looks the same, around #04142c (sampled).
- Field (CSS): `linear-gradient(-210deg, #07578c 27%, #0e94d8 60%, #42f0cd 92%)`.
- Blue in the hero is about #107bb3 over 50% of area (sampled, delta-E 9.7). #0e94d8 is delta-E 11.3.
- Violet and pink: engraving strokes around #2f3887 to #383d89 (sampled), a lilac band #d8b0fb (sampled), magenta in the lower engraving (est). Stat text gradient `254deg, #6748d8 to #b14edb` (CSS).
- Headline gradient (CSS): `radial-gradient(circle at 0 0, #86ef5a, #10d0b7 38%, #fff 70%)`, so its lead accent is green-teal, not pink.
- Text: #ffffff (CSS).

**[Okta](https://www.okta.com)**
- Ground: left edge of hero #010e50 to #02115e, falling to #110945, then #351029 at the base (sampled). This is ultramarine, delta-E 35 from target.
- Right edge: #061351, #1e2261, #2b0a35, #3a1c57, #702968 (sampled). The very bottom edge turns rosier, about #8f3060 (est).
- Accent: button #0131ff; white button #fbfbfa with #1e1e1e text (CSS).
- Text: #fbfbfa (CSS).
- Hero area: #0e1660 at 22%, #31328e at 8%, #4c2f8d at 4%, #451b5b at 2% (sampled).

**[Workato](https://www.workato.com)**
- Ground: section #042441 (CSS, delta-E 7.7) on 84% of hero area (sampled). Panel `linear-gradient(242deg, #042441, #052c50)` (CSS). Footer and later sections about #041c34 (sampled, delta-E 3.0).
- Text gradient (CSS): `90deg, #8fe8ea 9%, #a4c3ea 70%, #c3a9ff`.
- Accent: #00d4d8 button with #052c50 text (CSS).
- Secondary blues: #1d5caa, #5890d6 (sampled).
- Pink: none in the areas I sampled.

**[Moonbeam](https://moonbeam.network)**
- Ground (CSS): `radial-gradient(100% 60% at 50% -6%, #241246 0%, #140a2a 42%, #08040f 100%)`. #08040f is delta-E 13.9. Body #060b16 is delta-E 11.1.
- Text gradient (CSS): `100deg, #f6c9d8, #c9a9ff 40%, #7ee0da 85%`. #f6c9d8 is delta-E 19.0 from target pink, because it is much paler.
- Grid lines: #b592ff at 5 to 6% alpha (CSS).
- Button: white with #12082a text (CSS).
- Text: #eaf6f2, paragraphs rgba(238,234,246,.66) (CSS).

**[Temporal](https://temporal.io)**
- Ground: body #141414 (CSS, delta-E 16.0, neutral).
- Hero base `254deg, #211b4e 28%, #141414 100%` (CSS).
- Overlays (CSS): `263deg, rgba(219,53,208,.8) 18%, rgba(182,100,255,.64) 49%, rgba(182,100,255,.16) 70%` and `92deg, rgba(68,76,231,.5) 27%, rgba(31,241,165,.5) 84%`.
- Rendered hero: right edge #7f2e96 to #553561; left edge #15151c to #1f304a (sampled).
- Accent: indigo #444ce7 to violet #b664ff (CSS, on a border gradient); the button itself looks the same (est).
- Text: #f8fafc, #cacbf9, #7f86f1 (CSS).

**[Superhuman](https://superhuman.com)**
- Ground: light page, with hero dusk sky.
- Hero CSS fallback: `linear-gradient(to left bottom, rgba(168,164,216,.5), rgba(107,165,232,.5), rgba(176,112,192,.6), rgba(144,136,208,.5))` over `linear-gradient(#7c9ad3, #314682)`.
- Rendered hero: #7195ce over 43% of area; left edge #6686bf, #969fd5, #b59fce (sampled).
- Text: #ffffff (CSS).
- Later bands: #0c4444 and #421d24 (sampled).

**[Blockchain.com](https://www.blockchain.com)**
- Ground: about #0c0c0c (sampled).
- Hero card stops: #411bad, #2b1067, #190f5e, #3c0e5a, #65179b (sampled).
- Accent: #da123e button (CSS).
- Text: #ffffff, #cccccc (CSS).

**[Frame.io](https://frame.io)**
- Ground: about #0c0c1c (sampled); `195deg, #0a001e, #02000a 80%, #0c1d32` (CSS).
- Radial bloom #482a69 (CSS).
- Accent: about #645dff (sampled).
- Text: #fcfcfc, #dedfee, rgba(234,234,255,.5) (CSS).
- Pink: none. Nearest ground tone #0e0f20 (CSS) is delta-E 7.0.

**[Ondo Finance](https://ondo.finance)**
- Hero is a dusk video frame: #6b88d5 over 52% of area, #344576 over 7% (sampled). Warm pink exists only in building reflections (est).
- Overlay: black 0 to 36% vertical scrim (CSS).
- Text: #ffffff. Button #f0f0f0 with black text (CSS).

### Inferences
Colour verdict for each target stop:
- Ground: Plaid and Workato hit it.
- Blue: Plaid is closest. Gamma runs too ultramarine, with #2c88f7 at delta-E 38.8.
- Violet: Moonbeam's #c9a9ff and Workato's #c3a9ff are soft and very usable.
- Pink: Gamma has area. Moonbeam has softness.
- Raspberry: nobody has it at scale. Okta's base glow #702968 (delta-E 30.5) and Superhuman's #b65094 in a small area (delta-E 15.3) are the nearest I sampled.

### Gaps
- Okta's and Plaid's pink and magenta tones sit inside images, so I could not get token values.

## How is the gradient delivered, and how much of the page does it take?

### Takeaway
None relies on one CSS blur blob. The strong sites stack layers: CSS base, then canvas, video or artwork on top. Most confine the colour to 4 to 35% of the page and leave the rest calm.

### Cited Findings
Page share is my estimate from DOM heights.

- [Gamma](https://gamma.app): layered CSS vertical gradient, plus a 1440x792 canvas with stars and jellyfish. No WebGL context was detected on it. Blurred clouds join the next section. Colour field: hero 792 px of 9118, closing band about 800 px, so about 17% for the dark sky. Pale-blue sky gradient carries down the page: a 4513 px layer in CSS.
- [Plaid](https://plaid.com): CSS base, 1440x929 canvas, engraved portrait image, gradient-clipped H1. Fine contour-line texture covers the field. Rainbow hairline rings on buttons. About 21% of page for the two blue fields, plus navy footer.
- [Okta](https://www.okta.com): illustrated or rendered hero scene with a dark left scrim `90deg, rgba(0,0,0,.6) to transparent 70%` (CSS). Gradient panel is a bitmap asset, `desktop-homepage-05-closer-gradient-png.webp`, not CSS. 13 glass elements with backdrop-filter. Dark colour is about 35% of page.
- [Workato](https://www.workato.com): flat colour and subtle CSS gradients, with dot grids `radial-gradient(1.5px)` and hairlines. Gradient only in text and 3D stack artwork. Navy holds about half the page, by band count.
- [Moonbeam](https://moonbeam.network): CSS only, plus SVG orb and grid. No canvas, no video, no glass, no grain detected. Radial wash covers the 4083 px page.
- [Temporal](https://temporal.io): CSS stack with `stars.avif` and `grid-perspective.avif`, and `noise-texture.svg` loaded. Hero is 496 px of 13089, about 4%.
- [Superhuman](https://superhuman.com): `hero-background.mp4` full-bleed, CSS fallback, and glass UI cards using 8 backdrop-filter elements. Hero is 900 of 6113 px, about 15%.
- [Blockchain.com](https://www.blockchain.com): 1280x530 canvas in a rounded card, about 5% of page. Rest is white or black.
- [Frame.io](https://frame.io): canvas 1705x1364, video, large radial blooms, 20 backdrop-filter elements. Dark throughout, but saturated colour is low at about 4% of the captured frame.
- [Ondo Finance](https://ondo.finance): three stacked full-bleed Cloudinary videos, 1440x900, CSS scrim. DOM height is 900 px, so scroll is script-driven and page share could not be measured.

Grain: `feTurbulence` count was 0 on all ten sites. Only Temporal loaded a named noise asset. Plaid's contour lines and Gamma's star field serve the same anti-banding role.

### Inferences
- Bitmap or video is the common route to expensive-looking colour: Okta, Ondo and Superhuman all use it, so banding and blur control are solved before the browser sees the gradient.
- For a project this size, CSS base plus a pre-rendered dithered image gives most of the effect at low cost. Runtime WebGL does not look necessary: no WebGL context was detected on the Plaid or Gamma hero canvases, and Okta showed no canvas at all.
- Colour rationing matters: colour fields take about 4 to 35% of most of these pages, not the whole page.

### Gaps
- Whether the Plaid and Gamma canvases are 2D or offscreen is unconfirmed.
- I could not identify the element behind Gamma's closing band; an image query returned nothing, so delivery there is unconfirmed. It looks like illustrated artwork over a gradient (est).
- Okta's hero scene source is unconfirmed. A final media query returned no elements.

## What separates them from the blue-purple AI default?

### Takeaway
The gap comes from a subject and a material, not from the colour. Sites read as premium when the gradient depicts something (night sky, engraving, dusk) or is held inside a tight system. All points in this section are my design judgement from the captures; none is a measured fact.

### Cited Findings
Observed facts behind the judgements:

- Subject instead of blob: Gamma's gradient is a night sky falling into pink cloud, with jellyfish and an illustrated figure — [Gamma](https://gamma.app). Plaid's is a banknote engraving of Benjamin Franklin holding a phone — [Plaid](https://plaid.com). Superhuman and Ondo use real dusk footage — [Superhuman](https://superhuman.com), [Ondo Finance](https://ondo.finance).
- Off-default ground: Plaid's navy shifts to teal-navy `#01172e to #012e37` — [Plaid](https://plaid.com). Workato's navy is hue-consistent across four tones — [Workato](https://www.workato.com). Temporal holds neutral #141414 so colour is contained — [Temporal](https://temporal.io).
- Custom or serif type:
  - Okta sets a 64px serif, SeasonMix, at weight 400 — [Okta](https://www.okta.com).
  - Workato uses Besley serif — [Workato](https://www.workato.com).
  - Plaid uses Plaid Sans at 76px with -3.4px tracking — [Plaid](https://plaid.com).
  - Superhuman uses Super Sans VF at weight 440 — [Superhuman](https://superhuman.com).
  - Frame.io uses FrameGothic — [Frame.io](https://frame.io).
  - Gamma pairs ESBuild display with PPMori — [Gamma](https://gamma.app).
- Third hue: Plaid adds green-teal, Gamma adds sky cyan, Workato adds cyan, Temporal adds a green-blue overlay — [Plaid](https://plaid.com), [Gamma](https://gamma.app), [Workato](https://www.workato.com), [Temporal](https://temporal.io).
- Precise secondary detail: Plaid's rainbow button rings, Workato's dot grids and hairlines, Temporal's perspective grid and stars.

Cautionary case: Moonbeam has much of the template recipe. It pairs Space Grotesk, gradient-clipped headline text, purple-black ground and a faint grid — [Moonbeam](https://moonbeam.network). Its colours are the right ones, and a thin italic second line and the orb lift it, but on craft it ranks below its colour match.

### Inferences
Tests to apply to a design:
1. Can you say what the gradient is a picture of? If no, it reads as template.
2. Is the ground a designed tone with a hue shift, or a default dark?
3. Is there a non-Inter, non-Space Grotesk typeface doing visible work?
4. Is there a third hue that stops it being blue into purple?
5. Is colour rationed, with calm sections between saturated ones?
6. Do panels and hairlines look drawn, not glowing borders with blur?

Plaid and Gamma also show that a playful subject does not reduce the premium read when execution is detailed. Okta's stock-like human scene is the weakest part of an otherwise rich page: I would borrow its glow, not its image.

### Gaps
- No independent critic or user data on premium perception was found. The rank reflects my judgement only.

## Rank: exact, partial or mood

### Takeaway
Exact: none. Partial: Gamma, Plaid, Okta, Workato, Moonbeam. Mood only: Temporal, Superhuman, Blockchain.com, Frame.io, Ondo Finance.

### Cited Findings
Ranks use the colour values in the second section. Rule used: exact needs ground, blue, pink and raspberry all within about 10 delta-E as real areas. Partial needs at least two stops close, or the full arc in another tuning. Mood is a similar feeling with different values.

- [Gamma](https://gamma.app) — Partial. Navy and pink are close and the full arc exists, but blue is too ultramarine and pink too hot.
- [Plaid](https://plaid.com) — Partial. Ground and blue are close. Pink is replaced by teal and appears only as lilac and engraving tint.
- [Okta](https://www.okta.com) — Partial. Dark-to-rose arc, but ultramarine ground.
- [Workato](https://www.workato.com) — Partial. Ground is near-exact and violet is close. No pink.
- [Moonbeam](https://moonbeam.network) — Partial. Pink, violet and aqua stops are close in mood, but only in text, on an aubergine-black ground.
- [Temporal](https://temporal.io) — Mood. Neutral ground, magenta-violet.
- [Superhuman](https://superhuman.com) — Mood. Periwinkle dusk on a light page.
- [Blockchain.com](https://www.blockchain.com) — Mood. Black, indigo-violet, red accent.
- [Frame.io](https://frame.io) — Mood. Near-navy ground, indigo accent, no pink.
- [Ondo Finance](https://ondo.finance) — Mood. Dusk blue photography.

### Inferences
Best reference by purpose:
- Overall composition: Gamma's closing band.
- Ground and blue values: Plaid.
- Raspberry-to-navy glow: Okta's hero base and panel corner.
- Soft violet and pale pink text ramp: Moonbeam.
- Restraint: Temporal.

### Gaps
- The directories could not supply candidates:
  - [Land-book](https://land-book.com/?color=blue) returned 403.
  - [Lapa Ninja](https://www.lapa.ninja/category/gradient/page/3) returned 403.
  - An [Awwwards colour path](https://www.awwwards.com/websites/colors/blue/) returned 404.
  - The [Awwwards gradient listing](https://www.awwwards.com/websites/gradient/) gave four entries, none relevant.
  - [Godly's fintech URL](https://godly.website/websites/fintech) redirected to [recent.design](http://recent.design/?ref=godly), which does not mention Godly and gave no site list.
  - [Dark Mode Design](https://www.darkmodedesign.com/) and [SaaS Landing Page](https://saaslandingpage.com/tag/dark/) loaded, but gave no finalist.
- I report no awards for any site. None were verified.
- Sites change hero art often, so re-check before using these as live references. Okta and Maxon both showed campaign heroes. Maxon was scanned and dropped: black ground, with iridescent product art.
