// The Business group's pitch competitions: what the CS group's hackathons are to building with
// code, these are to the company side. Every entry was checked against its official page on the
// date in `checked`; dates move each year, so check again before relying on one. Nothing here is
// made up: where the 2027 dates aren't out, the entry says so.

import type { Tone } from './home'
import type { PageIntro } from './types'

export interface Competition {
  name: string
  host: string
  /** Who can enter, as a short tag: "Open to anyone", "BU students". */
  who: string
  /** True when anyone can enter, from any school or none. */
  open: boolean
  /** What it is and what's on offer, in a sentence or two. */
  offer: string
  /** The dates, as they stand: a deadline, or "Dates not out yet". */
  dates: string
  /** A firm upcoming deadline (yyyy-mm-dd), for the days-left count. */
  deadline?: string
  href: string
  /** When the official page was last checked (yyyy-mm-dd). */
  checked: string
  /** Pitch practice rather than a competition. */
  practice?: true
  tone: Tone
}

export const COMPETITIONS_INTRO: PageIntro = {
  path: '~/proto/pitch-competitions',
  title: 'Pitch competitions',
  lede: 'For founders on the company side. The Business group goes to these together, the way the CS group goes to hackathons, and practises the pitch first.',
}

export const COMPETITIONS_PAGE = {
  note: 'Dates change every year. Each entry links to its official page, so check there before you plan around one.',
  open: { title: 'Open to anyone', lede: 'No school needed: any founder in Boston can enter these.' },
  schools: { title: 'For students at a school', lede: "Run by a school for its own students. If you're at one, it's worth a look." },
  official: 'Official page',
  /** "21 days left", "Closes today". */
  left: (days: number) => (days === 0 ? 'Closes today' : days === 1 ? '1 day left' : `${days} days left`),
  practice: 'Practice',
  checked: 'Checked',
  outro: { text: "Going to one? Tell the Business group and we'll help you practise your pitch.", link: { label: 'The Business group', href: '/business' } },
} as const

export const COMPETITIONS: readonly Competition[] = [
  {
    name: 'MassChallenge',
    host: 'MassChallenge, Boston',
    who: 'Open to anyone',
    open: true,
    offer: "Accelerator programs for early-stage startups in any industry, from anywhere. MassChallenge takes no equity, and startups compete for zero-equity cash awards at the end.",
    dates: 'Each program has its own dates.',
    href: 'https://masschallenge.org',
    checked: '2026-11-23',
    tone: 'amber',
  },
  {
    name: 'Precision Pitch Practice',
    host: 'Boston New Technology',
    who: 'Open to anyone',
    open: true,
    offer: 'Online pitch practice with no scores and no competition. A good place to try a pitch before a judged one.',
    dates: 'Listed on its meetup page.',
    href: 'https://www.meetup.com/boston_new_technology/',
    checked: '2026-11-23',
    practice: true,
    tone: 'amber',
  },
  {
    name: 'New Venture Competition',
    host: 'Innovate@BU',
    who: 'BU students',
    open: false,
    offer: "BU's venture competition, with cash prizes for student ventures and the finals at Innovators Night.",
    dates: 'Dates not out yet. Last cycle, applications closed in late January.',
    href: 'https://www.bu.edu/innovate/signature-programs/new-venture-competition',
    checked: '2026-11-23',
    tone: 'rose',
  },
  {
    name: '$100K New Ventures Competition',
    host: 'Derby Entrepreneurship Center, Tufts',
    who: 'Tufts students and staff',
    open: false,
    offer: "Tufts' yearly venture competition, with semifinals in March and finals in April. A team needs a Tufts student, employee or eligible graduate in a founding role.",
    dates: 'Applications open February 1, 2027 and close February 21, 2027. Semifinals March 19, finals April 9.',
    deadline: '2027-02-21',
    href: 'https://derbyecenter.tufts.edu/competitions/100k/',
    checked: '2026-11-23',
    tone: 'sky',
  },
  {
    name: "President's Innovation Challenge",
    host: 'Harvard Innovation Labs',
    who: 'Harvard students',
    open: false,
    offer: "Harvard's venture competition for students across its 13 schools and some alumni, with startup funding from a prize pool the Harvard Crimson put at $500,000 this year.",
    dates: 'Dates not out yet on the official page.',
    href: 'https://innovationlabs.harvard.edu/presidents-innovation-challenge',
    checked: '2026-11-23',
    tone: 'iris',
  },
  {
    name: 'MIT $100K Entrepreneurship Competition',
    host: 'MIT',
    who: 'MIT students',
    open: false,
    offer: 'Three rounds through the year: Pitch, Accelerate and the Launch finale. Every team needs at least one current MIT student; the rest of the team can be from anywhere.',
    dates: 'Dates not out yet: the official page says the 2027 dates are posted in the fall.',
    href: 'https://mit100k.org/',
    checked: '2026-11-23',
    tone: 'mint',
  },
  {
    name: 'Rocket Pitch',
    host: 'Blank Center, Babson College',
    who: 'Babson, Olin and Wellesley',
    open: false,
    offer: "Babson's yearly pitch night: three slides and a short pitch. The lead founder has to be a Babson, Olin or Wellesley student, or Babson alumni, faculty, staff or a parent; teammates can be from other schools.",
    dates: 'Dates not out yet. The 2026 event was November 12.',
    href: 'https://babson.edu/entrepreneurship-center/startup-acceleration/rocket-pitch/',
    checked: '2026-11-23',
    tone: 'amber',
  },
  {
    name: 'Husky Startup Challenge',
    host: 'Northeastern',
    who: 'Northeastern students',
    open: false,
    offer: "Northeastern's semester-long startup program: students pitch their ventures to judges for seed funding, ending in a Demo Day.",
    dates: 'Dates not out yet. It runs in fall and spring cohorts.',
    href: 'https://careers.northeastern.edu/resources/husky-startup-challenge/',
    checked: '2026-11-23',
    tone: 'rose',
  },
  {
    name: 'Strakosch Venture Competition',
    host: 'Shea Center, Boston College',
    who: 'BC students',
    open: false,
    offer: "Boston College's university-wide business plan competition, with equity-free prize money for student founders.",
    dates: 'Dates not out yet.',
    href: 'https://www.bc.edu/bc-web/schools/carroll-school/sites/shea-center/competitions.html',
    checked: '2026-11-23',
    tone: 'sky',
  },
]
