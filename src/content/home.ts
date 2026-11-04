// Copy for the home page. The next event, deadlines and wins come from their own pages' files.

import type { Link, TrackName } from './types'

export const HERO_COPY = {
  headline: ['Your Home Base', 'for Making Things'],
  lede:
    'Weekly hack nights, group trips to hackathons and a demo night every semester, for BU students who make things. Three ways in: Start, Build, Launch. Microgrants are coming soon.',
  primaryCta: { label: 'Join Proto', href: '/join' },
  secondaryCta: { label: 'See hack nights', href: '/events' },
} as const

export type FeatureIconName = 'hackNight' | 'trips' | 'grants' | 'demo' | 'handoff'

export interface Feature {
  icon: FeatureIconName
  text: string
}

export const FEATURES: readonly Feature[] = [
  { icon: 'hackNight', text: 'Weekly hack night, open to everyone, with food' },
  { icon: 'trips', text: 'Group trips to HackMIT, PennApps and more' },
  { icon: 'grants', text: 'Microgrants of $50–$500, coming soon' },
  { icon: 'demo', text: 'One demo night each semester, anyone can show' },
  { icon: 'handoff', text: "Built to feed BU's startup programs" },
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
}

export const RHYTHM_INTRO = {
  title: 'The rhythm',
  lede: 'Something every week, something bigger every month, something everyone shows up for each semester.',
} as const

export const RHYTHM: readonly Beat[] = [
  { when: 'Weekly', what: 'Hack night', detail: 'Open to everyone, with food.' },
  { when: 'About monthly', what: 'Hackathon trip', detail: 'We go as a group.' },
  { when: 'Each semester', what: 'Demo night', detail: 'Anyone can show anything.' },
  { when: 'Year two', what: 'Our own hackathon', detail: 'A BU hackathon, run by us.', later: true },
]

export const JOIN_CTA: { title: string; lede: string; cta: Link } = {
  title: 'Come build with us',
  lede: 'No application and no experience needed. Tell us your track and we’ll see you at hack night.',
  cta: { label: 'Join Proto', href: '/join' },
}
