// Copy for the about page: what Proto is, why it exists, what it offers and who runs it. Every
// fact here is one the rest of the site already states (the landing, join, board, fund and
// playbook copy); say nothing new about Proto here that isn't true there first.

import type { PictogramName } from '../components/Pictogram'
import type { Tone } from './home'
import type { Link } from './types'

export const ABOUT_INTRO = {
  /** The browser tab's title. */
  tab: 'About Proto',
  title: 'A home in Boston for people who build things',
  lede: 'Free and open to anyone in Boston, from any school or none, at any stage.',
} as const

/** The tracks themselves come from the landing's TRACKS, so the two never disagree. */
export const WHAT = {
  title: 'What Proto is',
  text: "A place for anyone in Boston who wants to make something. You don't need an idea, a team or any experience. It's free, with no application.",
  tracksLead: 'Three tracks, one for each stage. Pick the one that fits today.',
} as const

export const WHY = {
  title: 'Why it exists',
  text: "Every idea needs a team. Proto is where Boston's builders find theirs.",
} as const

/** How an offer is drawn on its tile: one of the flat pictograms, or the Founders Circle's mark. */
export type OfferPicture = PictogramName | 'circle'

export interface Offer {
  name: string
  /** One short line: what it is, said once. */
  text: string
  /** The page it lives on. */
  where: Link
  picture: OfferPicture
  /** The tile's colour. Left out, the tile is dark: the fund (not running yet) and the Circle (gold). */
  tone?: Tone
  /** Not running yet: said on the tile, in the "not yet" colour. */
  soon?: string
  /** The Founders Circle's tile: black, with its gold mark and label. */
  circle?: string
}

export const OFFER = {
  id: 'offer',
  title: 'What we offer',
  lede: 'Each one opens its own page.',
  items: [
    { name: 'Build nights', text: 'Every week, with food. Bring a project or just come.', where: { label: 'Events', href: '/events' }, picture: 'calendar', tone: 'sky' },
    { name: 'Firesides', text: 'Every two weeks. A founder or investor, then your questions.', where: { label: 'Firesides', href: '/events#firesides' }, picture: 'ask', tone: 'iris' },
    { name: 'Demo night', text: 'Each semester. Show anything, finished or not.', where: { label: 'Events', href: '/events' }, picture: 'demo', tone: 'rose' },
    { name: 'CS and Business groups', text: 'Nights of their own. Everyone is welcome at them.', where: { label: 'The groups', href: '/cs' }, picture: 'flag', tone: 'mint' },
    { name: 'Wins', text: 'What people here built and took home.', where: { label: 'Wins', href: '/wins' }, picture: 'trophy', tone: 'amber' },
    { name: 'Startup programs', text: "What's open to founders across Boston, and for BU students, a way into Spark! and Innovate@BU.", where: { label: 'Resources', href: '/resources' }, picture: 'compass', tone: 'sky' },
    { name: 'A fund for first versions', soon: 'Coming soon', text: "Small grants for a first version. It isn't funded yet.", where: { label: 'About the fund', href: '/grants' }, picture: 'go' },
    { name: 'Founders Circle', circle: 'By application', text: 'A small group for founders already building.', where: { label: 'Founders Circle', href: '/founders' }, picture: 'circle' },
  ] satisfies Offer[],
} as const

export const WHO = {
  title: 'Who runs it',
  text: 'Started by BU students who build things themselves. Andres Lopez and Jose Cruz are co-presidents, and the first board is forming now.',
  /** Before the seats still open, which come from the board page's own list. */
  openLead: 'Seats still open',
  board: { label: 'Meet the board', href: '/board' } satisfies Link,
  apply: { label: 'Apply for a seat', href: '/roles' } satisfies Link,
} as const
