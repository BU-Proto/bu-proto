// Content dates are plain ISO days (yyyy-mm-dd). Everything here works in UTC so a date never
// slips a day in a browser west of Greenwich.

const DAY_MS = 86_400_000

const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })

const parse = (iso: string) => new Date(`${iso}T00:00:00Z`)

/** Today in the visitor's time zone, as a UTC midnight. */
function today(): number {
  const now = new Date()
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
}

/** "Nov 12" */
export const formatDay = (iso: string) => monthDay.format(parse(iso))

/** "Jan 30–31", or "Feb 28–Mar 1" across months. */
export function formatRange(start: string, end: string): string {
  if (start === end) return formatDay(start)
  const a = parse(start)
  const b = parse(end)
  const sameMonth = a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear()
  return sameMonth ? `${monthDay.format(a)}–${b.getUTCDate()}` : `${monthDay.format(a)}–${monthDay.format(b)}`
}

/** Parts for a calendar tile: { month: "Nov", day: 12, weekday: "Thu" }. */
export function dateParts(iso: string) {
  const date = parse(iso)
  return { month: month.format(date), day: date.getUTCDate(), weekday: weekday.format(date) }
}

/** "November 2026", for grouping a list by month. */
export const formatMonth = (iso: string) => monthYear.format(parse(iso))

/** Whole days from today until the date: 0 today, negative once it's past. */
export const daysUntil = (iso: string) => Math.round((parse(iso).getTime() - today()) / DAY_MS)
