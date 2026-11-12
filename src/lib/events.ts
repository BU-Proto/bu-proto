// Small helpers for showing an event, shared by the home page, the events page and its own page.

import { daysUntil } from './dates'

/** The kind only adds something when the title doesn't already say it ("Hack night" vs "Weekly hack night"). */
export const kindAddsInfo = (kind: string, title: string) => !title.toLowerCase().includes(kind.toLowerCase())

/** Over once the day has gone by; an event tonight is still on. */
export const isPast = (date: string) => daysUntil(date) < 0

/**
 * One line of the run of show, split into its time and what happens: "7:00 Food" →
 * { time: "7:00", what: "Food" }. Lines without a leading time keep it all in `what`.
 */
export function agendaLine(line: string): { time: string | null; what: string } {
  const match = /^\s*(\d{1,2}(?::\d{2})?(?:\s*[ap]\.?m\.?)?)\s*[–—-]?\s+(.+)$/i.exec(line)
  if (!match) return { time: null, what: line.trim() }
  return { time: match[1].replace(/\s+/g, ' '), what: match[2].trim() }
}

/**
 * A place as its name and the rest of its address, split at the first comma: "CDS, 665
 * Commonwealth Ave" → { name: "CDS", address: "665 Commonwealth Ave" }. No comma: all name.
 */
export function placeLines(place: string): { name: string; address: string | null } {
  const comma = place.indexOf(',')
  if (comma < 0) return { name: place.trim(), address: null }
  return { name: place.slice(0, comma).trim(), address: place.slice(comma + 1).trim() || null }
}
