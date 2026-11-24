# The home page montage

A 35-second film for the home page hero, with the energy of Jose's launch film and none of its footage. It opens on a prompt bar typing "Everyone can build anything", goes back to old Boston, through the city today, through the companies that started here, lifts off with Apollo 11, and ends on Proto: started at BU, open to Boston. Jose's film plays on the site until this one is ready.

The shot list lives in code, in `film/shots.mjs`, and `film/render.mjs` cuts the film from it. This page is the plan around it: the style, where every shot comes from, what's approved, and the licences.

## How it drops in

The hero reads its film from `HERO_FILM` in `src/content/home.ts`. When the cut is done:

1. Copy the three files from `film/out/` into `public/media/`.
2. In `src/content/home.ts`, change `HERO_FILM` from `LAUNCH_FILM` to `BOSTON_MONTAGE`.
3. Run `npm run dev` and check it at phone and desktop width.

| File | What | Limits |
| --- | --- | --- |
| `boston-montage.mp4` | 16:9, 1920x1080, H.264, no audio track, 30 fps, 35 seconds, loops | Under 15 MB. Cloudflare won't serve a single file over 25 MiB |
| `boston-montage-phone.mp4` | The same cut drawn for 4:5, 1080x1350 | Under 8 MB |
| `boston-montage-poster.jpg` | The moment the prompt is typed out, shown before the film plays and to visitors who turn motion off | Under 200 KB |

The render keeps to these sizes on its own. The film is silent, so it needs no music licence.

## The style

The energy of Jose's film: black and white with warm highlights, film grain, flash frames, fast where nothing needs reading. And slow enough to follow:

- A shot with a card holds 1.5 to 2 seconds, long enough to read it and see what's behind it. Shots without a card stay quick.
- A chapter label sits small in the top corner the whole way through (THEN, THEN / NOW, NOW, WHAT STARTED HERE, LIFTOFF), so it's always clear where you are.
- Cards are big and in the middle: the name large in Inter, where and when small under it in JetBrains Mono, over the shot dimmed. "Boston Dynamics" over "MIT · 1992".
- The companies come one after another, each name filling the screen over its own shot, then a fast roll of more Boston names into the launch.
- Names are set in our own type. A company's logo appears only where the company approved it for this film (Meta has).

## Shot list

| At (s) | For (s) | Chapter | On screen | Card | Source |
| --- | --- | --- | --- | --- | --- |
| 0.0 | 2.6 | | A prompt bar types "Everyone can build anything"; Boston names drift behind it, blurred | | Drawn by the script |
| 2.6 | 2.0 | THEN | Old maps of Boston, 1722 to 1900, the shoreline filling in | Boston, founded 1630 | Archive maps |
| 4.6 | 1.0 | THEN | The harbour full of masts, c. 1906 | | Library of Congress |
| 5.6 | 2.0 | THEN | Bell's notebook, March 10, 1876 | The telephone, a BU professor, 1876 | Library of Congress |
| 7.6 | 2.0 | THEN | A vintage terminal, green text | Network email and the @, Cambridge, 1971 | Envato |
| 9.6 | 1.6 | THEN / NOW | Back Bay from the State House dome, c. 1906, dissolving into Back Bay from the air today | | Library of Congress, then Envato |
| 11.2 | 2.7 | NOW | Boston from the air at sunrise, a Green Line train, Boston from the air at night | | Envato, Pexels |
| 13.9 | 1.5 | WHAT STARTED HERE | A robot arm in a lab | Boston Dynamics, MIT, 1992 | Envato |
| 15.4 | 1.5 | WHAT STARTED HERE | A dorm room at night, a laptop's glow | Meta's logo, "started as Facebook, a Harvard dorm, 2004" | Envato; Meta's approved logo |
| 16.9 | 1.5 | WHAT STARTED HERE | Moderna's vials on the line, then a robot pipetting in its lab | Moderna, Cambridge, 2010 | Moderna's own footage, approved |
| 18.4 | 1.5 | WHAT STARTED HERE | The Roomba gliding out from under a sofa, then a close-up rolling towards the camera | iRobot, the Roomba, MIT roboticists, 1990 | iRobot's own footage, approved |
| 19.9 | 1.5 | WHAT STARTED HERE | Code scrolling in a dark room | Dropbox, MIT students in Cambridge, 2007 | Envato |
| 21.4 | 1.5 | WHAT STARTED HERE | A speaker cone pulsing | Bose, MIT professor Amar Bose, 1964 | Envato |
| 22.9 | 2.1 | WHAT STARTED HERE | WHOOP's strap mid-workout, Sha'Carri Richardson, Cristiano Ronaldo | WHOOP, Harvard, 2012 | WHOOP's own pictures, approved |
| 25.0 | 2.0 | WHAT STARTED HERE | HubSpot, Wayfair, Reddit, Zipcar, Akamai, Polaroid, Harmonix, DraftKings, faster and faster, over the city at night | | Envato |
| 27.0 | 4.0 | LIFTOFF | Apollo 11: ignition, liftoff, the climb | Apollo's guidance computer, designed at MIT, 1969 | NASA, public domain |
| 31.0 | 2.2 | | Six shots again in negative, letterboxed, landing back on the prompt bar | | From the cut |
| 33.2 | 1.8 | | Proto's mark and "Started at BU. Open to Boston." | | Drawn by the script |

BU's beat is the telephone, and the film ends where Proto started. No company that everyone knows started at BU, so no card says one did. Email is Ray Tomlinson's: at BBN in Cambridge he sent the first email between two computers and picked the @ for it. Email inside a single computer is older, so the card says "network email". Every card was checked against a company, university or archive source (see the end).

Checked swap-ins, if a card needs replacing:

| Place | Card |
| --- | --- |
| MIT Media Lab | Harmonix, makers of Guitar Hero and Rock Band. Founded by MIT Media Lab grads, 1995. |
| MIT Media Lab | E Ink, the screen in the Kindle. Born at the MIT Media Lab, 1997. |
| MIT | Akamai. Born at MIT, 1998. |
| Cambridge | HubSpot. Founded by MIT grads in Cambridge, 2006. |
| Cambridge | Zipcar. Started in Cambridge, 2000. |
| Cambridge | Polaroid. Cambridge, 1937. |
| Boston | Wayfair. Started in Boston, 2002. |
| Medford | Reddit. Built in Medford, 2005. (Press sources only, no company source.) |
| A BU engineering lab | The bionic pancreas. Built in a BU lab, cleared by the FDA in 2023. |
| BU School of Medicine | Isaac Asimov, who coined the word "robotics", taught at BU. |

Lines to avoid: Microsoft "started at Harvard" (it was founded in Albuquerque), eBay and Tufts (Omidyar graduated in 1988 and launched eBay in 1995 in California), Polaroid as a "Harvard company" (Land left without a degree), anything that says a famous company "started at BU".

## How it gets made

```bash
node film/render.mjs
```

It needs `brew install ffmpeg-full librsvg` and `brew install --cask font-inter font-jetbrains-mono` (all installed on Michael's Mac). The type (the prompt bar, chapter labels, cards, the end card) is drawn as SVG and rendered by rsvg-convert, which shapes text the way a browser does, with real kerning. ffmpeg-full does the cutting, Lanczos scaling, the grade and the encode. Both cuts take about a minute and a half.

While any source is missing, that shot renders as a labelled frame saying what goes there and which file it's waiting for, and the output is `film/out/animatic.mp4` and `animatic-phone.mp4`. Once every file is in place the output is the three files in the table above. Changing a card, a cut or the order is a one-line edit in `film/shots.mjs` and a re-render.

`film/clips/`, `film/archive/` and `film/brand/` stay out of git: the footage is licensed or approved for this film, not ours to publish raw.

## What's approved, and who to ask

Approved for this film (keep each approval in writing with the project):

| Company | What | Where it is |
| --- | --- | --- |
| Meta | Its company logo, for the Facebook card | `film/brand/meta-lockup-white.svg` |
| WHOOP | Its body and athlete pictures, the athletes included | `film/brand/whoop/`, `film/brand/whoop-ambassadors/` |
| Moderna | Four clips: vials on the line, vials into boxes, boxes, and a 4K lab reel from November 2020 | `film/brand/moderna/` |
| iRobot | Roomba j9+ b-roll and overview at 1080p (the b-roll is used; the overview has captions burned in), and two small product films (Max 705, Plus 505) | `film/brand/irobot/` |

Every company the film names, and what to ask each for:

| Company | In the film | What to ask for | Contact we found | Status |
| --- | --- | --- | --- | --- |
| Boston Dynamics | Card, 1.5 s | Two seconds of Spot or Atlas walking, from their press footage; their logo | Press form, <https://bostondynamics.com/news/#press-form> | To ask |
| Meta (Facebook) | Card, 1.5 s | Done: the logo. Optional: a photo of thefacebook.com in 2004 | press@meta.com | Logo approved |
| Moderna | Card, 1.5 s | Optional: their logo | media@modernatx.com | Footage approved |
| iRobot | Card, 1.5 s | Optional: their logo | publicrelations@irobot.com | Footage approved, 1080p in hand |
| Dropbox | Card, 1.5 s | Their logo, or one product screenshot | brand@dropbox.com, press@dropbox.com | To ask (their brand page says to check in first) |
| Bose | Card, 1.5 s | Two seconds of a speaker or headphones close up; their logo | The press contact on <https://www.bose.com/pressroom> | To ask |
| WHOOP | Card, 2.1 s | Optional: their logo | press@whoop.com | Pictures approved |
| HubSpot | Name in the closing roll | Their logo (the roll is a quarter second each, so footage isn't needed) | Their newsroom | Optional |
| Wayfair | Name in the roll | Their logo | Their newsroom | Optional |
| Reddit | Name in the roll | Their logo | Their newsroom | Optional |
| Zipcar | Name in the roll | Their logo | Their newsroom | Optional |
| Akamai | Name in the roll | Their logo | Their newsroom | Optional |
| Polaroid | Name in the roll | Their logo | Their newsroom | Optional |
| Harmonix | Name in the roll | Their logo | Their newsroom | Optional |
| DraftKings | Name in the roll | Their logo | Their newsroom | Optional |
| Draper (the MIT Instrumentation Lab, which designed Apollo's guidance computer) | Apollo card | Optional: an archive photo of the guidance computer or the lab's team, for a second under the card | Its communications office, <https://www.draper.com> | Optional; NASA's launch footage needs no asking |

The telephone (Library of Congress) and Apollo 11's launch (NASA) are free to use and need nobody's permission. Each logo that comes back approved goes on its card the way Meta's does: put the file in `film/brand/` and add `logo:` to that shot in `film/shots.mjs`. Logos in the roll need a small change to the script, since the roll draws names as text today.

Give each request two weeks. Without a written yes, a card keeps its stock footage and the name in our type. Clips cut from any company's YouTube channel are out: YouTube's terms only allow embedding the player.

NASA's footage needs no permission: it's generally not under copyright. Credit "Footage: NASA", keep the NASA insignia out of frame, use rocket and launch-pad shots rather than the astronauts, and imply no endorsement.

The email, to fill in for each company:

> Subject: A two-second clip of <product> for a student group's website
>
> Hi <name, or the press team>,
>
> I'm Michael, on the team behind Proto, a free, student-run home for people in Boston who build things (proto.boston). It started at Boston University.
>
> We're making a 35-second silent film for our home page about things that started in Boston, and <company> is one of them. We'd like to use <the clip: its file name in your kit, or a link and timecode> for about two seconds.
>
> If you're happy with that, we'd use it only on the proto.boston home page, silent and in black and white, credit it as "Footage: <company>", and add a line that the film isn't affiliated with or endorsed by the companies shown. We'll take it down whenever you ask, and we'll send you the cut before it goes live. If you'd rather we used a different clip, send that one instead.
>
> Thanks,
> Michael
> Proto, proto.boston

## What to download

One paid service, Envato Elements, for one month ($39, <https://elements.envato.com/pricing>). Download the 8 Envato clips below in that month and register each one to this project: the licence for a registered item lasts after you cancel. Everything else is free. Search Envato for the title, or for the item ID at the end of its address.

| Save as | What | Where | Cost |
| --- | --- | --- | --- |
| `film/clips/terminal-vintage.mp4` | Vintage Green Text on a Computer Terminal | Envato, item JFB47Q8 | Envato |
| `film/clips/back-bay-aerial.mp4` | Aerial view of Commonwealth Avenue in Boston | Envato, item PSLUTK6 | Envato |
| `film/clips/boston-sunrise-aerial.mp4` | Aerial view of Boston at sunrise | Envato, item ZCWKZUD | Envato |
| `film/clips/boston-night-aerial.mp4` | Aerial View of Boston, Massachusetts at Night | Envato, item NHUEEDQ | Envato |
| `film/clips/robot-arm.mp4` | Robotic Arm Precision Task in Advanced Lab | Envato, item HVCGWKE | Envato |
| `film/clips/dorm-laptop.mp4` | Young Person Working on Laptop at Night | Envato, item MBNZJ36 | Envato |
| `film/clips/code.mp4` | Lines of Programming Code Scrolling on a Computer Monitor in Dark Office | Envato, item RU6RUNG | Envato |
| `film/clips/speaker.mp4` | Speaker Cone Vibrating in Close Up | Envato, item 3W8KDZ6 | Envato |
| `film/clips/green-line.mp4` | Urban Train Crossing at Traffic Signal (a Green Line car, vertical 4K) | <https://www.pexels.com/video/urban-train-crossing-at-traffic-signal-37898742/> | Free |
| `film/clips/apollo-11-launch.mp4` | Apollo 11 launch, transferred from 70mm | <https://images.nasa.gov/details/KSC_69-71212-sRGB>, or the National Archives' 4K masters (255-PV-75, 255-PV-174) at <https://www.archives.gov/research/motion-pictures/apollo-av> | Free |
| `film/archive/harbor-1906.jpg` | Boston harbor from East Boston, c. 1906 | <https://www.loc.gov/item/2016802352> | Free |
| `film/archive/bell-notebook-1876.jpg` | Bell's notebook, March 10, 1876 | <https://www.loc.gov/resource/magbell.25300201/?sp=22> | Free |
| `film/archive/back-bay-1906.jpg` | Back Bay from State House dome, 1900 to 1910 | <https://www.loc.gov/item/2016809139> | Free |
| `film/archive/map-1722.jpg`, `map-1852.jpg`, `map-1900.jpg` | Three maps of Boston showing the shoreline at each date, framed alike | The Leventhal Map & Education Center (<https://www.leventhalmap.org>); pick maps whose record says public domain | Free |

Total: $39. The Envato and Pexels pages were checked by hand on November 23, 2026, and none of these clips is marked editorial only. Neither site has BU's Center for Computing and Data Sciences, Kendall Square at night or a runner on the Esplanade, so the cut leaves those out: the night shot is Boston from the air, and WHOOP's own pictures replace the runner. If a shot ever needs a single paid clip, Pond5 sells them one at a time from $39; skip any marked editorial only.

The other sources checked, for comparison (prices on November 23, 2026):

| Source | Plan | Cancel after a month? | Licence for a website | Boston footage | Pricing page |
| --- | --- | --- | --- | --- | --- |
| Shutterstock | 10 clips $149, 20 clips $239 a month, no contract; one clip $69 | Yes | Standard covers web and social, perpetual | Best: about 7,400 "Boston aerial" results (1,700 editorial) | <https://www.shutterstock.com/pricing/video> |
| Adobe Stock | $112.99 a month for 6 clips, $249.99 for up to 25 | Yes, monthly | Standard, perpetual | Strong | <https://stock.adobe.com/plans> |
| iStock | $149 for the first month, 10 downloads | Yes, monthly | Standard | Good | <https://www.istockphoto.com/plans-and-pricing> |
| Pond5 | From $39 a clip | Yes | Perpetual, websites covered | Strong, filters out editorial | <https://www.pond5.com/pricing> |
| Storyblocks | $201.60 a year | Annual only | Projects published while subscribed | Moderate | <https://www.storyblocks.com/pricing> |
| Motion Array | $39.99 a month | Yes | Projects published while subscribed | Thin for campuses | <https://motionarray.com/pricing/everything_v2-yearly> |
| Artgrid | $239.90 a year | Annual, 14-day refund | Lifetime use | Not checked | <https://artgrid.io/pricing> |
| Pexels, Mixkit, Pixabay | Free | | Free for websites; don't imply a brand or person endorses us | A handful of Boston clips | <https://www.pexels.com/license/> |

## Archive material for old Boston

All free unless marked. The edit (grade, grain, cuts) makes a new work from each item, so use items whose own record says public domain or "no known restrictions": a no-derivatives or share-alike licence doesn't fit. In late 2026, US works published in 1930 or earlier are public domain; photos that were never published follow other rules, so go by each item's rights line.

| Shot | Item | Rights | Credit |
| --- | --- | --- | --- |
| The harbour full of masts | Boston harbor from East Boston, c. 1906 (Detroit Publishing Co.), <https://www.loc.gov/item/2016802352> | No known restrictions on publication | Library of Congress, Prints & Photographs Division, Detroit Publishing Company Collection |
| Back Bay | Back Bay from State House dome, 1900 to 1910, <https://www.loc.gov/item/2016809139>. For Back Bay half filled, BPL's Back Bay from Public Gardens, c. 1866 to 1869, <https://ark.digitalcommonwealth.org/ark:/50959/8623j6319> (check its rights line) | LOC: no known restrictions. BPL: per item | As above; "Courtesy of the Boston Public Library" |
| Old Boston streets (spares) | Scollay Square, 1906, <https://www.loc.gov/item/2016806174>; the Charles River dam, 1912, <https://www.flickr.com/photos/cityofbostonarchives/15758869050> | LOC: no known restrictions. City of Boston Archives: use items whose rights field says public domain | City of Boston Archives, Boston |
| Old film for movement | Canoeing on the Charles River, Boston (Edison, 1904, 145 seconds), <https://www.loc.gov/item/00563637> | Free to use and reuse | Library of Congress, Motion Picture, Broadcasting, and Recorded Sound Division |
| Bell's notebook | March 10, 1876 entry, <https://www.loc.gov/resource/magbell.25300201/?sp=22> | No known restrictions on use or reproduction | Library of Congress, Manuscript Division, Alexander Graham Bell Family Papers |
| The shoreline maps | Historic maps of Boston from 1722 on at the Leventhal Map & Education Center, <https://www.leventhalmap.org/collections/permissions/>. Use the old maps themselves; modern landfill maps (1999 on) are under copyright | Public-domain maps need no permission (check each record) | "Reproduction courtesy of the Norman B. Leventhal Map & Education Center at the Boston Public Library" |
| Harvard Yard, 1890s (spare) | The Yard, Harvard College, <https://www.loc.gov/item/2016800671> | No known restrictions | Library of Congress, as above |
| MIT going up, 1913 to 1916 | Technology Review issues from those years on the Internet Archive (published before 1931), e.g. <https://archive.org/details/MIT-Technology-Review-1916-06>. The MIT Museum has a construction album too, by request (fees unconfirmed) | Public domain for the 1916 issues | "MIT Libraries" or "Courtesy of the MIT Museum" |
| The Apollo 11 launch | The 70mm launch transfer, <https://images.nasa.gov/details/KSC_69-71212-sRGB>, and NASA's pre-launch and launch film | Generally not under copyright in the US. In promotional work, keep legible NASA logos and close-ups of astronauts out, and imply no NASA endorsement. Take it from NASA directly, not from re-uploads | NASA |

Not usable without paying or asking: the BPL's Leslie Jones Collection (in copyright), Historic New England (paid licence), Northeast Historic Film (paid, 30-second minimum).

Put every archive credit on one line under the film or on an "Archive credits" note, and keep the list with the project files.

The Apollo card is checked: MIT News says the Apollo Guidance Computer and its software were designed by MIT's Instrumentation Lab (now Draper), where Margaret Hamilton led the software engineering division (<https://news.mit.edu/2026/margaret-hamilton-computing-pioneer-dies-1007>). Bell's card is checked too: BU hired him in 1873 to teach at its School of Oratory, and he was a BU faculty member on paid leave when he made the first call on March 10, 1876 (<https://www.bu.edu/articles/2026/graham-bell-150-years-telephone>).

## Names, logos and the schools

General information for a non-lawyer, not legal advice.

- Company names in plain factual lines ("Spun out of MIT, 1992") are generally fine under nominative fair use: name the company only as much as you need to, and don't suggest it backs Proto. Overview: <https://en.wikipedia.org/wiki/Nominative_use>.
- Leave a company's logo out unless the company has approved it for this film, as Meta has. Otherwise set the name as text in our type: a logo is more of the mark than the sentence needs, and it reads as a sponsor.
- The real risk is looking endorsed. A montage on our own site can read as if these schools and companies back Proto. Keep it framed as history, and put a small line on the last card and under the film: "Not affiliated with or endorsed by the companies or universities shown." (`BOSTON_MONTAGE` in `src/content/home.ts` already carries it, and the hero prints it under the headline.) A disclaimer helps but doesn't settle it on its own.
- MIT: its name must not suggest endorsement, and using its marks needs the Office of Communications' approval. <https://policies.mit.edu/policies-procedures/120-relations-public-use-mit-name-and-facilities-use/123-use-institute-name>
- Harvard: it keeps its names and shields for its own use, and treats even factual mentions in a promotional setting as implied endorsement. Requests to mention Harvard in a film go to its news office. <https://trademark.harvard.edu/frequently-asked-questions-use-of-harvards-name>
- BU: the name in plain text is informational, but logos and seals need approval, and a registered student group counts as part of BU, so Student Activities signs off before we use BU marks. <https://www.bu.edu/licensing/resources/policies/>
- Buildings you can see from a public place can be filmed in the US (17 U.S.C. §120). Filming on campus grounds is a separate question; see the footage section.

Two ways to go, from safest to boldest:

1. Name the city or neighbourhood on the cards and let the footage show the campus ("Facebook. Launched from a dorm across the river, 2004."). No school is named, so no school needs asking.
2. Name the schools as in the shot list, and before the film goes live, email MIT's Office of Communications, Harvard's news office and BU Student Activities with the cut and the lines. This is the version Michael described; it needs those three answers first.

## Sources for the company lines

Boston Dynamics <https://bostondynamics.com/about/> · network email and the @ <https://en.wikipedia.org/wiki/Ray_Tomlinson>, <https://www.npr.org/sections/alltechconsidered/2016/03/07/469492182/in-memoriam-ray-tomlinson-who-put-the-sign-in-your-email> · BU's inventions <https://www.bu.edu/articles/2026/boston-university-history-of-invention-and-innovation/> · the bionic pancreas <https://www.bu.edu/eng/?p=140311>, <https://www.bu.edu/articles/2023/how-a-bionic-pancreas-could-revolutionize-type-1-diabetes-management> · Asimov at BU <https://www.bu.edu/articles/2020/pov-why-isaac-asimovs-novels-speak-to-us-today> · Facebook <https://news.harvard.edu/gazette/story/2014/02/facebook-10-years-after/> · Moderna <https://www.flagshippioneering.com/companies/moderna> · Dropbox <https://news.mit.edu/2013/commencement-speaker-drew-houston-dropbox-0606>, <https://www.ycombinator.com/blog/congratsdropbox> · Reddit <https://phys.org/news/2013-12-reddit-co-founder-campaigns-power-internet.html>, <https://en.wikipedia.org/wiki/Timeline_of_Reddit> · iRobot <https://www.technologyreview.com/2003/10/01/234054/robotriumvirate/> · Bose <https://news.mit.edu/2013/obit-amar-bose-0712> · WHOOP <https://seas.harvard.edu/news/2024/09/how-whoop-founder-will-ahmed-found-his-voice-entrepreneur> · the telephone and BU <https://www.bu.edu/articles/2026/alexander-graham-bell-the-bu-years/> · Harmonix <https://news.mit.edu/2021/harmonix-music-gameplay-1214> · E Ink <https://www.media.mit.edu/articles/how-electronic-ink-was-invented/> · Akamai <https://www.akamai.com/company/company-history> · HubSpot <https://www.hubspot.com/our-story> · Zipcar <https://en.wikipedia.org/wiki/Zipcar> · Polaroid <https://www.library.hbs.edu/special-collections-and-archives/exhibits/polaroid-from-concept-to-product/a-polaroid-timeline-1932-1977> · Wayfair <https://en.wikipedia.org/wiki/Wayfair> · Kiva <https://en.wikipedia.org/wiki/Amazon_Robotics> · Microsoft <https://news.harvard.edu/gazette/story/2013/09/dawn-of-a-revolution> · Napster <https://content.time.com/time/subscriber/article/0,33009,998068-3,00.html>
