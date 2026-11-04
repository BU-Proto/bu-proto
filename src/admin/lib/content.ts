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

export type FormValue = string | boolean | LinkValue[]
export type FormValues = Record<string, FormValue>

function emptyValue(resource: ContentResource, field: FieldSpec): FormValue {
  switch (field.type) {
    case 'boolean':
      return field.key === 'published'
    case 'number':
      return '0'
    case 'select':
      return resource === 'events' && field.key === 'kind' ? 'Hack night' : (field.options?.[0] ?? '')
    case 'links':
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
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}
