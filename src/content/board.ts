// Copy for the board page. The members live in D1 and are edited in the portal at /admin. The
// open seats are roles too: every published role with the team Board that isn't filled yet, each
// linking to its own page on /roles, where the application is.

import { CONTACT_EMAIL } from './legal'
import type { PageIntro } from './types'

export const BOARD_INTRO: PageIntro = {
  path: '~/proto/board',
  title: 'The board',
  lede: 'Proto is run by BU students who build things themselves, for builders from any school in Boston. They plan the build nights and firesides, and they read every message.',
}

export const BOARD_CONTACT = {
  lead: 'Questions, sponsorships or a project you want to pitch:',
  email: CONTACT_EMAIL,
  linkedin: 'Follow Proto on LinkedIn',
} as const

const SEAT_COUNTS: Record<number, string> = { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' }

/** Shown above the seats while any are open. */
export const BOARD_FORMING = {
  title: 'The first board is forming',
  /** `open` is how many seats are still open, at least one. */
  text: (open: number) =>
    open === 1
      ? 'Andres and Jose are in place as co-presidents. We’re now choosing the person for the last seat. If it fits what you already do, we’d like to hear from you.'
      : `Andres and Jose are in place as co-presidents. We’re now choosing the people for ${SEAT_COUNTS[open] ?? open} seats. If one fits what you already do, we’d like to hear from you.`,
  /** Read out in place of the title once every seat is filled. */
  filledTitle: 'Who’s on the board',
} as const

export const OPEN_SEAT = {
  status: 'Seat open',
  cta: 'Apply for this seat',
} as const
