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

/**
 * A photo of the program itself, from its own site. These are BU's photos, not freely licensed
 * ones like the campus covers: they're credited to the program and link back to the page they
 * came from. Ask the program before the site goes live with them.
 */
export interface OrgPhoto {
  src: string
  alt: string
  /** Who to credit, as their page does: "BU Spark!", or the photographer where one is named. */
  credit: string
  /** The page on their site the photo is from. */
  source: string
}

/** How often something comes round, for the strip of marks drawn beside it. */
export type Beat = 'weekly' | 'monthly' | 'semester' | 'twice' | 'always'

export interface Program {
  name: string
  text: string
  /** When it runs or when to apply, as their site says it. */
  when?: string
  href: string
  /** Spark!'s page sets its programs by how often they come round: the phrase, and its marks. */
  every?: { label: string; beat: Beat }
  /** Innovate@BU's page sets its programs as steps up; the money at a step, where there is any. */
  stake?: string
  /** Not a step on the way up: set under the steps instead. */
  aside?: boolean
  /** A photo of it happening, set beside it. */
  photo?: OrgPhoto
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
  /** A photo of the place itself for the top of its page; the hub's card keeps `photo`. */
  plate?: OrgPhoto
  /** Good to know before you go, set beside what it is. */
  more?: readonly { term: string; detail: string }[]
  /** Where to keep up with it: sign-ups, a newsletter, an inbox. */
  follow?: readonly Link[]
  /** A few of its own published numbers, set large. `figuresFrom` says what they count. */
  figures?: readonly { value: string; label: string }[]
  figuresFrom?: string
}

const INNOVATE_FILES = 'https://www.bu.edu/innovate/files'

const SPARK_FILES = 'https://www.bu.edu/spark/files'

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
      { term: 'Where', detail: 'Floor 2 of the CDS building, 665 Commonwealth Ave. The room is CDS 206.' },
      { term: 'Open', detail: 'Weekdays, 10 AM to 7 PM, while classes are in session' },
      { term: 'Who', detail: 'Any BU student can use the space' },
    ],
    more: [
      {
        term: 'Walking in',
        detail: 'Stop by any time. Its student ambassadors are there to tell you what’s on and point you at a way to get involved.',
      },
      {
        term: 'When it’s shut',
        detail: 'Weekends are for Spark! students and staff only, and the space closes on BU holidays, over intersession and for the summer.',
      },
    ],
    needs: [
      { want: 'Turn an idea into a working prototype', go: 'XC475 or Tech Innovation Hours', href: 'https://www.bu.edu/spark/students/innovation/' },
      { want: 'Come up with something worth building', go: 'IdeaJams', href: 'https://www.bu.edu/spark/students/innovation/' },
      { want: 'Show a project and get feedback', go: 'Code & Tell', href: 'https://www.bu.edu/spark/code-tell/' },
      { want: 'Do a hackathon without leaving campus', go: 'DS+X and CivicHacks', href: 'https://www.bu.edu/spark/events/bu-spark-hackathons/' },
      { want: 'Work on a real problem for a real partner', go: 'X-Lab', href: 'https://www.bu.edu/spark/students/courses/' },
      { want: 'Ask someone who’s done it before', go: 'Free one-to-one consultations', href: 'https://www.bu.edu/spark/resources/' },
    ],
    // In order of how often they come round, which is how the page sets them.
    programs: [
      {
        name: 'Cookie O’Clock',
        text: 'An hour’s break on floor 2 of CDS: play some games and grab a cookie.',
        when: '3 to 4 PM',
        href: 'https://www.bu.edu/spark/events/',
        every: { label: 'Every Wednesday', beat: 'weekly' },
      },
      {
        name: 'Tech Innovation Hours',
        text: 'Student teams build alongside mentors from software engineering and UX, who help with architecture and design and review progress.',
        when: '4 to 6 PM, in CDS 206',
        href: 'https://www.bu.edu/spark/students/innovation/',
        every: { label: 'Every Wednesday', beat: 'weekly' },
      },
      {
        name: 'Tech Talk',
        text: 'Spark!’s student ambassadors host a workshop each week, to build a skill and to meet people who work in industry.',
        when: '6 to 7:30 PM',
        href: 'https://www.bu.edu/spark/events/',
        every: { label: 'Every Wednesday', beat: 'weekly' },
      },
      {
        name: 'Code & Tell',
        text: 'An open-mic night for student builders. Demo what you’re working on, finished or not, and get feedback from the room. Two Spark! alumni host it with the Spark! staff, and presenters and the audience both sign up on Eventbrite.',
        when: '6 PM, in the Spark! space',
        href: 'https://www.bu.edu/spark/code-tell/',
        every: { label: 'Once a month', beat: 'monthly' },
        photo: {
          src: `${SPARK_FILES}/2026/04/2J3A5691-1536x1097.jpg`,
          alt: 'A student with a microphone shows a small rover to the room at Code & Tell',
          credit: 'BU Spark!',
          source: 'https://www.bu.edu/spark/2026/04/07/march-code-and-tell/',
        },
      },
      {
        name: 'XC475',
        text: 'The Technology Innovation course takes a project from an idea to a working prototype in one semester, with Spark! experts and industry mentors. It’s for undergraduates, who apply as a technical or a design teammate, and it fills four Hub units. No idea yet? You can join someone else’s team.',
        when: 'Fall and spring, by application',
        href: 'https://www.bu.edu/spark/students/xc475/',
        every: { label: 'Every semester', beat: 'semester' },
      },
      {
        name: 'X-Lab',
        text: 'Practicum courses in software engineering, machine learning, data science, data visualization and UX, where student teams work on real problems for outside partners. The ACLU of Massachusetts has been one.',
        when: 'Fall and spring, as courses',
        href: 'https://www.bu.edu/spark/students/courses/',
        every: { label: 'Every semester', beat: 'semester' },
      },
      {
        name: 'Demo Day',
        text: 'At the end of each semester Spark! and BU’s Cross-College Challenge put on Demo Day together, as part of the Experiential Learning Expo, where the semester’s teams show what they built.',
        when: 'The end of each semester, on floors 1 and 2 of CDS',
        href: 'https://www.bu.edu/spark/events/demo-day/',
        every: { label: 'Every semester', beat: 'semester' },
        photo: {
          src: `${SPARK_FILES}/2026/05/2J3A6007-1536x1024.jpg`,
          alt: 'A crowd gathers round a student presenting at Demo Day in the CDS lobby',
          credit: 'BU Spark!',
          source: 'https://www.bu.edu/spark/events/demo-day/',
        },
      },
      {
        name: 'DS+X and CivicHacks',
        text: 'Spark!’s two hackathons. DS+X is for BU students of every major and level, beginners welcome, building their own idea. CivicHacks is open nationwide, with challenges set by civic partners. DS+X 2026 had 250 students registered and 52 teams hand in a working project; CivicHacks 2026 drew 116 people from 20 universities and colleges, with $7,050 in prizes.',
        when: 'DS+X in the fall, CivicHacks in the spring',
        href: 'https://www.bu.edu/spark/events/bu-spark-hackathons/',
        every: { label: 'Twice a year', beat: 'twice' },
        photo: {
          src: `${SPARK_FILES}/2026/10/2J3A8633-Enhanced-NR-1536x1097.jpg`,
          alt: 'Students at a long table with laptops and pizza take a selfie at the DS+X hackathon',
          credit: 'Isabella Boncser, for BU Spark!',
          source: 'https://www.bu.edu/spark/2026/10/26/dsx-2026/',
        },
      },
      {
        name: 'Ignite Student Council',
        text: 'Spark! runs the council behind BU’s tech clubs, BostonHacks and Hack4Impact among them, and helps them with funding, recruiting and outreach. It also funds students and informal groups with an idea for BU’s computing community.',
        href: 'https://www.bu.edu/spark/students/ignite/',
        every: { label: 'All year', beat: 'always' },
      },
      {
        name: 'One-to-one consultations',
        text: 'Book a free hour with an expert in data science, software engineering, design, computational journalism, civic tech, or innovation and projects.',
        href: 'https://www.bu.edu/spark/resources/',
        every: { label: 'All year', beat: 'always' },
      },
      {
        name: 'Paid student roles',
        text: 'Each semester Spark! hires a limited number of students as ambassadors, technical and UX design interns, communications interns and project managers. Its listings put the pay at about $16.50 to $20 an hour, for 3 to 12 hours a week.',
        when: 'A limited number each semester',
        href: 'https://www.bu.edu/spark/students/work/',
        every: { label: 'All year', beat: 'always' },
      },
    ],
    follow: [
      { label: 'Event sign-ups on Eventbrite', href: 'https://www.eventbrite.com/o/bu-spark-13250579290' },
      { label: 'Instagram', href: 'https://www.instagram.com/bu_spark/' },
      { label: 'buspark@bu.edu', href: 'mailto:buspark@bu.edu' },
    ],
    plate: {
      src: `${SPARK_FILES}/2025/09/CDS-6-2048x1333.jpg`,
      alt: 'The Spark! space on floor 2 of CDS: a Spark! banner, teal armchairs and blue booths by the windows, with students sitting and walking through',
      credit: 'BU Spark!',
      source: 'https://www.bu.edu/spark/resources/space/',
    },
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
      { term: 'Open', detail: 'Fall: weekdays 8 AM to 8 PM, Sundays 11 AM to 8 PM. Closed Saturdays.' },
      { term: 'Who', detail: 'Every BU student, any major or year' },
    ],
    more: [
      {
        term: 'Walking in',
        detail: 'Come by any time it’s open, to study or to work on your venture. Student ambassadors hold drop-in hours on Mondays, Wednesdays and Fridays; the week’s times are at the front desk.',
      },
      {
        term: 'No idea yet',
        detail: 'Its own site says that’s no problem: there are workshops and programs for finding one, and a board of student teams looking for people.',
      },
    ],
    figures: [
      { value: '200+', label: 'active teams' },
      { value: '300+', label: 'BU student founders' },
      { value: '17 of 17', label: 'BU schools and colleges represented' },
      { value: '49%', label: 'women founders' },
    ],
    figuresFrom: 'The Innovation Pathway, by its own numbers',
    needs: [
      { want: 'Talk an idea through with someone', go: 'Office hours', href: 'https://www.bu.edu/innovate/about/office-hours/' },
      { want: 'Find out if a problem is worth solving', go: 'The Problem Validator', href: 'https://www.bu.edu/innovate/programs-competitions/the-problem-validator/' },
      { want: 'Pitch in a minute, for $100', go: 'Pitch & Pizza', href: 'https://www.bu.edu/innovate/start-here/i-want-to-join-a-team/' },
      { want: 'Grow a project into a venture', go: 'Innovation Pathway', href: 'https://www.bu.edu/innovate/programs-competitions/innovation-pathway/' },
      { want: 'Find a co-founder or join a team', go: 'The team board', href: 'https://www.bu.edu/innovate/start-here/i-want-to-join-a-team/' },
      { want: 'Try an idea in your first year', go: 'First-Year Innovation Fellowship', href: 'https://www.bu.edu/innovate/programs-competitions/first-year-innovation-fellowship/' },
    ],
    programs: [
      {
        name: 'Office hours',
        text: 'One-to-one time with staff or experts in residence, who are working founders, plus drop-in hours with student ambassadors. The easiest first step, whether you’re new to this or already have a venture.',
        when: 'Book any time, or drop in',
        href: 'https://www.bu.edu/innovate/about/office-hours/',
      },
      {
        name: 'Pitch & Pizza',
        text: 'Pitch your idea in a minute or less for a chance at $100, or just watch and vote. A good place to meet other solo founders and team up.',
        stake: '$100',
        href: 'https://www.bu.edu/innovate/start-here/i-want-to-join-a-team/',
      },
      {
        name: 'Innovation Pathway',
        text: 'Three stages, Walk, Run and Fly, at your own pace. Moving from Walk to Run brings a $1,500 grant and from Run to Fly another $3,000, and they take no equity. Expect 5 to 10 hours a week.',
        when: 'Rolling, with interviews every month',
        stake: '$1,500, then $3,000',
        href: 'https://www.bu.edu/innovate/programs-competitions/innovation-pathway/',
      },
      {
        name: 'New Venture Competition',
        text: 'An $85K pitch competition with coaching on your idea and your pitch. Two tracks, general and social impact, each with a $20,000 first prize. Early-stage ideas and solo founders are welcome. Its final is Innovators’ Night.',
        when: 'Applications open in the fall',
        stake: '$20,000 first prize',
        href: 'https://www.bu.edu/innovate/programs-competitions/new-venture-competition/',
      },
      {
        name: 'Summer Accelerator',
        text: 'Ten weeks on your venture full-time, in person in Boston, with a stipend of up to $10,000, workshops twice a week, mentors, and a final presentation to a panel of investors and community members.',
        when: 'Summer. 2027 applications aren’t open yet',
        stake: 'Up to $10,000',
        href: 'https://www.bu.edu/innovate/programs-competitions/summer-accelerator/',
      },
      {
        name: 'The Problem Validator',
        text: 'Five short modules for testing whether a problem is worth working on, against real evidence. Self-paced, start any time, and you don’t need a polished idea.',
        href: 'https://www.bu.edu/innovate/programs-competitions/the-problem-validator/',
        aside: true,
      },
      {
        name: 'First-Year Innovation Fellowship',
        text: 'A semester-long program for first-years, offered each fall and spring, with a $500 seed grant. You don’t need an idea already.',
        href: 'https://www.bu.edu/innovate/programs-competitions/first-year-innovation-fellowship/',
        aside: true,
      },
      {
        name: 'Enlight Fellowship',
        text: 'A 10-week summer incubator, split between an internship at a local social impact organization and your own social venture, with a $10,000 stipend.',
        href: 'https://www.bu.edu/innovate/programs-competitions/enlight-fellowship/',
        aside: true,
      },
      {
        name: 'Sustainability Innovation Seed Grants',
        text: 'Help BU tackle a sustainability problem and get $500. You don’t need a fully formed plan to apply.',
        href: 'https://www.bu.edu/innovate/programs-competitions/sustainability-innovation-seed-grants/',
        aside: true,
      },
      {
        name: 'IDEA Con',
        text: 'A free, one-day event of talks and workshops, with student innovators from more than 40 universities.',
        href: 'https://www.bu.edu/innovate/events/idea-con/',
        aside: true,
      },
      {
        name: 'Innovation & Entrepreneurship minor',
        text: 'Open to every undergraduate: one required course, Ideas2Impact, and four electives. Spark!’s XC475 counts toward it.',
        href: 'https://www.bu.edu/innovate/academics/innovation-entrepreneurship-minor/',
        aside: true,
      },
    ],
    follow: [
      { label: 'The weekly newsletter', href: 'https://www.bu.edu/innovate/innovation-resources/newsletter-subscribe/' },
      { label: 'Instagram', href: 'https://www.instagram.com/innovate_bu' },
      { label: 'innovatebu@bu.edu', href: 'mailto:innovatebu@bu.edu' },
    ],
    plate: {
      src: `${INNOVATE_FILES}/2024/08/3J3A1836-2048x1366.jpg`,
      alt: 'A group of students and staff on the sidewalk outside the IDG Capital Student Innovation Center, with Innovate@BU lettered across its window',
      credit: 'Innovate@BU',
      source: 'https://www.bu.edu/innovate/about/student-innovation-center/',
    },
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
  about: 'What it is',
  needs: 'Go here to',
  programs: 'Programs',
  /** Each program's page sets its programs as a figure of its own, under its own heading. */
  figure: {
    spark: { title: 'A year at Spark!', line: 'What comes round when, from every week to twice a year.' },
    innovate: { title: 'From an idea to a venture', line: 'Five of its programs, from a first conversation to a full summer on your venture.' },
  } satisfies Record<OrgId, { title: string; line: string }>,
  alsoThere: 'Also there',
  follow: 'Keep up with it',
  /** The credit under one of the program's own photos: "Photo: BU Spark!". */
  photoOf: 'Photo:',
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
