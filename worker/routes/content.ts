import { Hono, type Context } from 'hono'
import { CONTENT_INPUTS, type ResourceSpec, type Rsvp } from '../../shared/api'
import { adminSelect, inputToColumns, rowToItem, specFor, type DbRow, type Item } from '../lib/content'
import { ApiError, idParam, readBody } from '../lib/http'
import type { AppEnv } from '../types'

// Content the portal edits (events, hackathons, wins, board), driven by RESOURCE_SPECS, plus the
// admin view of event RSVPs.

const app = new Hono<AppEnv>()

/** Validate a content body against its schema, plus the rules a single field can't express. */
async function readContent(c: Context<AppEnv>, spec: ResourceSpec): Promise<Item> {
  const input = (await readBody(c, CONTENT_INPUTS[spec.resource])) as Item
  if (spec.resource === 'hackathons' && String(input.ends) < String(input.starts)) {
    throw new ApiError(400, 'Check the highlighted fields.', { ends: 'Ends before it starts' })
  }
  return input
}

// Public site: published rows only. no-store so an edit in the portal shows up on the next load.
app.get('/api/content/:resource', async (c) => {
  const spec = specFor(c.req.param('resource'))
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM ${spec.table} WHERE published = 1 ORDER BY ${spec.orderBy}`,
  ).all<DbRow>()
  c.header('Cache-Control', 'no-store')
  return c.json({ items: results.map((row) => rowToItem(spec, row)) })
})

// One published row, for detail pages like /wins/:id.
app.get('/api/content/:resource/:id', async (c) => {
  const spec = specFor(c.req.param('resource'))
  const row = await c.env.DB.prepare(`SELECT * FROM ${spec.table} WHERE id = ? AND published = 1`)
    .bind(idParam(c))
    .first<DbRow>()
  if (!row) throw new ApiError(404, 'Not found.')
  c.header('Cache-Control', 'no-store')
  return c.json({ item: rowToItem(spec, row) })
})

app.get('/api/admin/content/:resource', async (c) => {
  const spec = specFor(c.req.param('resource'))
  const { results } = await c.env.DB.prepare(`SELECT ${adminSelect(spec)} FROM ${spec.table} ORDER BY ${spec.orderBy}`).all<DbRow>()
  return c.json({ items: results.map((row) => rowToItem(spec, row)) })
})

app.post('/api/admin/content/:resource', async (c) => {
  const spec = specFor(c.req.param('resource'))
  const { columns, values } = inputToColumns(spec, await readContent(c, spec))
  const row = await c.env.DB.prepare(
    `INSERT INTO ${spec.table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})
     RETURNING ${adminSelect(spec)}`,
  )
    .bind(...values)
    .first<DbRow>()
  if (!row) throw new ApiError(500, 'Could not save that.')
  return c.json({ item: rowToItem(spec, row) }, 201)
})

app.put('/api/admin/content/:resource/:id', async (c) => {
  const spec = specFor(c.req.param('resource'))
  const id = idParam(c)
  const { columns, values } = inputToColumns(spec, await readContent(c, spec))
  const row = await c.env.DB.prepare(
    `UPDATE ${spec.table} SET ${columns.map((column) => `${column} = ?`).join(', ')}, updated_at = datetime('now')
     WHERE id = ? RETURNING ${adminSelect(spec)}`,
  )
    .bind(...values, id)
    .first<DbRow>()
  if (!row) throw new ApiError(404, 'Not found.')
  return c.json({ item: rowToItem(spec, row) })
})

app.delete('/api/admin/content/:resource/:id', async (c) => {
  const spec = specFor(c.req.param('resource'))
  const id = idParam(c)
  const { meta } = await c.env.DB.prepare(`DELETE FROM ${spec.table} WHERE id = ?`).bind(id).run()
  if (!meta.changes) throw new ApiError(404, 'Not found.')
  return c.body(null, 204)
})

app.get('/api/admin/events/:id/rsvps', async (c) => {
  const id = idParam(c)
  const event = await c.env.DB.prepare('SELECT 1 FROM events WHERE id = ?').bind(id).first()
  if (!event) throw new ApiError(404, 'Not found.')
  const { results } = await c.env.DB.prepare(
    'SELECT id, event_id, name, email, created_at FROM rsvps WHERE event_id = ? ORDER BY created_at ASC, id ASC',
  )
    .bind(id)
    .all<{ id: number; event_id: number; name: string; email: string; created_at: string }>()
  const items: Rsvp[] = results.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  }))
  return c.json({ items })
})

app.delete('/api/admin/rsvps/:id', async (c) => {
  const { meta } = await c.env.DB.prepare('DELETE FROM rsvps WHERE id = ?').bind(idParam(c)).run()
  if (!meta.changes) throw new ApiError(404, 'Not found.')
  return c.body(null, 204)
})

export default app
