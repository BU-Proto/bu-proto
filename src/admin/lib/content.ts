import { data } from 'react-router'
import { CONTENT_RESOURCES, RESOURCE_SPECS, type ContentResource, type FieldSpec, type ResourceSpec } from '../../../shared/api'

/** A content row as the portal handles it: whatever the spec says, plus the row columns. */
export type ContentRow = Record<string, unknown> & {
  id: number
  placeholder: boolean
  published: boolean
  createdAt: string
  updatedAt: string
  rsvpCount?: number
}

/** The spec for /admin/:resource, or a 404 for anything that isn't a content type. */
export function specFor(resource: string | undefined): ResourceSpec {
  if (!resource || !(CONTENT_RESOURCES as readonly string[]).includes(resource)) {
    throw data('Not found', { status: 404, statusText: 'Not found' })
  }
  return RESOURCE_SPECS[resource as ContentResource]
}

// ---- Editor values ------------------------------------------------------------------------
// The form keeps text where the user types text: numbers stay strings until save, and list
// fields are one textarea. toPayload turns that back into what the contract expects.

export interface LinkValue {
  label: string
  href: string
}

/** A teammate in the form. href is '' until it's filled in; the API turns '' into null. */
export interface PersonValue {
  name: string
  href: string
}

/** Arrays of strings are image lists; list fields stay one textarea, so they're plain strings. */
export type FormValue = string | boolean | LinkValue[] | PersonValue[] | string[]
export type FormValues = Record<string, FormValue>

// Mirrors the .max() in shared/api.ts, so the add buttons stop where the API would refuse.
export const MAX_PEOPLE = 12
export const MAX_IMAGES = 24

/** A full URL or a /path, the two things an image field takes. */
export const looksLikeImage = (value: string) => /^(https?:\/\/|\/)\S+$/.test(value)

/** The list with one item moved from one place to another. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function emptyValue(resource: ContentResource, field: FieldSpec): FormValue {
  switch (field.type) {
    case 'boolean':
      return field.key === 'published'
    case 'number':
      return '0'
    case 'select':
      return resource === 'events' && field.key === 'kind' ? 'Hack night' : (field.options?.[0] ?? '')
    case 'links':
    case 'people':
    case 'images':
      return []
    default:
      return ''
  }
}

export function toForm(spec: ResourceSpec, row: ContentRow | null): FormValues {
  const values: FormValues = {}
  for (const field of spec.fields) {
    const value = row?.[field.key]
    if (value === undefined || value === null) {
      values[field.key] = emptyValue(spec.resource, field)
      continue
    }
    switch (field.type) {
      case 'boolean':
        values[field.key] = Boolean(value)
        break
      case 'list':
        values[field.key] = Array.isArray(value) ? value.join('\n') : String(value)
        break
      case 'links':
        values[field.key] = Array.isArray(value) ? (value as LinkValue[]).map((link) => ({ label: link.label ?? '', href: link.href ?? '' })) : []
        break
      case 'people':
        // A bare name is how teams were stored before they could link out; keep reading it.
        values[field.key] = Array.isArray(value)
          ? value.map((person: unknown) =>
              typeof person === 'string'
                ? { name: person, href: '' }
                : { name: String((person as PersonValue).name ?? ''), href: String((person as PersonValue).href ?? '') },
            )
          : []
        break
      case 'images':
        values[field.key] = Array.isArray(value) ? value.map(String) : []
        break
      default:
        values[field.key] = String(value)
    }
  }
  return values
}

export function toPayload(spec: ResourceSpec, values: FormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const field of spec.fields) {
    const value = values[field.key]
    switch (field.type) {
      case 'number': {
        const text = String(value).trim()
        // Anything that isn't a number goes through as-is so the API names the field.
        payload[field.key] = text !== '' && Number.isFinite(Number(text)) ? Number(text) : text
        break
      }
      case 'list':
        payload[field.key] = String(value)
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
        break
      case 'links':
        // Blank rows go through too, so issue keys like links.1.href still point at the row on screen.
        payload[field.key] = (value as LinkValue[]).map((link) => ({ label: link.label.trim(), href: link.href.trim() }))
        break
      case 'people':
        // Same for people: an empty link goes as '', which the API stores as no link.
        payload[field.key] = (value as PersonValue[]).map((person) => ({ name: person.name.trim(), href: person.href.trim() }))
        break
      case 'images':
        payload[field.key] = (value as string[]).map((src) => src.trim())
        break
      case 'boolean':
        payload[field.key] = Boolean(value)
        break
      default:
        payload[field.key] = typeof value === 'string' ? value.trim() : value
    }
  }
  return payload
}

/** The first issue for a key or anything under it (team.2 counts for team). */
export function issueFor(issues: Record<string, string>, key: string): string | undefined {
  if (issues[key]) return issues[key]
  const nested = Object.keys(issues).find((issueKey) => issueKey.startsWith(`${key}.`))
  return nested && issues[nested]
}

/** The row's value for a list column. */
export function displayValue(field: FieldSpec | undefined, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (field?.type === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    // People and links are objects; show the name or label.
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return String(item)
        const named = item as { name?: unknown; label?: unknown }
        return String(named.name ?? named.label ?? '')
      })
      .join(', ')
  }
  return String(value)
}

// ---- Editor layout ------------------------------------------------------------------------
// The contract lists fields in one flat order. Long editors read better in sections, so the
// portal groups them here by key. A resource with no plan gets one untitled section, as before.

export interface FieldLayout {
  /** Take the whole row even when the type would pair up. */
  wide?: boolean
  /** Textarea height, for fields that hold more than a line or two. */
  rows?: number
}

interface SectionPlan {
  title: string
  hint?: string
  keys: string[]
}

export interface FieldSection {
  title: string | null
  hint?: string
  fields: FieldSpec[]
}

const SECTIONS: Partial<Record<ContentResource, SectionPlan[]>> = {
  events: [
    { title: 'Basics', keys: ['title', 'kind', 'date', 'time', 'place', 'text'] },
    { title: 'Event page', hint: 'The write-up on the event’s own page.', keys: ['description', 'agenda', 'hosts'] },
    { title: 'Photos', keys: ['photo', 'gallery'] },
    { title: 'Publishing', keys: ['placeholder', 'published'] },
  ],
  hackathons: [
    { title: 'Basics', keys: ['name', 'starts', 'ends', 'location', 'applyBy', 'href'] },
    { title: 'The trip', keys: ['travelCovered', 'buGoing', 'trip', 'tripSignup'] },
    { title: 'Hackathon page', hint: 'The write-up on the hackathon’s own page.', keys: ['description'] },
    { title: 'Photos', keys: ['photo', 'gallery'] },
    { title: 'Publishing', keys: ['placeholder', 'published'] },
  ],
  wins: [
    { title: 'Basics', keys: ['project', 'blurb', 'event', 'placement', 'track'] },
    { title: 'People', keys: ['team'] },
    { title: 'Story', hint: 'The write-up on the project page.', keys: ['description', 'stack', 'nextSteps', 'funding'] },
    { title: 'Links', keys: ['github', 'devpost'] },
    { title: 'Photos', keys: ['photo', 'gallery'] },
    { title: 'Publishing', keys: ['position', 'placeholder', 'published'] },
  ],
}

const LAYOUT: Partial<Record<ContentResource, Record<string, FieldLayout>>> = {
  events: {
    place: { wide: true },
    description: { rows: 8 },
    agenda: { rows: 6 },
  },
  hackathons: {
    href: { wide: true },
    description: { rows: 8 },
    trip: { rows: 5 },
    tripSignup: { wide: true },
  },
  wins: {
    event: { wide: true },
    funding: { wide: true },
    description: { rows: 10 },
    nextSteps: { rows: 4 },
  },
}

export function sectionsFor(spec: ResourceSpec): FieldSection[] {
  const plan = SECTIONS[spec.resource]
  if (!plan) return [{ title: null, fields: [...spec.fields] }]
  const byKey = new Map(spec.fields.map((field) => [field.key, field]))
  const placed = new Set<string>()
  const sections: FieldSection[] = plan.map(({ title, hint, keys }) => ({
    title,
    hint,
    fields: keys.flatMap((key) => {
      const field = byKey.get(key)
      if (!field) return []
      placed.add(key)
      return [field]
    }),
  }))
  // A field the contract adds later still shows up, just before publishing, until it gets a home.
  const rest = spec.fields.filter((field) => !placed.has(field.key))
  if (rest.length) sections.splice(sections.length - 1, 0, { title: 'More', fields: rest })
  return sections.filter((section) => section.fields.length > 0)
}

export function layoutFor(resource: ContentResource, key: string): FieldLayout {
  return LAYOUT[resource]?.[key] ?? {}
}

/** Where a saved row lives on the public site, for resources that have their own page. */
export function sitePathFor(resource: ContentResource, row: ContentRow | null): string | null {
  if (!row?.published) return null
  return resource === 'board' ? null : `/${resource}/${row.id}`
}
