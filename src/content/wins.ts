// Copy for the wins page. The wins themselves live in D1 and are edited in the portal at /admin.

import type { PageIntro } from './types'

export const WINS_INTRO: PageIntro = {
  path: '~/proto/wins',
  title: 'Wins',
  lede: 'Things people built at hackathons, and what they took home.',
}

export const WINS_EMPTY = 'No wins posted yet. The first ones go up after the next hackathon.'

/** Copy for a win's own page, /wins/:id. */
export const WIN_DETAIL = {
  team: 'Team',
  built: 'What they built',
  stack: 'Built with',
  gallery: 'Photos',
  funding: 'Funding',
  nextSteps: 'Where it’s going',
  github: 'GitHub',
  devpost: 'Devpost',
  previous: 'Previous win',
  next: 'Next win',
  allWins: 'All wins',
} as const

export const WIN_NOT_FOUND = {
  title: 'That win isn’t here',
  text: 'It may have been taken down, or the link is off by a digit. Every win we’ve posted is on the wins page.',
  back: 'See all wins',
} as const

/** The running record at the top of the home and wins pages. */
export const WIN_TALLY = {
  label: 'Our record so far',
  note: 'Counted from every win on this site, and it goes up as we add them.',
  link: 'See every win',
} as const

/** Copy for the showcase on /wins, the home page and each hackathon's page. */
export const WIN_SHOWCASE = {
  at: 'at',
  builtBy: 'Built by',
  open: 'See the project',
  /** Over the projects that follow the lead win on /wins. */
  moreTitle: 'More projects that won',
} as const
