// Guide slugs in one place, so guides can link to each other without importing each other.

import type { GuideLink } from './types'

export const SLUGS = {
  win: 'how-to-win',
  first: 'your-first-hackathon',
  team: 'team-and-roles',
  shipping: 'shipping-fast',
  ideas: 'ideas-and-angles',
  demo: 'demo-and-pitch',
  writeUp: 'the-write-up',
  judging: 'how-judging-works',
  after: 'after-the-weekend',
  breakdowns: 'winning-projects',
} as const

/** The playbook's own page, under the resources hub. Each guide is a page below it. */
export const PLAYBOOK_HREF = '/resources/playbook'

export function guideHref(slug: string): string {
  return `${PLAYBOOK_HREF}/${slug}`
}

export function guideLink(slug: string, label: string): GuideLink {
  return { label, href: guideHref(slug) }
}
