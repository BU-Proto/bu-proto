# Student builder organisations: what their homepage hero says first (live teardown, captured 2026-11-07)

Scope: ScottyLabs and Purdue Hackers plus 35 other student builder groups, hackathons and campus neighbours, all loaded live on 2026-11-07. Two of the 39 URLs tried are excluded: BUILDS at builds.bu.edu timed out, and calhacks.com is a parked domain. That leaves 37 first screens.

## 1. What is in the first screen of scottylabs.org and purduehackers.com right now (title, tagline, about line, primary action, art), and why do they read as only okay?

### Takeaway
ScottyLabs uses the standard split hero:
- on the left: its name, a "best place" tagline, a 28-word mission paragraph and a mailing-list button
- on the right: a Scottie dog drawn in code glyphs.

Purdue Hackers is stronger because its title is part of the art: a huge pixel typeface sits among pixel "life" forms on graph paper. But its single line sounds like a fund backing talent, not a place anyone can walk into. Neither first screen says what happens, when it happens, or that anyone can come.

### Cited Findings

#### How the captures were made (applies to every site in these notes)
- Each site was loaded in headless Chrome for Testing 158 with WebGL on the Metal GPU, at two sizes:
  - 1440×900 at device pixel ratio 1
  - 390×844 at device pixel ratio 2, with an iPhone user agent and touch.

  Visible text was read from the DOM at 1.5 s, 3 s and 6 s after DOMContentLoaded. Screenshots were taken at 1.5 s and 6 s. "First-screen words" counts words inside the viewport, excluding nav and footer elements but including banners and small print. — [capture script](file:///private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/peers/capture.mjs)
- Evidence files are all under `/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/peers/`:
  - screenshots: `shots/<site>-<d|m>-<t1|t6>.png`
  - raw DOM text and positions: `raw/<site>-<d|m>.json`
  - contact sheets of every site at both sizes: `sheets/s1.png` to `sheets/s9.png`
  — [evidence folder](file:///private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/peers/)

#### ScottyLabs (Carnegie Mellon)
- **Nav:** a dog line-logo and wordmark, then only "Team" and "Sponsors". — [scottylabs.org](https://scottylabs.org/)
- **Title:** "ScottyLabs" at 60px Satoshi Bold. A mock design-tool tooltip above it prints the title's own CSS (font-family, 3.75rem, weight 700), with guide lines through it. — [scottylabs.org](https://scottylabs.org/)
- **Title markup:** the visible title is a `span`, not the page's h1. The page's three h1s all sit below the fold, at y = 1214, 2340 and 3119 px on desktop: "From Design to <Development/>", a line about hosting Pittsburgh's largest hackathon, and "Join Us!". — [scottylabs.org](https://scottylabs.org/)
- **Tagline:** "The best place to build software @ CMU" (7 words, 30px). — [scottylabs.org](https://scottylabs.org/)
- **About line:** 28 words at 20px, 3 lines on desktop and 7 lines on a phone. It describes a student-run organisation "dedicated to building tech that enhances campus life" and ends on "apps and events". — [scottylabs.org](https://scottylabs.org/)
- **Actions:** "Join our mailing list" (filled black pill, primary) and "Reach out" (outline pill). — [scottylabs.org](https://scottylabs.org/)
- **Art:** on the right half, a Scottie dog outline built from code glyphs (`* + = ] ;`) in a blue to violet to red gradient on white.
  - At 390 px wide the art drops below both buttons, so the phone first screen is text only.
  - Under the hero sit an announcement chip ("Check out CollegeCart from the Labrador committee!") and a photo strip starting at about y = 724.
  — [scottylabs.org](https://scottylabs.org/)
- **Word count:** 56 first-screen words on desktop and 49 on a phone, all visible by 1.5 s. — [scottylabs.org](https://scottylabs.org/)
- **Metadata:** the page title is "ScottyLabs". The meta description is a placeholder: "The landing page for Scottylabs". — [scottylabs.org](https://scottylabs.org/)
- **TartanHacks:** ScottyLabs presents TartanHacks. On 2026-11-07 that site's first screen still carried a thank-you banner for the February 2026 event. — [tartanhacks.com](https://tartanhacks.com/)

#### Purdue Hackers
- **Ground and nav:** cream with a faint graph-paper grid. Nav items: a pixel logo mark, DISCORD, EVENTS, BLOG, MICROGRANTS. — [purduehackers.com](https://www.purduehackers.com/)
- **Title:** h1 "Purdue Hackers" in a custom pixel face (served as "PixelHackers"), 136px on desktop and 72px on a phone. — [purduehackers.com](https://www.purduehackers.com/)
- **The one line:** 16 words at 20px Inconsolata, set in capitals. It opens "We back highly talented and curious individuals" and ends by naming software, hardware and design, each in its own colour (magenta, violet, blue). — [purduehackers.com](https://www.purduehackers.com/)
- **Action:** one violet block button, "BUILD WITH US", which links to events.purduehackers.com. — [purduehackers.com](https://www.purduehackers.com/)
- **Art:** three canvases (1440×200, 1440×1440 and 1440×920) draw:
  - pixel shapes like Game of Life gliders beside the title
  - a dithered pixel horizon along the bottom.

  A "BITS NEWSLETTER 1" card and two photo cards peek up at the fold. — [purduehackers.com](https://www.purduehackers.com/)
- **Word count:** 21 first-screen words at both sizes. On a phone, title, line and button all fit in the first screen. — [purduehackers.com](https://www.purduehackers.com/)
- **Metadata:** no meta description. The og:description repeats the "backs highly talented" line. — [purduehackers.com](https://www.purduehackers.com/)
- **2022 redesign post:** the team said their old page "didn't communicate the soul and magic" they wanted at first contact. The 2022 hero called them "a community of students who collaborate, learn, build". Its call to action asked "ready to find your people?" — [Purdue Hackers blog, "Our New Homepage"](https://blog.purduehackers.com/posts/2022-homepage)

#### Proto's current hero, for comparison
- **Hidden title:** the hero renders only the bloom (`HeroBloom`). The h1 "Proto is the home base for building things at BU" is in the markup for screen readers but is not shown. The component comment describes the bloom "turning to type in its own light". — [Hero.tsx](file:///Users/cjxsez/Desktop/bu-proto/src/components/Hero.tsx); [home.ts](file:///Users/cjxsez/Desktop/bu-proto/src/content/home.ts)
- **Facts already in the content files:**
  - The lede, not shown on the page, lists a hack night every week, hackathon trips as a group and a demo night each semester. — [home.ts](file:///Users/cjxsez/Desktop/bu-proto/src/content/home.ts)
  - The about copy adds that Proto is free, with no application and no experience needed. — [about.ts](file:///Users/cjxsez/Desktop/bu-proto/src/content/about.ts)
- **Local build at 1440×900:** the only visible word in the first screen is "PROTO" in the glass nav capsule. The bottom fifth of the bloom falls to near-black. — [local screenshot by a parallel researcher](file:///private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/shots/localhost-5173-d.png)

### Inferences
- **ScottyLabs repeats itself.** The first screen says one idea three times at three sizes (name, best-place tagline, mission paragraph), in the most common landing-page layout: copy left, illustration right, two pill buttons. The art sits beside the words, not behind or around them, and on phones it falls off the first screen.
- **ScottyLabs uses claims, not pictures.** "Best place", "enhances campus life" and "real-world problems" are claims and abstractions, not things a student can picture doing. The primary action asks for an email and promises nothing.
- **ScottyLabs shows small craft misses.** A demanding eye notices that:
  - the tooltip joke is a designer's in-joke
  - the visible title is not the h1
  - the meta description is a placeholder.
- **Purdue Hackers is the better of the two.** Type, art and ground share one pixel system, the title is the dominant shape, and there is exactly one action.
- **Purdue Hackers still only reaches "okay", for two reasons:**
  - Pixel type, dithering and graph paper are a widely shared dev-culture style, so the page looks like a genre, not a place. This is my judgement; I have no source counting the trend.
  - The voice has moved from belonging in 2022 ("find your people") to selection in 2026 ("we back highly talented…"). The selective voice is the opposite of Proto's no-application promise.
- **Neither hero has light, depth or a layered scene.** Both put flat type on a light ground with the art beside or below it. Measured against Lusion, Oryzo or craft.wild.as (the owner's references), both will feel like templates.
- **Neither hero gives a time or a place.** A first-time visitor cannot tell from either first screen what happens this week, which is the one thing Proto can say that they don't.

### Gaps
- **Not observed:** pointer, hover or scroll behaviour past 6 s. For example, I did not test whether Purdue's pixel canvases react to the cursor.
- **Timing is approximate:**
  - The machine's load average was over 100 during the first captures.
  - Purdue Hackers took 12.5 s to reach DOMContentLoaded under that load.

  So "seconds" here are seconds after DOMContentLoaded, not after the click.

## 2. Which comparable student groups do this best? (HackMIT, TreeHacks, Hack the North, Cal Hacks, MLH-listed events, Penn Labs, Cornell AppDev, Sundai and similar)

### Takeaway
For a year-round group with an art-led hero, the strongest first screens are:
- **Socratica** (Waterloo): the wordmark is the artwork, plus one sentence that names a weekly rhythm.
- **Hack Club**: five words that say who it is for and what they do, plus a reassurance line.
- **MHacks**: the closest in form to Proto, with a giant title over a full-screen canvas under a glass pill nav.
- **Sundai**: the most compressed definition, with the rhythm inside the sentence.

The big hackathons do something else: name, date, place and one action, over an illustrated world. That works for people who already know the event, but explains almost nothing to a newcomer.

### Cited Findings

#### Year-round builder groups
- **Socratica:**
  - **Wordmark:** a giant grey wordmark that mixes pixel-stepped and serif letterforms fills the top half. It is art, not text; the real h1 is a small 24px "Socratica" at top left.
  - **Caption:** a gallery-style caption at right labels the wordmark as the "current art", with a title-and-author credit line, as if it were a rotating exhibit.
  - **Sentence:** one 16-word sentence at 30px Tiempos Headline, beginning "We host weekly co-working sessions". The phrase "co-working sessions" has a dotted underline and "passion projects" is set in italics.
  - **Actions:** two buttons, "Attend a session" (black, primary) and "Dive deeper".
  - **Art at the fold:** a halftone black-and-white group photo.
  - **Word count:** 27 to 28 first-screen words.

  — [socratica.info](https://socratica.info/)
- **Hack Club:**
  - **Headline:** h1 "Where teens make cool stuff." in a 90px serif, with "teens" in a purple-to-orange gradient. Directly under it, a 13-word definition: "the world's largest nonprofit movement of teenagers" making projects.
  - **Action:** an email field with a "Join!" button, then the eligibility line "For all teens aged 13–18".
  - **Art:** tilted photos of real members and stickers frame both sides of the type. A red line drawing of gadgets sits behind, with an envelope addressed to "you, a teenager" offering free stickers.
  - **Word count:** 57 first-screen words on desktop, 46 on a phone. The page title repeats the headline.

  — [hackclub.com](https://hackclub.com/)
- **Sundai:**
  - **Headline:** h1 "Sundai" (32px Space Mono), then "Building & Launching AI Prototypes Every Sunday." (6 words, 16px on desktop, 12.8px on a phone).
  - **Typewriter card:** a card types out "We are builders from" next to MIT and Harvard marks. Visible words grow from 9 at 1.5 s to 38 by 3 s.
  - **Below:** an "Events This Week" list sits at the fold. The page title is "Sundai Club".

  — [sundai.club](https://www.sundai.club/)
- **Tech@NYU:**
  - **Headline:** h1 "Build what's next." (64px Oxanium), then "The space for hackers, artists, and makers to build @ NYU" (10 words).
  - **Art:** a retro CRT monitor showing a photo, on a dark grid.
  - **Action:** one "Join Discord" button.
  - **Word count:** 20 words.

  — [techatnyu.org](https://techatnyu.org/)
- **Penn Labs:**
  - **Headline:** h1 "Built for students, by students" (61px), then "We're connecting students, resources, and data to improve life at Penn." (11 words).
  - **Actions:** "View Products" (blue) and "GitHub".
  - **Art:** flat UI-screen illustrations.
  - **Word count:** 19 words on desktop and 37 on a phone, where a stats block ("12 years", "100k unique users") rises into view.

  — [pennlabs.org](https://pennlabs.org/)
- **Cornell AppDev:**
  - **Headline:** h1 "We love apps (and each other too)" (47px), then an 18-word line about an open-source, student-run project team.
  - **Action:** one small red "See all our apps" button with 12px text.
  - **Art:** a group photo in a blob mask.
  - **Word count:** 29 words.

  — [cornellappdev.com](https://www.cornellappdev.com/)
- **V1 @ Michigan:**
  - **Headline:** h1 "V1 @ Michigan" at 128px Instrument Serif Light, over a video of a talk in a rounded card. Under it, a 22-word line beginning "V1 is the premier builder community".
  - **Action:** a yellow "Join us" button.
  - **Phone layout:** at 390 px the top of the title is clipped by the card edge.

  — [v1michigan.com](https://v1michigan.com/)
- **Other year-round groups:**
  - hackNY: a large photo of members, then "hackNY is a community of technologists aspiring to change the world." (11 words; 62 first-screen words in total). — [hackny.org](https://hackny.org/)
  - Penn Spark: "we are spark" plus one paragraph over blurred project tiles. — [pennspark.org](https://www.pennspark.org/)
  - DALI (Dartmouth): "Designing & building idea into impact" (sic) over a photo, with no button. — [dali.dartmouth.edu](https://dali.dartmouth.edu/)
  - Blueprint (Berkeley): "Tech for Social Good" on a blue hexagon field, with two buttons. — [calblueprint.org](https://calblueprint.org/)
  - Generate (Northeastern): a wordmark plus APPLY / PROJECTS / ABOUT stacked at 48px. No statement appears until "What Is Generate?" at the fold, and there is no h1. — [generatenu.com](https://generatenu.com/)
  - ADI (Columbia): a fake terminal window with box-drawing ASCII letters and "The largest tech community on campus." The ASCII art drops to 7.2px on a phone. — [adicu.com](https://www.adicu.com/)
  - Hack Lodge: 165 words of 13px monospaced text, still advertising Winter 2023 applications. — [hacklodge.org](https://hacklodge.org/)
- **BU Spark!** (a BU program, not student-run):
  - **Headline:** h1 "BU Spark! helps you launch products." It describes itself as an "innovation and experiential learning lab".
  - **Panels:** four green-tinted photo panels (Create, Learn, Explore, Partner).
  - **Word count:** 94 words.
  - **Phone layout:** at 390 px the two lines of the h1 overlap.

  — [bu.edu/spark](https://www.bu.edu/spark/)

#### Hackathons (mostly MLH 2027-season events)
- **MHacks:**
  - **Canvas:** a full-viewport canvas (1440×900) shows a blurred green garden with blue flowers and drifting sparkles.
  - **Title:** h1 "MHACKS 2026" at 216px Instrument Serif italic. Under it, one tracked-capitals line: "Build something that grows." plus date and place.
  - **Nav and actions:** a centred glass pill nav, with Login and LIVE buttons at right.
  - **Word count:** 14 words on desktop, 15 on a phone. The page title is "MHacks 2026 · Digital Garden".

  — [mhacks.org](https://www.mhacks.org/)
- **HackMIT:**
  - **Title:** h1 "HackMIT 2027" (72px), then "Mid-September" (48px) and "Get notifications when applications open!" with an email field and "Notify me".
  - **Art:** a psychedelic swirl illustration and a stacked HACK monogram.
  - **Size:** the whole site is one screen (document height 900 px). 23 words.

  — [hackmit.org](https://hackmit.org/)
- **TreeHacks:**
  - **Title:** no h1. The name exists only as spaced capitals inside the artwork.
  - **Action:** a glowing robot in an overgrown ruined city holds the "Apply Now" link as a sign, above "Feb 12 - 14 · 2027". 6 words of DOM text.
  - **Metadata:** the meta description calls it "Stanford's premier hackathon".

  — [treehacks.com](https://treehacks.com/)
- **Hack the North:**
  - **Title:** h1 "Hack the North" (56px), then the date with "In-person event", an MLH member line, and "Hacker and Volunteer applications are closed!" with an email "Sign Up".
  - **Art:** a tabletop diorama of gadgets on a trail map.
  - **Word count:** 26 words.

  — [hackthenorth.com](https://hackthenorth.com/)
- **Hack the North's 2018 design write-up:**
  - The redesign moved away from a corporate blue look meant for sponsors.
  - The new direction aimed to "celebrate the hackers" and feel less intimidating.
  - Grainy hand-drawn art was meant to show the organisers were real students.
  - The team targeted WCAG 2.0 AA.

  — [Hack the North 2018 design post](https://graciexia8.github.io/2018/09/20/hack-the-north.html)
- **Cal Hacks:**
  - **Domain:** calhacks.com resolved to a GoDaddy for-sale page on 2026-11-07. — [calhacks.com](https://calhacks.com/)
  - **First screen:** at calhacks.io, a painted globe carries hand-lettered "Cal HACKS 13.0". Venue, dates, deadline, "Become a hacker" and "Sponsor" all sit inside cloud shapes, and a bear flies a biplane.
  - **Text:** no h1, and only 2 words of DOM text in the first screen; everything else is image. — [calhacks.io](https://www.calhacks.io/)
- **DubHacks:**
  - **Title:** giant white "DUBHACKS" on an animated hot-pink pixel mosaic canvas. Under it, "building tomorrow together" and "Largest hackathon in the Pacific Northwest" with a startup-incubator claim.
  - **Actions:** three buttons (hacker, judge, volunteer).
  - **Stale banner:** a scrolling banner says DubHacks 2026 has concluded.

  — [dubhacks.co](https://dubhacks.co/)
- **Other hackathons:**
  - PennApps: logo badge, date, place, "Apply Now", and a desert planet with an astronaut. 21 words. — [pennapps.com](https://pennapps.com/)
  - Hack@Brown: a 96px name, "coming soon" date, and a pixel city. — [hackatbrown.org](https://hackatbrown.org/)
  - HackIllinois: a 150px countdown with "Until we ride into Hack..." — [hackillinois.org](https://hackillinois.org/)
  - HackPrinceton: a split-flap departures board carries the dates and status. Its text is 15.8px on desktop and 6.3px on a phone, and the h1 is hidden offscreen. — [hackprinceton.com](https://www.hackprinceton.com/)
  - UofTHacks: a 3D lily-field scene and a script logo image, with no h1. 1 word visible at 1.5 s and 7 by 6 s. — [uofthacks.com](https://uofthacks.com/)
  - Hack Western: "Discover the unknown" with a disabled "Applications closed" button. — [hackwestern.com](https://www.hackwestern.com/)
  - Bitcamp: h1 "We're out exploring, but we'll see you in April 2027!" — [bit.camp](https://bit.camp/)
  - HackHarvard: "Thank You for a Great HackHarvard 2026". — [hackharvard.io](https://hackharvard.io/)
  - HackBeanpot: "We hope you enjoyed the ride!" — [hackbeanpot.com](https://www.hackbeanpot.com/)
  - nwPlus: "Leading Western Canada's Biggest Hackathons" with an email field. — [nwplus.io](https://nwplus.io/)
  - MLH: "The World's Largest Developer Community" plus a 15-word definition and "Attend an Event". — [mlh.io](https://mlh.io/)
- **BostonHacks (BU's own hackathon):**
  - **Title:** the h1 is empty. "BOSTONHACKS" and "2026" are drawn in a subway-map illustration whose nav items are stations.
  - **Word count:** the desktop first screen has 1 word of DOM text.
  - **Metadata:** the meta description calls it "Boston University's largest, annual student-run hackathon"; the page title names its theme, "Boston Bound".

  — [bostonhacks.org](https://bostonhacks.org/)

### Inferences
Ranking for Proto's case (a year-round, free, no-application home with a WebGL art hero), each with the principle to take. Take the principle only, never the line or the look.
1. **Socratica**, for two principles:
   - Treat the name and image as the exhibit, with a quiet credit, so the art reads as intentional, not decorative.
   - State the rhythm and activity in one plain sentence.

   It is also the closest in kind to Proto: a weekly session for people making their own things.
2. **Hack Club:** name the audience and the activity in one breath, then put a short eligibility or reassurance line next to the action. Real faces at the edges make it feel populated.
3. **MHacks:** proof that a full-bleed canvas, a glass pill nav and one very large display title can coexist with fewer than 15 words. But its title sits flat on top of the canvas and does not interact with the light.
4. **Sundai:** the rhythm lives inside the definition, in 6 words. It shows how far a single cadence word carries. Its visual execution (small monospaced type, typewriter delay) is weak.
5. **Purdue Hackers:** the title belongs to the same system as the art. That is the quality the owner's references share, and most peers lack it.
6. **Tech@NYU, Penn Labs, AppDev:** clear and quick, but generic. Any campus could put its name on these lines.

On the hackathon model:
- **TreeHacks and Cal Hacks** put the action inside the artwork (a sign, a cloud). It is memorable, but the words become images: TreeHacks has 6 DOM words and Cal Hacks has 2, so title and action are invisible to search and screen readers.
- **Event sites' useful lesson for Proto:** date plus place plus one action is the clearest unit of information on the web. Proto has a weekly version of it (the next hack night, already in D1) and can show it without ever going stale.
- **Nobody fuses title and art in light.** No peer in the 37 lets the title live inside a lit, moving scene the way a WebGL bloom can. The nearest are MHacks (flat title over a canvas), Socratica and Purdue (wordmark as art) and DubHacks (wordmark over an animated mosaic). Proto's bloom already "turns to type", so this is open ground.

### Gaps
- **No awards or write-ups for most sites.** I found no Awwwards recognition for any of these sites. Design write-ups exist only for Purdue Hackers (2022) and Hack the North (2018); the others' rationale is unknown.
- **Missing sites:**
  - BUILDS (builds.bu.edu) timed out at 60 s, and lahacks.com did not respond, so neither is included.
  - Notable groups not tried: Hackers at Berkeley, HackGT, Cornell DTI and Columbia DevFest.
- **Socratica's status is unchecked.** It was started by Waterloo students but works as an open community, not a chartered university group. I did not verify this.
- **Most hackathons were between cycles,** so their first screens reflect an off-season state ("closed", "thank you", "coming soon"). They may look stronger closer to their events.

## 3. What do the best ones say in the first five seconds, and how many words does it take?

### Takeaway
The best first screens say who it is for, what you do and how often. They do it in one headline of 2 to 7 words plus one sentence of 6 to 16 words, then one action of 1 to 3 words. Their whole first screen runs about 14 to 57 words.

Timing barely matters in this peer set. At desktop size, 33 of 37 sites showed all their first-screen text within 1.5 s after DOMContentLoaded. In practice, the first five seconds are the whole first screen.

### Cited Findings
First-screen words exclude nav and footer. All counts are from the 2026-11-07 captures.

| Site | Headline words | Defining line words | First-screen words (desktop / phone) | Primary action |
|---|---|---|---|---|
| [Hack Club](https://hackclub.com/) | 5 | 13 | 57 / 46 | "Join!" with email, plus an age-eligibility line |
| [Socratica](https://socratica.info/) | wordmark (image) | 16 | 28 / 27 | "Attend a session" |
| [MHacks](https://www.mhacks.org/) | 2 | 4 | 14 / 15 | "LIVE" |
| [Sundai](https://www.sundai.club/) | 1 | 6 | 38 / 38 (9 / 13 at 1.5 s) | none in hero |
| [Purdue Hackers](https://www.purduehackers.com/) | 2 | 16 | 21 / 21 | "Build with us" |
| [Tech@NYU](https://techatnyu.org/) | 3 | 10 | 20 / 20 | "Join Discord" |
| [Penn Labs](https://pennlabs.org/) | 5 | 11 | 19 / 37 | "View Products" |
| [Cornell AppDev](https://www.cornellappdev.com/) | 7 | 18 | 29 / 29 | "See all our apps" |
| [V1 @ Michigan](https://v1michigan.com/) | 2 | 22 | 29 / 57 | "Join us" |
| [ScottyLabs](https://scottylabs.org/) | 1, plus a 7-word tagline | 28 | 56 / 49 | "Join our mailing list" |
| [HackMIT](https://hackmit.org/) | 2 | none (date and notify prompt) | 23 / 23 | "Notify me" |
| [TreeHacks](https://treehacks.com/) | image only | none | 6 / 6 | "Apply Now", drawn into the art |
| [Hack the North](https://hackthenorth.com/) | 3 | none (date and status) | 26 / 26 | "Sign Up" with email |
| [Cal Hacks](https://www.calhacks.io/) | image only | none | 2 / 2 in the DOM | "Become a hacker", drawn into the art |
| [BU Spark!](https://www.bu.edu/spark/) | 6 | 19 | 94 / 89 | "Explore all our programs" |
| [BostonHacks](https://bostonhacks.org/) | image only | none | 1 / 11 | none visible |
| [Hack Lodge](https://hacklodge.org/) | 2 | paragraph | 165 / 141 | text link |

- **The four sites whose text changed after 1.5 s:**
  - Sundai: a typewriter takes it from 9 to 38 words by 3 s. — [sundai.club](https://www.sundai.club/)
  - UofTHacks: its date line fades in, going from 1 to 7 words by 6 s. — [uofthacks.com](https://uofthacks.com/)
  - HackPrinceton: its split-flap board fills by 3 s. — [hackprinceton.com](https://www.hackprinceton.com/)
  - HackHarvard: gained 2 words. — [hackharvard.io](https://hackharvard.io/)
- **Rhythm is rare.** Only 2 of 37 first screens state a rhythm: Socratica (weekly sessions) and Sundai (every Sunday). — [socratica.info](https://socratica.info/); [sundai.club](https://www.sundai.club/)
- **Reassurance about who can come is rare too.** Only Hack Club puts one next to its action ("For all teens aged 13–18"). Hack Lodge mentions no formal experience, but buried in a dense paragraph. — [hackclub.com](https://hackclub.com/); [hacklodge.org](https://hacklodge.org/)
- **No one says "free", "no application" or "no experience" up front.** None of the 37 first screens says the group itself is free or needs no application. "Free" appears only in Hack Club's sticker offer and in an event banner. — [hackclub.com](https://hackclub.com/) (and every other URL in the table above)
- **Hack the North's art did the welcoming.** In its 2018 write-up the team said the illustration itself was meant to say "welcoming" and "not intimidating". — [Hack the North 2018 design post](https://graciexia8.github.io/2018/09/20/hack-the-north.html)

### Inferences
- **A working budget for Proto:**
  - a title of 1 to 6 words
  - a statement of 10 to 16 words
  - a reassurance line of 6 to 10 words
  - one primary action, plus at most one live "next hack night" line.

  That is about 25 to 40 words. Two signals from the table:
  - Above about 50 words (ScottyLabs, hackNY, BU Spark!, Hack Lodge) the screen starts to read as a paragraph.
  - Below about 5 DOM words (TreeHacks, Cal Hacks, BostonHacks, Proto today) the screen says nothing to someone who has not heard of the group.
- **What the statement must hold.** Proto's distinctive content is the rhythm (weekly hack night, group trips, a demo night each semester) and the open door (free, no application, no experience). Nearly no peer says either in its first screen, so these are the words to spend the budget on, not a claim about being the best or largest.
- **Draft directions built only from Proto's own facts** (none uses the word "club"):
  - **Name as title, rhythm as statement.**
    - Title: "Proto".
    - Statement: "A hack night every week, hackathons as a group, a demo night every semester."
    - Reassurance: "Any BU student. Free, no application, no experience needed."
    - Action: "Join Proto", next to the live date of the next hack night.
  - **Plain promise as title.**
    - Title: "Make things at BU, every week."
    - Statement: "Proto is a free weekly hack night, with group hackathon trips and a demo night each semester."
    - Action: "Come to hack night".
  - **Rhythm as the title itself,** set as three short lines that echo the three beats of the existing rhythm section:
    - "Every week, hack night."
    - "Every month, a hackathon."
    - "Every semester, demo night."

    Proto's rhythm data says the trips are "about monthly", so the middle line needs that hedge or a looser wording, or the claim will overstate.
- **Keep the title as real text.** The owner wants a title in the bloom's style. The peer evidence says to keep the title as live HTML text, not an image or canvas drawing: 8 of 37 peers lose their title to images or hidden headings. The title can still be lit by, or emerge from, the glyph field visually.

### Gaps
- **Word counts are proxies.** They count DOM text only, so words drawn in images, SVG or canvas are missing (TreeHacks, Cal Hacks, BostonHacks, UofTHacks and Socratica's wordmark). Banner text and repeated marquee text inflate some counts (DubHacks 49 includes a repeating marquee).
- **No reading-time data.** I found no user testing or analytics from any of these groups on what visitors read or remember in the first five seconds. The five-second claim rests on load timing, not reading measurements.

## 4. What should Proto avoid so it stands apart from every campus group?

### Takeaway
Avoid the four moves almost every peer makes:
- size claims ("largest", "best", "premier")
- the "place to build at [school]" sentence, which Proto's hidden h1 already uses
- the mailing list as the main action
- a first screen tied to an event cycle that goes stale.

Also accept that glyph, pixel and terminal styling is common in this world. The glyphs alone will not set Proto apart. The light on true black, and the facts no one else states (weekly, free, no application), will.

### Cited Findings
- **Size claims** appear in the visible first screens of 7 of 37 sites:
  - ADI: "The largest tech community on campus." — [adicu.com](https://www.adicu.com/)
  - DubHacks: "Largest hackathon in the Pacific Northwest" — [dubhacks.co](https://dubhacks.co/)
  - Hack Club: "the world's largest nonprofit movement of teenagers" — [hackclub.com](https://hackclub.com/)
  - MLH: "The World's Largest Developer Community" — [mlh.io](https://mlh.io/)
  - nwPlus: "Leading Western Canada's Biggest Hackathons" — [nwplus.io](https://nwplus.io/)
  - ScottyLabs: "The best place to build software @ CMU" — [scottylabs.org](https://scottylabs.org/)
  - V1: "the premier builder community" — [v1michigan.com](https://v1michigan.com/)

  More size claims sit in page titles and meta descriptions:
  - TreeHacks: "Stanford's premier hackathon" — [treehacks.com](https://treehacks.com/)
  - Hack Western: "Canada's Premier Student-Run Hackathon" — [hackwestern.com](https://www.hackwestern.com/)
  - BostonHacks: "Boston University's largest, annual student-run hackathon" — [bostonhacks.org](https://bostonhacks.org/)
- **The "place for building at [school]" sentence is the commonest positioning line:**
  - ScottyLabs: "The best place to build software @ CMU" — [scottylabs.org](https://scottylabs.org/)
  - Tech@NYU: "The space for hackers, artists, and makers to build @ NYU" (meta: "The place for hackers, builders, and designers to create @ NYU") — [techatnyu.org](https://techatnyu.org/)
  - V1: "premier builder community at the University of Michigan" — [v1michigan.com](https://v1michigan.com/)
  - ADI: "largest tech community on campus" — [adicu.com](https://www.adicu.com/)

  Proto's hidden h1, "the home base for building things at BU", has the same shape. — [home.ts](file:///Users/cjxsez/Desktop/bu-proto/src/content/home.ts)
- **"Build" is everywhere.** A form of "build" appears in 14 of 37 first screens. "Community" appears in 9. — [capture data](file:///private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/peers/raw/)
- **"Build with" phrasings are taken:**
  - Purdue Hackers' only button: "BUILD WITH US" — [purduehackers.com](https://www.purduehackers.com/)
  - TreeHacks' og:description: "Dream big and build with us." — [treehacks.com](https://treehacks.com/)

  Proto's join section is titled "Come build with us". — [home.ts](file:///Users/cjxsez/Desktop/bu-proto/src/content/home.ts)
- **The two signature headlines are taken:**
  - "Where teens make cool stuff." is Hack Club's own headline and page title. — [hackclub.com](https://hackclub.com/)
  - "Built for students, by students" is Penn Labs' h1. — [pennlabs.org](https://pennlabs.org/)
- **Mailing-list, notify or interest-form actions lead the first screen on at least 11 of 37 sites:** ScottyLabs, HackMIT, Hack the North, UofTHacks, nwPlus, HackBeanpot, Hack@Brown, HackIllinois, BoilerMake, Bitcamp, TartanHacks. — [scottylabs.org](https://scottylabs.org/); [hackmit.org](https://hackmit.org/); [hackthenorth.com](https://hackthenorth.com/); [uofthacks.com](https://uofthacks.com/); [nwplus.io](https://nwplus.io/); [hackbeanpot.com](https://www.hackbeanpot.com/); [hackatbrown.org](https://hackatbrown.org/); [hackillinois.org](https://hackillinois.org/); [boilermake.org](https://boilermake.org/); [bit.camp](https://bit.camp/); [tartanhacks.com](https://tartanhacks.com/)
- **Stale or closed states filled 10 of 37 first screens on 2026-11-07:**
  - "We hope you enjoyed the ride!" (HackBeanpot) — [hackbeanpot.com](https://www.hackbeanpot.com/)
  - "Thank You for a Great HackHarvard 2026" — [hackharvard.io](https://hackharvard.io/)
  - TartanHacks 2026 thank-you banner — [tartanhacks.com](https://tartanhacks.com/)
  - DubHacks "has concluded" banner — [dubhacks.co](https://dubhacks.co/)
  - Hack the North "applications are closed" — [hackthenorth.com](https://hackthenorth.com/)
  - Hack Western "Applications closed" — [hackwestern.com](https://www.hackwestern.com/)
  - Bitcamp "see you in April 2027" — [bit.camp](https://bit.camp/)
  - Hack Lodge's Winter 2023 call — [hacklodge.org](https://hacklodge.org/)
  - BostonHacks "Apps closed" — [bostonhacks.org](https://bostonhacks.org/)
  - HackPrinceton's board showing applications closed — [hackprinceton.com](https://www.hackprinceton.com/)
- **Eight sites have no readable heading for their title:**
  - TreeHacks, Cal Hacks, UofTHacks, Generate, ADI and TartanHacks have no h1.
  - BostonHacks has an empty h1.
  - HackPrinceton's h1 is 16px and offscreen.

  — [treehacks.com](https://treehacks.com/); [calhacks.io](https://www.calhacks.io/); [uofthacks.com](https://uofthacks.com/); [generatenu.com](https://generatenu.com/); [adicu.com](https://www.adicu.com/); [tartanhacks.com](https://tartanhacks.com/); [bostonhacks.org](https://bostonhacks.org/); [hackprinceton.com](https://www.hackprinceton.com/)
- **Glyph, pixel, ASCII and terminal styling is common:**
  - ScottyLabs' dog is drawn from code glyphs. — [scottylabs.org](https://scottylabs.org/)
  - Purdue Hackers: pixel type and pixel life forms. — [purduehackers.com](https://www.purduehackers.com/)
  - DubHacks: an animated pink pixel mosaic. — [dubhacks.co](https://dubhacks.co/)
  - Socratica: a pixel-stepped wordmark. — [socratica.info](https://socratica.info/)
  - ADI: an ASCII terminal. — [adicu.com](https://www.adicu.com/)
  - Sundai, Generate and Tech@NYU lean on monospaced type. — [sundai.club](https://www.sundai.club/); [generatenu.com](https://generatenu.com/); [techatnyu.org](https://techatnyu.org/)
- **The palette overlaps.**
  - ScottyLabs' glyph dog runs blue to violet to red, the nearest hue match to Proto's electric blue and pink. — [scottylabs.org](https://scottylabs.org/)
  - DubHacks is hot pink. — [dubhacks.co](https://dubhacks.co/)
  - Hack@Brown and nwPlus are purple. — [hackatbrown.org](https://hackatbrown.org/); [nwplus.io](https://nwplus.io/)
- **Glass pill navs are already in use** at MHacks and UofTHacks, and TartanHacks uses frosted-glass 3D tiles. — [mhacks.org](https://www.mhacks.org/); [uofthacks.com](https://uofthacks.com/); [tartanhacks.com](https://tartanhacks.com/)
- **Several peers break on a 390 px phone:**
  - BU Spark!'s two h1 lines overlap. — [bu.edu/spark](https://www.bu.edu/spark/)
  - V1's title is clipped at the top. — [v1michigan.com](https://v1michigan.com/)
  - ADI's ASCII letters shrink to 7.2px. — [adicu.com](https://www.adicu.com/)
  - HackPrinceton's board text shrinks to 6.3px. — [hackprinceton.com](https://www.hackprinceton.com/)
  - ScottyLabs' art drops below the fold. — [scottylabs.org](https://scottylabs.org/)
- **BU neighbours:**
  - BostonHacks speaks in a dated event theme ("Boston Bound", a subway map). — [bostonhacks.org](https://bostonhacks.org/)
  - BU Spark! leads with launching products and a program grid. — [bu.edu/spark](https://www.bu.edu/spark/)
  - Proto's Launch track already points founders to Spark!. — [home.ts](file:///Users/cjxsez/Desktop/bu-proto/src/content/home.ts)

### Inferences
- **Words to avoid in the hero:**
  - any size or rank claim (best, largest, premier, leading). Proto is new, and these words are what every peer says.
  - "the place / space / home base for building at BU".
  - "build with us" and "Build something…" or "Build what's…" openers.
  - "by students, for students".
  - the "Where [people] [verb]" construction, which belongs to Hack Club.
  - abstractions like "impact", "change the world" or "enhance campus life".
  - "launch products", which is BU Spark!'s territory.
- **What to own instead:**
  - The rhythm: every week, every month, every semester.
  - The open door: free, no application, no experience. No peer states it in the first screen.
  - The specific place: BU. A named weekday, time or room would make it sharper still; Proto's next event already comes from D1.
- **Actions:**
  - Make the primary action an invitation to a real thing, such as joining or coming to the next hack night, not a newsletter.
  - Keep any email capture secondary.
  - Never leave a "closed" or "thanks for coming" state in the hero. The weekly cadence means Proto's hero never needs one.
- **Visual distinctness:**
  - Distinctness must come from light, depth and the true-black ground, not from glyphs or the blue/pink hues. Several peers share each of those.
  - The opening no peer uses is a title that belongs to the bloom: lit by it, cut from it, or resolving out of it. The title stays real, selectable HTML text with the h1 visible.
  - The glass capsule nav is shared with MHacks and UofTHacks, so it should not be counted on as a signature.
- **Mobile:** make the phone first screen work as its own composition. Several peers clip, overlap or shrink their titles at 390 px. Proto's bloom leaves a dark lower fifth on phones, which is a natural seat for the statement and action.

### Gaps
- **The owner's references were not studied here.** Lusion, Oryzo and craft.wild.as are not student organisations, so this note does not analyse how they set titles in light. The claim that no peer does it rests only on the 37 sites captured.
- **Nothing measured on newcomers.** I found no data on how BU students in particular respond to size claims versus open-door wording. The recommendation to lead with "free, no application" rests on its absence from every peer first screen, not on a test.
