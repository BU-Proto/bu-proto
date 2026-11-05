// The Proto fund: hackathon travel grants. It isn't funded yet: this page explains the plan and
// collects interest. Nothing here may read as an open application, or as money that exists.

import type { Link, PageIntro } from './types'

export const GRANTS_INTRO: PageIntro = {
  path: '~/proto/grants',
  title: 'Microgrants for getting to hackathons',
  lede: 'Small, fast travel grants, so the cost of getting there is never the reason you skip a hackathon.',
}

/** Said once, at the top, before anything else: there is no money yet. */
export const STATUS = {
  word: 'Coming soon.',
  text: 'The fund isn’t funded yet, so nobody can apply. For now there’s an interest list.',
  link: 'Add your name',
} as const

export interface Gloss {
  /** One piece of the sentence, set large. */
  words: string
  /** The detail behind it, set small beside it. */
  note: string
}

/** The whole plan as one sentence, read down the page, with the small print beside each part. */
export const PLAN = {
  title: 'The plan',
  sentence: [
    { words: '$50 to $500', note: 'The planned size of one grant. A plan, not a promise: the amounts firm up once we’re funded.' },
    { words: 'to get you', note: 'Any BU student, from your first hackathon onward.' },
    {
      words: 'to a hackathon,',
      note: 'Travel only, for now: a bus or train, gas for a carpool, a ride, or a flight. Other costs may come later, but that isn’t promised.',
    },
    { words: 'paid before you go.', note: 'Planned to pay up front, so you aren’t left out of pocket waiting on a refund.' },
  ] satisfies Gloss[],
} as const

export interface Step {
  title: string
  text: string
}

export const STEPS = {
  title: 'How it’ll work',
  lede: 'Quick enough that you can still book in time.',
  items: [
    { title: 'Ask', text: 'Which hackathon, how you’d get there, and roughly what it costs. A few lines, not an essay.' },
    { title: 'Hear back fast', text: 'A quick yes or no, while there’s still time to book.' },
    { title: 'Get there', text: 'Book the bus, the train, the gas or the flight, and go build.' },
    // The one thing asked back, so it's the step the page lands on.
    { title: 'Demo what you built', text: 'The one thing we ask back, at a hack night or demo night. It doesn’t have to win, or work.' },
  ] satisfies Step[],
} as const

export interface Contrast {
  ignite: string
  proto: string
}

/** Ignite against the plan, as pairs: what Ignite does, then what this is planned to do instead. */
export const IGNITE = {
  title: 'Next to Spark!’s Ignite',
  link: {
    label: 'Spark!’s Ignite Travel Fund',
    href: 'https://www.bu.edu/spark/resources/travel-fund/',
  } satisfies Link,
  intro: 'pays for hackathon travel too, and you should use it. This is planned to cover what it doesn’t.',
  pairs: [
    { ignite: 'Ignite reimburses you after the event.', proto: 'Paid up front, before you go.' },
    { ignite: 'Ignite covers one event a year.', proto: 'Not capped at one trip a year.' },
  ] satisfies Contrast[],
} as const

/**
 * The interest list, written as the ask itself: the trip you'd take is one sentence with blanks,
 * the contact details sit under it. `before`, `by`, `for` and `after` are the sentence's words
 * around the three blanks.
 */
export const INTEREST = {
  title: 'Tell us you’d use it',
  lede: 'This isn’t an application. Leave your details and we’ll email you when there’s news. The list also shows sponsors there’s real demand.',
  sentence: { before: 'If it were open, I’d use it to get to', by: 'by', for: 'for roughly', after: '.' },
  // Page copy for the schema's `target`, `spend` and `amount` fields.
  fields: {
    target: { label: 'Which hackathon', placeholder: 'HackMIT' },
    spend: { label: 'How you’d get there', placeholder: 'train from South Station' },
    amount: { label: 'Rough amount', placeholder: 'a range' },
  },
  submit: 'Add me to the list',
  privacy: 'We use your answers only for the fund, and show sponsors totals, never names.',
  thanks: {
    title: 'You’re on the list',
    text: 'We’ll email you when there’s news about the fund.',
  },
} as const
