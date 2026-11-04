import type { EmailAudience } from '../../../../shared/api'

// SQLite writes "2026-11-03 21:14:05" in UTC with no zone marker; Date would read that as local.
const parseStamp = (stamp: string) => new Date(`${stamp.replace(' ', 'T')}${/Z|[+-]\d\d:?\d\d$/.test(stamp) ? '' : 'Z'}`)

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const dateTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
const isoDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** "Nov 3, 2026" in the viewer's zone. */
export const formatStampDate = (stamp: string) => shortDate.format(parseStamp(stamp))

/** "Nov 3, 2026, 4:14 PM" in the viewer's zone. */
export const formatStamp = (stamp: string) => dateTime.format(parseStamp(stamp))

/** A content date (yyyy-mm-dd), with the year: "Nov 12, 2026". */
export const formatIsoDay = (day: string) => isoDay.format(new Date(`${day}T00:00:00Z`))

/** For <time dateTime>. */
export const stampToIso = (stamp: string) => parseStamp(stamp).toISOString()

export const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`

/**
 * One CSV cell. Quotes anything with a comma, quote or line break, and defuses cells that a
 * spreadsheet would run as a formula (a signup named "=HYPERLINK(...)" is someone's idea of fun).
 */
function csvCell(value: string | number | boolean): string {
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function toCsv(header: readonly string[], rows: readonly (readonly (string | number | boolean)[])[]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}

/** Hands the browser a file. The BOM keeps Excel from mangling names with accents. */
export function downloadFile(filename: string, contents: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob(['﻿', contents], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  // Give the download a beat to start before the URL goes away.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** "All members", "Build track", "RSVPs for Hack night #3", "Fund list: approved". */
export function describeAudience(audience: EmailAudience, eventTitles?: ReadonlyMap<number, string>): string {
  switch (audience.type) {
    case 'members':
      return 'All members'
    case 'track':
      return `${audience.track} track`
    case 'event': {
      const title = eventTitles?.get(audience.eventId)
      return title ? `RSVPs for ${title}` : `RSVPs for event #${audience.eventId}`
    }
    case 'fund':
      return audience.status ? `Fund list: ${audience.status}` : 'Fund list: everyone'
  }
}
