// Founders Circle: a small, invite-only group inside Proto for founders already building something
// real. Everything else at Proto stays open to everyone; this is the one part with an application
// and a call. "Founders Circle" is a working name: change it here and it changes everywhere.

import type { Tone } from './home'
import type { PageIntro, Sampleable } from './types'

export const CIRCLE_NAME = 'Founders Circle'

export const FOUNDERS_INTRO: PageIntro = {
  path: '~/proto/founders',
  title: CIRCLE_NAME,
  lede: "A small, invite-only group inside Proto for founders who are already building something real. Members meet at closed events, get to know each other well and help each other through the hard parts.",
}

export const FOUNDERS_HEAD = {
  badge: 'Invite only',
  apply: 'Apply to join',
  how: 'How it works',
} as const

export const FOUNDERS_FOR: { title: string; lede: string; items: readonly { text: string; tone: Tone }[] } = {
  title: "Who it's for",
  lede: 'Any school or none, any field, any background. What we look at is the work.',
  items: [
    { text: "You're working on a company or project right now, and it's past the idea stage.", tone: 'amber' },
    { text: 'Something exists: a product people use, customers, revenue, a pilot or a working prototype.', tone: 'rose' },
    { text: "You're putting real time into it, full time or alongside school or a job.", tone: 'iris' },
    { text: "You'll show up for other founders the way you'd want them to show up for you.", tone: 'mint' },
  ],
}

export interface CirclePerk extends Sampleable {
  title: string
  text: string
}

/** What members get. Nothing here is booked yet, so each is marked as a plan. */
export const FOUNDERS_GET: { title: string; note: string; items: readonly CirclePerk[] } = {
  title: 'What members get',
  note: "The Circle is new. These are the plans for its first semester, and members will help shape them.",
  items: [
    {
      title: 'Invite-only dinners',
      text: 'A small table of members and one guest, often a founder or investor a few years ahead of you.',
      placeholder: true,
    },
    {
      title: 'Closed firesides',
      text: 'Firesides for members only, where guests can talk about what actually happened, mistakes included.',
      placeholder: true,
    },
    {
      title: 'Office hours',
      text: 'Time with people who have done it, on the problem in front of you this week.',
      placeholder: true,
    },
    {
      title: 'Introductions',
      text: "Warm introductions to customers, hires and investors when you're ready, from Proto and from other members.",
      placeholder: true,
    },
  ],
}

export const FOUNDERS_STEPS: { title: string; items: readonly { title: string; text: string }[] } = {
  title: 'How to get in',
  items: [
    { title: 'Apply', text: "A short form about what you're building, how far along it is and what would help." },
    { title: 'A short call', text: "If it looks like a fit, we'll set up a call to hear more about it and answer your questions." },
    { title: 'A decision', text: "After the call we'll tell you either way. If it's not the right time, you can apply again later." },
    { title: 'Your first invite', text: 'Members get an email invite to every Circle event.' },
  ],
}

/** Said plainly, so nobody reads the Circle as a gate on the rest of Proto. */
export const FOUNDERS_OPEN = {
  text: "Everything else at Proto stays open to everyone. You don't need to be in the Circle to come to build nights, firesides or demo night.",
  link: { label: "See what's on", href: '/events' },
} as const

export const FOUNDERS_FORM = {
  title: 'Apply',
  lede: 'We read every application. Tell us about the work as it is today; a rough start is fine.',
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

/** The home page's pointer to the Circle, after the groups. */
export const FOUNDERS_TEASER = {
  badge: 'Invite only',
  title: CIRCLE_NAME,
  text: "For founders already building something real: a small group that meets at invite-only events. Apply, and if it looks like a fit, we'll talk.",
  points: ['Closed dinners and firesides', 'Office hours with people who have done it', 'Warm introductions when you are ready'],
  cta: { label: 'Apply to join', href: '/founders#apply' },
  more: { label: 'How it works', href: '/founders' },
} as const

/** What an invite-only event says where the RSVP would be. */
export const INVITE_ONLY = {
  tag: 'Invite only',
  text: `For ${CIRCLE_NAME} members and their guests. Members get an invite by email.`,
  link: { label: `About the ${CIRCLE_NAME}`, href: '/founders' },
} as const
