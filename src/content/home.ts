// Copy for the home page. The next event, deadlines and wins are content in D1 (edited in the
// portal at /admin); the copy around them lives here.

import type { Hue, Link, TrackName } from './types'

export const HERO_COPY = {
  headline: 'Bring an idea. Find the people to build it.',
  /** The browser tab's title on the home page. */
  tab: "A home for Boston's builders",
} as const

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

/** Jose's launch film, on the hero until the Boston montage is cut. */
export const LAUNCH_FILM: HeroFilm = {
  src: '/media/hero.mp4',
  poster: '/media/hero-poster-launch.jpg',
  aspect: 16 / 9,
}

/**
 * The Boston montage: the city and its schools, each cut with a company that started there. The
 * shot list, sources and licences are in docs/hero-montage.md. Export the cuts to these paths.
 */
export const BOSTON_MONTAGE: HeroFilm = {
  src: '/media/boston-montage.mp4',
  phoneSrc: '/media/boston-montage-phone.mp4',
  poster: '/media/boston-montage-poster.jpg',
  aspect: 16 / 9,
  note: 'Not affiliated with or endorsed by the companies or universities shown.',
}

/**
 * What the hero plays. Once the montage's files are in public/media, set this to BOSTON_MONTAGE.
 * Null leaves the hero to the field alone.
 */
export const HERO_FILM: HeroFilm | null = LAUNCH_FILM

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
  /** One of the trail's own glyphs, drawn large behind the card. */
  glyph: string
  /** Down the stair the light warms, as it does across the field: Start sky, Launch rose. */
  hue: Hue
  who: string
  offers: readonly string[]
}

export const TRACKS_INTRO = {
  title: 'Three ways in',
  lede: 'Pick the one that fits today. Move whenever you like.',
} as const

export const TRACKS: readonly Track[] = [
  {
    name: 'Start',
    glyph: '○',
    hue: 'sky',
    who: 'You want to make something and haven\'t started. Any school, any major.',
    offers: [
      'Build nights with people who will help you begin',
      'Meet engineers, designers and business people who want to build too',
    ],
  },
  {
    name: 'Build',
    glyph: '>',
    hue: 'iris',
    who: 'You\'re making something, on your own or with friends.',
    offers: [
      'Find a co-founder or the teammate with the skill you\'re missing',
      'Feedback from people a step ahead of you',
      'Hackathon trips with the CS group',
    ],
  },
  {
    name: 'Launch',
    glyph: '_',
    hue: 'rose',
    who: 'You\'re turning what you built into a company.',
    offers: [
      'Firesides where founders and investors tell how they did it',
      'A path into startup programs such as BU\'s Spark! and Innovate@BU',
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

/** How a person's time at Proto goes, drawn as the ASCII journey on the landing. */
export const JOURNEY = {
  title: 'Show up. Team up.\nBuild. Ship.',
  lede: 'Nobody arrives with a plan. You come to a build night with half an idea, meet people, and by the end of the semester it\'s in front of a room.',
  steps: [
    { name: 'Show up', text: 'Come to a build night or a fireside, with an idea or without one. Everyone starts in the same loose crowd.' },
    { name: 'Team up', text: 'Ideas narrow down to one, and strangers with different skills turn into a team that\'s building it.' },
    { name: 'Build', text: 'Keep what works and cut what doesn\'t, week after week, with people around to ask.' },
    { name: 'Ship', text: 'Show it at demo night, then to users, and one day to an investor.' },
  ],
} as const

export const RHYTHM_INTRO = {
  title: 'The rhythm',
  lede: 'For now it\'s one community on one calendar. Business, engineering and CS will each get nights of their own later.',
} as const

// Row order is size order: the score draws each row taller than the one before (see Home.tsx).
export const RHYTHM: readonly Beat[] = [
  { when: 'Weekly', what: 'Build night', detail: 'Open to anyone, with food. Bring what you\'re working on, or come to meet people who are.', weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], hue: 'sky' },
  { when: 'About monthly', what: 'Fireside', detail: 'A founder or investor talks about how companies get built, then takes questions from people building their own.', weeks: [2, 6, 10], hue: 'iris' },
  { when: 'About monthly', what: 'Hackathon trip', detail: 'We travel there together.', group: 'CS', weeks: [4, 8, 12], hue: 'iris' },
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
  title: 'Come build with us',
  tag: 'Proto',
  lede: 'It\'s free and there\'s no application. Tell us what you\'d like to make and we\'ll see you at build night.',
  hint: 'No application needed',
  aside: ['Nobody arrives ready.', 'We said come anyway.', 'They built something.'],
  footnote: ['* Build night,', 'every week'],
  cta: { label: 'Join Proto', href: '/join' },
}
