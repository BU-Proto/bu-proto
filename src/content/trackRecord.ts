// The logo wall.
//
// ONLY REAL, VERIFIED LOGOS GO HERE. No samples, no "logo goes here", no company we hope to
// work with. Add a logo only once the company or org has said yes (sponsors, partners) or a
// member has confirmed it (where they've worked, other wins), and we have the right to show it.
// That's why this file has no `placeholder` entries: an empty wall is fine, a fake one isn't.

import type { PageIntro } from './types'

export const TRACK_RECORD_INTRO: PageIntro = {
  path: '~/proto/track-record',
  title: 'Track record',
  lede: 'Where Proto people have worked, who backs us and what we’ve won. Every logo here is real and checked.',
}

export interface Logo {
  name: string
  /** Path under public/, e.g. /logos/acme.svg. Until we have the official file, the name shows as a wordmark. */
  src?: string
  href?: string
}

export interface LogoWall {
  title: string
  text: string
  logos: readonly Logo[]
}

export const LOGO_WALLS: readonly LogoWall[] = [
  { title: 'Where members have worked', text: 'Internships and jobs, confirmed by the member.', logos: [] },
  { title: 'Sponsors', text: 'Companies funding hack nights, trips and the fund.', logos: [] },
  {
    title: 'Partners',
    text: 'BU programs and orgs we co-host with.',
    logos: [
      { name: 'Boston University', href: 'https://www.bu.edu' },
      { name: 'Spark!', href: 'https://www.bu.edu/spark/' },
    ],
  },
  { title: 'Other wins', text: 'Accelerators, fellowships and awards members have landed.', logos: [] },
]

export const EMPTY_WALL = 'No verified logos yet. This fills in as they’re confirmed.'
