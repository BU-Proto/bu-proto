// The resources hub at /resources, and a page each for the BU programs it points to.
//
// The hub stays short: a card each for the playbook, Spark! and Innovate@BU, and nothing else.
// The detail lives on each program's own page (/resources/spark, /resources/innovate).
//
// Spark! and Innovate@BU are BU's, not ours, and nothing is official with either yet, so these
// pages describe them and point at them, never speak for them. Every fact about them below was
// checked against their own sites (bu.edu/spark and bu.edu/innovate) in CHECKED. Dates, amounts
// and deadlines change every year: when you touch this file, check their pages again and move
// CHECKED. Never add a fact you haven't read there.

import { EVENT_COVERS, type CoverPhoto } from './covers'
import { PLAYBOOK_HREF } from './guides/links'
import { SAPLING, winHref } from './guides/wins'
import type { Link, PageIntro, TrackName } from './types'

export const CHECKED = 'November 2026'

export const HUB_PATH = '/resources'

export const HUB_INTRO: PageIntro = {
  path: '~/proto/resources',
  title: 'Resources',
  lede: 'Our playbook for hackathons, and the two places at BU we send people when a project needs more.',
}

export type OrgId = 'spark' | 'innovate'

export interface Program {
  name: string
  text: string
  /** When it runs or when to apply, as their site says it. */
  when?: string
  href: string
}

export interface Need {
  want: string
  go: string
  href: string
}

export interface Org {
  id: OrgId
  /** Its page: /resources/<slug>. */
  slug: string
  name: string
  /** One line for the hub card and the page's lede. */
  line: string
  /** Where it sits at BU, set small above the name. */
  part: string
  about: readonly string[]
  /** The Proto track it fits best. */
  track: TrackName
  fit: string
  facts: readonly { term: string; detail: string }[]
  needs: readonly Need[]
  programs: readonly Program[]
  site: Link
  photo: CoverPhoto
  /** Says what the photo shows when it isn't the program's own building. */
  photoNote?: string
}

const MARSH_CHAPEL = EVENT_COVERS['Why hackathons']

export const ORGS: readonly Org[] = [
  {
    id: 'spark',
    slug: 'spark',
    name: 'Spark!',
    line: 'BU’s lab for building real things in computing and data science, with mentors, courses and two hackathons a year.',
    part: 'Faculty of Computing & Data Sciences',
    about: [
      'Spark! is BU’s innovation and experiential learning lab, in the Faculty of Computing & Data Sciences. Students build real projects there: their own idea with mentors, or a semester on a problem brought in by an outside partner.',
      'Some of its programs need an application, but many don’t, and anyone can join the community.',
    ],
    track: 'Build',
    fit: 'The natural next step for a hackathon project that needs mentors, a team or a stage.',
    facts: [
      { term: 'Where', detail: 'Floor 2 of the CDS building, 665 Commonwealth Ave.' },
      { term: 'Open', detail: 'Weekdays, 10 AM to 7 PM, while classes are in session' },
      { term: 'Who', detail: 'Any BU student can use the space' },
    ],
    needs: [
      { want: 'Turn an idea into a working prototype', go: 'XC475 or Tech Innovation Hours', href: 'https://www.bu.edu/spark/students/innovation/' },
      { want: 'Show a project and get feedback', go: 'Code & Tell', href: 'https://www.bu.edu/spark/code-tell/' },
      { want: 'Do a hackathon without leaving campus', go: 'DS+X and CivicHacks', href: 'https://www.bu.edu/spark/events/bu-spark-hackathons/' },
      { want: 'Work on a real problem for a real partner', go: 'X-Lab', href: 'https://www.bu.edu/spark/students/courses/' },
    ],
    programs: [
      {
        name: 'XC475',
        text: 'The Technology Innovation course takes a project from an idea to a working prototype in one semester, with Spark! experts and industry mentors. No idea yet? You can join someone else’s team.',
        when: 'Fall and spring · application and interview',
        href: 'https://www.bu.edu/spark/students/xc475/',
      },
      {
        name: 'Tech Innovation Hours',
        text: 'Student teams build alongside mentors from software engineering and UX, who help with architecture and design and review progress.',
        when: 'Wednesdays, 4 to 6 PM',
        href: 'https://www.bu.edu/spark/students/innovation/',
      },
      {
        name: 'Code & Tell',
        text: 'An open-mic night for student builders. Demo what you’re working on, finished or not, and get feedback from the room.',
        when: 'Monthly, 6 PM · tickets on Eventbrite',
        href: 'https://www.bu.edu/spark/code-tell/',
      },
      {
        name: 'DS+X and CivicHacks',
        text: 'Spark!’s two hackathons. DS+X is for BU students of every major and level, beginners welcome. CivicHacks is open nationwide, with challenges set by civic partners.',
        when: 'DS+X in the fall · CivicHacks in the spring',
        href: 'https://www.bu.edu/spark/events/bu-spark-hackathons/',
      },
      {
        name: 'X-Lab',
        text: 'Practicum courses in software engineering, machine learning, data science and UX, where student teams work on real problems for outside partners.',
        when: 'Fall and spring, as courses',
        href: 'https://www.bu.edu/spark/students/courses/',
      },
      {
        name: 'Ignite student clubs',
        text: 'Spark! runs the council behind BU’s tech clubs, BostonHacks and Hack4Impact among them. It also funds students and informal groups with an idea for BU’s computing community.',
        href: 'https://www.bu.edu/spark/students/ignite/',
      },
    ],
    site: { label: 'bu.edu/spark', href: 'https://www.bu.edu/spark/' },
    photo: EVENT_COVERS['Hack night'],
  },
  {
    id: 'innovate',
    slug: 'innovate',
    name: 'Innovate@BU',
    line: 'BU’s home for turning a project into a startup or nonprofit: funding, mentors, competitions and free events.',
    part: 'Open to every BU student, in every major',
    about: [
      'Innovate@BU is BU’s home for innovation and entrepreneurship, and it’s open to every student, not just business majors. It’s where a project goes when it could become a startup, a nonprofit or a community venture.',
      'It has funding, mentors, competitions and dozens of free events a year, and staff and student ambassadors you can drop in on.',
    ],
    track: 'Launch',
    fit: 'Where to go once people want what you built and you want to keep going.',
    facts: [
      { term: 'Where', detail: 'The IDG Capital Student Innovation Center, 730 Commonwealth Ave.' },
      { term: 'Open', detail: 'Fall: weekdays 8 AM to 8 PM, Sundays 11 AM to 8 PM' },
      { term: 'Who', detail: 'Every BU student, any major or year' },
    ],
    needs: [
      { want: 'Talk an idea through with someone', go: 'Office hours', href: 'https://www.bu.edu/innovate/about/office-hours/' },
      { want: 'Pitch in a minute, for $100', go: 'Pitch & Pizza', href: 'https://www.bu.edu/innovate/start-here/i-want-to-join-a-team/' },
      { want: 'Grow a project into a venture', go: 'Innovation Pathway', href: 'https://www.bu.edu/innovate/programs-competitions/innovation-pathway/' },
      { want: 'Find a co-founder or join a team', go: 'The team board', href: 'https://www.bu.edu/innovate/start-here/i-want-to-join-a-team/' },
    ],
    programs: [
      {
        name: 'Office hours',
        text: 'One-to-one time with staff or experts in residence, plus drop-in hours with student ambassadors. The easiest first step.',
        when: 'Book any time, or drop in',
        href: 'https://www.bu.edu/innovate/about/office-hours/',
      },
      {
        name: 'Pitch & Pizza',
        text: 'Pitch your idea in a minute or less for a chance at $100, or just watch and vote. A good place to meet other founders.',
        href: 'https://www.bu.edu/innovate/start-here/i-want-to-join-a-team/',
      },
      {
        name: 'Innovation Pathway',
        text: 'Move through milestones at your own pace, unlocking funding, mentorship and resources as your venture grows.',
        when: 'Rolling · apply any time',
        href: 'https://www.bu.edu/innovate/programs-competitions/innovation-pathway/',
      },
      {
        name: 'New Venture Competition',
        text: 'An $85K pitch competition with coaching on your idea and your pitch. Two tracks, general and social impact, each with a $20,000 first prize.',
        when: 'Applications open in the fall',
        href: 'https://www.bu.edu/innovate/programs-competitions/new-venture-competition/',
      },
      {
        name: 'Summer Accelerator',
        text: 'Ten weeks on your venture full-time, with a stipend of up to $10,000, mentors, and a final presentation to a panel of investors.',
        when: 'Summer · 2027 applications aren’t open yet',
        href: 'https://www.bu.edu/innovate/programs-competitions/summer-accelerator/',
      },
      {
        name: 'Innovation & Entrepreneurship minor',
        text: 'Open to every undergraduate. Spark!’s XC475 counts toward it.',
        href: 'https://www.bu.edu/innovate/academics/innovation-entrepreneurship-minor/',
      },
    ],
    site: { label: 'bu.edu/innovate', href: 'https://www.bu.edu/innovate/' },
    photo: MARSH_CHAPEL,
    photoNote: 'Marsh Chapel. Innovate@BU’s center is across the street from it.',
  },
]

export function orgHref(org: Org): string {
  return `${HUB_PATH}/${org.slug}`
}

export interface HubCard {
  /** Set small above the title. */
  kicker: string
  title: string
  line: string
  href: string
}

export const PLAYBOOK_CARD: HubCard = {
  kicker: 'Ours',
  title: 'The playbook',
  line: 'Everything we wish we’d known before our first hackathon, written down.',
  href: PLAYBOOK_HREF,
}

export const HUB_COPY = {
  cardsLabel: 'Resources',
  atBu: 'At BU',
  open: 'Open',
  note: `Spark! and Innovate@BU are run by BU, not by us, and nothing is official with either yet.`,
} as const

/** Copy around a program's page. */
export const ORG_PAGE = {
  back: 'Resources',
  kicker: 'At BU',
  glance: 'At a glance',
  site: 'Their site',
  fitsTrack: (track: TrackName) => `Fits our ${track} track`,
  needs: 'Go here to',
  programs: 'Programs',
  onTheirSite: 'On their site',
  other: 'Also at BU',
  playbook: 'Back to the playbook',
  photoBy: 'Photo by',
  viaCommons: 'via Wikimedia Commons',
  checked: `Run by BU, not by us, and nothing is official with them yet. Checked against their own site in ${CHECKED}. Dates and amounts change, so check theirs before you apply.`,
  /** A Proto project that's been through Spark!. Shown on that page only. */
  example: {
    org: 'spark' as OrgId,
    text: 'Sapling, one of our wins, won its track at CivicHacks 2026 and was demoed at Code & Tell that March.',
    link: { label: 'See Sapling', href: winHref(SAPLING) } satisfies Link,
  },
  missing: {
    title: 'Nothing here',
    text: 'That page doesn’t exist.',
    back: 'Back to resources',
  },
} as const
