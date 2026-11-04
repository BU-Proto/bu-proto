// An .ics file for "Add to calendar", built in the browser from an event's date, time and place.
// Times are Boston times; the file carries the America/New_York zone so any calendar app reads
// them right wherever the visitor is.

import type { ProtoEvent } from '../../shared/api'

interface Clock {
  hour: number
  minute: number
}

const MERIDIEM = /\s*([ap])\.?\s*m\.?/i
const CLOCK = /(\d{1,2})(?::(\d{2}))?(\s*[ap]\.?\s*m\.?)?/i

function readClock(text: string): (Clock & { meridiem: 'a' | 'p' | null }) | null {
  const match = CLOCK.exec(text)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2] ?? 0)
  if (hour > 23 || minute > 59) return null
  const meridiem = match[3] ? (MERIDIEM.exec(match[3])?.[1].toLowerCase() as 'a' | 'p') : null
  return { hour, minute, meridiem }
}

function to24(hour: number, meridiem: 'a' | 'p') {
  const base = hour % 12
  return meridiem === 'p' ? base + 12 : base
}

/**
 * Best effort at "6:30–8:30 PM", "7 PM", "11:00 AM–1:00 PM" or "18:00-20:00". Without a
 * meridiem a start borrows the end's (and drops back to AM if that would put it after the end);
 * a lone hour with none is read as evening, since that's when events are. Null when there's no
 * clock time in it at all, so the event goes in as all-day.
 */
export function parseTimeRange(text: string): { start: Clock; end: Clock | null } | null {
  const [startText, endText] = text.split(/\s*[–—-]\s*|\s+to\s+/i)
  const start = startText ? readClock(startText) : null
  if (!start) return null
  const end = endText ? readClock(endText) : null

  const endMeridiem = end?.meridiem ?? null
  let startHour = start.hour
  if (start.meridiem) startHour = to24(start.hour, start.meridiem)
  else if (endMeridiem && start.hour <= 12) {
    startHour = to24(start.hour, endMeridiem)
    const endHour = end ? to24(end.hour, endMeridiem) : 24
    if (startHour > endHour) startHour = to24(start.hour, 'a')
  } else if (start.hour >= 1 && start.hour <= 11 && !end) startHour = start.hour + 12

  let endClock: Clock | null = null
  if (end) {
    const meridiem = end.meridiem ?? start.meridiem
    endClock = { hour: meridiem ? to24(end.hour, meridiem) : end.hour, minute: end.minute }
  }
  return { start: { hour: startHour, minute: start.minute }, end: endClock }
}

const pad = (n: number) => String(n).padStart(2, '0')
const compactDay = (iso: string) => iso.replaceAll('-', '')

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Commas, semicolons, backslashes and newlines are special in iCalendar text. */
const escapeText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** Lines over 75 octets are folded: a CRLF and a space before the rest. */
function fold(line: string) {
  const bytes = new TextEncoder()
  if (bytes.encode(line).length <= 75) return line
  const parts: string[] = []
  let current = ''
  for (const char of line) {
    if (bytes.encode(current + char).length > (parts.length ? 74 : 75)) {
      parts.push(current)
      current = char
    } else current += char
  }
  parts.push(current)
  return parts.join('\r\n ')
}

// US Eastern since 2007: DST from the second Sunday in March to the first Sunday in November.
const NEW_YORK = [
  'BEGIN:VTIMEZONE',
  'TZID:America/New_York',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:-0500',
  'TZOFFSETTO:-0400',
  'TZNAME:EDT',
  'DTSTART:20070311T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:-0400',
  'TZOFFSETTO:-0500',
  'TZNAME:EST',
  'DTSTART:20071104T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
]

type CalendarEvent = Pick<ProtoEvent, 'id' | 'title' | 'date' | 'time' | 'place' | 'text'>

/** The event as an iCalendar file. `url` is its page, put in the description and the URL field. */
export function eventToIcs(event: CalendarEvent, url: string, now = new Date()): string {
  const range = parseTimeRange(event.time)
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const local = (day: string, clock: Clock) => `${compactDay(day)}T${pad(clock.hour)}${pad(clock.minute)}00`

  const when: string[] = []
  if (range) {
    const startMinutes = range.start.hour * 60 + range.start.minute
    // No end given: call it two hours. An end at or before the start runs past midnight.
    const end = range.end ?? { hour: Math.floor((startMinutes + 120) / 60), minute: (startMinutes + 120) % 60 }
    const endMinutes = end.hour * 60 + end.minute
    const endDay = endMinutes <= startMinutes || end.hour >= 24 ? addDays(event.date, 1) : event.date
    const endClock = { hour: end.hour % 24, minute: end.minute }
    when.push(`DTSTART;TZID=America/New_York:${local(event.date, range.start)}`)
    when.push(`DTEND;TZID=America/New_York:${local(endDay, endClock)}`)
  } else {
    when.push(`DTSTART;VALUE=DATE:${compactDay(event.date)}`)
    when.push(`DTEND;VALUE=DATE:${compactDay(addDays(event.date, 1))}`)
  }

  const description = [event.text?.trim(), event.time && !range ? event.time : '', url].filter(Boolean).join('\n\n')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BU Proto//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...(range ? NEW_YORK : []),
    'BEGIN:VEVENT',
    `UID:event-${event.id}@bu-proto`,
    `DTSTAMP:${stamp}`,
    ...when,
    `SUMMARY:${escapeText(event.title)}`,
    `LOCATION:${escapeText(event.place)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

/** A file name from the title: "why-hackathons.ics". */
export const icsFileName = (title: string) =>
  `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event'}.ics`
