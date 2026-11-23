import type { Context } from 'hono'
import type { z } from 'zod'
import { parsePersonKey, type FollowUp, type PersonRef } from '../../shared/api'
import { personLink, sentFields, type PersonColumns } from './crmRows'
import { ApiError, parseInput } from './http'

// SQL and request pieces the Pipeline and Activity routes share: follow-ups as rows, people looked
// up from their keys, and PATCH bodies read without zod's defaults.

export interface FollowUpRow extends PersonColumns {
  id: number
  title: string
  due_on: string
  owner_email: string
  done_at: string | null
  org_id: number | null
  org_name: string | null
  deal_id: number | null
  deal_title: string | null
  created_by: string
  created_at: string
}

/** Every follow-up column the contract needs; callers add WHERE and ORDER BY. */
export const FOLLOW_UP_SELECT = `
  SELECT f.id, f.title, f.due_on, f.owner_email, f.done_at, f.member_id, m.name AS member_name, f.contact_id,
    ct.name AS contact_name, co.name AS contact_org_name, f.org_id, o.name AS org_name, f.deal_id, d.title AS deal_title,
    f.created_by, f.created_at
  FROM follow_ups f
  LEFT JOIN members m ON m.id = f.member_id
  LEFT JOIN contacts ct ON ct.id = f.contact_id
  LEFT JOIN orgs co ON co.id = ct.org_id
  LEFT JOIN orgs o ON o.id = f.org_id
  LEFT JOIN deals d ON d.id = f.deal_id`

export const toFollowUp = (row: FollowUpRow): FollowUp => ({
  id: row.id,
  title: row.title,
  dueOn: row.due_on,
  ownerEmail: row.owner_email,
  doneAt: row.done_at,
  person: personLink(row),
  orgId: row.org_id,
  orgName: row.org_name,
  dealId: row.deal_id,
  dealTitle: row.deal_title,
  createdBy: row.created_by,
  createdAt: row.created_at,
})

/** A person found from their key, with the org a contact works at (members have none). */
export interface FoundPerson {
  ref: PersonRef
  name: string
  /** contacts.kind for a contact; 'member' for a member. */
  kind: 'member' | 'contact' | 'lead' | 'alum'
  orgId: number | null
  ownerEmail: string | null
}

/** The person behind a key, or a 400 on `field` saying they're gone. */
export async function findPerson(db: D1Database, key: string, field: string): Promise<FoundPerson> {
  const ref = parsePersonKey(key)
  const gone = () => new ApiError(400, 'Check the highlighted fields.', { [field]: 'That person is no longer in People.' })
  if (!ref) throw gone()
  if (ref.type === 'member') {
    const row = await db.prepare('SELECT name, owner_email FROM members WHERE id = ?').bind(ref.id).first<{ name: string; owner_email: string | null }>()
    if (!row) throw gone()
    return { ref, name: row.name, kind: 'member', orgId: null, ownerEmail: row.owner_email }
  }
  const row = await db
    .prepare('SELECT name, kind, org_id, owner_email FROM contacts WHERE id = ?')
    .bind(ref.id)
    .first<{ name: string; kind: FoundPerson['kind']; org_id: number | null; owner_email: string | null }>()
  if (!row) throw gone()
  return { ref, name: row.name, kind: row.kind, orgId: row.org_id, ownerEmail: row.owner_email }
}

/** The org a deal is with, or a 400 on dealId when it's gone. */
export async function dealOrg(db: D1Database, dealId: number): Promise<number> {
  const row = await db.prepare('SELECT org_id FROM deals WHERE id = ?').bind(dealId).first<{ org_id: number }>()
  if (!row) throw new ApiError(400, 'Check the highlighted fields.', { dealId: 'That deal no longer exists.' })
  return row.org_id
}

export async function checkOrg(db: D1Database, orgId: number): Promise<void> {
  const row = await db.prepare('SELECT id FROM orgs WHERE id = ?').bind(orgId).first()
  if (!row) throw new ApiError(400, 'Check the highlighted fields.', { orgId: 'That org no longer exists.' })
}

/**
 * Read a PATCH body against one of the contract's partial schemas and keep only the fields it
 * sent (see sentFields). Nothing sent is a 400, so an empty PATCH never just bumps updated_at.
 */
export async function readPatch<S extends z.ZodType<Record<string, unknown>>>(c: Context, schema: S): Promise<Partial<z.output<S>>> {
  let raw: unknown
  try {
    raw = await c.req.json()
  } catch {
    throw new ApiError(400, 'Send a JSON body.')
  }
  const fields = sentFields(parseInput(schema, raw) as z.output<S>, raw)
  if (Object.keys(fields).length === 0) throw new ApiError(400, 'Nothing to change.')
  return fields
}

/** The WHERE clause a ?personKey= filter adds on a table with member_id and contact_id columns. */
export function personFilter(alias: string, key: string | undefined): { sql: string; value: number } | null {
  const ref = key ? parsePersonKey(key) : null
  if (!ref) return null
  return { sql: `${alias}.${ref.type === 'member' ? 'member_id' : 'contact_id'} = ?`, value: ref.id }
}

/** A positive integer from a query string, or undefined. */
export function queryId(value: string | undefined): number | undefined {
  const id = Number(value)
  return value && Number.isInteger(id) && id > 0 ? id : undefined
}
