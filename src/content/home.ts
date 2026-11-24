// Copy for the home page. The next event, deadlines and wins are content in D1 (edited in the
// portal at /admin); the copy around them lives here.

import type { Hue, Link, TrackName } from './types'

export const HERO_COPY = {
  headline: 'Bring an idea. Find the people to build it.',
  /** The browser tab's title on the home page. */
  tab: "A home for Boston's builders",
} as const

/** The colours the groups' tiles and the hero's cursors are set in: each light, with its own dark ink. */
export type Tone = 'sky' | 'iris' | 'rose' | 'amber' | 'mint'

/**
 * Cursors drifting round the headline, the way collaborators' cursors do in a shared design file:
 * everyone who builds, in one place. Phones show the first three.
 */
export const HERO_CURSORS: readonly { label: string; tone: Tone }[] = [
  { label: 'Founder', tone: 'rose' },
  { label: 'Engineer', tone: 'sky' },
  { label: 'Designer', tone: 'iris' },
  { label: 'Business', tone: 'amber' },
  { label: 'CS', tone: 'mint' },
]

/** A film for the hero: silent, looping, cropped to fill its frame. */
export interface HeroFilm {
  /** An MP4 (H.264), silent, under 25 MiB: Cloudflare won't serve a bigger single asset. */
  src: string
  /** A tall cut (4:5) for phones. Without it, phones crop src to its middle, titles and all. */
  phoneSrc?: string
  /** The still shown before it plays, and in its place under reduced motion or Save-Data. */
  poster: string
  /** Width over height of src (16 / 9), which sets the frame's shape on wider screens. */
  aspect: number
  /** A small line under the frame, for a film that names companies or schools. */
  note?: string
}

/**
 * The Boston montage: what started here, cut with each company's own footage where we have it
 * (film/render.mjs renders it; docs/hero-montage.md has the plan, the sources and the
 * permissions). Today's files are the basic cut, from the footage on hand; the full cut replaces
 * them at the same paths.
 */
export const BOSTON_MONTAGE: HeroFilm = {
  src: '/media/boston-montage.mp4',
  phoneSrc: '/media/boston-montage-phone.mp4',
  poster: '/media/boston-montage-poster.jpg',
  aspect: 16 / 9,
  note: 'Footage from Moderna, iRobot and WHOOP, used with their permission. Proto is not affiliated with the companies shown.',
}

/** What the hero plays. Null leaves the hero to the field alone. */
export const HERO_FILM: HeroFilm | null = BOSTON_MONTAGE

/** The hero film's pause control: anything that moves on its own for more than five seconds needs one. */
export const HERO_FILM_CONTROLS = {
  pause: 'Pause the film',
  play: 'Play the film',
} as const

export type NoteIconName = 'grants' | 'handoff'

/** The fund, said once, beside the trips it would pay for. Coming soon: it isn't funded yet. */
export const FUND_NOTE: { text: string; link: Link } = {
  text: 'A travel fund for these is coming soon.',
  link: { label: 'About the fund', href: '/grants' },
}

// The tracks only say what's particular to each one: build night and demo night are for everyone,
// and the hero and the rhythm already say so. Their names are stored with each member (shared/
// constants.ts), so the names stay and only the words change.
export interface Track {
  name: TrackName
  /** The flat drawing at the foot of the track's tile on the landing. */
  picture: 'sprout' | 'blocks' | 'rocket'
  /** Down the stair the light warms, as it does across the field: Start sky, Launch rose. */
  hue: Hue
  who: string
  offers: readonly string[]
}

export const TRACKS_INTRO = {
  title: 'Start. Build. Launch.',
  lede: 'Business, engineering, design or CS: everyone here is at one of three stages. Pick yours today and move whenever you like.',
} as const

export const TRACKS: readonly Track[] = [
  {
    name: 'Start',
    picture: 'sprout',
    hue: 'sky',
    who: 'You want to make something and haven\'t started. Any school, any major.',
    offers: [
      'Build nights with people who will help you begin',
      'Meet engineers, designers and business people who want to build too',
    ],
  },
  {
    name: 'Build',
    picture: 'blocks',
    hue: 'iris',
    who: 'You\'re making something, on your own or with friends.',
    offers: [
      'Find a co-founder or the teammate with the skill you\'re missing',
      'Feedback from people a step ahead of you',
    ],
  },
  {
    name: 'Launch',
    picture: 'rocket',
    hue: 'rose',
    who: 'You\'re turning what you built into a company.',
    offers: [
      'Firesides where founders and investors tell how they did it',
      'A path into startup programs such as BU\'s Spark! and Innovate@BU',
    ],
  },
]

/** One group's tile in the bento on the home page. */
export interface GroupTile {
  name: string
  tone: Tone
  /** The simple drawing in the tile's corner. */
  picture: 'people' | 'prompt' | 'steps' | 'nut'
  text: string
  links: readonly Link[]
  /** Not running yet. */
  later?: boolean
}

export const GROUPS_INTRO = {
  title: 'One community, with groups inside it',
  lede: "Every event is open to everyone. CS and Business run nights of their own too, and everyone else is welcome at those.",
  later: 'Later',
} as const

export const GROUP_TILES: readonly GroupTile[] = [
  {
    name: 'Everyone',
    tone: 'sky',
    picture: 'people',
    text: 'Build nights every week, firesides every two weeks and a demo night each semester. Open to all of Boston.',
    links: [
      { label: 'Events', href: '/events' },
      { label: 'Join Proto', href: '/join' },
    ],
  },
  {
    name: 'CS',
    tone: 'iris',
    picture: 'prompt',
    text: 'For building with code: hack nights, hackathon trips, the playbook and the wins. Anyone can come.',
    links: [
      { label: 'The CS group', href: '/cs' },
      { label: 'Hackathons', href: '/hackathons' },
      { label: 'Wins', href: '/wins' },
    ],
  },
  {
    name: 'Business',
    tone: 'amber',
    picture: 'steps',
    text: 'For the company side: finding customers, pricing, pitching and raising money. Anyone can come.',
    links: [
      { label: 'The Business group', href: '/business' },
      { label: 'Resources', href: '/resources' },
    ],
  },
]

export interface Beat {
  when: string
  what: string
  detail: string
  /** Planned for later, not part of the first year. */
  later?: boolean
  /** A group's own night (everyone else is welcome too). Without one, it's for everyone. */
  group?: string
  /** The weeks of a typical semester it lands on, for the score on the home page. */
  weeks: readonly number[]
  /** The bigger the night, the warmer its colour in the score and the key. */
  hue: Hue
}

/** Where on the map a company began: the school or neighbourhood it came from. */
export type MapPlace = 'harvard' | 'allston' | 'mit' | 'cambridge' | 'boston' | 'bu'

/** One company or invention that started in Boston, for the wall on the landing. */
export interface StartedHere {
  name: string
  field: string
  /** Where and when it started: checked, see docs/hero-montage.md. */
  origin: string
  tone: Tone
  place: MapPlace
}

/** Things that started in Boston, from every kind of field: the same start as Proto's founders. */
export const STARTED_HERE: {
  title: string
  lede: string
  coda: string
  mapCaption: string
  /** Each place's pin on the map: its name, and where it sits on the 1000 by 640 drawing. */
  places: Record<MapPlace, { label: string; x: number; y: number; labelBelow?: true }>
  /** The map's own labels: the two cities, a neighbourhood, the river and the harbour. */
  areas: readonly { label: string; x: number; y: number; vertical?: true }[]
  proto: string
  items: readonly StartedHere[]
} = {
  title: "It's been done here before",
  lede: 'Each of these began with a few people in Boston and an idea. Some of them were students.',
  coda: 'Business, science, hardware and software. Different fields, the same start.',
  mapCaption: 'Roughly where each began: the school or neighbourhood it came from. Not to scale.',
  places: {
    harvard: { label: 'Harvard', x: 250, y: 190 },
    allston: { label: 'Harvard i-lab, Allston', x: 215, y: 500, labelBelow: true },
    mit: { label: 'MIT', x: 610, y: 285 },
    cambridge: { label: 'Cambridge', x: 735, y: 215 },
    boston: { label: 'Boston', x: 860, y: 400 },
    bu: { label: 'BU', x: 440, y: 470 },
  },
  areas: [
    { label: 'CAMBRIDGE', x: 470, y: 130 },
    { label: 'BOSTON', x: 700, y: 560 },
    { label: 'ALLSTON', x: 90, y: 625 },
    { label: 'THE CHARLES', x: 330, y: 402 },
    { label: 'HARBOR', x: 962, y: 470, vertical: true },
  ],
  proto: 'Proto started here',
  items: [
    { name: 'Facebook', field: 'Social', origin: 'A Harvard dorm, Cambridge, Mass., 2004', tone: 'sky', place: 'harvard' },
    { name: 'Boston Dynamics', field: 'Robotics', origin: 'Spun out of MIT, Cambridge, Mass., 1992', tone: 'mint', place: 'mit' },
    { name: 'Moderna', field: 'Biotech', origin: 'Cambridge, Mass., 2010', tone: 'rose', place: 'cambridge' },
    { name: 'Bose', field: 'Audio', origin: 'An MIT professor, Massachusetts, 1964', tone: 'amber', place: 'mit' },
    { name: 'Dropbox', field: 'Software', origin: 'MIT students, Cambridge, Mass., 2007', tone: 'iris', place: 'cambridge' },
    { name: 'WHOOP', field: 'Wearables', origin: 'Started at Harvard, Boston, Mass., 2012', tone: 'mint', place: 'allston' },
    { name: 'iRobot', field: 'Home robots', origin: 'MIT roboticists, Massachusetts, 1990', tone: 'sky', place: 'mit' },
    { name: 'Wayfair', field: 'Retail', origin: 'Boston, Mass., 2002', tone: 'amber', place: 'boston' },
    { name: 'HubSpot', field: 'Business software', origin: 'MIT grads, Cambridge, Mass., 2006', tone: 'rose', place: 'cambridge' },
    { name: 'The telephone', field: 'Communication', origin: 'A BU professor, Boston, Mass., 1876', tone: 'iris', place: 'boston' },
  ],
}

export const RHYTHM_INTRO = {
  title: 'The rhythm',
  lede: 'A build night every week, a fireside every two weeks, a group night most months, and demo night to close the semester.',
} as const

// Row order is size order: the score draws each row taller than the one before (see Home.tsx).
export const RHYTHM: readonly Beat[] = [
  { when: 'Weekly', what: 'Build night', detail: 'Open to anyone, with food. Bring what you\'re working on, or come to meet people who are.', weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], hue: 'sky' },
  { when: 'Every two weeks', what: 'Fireside', detail: 'A founder or investor talks about how companies get built, then takes questions from people building their own.', weeks: [2, 4, 6, 8, 10, 12], hue: 'iris' },
  { when: 'About monthly', what: 'Group nights', detail: 'A night for one group, CS or Business. Everyone else is welcome too.', weeks: [3, 7, 11], hue: 'iris' },
  { when: 'Each semester', what: 'Demo night', detail: 'Anyone can show anything: an app, a product, a company, half a prototype.', weeks: [14], hue: 'rose' },
]

/** The score's columns: a semester, roughly week by week. */
export const SEMESTER = {
  weeks: 14,
  caption: 'Roughly how a semester runs, week by week',
  weekLabel: 'Week',
  later: 'Not yet: planned for later',
} as const

export const NEXT_UP = {
  title: 'Next up',
  applyBy: 'Apply by',
  /** The hackathons are the CS group's; anyone can come along. */
  applyByGroup: 'CS',
  allEvents: 'All events',
  allHackathons: 'Every hackathon',
  closes: 'Closes',
} as const

export const WINS_TITLE = 'Latest wins'

export const HOME_EMPTY = {
  next: {
    title: 'Nothing on the calendar yet',
    text: 'This semester\'s build nights, firesides and demo night are being planned now. Join Proto and we\'ll email you before the first one.',
    link: { label: 'Join to hear first', href: '/join' },
  },
  deadlines: 'No open deadlines right now.',
} as const

export const JOIN_CTA: {
  title: string
  tag: string
  lede: string
  hint: string
  aside: readonly string[]
  footnote: readonly string[]
  cta: Link
} = {
  title: 'Start something',
  tag: 'Proto',
  lede: 'It\'s free and there\'s no application. Bring an idea, or come and find one at build night.',
  hint: 'No application needed',
  aside: ['Nobody arrives ready.', 'We said come anyway.', 'They built something.'],
  footnote: ['* Build night,', 'every week'],
  cta: { label: 'Join Proto', href: '/join' },
}
