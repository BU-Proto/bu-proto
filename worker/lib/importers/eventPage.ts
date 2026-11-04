import { type EventImportSource, type EventInput, type EventKind } from '../../../shared/api'
import { USER_AGENT, absoluteUrl, cleanText, decodeEntities } from './common'
import { clamp, htmlToText } from './devpostProject'

// One event page (Luma, Eventbrite, or anything else that publishes schema.org Event JSON-LD)
// read into an event draft. JSON-LD is the contract every source shares; where Luma and
// Eventbrite put better data in their page payload (__NEXT_DATA__), that fills the gaps:
// Luma's street address and raw cover, Eventbrite's full write-up, Meetup's untruncated text.

const ZONE = 'America/New_York'
/** Pages bigger than this aren't event pages we can use, and we'd rather not hold them. */
const MAX_PAGE_BYTES = 5_000_000

export function sourceOf(url: URL): EventImportSource {
  const host = url.hostname.replace(/^www\./, '')
  if (host === 'lu.ma' || host === 'luma.com') return 'luma'
  if (/(^|\.)eventbrite\.[a-z.]+$/.test(host)) return 'eventbrite'
  return 'other'
}

/** GET the page as HTML. `Accept: *\/*`, as with Devpost: some sites turn away bots asking for text/html. */
export async function fetchEventPage(url: string): Promise<{ html: string; url: string }> {
  let response: Response
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
      signal: AbortSignal.timeout(12_000),
      redirect: 'follow',
    })
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError'
    throw new Error(timedOut ? 'That site took too long to answer.' : 'Could not reach that site.')
  }
  if (response.status === 404) throw new Error('That site has no page at that address.')
  if (response.status === 401 || response.status === 403 || response.status === 429) {
    throw new Error(`That site turned the request away (${response.status}).`)
  }
  if (!response.ok) throw new Error(`That site answered ${response.status}.`)
  const html = await response.text()
  if (html.length > MAX_PAGE_BYTES) throw new Error('That page is too big to read.')
  return { html, url: response.url || url }
}

// ---- Reading the page --------------------------------------------------------------------------

type Json = Record<string, unknown>

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value)
const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : value === undefined || value === null ? [] : [value])
const str = (value: unknown) => (typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '')

/** Every JSON-LD block on the page, parsed. A block that isn't valid JSON is skipped. */
function jsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = []
  for (const match of html.matchAll(/<script\b[^>]*\btype\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    const body = match[1].trim().replace(/^<!\[CDATA\[|\]\]>$/g, '')
    try {
      blocks.push(JSON.parse(body))
    } catch {
      // Hand-written blocks sometimes carry raw newlines inside strings.
      try {
        blocks.push(JSON.parse(body.replace(/[\r\n\t]+/g, ' ')))
      } catch {
        continue
      }
    }
  }
  return blocks
}

/** Event, SocialEvent, EducationEvent, BusinessEvent… anything schema.org calls an event. */
const isEvent = (node: Json) => asList(node['@type']).some((type) => typeof type === 'string' && /(^|[/:])\w*Event$/.test(type))

/**
 * The page's Event node: top-level, in an array, or in an @graph. A recurring event's page
 * (university calendars) lists every date, so the next one not yet over wins, else the last.
 */
function findEvent(html: string): Json | null {
  const found: Json[] = []
  const visit = (node: unknown, depth: number) => {
    if (depth > 3) return
    if (Array.isArray(node)) return node.forEach((child) => visit(child, depth + 1))
    if (!isObject(node)) return
    if (isEvent(node)) found.push(node)
    if (node['@graph']) visit(node['@graph'], depth + 1)
  }
  for (const block of jsonLdBlocks(html)) visit(block, 0)
  const dated = found
    .map((node) => ({ node, start: Date.parse(str(node.startDate)), end: Date.parse(str(node.endDate)) }))
    .filter((entry) => !Number.isNaN(entry.start))
    .sort((a, b) => a.start - b.start)
  if (!dated.length) return found[0] ?? null
  const now = Date.now()
  return (dated.find((entry) => (Number.isNaN(entry.end) ? entry.start : entry.end) >= now) ?? dated[dated.length - 1]).node
}

/** The Next.js page payload, which Luma, Eventbrite and Meetup all render with. */
function nextData(html: string): Json | null {
  const match = /<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html)
  if (!match) return null
  try {
    const data: unknown = JSON.parse(match[1])
    return isObject(data) ? data : null
  } catch {
    return null
  }
}

/** A path into nested JSON, or undefined. */
function dig(value: unknown, ...path: (string | number)[]): unknown {
  let current = value
  for (const key of path) {
    if (Array.isArray(current) && typeof key === 'number') current = current[key]
    else if (isObject(current) && typeof key === 'string') current = current[key]
    else return undefined
  }
  return current
}

function metaContent(html: string, name: string): string {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!new RegExp(`(?:name|property)\\s*=\\s*["']${name}["']`, 'i').test(tag)) continue
    const content = /content\s*=\s*"([^"]*)"|content\s*=\s*'([^']*)'/i.exec(tag)
    if (content) return decodeEntities(content[1] ?? content[2] ?? '')
  }
  return ''
}

// ---- Dates and times ---------------------------------------------------------------------------

interface Moment {
  day: string
  /** Minutes after midnight in New York; null for a date with no time. */
  minutes: number | null
}

const nyFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/**
 * An ISO date or date-time as a New York day and clock. A time with no zone is taken as New
 * York's already; a bare date has no clock.
 */
function toNewYork(value: unknown): Moment | null {
  const text = str(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return { day: text, minutes: null }
  const floating = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(text)
  if (floating) return { day: floating[1], minutes: Number(floating[2]) * 60 + Number(floating[3]) }
  const date = new Date(text)
  if (!text || Number.isNaN(date.getTime())) return null
  const parts = Object.fromEntries(nyFormat.formatToParts(date).map((part) => [part.type, part.value]))
  return { day: `${parts.year}-${parts.month}-${parts.day}`, minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute) }
}

const meridiem = (minutes: number) => (minutes < 720 ? 'AM' : 'PM')
const clock = (minutes: number) => `${(Math.floor(minutes / 60) % 12 || 12)}:${String(minutes % 60).padStart(2, '0')}`

const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const shortDay = (iso: string) => monthDay.format(new Date(`${iso}T00:00:00Z`))

const dayAfter = (iso: string) => {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

/**
 * "6:30–8:30 PM", "11:00 AM–1:00 PM", "7:00 PM" with no end. An end on a later day is noted
 * after the clock, "10:00 PM–2:00 AM (ends Nov 12)", which src/lib/calendar.ts still reads.
 * Midnight exactly counts as the same night.
 */
export function formatTime(start: Moment, end: Moment | null): string {
  if (start.minutes === null) {
    return end && end.day > start.day ? `All day (ends ${shortDay(end.day)})` : 'All day'
  }
  const from = clock(start.minutes)
  if (!end || end.minutes === null || (end.day === start.day && end.minutes <= start.minutes)) {
    return `${from} ${meridiem(start.minutes)}`
  }
  const sameNight = end.day === start.day || (end.minutes === 0 && end.day === dayAfter(start.day))
  const to = `${clock(end.minutes)} ${meridiem(end.minutes)}`
  const shared = end.day === start.day && meridiem(start.minutes) === meridiem(end.minutes)
  const range = shared ? `${from}–${to}` : `${from} ${meridiem(start.minutes)}–${to}`
  return sameNight ? range : `${range} (ends ${shortDay(end.day)})`
}

// ---- Place, people, words ----------------------------------------------------------------------

const COUNTRY = /^(usa?|united states( of america)?)$/i
const STATE_ZIP = /^([A-Z]{2}|[A-Za-z ]+)\s+\d{5}(-\d{4})?$/
const STATE = /^([A-Z]{2}|massachusetts|new york|rhode island|new hampshire|connecticut|maine|vermont)$/i

/** "45 Province Street, Boston, MA 02108, USA" → "45 Province Street, Boston". Repeats go too. */
function tidyAddress(parts: string[]): string[] {
  const seen = new Set<string>()
  const kept: string[] = []
  for (const raw of parts.flatMap((part) => part.split(','))) {
    const part = cleanText(raw)
    if (!part || COUNTRY.test(part) || STATE_ZIP.test(part) || STATE.test(part) || /^\d{5}(-\d{4})?$/.test(part)) continue
    const key = part.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    kept.push(part)
  }
  return kept
}

/** A venue name and its street, joined without saying the same thing twice. */
function joinPlace(name: string, address: string[]): string {
  const rest = tidyAddress(address)
  const venue = cleanText(name)
  if (!venue) return rest.join(', ')
  const lower = venue.toLowerCase()
  const street = rest.filter((part) => part.toLowerCase() !== lower && !lower.includes(part.toLowerCase()))
  // "399 Boylston Street" named after its own address ("399 Boylston St, Boston"): keep the address.
  const number = /^\d+\b/.exec(venue)?.[0]
  if (number && street[0]?.startsWith(number)) return street.join(', ')
  return [venue, ...street].join(', ')
}

function placeOf(event: Json): string {
  const locations = asList(event.location)
  const online =
    /OnlineEventAttendanceMode/i.test(str(event.eventAttendanceMode)) ||
    locations.some((location) => isObject(location) && asList(location['@type']).includes('VirtualLocation'))
  const mixed = /MixedEventAttendanceMode/i.test(str(event.eventAttendanceMode))
  let physical = ''
  for (const location of locations) {
    if (typeof location === 'string') {
      physical = joinPlace('', [location])
    } else if (isObject(location) && !asList(location['@type']).includes('VirtualLocation')) {
      const address = location.address
      const lines = isObject(address)
        ? [str(address.streetAddress), str(address.addressLocality)]
        : [str(address)]
      physical = joinPlace(str(location.name), lines)
    }
    if (physical) break
  }
  physical = decodeEntities(physical)
  if (physical && (mixed || online)) return /online/i.test(physical) ? physical : `${physical} and online`
  if (physical) return physical
  return online ? 'Online' : ''
}

function hostsOf(event: Json): EventInput['hosts'] {
  const hosts: EventInput['hosts'] = []
  const seen = new Set<string>()
  for (const entry of [...asList(event.organizer), ...asList(event.performer)]) {
    const name = clamp(cleanText(decodeEntities(isObject(entry) ? str(entry.name) : str(entry))), 80)
    if (!name || seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    const href = isObject(entry) ? absoluteUrl(entry.url) : null
    hosts.push({ name, href: href && href.length <= 2000 ? href : '', bu: false })
  }
  return hosts.slice(0, 16)
}

function imageOf(event: Json, base: string): string | null {
  for (const image of asList(event.image)) {
    const url = absoluteUrl(isObject(image) ? (image.url ?? image.contentUrl) : image, base)
    if (url) return url
  }
  return null
}

/**
 * A description as plain paragraphs. HTML goes through the same converter the Devpost importer
 * uses. In plain text every line is its own paragraph: Luma and Meetup break lines where they
 * mean one, and the site only breaks at blank lines. Markdown bold (Meetup's) loses its stars.
 */
function toParagraphs(value: string): string {
  if (/<\/?(p|br|div|li|ul|h[1-6]|strong|em|a)\b/i.test(value)) return htmlToText(value)
  return decodeEntities(value)
    .replace(/\*\*([^*\n]+)\*\*|__([^_\n]+)__/g, (_, bold: string | undefined, under: string | undefined) => bold ?? under ?? '')
    .split(/\r\n?|\n|\u2028|\u2029/)
    .map((line) => line.replace(/[ \t\u00a0]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')
}

/** The opening sentence, if it's a sensible length; else the opening ~200 characters. */
function summaryOf(description: string): string {
  const first = description.split('\n\n')[0]?.replace(/\n/g, ' ').trim() ?? ''
  const sentence = /^.+?[.!?](?=\s|$)/.exec(first)?.[0] ?? ''
  if (sentence.length >= 30 && sentence.length <= 240) return sentence
  return clamp(first, 200)
}

const KIND_RULES: [RegExp, EventKind][] = [
  [/\bwhy hackathons?\b|\b(intro|introduction) to hackathons?\b|\bfirst hackathon\b/i, 'Why hackathons'],
  [/\bworkshop\b|\btutorial\b|\bhands-on\b|\bbootcamp\b|\bcrash course\b|\blearn to\b/i, 'Workshop'],
  [/\bhack ?nights?\b|\bhacknight\b|\bbuild nights?\b|\bco-?working\b|\bhack(ing)? session\b|\b(project|collaboration) night\b|\bhackathon\b/i, 'Hack night'],
  [/\bdemo(s| day| night)?\b|\bshowcase\b|\bpitch(es| night)?\b|\bshow and tell\b/i, 'Demo night'],
  [/\bprep\b|\binfo session\b|\binterview\b|\brésumé|\bresume\b|\bteam formation\b/i, 'Prep night'],
  [/\bpanel\b|\bfireside\b|\bin conversation\b|\bq ?& ?a\b|\bspeaker series\b|\bdiscussion\b/i, 'Panel'],
]

/**
 * A best guess the admin can change. The title decides first, the description only if the title
 * says nothing; a word naming the format outright ("workshop") beats a hint ("pitch").
 */
export function guessKind(title: string, description: string): EventKind {
  for (const text of [title, description.slice(0, 1500)]) {
    for (const [rule, kind] of KIND_RULES) if (rule.test(text)) return kind
  }
  return 'Workshop'
}

// ---- Source extras -----------------------------------------------------------------------------

interface Extras {
  place?: string
  photo?: string | null
  description?: string
}

/** Luma: JSON-LD repeats the venue name as its street; the payload has the real one, and the uncropped cover. */
function lumaExtras(data: Json | null): Extras {
  const event = dig(data, 'props', 'pageProps', 'initialData', 'data', 'event')
  if (!isObject(event)) return {}
  const extras: Extras = {}
  const geo = event.geo_address_info
  if (isObject(geo) && geo.mode !== 'obfuscated' && str(geo.address)) {
    const short = str(geo.short_address) || str(geo.full_address)
    extras.place = joinPlace(str(geo.address), [short])
  } else if (isObject(geo) && str(geo.city_state)) {
    extras.place = str(geo.city_state)
  }
  extras.photo = absoluteUrl(event.cover_url)
  return extras
}

/** Eventbrite: JSON-LD carries only the summary; the full write-up is the payload's text modules. */
function eventbriteExtras(data: Json | null): Extras {
  const modules = dig(data, 'props', 'pageProps', 'context', 'structuredContent', 'modules')
  const text = asList(modules)
    .filter((module) => isObject(module) && module.type === 'text' && str(module.text))
    .map((module) => htmlToText(str((module as Json).text)))
    .filter(Boolean)
    .join('\n\n')
  return text ? { description: text } : {}
}

/** Meetup and others: a payload `event.description` that carries on from a truncated JSON-LD one. */
function payloadDescription(data: Json | null, short: string): string {
  const full = str(dig(data, 'props', 'pageProps', 'event', 'description'))
  const opening = short.slice(0, 40)
  return full.length > short.length && opening && full.startsWith(opening) ? full : ''
}

// ---- The draft ---------------------------------------------------------------------------------

export interface ParsedEventPage {
  source: EventImportSource
  event: EventInput
}

/** Throws with a message for the admin when the page has no usable event. */
export function parseEventPage(html: string, pageUrl: string): ParsedEventPage {
  const url = new URL(pageUrl)
  const source = sourceOf(url)
  const event = findEvent(html)
  if (!event) throw new Error('No event details on that page. It needs schema.org Event data, as Luma and Eventbrite pages have.')

  const title = clamp(cleanText(decodeEntities(str(event.name))), 120)
  if (!title) throw new Error('The event on that page has no name.')
  const start = toNewYork(event.startDate)
  if (!start) throw new Error('The event on that page has no start date.')
  const end = toNewYork(event.endDate)

  const data = nextData(html)
  const extras = source === 'luma' ? lumaExtras(data) : source === 'eventbrite' ? eventbriteExtras(data) : {}

  const short = str(event.description) || metaContent(html, 'og:description') || metaContent(html, 'description')
  const long = extras.description || payloadDescription(data, short) || short
  const summary = toParagraphs(short)
  const description = toParagraphs(long)

  return {
    source,
    event: {
      kind: guessKind(title, description),
      title,
      date: start.day,
      time: clamp(formatTime(start, end), 40),
      place: clamp(extras.place || placeOf(event) || 'To be announced', 120),
      text: summary ? summaryOf(summary) : '',
      photo: extras.photo || imageOf(event, url.href) || '',
      description: clamp(description, 8000),
      agenda: [],
      hosts: hostsOf(event),
      gallery: [],
      placeholder: false,
      published: false,
    },
  }
}
