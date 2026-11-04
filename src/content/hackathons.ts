// Upcoming hackathons. Every entry is a sample until we confirm dates and who's going.

import type { PageIntro, Sampleable } from './types'

export const HACKATHONS_INTRO: PageIntro = {
  path: '~/proto/hackathons',
  title: 'Upcoming hackathons',
  lede: 'Where we’re headed next, when applications close and how many of us are going.',
}

export interface Hackathon extends Sampleable {
  name: string
  /** ISO dates (yyyy-mm-dd). */
  starts: string
  ends: string
  location: string
  applyBy: string
  travelCovered: boolean
  buGoing: number
  href: string
}

export const HACKATHONS: readonly Hackathon[] = [
  {
    placeholder: true,
    name: 'Hack@Brown',
    starts: '2027-01-30',
    ends: '2027-01-31',
    location: 'Providence, RI',
    applyBy: '2026-12-15',
    travelCovered: true,
    buGoing: 9,
    href: 'https://hackatbrown.org',
  },
  {
    placeholder: true,
    name: 'TreeHacks',
    starts: '2027-02-12',
    ends: '2027-02-14',
    location: 'Stanford, CA',
    applyBy: '2026-12-01',
    travelCovered: false,
    buGoing: 3,
    href: 'https://www.treehacks.com',
  },
  {
    placeholder: true,
    name: 'MakeMIT',
    starts: '2027-02-20',
    ends: '2027-02-21',
    location: 'Cambridge, MA',
    applyBy: '2027-01-10',
    travelCovered: true,
    buGoing: 6,
    href: 'https://makemit.org',
  },
  {
    placeholder: true,
    name: 'Bitcamp',
    starts: '2027-04-09',
    ends: '2027-04-11',
    location: 'College Park, MD',
    applyBy: '2027-03-01',
    travelCovered: false,
    buGoing: 2,
    href: 'https://bit.camp',
  },
  {
    placeholder: true,
    name: 'HackMIT',
    starts: '2027-09-18',
    ends: '2027-09-19',
    location: 'Cambridge, MA',
    applyBy: '2027-07-15',
    travelCovered: true,
    buGoing: 12,
    href: 'https://hackmit.org',
  },
  {
    placeholder: true,
    name: 'PennApps',
    starts: '2027-09-24',
    ends: '2027-09-26',
    location: 'Philadelphia, PA',
    applyBy: '2027-08-01',
    travelCovered: true,
    buGoing: 7,
    href: 'https://pennapps.com',
  },
]

export const BOARD_LABELS = { left: 'Departures', right: 'BOS → everywhere' } as const

export const TRAVEL_NOTE =
  '“Covered” means the hackathon itself pays for or reimburses travel. Check each event’s site for the details.'
