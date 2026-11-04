import { CONTENT_RESOURCES, RESOURCE_SPECS, type ContentResource, type FieldSpec, type ResourceSpec } from '../../shared/api'
import { ApiError } from './http'

// Content tables are described once, in RESOURCE_SPECS; everything here reads them so the four
// resources share one code path. Table and column names only ever come from the spec.

export type DbRow = Record<string, unknown>
export type Item = Record<string, unknown>

/** The spec for a :resource param, or 404. */
export function specFor(resource: string): ResourceSpec {
  if (!(CONTENT_RESOURCES as readonly string[]).includes(resource)) throw new ApiError(404, 'Not found.')
  return RESOURCE_SPECS[resource as ContentResource]
}

/**
 * What to select (and RETURN) for admin views. Events carry their RSVP count; it's the one
 * per-resource query, so the portal can show it without a request per row.
 */
export function adminSelect(spec: ResourceSpec): string {
  if (spec.resource !== 'events') return '*'
  return `*, (SELECT COUNT(*) FROM rsvps WHERE rsvps.event_id = ${spec.table}.id) AS rsvp_count`
}

function fromColumn(field: FieldSpec, value: unknown): unknown {
  switch (field.type) {
    case 'boolean':
      return value === 1 || value === true
    case 'number':
      return Number(value)
    case 'list':
    case 'links':
    case 'people':
    case 'images':
      return parseList(value)
    default:
      return value ?? null
  }
}

// A hand-edited row with bad JSON shouldn't take the whole list down.
function parseList(value: unknown): unknown[] {
  try {
    const parsed: unknown = JSON.parse(String(value))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function toColumn(field: FieldSpec, value: unknown): string | number | null {
  switch (field.type) {
    case 'boolean':
      return value ? 1 : 0
    case 'list':
    case 'links':
    case 'people':
    case 'images':
      return JSON.stringify(value ?? [])
    default:
      return (value as string | number | null | undefined) ?? null
  }
}

/** A D1 row as the API object: field keys, plus id/createdAt/updatedAt (and rsvpCount when selected). */
export function rowToItem(spec: ResourceSpec, row: DbRow): Item {
  const item: Item = { id: row.id }
  for (const field of spec.fields) item[field.key] = fromColumn(field, row[field.column])
  item.createdAt = row.created_at
  item.updatedAt = row.updated_at
  if ('rsvp_count' in row) item.rsvpCount = Number(row.rsvp_count)
  return item
}

/** Columns and bound values for a validated input, in spec order. */
export function inputToColumns(spec: ResourceSpec, input: Item): { columns: string[]; values: (string | number | null)[] } {
  return {
    columns: spec.fields.map((field) => field.column),
    values: spec.fields.map((field) => toColumn(field, input[field.key])),
  }
}
