# Premium consumer, luxury, automotive, audio, beauty, fashion, hospitality and culture sites with a navy, blue, violet and pink look

Checked 2026-11-06. Target palette: ground #061a2e, blue #1a8fc0, soft violet, pink #f4a2c0, raspberry #c2407a.

**Bottom line:** 8 live sites qualify, but none is an exact colour match, and none is a true luxury house (fashion, jewellery, watches, prestige beauty). The look lives in culture, audio technology and motorsport. Traditional luxury mostly stays on black, white or a single colour, and the 100+ pages tested produced no match there. That result is limited by the method (see Gaps under the first question).

**How to read the numbers**
- Method: headless Chrome at 1440x900, with computed styles read from the DOM and pixels sampled from screenshots.
- "CSS" means a computed style value, read exactly.
- "Sampled" means a median-cut palette cluster from a screenshot. Treat these as estimates: they shift with video frames, overlays and compression.
- "Coverage" is the share of frame pixels within CIE76 ΔE 15 of a target colour. ΔE 15 is loose for very dark colours, so charcoal can count as navy.
- Nearest-pixel ΔE alone means little, because any busy photo contains one pixel near almost anything. Coverage is the useful figure.

## Which sites match? URL, date checked, pages where the look appears

### Takeaway
Two sites have a real blue-violet-magenta glow as a designed brand surface: Vivid Sydney and Dolby. Superblue has the closest disciplined ground and gradient but no pink. Alpine F1 has the closest ground but no glow. The other four match only through photography or video.

### Cited Findings
All sites below were loaded on 2026-11-06 with HTTP 200.

| Rank | Site | Sector | Pages where the look appears | Rating |
|---|---|---|---|---|
| 1 | [Vivid Sydney](https://www.vividsydney.com/) | Culture, festival | Home: glow field behind body sections, sign-up band and footer | Partial (closest overall) |
| 2 | [Dolby](https://www.dolby.com/) | Audio, consumer tech | [Atmos](https://www.dolby.com/technologies/dolby-atmos/) glow graphics and demo band; home "Find your next Dolby experience" band; [Vision](https://www.dolby.com/technologies/dolby-vision/) graphics | Partial |
| 3 | [Superblue](https://www.superblue.com/) | Culture, immersive art | Home: ground, nav pill, banner, ticket buttons | Partial (no pink) |
| 4 | [BWT Alpine F1 Team](https://www.alpinef1.com/) | Automotive, motorsport | Home: navy ground throughout; pink in logo and team kit photos | Partial (ground only, no glow) |
| 5 | [The Cosmopolitan of Las Vegas](https://cosmopolitanlasvegas.mgmresorts.com/en.html) | Hospitality | Home: Black Friday dusk hero, violet page bands | Mood only |
| 6 | [Acura](https://www.acura.com/) | Automotive | Home hero; [ADX page](https://www.acura.com/suvs/adx) hero | Mood only |
| 7 | [teamLab](https://www.teamlab.art/) | Culture | Home hero, teamLab Biovortex Kyoto image | Mood only |
| 8 | [ARTECHOUSE](https://www.artechouse.com/) | Culture | Home hero video only | Mood only |

No site earned an **exact** rating.

**Rejected after loading (useful, because some look like obvious picks)**
- [Apple Intelligence page](https://www.apple.com/apple-intelligence/): now titled "Apple Intelligence and Siri", on a white body (`rgb(255,255,255)`, CSS). It has a black orb panel but no blue-pink field in the frames checked.
- [Jaguar](https://www.jaguar.com/): home showed a black Type 01 hero with warm light, not the pink and blue of the Type 00 launch.
- [Mercedes-Benz](https://www.mercedes-benz.com/en/): black body. Its design tokens include `--wb-blue-05: #00182c`, very close to the target ground, but I did not see it used as a page ground. The dark red and magenta curve art appeared only on a [404 page](https://www.mercedes-benz.com/en/vehicles/electric/).
- [Riyadh Air](https://www.riyadhair.com/): light page with deep violet bands (`#250854`, CSS). Violet only.
- [Sphere](https://www.thesphere.com/): black body with a cyan accent `rgb(5,195,221)` (CSS), and show art supplies the colour.
- [La Mer](https://www.cremedelamer.com/): blue atmospheric holiday hero with no pink.
- [Bombay Sapphire](https://www.bombaysapphire.com/): royal blue behind an age gate, with no pink.
- [Etihad](https://www.etihad.com/en-us/): dark slate-teal ground with no pink.

**Unreachable or unusable**
- 403 or bot wall: [Mugler](https://www.mugler.com/), [TAG Heuer](https://www.tagheuer.com/), [Bulgari](https://www.bulgari.com/en-us/), [Estée Lauder](https://www.esteelauder.com/), [JBL](https://www.jbl.com/), [Gucci Beauty](https://www.gucci.com/us/en/st/capsule/gucci-beauty).
- 404 at the URL I guessed, so the page may exist elsewhere: Mugler Angel, Acura RSX, BMW USA electric, Zeekr EU, Versace beauty, Dyson Airwrap i.d.
- DNS failure: shm-afeela.com. Certificate error: alpine-cars.com.
- [YSL Beauty](https://www.yslbeautyus.com/) rendered blank in headless Chrome. This says nothing about its real look.
- Empress gin: empress1908gin.com served a generic content article and empress1908.com redirected to a parking-style domain. Neither is a verified brand site, so Empress was not assessed.
- [godly.website](https://godly.website/?colors=blue) now redirects (301) to recent.design, and I did not review it.

### Inferences
- The match clusters where the product is light, sound or colour itself. Vivid sells light, Dolby sells perceived colour and sound, and Superblue sells immersive art. In these sectors the gradient depicts the product.
- Luxury houses tend to let the object carry colour on a neutral page. That fits the misses above but is an inference from a limited sample.

### Gaps
- Coverage of luxury is homepage-heavy. Fragrance and campaign microsites are the likeliest home of this look, and many of those pages were blocked, 404 or not tested.
- Automated palette scoring pre-filtered about 120 pages, and I inspected only the top scorers by eye. A site with a low score could still hold one matching section.
- Pages were captured from one location in headless Chrome. Seasonal heroes, especially Cosmopolitan and La Mer, will change.
- Galleries: only the [Awwwards fashion and beauty list](https://www.awwwards.com/websites/fashion-beauty/) was fetched, and it gives no colour data. Lapa, Land-book and siteinspire were not consulted.

## What are the ground, gradient stops, accent and text colours?

### Takeaway
Real gradient CSS is rare here. Only Superblue exposes its brand gradient as CSS; Vivid and Dolby use images or video, so their stops are sampled. All values below are from the sites as loaded, and the targets' pink #f4a2c0 is lighter than anything these sites use at scale.

### Cited Findings

**1. [Vivid Sydney](https://www.vividsydney.com/)**
- Ground: body `#161628` (CSS). Sampled darker in the field: `#09080d`, `#0c0f1f`, `#06060f`.
- Blue-to-violet field, sampled: `#266ef9` → `#2c0788` → `#210a5c` → near-black. Mid-page frame: `#1f4798`, `#122e68`, `#1b074c`.
- Magenta band, sampled: `#8129ce` → `#b525db` → `#ce14d1` → `#eb0fca`.
- Accent: `#ca0076` background, `#fb3bab` text, `#77d4eb` light cyan (all CSS).
- Text: white. White on `#ca0076` is 5.6:1 and white on `#161628` is 17.8:1 (computed).
- Coverage: navy 22.6% on the mid-page frame; blue 2.8%, violet 3.4% and navy 0.6% in the magenta band; target pink 0% and raspberry 0%.
- The glow is not CSS. Only overlay gradients appeared in computed styles.

**2. [Dolby](https://www.dolby.com/)**
- Ground: body `#13141c` (CSS), a blue-tinted charcoal rather than navy. Cards `#1e1f28`-ish (`rgb(30,31,40)`, CSS).
- [Atmos](https://www.dolby.com/technologies/dolby-atmos/) glow, sampled: `#04013d`, `#0e094f`, `#1d1a61`, `#5853c5`.
- Home band gradient, sampled, left to right as rendered: coral `#f46861`/`#f54d57` → magenta `#e222a9` → `#bd27b2` → `#8e2393` → violet `#522792`.
- Accent: button `#3e44fe` (CSS). The token `--color-primary` is `#00b2e1`, but it did not dominate rendered pages.
- Text: white on ground 18.3:1; secondary `#999999` 6.4:1 (computed).
- Coverage: target pink only 0.9 to 1.3% of the band, likely transition pixels. Target blue 0%.

**3. [Superblue](https://www.superblue.com/)**
- Ground: body `#03061a` (CSS), about 60% of the footer frame. Darker and more indigo than #061a2e.
- Gradient (CSS, exact): `linear-gradient(90deg, #1226aa, #8331a7)`, with 135deg and 269deg variants on UI.
- Fade: `linear-gradient(#03061a, transparent 25%)` (CSS).
- Text: `#e6e6e8` on ground, 16.1:1 (computed). No pink or raspberry at scale.

**4. [BWT Alpine F1](https://www.alpinef1.com/)**
- Ground: `#061a4d` (CSS), about 60% of the sampled frame. A second dark `#0c1d2c` (CSS) is the nearest ground to the target of any site here.
- Accent: pure blue `#0000ff` (CSS). Text white, 16.6:1 on `#061a4d` (computed).
- Pink comes from logo and kit only; nearest pixel `#e17cb0` at ΔE 17 and 0% coverage. No atmospheric gradient.

**5. [Cosmopolitan](https://cosmopolitanlasvegas.mgmresorts.com/en.html)**
- Ground `#000000`; band `#612c73` (CSS). Hero image, sampled: `#42223e`, `#6b3959`, `#a85277`. Raspberry coverage 1.8%.
- Generic blue CTA gradient `#373ae5` → `#292cb7` (CSS). Text white, 9.9:1 on the violet band (computed).

**6. [Acura](https://www.acura.com/)**
- Page ground is white on the [ADX page](https://www.acura.com/suvs/adx) (CSS). All colour is in photography.
- Home hero, sampled: `#0f0715`, `#222955`, `#a1527c`, `#bd788e`, `#eb9394`.
- ADX hero, sampled: `#140b2a`, `#352146`, `#b47b87`, `#e7b5a5`.
- The blue car on the home hero sits within ΔE 7 of target blue at 0.3% coverage. Pink-range coverage is 5.4% on that frame, the highest here, though it reads warmer than the target.

**7. [teamLab](https://www.teamlab.art/)**
- Ground `#0e0f0e` (CSS), neutral rather than blue. Hero, sampled: `#3f0919`, `#5c2646`, `#7a3f61`, `#9c738d`. Text white and `#999999` (CSS).

**8. [ARTECHOUSE](https://www.artechouse.com/)**
- Body white; black bands; accent `#2e95ff` (CSS). The hero differs per load: one capture was navy and blue, another red and pink, sampled `#621b2d`, `#43182d`, `#313153`.

### Inferences
- A safe build recipe from these sites: ground in the `#03061a` to `#161628` range, one saturated gradient pair, near-white text. Moving #061a2e towards indigo would align it with the reference set.
- Target #1a8fc0 is a greener, calmer blue than what these sites use (`#266ef9`, `#1226aa`, `#3e44fe`). The blue-to-pink pairing here runs through violet, so a teal-leaning blue would need a violet midpoint to avoid muddy transitions. I did not test this.
- Target pink and raspberry are softer than the magenta on Vivid and Dolby. The softer pair could read as more refined, but no site here demonstrates it at scale.

### Gaps
- Vivid and Dolby stop positions and angles are unknown because the art is not CSS. The colours are sampled estimates.
- Motion was not measured. Captures are stills, and background tabs may throttle animation.
- Vivid's header pink CTA colour was seen visually but not isolated in sampling.

## What makes it feel premium rather than cheap?

### Takeaway
The premium effect comes from restraint around the colour: one gradient surface at a time, custom or well-set type, generous dark space, and real imagery. Discounts, dense modules and colour on every element remove it. All observations below are my judgement from the captures, not measured facts, except the computed type values.

### Cited Findings
- [Vivid Sydney](https://www.vividsydney.com/) sets its H1 at 96px, weight 400, -2px tracking in InclusiveSansAlt (CSS). Colour stays in the field behind a quiet layout, and full-bleed event photography does the rest.
- [Dolby](https://www.dolby.com/) uses Avenir Next at 80px, -1.5px tracking (CSS). Most of the page stays charcoal and gradient appears in contained graphics and one band.
- [Dolby Atmos](https://www.dolby.com/technologies/dolby-atmos/) renders glow as dimensional orbs and light forms, so it reads as material rather than a flat fill.
- [Superblue](https://www.superblue.com/) pairs Apercu Pro with Apercu Mono labels (CSS). Gradient is limited to the banner and buttons while the ground stays dark, and artwork photography supplies the rest.
- [Alpine F1](https://www.alpinef1.com/) uses a custom Alpine typeface at up to 112px, weight 600 (CSS). A proprietary typeface and consistent navy read as a team identity, but dense news modules read as sport media rather than luxury.
- [teamLab](https://www.teamlab.art/) reads as a gallery: neutral ground, Helvetica (CSS), small text, and the artwork at large scale.
- Cheapening signals seen directly: "BLACK FRIDAY OFFER" over the [Cosmopolitan](https://cosmopolitanlasvegas.mgmresorts.com/en.html) hero with a promo popup; [ARTECHOUSE](https://www.artechouse.com/) uses all-caps Poppins (CSS) with bright default-looking blue buttons on white; [Acura](https://www.acura.com/) adds price and lease offers and red CTAs over an otherwise premium photo.

### Inferences
- Five levers separate these from cheap gradient sites: gradient as light rather than as decoration; one colour moment per view; low or tight display type rather than gradient-filled heading text; real photography; and neutral text with no competing accents.
- None of the eight uses gradient-clipped headline text in the frames checked. That is a useful rule, though it is an observation from a small sample.
- Vivid is the warning case too: its full-strength magenta band is exciting rather than expensive. For a premium feel, the darker footer frame is the better reference.

### Gaps
- Scroll motion, transitions and hover behaviour were not assessed, so the "motion" part of this question is unanswered.
- No brand case study confirmed design intent. A search snippet described Dolby mesh gradients as brand "mood lighting", but [that page](https://www.dolby.com/behind-login/mock-pages/dolby-brand-design) sits behind a login and I could not read it, so treat it as unverified.
- No award claims are made for any site, because none were checked.

## Rank each: exact colour match, partial, or mood match only

### Takeaway
Exact: none. Partial: Vivid Sydney, Dolby, Superblue, Alpine F1. Mood only: Cosmopolitan, Acura, teamLab, ARTECHOUSE.

### Cited Findings
| Site | Rating | Ground vs #061a2e | Blue | Violet | Pink / raspberry | Glow | Premium strength |
|---|---|---|---|---|---|---|---|
| [Vivid Sydney](https://www.vividsydney.com/) | Partial | Close, more indigo | Too royal (`#266ef9`) | Yes | Too magenta (`#eb0fca`) | Strong | Medium: public festival, not luxury |
| [Dolby](https://www.dolby.com/) | Partial | Charcoal, `#13141c` | Indigo (`#3e44fe`) | Yes | Magenta to coral, band only | Medium, contained | High |
| [Superblue](https://www.superblue.com/) | Partial | Darker, `#03061a` | Deep (`#1226aa`) | Yes (`#8331a7`) | None | Weak, UI only | Medium to high |
| [Alpine F1](https://www.alpinef1.com/) | Partial | Best (`#0c1d2c`; main `#061a4d`) | Pure `#0000ff` | No | Logo and kit only | None | Medium |
| [Cosmopolitan](https://cosmopolitanlasvegas.mgmresorts.com/en.html) | Mood | Black | Weak | `#612c73` | Dusky, in photo | Photo only | Medium, weakened by promo |
| [Acura](https://www.acura.com/) | Mood | White page | Car only | Dusk tones | Warm pink, in photo | Photo only | Medium |
| [teamLab](https://www.teamlab.art/) | Mood | Neutral `#0e0f0e` | Trace | Trace | Muted, in art | Artwork | High |
| [ARTECHOUSE](https://www.artechouse.com/) | Mood | White page | Video | Video | Video | Video, varies | Low to medium |

### Inferences
- For the closest colour reference, use Vivid's blue-violet footer field. For the most premium reference, use Dolby's Atmos sections. For a directly reusable CSS recipe, use Superblue.
- "Premium strength" is my own judgement, not a measured value.

### Gaps
- No site combines all target colours at the target lightness. The soft pink #f4a2c0 at scale on a navy ground was not found in any tested site in this sector.
