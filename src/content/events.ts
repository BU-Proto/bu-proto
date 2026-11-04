// Upcoming events. The kinds of event are from the concept; every date, time and room is a sample.

import type { PageIntro, Sampleable } from './types'

export const EVENTS_INTRO: PageIntro = {
  path: '~/proto/events',
  title: 'Events',
  lede: 'Hack nights every week, plus talks, prep nights and workshops. Everything is open to every track.',
}

export type EventKind = 'Hack night' | 'Why hackathons' | 'Prep night' | 'Panel' | 'Workshop' | 'Demo night'

export interface ProtoEvent extends Sampleable {
  id: string
  kind: EventKind
  title: string
  /** ISO date (yyyy-mm-dd). */
  date: string
  time: string
  place: string
  text: string
}

export const EVENTS: readonly ProtoEvent[] = [
  {
    placeholder: true,
    id: 'why-hackathons-fall-26',
    kind: 'Why hackathons',
    title: 'Why hackathons?',
    date: '2026-11-12',
    time: '6:30–8:30 PM',
    place: 'CDS, 665 Commonwealth Ave',
    text: 'Past winners show what they built and what it led to. Pizza, then questions.',
  },
  {
    placeholder: true,
    id: 'hack-night-nov-19',
    kind: 'Hack night',
    title: 'Weekly hack night',
    date: '2026-11-19',
    time: '7:00–10:00 PM',
    place: 'CDS, 665 Commonwealth Ave',
    text: 'Bring a project or find one. Food at 7.',
  },
  {
    placeholder: true,
    id: 'panel-founders-dec',
    kind: 'Panel',
    title: 'From side project to startup',
    date: '2026-12-03',
    time: '6:00–7:30 PM',
    place: 'CDS, 665 Commonwealth Ave',
    text: 'Alumni founders and a recruiter on what got their projects noticed.',
  },
  {
    placeholder: true,
    id: 'prep-hack-at-brown',
    kind: 'Prep night',
    title: 'Hack@Brown prep night',
    date: '2027-01-26',
    time: '7:00–9:00 PM',
    place: 'CDS, 665 Commonwealth Ave',
    text: 'Ideas, team formation and pitch practice the week before.',
  },
  {
    placeholder: true,
    id: 'workshop-apis',
    kind: 'Workshop',
    title: 'Ship an AI app in an evening',
    date: '2027-02-04',
    time: '6:30–8:30 PM',
    place: 'CDS, 665 Commonwealth Ave',
    text: 'A hands-on workshop co-hosted with a sponsor. Laptops required.',
  },
  {
    placeholder: true,
    id: 'demo-night-spring-27',
    kind: 'Demo night',
    title: 'Spring demo night',
    date: '2027-04-22',
    time: '6:00–9:00 PM',
    place: 'CDS, 665 Commonwealth Ave',
    text: 'Anyone can show anything. Five minutes each, half-finished welcome.',
  },
]

export const RSVP = {
  label: 'RSVP',
  going: 'You’re going ✓',
  empty: 'Nothing on the calendar yet. Check back soon.',
} as const
