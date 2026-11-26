// The Proto fund: small grants for building a first version. It isn't funded yet: this page
// explains the plan and collects interest. Nothing here may read as an open application, or as
// money that exists.

import type { PageIntro } from './types'

export const GRANTS_INTRO: PageIntro = {
  path: '~/proto/grants',
  title: 'Microgrants for a first version',
  lede: 'Small, fast grants for what it costs to build the first version of something: parts, software credits, or a ticket to a hackathon or a pitch competition.',
}

/** Said once, at the top, before anything else: there is no money yet. */
export const STATUS = {
  word: 'Coming soon.',
  text: "The fund isn't funded yet, so nobody can apply. For now there's an interest list.",
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
  from: 'An idea',
  to: 'A first version',
  headline: '$50 to $500 toward building it, paid before you spend it.',
  caveat: { lead: 'A plan, not a promise.', text: 'The amounts and what they cover firm up once the fund is funded.' },
  facts: [
    {
      title: 'What it would cover',
      text: 'Parts and materials, software credits, or the ticket and travel for a hackathon or a pitch competition.',
    },
    { title: 'Any Proto member', text: 'At any school or none, on any kind of project, from your very first one.' },
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
  title: "How it'll work",
  lede: 'Four stops, quick enough that the money arrives while you still need it.',
  stops: [
    {
      title: 'Ask',
      text: "What you're building, what you need and roughly what it costs. A few lines, not an essay.",
    },
    {
      title: 'Hear back fast',
      text: "A yes or no while there's still time to use it.",
    },
    {
      title: 'Build it',
      text: 'Buy the parts, the credits or the ticket, and get to work.',
    },
    {
      title: 'Show what you made',
      text: "The one thing we ask back, at build night or demo night. It doesn't have to win, or work.",
    },
  ] satisfies Stop[],
} as const

/** The interest list. Page copy for the schema's fields: what you'd build first, then who you are. */
export const INTEREST = {
  title: "Tell us you'd use it",
  lede: "This isn't an application, and it's open to anyone. Leave your details and we'll email you when there's news. The list also shows sponsors there's real demand.",
  fields: {
    target: { label: "What you're building", placeholder: 'A booking app for barbershops' },
    spend: {
      label: "What you'd spend it on",
      placeholder: 'Parts, credits or a ticket',
    },
    amount: { label: 'Rough amount', placeholder: 'Pick a range' },
    name: { label: 'Name' },
    email: { label: 'Email', placeholder: 'you@example.com' },
    year: { label: 'Year', placeholder: 'Pick one' },
  },
  submit: 'Add me to the list',
  privacy: 'We use your answers only for the fund, and show sponsors totals, never names.',
  thanks: {
    title: "You're on the list",
    text: "We'll email you when there's news about the fund.",
  },
} as const
