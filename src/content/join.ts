// The join page. The year and track options are shared with the API (shared/constants.ts).

import type { PageIntro } from './types'

export const JOIN_INTRO: PageIntro = {
  path: '~/proto/join',
  title: 'Join Proto',
  lede: "Free, with no application. Proto is for anyone in Boston who wants to build something, whether you've never made anything or you've started a company before. You don't need an idea, a team, a school or any experience. Tell us a little about yourself and we'll see you at build night.",
}

export const PERKS: readonly { title: string; text: string }[] = [
  { title: 'A weekly build night', text: "An evening every week to work on your idea, or to sit with people working on theirs. There's food, and someone to ask when you're stuck." },
  { title: 'The people you are missing', text: "A co-founder, or the teammate with the skill you don't have yet. Engineers meet business people meet designers here." },
  { title: 'Firesides', text: 'Founders and investors on how companies get built, then questions from the room. No question is too basic.' },
  { title: 'A stage', text: 'Demo night every semester. Show anything, finished or not, even your first project.' },
  { title: 'A group for your side of it', text: "CS for building with code, Business for customers, pitching and money. Both are open to everyone, and you don't need to know either to come." },
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
  school: { label: 'School', hint: "Leave it blank if you're not at a school.", placeholder: 'BU, Northeastern, MIT, none' },
  field: 'Field',
  trackHint: "Where you are today. Start: you have an idea, or not yet. Build: you're making something. Launch: you're turning it into a company. Not sure yet is fine too.",
  building: { label: 'What are you building, if anything?', hint: "Optional. Leave it blank if you don't have an idea yet.", placeholder: 'An app, a product, a business, nothing yet' },
} as const
