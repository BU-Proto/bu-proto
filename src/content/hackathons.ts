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

/** Copy for a hackathon's own page, /hackathons/:id. */
export const HACKATHON_DETAIL = {
  about: 'About the hackathon',
  trip: 'How we’re going',
  facts: 'The trip',
  website: 'Website',
  signUp: 'Sign up for the trip',
  applyBy: (day: string) => `Apply by ${day}`,
  applyClosed: (day: string) => `Applications closed ${day}`,
  travelCovered: 'Travel is covered by the hackathon',
  travelNotCovered: 'Travel isn’t covered',
  going: (count: number) => (count === 0 ? 'Nobody from BU signed up yet' : `${count} from BU going`),
  wins: 'What we’ve won here',
  gallery: 'Photos',
  previous: 'Earlier',
  next: 'Later',
  allHackathons: 'All hackathons',
} as const

export const HACKATHON_NOT_FOUND = {
  title: 'That hackathon isn’t here',
  text: 'It may have been taken down, or the link is off by a digit. Every trip we’re planning is on the hackathons page.',
  back: 'See all hackathons',
} as const
