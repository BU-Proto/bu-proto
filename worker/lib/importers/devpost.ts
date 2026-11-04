import type { CandidateMode } from '../../../shared/api'
import { absoluteUrl, cleanText, decodeEntities, sleep, politeFetch, type ImportedEvent, type Importer } from './common'

// Devpost's listing API is unofficial (it backs devpost.com/hackathons), so every field is read
// defensively. It gives a venue, not a city, for most in-person events, and no event dates: only
// the submission period, which for an in-person hackathon is the event itself.

const ENDPOINT = 'https://devpost.com/api/hackathons'
/** The API caps per_page at 40; 6 pages covers ~240 upcoming events, about 1.5x today's count. */
const PER_PAGE = 40
const MAX_PAGES = 6

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function day(year: number, month: string, date: string): string | null {
  const index = MONTHS.indexOf(month.slice(0, 3).toLowerCase())
  const n = Number(date)
  if (index < 0 || !Number.isInteger(n) || n < 1 || n > 31) return null
  return `${year}-${String(index + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`
}

/**
 * "Oct 01 - Nov 12, 2026", "Nov 06 - 08, 2026", "Nov 15, 2026" and
 * "Dec 28, 2026 - Jan 03, 2027" → [starts, ends]. A range with one year that runs backwards
 * ("Dec 28 - Jan 03, 2027") starts the year before.
 */
export function parseDateRange(value: string): [string, string] | null {
  const match =
    /^\s*([a-z]{3,9})\.? (\d{1,2})(?:, (\d{4}))?(?:\s*[-–]\s*(?:([a-z]{3,9})\.? )?(\d{1,2})(?:, (\d{4}))?)?\s*$/i.exec(value)
  if (!match) return null
  const [, startMonth, startDate, startYear, endMonth, endDate, endYear] = match
  const yearEnd = Number(endYear ?? startYear)
  if (!yearEnd) return null
  const ends = day(yearEnd, endMonth ?? startMonth, endDate ?? startDate)
  let starts = day(startYear ? Number(startYear) : yearEnd, startMonth, startDate)
  if (!starts || !ends) return null
  if (!startYear && starts > ends) starts = day(yearEnd - 1, startMonth, startDate)
  return starts && starts <= ends ? [starts, ends] : null
}

interface DevpostHackathon {
  id?: unknown
  title?: unknown
  url?: unknown
  thumbnail_url?: unknown
  displayed_location?: { icon?: unknown; location?: unknown }
  submission_period_dates?: unknown
}

function modeFor(icon: unknown, location: string): CandidateMode {
  if (icon === 'globe') return 'online'
  if (/\bonline\b/i.test(location)) return 'hybrid'
  return 'in-person'
}

export function normalize(entry: DevpostHackathon): ImportedEvent | null {
  const id = typeof entry.id === 'number' || typeof entry.id === 'string' ? String(entry.id) : ''
  const name = cleanText(decodeEntities(String(entry.title ?? '')))
  const dates = typeof entry.submission_period_dates === 'string' ? parseDateRange(entry.submission_period_dates) : null
  if (!id || !name || !dates) return null
  const place = cleanText(entry.displayed_location?.location)
  const mode = modeFor(entry.displayed_location?.icon, place)
  return {
    sourceId: id,
    name,
    starts: dates[0],
    ends: dates[1],
    location: mode === 'online' ? 'Online' : place,
    mode,
    url: absoluteUrl(entry.url) ?? '',
    image: absoluteUrl(entry.thumbnail_url),
    raw: entry,
  }
}

export const devpost: Importer = {
  source: 'devpost',
  async fetchEvents(today) {
    const seen = new Map<string, ImportedEvent>()
    for (let page = 1; page <= MAX_PAGES; page++) {
      const response = await politeFetch(
        `${ENDPOINT}?status[]=upcoming&status[]=open&per_page=${PER_PAGE}&page=${page}`,
        'application/json',
      )
      if (!response.ok) throw new Error(`Devpost page ${page} answered ${response.status}`)
      const body = (await response.json()) as { hackathons?: unknown; meta?: { total_count?: unknown } }
      if (!Array.isArray(body.hackathons)) throw new Error(`Devpost page ${page}: no hackathons list (API changed?)`)
      for (const entry of body.hackathons as DevpostHackathon[]) {
        try {
          const event = normalize(entry)
          if (!event) console.warn('devpost: skipped an entry', entry.id, entry.submission_period_dates)
          else if (event.ends >= today) seen.set(event.sourceId, event)
        } catch (error) {
          console.warn('devpost: skipped an entry', error)
        }
      }
      const total = Number(body.meta?.total_count)
      if (body.hackathons.length < PER_PAGE || (Number.isFinite(total) && page * PER_PAGE >= total)) break
      await sleep(500)
    }
    return [...seen.values()]
  },
}
