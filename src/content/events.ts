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
