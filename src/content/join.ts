// The join page. The year and track options are shared with the API (shared/constants.ts).

import type { PageIntro } from './types'

export const JOIN_INTRO: PageIntro = {
  path: '~/proto/join',
  title: 'Join Proto',
  lede: "Free, with no application. For anyone in Boston who wants to build something, from any school or none, in business, engineering, CS, design or anything else. Tell us what you're working on and we'll see you at build night.",
}

export const PERKS: readonly { title: string; text: string }[] = [
  { title: 'A weekly build night', text: "Somewhere to work on your thing every week, with food and people to ask." },
  { title: 'The people you are missing', text: 'A co-founder, or the teammate with the skill you lack: engineers meet business people meet designers.' },
  { title: 'Firesides', text: 'Founders and investors on how companies get built, then questions from people building their own.' },
  { title: 'A stage', text: 'Demo night every semester. Show anything, finished or not.' },
  { title: 'A group for your side of it', text: 'CS for building with code, Business for customers, pitching and funding. Both are open to everyone.' },
]

export const JOIN_THANKS = {
  title: "You're in",
  text: "Thanks for joining. We'll email you before the next build night.",
} as const

export const JOIN_FORM = {
  perksTitle: 'What you get',
  title: 'Sign up',
  submit: 'Join Proto',
  privacy: 'We use this to email you about build nights, firesides and events.',
  school: { label: 'School', hint: 'Leave it blank if you are not a student.', placeholder: 'BU, Northeastern, MIT, none' },
  field: 'Field',
  trackHint: 'Start: you have an idea. Build: you are making it. Launch: you are turning it into a company.',
  building: { label: 'What are you building?', hint: 'Optional. Or what you would like to build.', placeholder: 'An app for…, a hardware idea, a business' },
} as const
