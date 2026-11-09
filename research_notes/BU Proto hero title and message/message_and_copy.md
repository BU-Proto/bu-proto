# BU Proto hero: what the title and statement should say

*Scope: message and copy only. Repo read-only. The evidence is desk research, first-screen captures of 9 reference sites (Playwright, 1440×900, 2026-11-07) and a type-fit test on the local hero. There was no user testing. Working files are in `/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/msg/`.*

## 1. What must a hero say in the first five seconds, and how long should the title and subline be?

### Takeaway
In five seconds a visitor reads about 20 words. The art wins the first glance, but the words have to say what Proto is, who it's for and what to do next. Keep the title to 2–5 words (no more than about 24 characters, so it sets at 70 px or more in two lines on a phone). Make the statement one sentence of 16 words or fewer, so title plus statement comes to about 20 words. The current copy is 34 words, about 8.6 s, so a five-second reader stops halfway through the lede.

### Cited Findings
- Microsoft Research data (205,873 pages, more than 2 billion dwell times) shows leaving is most likely in the first seconds. NN/g's summary says "Users often leave Web pages in 10–20 seconds" and that the value proposition must land "within 10 seconds." — [NN/g, How long do users stay](https://www.nngroup.com/articles/how-long-do-users-stay-on-web-pages/)
- Visual appeal is judged in about 50 ms, and that first impression colours later judgements of usability and credibility (Lindgaard et al. 2006, *Behaviour & Information Technology* 25:115–126). This is secondary reporting; the paper itself was not read. — [Digital Trends](https://www.digitaltrends.com/home/surfers-judge-web-pages-seen-for-only-50ms/)
- Adults silently read English non-fiction at 238 words per minute on average, and most fall between 175 and 300 (meta-analysis of 190 studies). — [Brysbaert 2019, *J. Memory and Language* 109](https://www.Gwern.net/doc/psychology/linguistics/2019-brysbaert.pdf)
- NN/g's homepage principles:
  - Treat the homepage as "an elevator pitch to prospective customers."
  - Add a concise tagline unless the name makes the offering obvious.
  - "Avoid purely decorative or unhelpful graphics."
  - Put top priorities above the fold, because "if everything is emphasized, nothing stands out."

  — [Wang, NN/g 2024](https://www.nngroup.com/articles/homepage-design-principles/)
- NN/g: open the homepage with a tagline that "summarizes what the site or company does". This matters most for new or little-known organisations. Start the title tag with the name, then a short description. — [Nielsen, NN/g 2002](https://www.nngroup.com/articles/top-ten-guidelines-for-homepage-usability/)
- Taglines must say what you do and what sets you apart. Claims no rival would dispute have "zero informative value." NN/g offers two tests:
  - Blind test: strip the names from your tagline and three rivals' and see whether people can tell which is which.
  - Opposite test: write the opposite of your copy. If no one would publish the opposite, the original says little.

  — [Nielsen, Tagline Blues, NN/g 2001](https://www.nngroup.com/articles/tagline-blues-whats-the-site-about/)
- People scanning a line see about its first two words (11 characters). In an 80-person study, 35% of links gave no idea where they led from those characters alone, so put the meaning first. — [Nielsen, NN/g 2009](https://www.nngroup.com/articles/first-2-words-a-signal-for-scanning/)
- 57% of viewing time is above the fold and 74% within the first two screenfuls (120 participants, 2018). Minimalist pages with "false floors" can make people stop scrolling. — [NN/g, Scrolling and Attention](https://www.nngroup.com/articles/scrolling-and-attention/)
- Five-second tests capture "initial impressions of designs" and suit pages with one purpose. They don't measure how well a whole homepage works. — [Perfetti, UIE 2005](https://archive.uie.com/brainsparks/2005/12/09/5-second-tests-dont-tell-us-everything/)
- Header test: someone who reads only the header should know what you offer. Avoid slogans. Hook with a bold, specific claim or by answering the main objection. The subheader is one or two sentences saying what it is. — [Shapiro, Julian.com landing pages](https://www.julian.com/guide/startup/landing-pages)
- In one MECLABS split test, a plainer headline beat a clever one by 330% in conversions. This is a single vendor case study. — [MarketingSherpa 2020](https://marketingsherpa.com/article/case-study/clear-marketing-messages-5-quick-case-studies)
- Headline length: practitioner advice clusters at 5–12 words. One analysis of SaaS homepages reports a median of 6 words and 38 characters, and calls this "a description of normal practice, not a lever." I saw only the search summary; the page returned HTTP 429. — [BigIdeasDB](https://bigideasdb.com/what-saas-homepage-headlines-actually-say)
- The local hero changed during this research:
  - At the start, `Hero.tsx` drew only the bloom and a visually hidden h1.
  - By the end, it set the headline (10 words), the lede (24 words) and "Join Proto" in "a centred column low on the screen."

  — [Hero.tsx](/Users/cjxsez/Desktop/bu-proto/src/components/Hero.tsx), [home.ts HERO_COPY](/Users/cjxsez/Desktop/bu-proto/src/content/home.ts)
- buproto.com's first screen today shows the same headline at 64 px, the lede at 19 px and "Join Proto", with 45 words in view. — [first-screen capture](/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/msg/extract.json)
- Fit test, measured with the site's display face (Host Grotesk 500, −0.035em tracking, balanced line breaks; 358 px measure on a 390 px phone, 821 px measure on desktop). Largest size that fits two lines on a phone:
  - "Bring half an idea." 89 px
  - "Build things at BU." 73 px
  - "Nobody arrives ready." 63 px
  - "Everything starts as a proto." 50 px
  - "BU students who build things together." 39 px
  - Current headline: 35 px (47 px over three lines)

  — [fit.json](/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/msg/fit.json)

### Inferences
- **Word budget.** 5 s at 238 wpm is about 20 words; slow and fast readers range from about 15 to 25. Title plus statement must fit inside that. The button label, the reassurance line and the proof line get read next, and don't count toward it.
- **The current copy is too long.** 34 words take about 8.6 s. A five-second reader gets the headline and about half of the lede's list. In the blind test, "home base for building things at BU" fails too (see Q3).
- **Title.** 2–5 words, no more than about 24 characters. That length reaches 70 px or more in two lines on a phone, which a title needs to hold its own against a full-screen bloom.
- **Statement.** One sentence of 16 words or fewer. Start with who it is ("BU Proto…") and follow at once with the concrete thing ("a hack night every week…"), because readers scanning take in the first two words.
- **The words have to carry the meaning.** The bloom is decorative, which is the kind of graphic NN/g warns about, so every bit of meaning has to come from the words. In my overlays, the statement at 17–21 px over the bright bloom was hard to read on a phone. It needs room or contrast more than the title does. Screenshots: [phone sheet](/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/msg/fit_sheet_m.png), [desktop A1](/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/msg/fit_d_A1.png).
- **Signal that the page continues.** The hero fills the screen and is mostly picture. A title block sitting low, with the next section showing just below it, protects against the "false floor" effect.

### Gaps
- No five-second test with BU students; the word budget is arithmetic, not observation.
- No rigorous study shows that a given headline length raises conversion.
- No source found for a Krug word-count rule. A book synopsis only separates a motto, which states a principle, from a tagline, which states the value ([synopsis](https://yanoff.org/books/synopsis-dont-make-me-think.shtml)).

## 2. What single idea separates Proto from a course, a career fair, a hackathon and every other campus group?

### Takeaway
**Proto is where you can start unfinished, and keep going until it's on a stage.** Every alternative asks you to arrive with something: a place on a course, a finished résumé, a team and an idea by Friday night, or proof you're already talented. Proto asks for half an idea. Then every week it supplies the rest: food, people to ask, a team, a trip and a stage, "finished or not." "Half an idea" is a phrase already on the site. It answers the barrier students report most and no peer uses it, so it is the phrase to own.

### Cited Findings
**What the repo says Proto is (src/content):**
- "Nobody arrives with a plan." You come "with half an idea, find people," and "by the end of the semester it's on a stage." — [home.ts JOURNEY](/Users/cjxsez/Desktop/bu-proto/src/content/home.ts)
- First step: "Come to a hack night with an idea, or without one." — [home.ts JOURNEY.steps](/Users/cjxsez/Desktop/bu-proto/src/content/home.ts)
- Demo night: "Anyone can show anything, finished or not." — [about.ts OFFER](/Users/cjxsez/Desktop/bu-proto/src/content/about.ts)
- It is free, "with no application and no experience needed," and "for any BU student." — [about.ts WHAT](/Users/cjxsez/Desktop/bu-proto/src/content/about.ts), [join.ts](/Users/cjxsez/Desktop/bu-proto/src/content/join.ts)
- "Building something is easier with people to ask." — [about.ts WHY](/Users/cjxsez/Desktop/bu-proto/src/content/about.ts)
- The rhythm: a hack night every week, open to all, with food; a hackathon trip about once a month, as a group; a demo night each semester. — [home.ts RHYTHM](/Users/cjxsez/Desktop/bu-proto/src/content/home.ts)
- Team matching, and a veteran with you at your first hackathon. Three tracks, Start, Build and Launch: "Move whenever you like." — [home.ts TRACKS](/Users/cjxsez/Desktop/bu-proto/src/content/home.ts), [about.ts](/Users/cjxsez/Desktop/bu-proto/src/content/about.ts)
- Closing beat: "Nobody arrives ready. We said come anyway. They built something." — [home.ts JOIN_CTA.aside](/Users/cjxsez/Desktop/bu-proto/src/content/home.ts)
- Proto is "the community layer that feeds BU's existing programs (Spark!, Innovate@BU), not a competitor." The docs say not to use the word "club" anywhere on the site. This is from docs/concept.md, not src/content. — [concept.md](/Users/cjxsez/Desktop/bu-proto/docs/concept.md)

**What the site can't back yet (as of 2026-11-07):**
- The hack night slot isn't booked. The Thursday 7–10 PM time at CDS is placeholder copy. — [site.ts SCHEDULE](/Users/cjxsez/Desktop/bu-proto/src/content/site.ts), [events.ts HACK_NIGHT](/Users/cjxsez/Desktop/bu-proto/src/content/events.ts)
- The production calendar has one event: a Nov 17 panel co-hosted with J and the BU Cybersecurity Association. There is no hack night or demo night. — [buproto.com events API](https://buproto.com/api/content/events)
- There are 38 real hackathon listings, but none shows anyone going or a planned trip (`buGoing` 0, no trip text). — [buproto.com hackathons API](https://buproto.com/api/content/hackathons)
- The fund isn't funded. The first board is still forming. "BU Proto is a working name." — [grants.ts](/Users/cjxsez/Desktop/bu-proto/src/content/grants.ts), [about.ts WHO](/Users/cjxsez/Desktop/bu-proto/src/content/about.ts), [site.ts FOOTER](/Users/cjxsez/Desktop/bu-proto/src/content/site.ts)
- The footer says "Nothing here is official with Spark! or Innovate@BU yet." Yet the Track Record partner wall lists Boston University and Spark! as partners, and the README and concept doc call Proto "BU-sponsored." These conflict. — [site.ts](/Users/cjxsez/Desktop/bu-proto/src/content/site.ts), [trackRecord.ts](/Users/cjxsez/Desktop/bu-proto/src/content/trackRecord.ts), [concept.md](/Users/cjxsez/Desktop/bu-proto/docs/concept.md)

**Evidence on the barrier Proto removes:**
- Warner & Guo (ICER 2017) drew on 256 survey responses. Among students who knew about hackathons and had never gone, the top deterrent was "novice fears," cited by 65% of women and 33% of men (N=130). — [Warner & Guo PDF](https://jeremywrnr.com/papers/student-perceptions-of-college-hackathons_ICER-2017.pdf)
- Attendees who arrived without "a team or idea" struggled to find a team: 33% of women and 15% of men reported it (N=126). Asking for help "can be intimidating" for a novice. One respondent felt alienated by "The Hacker stereotype" in hackathon marketing. — [Warner & Guo PDF](https://jeremywrnr.com/papers/student-perceptions-of-college-hackathons_ICER-2017.pdf)
- Stereotyped objects in a computer-science setting lowered women's interest in CS. The study ran four experiments with more than 250 students from outside CS. — [Cheryan et al. 2009, JPSP](https://pubmed.ncbi.nlm.nih.gov/19968418/)
- A one-hour exercise told new students that doubts about belonging are common and pass. It improved Black students' grades over three years (N=92); a later follow-up found no benefit for white students. — [Walton & Cohen 2011, Science](https://pubmed.ncbi.nlm.nih.gov/21415354/)

**How peers frame themselves (captured 2026-11-07):**
- ScottyLabs: "The best place to build software @ CMU."
- Purdue Hackers: backs "highly talented and curious individuals."
- South Park Commons: "the most talented founders and technologists."
- Recurse Center: "Start your application."

— [captures](/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/msg/extract.json), [Purdue Hackers](https://www.purduehackers.com/), [SPC](https://www.southparkcommons.com/), [Recurse](https://www.recurse.com/)

**Other BU groups:**
- BostonHacks has been BU's hackathon since 2015. This is older press coverage. — [Daily Free Press](https://dailyfreepress.com/tag/bostonhacks)
- Hack4Impact BU builds software for nonprofits. — [GitHub](https://github.com/Hack4Impact-BU)
- Spark! is described as "BU's lab for building things, with mentors." — [site.ts nav](/Users/cjxsez/Desktop/bu-proto/src/content/site.ts)

**Phrase collisions** (exact-phrase web searches):
- "bring half an idea": no brand uses it.
- "nobody arrives ready": no brand uses it.
- "build before you're ready": a common self-help motto, so not ownable.

— [search: bring half an idea](https://medium.com/@catalanotto/present-half-baked-ideas-84f8e95dbd39), [search: build before you're ready](https://dennisconsulting.substack.com/p/build-before-youre-ready-confidence)

### Inferences
- **What each alternative asks of you, from April Dunford's question of what students would do without Proto.** The descriptions of courses and career fairs are my own framing, not data.
  - Course: you need a place on it, a syllabus and a grade at the end. Proto: your own idea, no application. "No grades" isn't in the repo, so keep it out of the copy.
  - Career fair: one day, a finished résumé, and you're judged on it. Proto: every week, and unfinished work is welcome ("finished or not").
  - Hackathon: one weekend, and you need a team and an idea when you arrive. The research shows that's a top barrier. Proto: the weekly way in, plus team matching, a veteran for your first one and a group trip. Proto feeds hackathons; it doesn't compete with them.
  - Other campus groups: peers present themselves through talent, BostonHacks is one event a year, Hack4Impact builds for clients, and Spark! is a lab with mentors. Proto: open, weekly, any track, and the layer that feeds those programs.
- **The idea in one line:** you can start unfinished here. The name agrees, since a proto is the unfinished first version. "Half an idea" is the most concrete form of that idea already on the site.
- **The title should be the one thing still true if a schedule slips or the name changes.** Weekly hack nights, monthly trips and demo night are all promised but not yet running. "Half an idea" depends on none of them.
- **Keep "hack" and "hacker" out of the title.** Applying the stereotype-cue findings from objects to words is an inference, but it is low-cost to follow. "Hack night" can appear in the statement as the plain name of the event.
- **Make no "BU's" or "official" claim in the hero** until the conflict over partners and sponsorship is resolved.

### Gaps
- No BU-specific data on why students skip build events.
- I found no source for the course and career-fair contrasts; they are framing.
- Unknown whether "every week" and "group trips" will be true at launch.

## 3. Should the title be the name, a promise, an invitation or a statement? What do strong community brands do?

### Takeaway
Use an **invitation that answers the main objection as the title, with a plain one-line definition under it.** Put the name in the nav and in the statement's first words. This is what the owner's own references do: an Oryzo-style two-beat line or "Craft, engineered.", each sitting on a literal descriptor. Every strong brand checked says what it is in plain words on the first screen. A title that is only the name works when the name explains itself, as "Purdue Hackers" does, or when the wordmark is the art and the statement is excellent, as at Socratica. "Proto" doesn't explain itself, already appears in the nav and is a working name.

### Cited Findings
| Brand | Title (h1 or largest text) | Kind | Plain definition on screen | CTA | Words in view |
|---|---|---|---|---|---|
| Recurse Center | "…is a retreat for curious programmers." (54 px) | Statement | Sub at fold: "Rediscover the joy of computing" | "Start your application" | 53 |
| South Park Commons | "…helps you go from -1 to 0" (70 px) | Owned idea | "a home for the most talented founders and technologists" | "Apply" (+ "What is -1?") | 53 |
| Hack Club | "Where teens make cool stuff." (90 px) | Statement | "nonprofit movement of teenagers making cool projects" | "Join!" (email) | 67 |
| Socratica | Large wordmark + 30 px line | Name + statement | "We host weekly co-working sessions" | "Attend a session" | 28 |
| Purdue Hackers | "Purdue Hackers" (136 px) | Name | "highly talented and curious individuals…" | "Build with us" | 28 |
| ScottyLabs | Name (60 px) + "The best place to build software @ CMU" (30 px) | Superlative claim | "student-run organization dedicated to building tech…" | "Join our mailing list" | 49 |
| Lusion | "We create 3D visual storytelling and interactive web experiences…" (36 px) over a WebGL scene | Statement | The h1 itself | "Let's talk" | 37 |
| Oryzo (Lusion showcase) | "Made for mugs. Built for tables." | Two-beat idea | "The world's most unnecessarily sophisticated cork coaster." | "Play" | n/a |
| craft.wild.as | "Craft, engineered." (75 px) | Two-word idea | "A design & technology partner for modern brands" (small, top right) | none | 50 |

Sources: [first-screen captures, 1440×900](/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/msg/extract.json); [contact sheet](/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/msg/brand_sheet.png); [Recurse](https://www.recurse.com/); [SPC](https://www.southparkcommons.com/); [Hack Club](https://hackclub.com/); [Socratica](https://socratica.info/); [Purdue Hackers](https://www.purduehackers.com/); [ScottyLabs](https://www.scottylabs.org/); [Lusion](https://lusion.co/); [Oryzo](https://oryzo.ai/) (fetched as text; the footer says it is a fictional Lusion project); [craft.wild.as](https://craft.wild.as/).
- The tagline is needed unless the name makes the offering obvious. — [NN/g 2024](https://www.nngroup.com/articles/homepage-design-principles/)
- Harry Dry's three tests for a line: can I picture it, can I prove it false, and could nobody else say it? Three yeses means you're onto something. — [Upgrow summary of Dry](https://upgrow.io/blog/harry-dry-copywriting-3-rules)
- A strong hook can be the answer to the main objection, but avoid slogans that don't say what you offer. — [Shapiro](https://www.julian.com/guide/startup/landing-pages)
- Blind test on real lines. Proto's current h1 and ScottyLabs' title share one frame, the best place or home base to build at a named school. Swap CMU and BU and nobody could tell them apart. — [home.ts](/Users/cjxsez/Desktop/bu-proto/src/content/home.ts), [ScottyLabs](https://www.scottylabs.org/)

### Inferences
- **What strong brands do:**
  - They state plainly what they are on the first screen, even art-led showcase sites (Lusion, Oryzo, craft.wild.as).
  - When the title is an idea (SPC, Oryzo, craft.wild.as), a literal line always sits beside it.
  - They pick a side. Selective brands lead with talent or an application (SPC, Purdue Hackers, Recurse); open brands lead with you or what you'll do (Hack Club, Socratica).
  - The best CTAs name the real first step ("Attend a session").
  - First screens carry 28–67 words in view, nav included (median about 50). Proto's target is about 20 words of message plus nav, button and proof, roughly 40 in all, which sits within that range.
- **Name as title:** it fails NN/g's rule unless a strong statement sits right beside it. It also repeats the nav and spends the largest type on a working name that explains nothing. Socratica shows it can work. For Proto, though, the bloom is already the art, and a giant wordmark would compete with it. Viable only as an art treatment.
- **Promise** ("Half an idea to a stage"): an outcome promise rests on demo night actually happening, and none is scheduled. Highest risk on truth.
- **Statement** ("Build things at BU."): the clearest header on its own. But it fails "could nobody else say it", since Spark! could, and it repeats the frame ScottyLabs already uses. Use it as the control.
- **Invitation** ("Bring half an idea."):
  - It answers the barrier the research measured.
  - You can picture it.
  - It passes the opposite test: "bring a finished plan" or "highly talented individuals" is exactly what selective programs say.
  - It holds up whatever the launch state, and survives a rename, because it carries no name and no date.
- **"In this style":**
  - Set the title huge over the bloom with a balanced break: "Bring half / an idea." Avoid the orphaned "idea." the desktop overlay produced.
  - Show the statement at a readable size on the calmest part of the bloom.
  - Keep the name in the nav, plus the statement's opening "BU Proto". Drop a separate eyebrow to save words.
  - The bloom already "turns to blocks in its own light", so the title could be literally half-made, with "idea." still resolving out of the glyphs and settling within a second. This is a creative inference. The DOM text must be complete from first paint, and fully static when the user prefers reduced motion.
- **Page title:** follow NN/g with the name plus a short description, for example "BU Proto · Hack nights, hackathon trips and demo nights at BU." The current local title is just "BU Proto."

### Gaps
- Oryzo's first screen could not be screen-captured (timeout); its text comes from WebFetch only. MLH, YC, v1 Michigan, Sundai and Generate were not captured.
- I found no data comparing name-led and idea-led hero titles for community organisations.

## 4. Candidate title and subline pairs, ranked

### Takeaway
**Number 1 is "Bring half an idea." with "BU Proto: a hack night every week, group trips to hackathons, a demo night each semester."** That is 20 words, about 5.0 s, and 89 px in two lines on a phone. The runners-up are a two-beat version and a warmer "exchange" statement. "Nobody arrives ready." is the strongest alternative with a different voice. Use "Build things at BU." with the same statement as the control in any five-second test.

### Cited Findings
- **Every fact in the candidates is in src/content:**
  - weekly hack night, with food: [home.ts RHYTHM](/Users/cjxsez/Desktop/bu-proto/src/content/home.ts), [events.ts](/Users/cjxsez/Desktop/bu-proto/src/content/events.ts)
  - people to ask: [about.ts](/Users/cjxsez/Desktop/bu-proto/src/content/about.ts)
  - group trips to hackathons: [home.ts TRACKS](/Users/cjxsez/Desktop/bu-proto/src/content/home.ts)
  - demo night each semester, anyone can show anything: [home.ts](/Users/cjxsez/Desktop/bu-proto/src/content/home.ts)
  - a stage: [join.ts PERKS](/Users/cjxsez/Desktop/bu-proto/src/content/join.ts)
  - half an idea, nobody arrives ready, come anyway: [home.ts](/Users/cjxsez/Desktop/bu-proto/src/content/home.ts)
  - free, no application, no experience needed, any BU student: [about.ts](/Users/cjxsez/Desktop/bu-proto/src/content/about.ts)
  - "Show up. Team up. Build. Ship.": [home.ts JOURNEY.title](/Users/cjxsez/Desktop/bu-proto/src/content/home.ts)
  - "BU students who build things together": [about.ts](/Users/cjxsez/Desktop/bu-proto/src/content/about.ts)
- Phone sizes in the table come from the fit test; "est." marks lines I estimated from measured lines of similar length. — [fit.json](/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/msg/fit.json)
- Reading time is word count at 238 wpm. — [Brysbaert 2019](https://www.Gwern.net/doc/psychology/linguistics/2019-brysbaert.pdf)
- Overlays of the top four directions on the real hero, phone and desktop. — [phone sheet](/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/msg/fit_sheet_m.png), [desktop sheet](/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/msg/fit_sheet_d.png)

### Inferences
**How each pair was scored.** The scoring is mine, a desk test, with five checks:
- **5 s:** does title plus statement answer What is it? Who is it for? What do I do? (score out of 3)
- **Budget:** words and seconds for title plus statement, aiming for about 20.
- **Dry:** a ✓, ~ or ✗ for each of the three tests: can you picture it (V), can it be proven false (F), could nobody else say it (U).
- **Phone size:** largest two-line size on a 390 px phone.
- **Risk:** truth risk (does the claim depend on something not running yet) and voice risk.

| # | Voice | Title | Statement | Words / s | Phone (2 lines) | 5 s | Dry V·F·U | Main risk |
|---|---|---|---|---|---|---|---|---|
| 1 | Invitation | Bring half an idea. | BU Proto: a hack night every week, group trips to hackathons, a demo night each semester. | 20 / 5.0 | 89 px | 3/3 | ✓·✓·✓ | The title alone doesn't define Proto; the statement must be legible |
| 2 | Two-beat | Bring half an idea. Build the rest together. | BU Proto: a hack night every week, with food and people to ask. | 21 / 5.3 | ~70 px over 4 lines (est.) | 3/3 | ✓·✓·✓ | Longer, so smaller type; reads more like a slogan; "together" implies a team |
| 3 | Exchange | Bring half an idea. | We'll bring the food and the people to ask. BU Proto is a hack night every week. | 21 / 5.3 | 89 px | 3/3 | ✓·✓·✓ | Leaves out trips and demo night; repeats "people to ask" from the lead paragraph under the hero (WHY) |
| 4 | Confession | Nobody arrives ready. | Come anyway. BU Proto is a free hack night every week for any BU student. | 18 / 4.5 | 63 px | 3/3 | ~·~·~ | Ambiguous alone; a negative first word in display type; uses up the closing beat (JOIN_CTA) |
| 5 | Reassurance | Half an idea is enough. | Bring it to BU Proto: a hack night every week, with food and people to ask. | 21 / 5.3 | 71 px | 3/3 | ✓·✓·✓ | Same idea as #1 but less vivid; "enough for what?" |
| 6 | Plain (control) | Build things at BU. | Same as #1 | 20 / 5.0 | 73 px | 3/3 | ~·✓·✗ | Generic; Spark! could say it; same frame as ScottyLabs |
| 7 | Process | Show up. Team up. Build. Ship. | Same as #1 | 22 / 5.5 | 55 px | 3/3 | ✓·✓·~ | "Ship" is jargon for Start-track students; takes the journey section's title |
| 8 | Name as art | Proto | BU students who build things together: a hack night every week, free, no experience needed. | 16 / 4.0 | 160 px | 2/3 | ✗·✗·✓ | Repeats the nav; working name; the largest type explains nothing (Socratica is the best precedent) |
| 9 | Wry | Finished is optional. | At BU Proto's demo night, anyone can show anything. Hack night is every week, and it's free. | 20 / 5.0 | 81 px | 2/3 | ~·✓·✓ | Makes sense only after the statement; leads with demo night, which isn't scheduled |
| 10 | Arc | Half an idea to a stage. | BU Proto: build it at hack night every week, show it at demo night each semester. | 22 / 5.5 | 71 px | 3/3 | ✓·✓·✓ | An outcome promise that holds only once demo night runs |
| 11 | Manifesto | Start unfinished. | Same as #1 | 18 / 4.5 | ~100 px (est.) | 3/3 | ✗·~·✓ | Abstract; hard to picture |
| 12 | Collective | BU students who build things together. | A hack night every week, group trips to hackathons, a demo night each semester. | 20 / 5.0 | 39 px | 2/3 | ✓·✓·✗ | Long title means small type; no "Proto" on screen except the nav |
| 13 | Dare | Come anyway. | Nobody arrives ready. BU Proto is a free hack night every week, no experience needed. | 17 / 4.3 | 104 px | 3/3 | ✗·✗·✗ (title alone) | Opaque until the statement is read |
| 14 | Name play | Everything starts as a proto. | BU Proto is a free hack night every week. Bring yours, however unfinished. | 18 / 4.5 | 50 px | 3/3 | ~·✗·✓ | Can read as a prototyping tool; tied to a working name; "proto" as a noun is jargon |
| 15 | People | Nobody builds alone. | BU Proto: a hack night every week with food, people to ask and a team. | 18 / 4.5 | 68 px | 2/3 | ~·✗·✗ | Generic; an absolute claim |
| 16 | Question | What are you building? | Bring it to BU Proto, even if it's half an idea: a free hack night every week. | 21 / 5.3 | 64 px | 3/3 | ~·✗·✗ | Assumes the reader is already building, which shuts out the Start track |
| – | Current baseline | Proto is the home base for building things at BU | We're BU students who build things together: … (current lede) | 34 / 8.6 | 35 px | 2/3 | ✗·✗·✗ | Interchangeable with ScottyLabs; over the 5 s budget |

**Why #1 wins:**
- It is the only line on the site that answers both research barriers in four words: arriving with "no team or idea", and "novice fears."
- "Bring" implies a place and a time, so the button follows naturally from it.
- It names no date or schedule, so it stays true before launch, and it survives a rename.
- At 89 px in two lines on a phone, it has the presence a full-screen bloom needs.
- The statement carries the definition in 16 words, opening with "BU Proto" and then "hack night", which are the two terms that matter most to someone scanning.
- **Weakness:** the title alone doesn't define Proto. That is deliberate, but it means the statement must be legible at a glance.

**Line notes:**
- **#2** is the pick if the owner wants the verb "build" in the title.
- **#3** is warmer, but it trades away completeness.
- **#4** borrows the site's best closing line and is the strongest emotional alternative. It is the most evidence-backed for normalising nerves (Walton & Cohen), but it is ambiguous on its own.
- **#6 is the control:** if #1 can't beat it on "What is this?", ship #6's title with #1's statement.

**Five-second test to run** (Perfetti: results are directional only):
- Show 5–8 BU students who aren't in Proto, at least half not in CS, each version for 5 s on a phone.
- Ask:
  1. What is this?
  2. Who is it for?
  3. What would you do next?
  4. What words do you remember?
- **Pass bar:** at least 4 of 5 say something like a weekly build or hack night at BU, and at least 3 of 5 recall the title.
- Test #1 against #6 with the same statement.

### Gaps
- None of the pairs has been tested with real students. The scores are my own desk judgements.
- Two of the phone sizes (#2, #11) are estimates.

## 5. What should the action be, and what proof belongs on the first screen?

### Takeaway
**Use one action: "Join Proto"** to /join. That is the same label as the nav and the join page. Put "Free. No application. No experience needed." beside it. **Use one proof line, and only from real data:** the next real hack night with day, time, place and "Add to calendar". Until a hack night is booked, say they're being planned and that joining gets you an email before the first one. Keep the sample schedule, third-party events and the win tally off the first screen. As recorded, the "Best First-Time Hacker" win can't carry the message that beginners are welcome.

### Cited Findings
- "Get Started" stopped users. In one 8-user study, 6 clicked it expecting information. Users stop scanning once they see such a button, and one said she wouldn't sign up until she knew "what it is." A CTA should say what you get. — [Harley & Flaherty, NN/g 2017](https://www.nngroup.com/articles/get-started/)
- The CTA should be the next step in the story the header starts. — [Shapiro](https://www.julian.com/guide/startup/landing-pages)
- Keep major calls to action above the fold. — [NN/g, Scrolling and Attention](https://www.nngroup.com/articles/scrolling-and-attention/)
- **Plans with a when and where raise follow-through:**
  - Implementation intentions: d = .65 across 94 tests (Gollwitzer & Sheeran 2006). — [KOPS record](https://kops.uni-konstanz.de/entities/publication/2e749bfb-8533-437c-8203-7e788c910c5f)
  - A 2024 update of 642 tests gives smaller bias-corrected effects, d of 0.15 to 0.35 (secondary summary). — [summary](https://goalsandprogress.com/implementation-intentions-research/)
  - Prompting staff to write the date *and time* they planned to be vaccinated raised flu vaccination by 4.2 percentage points over a 33.1% baseline. Writing the date alone did not make a significant difference. — [Milkman et al. 2011, PNAS](https://pmc.ncbi.nlm.nih.gov/articles/PMC3127912)
  - Students given a specific action plan were more likely to get tetanus shots, though "A specific plan was not sufficient for action to appear" without motivation (Leventhal et al. 1965). The 3%/28% and campus-map details were not verified. — [abstract](https://cbsm.com/articles/31643-effects-of-fear-and-specificity-of-recommendation-upon-attitudes-and-behavior)
- **Competition deters some students:** "Competitive" was cited by 20% of men and 5% of women among attendees, and "Hacker culture" by 16% of women. — [Warner & Guo PDF](https://jeremywrnr.com/papers/student-perceptions-of-college-hackathons_ICER-2017.pdf)
- **Copy that already exists in the repo:**
  - CTA "Join Proto"; the secondary "See hack nights" links to /events. — [home.ts HERO_COPY](/Users/cjxsez/Desktop/bu-proto/src/content/home.ts)
  - Empty-state copy: "Join Proto and we'll email you before the first one." — [home.ts HOME_EMPTY](/Users/cjxsez/Desktop/bu-proto/src/content/home.ts), [events.ts EVENTS_EMPTY](/Users/cjxsez/Desktop/bu-proto/src/content/events.ts)
  - "Today / Tomorrow / In N days" wording (`NEXT_EVENT.when`) and "Add to calendar" (`EVENT_DETAIL.addToCalendar`). — [events.ts](/Users/cjxsez/Desktop/bu-proto/src/content/events.ts)
  - After joining: "We'll email you before the next hack night." — [join.ts JOIN_THANKS](/Users/cjxsez/Desktop/bu-proto/src/content/join.ts)
- The nav's "Join Proto" pill shows on desktop. On a phone, the first screen shows only the mark and a menu button, so the hero button is the only Join there. — [Hero.tsx/TopBar](/Users/cjxsez/Desktop/bu-proto/src/components/TopBar.tsx), [phone screenshot](/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/msg/fit_m_current.png)
- The win record in production reads "10 wins at 10 hackathons, by 27 builders", using the site's own counting rules:
  - None counts as first place.
  - The best overall placing is Third Place Overall at HackHarvard 2026.
  - The earliest win is dated 2025-09-20.

  — [buproto.com wins API](https://buproto.com/api/content/wins), [wins.ts tally rules](/Users/cjxsez/Desktop/bu-proto/src/lib/wins.ts)
- The "Best First-Time Hacker" win (Flowcast, DS+X Hackathon 2026) was a team of five. It included Andres Lopez, who is on 5 of the 10 wins, and Jack He, who is on 4. — [buproto.com wins API](https://buproto.com/api/content/wins)
- The schedule shown on the home page (Thursdays 7–10 PM, CDS) is placeholder copy and renders with a "sample" tag. — [site.ts](/Users/cjxsez/Desktop/bu-proto/src/content/site.ts), [types.ts Sampleable](/Users/cjxsez/Desktop/bu-proto/src/content/types.ts)

### Inferences
- **Action:** keep one button, "Join Proto." The label matches the nav and the join page, it's specific in NN/g's sense, and "Bring half an idea." flows straight into it. The reassurance beside it, "Free. No application. No experience needed.", answers novice fears at the moment of deciding.
- **Drop the second button for now.** "See hack nights" leads to an events page with no hack night on it. Two equal buttons also split attention.
- **Proof line, by state.** It is driven by D1 data and uses only real rows:
  1. A real `Hack night` event is in the next two weeks: "Next hack night · {day, date} · {time} · {place} · Add to calendar". Use `NEXT_EVENT.when` for the "In N days" wording. Date, time and place is the plan that research ties to follow-through.
  2. Otherwise, a real `Demo night` is next: the same pattern.
  3. Otherwise: "Hack nights are being planned now. Join and we'll email you before the first one." This is adapted from the repo's own empty-state copy, and it is honest about the current state.
  4. Never show the placeholder schedule in the hero. A sample tag there reads as an unfinished site, and without it the schedule is a false promise. Never show third-party events either; the Nov 17 panel doesn't match the hero's promise.
- **Wins stay below the fold**, where the home page already shows them.
  - A trophy count in the hero pulls against "no experience needed", given the deterrence findings.
  - The earliest wins may predate Proto. The site calls them "Proto people's" wins, so check before showing them at hero scale.
  - Don't use "Best First-Time Hacker" as evidence that first-timers win until the award's criteria are checked: two experienced winners were on the team.
- **Recommended hero, ready to hand over** (title plus statement is 20 words, about 5.0 s):
  - Title (h1): **Bring half an idea.**
  - Statement: **BU Proto: a hack night every week, group trips to hackathons, a demo night each semester.**
  - Action: **[Join Proto]**, with *Free. No application. No experience needed.*
  - Proof (one line, data-driven): next real hack night with "Add to calendar", or the empty-state line above.
  - Rules: no "club", no "BU's", no "official", no dates that aren't real.

### Gaps
- When hack nights start is unknown, and so is whether "every week" and "group trips" will be true at launch. If trips aren't running, the statement's middle clause needs swapping.
- I couldn't confirm whether the 10 wins count as Proto's or what "Best First-Time Hacker" required.
- No conversion data for this audience. The implementation-intention studies concern vaccinations and goals, not student events; applying them here is an inference.
