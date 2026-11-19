// Copy for /roles and each role's own page. The roles themselves live in D1 and are posted in the
// portal at /admin/roles; applications land at /admin/roles/applications.

import { CONTACT_EMAIL } from './legal'
import type { PageIntro } from './types'

export const ROLES_INTRO: PageIntro = {
  path: '~/proto/roles',
  title: 'Founding board',
  lede: 'Proto is picking its first board. Each seat is one you’d build from zero, with your name on it and a real thing to point to when you’re done.',
}

export const ROLES_LIST = {
  /** "4 founding seats open" */
  title: (count: number) => `${count} founding ${count === 1 ? 'seat' : 'seats'} open`,
  /** The line each role ends on, set on a dashed rule like a blank on a sign-up sheet. */
  cta: 'Put your name down',
  /** Said of a role with no apply-by day of its own. */
  untilFilled: 'First board picked Dec 5',
} as const

export const ROLES_EMPTY = {
  title: 'Every role is taken for now',
  text: 'Nothing’s open at the moment. Join the list and you’ll hear when something is, or come to a hack night and tell us what you’d like to run.',
  join: { label: 'Join Proto', href: '/join' },
  events: { label: 'See what’s on', href: '/events' },
} as const

/** Under the list: for the thing that isn't on it, and who's on the board already. */
export const ROLES_ELSE = {
  title: 'Don’t see yours?',
  text: 'If there’s something you’d run that isn’t here, tell us what it is.',
  email: CONTACT_EMAIL,
  board: { lead: 'Who’s running Proto now is on', label: 'the board page', href: '/board' },
} as const

export const ROLE_PAGE = {
  back: 'Founding board',
  /** `timeline` stands in for `applyBy` when a role has no apply-by day. */
  facts: { team: 'Team', commitment: 'Time it takes', applyBy: 'Apply by', timeline: 'Timeline' },
  apply: 'Put your name down',
  others: 'Also open',
  closed: {
    title: 'Applications for this one have closed',
    text: (day: string) => `They closed on ${day}. The roles that are open now are on the list.`,
    back: 'See open roles',
  },
  /** Said in place of `closed` once someone has taken the role. */
  filled: {
    fact: 'Filled',
    title: 'This one’s been filled',
    text: 'Someone has taken it, so it isn’t taking applications. The roles that are open now are on the list.',
    back: 'See open roles',
  },
} as const

export const ROLE_FORM = {
  id: 'apply',
  title: 'Put your name down',
  text: 'Tell us who you are and send your résumé. You don’t need to have done this before. We read every application.',
  again: 'Sending it again with the same email replaces what you sent before.',
  submit: 'Send application',
  privacy: 'We use this only to decide on and talk to you about this role.',
  link: { label: 'A link', hint: 'Optional. Something you’ve made, a portfolio or your LinkedIn.' },
  resume: {
    label: 'Résumé',
    drop: {
      prompt: 'Drop your résumé here, or',
      choose: 'choose a file',
      rules: 'PDF, up to 5 MB',
      over: 'Let go to add it',
      replace: 'Drop or choose another to replace it.',
      remove: 'Remove',
      wrongType: 'That isn’t a PDF. Export your résumé as a PDF and try again.',
      tooBig: 'That file is over 5 MB.',
    },
  },
} as const

export const ROLE_THANKS = {
  title: 'Got it, thanks',
  text: 'Your application is in. We read every one, and we’ll write to your BU email if it’s a fit.',
} as const

export const ROLE_NOT_FOUND = {
  title: 'That role isn’t here',
  text: 'It may have been filled or taken down. The ones that are open now are on the list.',
  back: 'See open roles',
} as const
