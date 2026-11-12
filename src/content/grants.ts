// The Proto fund: hackathon travel grants. It isn't funded yet: this page explains the plan and
// collects interest. Nothing here may read as an open application, or as money that exists.

import type { PageIntro } from './types'

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

export interface Fact {
  title: string
  text: string
}

/**
 * The plan, printed as a ticket: where from and where to, the plan in one line, the two things
 * people ask first, and on the stub the caveat that it's still only a plan.
 */
export const PLAN = {
  title: 'The plan',
  from: 'Boston',
  to: 'Your hackathon',
  headline: '$50 to $500 toward getting there, paid before you go.',
  caveat: { lead: 'A plan, not a promise.', text: 'The amounts firm up once the fund is funded.' },
  facts: [
    {
      title: 'Travel only, for now',
      text: 'A bus or train, gas for a carpool, a ride, or a flight. Other costs may come later, but that isn’t promised.',
    },
    { title: 'Any BU student', text: 'From your very first hackathon onward.' },
  ] satisfies Fact[],
} as const

export interface Stop {
  title: string
  text: string
}

/**
 * The four stops on the way, in order. The last is the one thing asked back.
 */
export const ROUTE = {
  title: 'How it’ll work',
  lede: 'Four stops, quick enough that you can still book in time.',
  stops: [
    {
      title: 'Ask',
      text: 'Which hackathon, how you’d get there, and roughly what it costs. A few lines, not an essay.',
    },
    {
      title: 'Hear back fast',
      text: 'A yes or no while there’s still time to book.',
    },
    {
      title: 'Get there',
      text: 'Book the bus, the train, the gas or the flight, and go build.',
    },
    {
      title: 'Demo what you built',
      text: 'The one thing we ask back, at a hack night or demo night. It doesn’t have to win, or work.',
    },
  ] satisfies Stop[],
} as const

/** The interest list. Page copy for the schema's fields, trip first, then who you are. */
export const INTEREST = {
  title: 'Tell us you’d use it',
  lede: 'This isn’t an application. Leave your details and we’ll email you when there’s news. The list also shows sponsors there’s real demand.',
  fields: {
    target: { label: 'Which hackathon', placeholder: 'HackMIT' },
    spend: {
      label: 'How you’d get there',
      placeholder: 'Train from South Station',
    },
    amount: { label: 'Rough amount', placeholder: 'Pick a range' },
    name: { label: 'Name' },
    email: { label: 'BU email', placeholder: 'you@bu.edu' },
    year: { label: 'Year', placeholder: 'Pick one' },
  },
  submit: 'Add me to the list',
  privacy: 'We use your answers only for the fund, and show sponsors totals, never names.',
  thanks: {
    title: 'You’re on the list',
    text: 'We’ll email you when there’s news about the fund.',
  },
} as const
