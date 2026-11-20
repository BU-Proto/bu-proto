import type { PersonKind } from '../../../../shared/crm'

// How People, Orgs and their pages write days, due dates and teammates.

const isDay = (at: string) => /^\d{4}-\d{2}-\d{2}$/.test(at)

/** A day ("2026-11-18") at local midnight, or a SQLite UTC timestamp as the moment it was. */
export function parseAt(at: string): Date {
  if (isDay(at)) {
    const [year, month, day] = at.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(`${at.replace(' ', 'T')}${/Z|[+-]\d\d:?\d\d$/.test(at) ? '' : 'Z'}`)
}

const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const monthDayYear = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const weekdayDay = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

/** "Nov 18", with the year only when it isn't this one. */
export function formatAt(at: string): string {
  const date = parseAt(at)
  return (date.getFullYear() === new Date().getFullYear() ? monthDay : monthDayYear).format(date)
}

/** For <time dateTime>. */
export const isoOf = (at: string) => (isDay(at) ? at : parseAt(at).toISOString())

/** Today as yyyy-mm-dd, in the viewer's zone. */
export function todayIso(offsetDays = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export type DueTone = 'late' | 'today' | 'later'

/** How a due day reads next to today: "2 days late", "Today", "Tomorrow", "Mon, Nov 23". */
export function dueText(dueOn: string): { text: string; tone: DueTone } {
  const days = Math.round((parseAt(dueOn).getTime() - parseAt(todayIso()).getTime()) / 86_400_000)
  if (days < 0) return { text: days === -1 ? '1 day late' : `${-days} days late`, tone: 'late' }
  if (days === 0) return { text: 'Today', tone: 'today' }
  if (days === 1) return { text: 'Tomorrow', tone: 'later' }
  return { text: days < 7 ? weekdayDay.format(parseAt(dueOn)) : formatAt(dueOn), tone: 'later' }
}

/** Up to two letters for an avatar: "Daniel Okafor" → "DO". */
export function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return '?'
  return (words.length === 1 ? words[0].slice(0, 2) : `${words[0][0]}${words[words.length - 1][0]}`).toUpperCase()
}

/**
 * A teammate by email, in a word: "andres@proto.boston" → "Andres". The admins list only knows
 * emails, so this is the friendliest thing to show.
 */
export function teammate(email: string | null | undefined): string {
  if (!email) return ''
  const local = email.split('@')[0] ?? email
  const first = local.split(/[._+-]/)[0] || local
  return first.charAt(0).toUpperCase() + first.slice(1)
}

/** The dot's colour for each kind of person, from the portal's row states. */
export const KIND_TONE: Record<PersonKind, string | undefined> = {
  member: 'live',
  lead: 'sample',
  contact: 'filled',
  alum: undefined,
}

/** An org's spot on the logo walls, as one word in a list. */
export const WALL_LABELS = { sponsors: 'Sponsor', partners: 'Partner' } as const
