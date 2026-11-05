// The resources hub at /resources: our playbook first, then the places at BU that help people
// build, fund and launch things. Spark! and Innovate@BU are BU's, not ours, and nothing is
// official with either yet, so this page describes them and points at them, never speaks for them.
//
// Every fact about them below was checked against their own sites (bu.edu/spark and
// bu.edu/innovate) on CHECKED. Dates, amounts and deadlines change every year: when you touch
// this file, check their pages again and move CHECKED. Never add a fact you haven't read there.

import type { Hue, Link, PageIntro } from './types'
import { PLAYBOOK_HREF } from './guides/links'
import { SAPLING, winHref } from './guides/wins'

export const CHECKED = 'November 2026'

export const HUB_INTRO: PageIntro = {
  path: '~/proto/resources',
  title: 'Resources',
  lede: 'Our playbook for hackathons, and the places at BU that help you build, fund and launch what comes out of them.',
}

export const PLAYBOOK_CARD = {
  label: 'Ours',
  title: 'The playbook',
  text: 'Everything we wish we’d known before our first hackathon, written down: picking an idea, splitting a team, shipping by Sunday, the demo and what comes after.',
  /** How many of the written guides to list by name under the text. */
  preview: 4,
  count: (n: number) => `${n} guides`,
  cta: { label: 'Open the playbook', href: PLAYBOOK_HREF } satisfies Link,
} as const

export const AROUND_BU = {
  id: 'around-bu',
  title: 'Around BU',
  lede: 'Proto is the weekly part: hack nights, trips and a team to go with. When a project needs more than that, these are the two places at BU we send people.',
  note: `Run by BU, not by us, and nothing is official with either yet. Checked against their own sites in ${CHECKED}. Dates and amounts change, so check theirs before you apply.`,
} as const

/** "I want to…", each answered with the program to go to. The fastest way into either one. */
export interface Need {
  want: string
  go: string
  /** Which org it is, for the colour and the name beside it. Proto's own answers have none. */
  org?: OrgId
  href: string
}

export const NEEDS = {
  title: 'Which one, for what',
  items: [
    {
      want: 'Turn an idea into a working prototype, with mentors',
      go: 'Spark!’s XC475 course, or Tech Innovation Hours on Wednesdays',
      org: 'spark',
      href: 'https://www.bu.edu/spark/students/innovation/',
    },
    {
      want: 'Show a project and get feedback',
      go: 'Spark!’s Code & Tell, once a month',
      org: 'spark',
      href: 'https://www.bu.edu/spark/code-tell/',
    },
    {
      want: 'Do a hackathon without leaving campus',
      go: 'Spark!’s DS+X in the fall and CivicHacks in the spring',
      org: 'spark',
      href: 'https://www.bu.edu/spark/events/bu-spark-hackathons/',
    },
    {
      want: 'Pitch an idea in a minute, for $100',
      go: 'Pitch & Pizza at Innovate@BU',
      org: 'innovate',
      href: 'https://www.bu.edu/innovate/start-here/i-want-to-join-a-team/',
    },
    {
      want: 'Grow a project into a startup or nonprofit',
      go: 'Innovate@BU’s Innovation Pathway, open all year',
      org: 'innovate',
      href: 'https://www.bu.edu/innovate/programs-competitions/innovation-pathway/',
    },
    {
      want: 'Find a co-founder or join someone’s team',
      go: 'Innovate@BU’s team board and teaming events',
      org: 'innovate',
      href: 'https://www.bu.edu/innovate/start-here/i-want-to-join-a-team/',
    },
  ] satisfies Need[],
} as const

export type OrgId = 'spark' | 'innovate'

export interface Program {
  name: string
  text: string
  /** When it runs or when to apply, as their site says it. */
  when?: string
  href: string
}

export interface Org {
  id: OrgId
  name: string
  /** Build is iris and Launch is rose on the landing: Spark! is where you build, Innovate@BU where you launch. */
  hue: Hue
  /** Where it sits at BU. */
  part: string
  /** What it is, in a sentence or two. */
  text: string
  /** The Proto track it fits best, said once. */
  fit: string
  place: { where: string; hours: string }
  programs: readonly Program[]
  site: Link
}

export const ORGS: readonly Org[] = [
  {
    id: 'spark',
    name: 'Spark!',
    hue: 'iris',
    part: 'BU’s innovation and experiential learning lab, in the Faculty of Computing & Data Sciences',
    text: 'Where computing and data science students build real things: your own project with mentors, or a semester on a project brought in by an outside partner. Many of its programs need no application, and anyone can join the community.',
    fit: 'Best for the Build track: a project that needs mentors, a team or a stage.',
    place: {
      where: 'Floor 2 of the CDS building, 665 Commonwealth Ave. Open to all BU students.',
      hours: 'Weekdays 10 AM to 7 PM while classes are in session.',
    },
    programs: [
      {
        name: 'XC475, the Technology Innovation course',
        text: 'Takes your project from an idea to a working prototype in one semester, with Spark! experts and industry mentors. No idea yet? You can join someone else’s team.',
        when: 'Fall and spring. Application and interview.',
        href: 'https://www.bu.edu/spark/students/xc475/',
      },
      {
        name: 'Tech Innovation Hours',
        text: 'Student teams build alongside mentors from software engineering and UX, who help with architecture, design and reviewing progress.',
        when: 'Wednesdays, 4 to 6 PM.',
        href: 'https://www.bu.edu/spark/students/innovation/',
      },
      {
        name: 'Code & Tell',
        text: 'An open-mic night for student builders: demo what you’re working on, finished or not, and get feedback from the room.',
        when: 'Monthly, 6 PM. Tickets on Eventbrite.',
        href: 'https://www.bu.edu/spark/code-tell/',
      },
      {
        name: 'DS+X and CivicHacks',
        text: 'Spark!’s two hackathons. DS+X is for BU students of every major and level, beginners welcome. CivicHacks is open nationwide, with challenges set by civic partners.',
        when: 'DS+X in the fall, CivicHacks in the spring.',
        href: 'https://www.bu.edu/spark/events/bu-spark-hackathons/',
      },
      {
        name: 'X-Lab',
        text: 'Practicum courses in software engineering, machine learning, data science and UX, where student teams work on real problems for outside partners.',
        when: 'Fall and spring, as courses.',
        href: 'https://www.bu.edu/spark/students/courses/',
      },
      {
        name: 'Ignite student clubs',
        text: 'Spark! runs the council behind BU’s tech clubs, BostonHacks and Hack4Impact among them. It also funds students and informal groups with an idea for BU’s computing community.',
        href: 'https://www.bu.edu/spark/students/ignite/',
      },
    ],
    site: { label: 'bu.edu/spark', href: 'https://www.bu.edu/spark/' },
  },
  {
    id: 'innovate',
    name: 'Innovate@BU',
    hue: 'rose',
    part: 'BU’s home for innovation and entrepreneurship, open to every student in every major',
    text: 'For when a project could become a startup, a nonprofit or a community venture. It has funding, mentors, competitions and free events, and staff and student ambassadors you can drop in on.',
    fit: 'Best for the Launch track: a project that’s turning into something more.',
    place: {
      where: 'The IDG Capital Student Innovation Center, 730 Commonwealth Ave., across from Marsh Chapel.',
      hours: 'Fall hours: weekdays 8 AM to 8 PM, Sundays 11 AM to 8 PM.',
    },
    programs: [
      {
        name: 'Office hours',
        text: 'One-to-one time with staff or experts in residence, plus drop-in hours with student ambassadors. The easiest first step.',
        when: 'Book any time, or drop in.',
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
        when: 'Rolling. Apply any time.',
        href: 'https://www.bu.edu/innovate/programs-competitions/innovation-pathway/',
      },
      {
        name: 'New Venture Competition',
        text: 'An $85K pitch competition with coaching on your idea and your pitch. Two tracks, general and social impact, each with a $20,000 first prize.',
        when: 'Applications open in the fall.',
        href: 'https://www.bu.edu/innovate/programs-competitions/new-venture-competition/',
      },
      {
        name: 'Summer Accelerator',
        text: 'Ten weeks working on your venture full-time, with a stipend of up to $10,000, mentors, and a final presentation to a panel of investors.',
        when: 'Summer. Applications for 2027 aren’t open yet.',
        href: 'https://www.bu.edu/innovate/programs-competitions/summer-accelerator/',
      },
      {
        name: 'Innovation & Entrepreneurship minor',
        text: 'Open to every undergraduate. Spark!’s XC475 counts toward it.',
        href: 'https://www.bu.edu/innovate/academics/innovation-entrepreneurship-minor/',
      },
    ],
    site: { label: 'bu.edu/innovate', href: 'https://www.bu.edu/innovate/' },
  },
]

/** Copy around the org cards. */
export const ORG_COPY = {
  where: 'Where',
  programs: 'Start with',
  visit: 'Everything else on',
} as const

/** How the three fit together, said as one path, with the Proto win that walked part of it. */
export const PATH = {
  title: 'How it fits together',
  steps: [
    { name: 'Proto', text: 'Start it at a hack night or a hackathon, with a team.', hue: 'sky' },
    { name: 'Spark!', text: 'Build it properly, with mentors, then show it at Code & Tell.', hue: 'iris' },
    { name: 'Innovate@BU', text: 'If people want it, pitch it, fund it and launch it.', hue: 'rose' },
  ] satisfies { name: string; text: string; hue: Hue }[],
  example: {
    lead: 'Sapling, one of our wins, won its track at CivicHacks 2026 and was demoed at Code & Tell that March.',
    win: { label: 'See Sapling', href: winHref(SAPLING) } satisfies Link,
  },
} as const
