import type { Win } from '../../shared/api'

/** A win as the showcase sets it: the prize first, then where it was won. */
export interface Accolade {
  /** The prize itself, e.g. "Third Place Overall" or "Best Web API". */
  prize: string
  /** A placement pulled out of the prize, e.g. "1st Place" from "Best Web API (1st Place)". */
  rank: string
  /** A quieter second line: the track, or the sponsor when the prize doesn't name it. */
  note: string
  /** The hackathon, without its theme: "HackHarvard 2026", not "HackHarvard2026: Hack to the Moon". */
  hackathon: string
  /** Lower is bigger: overall placements first, then first places in a track. Infinity for the rest. */
  weight: number
}

const PLACE = /\b(1st|2nd|3rd|first|second|third)\s+place\b/i
const PLACE_NUMBER: Record<string, number> = { '1st': 1, first: 1, '2nd': 2, second: 2, '3rd': 3, third: 3 }
const OVERALL = /\b(overall|grand prize)\b/i

/**
 * Placements arrive the way Devpost writes them ("Track: Best Web API (1st Place)", "[Notability]
 * Best Use of Notability"), so tidy them for display without changing what's stored.
 */
export function accoladeOf(win: Win): Accolade {
  let prize = win.placement.trim().replace(/^track:\s*/i, '')
  let sponsor = ''
  const bracket = prize.match(/^\[([^\]]+)\]\s*(.+)$/)
  if (bracket) {
    sponsor = bracket[1].trim()
    prize = bracket[2].trim()
  }
  let rank = ''
  const paren = prize.match(/^(.+?)\s*\(([^)]*\bplace\b[^)]*)\)$/i)
  if (paren) {
    prize = paren[1].trim()
    rank = paren[2].trim()
  }

  const track = (win.track ?? '').trim()
  const note = track || (sponsor && !prize.toLowerCase().includes(sponsor.toLowerCase()) ? sponsor : '')

  const placed = `${rank} ${prize}`.match(PLACE)
  const place = placed ? (PLACE_NUMBER[placed[1].toLowerCase()] ?? 9) : 0
  const overall = OVERALL.test(prize)
  const weight = overall ? place || 0 : place === 1 ? 10 : Infinity

  return { prize, rank, note, hackathon: hackathonName(win.event), weight }
}

/** "HackHarvard2026: Hack to the Moon" reads as "HackHarvard 2026". */
export function hackathonName(event: string): string {
  const name = event.split(':')[0]?.trim() || event.trim()
  return name.replace(/([a-z])(20\d\d)\b/i, '$1 $2')
}

export const isFeatured = (win: Win) => Number.isFinite(accoladeOf(win).weight)

/**
 * The showcase's order: the big placements first, biggest at the top, then everything else in
 * the order the portal gives them. With nothing big, the first win leads so the page still opens
 * on one.
 */
export function showcaseOrder(wins: readonly Win[]): { featured: Win[]; rest: Win[] } {
  const featured = wins
    .filter(isFeatured)
    .sort((a, b) => accoladeOf(a).weight - accoladeOf(b).weight)
  if (featured.length === 0) return { featured: wins.slice(0, 1), rest: wins.slice(1) }
  return { featured, rest: wins.filter((win) => !featured.includes(win)) }
}

export type TeamPart = { kind: 'name'; text: string; bu: boolean } | { kind: 'text'; text: string }

/**
 * "Maya, Jordan and Priya", or the first `max - 1` and a count once the team gets long, as parts so
 * each name can carry its BU mark. Rows from before the flag existed have no `bu`: not BU.
 */
export function teamParts(team: Win['team'], max = 4): TeamPart[] {
  const people = (team ?? []).filter((person) => person.name.trim())
  if (people.length === 0) return []
  const shown = people.length > max ? people.slice(0, max - 1) : people
  const more = people.length - shown.length
  const items = [...shown.map((person) => person.name.trim()), ...(more ? [`${more} more`] : [])]
  let index = 0
  return new Intl.ListFormat('en', { type: 'conjunction' }).formatToParts(items).map((part): TeamPart => {
    if (part.type === 'literal') return { kind: 'text', text: part.value }
    const person = shown[index++]
    return person ? { kind: 'name', text: part.value, bu: person.bu === true } : { kind: 'text', text: part.value }
  })
}
