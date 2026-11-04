// The Proto fund. It isn't funded yet: this page explains the plan and collects interest.
// Nothing here may read as an open application.

import type { Link, PageIntro } from './types'

export const GRANTS_INTRO: PageIntro = {
  path: '~/proto/grants',
  title: 'Microgrants for making things',
  lede: 'Small, fast grants so money is never the reason you skip a hackathon. We’re still finding the funding, so nobody can apply yet. Tell us you’d use it and you’ll help us get there.',
}

export const STATUS = {
  badge: 'Coming soon',
  note: 'Not funded yet. No applications open.',
} as const

export const SECTION_TITLES = {
  covers: 'What it’ll cover',
  how: 'How it’ll work',
} as const

export type CoverIconName = 'travel' | 'registration' | 'credits' | 'hardware'

export interface Cover {
  icon: CoverIconName
  title: string
  text: string
}

export const COVERS: readonly Cover[] = [
  { icon: 'travel', title: 'Travel', text: 'Bus, train or gas money to get you to the event.' },
  { icon: 'registration', title: 'Registration', text: 'Entry fees for hackathons that charge one.' },
  { icon: 'credits', title: 'API credits', text: 'Model, cloud or API usage for what you’re building.' },
  { icon: 'hardware', title: 'Hardware', text: 'Boards, sensors and parts for a hardware hack.' },
]

export const AMOUNTS = {
  min: 50,
  max: 500,
  label: 'Planned range',
  note: 'Amounts are a plan, not a promise. They’ll firm up once we’re funded.',
} as const

export interface Step {
  title: string
  text: string
}

export const STEPS: readonly Step[] = [
  { title: 'Ask', text: 'A short form: what you’re going to, what it costs, roughly how much.' },
  { title: 'Get approved fast', text: 'A quick yes or no, so you can still make the deadline.' },
  { title: 'Go build', text: 'Spend it on the trip, the entry, the credits or the parts.' },
  { title: 'Demo it after', text: 'Show what you made at hack night or demo night.' },
]

export const THE_ASK = {
  title: 'The one ask',
  quote: 'Demo what you built.',
  text: 'That’s it. It doesn’t have to win and it doesn’t have to work. Show the room what you made.',
} as const

export const COMPARISON = {
  title: 'How it differs from the Ignite Travel Fund',
  lede: 'Spark!’s Ignite Travel Fund is great and you should use it too. The Proto fund is built to fill the gaps around it.',
  columns: { ignite: 'Ignite Travel Fund', proto: 'Proto fund' },
  source: {
    label: 'Spark! Ignite Travel Fund',
    href: 'https://www.bu.edu/spark/resources/travel-fund',
  } satisfies Link,
  rows: [
    { label: 'When you get the money', ignite: 'Reimbursed after the event', proto: 'Up front, before you go' },
    { label: 'How often', ignite: 'One event per year', proto: 'Not capped at one event a year' },
    { label: 'Who it suits', ignite: 'Tends to favor advanced hackers', proto: 'First hackathon onward' },
  ],
} as const

export const INTEREST = {
  title: 'I’d use this',
  submit: 'Add me to the list',
  lede: 'Not an application. Leave your details and we’ll email you when the fund opens. The list also shows sponsors there’s real demand.',
  thanks: {
    title: 'Thanks, you’re on the list',
    text: 'We’ll let you know when the fund opens.',
  },
} as const
