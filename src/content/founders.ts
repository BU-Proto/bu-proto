// Founders Circle: a small group inside Proto, by application, for founders already building
// something real. Everything else at Proto stays open to everyone; this is the one part people
// apply to and earn. The page says as little as it can: the numbers, what members get, a few of
// our startups and the form. "Founders Circle" is a working name: change it here and it changes
// everywhere.

import type { PageIntro, Sampleable } from './types'

export const CIRCLE_NAME = 'Founders Circle'

export const FOUNDERS_INTRO: PageIntro = {
  path: '~/proto/founders',
  title: CIRCLE_NAME,
  lede: 'A small group inside Proto for founders who are already building.',
}

export const FOUNDERS_HEAD = {
  badge: 'By application',
  apply: 'Apply',
} as const

/** The numbers, counted live from every real win posted on the site. */
export const FOUNDERS_NUMBERS = {
  title: 'The record',
  wins: 'wins',
  events: 'events',
  builders: 'builders',
  startups: 'startups',
  since: (year: string) => `Since ${year}.`,
  link: { label: 'See every win', href: '/wins' },
} as const

export interface CirclePerk extends Sampleable {
  title: string
  text: string
}

/** What members get, a line each. Nothing here is booked yet, so each is marked as a plan. */
export const FOUNDERS_GET: { title: string; items: readonly CirclePerk[] } = {
  title: 'What members get',
  items: [
    { title: 'First call on the network', text: 'Introductions to founders, investors and operators.', placeholder: true },
    { title: 'Opportunities first', text: 'Sponsor introductions, pitch slots and demo night spots.', placeholder: true },
    { title: 'Closed events', text: 'Small dinners and firesides for members.', placeholder: true },
    { title: 'A serious room', text: 'A few founders working as hard as you are.', placeholder: true },
  ],
}

/**
 * Our startups: projects from the wins that their teams are taking further. Listed by the win's
 * project name, exactly as it's spelled on the win, so each picks up its picture, prize and page
 * from the live list. A name with no published win is skipped. Only list a project its team calls
 * a startup.
 */
export const FOUNDERS_STARTUPS = {
  title: 'Our startups',
  projects: ['Flowcast', 'PIXX-AR', 'Eyrie', 'noogie'],
} as const

export const FOUNDERS_FORM = {
  title: 'Apply',
  /** Who it's for and what happens next, a line each. */
  lines: [
    'For founders past the idea stage, putting real time in every week.',
    "If it looks like a fit, we'll set up a short call.",
  ],
  open: { text: 'Everything else at Proto stays open to everyone.', link: { label: "See what's on", href: '/events' } },
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
