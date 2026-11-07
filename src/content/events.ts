// Copy for the events page. The events themselves live in D1 and are edited in the portal at
// /admin; the kinds of event (shared/constants.ts) are from the concept.

import type { EventKind } from '../../shared/constants'
import type { Hue, PageIntro } from './types'

export const EVENTS_INTRO: PageIntro = {
  path: '~/proto/events',
  title: 'Events',
  lede: 'Talks, workshops, prep nights and demo nights at BU. Everything is open to every track.',
}

/** The weekly beat beside the intro. No day or time: hack night's slot isn't booked yet. */
export const HACK_NIGHT = {
  title: 'Hack night is every week',
  text: 'Open to everyone, with food. Bring something you’re building, or find a team there.',
  next: 'The next one is',
} as const

/** The next event, set large at the top of the page. */
export const NEXT_EVENT = {
  details: 'Details',
  /** How far off it is, in words: the one line that says "this is the next one". */
  when: (days: number) => (days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`),
} as const

export const EVENTS_LATER = 'Also coming up'

/** The landing's events section: the giant words behind it, and its heading. */
export const EVENT_LEDGER = {
  title: 'Events',
  words: ['HACK', 'BUILD', 'SHIP', 'DEMO', 'REPEAT'],
  empty: 'This semester’s nights are being planned now.',
} as const

/**
 * Each kind of night in the field's colours, by its size in the rhythm: the weekly hack night
 * sky, the month's one-offs iris (as the hackathon trips are), the semester's demo night rose.
 */
export const KIND_HUE: Record<EventKind, Hue> = {
  'Hack night': 'sky',
  'Why hackathons': 'iris',
  'Prep night': 'iris',
  Panel: 'iris',
  Workshop: 'iris',
  'Demo night': 'rose',
}

/** Nothing scheduled: say what's coming and how to hear about it first. */
export const EVENTS_EMPTY = {
  title: 'Nothing on the calendar yet',
  text: 'This semester’s hack nights, talks and demo night are being planned now. Join Proto and we’ll email you before the first one.',
  join: { label: 'Join Proto', href: '/join' },
  hackathons: { label: 'See upcoming hackathons', href: '/hackathons' },
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
  place: 'Where',
  map: 'Open in Maps',
  gallery: 'Photos',
  addToCalendar: 'Add to calendar',
  past: 'This one has already happened.',
  previous: 'Earlier',
  next: 'Later',
  allEvents: 'All events',
} as const

export const EVENT_NOT_FOUND = {
  title: 'That event isn’t here',
  text: 'It may have been taken down, or the link is off by a digit. Everything coming up is on the events page.',
  back: 'See all events',
} as const
