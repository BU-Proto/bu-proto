// Copy for the home page. The next event, deadlines and wins are content in D1 (edited in the
// portal at /admin); the copy around them lives here.

import type { Hue, Link, TrackName } from './types'

/**
 * The top of the home page: what Proto is, who it's for, the two ways in, and the next thing on
 * the calendar. Said for anyone, at any stage, from anywhere.
 */
export const HERO_COPY = {
  headline: 'Anyone can build anything. Start here.',
  lede: "First idea or fifth company, any background, any school or none. Proto is where Boston's founders find their people.",
  actions: [
    { label: "Join Proto, it's free", href: '/join' },
    { label: "See what's on", href: '/events' },
  ],
  next: 'Next up',
  /** When nothing is booked yet. */
  nothingYet: "Build nights start soon. Join and we'll email you before the first one.",
  rsvp: 'RSVP',
  /** The browser tab's title on the home page. */
  tab: "A home for Boston's founders",
} as const

/** The colours the groups' tiles and the hero's cursors are set in: each light, with its own dark ink. */
export type Tone = 'sky' | 'iris' | 'rose' | 'amber' | 'mint'

/**
 * Cursors drifting round the headline, the way collaborators' cursors do in a shared design file:
 * people at every stage and from every side, in one place. Phones show the first two.
 */
export const HERO_CURSORS: readonly { label: string; tone: Tone }[] = [
  { label: 'First-timer', tone: 'rose' },
  { label: 'Engineer', tone: 'sky' },
  { label: 'Designer', tone: 'iris' },
  { label: 'Business', tone: 'amber' },
  { label: 'Serial founder', tone: 'mint' },
]

/**
 * Who Proto is for, said as plainly as possible, right under the top: nobody needs an idea, a
 * team, a skill or a school to come.
 */
export const WELCOME: { title: string; items: readonly { text: string; tone: Tone }[]; coda: string } = {
  title: 'Proto is for you if',
  items: [
    { text: 'You have an idea and no team yet.', tone: 'sky' },
    { text: 'You have skills and no idea yet.', tone: 'iris' },
    { text: "You've never built anything before.", tone: 'rose' },
    { text: "You've started a company before and want people around you.", tone: 'amber' },
    { text: "You study business, art, biology or code, or you're not a student at all.", tone: 'mint' },
    { text: "You'd just like to meet people who make things.", tone: 'sky' },
  ],
  coda: 'Joining Proto is free, with no application and nothing to prepare. Come to a build night and say hello.',
}

/** A film for the home page: silent, looping, cropped to fill its frame. */
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

/** The film on the home page, in its own section under the map. Null leaves it out. */
export const HOME_FILM: HeroFilm | null = BOSTON_MONTAGE

/** The film's section: a title over it, and a line on what it shows. */
export const FILM_SECTION = {
  title: 'Built in Boston',
  lede: 'Half a minute of what started here, from the telephone to the Roomba.',
} as const

/** The film's pause control: anything that moves on its own for more than five seconds needs one. */
export const HOME_FILM_CONTROLS = {
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
      { label: 'Wins', href: '/wins?group=cs' },
    ],
  },
  {
    name: 'Business',
    tone: 'amber',
    picture: 'steps',
    text: 'For the company side: finding customers, pricing, pitching and raising money. Anyone can come.',
    links: [
      { label: 'The Business group', href: '/business' },
      { label: 'Pitch competitions', href: '/pitch-competitions' },
      { label: 'Playbook', href: '/business/playbook' },
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
  /**
   * Each place's pin on the map: its name, where it sits on the 1000 by 640 drawing, and which
   * side of the pin its name goes, chosen so no two names touch, even on a phone.
   */
  places: Record<MapPlace, { label: string; x: number; y: number; side: 'left' | 'right' | 'above' | 'below' }>
  /** The map's own labels: the two cities, a neighbourhood, the river and the harbour. */
  areas: readonly { label: string; x: number; y: number; angle?: number; water?: true }[]
  /** Proto's own pin: its name, and the words after it, which a phone leaves off. */
  proto: { name: string; note: string }
  items: readonly StartedHere[]
} = {
  title: "It's been done here before",
  lede: 'Each of these began with a few people in Boston and an idea. Some of them were students.',
  coda: 'Business, science, hardware and software. Different fields, the same start.',
  mapCaption: 'Roughly where each began: the school or neighbourhood it came from. Not to scale.',
  places: {
    harvard: { label: 'Harvard', x: 255, y: 190, side: 'right' },
    allston: { label: 'Harvard i-lab', x: 195, y: 450, side: 'below' },
    mit: { label: 'MIT', x: 620, y: 300, side: 'right' },
    cambridge: { label: 'Cambridge', x: 745, y: 205, side: 'left' },
    boston: { label: 'Boston', x: 875, y: 420, side: 'left' },
    bu: { label: 'BU', x: 450, y: 470, side: 'right' },
  },
  areas: [
    { label: 'Cambridge', x: 470, y: 110 },
    { label: 'Boston', x: 760, y: 575 },
    { label: 'Allston', x: 95, y: 585 },
    { label: 'Charles River', x: 640, y: 377, angle: -14, water: true },
    { label: 'Boston Harbor', x: 972, y: 500, angle: -90, water: true },
  ],
  proto: { name: 'Proto', note: 'started here' },
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
