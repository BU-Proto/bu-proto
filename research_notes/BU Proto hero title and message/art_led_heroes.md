# Art-led full-screen heroes: how the best place a title and a one-line statement over living art

## How do Lusion, Oryzo, craft.wild.as, Active Theory, Igloo Inc, Linear, Vercel, Stripe, Family and recent Awwwards or FWA Site of the Day winners place type over a moving full-bleed picture?

### Takeaway
Almost none of them puts a medium-sized, centred headline and paragraph on top of the brightest part of the moving picture. The award-level moves are four.
- Keep type out of the art's light: in corners, in a band, in a frame, or on the dark side of the composition.
- Make the title so big it becomes a second picture (Grail, Oryzo, Zentry).
- Let the art carry or build the title (Messenger, Unseen, Igloo).
- Show no title at all (Active Theory).

The heroes that read best put type only where the art is near-black, measured at 16:1 to 20:1. The ones that let bright art pass under the type fall to about 2:1 to 3:1 at the bright spots.

### Cited Findings

#### Method used for every "measured" number in these notes
- Pages were loaded on 2026-11-07 in headless Chrome for Testing 158 using the Mac's GPU. Its WebGL renderer reported "ANGLE Metal Renderer: Apple M5", so the art is hardware-rendered, unlike the software-rendered captures in this folder's earlier notes.
- Viewports were 1440x900 at 1x, and 390x844 at 2x with a phone user agent and touch. Pages settled 12–14 s, or 30 s on desktop and 22 s on phone for Lusion, Oryzo, Active Theory and Igloo.
- Type metrics are computed styles of visible DOM text. Letters split into separate elements were clustered back into lines by position.
- Contrast comes from a second still taken with all DOM text made transparent. Text colour was compared with the 50th percentile (p50), 95th percentile (p95) and maximum relative luminance of the pixels in the text's box, using the WCAG formula.
- Raw captures, one folder per site, are in `/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/out` and `.../hero-research/outC`. Each holds `d-*.png` and `m-*.png` stills, a `d.webm` load video, a `sheet.png` timeline and `d.json`/`m.json` metrics.
- Machine load averages ran 40–360 on 10 cores during the first two batches, so load timings from those batches (Lusion, Linear, Metalab, Zentry) are stretched. Their order is reliable. The third batch ran at about 40.
- Text drawn in WebGL or SVG is not in the DOM: Oryzo's wordmark, Igloo's whole UI, and the titles of Unseen and Messenger. Their sizes are estimates read off the screenshots.

#### The named sites
- **Lusion** (Lusion v3 was Awwwards Site of the Year 2023, with a Developer Award). The hero does not put type over the art.
  - A light page carries the LUSION wordmark top-left, then a 3-line statement as the h1, with buttons top-right. The h1 is Aeonik 36px (2.5vw), weight 400, line-height 1.1, at x 28%, y 4.9%, 36% wide.
  - The WebGL art plays inside a rounded dark card, about x 5–95% and y 22–94% (screenshot). A "SCROLL TO EXPLORE" line and four + marks sit under it.
  - Phone: h1 23.4px (6vw), 3 lines, at y 6.8%.
  - Sources: [lusion.co](https://lusion.co/) (measured); award: [Awwwards Lusion profile](https://www.awwwards.com/lusion/).
- **Oryzo** (by Lusion; Awwwards Site of the Month April 2026, with a Developer Award).
  - A cream wordmark sits over the photographed scene, top-left. It spans about 42% of the width, with a cap height of about 128px, or 14% of the height (screenshot estimate; not DOM text).
  - An 18px uppercase kicker sits above its right end. The product sits dead centre.
  - A 3-line statement sits right-middle: 28.5px (2.0vw), weight 400, line-height 1.26, at x 64.4%, y 43.8%, 30.8% wide (15.5em). A frosted caption card sits bottom-left and a video thumbnail bottom-right.
  - All hero type is one colour, rgb(255,237,215).
  - Contrast: the wordmark reaches 15.1:1 against the median art but 2.1:1 at p95. The statement reaches 7.6:1 median and 4.3:1 at p95.
  - Sources: [oryzo.ai](https://oryzo.ai/) (measured); award: [Awwwards Lusion profile](https://www.awwwards.com/lusion/).
  - DesignRush calls it a fictional product site showing Lusion's capabilities, led by Edan Kwan. This came from a search snippet; the page itself failed to load. [DesignRush](https://www.designrush.com/best-designs/websites/oryzo-website-design)
- **craft.wild.as** (white page). The moving pixel field runs as a band across the middle of the screen and never goes under any type.
  - Title "Craft, engineered.": Sneak 74.9px (5.2vw), weight 400, uppercase, line-height 0.92, tracking −0.035em, top-left at x 9.2%, y 1.9%.
  - A 20px uppercase justified descriptor at x 63.5% and a 13px right-aligned tag complete a three-part top row.
  - A 46px (3.2vw) statement sits below the band at y 86%.
  - Phone: title 32px (8.2vw).
  - Source: [craft.wild.as](https://craft.wild.as/) (measured).
- **Active Theory** shows no title.
  - An ASCII preloader (a dome of slash glyphs around a counter) gives way to a centred glass emblem with particles.
  - The only type is a glass capsule nav top-right (WORK and CONTACT) and a small mono "SCROLL DOWN" hint.
  - Source: [activetheory.net](https://activetheory.net/) (measured).
- **Igloo Inc** (Awwwards Site of the Year 2024, built with abeto) uses a four-corner HUD.
  - Logo and copyright lines top-left, a right-aligned mono manifesto top-right, and "Scroll down to discover." plus "Sound: Off" bottom-left. The igloo art fills the centre.
  - There is no DOM text. The case study says the UI is drawn in WebGL so glitches and SDF letter-scrambles stay cheap.
  - Sources: [igloo.inc](https://www.igloo.inc/) (measured); [Awwwards case study](https://awwwards.com/igloo-inc-case-study.html); Site of the Year from a search summary of [Awwwards annual awards 2024](https://www.awwwards.com/annual-awards-2024/site-of-the-year), page not opened.
- **Linear.** The art is the product UI, not a full-bleed picture.
  - h1: Inter Variable 64px (4.4vw), weight 510, line-height 1.0, tracking −0.022em, at x 5.4%, y 29.4%, with a 15px grey sub (#8A8F98).
  - Phone: 38px (9.7vw) at y 22.9%.
  - Source: [linear.app](https://linear.app/) (measured).
- **Vercel.** A centred black prism with a soft shadow is the art, and the type flanks it.
  - Title "Agentic Infrastructure" on the left: Geist 64px (4.4vw), weight 400, line-height 1.0, tracking −0.06em, at x 1.7%, y 35.3%, 24% wide.
  - A 3-line 16px list on the right at x 73.6%, and two CTAs under the title.
  - Phone: the object moves to the top and the title centres below it at y 52%, 48px (12.3vw).
  - Source: [vercel.com](https://vercel.com/) (measured).
- **Stripe.** The WebGL ribbon fills the right and top.
  - The left block is one 4-line h1: sohne-var 48px (3.3vw), weight 300, line-height 1.15, tracking −0.02em. The title sentence is near-black and the statement sentence a lighter blue-grey, in the same element.
  - A duplicate h1 layer uses `mix-blend-mode: hard-light`, so ribbon colour bleeds into letters where it passes behind them.
  - Phone: 34px (8.7vw).
  - Source: [stripe.com](https://stripe.com/) (measured).
- **Family** is the inverse of a centred bloom: two illustrated clusters flank an empty centre.
  - The title and a 17px sub sit centred in the gap. Title: 68px (4.7vw), weight 500, line-height 1.1, tracking −0.02em, at y 23.7%.
  - Phone: 44px (11.3vw).
  - Source: [family.co](https://family.co/) (measured).

#### Recent winners and other art-led references
- Awwwards Sites of the Day from the last month include:
  - Grail (4 Nov 2026, plus a Developer Award), DeepBook (3 Nov), Grids (2 Nov) and MECHA (31 Oct).
  - Spyker Cars (30 Oct), Emotion Agency (22 Oct), Ascension — Pegassi (21 Oct) and FORMAT (19 Oct).
  - OFFFForum (16 Oct) and Overworld Audio (15 Oct).
  - Source: [Awwwards Sites of the Day](https://www.awwwards.com/websites/sites_of_the_day/).
- The FWA home page, rendered 2026-11-07, lists recent winners. It says the FWA moved to a new site in November 2026. Source: [thefwa.com](https://thefwa.com/).
  - Justin Jefferson (6 Nov 2026), ORVAE (5 Nov), Garuda 2026: The Locker Room (4 Nov).
  - Adrien Quéchon 2026 Website (3 Nov), Oh là là Ride (1 Nov).
- **Grail** (Site of the Day and Developer Award). Black ground with floating 3D cards.
  - Title "RECLAIM YOUR LIFE" spans the width at the top on one line: PP Pangaia 145.2px (10.1vw), weight 300, uppercase, line-height 0.88, tracking −0.01em, at x 2.8%, y 12.6%, 94.4% wide.
  - At the title's centre the WebGL canvas stacks above the h1 (`elementsFromPoint` returns the canvas first), so cards can pass in front of the letters.
  - The one-line statement rides in the top bar, centred: 15px, 72% white, 2 lines. The only CTA is a pill top-right.
  - Contrast: 18.9:1 at p95, because the cards stay mostly below the title.
  - Phone: 60.5px (15.5vw) on 2 lines, centred at y 12%.
  - Sources: [grail-app.com](https://grail-app.com/) (measured); [Awwwards](https://www.awwwards.com/sites/grail).
- **DeepBook** (Site of the Day). A field of short vertical strokes curving in arcs on black.
  - Title "Where Sui Finance Starts" sits centred in the lower third: TWK Everett 81px (5.6vw), weight 500, line-height 1.0, tracking −0.025em, at y 70.2%, 68% wide.
  - An 18px sub sits at y 81.5%, with two CTAs below.
  - The field stays black under the title: 19.9:1 at p95.
  - Phone: 58.2px (14.9vw), 3 lines, centred at y 40%.
  - Sources: [deepbook-v2-wip.webflow.io](https://deepbook-v2-wip.webflow.io/) (measured); [Awwwards](https://www.awwwards.com/sites/deepbook).
- **Emotion Agency** (Site of the Day). A full-bleed purple 3D landscape, with the brand glyph rendered as a centred particle cloud.
  - Title: Emotion Serif 96px (6.7vw), weight 300. An italic lead word, then three lines of caps, low and left from y ≈64%.
  - A 12px IBM Plex Mono uppercase kicker sits above it. Entry goes through an enter-with-or-without-audio gate.
  - Phone: 46px at y 67%.
  - Sources: [emotion-agency.com](https://emotion-agency.com/) (measured); [Awwwards](https://www.awwwards.com/sites/emotion-agency-1).
- **Spyker Cars** (Site of the Day). A car film with a centred stack of condensed caps.
  - Title: futura-pt-condensed 56px (3.9vw), weight 500, line-height 0.85, tracking +0.04em, at y 41%, 27% wide. A tiny kicker above, one CTA below.
  - Over the car the title reaches 13.1:1 median but 2.8:1 at p95 and 1.7:1 at the brightest pixel.
  - Phone: 56px (14.4vw), 3 lines.
  - Sources: [spykercars.com](https://www.spykercars.com/) (measured); [Awwwards](https://www.awwwards.com/sites/spyker-cars).
- **OFFFForum** (Site of the Day). A dark event film with a large wordmark top-left and a ruled info table.
  - The statement is the h1, centred in the lower third in serif caps: Forvm 45px (3.1vw), line-height 0.96, at y 72%, 47% wide, 4 lines. One pill CTA.
  - The film is darkened: 8.2:1 at p95.
  - Sources: [offforum.com](https://www.offforum.com/) (measured); [Awwwards](https://www.awwwards.com/sites/offfforum).
- **Zentry.** Black ground with a holographic blue, violet and pink mesh flower in the centre.
  - The title is two giant condensed words on a diagonal: "REDEFINE" top-left, "REALITY" bottom-right. Each is 180px (12.5vw), weight 900, uppercase, line-height 0.82. A 16px mono statement sits under the first word.
  - The flower's brightness falls to about 1% beyond 30% of the width from its centre, so both words sit on pure black: 16:1 at p95.
  - Phone: 104px (26.7vw).
  - Source: [zentry.com](https://zentry.com/) (measured).
- **Metalab.** A 3D glass star lit violet on black. This folder's earlier notes record an Awwwards Site of the Day on 24 Apr 2024.
  - Title "We make interfaces" in a very light serif, lower-middle at x 34%, y 60%, with the second line indented: PP Eiko 88px (6.1vw), weight 240, line-height 1.0, tracking −0.02em.
  - A 16px, 4-line statement floats upper-right at x 60%, y 25% (15.6em).
  - Contrast: 4.0:1 at p95, 2.9:1 at the brightest pixel.
  - Sources: [metalab.com](https://www.metalab.com/) (measured); [Awwwards](https://www.awwwards.com/sites/metalab).
- **Unseen Studio.** A pastel 3D room with a centred two-part title: an italic serif line, then a grotesk line.
  - The title is drawn inside the scene, not the DOM: it stayed visible when all DOM text was hidden.
  - A small caps kicker sits above, one small pill CTA below, and UI sits in the corners.
  - Source: [unseen.co](https://unseen.co/) (measured).
- **Messenger** (abeto). The title is a 3D object: blocky letters built onto a tiny planet, centred, with a BEGIN button below.
  - Source: [messenger.abeto.co](https://messenger.abeto.co/) (measured).
  - A "Site of the Year 2025" badge appeared only in scraped listings and is unverified ([abeto on Awwwards](https://www.awwwards.com/abeto/)).
- **basement.studio.** A full-bleed dark 3D room with no title on the first screen.
  - The h1 sits just below the fold and arrives on first scroll: Geist 87px (6vw), weight 600, line-height 0.9.
  - Source: [basement.studio](https://basement.studio/) (measured).
- **Luma.** Dark video with a centred title: 52px (3.6vw), weight 500. A 70%-white sub and one CTA. Contrast 8.6:1 at p95. Source: [lumalabs.ai](https://lumalabs.ai/) (measured).
- **Stripe Sessions 2027.** Title top-left on a light ground, with date and venue as two small columns to the right; the ribbon art is framed below. Title: sohne-var 100px (6.9vw), weight 250, line-height 0.85, tracking −0.04em. Source: [stripesessions.com](https://stripesessions.com/) (measured).
- Not measured. x.ai served a Cloudflare challenge to the headless browser ([x.ai](https://x.ai/)). Cartier's Le Chœur des Pierres and jjettas.com timed out ([Awwwards SOTD list](https://www.awwwards.com/websites/sites_of_the_day/)).

#### Proto today (baseline, measured on the dev server)
- The brief describes a hero with no visible title. By 04:08 on 7 Nov 2026 the dev server already served a centred copy column low on the bloom. It ran from commit 79d04e1 on `feat/events-glare`, titled "Blocky hero with the old field's drag…".
  - h1: Host Grotesk 64px (4.4vw, from `clamp(36px, 5vw, 64px)`), weight 400, line-height 1.02, tracking −0.035em, centred at y 52%, 45% wide, 2 lines.
  - Lede: 18.7px in rgb(194,194,200), 3 lines, 28.5em wide, then one "Join Proto" button.
  - Behind the column: a radial black scrim, `rgb(0 0 0 / 0.55)` at the centre, plus text-shadows on both text styles.
  - Phone: h1 36px (9.2vw), 3 lines, at y 54%.
  - Sources: [Hero.module.css](/Users/cjxsez/Desktop/bu-proto/src/components/Hero.module.css); live capture of http://localhost:5173/ (measured).
- Contrast over the field, with the scrim included:
  - Desktop title: 5.1:1 median, 3.3:1 at p95, 2.5:1 at the brightest pixel.
  - Desktop lede: 4.7:1 median, 2.4:1 at p95. That is below the 4.5:1 that text of its size needs.
  - Phone: title 3.4:1 at p95, lede 3.1:1 at p95.
  - Source: measured from the text-hidden stills (`out/proto/d-notext.png`, `m-notext.png`).
- Shape of the field:
  - The brightness centroid is at x 56%, y 40.5% on desktop, and x 55.6%, y 41% on phone.
  - The brightest cells are upper-centre and right-middle, at about 0.25–0.33 mean luminance. The darkest are the bottom 12% (0.01–0.03) and the lower-left quadrant (0.04–0.09).
  - White type at p95 by zone (desktop): lower-left (x 4–44%, y 72–90%) 6.4:1; left-middle 3.6:1; top-left 2.9:1; top-centre 2.4:1; right-middle 2.2:1.
  - Phone: the band at y 62–76% gives 4.2:1 at p95, the top band 2.4:1.
  - Source: measured.

### Inferences
- Award winners split by where they let the light fall. Some accept 2–3:1 at bright spots by putting type over bright moving art (Oryzo, Spyker, Metalab). Others compose the art so it is black under the type (Zentry, DeepBook, Grail). For a student site seen on cheap phones and hack-night projectors, the second school is the one to learn from.
- The named studios mostly keep their art pure: Lusion frames it, wild bands it, and Igloo and Active Theory leave it without a title. At award level, a title over living art is a composition problem first and a styling problem second.
- Proto's current column sits on the bloom's flank, just below its brightest point. The scrim and shadows are doing work the composition could do.

### Gaps
- I did not check awards for Active Theory's current site, Unseen, Zentry, Luma, basement or Stripe.
- The titles of Oryzo, Igloo, Unseen and Messenger are not DOM text, so their sizes are screenshot estimates.
- I read only the FWA home list, not its case pages.
- Contrast values come from one frame of moving art; the worst case over time can be lower.

## Which compositions recur: giant word over art, small title in a corner, title behind the art, split title and statement, title as last frame of an intro, and so on? Which suit a centred symmetrical bloom?

### Takeaway
Eight compositions recur. The ones that suit a centred, symmetrical bloom place type where the bloom is not:
- opposite corners on a diagonal (Zentry);
- the low band where the bloom fades (DeepBook, Emotion, Metalab);
- a giant word across the black above or below it (Grail);
- the two flanks (Vercel);
- a title made of the art itself (Messenger, Unseen, Igloo).

Centring the title over the core (Spyker, Luma) works only when the art is dark at its centre, and Proto's bloom is brightest there.

### Cited Findings
1. **Giant word over the art.** The title is 10vw or more and spans 40–95% of the width.
   - Grail: 10.1vw across 94.4% of the width. Oryzo: about 42% of the width (estimate). Zentry: 12.5vw per word.
   - Three Obys- and studio-made Sites of the Day use full-width wordmark bands at the top, but over flat grounds rather than moving art.
   - Sources: [grail-app.com](https://grail-app.com/), [oryzo.ai](https://oryzo.ai/), [zentry.com](https://zentry.com/); bands at [format.obys.agency](https://format.obys.agency/), [grids03.obys.agency](https://grids03.obys.agency/), [neutomni.com](https://neutomni.com/) (measured).
2. **Split title on a diagonal around a centred object.** Zentry puts "REDEFINE" top-left and "REALITY" bottom-right. Its flower's brightness centroid is at x 48.8%, y 48.1%, and its luminance falls from 0.33–0.37 near the centre to about 0.01 beyond 30% of the width. Source: [zentry.com](https://zentry.com/) (measured).
3. **Flanks.** Vercel puts the title on one side and a list on the other, with the object between: title at x 1.7–25.8%, list at x 73.6–85.5%. Family is the inverse, with art on the flanks and the title in the centre gap. Sources: [vercel.com](https://vercel.com/), [family.co](https://family.co/) (measured).
4. **Low anchor.** The title sits in the lower third, where the art falls off: DeepBook centred at y 70%, Emotion low-left from y ≈64%, Metalab lower-middle at y 60%, OFFF centred at y 72%. basement goes further and sets its title just below the fold. Sources: [deepbook-v2-wip.webflow.io](https://deepbook-v2-wip.webflow.io/), [emotion-agency.com](https://emotion-agency.com/), [metalab.com](https://www.metalab.com/), [offforum.com](https://www.offforum.com/), [basement.studio](https://basement.studio/) (measured).
5. **Centred over the art.** Spyker at y 41%, Luma at y 43%, Unseen inside the scene, and Proto now at y 52%. Spyker drops to 2.8:1 at p95 where the car is bright. Luma holds 8.6:1 because its video is dark at the centre. Sources: [spykercars.com](https://www.spykercars.com/), [lumalabs.ai](https://lumalabs.ai/), [unseen.co](https://unseen.co/) (measured).
6. **Corner HUD or no title.** Igloo uses four corners of mono text. Active Theory has only a capsule nav and a hint. Pegassi shows a centred record cover with "Click to enter". Sources: [igloo.inc](https://www.igloo.inc/), [activetheory.net](https://activetheory.net/), [ascension.pegassi.be](https://ascension.pegassi.be/) (measured).
7. **Title outside the art.** Lusion sets its statement above a rounded art card. wild runs its title row above a pixel band. Stripe Sessions puts its title above framed ribbon art, and Linear its title above the product UI. Sources: [lusion.co](https://lusion.co/), [craft.wild.as](https://craft.wild.as/), [stripesessions.com](https://stripesessions.com/), [linear.app](https://linear.app/) (measured).
8. **Title behind or inside the art.**
   - Grail's canvas stacks above its h1, so the art can cross the letters. Stripe tints its h1 through a hard-light duplicate.
   - Messenger and Unseen draw the title inside the 3D scene. Igloo draws all its text in WebGL.
   - Sources: [grail-app.com](https://grail-app.com/), [stripe.com](https://stripe.com/), [messenger.abeto.co](https://messenger.abeto.co/), [unseen.co](https://unseen.co/) (measured); [Igloo case study](https://awwwards.com/igloo-inc-case-study.html).
9. **Title as the last frame of an intro.**
   - Lusion's loader ends by building its "L" mark before the page appears. Grail's loading card flips into the scene before the title rises.
   - Active Theory's ASCII loader resolves into the emblem, and Metalab's kinetic loader of repeated words resolves into its title.
   - Sources: [lusion.co](https://lusion.co/), [grail-app.com](https://grail-app.com/), [activetheory.net](https://activetheory.net/), [metalab.com](https://www.metalab.com/) (measured from load videos).

### Inferences
These options are for Proto's bloom as measured: centroid at x 56%, y 40%, bright upper-centre and right, darkest low-left and in the bottom band. They are principles, ranked by fit, and all copy below is Proto's own.
- **A. Low anchor, weighted left: the bloom rises above the title.**
  - Set the title bottom-left inside x 4–44%, y 72–90%, where white type measured 6.4:1 at p95. The one-line statement can share the title's baseline on the right, or sit under it in mono. On phones, use the y 62–76% band (4.2:1 at p95).
  - This is the safest legible option. It follows Emotion, DeepBook and Metalab in giving the art the upper two-thirds.
  - Copy from `home.ts`: title "The home base for building things at BU". Small line: "A hack night every week, trips to hackathons as a group, and a demo night each semester."
- **B. Diagonal split: one Proto line in two halves in opposite corners.**
  - Proto already owns a four-beat line in `home.ts`, "Show up. Team up. Build. Ship." Set "Show up. Team up." top-left and "Build. Ship." bottom-right, with "The home base for building things at BU" as the small statement.
  - The top-left corner measures only 2.9:1 today. This needs the bloom to fall to black at its corners, as Zentry's flower does, or to sit slightly lower and right.
- **C. Giant wordmark band.**
  - Set PROTO across about 90–95% of the width at about 10vw (15–27vw on phones), in the black band below the bloom. Put the statement small in the nav row or under the word.
  - A word that large counts as large text, so it needs only 3:1 (see the next section). The glyph field can then cross in front of the letters, with the canvas above the h1 as at Grail, without losing legibility.
- **D. The art writes the title.**
  - As the last frame of the intro, the glyph bloom condenses into the letterforms of PROTO, then hands over to the DOM h1. Precedents: Messenger's planet of letters, Unseen's title drawn in the scene, Igloo's WebGL text, Lusion's "L" built at the end of its loader.
  - This is the most ownable option, because Proto's art is already made of glyphs and none of the reference sites draws its title from type glyphs.
- **E. Flanks, desktop only.** Put the title left of the bloom and the statement right, after Vercel. On phones, restack with the bloom above and the title below. The right flank is the brightest zone today (2.2:1), so the statement there would need a dimmer right side or a darker panel.
- **Avoid:** a centred block over the core (the current state: 3.3:1 title and 2.4:1 lede at p95), and a 3-line lede inside the art.
- The glass capsule nav holds the top centre on desktop, so Grail's trick of carrying the statement in the nav row has no room there. Proto's phone top band also measures only 2.4:1.

### Gaps
- No composition was mocked over the live bloom; only luminance zones were measured. Each option needs a rendered test at both viewports.
- The bloom moves and was measured on one frame. Zone ratios should be re-checked across a full cycle.

## What is the type scale, position, measure and hierarchy in each, as a share of the viewport?

### Takeaway
Two scales dominate:
- **Giant words:** 10–12.5vw on desktop and 15–27vw on phones.
- **Statement-titles:** 3.1–6.9vw on desktop and 8–15vw on phones.

Award heroes pair either one with a small second voice of 12–20px (0.8–1.4vw), set 15–28em wide and often in mono or caps. Display line-height runs 0.82–1.0 and tracking −0.01 to −0.06em. Weights go to an extreme, 240–300 light or 900 heavy, rather than sitting at 400–500. Title-to-statement size ratios run about 4.5:1 to 11:1; Proto's is 3.4:1, the lowest in the set.

### Cited Findings
All rows were measured live on 2026-11-07 at 1440x900, with the phone column at 390x844. In the title column, lh is line-height and lt is tracking.

| Site | Title (font, px, vw, weight, lh, lt) | Title box x / y / width (% of viewport), lines | Second voice (px, vw, measure, place) | Phone title |
|---|---|---|---|---|
| [Grail](https://grail-app.com/) | PP Pangaia 145.2, 10.1vw, 300, 0.88, −0.01em, caps | 2.8 / 12.6 / 94.4, 1 line | 15px, 1.04vw, 27.5em, top bar centre, 72% white | 60.5px, 15.5vw, 2 lines, y 12% |
| [Zentry](https://zentry.com/) | condensed 180, 12.5vw, 900, 0.82, caps | 2.5 / 9.1 / 36.5 and 65 / 76.7 / 32.5 | 16.2px mono, 1.1vw, 27em, under word 1 | 104px, 26.7vw |
| [Oryzo](https://oryzo.ai/) | wordmark ≈42% wide, cap height ≈14% of height (estimate) | ≈3 / 7 / 42 | 28.5px, 2.0vw, 15.5em, right-middle; 18px caps kicker | statement 18.7px, 4.8vw |
| [Metalab](https://www.metalab.com/) | PP Eiko 88, 6.1vw, 240, 1.0, −0.02em | 33.9 / 59.6 / 39.4, 2 lines, 2nd indented | 16px, 1.1vw, 15.6em, upper right | 44px, 11.3vw, y 20% |
| [Emotion](https://emotion-agency.com/) | Emotion Serif 96, 6.7vw, 300 | low-left from y ≈64% | 12px mono caps kicker above | 46px, y 67% |
| [DeepBook](https://deepbook-v2-wip.webflow.io/) | TWK Everett 81, 5.6vw, 500, 1.0, −0.025em | 15.8 / 70.2 / 68.4, 1 line, centred | 18px, 1.3vw, 27.2em, under title | 58.2px, 14.9vw, 3 lines, y 40% |
| [craft.wild.as](https://craft.wild.as/) | Sneak 74.9, 5.2vw, 400, 0.92, −0.035em, caps | 9.2 / 1.9 / 31.5, 2 lines | 20px caps, justified, 19.7em, top right | 32px, 8.2vw |
| [Stripe Sessions](https://stripesessions.com/) | sohne-var 100, 6.9vw, 250, 0.85, −0.04em | 1.1 / 12.8 / 59.9, 2 lines | 16px columns at x 70% and 83% | 60px, 15.4vw |
| [Vercel](https://vercel.com/) | Geist 64, 4.4vw, 400, 1.0, −0.06em | 1.7 / 35.3 / 24.1, 2 lines | 16px list, 10.7em, at x 73.6% | 48px, 12.3vw, centred, y 52% |
| [Linear](https://linear.app/) | Inter 64, 4.4vw, 510, 1.0, −0.022em | 5.4 / 29.4, 2 lines | 15px, 1.04vw, grey | 38px, 9.7vw |
| [Family](https://family.co/) | Family 68, 4.7vw, 500, 1.1, −0.02em | 35.2 / 23.7 / 29.6, 2 lines, centred | 17px, 1.2vw, 22.9em | 44px, 11.3vw |
| [Spyker](https://www.spykercars.com/) | futura-pt-condensed 56, 3.9vw, 500, 0.85, +0.04em, caps | 36.4 / 41 / 27.3, 2 lines, centred | tiny kicker | 56px, 14.4vw, 3 lines |
| [Luma](https://lumalabs.ai/) | Graphik 52, 3.6vw, 500, 1.2, −0.04em | 37.4 / 42.8 / 25.3, 2 lines, centred | 22px, 70% white, 18.6em | 32px, 8.2vw |
| [Stripe](https://stripe.com/) | sohne-var 48, 3.3vw, 300, 1.15, −0.02em | 14.4 / 28.3 / 69.1, 4 lines | statement inside the h1, lighter colour | 34px, 8.7vw |
| [OFFFForum](https://www.offforum.com/) | Forvm 45, 3.1vw, 400, 0.96, caps | 26.6 / 72 / 46.8, 4 lines, centred | 18px info table top-left | 30px, 7.7vw, 5 lines |
| [Lusion](https://lusion.co/) | Aeonik 36, 2.5vw, 400, 1.1 | 28 / 4.9 / 36, 3 lines, above the art | the statement is the h1 | 23.4px, 6vw |
| Proto now ([localhost](http://localhost:5173/)) | Host Grotesk 64, 4.4vw, 400, 1.02, −0.035em | 27.5 / 52 / 45.1, 2 lines, centred | 18.7px, 1.3vw, 28.5em, 3 lines | 36px, 9.2vw, 3 lines, y 54% |

- Title-to-second-voice size ratios (measured): Zentry about 11:1, Grail 9.7:1, Oryzo about 6.4:1 (estimated from cap height), Metalab 5.5:1, DeepBook 4.5:1, wild 3.7:1, Proto now 3.4:1.
- Line length guidance is an average of 45–90 characters per line, spaces included. Source: [Practical Typography](https://practicaltypography.com/line-length.html).
- Inter's "dynamic metrics" set tracking as a + b·e^(c·size), with a = −0.0223, b = 0.185 and c = −0.1745, so display tracking approaches −0.0223em. Source: [Inter dynamic metrics, archived](https://d.rsms.me/inter-website/v3/dynmetrics/).
- WCAG counts 18pt (24px) text, or 14pt (about 18.7px) bold text, as large; large text needs 3:1 and smaller text 4.5:1. Contrast is measured against the background the text sits on. Source: [W3C Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

### Inferences
- **Two voices in the art, not three.** Winners keep the second voice to one or two lines (Grail 2, DeepBook 1, Luma 1, Zentry 4 short mono lines) and move longer explanation below the fold. Proto's 3-line, 28.5em lede is a paragraph, and that is what makes the block read as a landing-page template.
- **Size ranges per option, taken from the measured set:**
  - Giant word: about 10–12.5vw on desktop and 15–27vw on phones, line-height 0.82–0.9, tracking −0.01 to −0.02em, side margins about 2.5–3%.
  - Low-anchored statement title: 5.5–7vw on desktop and 10–15vw on phones, line-height 0.9–1.0, tracking about −0.02 to −0.035em. Proto's −0.035em already fits.
  - Second voice: 12–16px mono or 15–20px sans on desktop, 14–17px on phones, 15–28em wide, 72–100% white.
- **Title-to-statement ratio:** aim for 5:1 or more, against Proto's current 3.4:1.

### Gaps
- PP Pangaia, PP Eiko and Sneak are licensed faces; only the principles transfer.
- WebGL titles (Oryzo, Unseen, Messenger, Igloo) could not be measured exactly.

## How does the title enter: load sequence, timing, relation to the art?

### Takeaway
Wherever a title animates in, the art arrives first and the title arrives last, or the title is part of the art's own arrival. The title's own move is short: 0.5–1.2 s, travelling 0.3–1em, staggered by letter or by line. Sites with long loads turn the wait into a brand moment: counters, a mark being built, kinetic words, technical drawings. Where the art is light (Vercel, Stripe, DeepBook), the title is there at first paint and does not animate.

### Cited Findings
- **Grail** (low load).
  - WebGL first draws at 0.97 s. A "LOADING n%" playing card on a pink plate counts to 100%, then flips and scales to fill the screen (about 3–4 s).
  - The title then rises 44px (about 0.3em) and fades up from 0.51 opacity, staggered by letter from 3.71 s (first) to 4.28 s (last), settling at 4.83 s.
  - Source: [grail-app.com](https://grail-app.com/) (measured from video and DOM sampling).
- **craft.wild.as** (low load).
  - The title is present at 0.27 s, 79px (about 1.06em) low, and slides up into place by 1.47 s. The descriptor slides 27px and settles by 1.71 s. The small tag fades in from 1.15 to 1.87 s.
  - The pixel field paints from scattered pixels to a dense band over about 2 s.
  - Source: [craft.wild.as](https://craft.wild.as/) (measured).
- **Family** (low load). Title words flip up from `rotateX(45deg)` with a fade, staggered from 1.31 to 1.61 s and settled at 2.41 s. The sub follows at 1.94 s. Source: [family.co](https://family.co/) (measured).
- **Lusion** (high load, so durations are stretched).
  - A 3-digit counter (000 to 100) in large digits bottom-left with a thin progress bar, then a block "L" builds at 100.
  - The art card scales into frame, then the header statement's lines rotate in from 15° and settle (5.1 to 6.9 s in this run).
  - Source: [lusion.co](https://lusion.co/) (measured).
- **Oryzo.** The preloader is a technical drawing of the product on a cork-green ground: a crosshair, then a circle with Bézier handles, then a progress ring. The scene and its type follow. Source: [oryzo.ai](https://oryzo.ai/) (measured from video).
- **Active Theory.** An ASCII preloader, a dome of slashes around a counter, bursts into a ring and resolves into the glass emblem. No title follows. Source: [activetheory.net](https://activetheory.net/) (measured from video).
- **Metalab** (high load). A kinetic loader of repeated words, including the wordmark at 259px, gives way to the real title, which fades in over about 0.55 s (5.31 to 5.86 s in this run). Source: [metalab.com](https://www.metalab.com/) (measured).
- **Zentry** (high load). WebGL first draws at 6.0 s. The giant words fade in at 10.7–10.9 s and settle at 11.4 s, after the flower has formed. Source: [zentry.com](https://zentry.com/) (measured).
- **Emotion.** A "000%" counter, then a choice to enter with or without audio (about 7.9 s), then the scene, which holds the title. Source: [emotion-agency.com](https://emotion-agency.com/) (measured).
- **Linear** (high load). The h1 fades up from opacity 0 with 24.8px of travel (about 0.39em), and the product UI fades in after it. Source: [linear.app](https://linear.app/) (measured).
- **DeepBook, Vercel, Stripe.** The title is static at first paint (DeepBook at 0.62 s under low load); only the art animates in. Sources: [deepbook-v2-wip.webflow.io](https://deepbook-v2-wip.webflow.io/), [vercel.com](https://vercel.com/), [stripe.com](https://stripe.com/) (measured).
- **Igloo.** The intro renders in real time in the engine and flows straight into the site. Its text uses WebGL glitches and SDF letter-scrambles. Source: [Awwwards case study](https://awwwards.com/igloo-inc-case-study.html).
- **WCAG 2.2.2.** Moving content that starts by itself, lasts more than 5 s and runs alongside other content needs a way to pause, stop or hide it. There is no exemption for decoration. Source: [W3C Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).

### Inferences
- **Order for Proto:** the bloom forms first, then the type arrives as the bloom settles. By Grail's proportions, the title starts once the art has visibly landed and takes about 1 s or less, with travel under one line-height.
- **A glyph-native entrance fits better than a generic fade.** Letters can resolve out of glyph noise (Igloo's scramble idea), or the bloom can condense into the word (option D in the compositions section).
- **Keep the h1 in the DOM from first paint** and animate only a visual layer, so search and screen readers never wait. Unlike Igloo and Unseen, Proto should not draw its only title in WebGL.
- **Skip the gate.** Counters and "enter" gates suit studio showpieces. For an audience arriving on phones from a hack-night link, they add a wait with no payoff.
- **Reduced motion and pausing:** show the final state at once, and give the moving bloom a pause control to meet 2.2.2.

### Gaps
- Timings for Lusion, Metalab, Zentry and Linear were taken under heavy machine load, so real-world durations are probably shorter.
- Easing curves were not extracted; most entrances are JavaScript-driven and do not show up as CSS animations.

## What makes these feel premium instead of like a template?

### Takeaway
Six measurable habits separate award-level heroes from assembled ones:
1. A short title (1–5 words) at an extreme scale and weight.
2. One or two type voices, never three stacked blocks.
3. Type that takes its colour and position from the art.
4. Small secondary labels on a grid at the edges.
5. Art first, type last, with short motion.
6. No more than one CTA in the hero body; the main one lives in the nav.

The template version is a centred headline, paragraph and button stack over a shader blob, and that composition is sold as an off-the-shelf component.

### Cited Findings
- **Title length** in art-led winners: Oryzo 1 word, Zentry 2 (split), Grail 3, Metalab 3, Unseen 3, DeepBook 4, Luma 5, Spyker 5, Emotion 8. OFFF's statement-title runs past 14 words. Proto now: 10 words plus a 3-line lede. Source: measured (sites above).
- **CTAs in the hero body:**
  - None: Oryzo, Igloo, Active Theory, Metalab, Zentry and Emotion, with contact or join in the nav.
  - One: Grail (a nav pill), Unseen, Spyker, OFFF and Luma.
  - Two: DeepBook, Family, Vercel and Stripe.
  - Source: measured.
- **Display settings:**
  - Line-height at 1.0 or below: Zentry 0.82, Spyker 0.85, Stripe Sessions 0.85, Grail 0.88, wild 0.92, OFFF 0.96, and 1.0 for Metalab, DeepBook, Vercel and Linear.
  - Tracking is negative (−0.01 to −0.06em) everywhere except condensed caps (Spyker +0.04em).
  - Weights go to an extreme: Metalab 240, Stripe Sessions 250, Grail 300, Emotion 300, Stripe 300, Zentry 900.
  - Source: measured.
- **Colour taken from the world:** Oryzo sets all hero type in one cream, rgb(255,237,215), that belongs to its cork palette. Zentry sets its giant words in lavender rgb(223,223,242), its own page ground. Active Theory's loader is a teal from its scene, rgb(134,207,209). Source: measured.
- **Edge labels on a grid:** Igloo's mono corner HUD; Oryzo's vertical tab, caption card and kicker; wild's three-part top row; Metalab's client chips and world clocks; Stripe Sessions' date and venue columns; Emotion's mono kicker. Source: measured.
- **Preloaders and gates designed as brand moments:** Lusion's counter and "L", Grail's playing-card loader, Oryzo's technical drawing, Active Theory's ASCII dome, Metalab's kinetic words, Emotion's audio choice. Source: measured.
- **Awwwards judging:** Design 40%, Usability 30%, Creativity 20%, Content 10%. At least 18 jurors score each site, and the 3 scores furthest from the average are dropped. Honorable Mention starts at 6.5. Source: [Awwwards evaluation](https://www.awwwards.com/about-evaluation/).
- **The template is for sale.** Component marketplaces list ready-made heroes of an animated WebGL shader background with a centred headline, so the composition is a commodity. Sources: [21st.dev Hero Geometric](https://21st.dev/@componentry/components/hero-geometric), [Framer WebGL Orb Hero](https://www.framer.com/marketplace/components/webgl-orb-hero/) (listings seen in search, not opened).
- **Awards do not guarantee legibility.** Oryzo's wordmark measures 2.1:1 at p95, Spyker's title 2.8:1 at p95 and Metalab's 2.9:1 at its brightest pixel, all below WCAG's 3:1 for large text. WCAG measures contrast against the background behind the text, and failure F83 covers background images without enough contrast. Sources: measured; [W3C Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

### Inferences
- **Cut the hero copy** to a title of five words or fewer plus one statement of one or two lines. Move the 3-line lede to the next section, where the site already explains the rhythm.
- **Commit to an extreme:**
  - Either a huge wordmark (PROTO), as in Grail and Oryzo, at a light or heavy weight;
  - or a short statement at 5.5–7vw, line-height 1.0 or below, tracking about −0.02 to −0.035em.
  - The current 64px, weight 400, line-height 1.02 block sits in the middle of every range, which is why it reads as default.
- **Take the colour from the bloom.** Use a cool white drawn from the core, or a pale tint of its blue or pink, instead of neutral #F4F4F6 over grey.
- **Set the second voice in JetBrains Mono.** It already loads and already sets the nav at 11px caps with +0.13em tracking, so the hero would speak the nav's language.
- **Turn Proto's facts into a HUD row.** Three or four small mono labels on the hero's bottom edge, in Proto's own words: hack night every week, hackathon trips as a group, demo night each semester, free with no application. This is the edge-label habit of Igloo, Oryzo and Metalab, and it moves the facts out of the paragraph.
- **One CTA.** The nav already carries a white "JOIN PROTO" pill on desktop, so the hero body can drop its button, as Grail, Igloo and Metalab do. On phones, where the nav collapses to a menu button, keep a single small join link in the hero.
- **Let the bloom land first,** then the type, with a short move.
- **Keep type off the core** and check it over the worst frame: at least 3:1 for title-size text and 4.5:1 for the small voice.
- **Never use "club"** in any of this copy; all copy suggested here is Proto's own, from `home.ts` and `about.ts`.

### Gaps
- No study of how people perceive "premium" in heroes was found. These six habits are regularities in a sample of about 20 art-led heroes, not causal evidence.
- Peer hackathon sites (ScottyLabs, Purdue Hackers) were out of scope for this note.
- The award status of Zentry, Unseen, Luma and basement was not checked, so some patterns rest on well-known but unverified references.
