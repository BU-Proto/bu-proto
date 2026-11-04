// Copy for the home page. The next event, deadlines and wins are content in D1 (edited in the
// portal at /admin); the copy around them lives here.

import type { Link, TrackName } from './types'

export const HERO_COPY = {
  headline: ['Your Home Base', 'for Making Things'],
  lede: 'Hack nights, hackathon trips and demo nights for BU students who make things.',
  primaryCta: { label: 'Join Proto', href: '/join' },
  secondaryCta: { label: 'See hack nights', href: '/events' },
} as const

export type NoteIconName = 'grants' | 'handoff'

/** The two things the tracks and the rhythm don't already say, in a slim strip under the rhythm. */
export const NOTES: readonly { icon: NoteIconName; text: string; link?: Link }[] = [
  { icon: 'grants', text: 'Microgrants of $50–$500, coming soon', link: { label: 'About the fund', href: '/grants' } },
  { icon: 'handoff', text: 'Built to feed BU’s startup programs (Spark!, Innovate@BU)' },
]

/**
 * The full-bleed band between the rhythm and what's next. Glyphs between items come from the field.
 * The fund isn't in here: the line under the band says it, with the link.
 */
export const MARQUEE: readonly string[] = [
  'Weekly hack nights, with food',
  'Group trips to hackathons',
  'A demo night every semester',
  'First hackathon? You get a veteran',
  'Built to feed Spark! and Innovate@BU',
]

export interface Track {
  name: TrackName
  /** One of the trail's own glyphs, drawn large behind the card. */
  glyph: string
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
    who: 'Any CS student, no projects yet.',
    offers: [
      'Beginner workshops',
      '"First hackathon" squads paired with a veteran',
      'Project and resume help',
    ],
  },
  {
    name: 'Build',
    glyph: '>',
    who: 'Hackathon regulars and side-project people.',
    offers: ['Weekly hack nights', 'Team matching', 'Group trips to HackMIT, PennApps and more'],
  },
  {
    name: 'Launch',
    glyph: '_',
    who: 'Student founders.',
    offers: ['Demo nights', 'Founder talks', "A path into BU's startup programs"],
  },
]

export interface Beat {
  when: string
  what: string
  detail: string
  /** Planned for later, not part of the first year. */
  later?: boolean
  /** The weeks of a typical semester it lands on, for the score on the home page. */
  weeks: readonly number[]
}

export const RHYTHM_INTRO = {
  title: 'The rhythm',
  lede: 'Something every week, something bigger every month, something everyone shows up for each semester.',
} as const

export const RHYTHM: readonly Beat[] = [
  { when: 'Weekly', what: 'Hack night', detail: 'Open to everyone, with food.', weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
  { when: 'About monthly', what: 'Hackathon trip', detail: 'We go as a group.', weeks: [4, 8, 12] },
  { when: 'Each semester', what: 'Demo night', detail: 'Anyone can show anything.', weeks: [14] },
  { when: 'Year two', what: 'Our own hackathon', detail: 'A BU hackathon, run by us.', later: true, weeks: [] },
]

/** The score's columns: a semester, roughly week by week. */
export const SEMESTER = {
  weeks: 14,
  caption: 'Roughly how a semester runs, week by week',
  weekLabel: 'Week',
  later: 'Not yet: planned for year two',
} as const

export const NEXT_UP = {
  title: 'Next up',
  applyBy: 'Apply by',
  allEvents: 'All events',
  allHackathons: 'Every hackathon',
} as const

export const WINS_TITLE = 'Latest wins'

export const HOME_EMPTY = {
  next: 'Nothing on the calendar yet. Check back soon.',
  deadlines: 'No open deadlines right now.',
} as const

export const JOIN_CTA: { title: string; lede: string; cta: Link } = {
  title: 'Come build with us',
  lede: 'No application and no experience needed. Tell us your track and we’ll see you at hack night.',
  cta: { label: 'Join Proto', href: '/join' },
}
