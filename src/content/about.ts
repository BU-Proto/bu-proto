// Copy for the about page: what Proto is, why it exists, what it offers and who runs it. Every
// fact here is one the rest of the site already states (the landing, join, board, fund and
// playbook copy); say nothing new about Proto here that isn't true there first.

import type { Hue, Link } from './types'

export const ABOUT_INTRO = {
  /** The browser tab's title. */
  tab: 'About Proto',
  title: 'A home in Boston for people who build things',
  lede: "Proto is free and open to anyone in Boston, from any school or none. There's a build night every week and a fireside with a founder or investor most months.",
} as const

/** The tracks themselves come from the landing's TRACKS, so the two never disagree. */
export const WHAT = {
  title: 'What Proto is',
  text: "A place for founders, engineers, designers, business students and anyone else in Boston who wants to make something, wherever they're starting from. It started at BU and is open to every school. It's free, with no application.",
  tracksLead: 'Three tracks, from half an idea to a company with customers. Pick the one that fits today and move whenever you like.',
} as const

export const WHY = {
  title: 'Why it exists',
  text: 'Ideas go further with people around them. Proto is where anyone in Boston who wants to make something finds the people to make it with.',
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
  lede: "Each of these has a page of its own. Here's what it is and where to find it.",
  items: [
    {
      name: 'Build nights',
      text: "Every week, open to everyone, with food. Bring what you're working on, or come to meet people who are.",
      where: { label: 'Events', href: '/events' },
      hue: 'sky',
    },
    {
      name: 'Firesides',
      text: 'About once a month, a founder or investor talks about how companies get built, then takes questions from people building their own.',
      where: { label: 'Firesides', href: '/events#firesides' },
      hue: 'iris',
    },
    {
      name: 'Demo night',
      text: 'Each semester. Anyone can show anything, finished or not: an app, a product, a company.',
      where: { label: 'Events', href: '/events' },
      hue: 'rose',
    },
    {
      name: 'Groups for each field',
      text: 'Some nights belong to one group, and everyone else is welcome at them. The CS group runs hack nights, hackathon trips and the playbook. Business and engineering get nights of their own later.',
      where: { label: 'The CS group', href: '/hackathons' },
    },
    {
      name: 'Wins and track record',
      text: 'What people here built and took home, and where Proto people have worked.',
      where: { label: 'Wins', href: '/wins' },
    },
    {
      name: 'A way into startup programs',
      text: "For founders on the Launch track: firesides, and a path into programs such as BU's Spark! and Innovate@BU. Nothing is official with either yet.",
      where: { label: 'Resources', href: '/resources' },
    },
    {
      name: 'A fund for first versions',
      soon: 'Coming soon.',
      text: "Small grants, planned for what a first version costs: parts, software credits, or entry to a hackathon or pitch competition. It isn't funded yet, so nobody can apply.",
      where: { label: 'About the fund', href: '/grants' },
    },
  ] satisfies Offer[],
} as const

export const WHO = {
  title: 'Who runs it',
  text: "Proto was started by BU students who build things themselves, and it's open to all of Boston. Andres Lopez and Jose Cruz are co-presidents, and the first board is forming now.",
  /** Before the seats still open, which come from the board page's own list. */
  openLead: 'Seats still open',
  board: { label: 'Meet the board', href: '/board' } satisfies Link,
  apply: { label: 'Apply for a seat', href: '/roles' } satisfies Link,
} as const
