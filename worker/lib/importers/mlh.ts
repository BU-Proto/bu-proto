import type { CandidateMode } from '../../../shared/api'
import { absoluteUrl, cleanText, decodeEntities, isIsoDay, politeFetch, type ImportedEvent, type Importer } from './common'

// MLH has no API. Each season page (www.mlh.com/seasons/<year>/events) is server-rendered with
// an Inertia payload (<script data-page="app">) listing upcomingEvents, and the same events as
// schema.org microdata on each card. The payload is the primary source: it has a stable id and
// the format type. The microdata is the fallback if the payload moves or stops parsing.
//
// MLH writes event times as local wall-clock with a Z ("2026-11-07T14:00:00Z" for 9 AM in
// Boston), so the day is the date part as written, never converted to another zone.

const BASE = 'https://www.mlh.com'

/** A season runs Aug–Jul and is named for the year it ends: fall 2026 is the 2027 season. */
export function seasonsFor(today: string): number[] {
  const year = Number(today.slice(0, 4))
  const month = Number(today.slice(5, 7))
  const current = month >= 8 ? year + 1 : year
  return [current, current + 1]
}

function modeFor(formatType: unknown): CandidateMode {
  const value = String(formatType ?? '').toLowerCase()
  if (value === 'digital' || value.includes('online')) return 'online'
  if (value.startsWith('hybrid')) return 'hybrid'
  return 'in-person'
}

const dayOf = (value: unknown) => (typeof value === 'string' ? value.slice(0, 10) : '')

/** The event UUID MLH puts in its image paths, so fallback rows get the same id as payload rows. */
const uuidIn = (value: string) => /\/events\/([\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12})\//i.exec(value)?.[1] ?? null

interface MlhEvent {
  id?: unknown
  name?: unknown
  status?: unknown
  startsAt?: unknown
  endsAt?: unknown
  url?: unknown
  websiteUrl?: unknown
  location?: unknown
  formatType?: unknown
  logoUrl?: unknown
  backgroundUrl?: unknown
}

function fromPayload(event: MlhEvent): ImportedEvent | null {
  const starts = dayOf(event.startsAt)
  const ends = dayOf(event.endsAt)
  const name = cleanText(event.name)
  if (typeof event.id !== 'string' || !name || !isIsoDay(starts) || !isIsoDay(ends)) return null
  const mode = modeFor(event.formatType)
  return {
    sourceId: event.id,
    name,
    starts,
    ends,
    location: mode === 'online' ? 'Online' : cleanText(event.location),
    mode,
    url: absoluteUrl(event.websiteUrl) ?? absoluteUrl(event.url, BASE) ?? '',
    image: absoluteUrl(event.logoUrl) ?? absoluteUrl(event.backgroundUrl),
    raw: event,
  }
}

/** upcomingEvents from the Inertia payload; null when there's no payload we understand. */
export function parsePayload(html: string): MlhEvent[] | null {
  const match = /<script\b[^>]*\bdata-page="app"[^>]*>([\s\S]*?)<\/script>/.exec(html)
  if (!match) return null
  let page: { component?: unknown; props?: { upcomingEvents?: unknown } }
  try {
    page = JSON.parse(match[1]) as typeof page
  } catch {
    return null
  }
  const events = page.props?.upcomingEvents
  return Array.isArray(events) ? (events as MlhEvent[]) : null
}

const CARD = /<a\b([^>]*\bitemType="https:\/\/schema\.org\/Event"[^>]*)>/gi

/** Every schema.org Event card, past ones included (the caller drops those). */
export function parseMicrodata(html: string): ImportedEvent[] {
  const cards = [...html.matchAll(CARD)]
  const events: ImportedEvent[] = []
  cards.forEach((card, index) => {
    try {
      const body = html.slice(card.index + card[0].length, cards[index + 1]?.index ?? html.length)
      const meta: Record<string, string> = {}
      for (const [, prop, content] of body.matchAll(/<meta\s+itemProp="(\w+)"\s+content="([^"]*)"/gi)) {
        meta[prop] ??= decodeEntities(content)
      }
      const name = cleanText(decodeEntities((/<h4\b[^>]*>([\s\S]*?)<\/h4>/.exec(body)?.[1] ?? '').replace(/<[^>]+>/g, '')))
      const starts = dayOf(meta.startDate)
      const ends = dayOf(meta.endDate)
      const url = absoluteUrl(meta.url) ?? absoluteUrl(decodeEntities(/\bhref="([^"]*)"/.exec(card[1])?.[1] ?? '')) ?? ''
      if (!name || !isIsoDay(starts) || !isIsoDay(ends)) return
      const attendance = meta.eventAttendanceMode ?? ''
      const mode: CandidateMode = /Online/.test(attendance) ? 'online' : /Mixed/.test(attendance) ? 'hybrid' : 'in-person'
      const place = [meta.addressLocality, meta.addressRegion].map(cleanText).filter(Boolean).join(', ')
      const image = absoluteUrl(meta.image)
      events.push({
        sourceId: uuidIn(image ?? '') ?? url,
        name,
        starts,
        ends,
        location: mode === 'online' ? 'Online' : place,
        mode,
        url,
        image,
        raw: { ...meta, name },
      })
    } catch (error) {
      console.warn('mlh: skipped a card', error)
    }
  })
  return events.filter((event) => event.sourceId)
}

async function fetchSeason(season: number): Promise<ImportedEvent[]> {
  const response = await politeFetch(`${BASE}/seasons/${season}/events`, 'text/html')
  // Next season's page 404s until MLH opens it.
  if (response.status === 404) return []
  if (!response.ok) throw new Error(`MLH season ${season} answered ${response.status}`)
  const html = await response.text()

  const payload = parsePayload(html)
  if (payload) {
    const events: ImportedEvent[] = []
    for (const event of payload) {
      try {
        const normalized = fromPayload(event)
        if (normalized) events.push(normalized)
      } catch (error) {
        console.warn('mlh: skipped an event', error)
      }
    }
    if (events.length || payload.length === 0) return events
  }
  const cards = parseMicrodata(html)
  // Neither shape parsed: the page changed, and the run should say so rather than report zero.
  if (cards.length === 0) throw new Error(`MLH season ${season}: no event payload or cards on the page (layout changed?)`)
  return cards
}

export const mlh: Importer = {
  source: 'mlh',
  async fetchEvents(today) {
    const seen = new Map<string, ImportedEvent>()
    for (const season of seasonsFor(today)) {
      for (const event of await fetchSeason(season)) {
        if (event.ends >= today && !seen.has(event.sourceId)) seen.set(event.sourceId, event)
      }
    }
    return [...seen.values()]
  },
}
