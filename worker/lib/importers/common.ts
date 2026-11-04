import type { CandidateMode, ImportSource } from '../../../shared/api'

// What every importer hands the runner, and the small helpers both parsers share.

/** One upcoming event, normalized. Days are ISO (yyyy-mm-dd). */
export interface ImportedEvent {
  sourceId: string
  name: string
  starts: string
  ends: string
  location: string
  mode: CandidateMode
  url: string
  image: string | null
  raw: unknown
}

export interface Importer {
  source: ImportSource
  /** Every event the source lists that hasn't ended by `today`. Throws when the source itself fails. */
  fetchEvents(today: string): Promise<ImportedEvent[]>
}

/** Sent with every request, so the sources can tell who we are and how to reach us. */
export const USER_AGENT = 'bu-proto-importer (+https://github.com/Jose-Gael-Cruz-Lopez/bu-proto)'

/** GET a URL with our User-Agent and a timeout. Returns the response whatever its status. */
export function politeFetch(url: string, accept: string): Promise<Response> {
  return fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: accept },
    signal: AbortSignal.timeout(20_000),
  })
}

export const isIsoDay = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

/** Collapse whitespace and the stray " ," that hand-typed locations carry ("Wellesley , MA"). */
export function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim() : ''
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

export function decodeEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const point = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(point) ? String.fromCodePoint(point) : match
    }
    return ENTITIES[code.toLowerCase()] ?? match
  })
}

/** A full http(s) URL, or null. Protocol-relative ones ("//cdn…") get https. */
export function absoluteUrl(value: unknown, base?: string): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value.startsWith('//') ? `https:${value}` : value, base)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

// Close enough for a weekend trip from Boston: New England, New York, New Jersey, Pennsylvania.
// Abbreviations are matched in capitals only, so "Pa" or "me" inside a venue name don't count.
const NEAR_ABBREVIATIONS = /\b(MA|RI|NH|CT|NY|PA|NJ|ME|VT)\b/
const NEAR_NAMES = /\b(mass\w*|rhode island|new hampshire|connecticut|new york|pennsylvania|new jersey|maine|vermont|boston|cambridge)\b/i
const ABROAD = /\b(uk|united kingdom|england|canada|ontario)\b/i

export function isNearBoston(location: string, mode: CandidateMode): boolean {
  if (mode === 'online' || ABROAD.test(location)) return false
  return NEAR_ABBREVIATIONS.test(location) || NEAR_NAMES.test(location)
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
