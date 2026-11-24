// Copy for the about page: what Proto is, why it exists, what it offers and who runs it. Every
// fact here is one the rest of the site already states (the landing, join, board, fund and
// playbook copy); say nothing new about Proto here that isn't true there first.

import type { Hue, Link } from './types'

export const ABOUT_INTRO = {
  /** The browser tab's title. */
  tab: 'About Proto',
  title: 'A home in Boston for people who build things',
  lede: "Proto is free and open to anyone in Boston, from any school or none, whether you've never built anything or you've started a company before. There's a build night every week and a fireside with a founder or investor every two weeks.",
} as const

/** The tracks themselves come from the landing's TRACKS, so the two never disagree. */
export const WHAT = {
  title: 'What Proto is',
  text: "A place for anyone in Boston who wants to make something: founders, engineers, designers, business people, and people who aren't sure yet. You don't need an idea, a team or any experience to start. It began at BU and is open to every school, and to people who aren't at one. It's free, with no application.",
  tracksLead: 'Three tracks, one for each stage, from no idea yet to a company with customers. Pick the one that fits today and move whenever you like.',
} as const

export const WHY = {
  title: 'Why it exists',
  text: "Every idea needs a team. Proto is where Boston's builders find theirs.",
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
      text: "Every week, open to everyone, with food. Bring what you're working on, or bring nothing and meet people who are.",
      where: { label: 'Events', href: '/events' },
      hue: 'sky',
    },
    {
      name: 'Firesides',
      text: 'Every two weeks, a founder or investor talks about how companies get built, then takes questions from anyone in the room.',
      where: { label: 'Firesides', href: '/events#firesides' },
      hue: 'iris',
    },
    {
      name: 'Demo night',
      text: 'Each semester. Anyone can show anything, finished or not: an app, a product, a company, a first try.',
      where: { label: 'Events', href: '/events' },
      hue: 'rose',
    },
    {
      name: 'Groups for each field',
      text: "Some nights belong to one group, and everyone else is welcome at them. The CS group runs hack nights, where people build with code together, plus hackathon trips and the playbook. The Business group runs pitch nights and takes teams to pitch competitions. You don't need a background in either.",
      where: { label: 'The CS group', href: '/cs' },
    },
    {
      name: 'Wins and track record',
      text: 'What people here built and took home, and where Proto people have worked.',
      where: { label: 'Wins', href: '/wins' },
    },
    {
      name: 'A way into startup programs',
      text: "For anyone turning an idea into a company: firesides, a list of what's open to founders across Boston, and for BU students, a path into Spark! and Innovate@BU. Nothing is official with either yet.",
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
