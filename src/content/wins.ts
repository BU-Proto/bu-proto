// Copy for the wins page. The wins themselves live in D1 and are edited in the portal at /admin.

import type { Logo } from './trackRecord'
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
  /** Over the projects that follow the lead win on /wins. */
  moreTitle: 'More projects that won',
} as const

/** The sheet the landing's latest wins sit on. */
export const WIN_SHEET = {
  title: 'Latest wins',
  lede: WINS_INTRO.lede,
  allWins: 'All wins',
  separator: ' • ',
  teamOf: (size: number) => `Team of ${size}`,
} as const

/** A school whose hackathon we've won at. `events` matches the names of its hackathons in a win's `event`. */
export interface WonAtSchool extends Logo {
  events: RegExp
}

/**
 * The band of schools on the wins page. A school shows only once a published win's hackathon
 * matches it, so the band can't claim a win that isn't on the page; a win at a new school needs
 * its line added here. `src` is the school's logo under public/schools/: the school's own mark
 * (from Wikimedia Commons), redrawn white on clear so it sits in the site's one voice. Without a
 * `src` the name stands in as a wordmark. `size` is the file's own width and height, which the
 * band needs to hold each logo's place before it loads. These are the schools' trademarks: the band says only
 * where the hackathons were held, and nothing here should read as a school backing Proto.
 */
export const WON_AT = {
  label: 'Schools whose hackathons we’ve won at',
  title: 'Schools we’ve won at',
  /** Names each row of the band for screen readers, since the two rows hold different schools. */
  rowLabel: (row: number, of: number) => (of > 1 ? `Schools we’ve won at, row ${row} of ${of}` : 'Schools we’ve won at'),
  schools: [
    { name: 'Harvard University', src: '/schools/harvard.png', size: [635, 160], events: /hackharvard/i },
    { name: 'MIT', src: '/schools/mit.png', size: [198, 160], events: /hackmit/i },
    { name: 'Yale University', src: '/schools/yale.png', size: [266, 160], events: /yhack/i },
    { name: 'University of Pennsylvania', src: '/schools/penn.png', size: [329, 160], events: /pennapps/i },
    { name: 'UC Berkeley', src: '/schools/berkeley.png', size: [455, 160], events: /cal ?hacks/i },
    { name: 'University of Illinois Urbana-Champaign', src: '/schools/illinois.png', size: [565, 160], events: /hackillinois/i },
    { name: 'Boston University', src: '/schools/boston-university.png', size: [310, 160], events: /ds\+x|bostonhacks|civic ?hacks/i },
  ] satisfies WonAtSchool[],
} as const
