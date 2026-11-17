// What each founding board seat is, for its row on /roles and its own page at /roles/:id. The
// roles themselves (title, team, apply-by day, the form's questions) live in D1 and are posted in
// the portal; this is the pitch for each one, matched to its role by title. A role with no entry
// here just shows its summary and write-up from the portal.

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
    own: ['Spark!', 'Innovate@BU', 'Departments and other clubs'],
    get: ['A direct line to the people who run BU’s innovation programs', 'Co-host credit on every joint event'],
    firstMonth: ['Intro meetings with Spark! and Innovate@BU', '1 co-hosted event on the calendar'],
    fit: 'you already know half the club presidents.',
  },
  'Head of Growth': {
    headline: 'Make Proto the thing every BU builder has heard of.',
    own: ['Events', 'Socials and posters', 'Outreach'],
    get: ['A growth story with real numbers', 'Something real to talk about in interviews'],
    firstMonth: ['A content calendar', '1 event run end to end', 'A signup number you’re going after'],
    fit: 'you’ve grown an account, a club, or a launch before.',
  },
}

/** The pitch for a role, if it's one of the seats above. */
export const seatFor = (title: string): Seat | undefined => SEATS[title]

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
