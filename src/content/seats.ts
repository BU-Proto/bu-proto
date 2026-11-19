// What each founding board seat is, for its row on /roles and its own page at /roles/:slug. The
// roles themselves (title, team, apply-by day, the form's questions) live in D1 and are posted in
// the portal; this is the pitch for each one, matched to its role by title. A role with no entry
// here just shows its summary and write-up from the portal.

import { slugOf } from '../../shared/slug.ts'

export interface Seat {
  /** The one line under the title, on the list and on the role's page. */
  headline: string
  /** What the seat is in charge of. */
  own: readonly string[]
  /** What the person in it walks away with. */
  get: readonly string[]
  /** What they'll have done by the end of their first month. The bar for the seat. */
  firstMonth: readonly string[]
  /** Finishes the sentence "Good fit if …". */
  fit: string
}

export const SEATS: Readonly<Record<string, Seat>> = {
  'Head of Partnerships': {
    headline: 'Bring Boston’s startups, VCs and hackathons to BU.',
    own: ['The sponsor pipeline', 'Company partners', 'Partner hackathons'],
    get: [
      'First contact with founders and investors, on behalf of a BU-sponsored org',
      'Your name on every sponsor deck',
    ],
    firstMonth: ['A list of 20 targets', '5 conversations', '1 signed partner or sponsor'],
    fit: 'you already DM founders for fun.',
  },
  'Head of the Fund': {
    headline: 'Build the fund that sends BU students to hackathons.',
    own: ['Setting up the travel fund from zero', 'Eligibility and criteria', 'The budget, then running it'],
    get: ['A student grant program you designed and run', 'A rare line on a résumé'],
    firstMonth: ['The fund’s structure and criteria, written down', 'Funding sources identified', 'A launch date'],
    fit: 'you like spreadsheets and want to say you ran money.',
  },
  'Head of Community': {
    headline: 'Be the person every builder group at BU knows.',
    own: ['Hack nights and Proto events', 'Spark!, Innovate@BU, clubs, departments'],
    get: ['A direct line to the people who run BU’s innovation programs', 'Co-host credit on every joint event'],
    firstMonth: [
      '1 hack night run end to end',
      'Intro meetings with Spark! and Innovate@BU',
      '1 co-hosted event on the calendar',
    ],
    fit: 'you already know half the club presidents.',
  },
  'Head of Scouting': {
    headline: 'Find every builder at BU before anyone else does.',
    own: ['Scouting team of 3 to 5', 'Bringing builders and founders into Proto', 'Wins wall and member spotlights', 'Socials'],
    get: [
      'You built and ran a talent pipeline, the same work VC scouts do',
      'You’re the one who brings founders into the VC sessions',
    ],
    firstMonth: ['Recruit 2 scouts', '25 builders found and contacted', '5 spotlights posted'],
    fit: 'you always know who’s building what.',
  },
}

/** The seats above by the address their role's page is at, so a title matches however it's typed. */
const SEATS_BY_SLUG: ReadonlyMap<string, Seat> = new Map(Object.entries(SEATS).map(([title, seat]) => [slugOf(title), seat]))

/**
 * The pitch for a role, if it's one of the seats above. Matched the way the role's URL is, by
 * slug, so a title retyped in the portal ("Head of scouting", a trailing space, "Head of
 * Scouting!") still finds its pitch instead of quietly dropping to the summary.
 */
export const seatFor = (title: string): Seat | undefined => SEATS_BY_SLUG.get(slugOf(title))

/** The headings for a seat's sections on its page. */
export const SEAT_SECTIONS = {
  own: 'What you own',
  get: 'What you get',
  firstMonth: {
    title: 'First 30 days',
    text: 'By the end of your first month, you’ll have shipped these. If that sounds like too much right now, this seat isn’t the one yet.',
  },
  fit: 'Good fit if',
} as const
