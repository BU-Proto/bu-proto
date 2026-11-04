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
  lightbox: {
    label: 'Photo viewer',
    close: 'Close',
    previous: 'Previous photo',
    next: 'Next photo',
  },
} as const

export const WIN_NOT_FOUND = {
  title: 'That win isn’t here',
  text: 'It may have been taken down, or the link is off by a digit. Every win we’ve posted is on the wins page.',
  back: 'See all wins',
} as const
