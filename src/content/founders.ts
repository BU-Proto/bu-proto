// Founders Circle: a small group inside Proto, by application, for founders already building
// something real. Everything else at Proto stays open to everyone; this is the one part people
// apply to and earn. It's said quietly on purpose: no hype, the record does the talking.
// "Founders Circle" is a working name: change it here and it changes everywhere.

import type { PageIntro, Sampleable } from './types'

export const CIRCLE_NAME = 'Founders Circle'

export const FOUNDERS_INTRO: PageIntro = {
  path: '~/proto/founders',
  title: CIRCLE_NAME,
  lede: "A small group inside Proto for founders who are already building. It's by application and stays small on purpose, so members get the most from Proto's network.",
}

export const FOUNDERS_HEAD = {
  badge: 'By application',
  apply: 'Apply',
  how: 'How it works',
} as const

export const FOUNDERS_FOR: { title: string; lede: string; items: readonly string[] } = {
  title: 'Who gets in',
  lede: 'A place is earned by the work and kept by showing up. Any school or none, any field.',
  items: [
    "You're building a company or project now, and it's past the idea stage.",
    'Something exists that people can see: a product, users, customers, revenue, a pilot or a prototype.',
    'It gets real time from you every week, full time or alongside school or a job.',
    "You'll put as much into the group as you take from it.",
  ],
}

export interface CirclePerk extends Sampleable {
  title: string
  text: string
}

/** What members get. Nothing here is booked yet, so each is marked as a plan. */
export const FOUNDERS_GET: { title: string; note: string; items: readonly CirclePerk[] } = {
  title: 'What members get',
  note: 'The Circle is starting now. These are the plans for its first semester.',
  items: [
    {
      title: 'First call on the network',
      text: "Introductions to the founders, investors and operators Proto knows, when you're ready for them.",
      placeholder: true,
    },
    {
      title: 'Opportunities first',
      text: "Sponsor introductions, pitch slots and demo night spots go to members before they're shared wider.",
      placeholder: true,
    },
    {
      title: 'Small, closed events',
      text: 'Dinners and firesides for members and a guest, where people talk about what actually happened.',
      placeholder: true,
    },
    {
      title: 'Each other',
      text: "A handful of people working as hard as you are, who'll read your deck and answer a late message.",
      placeholder: true,
    },
  ],
}

/**
 * The record: every real win posted on the site, read live, so it's always the whole list. The
 * line over it is counted from the same wins.
 */
export const FOUNDERS_RECORD = {
  title: 'The record',
  lede: (since: string) =>
    `Proto's builders have been winning hackathons since ${since}. This is every win posted so far, and it updates as new ones go up.`,
  wins: (count: number) => (count === 1 ? 'win' : 'wins'),
  events: (count: number) => (count === 1 ? 'event' : 'events'),
  builders: (count: number) => (count === 1 ? 'builder' : 'builders'),
  link: { label: 'See every win', href: '/wins' },
  empty: 'Wins go up here as members post them.',
} as const

/**
 * Our startups: projects from the wins above that their teams are taking further. Listed by the
 * win's project name, exactly as it's spelled on the win, so each picks up its prize, event and
 * page from the live list. A name with no published win is skipped. Only list a project its team
 * calls a startup.
 */
export const FOUNDERS_STARTUPS = {
  title: 'Our startups',
  lede: 'Each started as a hackathon project, and each team has a plan for what comes next.',
  projects: ['Flowcast', 'PIXX-AR', 'Eyrie', 'noogie'],
  more: 'Read more',
} as const

export const FOUNDERS_STEPS: { title: string; items: readonly { title: string; text: string }[] } = {
  title: 'How to get in',
  items: [
    { title: 'Apply', text: "A short form about what you're building, how far along it is and what would help." },
    { title: 'A call', text: "If it looks like a fit, we'll set up a call to hear more and answer your questions." },
    { title: 'A decision', text: "After the call we'll tell you either way. If it's not the right time, you can apply again later." },
    { title: "You're in", text: 'Members get an email invite to every Circle event.' },
  ],
}

/** Said plainly, so nobody reads the Circle as a gate on the rest of Proto. */
export const FOUNDERS_OPEN = {
  text: "Everything else at Proto stays open to everyone. You don't need to be in the Circle to come to build nights, firesides or demo night.",
  link: { label: "See what's on", href: '/events' },
} as const

export const FOUNDERS_FORM = {
  title: 'Apply',
  lede: 'Tell us about the work as it is today. We read every application.',
  submit: 'Send my application',
  thanks: {
    title: 'Got it, thank you',
    text: "We read every application. If we'd like to talk, we'll email you to set up a call.",
  },
  privacy: 'Your application is read by the students who run Proto. We use your email to reply and to invite you, nothing else.',
  fields: {
    name: { label: 'Your name' },
    email: { label: 'Email', placeholder: 'you@example.com' },
    school: { label: 'School', hint: 'Leave it blank if you are not at one.' },
    company: { label: 'Company or project name' },
    link: { label: 'A link', hint: 'Optional. The product, a demo, a deck or anything that shows the work.', placeholder: 'example.com' },
    stage: { label: 'How far along is it?', placeholder: 'Pick one' },
    commitment: { label: 'How much of your time does it get?', placeholder: 'Pick one' },
    building: { label: 'What are you building, and for whom?' },
    progress: { label: 'What have you done on it in the last three months?', hint: 'Users, customers, launches, money, things you tried that did not work.' },
    team: { label: "Who's on the team?", hint: 'Optional. Names and what each person does.' },
    help: { label: 'What would help most right now?', hint: 'Optional.' },
  },
} as const

/** The home page's quiet pointer to the Circle, after the groups. */
export const FOUNDERS_TEASER = {
  badge: 'By application',
  title: CIRCLE_NAME,
  text: "A small group inside Proto for founders who are already building, with first call on Proto's network.",
  link: { label: 'How to apply', href: '/founders' },
} as const

/** What an invite-only event says where the RSVP would be. */
export const INVITE_ONLY = {
  tag: 'Invite only',
  text: `For ${CIRCLE_NAME} members and their guests. Members get an invite by email.`,
  link: { label: `About the ${CIRCLE_NAME}`, href: '/founders' },
} as const
