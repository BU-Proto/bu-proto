// Copy for the hackathons page. The hackathons themselves live in D1 and are edited in the
// portal at /admin.

import type { HackathonMode } from '../../shared/api'
import type { PageIntro } from './types'

export const HACKATHONS_INTRO: PageIntro = {
  path: '~/proto/hackathons',
  title: 'Upcoming hackathons',
  lede: 'Where we’re headed next, when applications close and how many of us are going. Each card opens the hackathon’s own site.',
}

export const TRAVEL_NOTE =
  'Listings come from MLH. “Covered” means the hackathon itself pays for or reimburses travel; “Not confirmed” means we haven’t checked yet. Apply-by dates are the start date until we confirm the real deadline, so always check the hackathon’s own site before you apply or travel.'

export const HACKATHONS_EMPTY = 'Nothing on the board right now. New trips go up here as soon as they’re planned.'

export const MODE_LABEL: Record<HackathonMode, string> = {
  'in-person': 'In person',
  hybrid: 'Hybrid',
  online: 'Online',
}

/** Our own facts under each card's listing. */
export const CARD = {
  applyBy: 'Apply by',
  travel: 'Travel',
  covered: 'Covered',
  notConfirmed: 'Not confirmed',
  going: (count: number) => (count === 1 ? 'BU Proto is going, 1 of us so far' : `BU Proto is going, ${count} of us so far`),
  newTab: '(opens the hackathon’s site in a new tab)',
} as const
