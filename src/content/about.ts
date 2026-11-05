// Copy for the about page: what Proto is, why it exists, what it offers and who runs it. Every
// fact here is one the rest of the site already states (the landing, join, board, fund and
// playbook copy); say nothing new about Proto here that isn't true there first.

import { BOARD_FORM } from './board'
import type { Hue, Link } from './types'

export const ABOUT_INTRO = {
  /** The browser tab's title. */
  tab: 'About Proto',
  title: 'BU students who build things together',
  lede: 'Proto is the home base for building things at BU: a hack night every week, trips to hackathons as a group, and a demo night each semester.',
} as const

/** The tracks themselves come from the landing's TRACKS, so the two never disagree. */
export const WHAT = {
  title: 'What Proto is',
  text: 'A place for any BU student who wants to make things, wherever they’re starting from. It’s free, with no application and no experience needed.',
  tracksLead: 'Three tracks, from first-timers to student founders. Pick the one that fits today and move whenever you like.',
} as const

export const WHY = {
  title: 'Why it exists',
  text: 'Building something is easier with people to ask. Proto is there so every BU student has somewhere to build each week, a team to take to a hackathon and a night to show what they made.',
} as const

export interface Offer {
  name: string
  text: string
  /** The page it lives on. */
  where: Link
  /** Not running yet: said first, in the "not yet" colour. */
  soon?: string
  /** The rhythm's beats keep the colour they have on the landing: the bigger the night, the warmer. */
  hue?: Hue
}

export const OFFER = {
  id: 'offer',
  title: 'What we offer',
  lede: 'Each of these has a page of its own. Here’s what it is and where to find it.',
  items: [
    {
      name: 'Hack nights',
      text: 'Every week, open to everyone, with food and people to ask.',
      where: { label: 'Events', href: '/events' },
      hue: 'sky',
    },
    {
      name: 'Hackathon trips and teams',
      text: 'About once a month we go to a hackathon as a group, with team matching and a veteran for your first one.',
      where: { label: 'Hackathons', href: '/hackathons' },
      hue: 'iris',
    },
    {
      name: 'Demo night',
      text: 'Each semester. Anyone can show anything, finished or not.',
      where: { label: 'Events', href: '/events' },
      hue: 'rose',
    },
    {
      name: 'The playbook',
      text: 'Everything we wish we’d known before our first hackathon, written down.',
      where: { label: 'The playbook', href: '/resources/playbook' },
    },
    {
      name: 'Wins and track record',
      text: 'What people built at hackathons and took home, and where Proto people have worked.',
      where: { label: 'Wins', href: '/wins' },
    },
    {
      name: 'A way into BU’s startup programs',
      text: 'For student founders on the Launch track: founder talks, and a path into Spark! and Innovate@BU. Nothing is official with either yet.',
      where: { label: 'What each one does', href: '/resources' },
    },
    {
      name: 'Hackathon travel fund',
      soon: 'Coming soon.',
      text: 'Small travel grants, planned so the cost of getting there is never the reason you skip a hackathon. It isn’t funded yet, so nobody can apply.',
      where: { label: 'About the fund', href: '/grants' },
    },
  ] satisfies Offer[],
} as const

export const WHO = {
  title: 'Who runs it',
  text: 'Proto is run by BU students who build things themselves. Andres Lopez and Jose Cruz are co-presidents, and the first board is forming now.',
  /** Before the seats still open, which come from the board page's own list. */
  openLead: 'Seats still open',
  board: { label: 'Meet the board', href: '/board' } satisfies Link,
  apply: { label: 'Throw your hat in the ring', href: `/board#${BOARD_FORM.id}` } satisfies Link,
} as const
