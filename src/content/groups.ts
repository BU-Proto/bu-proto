// The groups' own pages, /cs and /business. Proto is one community; a group runs nights of its
// own, and everyone else is welcome at them. Which event kinds are a group's is KIND_GROUP in
// events.ts; each page lists its group's next nights from the calendar.

import type { EventKind } from '../../shared/constants'
import type { GroupTile, Tone } from './home'
import type { Link } from './types'

export type GroupSlug = 'cs' | 'business'

export interface GroupActivity {
  name: string
  text: string
  link?: Link
}

export interface GroupPageContent {
  slug: GroupSlug
  /** The group's name, as KIND_GROUP and the "everyone welcome" line say it. */
  name: string
  tone: Tone
  picture: GroupTile['picture']
  /** The browser tab's title. */
  tab: string
  title: string
  lede: string
  /** Said under the lede when the group is just starting. */
  note?: string
  activities: readonly GroupActivity[]
  /** The kinds of event that are this group's own nights. */
  kinds: readonly EventKind[]
  empty: string
  help: string
}

export const GROUP_PAGE = {
  label: 'Group',
  runs: 'What it runs',
  next: 'Coming up',
  allEvents: 'All events',
  welcome: 'Everyone is welcome at every group night, whatever you study.',
} as const

export const GROUPS: Record<GroupSlug, GroupPageContent> = {
  cs: {
    slug: 'cs',
    name: 'CS',
    tone: 'iris',
    picture: 'prompt',
    tab: 'The CS group',
    title: 'The CS group',
    lede: 'For anyone who builds with code, from first-timers to hackathon regulars. CS nights are open to everyone, whatever you study.',
    activities: [
      { name: 'Hack nights', text: 'A night to build with code: bring a project, or find one and a team.' },
      {
        name: 'Hackathon trips',
        text: 'We go to hackathons together, with team matching and a veteran for your first one.',
        link: { label: 'Upcoming hackathons', href: '/hackathons' },
      },
      { name: 'Prep nights', text: 'The week before a big hackathon: ideas, teams and pitch practice.' },
      { name: 'The playbook', text: 'Our guides to hackathons, start to finish.', link: { label: 'Read the playbook', href: '/resources/playbook' } },
      { name: 'Wins', text: 'What CS teams built and took home.', link: { label: 'See the wins', href: '/wins?group=cs' } },
      { name: 'Grants', text: "Microgrants for a first version. Coming soon: they aren't funded yet.", link: { label: 'About the fund', href: '/grants' } },
    ],
    kinds: ['Hack night', 'Why hackathons', 'Prep night'],
    empty: "No CS nights on the calendar yet. Join Proto and we'll email you before the first one.",
    help: 'Want to help run CS nights? Write to us.',
  },
  business: {
    slug: 'business',
    name: 'Business',
    tone: 'amber',
    picture: 'steps',
    tab: 'The Business group',
    title: 'The Business group',
    lede: 'For the company side of building: finding customers, pricing, pitching and raising money. Business nights are open to everyone, and engineers and CS people are welcome.',
    note: "The Business group is new. Its first nights are being planned now.",
    activities: [
      { name: 'Pitch nights', text: 'Practise your pitch in front of people who build, and get honest notes back.' },
      { name: 'Customer nights', text: "Work out who you're building for and how to reach them, together." },
      {
        name: 'Pitch competitions',
        text: 'We go to pitch competitions together, the way the CS group goes to hackathons.',
        link: { label: 'Pitch competitions', href: '/pitch-competitions' },
      },
      { name: 'Find a builder', text: 'Meet the engineers and CS people who can build your idea, at build night and CS nights.' },
      { name: 'The playbook', text: 'Short guides to pitching, finding customers, finding a co-founder and early fundraising.', link: { label: 'Read the playbook', href: '/business/playbook' } },
      { name: 'Wins', text: 'Pitch competition wins, launches, first customers and money raised.', link: { label: 'See the wins', href: '/wins?group=business' } },
    ],
    kinds: ['Pitch night'],
    empty: "No Business nights on the calendar yet. Join Proto and we'll email you before the first one.",
    help: 'Want to help start the Business group? Write to us.',
  },
}
