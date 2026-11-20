// Pure pieces of People and Orgs (worker/routes/relationships.ts): how members and contacts fold
// into one person, how "the latest thing that happened" is picked across tables, and how a
// timeline is ordered. No database here, so npm test can cover them.

export interface Touch {
  label: string
  at: string
}

/**
 * A sortable form of a moment. Interactions and event days are plain days ("2026-11-18"); the
 * rest are SQLite timestamps in UTC ("2026-11-18 21:14:05"). A bare day is read as midday, so it
 * sorts among that day's timestamps instead of always before them.
 */
export function atKey(at: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(at) ? `${at} 12:00:00` : at
}

/** The newest of some touches (null and empty ones skipped), or null when there are none. */
export function latestTouch(touches: Iterable<Touch | null | undefined>): Touch | null {
  let best: Touch | null = null
  for (const touch of touches) {
    if (!touch?.at) continue
    if (!best || atKey(touch.at) > atKey(best.at)) best = touch
  }
  return best
}

/** Newest first. Ties keep the order they came in, so a timeline doesn't shuffle between loads. */
export function newestFirst<T extends { at: string }>(items: readonly T[]): T[] {
  return items
    .map((item, index) => ({ item, index, key: atKey(item.at) }))
    .sort((a, b) => (a.key === b.key ? a.index - b.index : a.key < b.key ? 1 : -1))
    .map(({ item }) => item)
}

/** Emails are matched without case or stray spaces, the way the tables' NOCASE columns compare. */
export const emailKey = (email: string) => email.trim().toLowerCase()

/**
 * Which contacts are really members: a contact whose email matches a member's is the same
 * person, so People shows them once, as the member, with the contact's history folded in.
 * Returns contact id → member id.
 */
export function foldContacts(
  members: readonly { id: number; email: string }[],
  contacts: readonly { id: number; email: string }[],
): Map<number, number> {
  const memberByEmail = new Map(members.map((member) => [emailKey(member.email), member.id]))
  const fold = new Map<number, number>()
  for (const contact of contacts) {
    const memberId = memberByEmail.get(emailKey(contact.email))
    if (memberId !== undefined) fold.set(contact.id, memberId)
  }
  return fold
}

/** Whether every word of a search appears in one of the fields, ignoring case. */
export function matchesQuery(fields: readonly (string | null | undefined)[], query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = fields.filter(Boolean).join(' ').toLowerCase()
  return words.every((word) => haystack.includes(word))
}

/** The first line of some text, cut to a length that fits a timeline row. */
export function clip(text: string, max = 90): string {
  const line = text.trim().split(/\r?\n/)[0]?.trim() ?? ''
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line
}

/**
 * An interaction's summary as a timeline row: its first sentence as the title ("Coffee at the
 * GSU."), the rest underneath. A short summary is all title; a long first sentence is clipped
 * and the whole summary goes underneath, so nothing is lost.
 */
export function splitSummary(summary: string): { title: string; rest: string } {
  const text = summary.trim()
  const match = /^(.+?[.!?])(?:\s+|$)([\s\S]*)$/.exec(text)
  const first = (match ? match[1] : text.split(/\r?\n/)[0]).trim()
  if (first.length > 90) return { title: clip(first), rest: text }
  const rest = (match ? match[2] : text.slice(first.length)).trim()
  return { title: first.replace(/\.$/, ''), rest }
}

/** "(?, ?, ?)" for an IN list, or "(NULL)" (which matches nothing) when there's nothing to match. */
export const inList = (values: readonly unknown[]) => `(${values.map(() => '?').join(', ') || 'NULL'})`
