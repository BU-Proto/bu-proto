// Copy for the events page. The events themselves live in D1 and are edited in the portal at
// /admin; the kinds of event (shared/constants.ts) are from the concept.

import type { EventKind } from '../../shared/constants'
import type { Hue, PageIntro } from './types'

export const EVENTS_INTRO: PageIntro = {
  path: '~/proto/events',
  title: 'Events',
  lede: 'Firesides with founders and investors, a build night every week and a demo night each semester. Every event is open to everyone, from any school.',
}

/** The weekly beat beside the intro. No day or time: build night's slot isn't booked yet. */
export const BUILD_NIGHT = {
  title: 'Build night is every week',
  text: "Open to everyone, with food. Bring what you're building, or find people to build with.",
  next: 'The next one is',
} as const

/**
 * Firesides on the events page: a founder or investor and an hour of questions. The ones in the
 * calendar so far are filed as panels with "Fireside" in the title, and count too.
 */
export const FIRESIDES = {
  id: 'firesides',
  title: 'Firesides',
  lede: 'A founder or investor talks about how companies get built, then takes questions from people building their own.',
  upcoming: 'Coming up',
  past: 'Past',
  empty: 'The next fireside is being booked now. Join Proto and we\'ll email you when it is.',
  join: { label: 'Join Proto', href: '/join' },
} as const

/** The next event, set large at the top of the page. */
export const NEXT_EVENT = {
  details: 'Details',
  /** How far off it is, in words: the one line that says "this is the next one". */
  when: (days: number) => (days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`),
} as const

export const EVENTS_LATER = 'Also coming up'

/**
 * Each kind of night in the field's colours, by its size in the rhythm: the weekly hack night
 * sky, the month's one-offs iris (as the hackathon trips are), the semester's demo night rose.
 */
export const KIND_HUE: Record<EventKind, Hue> = {
  'Build night': 'sky',
  Social: 'sky',
  Fireside: 'iris',
  'Pitch night': 'iris',
  'Hack night': 'sky',
  'Why hackathons': 'iris',
  'Prep night': 'iris',
  Panel: 'iris',
  Workshop: 'iris',
  'Demo night': 'rose',
}

/**
 * The kinds that are a group's own night. Everyone else is welcome too, and the page says so
 * ("CS group, everyone welcome"); every other kind is for the whole community.
 */
export const KIND_GROUP: Partial<Record<EventKind, string>> = {
  'Hack night': 'CS',
  'Why hackathons': 'CS',
  'Prep night': 'CS',
  'Pitch night': 'Business',
}

/** Nothing scheduled: say what's coming and how to hear about it first. */
export const EVENTS_EMPTY = {
  title: 'Nothing on the calendar yet',
  text: "This semester's build nights, firesides and demo night are being planned now. Join Proto and we'll email you before the first one.",
  join: { label: 'Join Proto', href: '/join' },
  more: { label: 'What Proto does', href: '/about#offer' },
} as const

export const RSVP = {
  label: 'RSVP',
  /** For an event with its own sign-up page: "Register on Luma". */
  registerOn: (site: string | null) => (site ? `Register on ${site}` : 'Register'),
  going: 'You’re going ✓',
  formLabel: (title: string) => `RSVP for ${title}`,
  submit: 'Count me in',
  pending: 'Saving…',
  cancel: 'Cancel',
  hint: 'Any email works. We’ll only use it about this event.',
  privacy: 'Your browser will remember that you RSVP’d.',
} as const

/** Copy for an event's own page, /events/:id. */
export const EVENT_DETAIL = {
  about: 'What to expect',
  recap: 'How it went',
  schedule: 'Schedule',
  hosts: 'Hosts',
  /** Read out before the date and the place in the head, which show neither word. */
  when: 'When',
  where: 'Where',
  map: 'Open in Maps',
  gallery: 'Photos',
  addToCalendar: 'Add to calendar',
  past: 'This one has already happened.',
  /** The credit under a default campus cover: "Photo by {author}, {licence} via Wikimedia Commons". */
  photoBy: 'Photo by',
  viaCommons: 'via Wikimedia Commons',
  navLabel: 'More events',
  previous: 'Earlier',
  next: 'Later',
  allEvents: 'All events',
} as const

export const EVENT_NOT_FOUND = {
  title: 'That event isn’t here',
  text: 'It may have been taken down, or the link is off by a digit. Everything coming up is on the events page.',
  back: 'See all events',
} as const
