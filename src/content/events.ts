// Copy for the events page. The events themselves live in D1 and are edited in the portal at
// /admin; the kinds of event (shared/constants.ts) are from the concept.

import type { PageIntro } from './types'

export const EVENTS_INTRO: PageIntro = {
  path: '~/proto/events',
  title: 'Events',
  lede: 'Hack nights every week, plus talks, prep nights and workshops. Everything is open to every track.',
}

export const RSVP = {
  label: 'RSVP',
  going: 'You’re going ✓',
  empty: 'Nothing on the calendar yet. Check back soon.',
  formLabel: (title: string) => `RSVP for ${title}`,
  submit: 'Count me in',
  pending: 'Saving…',
  cancel: 'Cancel',
  hint: 'Any email works. We’ll only use it about this event.',
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
