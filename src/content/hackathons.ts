// Copy for the hackathons page. The hackathons themselves live in D1 and are edited in the
// portal at /admin.

import type { PageIntro } from './types'

export const HACKATHONS_INTRO: PageIntro = {
  path: '~/proto/hackathons',
  title: 'Upcoming hackathons',
  lede: 'Where we’re headed next, when applications close and how many of us are going.',
}

export const BOARD_LABELS = { left: 'Departures', right: 'From Boston' } as const

export const TRAVEL_NOTE =
  '“Covered” means the hackathon itself pays for or reimburses travel. Check each event’s site for the details.'

export const HACKATHONS_EMPTY = 'Nothing on the board right now. New trips go up here as soon as they’re planned.'
