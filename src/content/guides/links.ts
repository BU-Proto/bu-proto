// Guide slugs in one place, so guides can link to each other without importing each other.

import type { GuideLink } from './types'

export const SLUGS = {
  win: 'how-to-win',
  first: 'your-first-hackathon',
  ideas: 'ideas-and-angles',
  demo: 'demo-and-pitch',
  judging: 'how-judging-works',
  breakdowns: 'winning-projects',
} as const

export function guideHref(slug: string): string {
  return `/resources/${slug}`
}

export function guideLink(slug: string, label: string): GuideLink {
  return { label, href: guideHref(slug) }
}
