// Plain helpers for Today and the Inbox's queue (worker/routes/today.ts). No database and no
// runtime imports, so `npm test` can run them straight from the file.

/** yyyy-mm-dd plus n days, counted on the calendar (no time zones involved). */
export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/**
 * A line of an email for a list row: the sender's own words (the quoted email they replied to
 * dropped), on one line, cut at a word near `max` characters.
 */
export function snippet(text: string, max = 160): string {
  const own = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('>'))
    .join('\n')
    // A reply's quote starts at "On <date>, <name> wrote:", even once the lines have been joined.
    .replace(/\bOn [^\n]{4,200}?wrote:[\s\S]*$/, '')
    .replace(/-{2,}\s*(Original Message|Forwarded message)\s*-{2,}[\s\S]*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (own.length <= max) return own
  const cut = own.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:]+$/, '')}…`
}

/**
 * What's coming up, soonest first: everything inside the next `withinDays` days (so a count of
 * them is right), and at least `atLeast` items when there are that many at all.
 */
export function soonest<T extends { date: string; title: string }>(items: T[], today: string, withinDays = 14, atLeast = 6): T[] {
  const horizon = addDays(today, withinDays)
  return items
    .filter((item) => item.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
    .filter((item, index) => index < atLeast || item.date <= horizon)
}

/**
 * A moment as a sortable string. Timestamps come as SQLite writes them ("2026-11-20 14:03:00");
 * a bare day sorts as its noon, so it lands among that day's timestamps rather than before them.
 */
export function sortableMoment(at: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(at)) return `${at} 12:00:00`
  return at.replace('T', ' ').replace(/Z$/, '').slice(0, 19)
}

/** The newest `limit` of several lists merged, newest first. */
export function newestFirst<T extends { at: string }>(items: T[], limit: number): T[] {
  return [...items].sort((a, b) => sortableMoment(b.at).localeCompare(sortableMoment(a.at))).slice(0, limit)
}

/** How many are waiting across the queues. */
export const totalWaiting = (counts: Record<string, number>) => Object.values(counts).reduce((sum, count) => sum + count, 0)
