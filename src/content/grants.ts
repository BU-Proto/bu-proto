// The Proto fund: hackathon travel grants. It isn't funded yet: this page explains the plan and
// collects interest. Nothing here may read as an open application, or as money that exists.

import type { Link, PageIntro } from './types'

export const GRANTS_INTRO: PageIntro = {
  path: '~/proto/grants',
  title: 'Microgrants for getting to hackathons',
  lede: 'Small, fast travel grants so the cost of getting there is never the reason you skip a hackathon.',
}

/** Said once, at the top, and nowhere else on the page. */
export const STATUS = {
  word: 'Coming soon.',
  text: 'The fund isn’t funded yet, so nobody can apply.',
  link: 'Tell us you’d use it',
} as const

export const RANGE = {
  min: 50,
  max: 500,
  lede: 'The planned size of one grant, for whatever it takes to get you to the event.',
  note: 'A plan, not a promise. The amounts firm up once we’re funded.',
} as const

export const TRAVEL = {
  title: 'Getting you there',
  items: [
    { title: 'Bus and train', text: 'Tickets to the city the hackathon is in.' },
    { title: 'Gas and rides', text: 'Fuel for a carpool, or a ride to the venue.' },
    { title: 'Flights', text: 'Where the event is too far to get to any other way.' },
  ],
  note: 'Travel only, for now. Other costs may come later, but that isn’t promised.',
} as const

export const AUDIENCE = {
  title: 'For any BU student',
  lede: 'From your first hackathon onward. Spark!’s Ignite Travel Fund pays for hackathon travel too, and you should use it. This is planned to work differently: money before you go, and more than one trip a year.',
  columns: { ignite: 'Ignite Travel Fund', proto: 'Proto fund, planned' },
  rows: [
    { label: 'When you get the money', ignite: 'Reimbursed after the event', proto: 'Paid up front, before you go' },
    { label: 'How often', ignite: 'One event a year', proto: 'Not capped at one a year' },
    { label: 'Who it suits', ignite: 'Tends to favor advanced hackers', proto: 'First hackathon onward' },
  ],
  source: {
    label: 'About the Ignite Travel Fund',
    href: 'https://www.bu.edu/spark/resources/travel-fund',
  } satisfies Link,
} as const

export interface Step {
  title: string
  text: string
}

export const STEPS = {
  title: 'How it’ll work',
  lede: 'Quick enough that you can still book in time.',
  items: [
    { title: 'Ask', text: 'A short form: which hackathon, how you’d get there, roughly what it costs.' },
    { title: 'Hear back fast', text: 'A quick yes or no, while there’s still time to book.' },
    { title: 'Get there', text: 'Book the bus, the train, the gas or the flight, and go build.' },
    {
      title: 'Demo what you built',
      text: 'The one thing we ask back, at hack night or demo night. It doesn’t have to win, or work.',
    },
  ] satisfies Step[],
} as const

export const INTEREST = {
  title: 'Tell us you’d use it',
  lede: 'This isn’t an application. Leave your details and we’ll email you when the fund opens. The list also shows sponsors there’s real demand.',
  submit: 'Add me to the list',
  privacy: 'We use your answers only for the fund, and show sponsors totals, never names.',
  // Page copy for the schema's `target` and `spend` fields.
  fields: {
    target: { label: 'Which hackathon', placeholder: 'e.g. TreeHacks, or HackMIT' },
    spend: { label: 'How you’d get there', placeholder: 'Bus from South Station, gas for a carpool, a flight…' },
  },
  thanks: {
    title: 'Thanks, you’re on the list',
    text: 'We’ll email you when the fund opens.',
  },
} as const
