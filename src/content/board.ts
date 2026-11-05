// Copy for the board page. The members themselves live in D1 and are edited in the portal at
// /admin; the open seats are here, and their names are the values the board-interest form sends
// (shared/constants.ts).

import type { BoardSeat } from '../../shared/constants'
import { CONTACT_EMAIL } from './legal'
import type { PageIntro } from './types'

export const BOARD_INTRO: PageIntro = {
  path: '~/proto/board',
  title: 'The board',
  lede: 'Proto is run by BU students who build things themselves. They plan the hack nights, book the trips and find the sponsors, and they read every message.',
}

export const BOARD_CONTACT = {
  lead: 'Questions, sponsorships or a project you want to pitch:',
  email: CONTACT_EMAIL,
  linkedin: 'Follow BU Proto on LinkedIn',
} as const

/** Shown above the seats while any are open. */
export const BOARD_FORMING = {
  title: 'The first board is forming',
  text: 'Andres and Jose are in place as co-presidents. We’re now choosing the people for four seats. If one fits what you already do, we’d like to hear from you.',
  /** Read out in place of the title once every seat is filled. */
  filledTitle: 'Who’s on the board',
} as const

/**
 * The seats being filled now. A seat drops off the page on its own once a member's role names it,
 * so filling one is just adding the person in /admin.
 */
export const OPEN_SEATS: readonly { role: Exclude<BoardSeat, 'Not sure yet'>; detail: string }[] = [
  {
    role: 'Head of Partnerships',
    detail: 'External outreach: sponsors, partner groups, and companies and organisations outside BU.',
  },
  {
    role: 'Head of the Fund',
    detail: 'Sets up the hackathon travel fund, then runs it once it opens.',
  },
  {
    role: 'Head of Community',
    detail: 'Internal outreach: reaching BU students through clubs and department lists, and getting them to hack night.',
  },
  {
    role: 'Head of Growth',
    detail: 'Marketing and socials: Instagram, LinkedIn and the posters, getting Proto’s name out beyond the people who already come.',
  },
]

export const OPEN_SEAT = {
  status: 'Seat open',
  cta: 'Throw your hat in the ring',
} as const

export const BOARD_FORM = {
  id: 'throw-your-hat-in',
  title: 'Throw your hat in the ring',
  text: 'Tell us which seat and what you’d bring to it: what you’ve built, run or organised before, and what you’d take on first. We read every note and reach out about the ones that fit.',
  submit: 'Throw your hat in',
  privacy: 'We use this only to talk to you about joining the board.',
} as const

export const BOARD_THANKS = {
  title: 'Thanks, we’ve got your note',
  text: 'We read every one, and we’ll write to your BU email if it’s a fit.',
} as const
