// Formatting for the portal. API timestamps are UTC without a zone ("2026-11-03 21:14:05"),
// so they're parsed as UTC and shown in the admin's own time zone.

/** "Events · Admin · BU Proto" */
export const pageTitle = (page?: string) => (page ? `${page} · Admin · BU Proto` : 'Admin · BU Proto')

export function parseTimestamp(value: string): Date {
  return new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`)
}

const stamp = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const stampWithYear = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const clock = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
const relative = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })

/** "Nov 3, 9:14 PM", or "Nov 3, 2025" once it's from another year. */
export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return '—'
  const date = parseTimestamp(value)
  if (Number.isNaN(date.getTime())) return value
  return date.getFullYear() === new Date().getFullYear() ? stamp.format(date) : stampWithYear.format(date)
}

/** "just now", "5 minutes ago", "3 days ago". */
export function formatRelative(value: string | null | undefined): string {
  if (!value) return 'never'
  const seconds = (parseTimestamp(value).getTime() - Date.now()) / 1000
  if (Number.isNaN(seconds)) return value
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

/** The time a save finished, for the status line. */
export const formatClock = (date: Date) => clock.format(date)

export const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`
