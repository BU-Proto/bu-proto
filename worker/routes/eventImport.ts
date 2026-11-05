import { Hono } from 'hono'
import { EVENT_IMPORT_BLOCKED, RESOURCE_SPECS, eventImportInput, eventInput, type EventImportPreview } from '../../shared/api'
import { inputToColumns, rowToItem, type DbRow } from '../lib/content'
import { ApiError, readBody } from '../lib/http'
import { fetchEventPage, fetchLumaEvent, parseEventPage, sourceOf } from '../lib/importers/eventPage'
import type { AppEnv } from '../types'

// An event page (Luma, Eventbrite, or any page with schema.org Event data) to an unpublished
// event draft. Lookup shows what import would make; import reads the page again rather than
// taking the preview back from the portal. The cover stays on the source's servers, linked.

const app = new Hono<AppEnv>()

/** Fetch, parse and validate one page. Every failure is a 4xx with a message the admin can act on. */
async function readEvent(url: string, pasted?: string) {
  // Luma first through its API (its pages turn Workers away), then the page itself. Pasted source
  // from the admin's browser skips both: it's for when the site turns us away.
  const viaApi = !pasted && sourceOf(new URL(url)) === 'luma' ? await fetchLumaEvent(url) : null
  let page: { html: string; url: string } = { html: pasted ?? '', url }
  let parsed: ReturnType<typeof parseEventPage>
  if (viaApi) {
    parsed = viaApi
  } else {
    if (!pasted) {
      try {
        page = await fetchEventPage(url)
      } catch (error) {
        const text = error instanceof Error ? error.message : 'Could not read that page.'
        // Turned away: the portal offers to read the page from the admin's own browser instead.
        const blocked = /turned the request away/.test(text)
        throw new ApiError(502, text, blocked ? { [EVENT_IMPORT_BLOCKED]: text } : undefined)
      }
    }
    try {
      parsed = parseEventPage(page.html, page.url)
    } catch (error) {
      throw new ApiError(400, error instanceof Error ? error.message : 'No event on that page.')
    }
  }
  const input = eventInput.safeParse(parsed.event)
  if (!input.success) {
    const issue = input.error.issues[0]
    throw new ApiError(400, `Read the page, but ${issue.path.join('.') || 'a field'}: ${issue.message}`)
  }
  return { url: page.url, source: parsed.source, event: input.data }
}

/** An event with the same title (any case) on the same day. */
async function existingEvent(db: D1Database, title: string, date: string): Promise<number | null> {
  const row = await db
    .prepare(`SELECT id FROM events WHERE lower(trim(title)) = lower(?) AND date = ? ORDER BY id ASC LIMIT 1`)
    .bind(title.trim(), date)
    .first<{ id: number }>()
  return row ? Number(row.id) : null
}

app.post('/api/admin/event-import/lookup', async (c) => {
  const { url, html } = await readBody(c, eventImportInput)
  const read = await readEvent(url, html)
  const preview: EventImportPreview = { ...read, existingEventId: await existingEvent(c.env.DB, read.event.title, read.event.date) }
  return c.json(preview)
})

app.post('/api/admin/event-import/import', async (c) => {
  const { url, html } = await readBody(c, eventImportInput)
  const { event } = await readEvent(url, html)
  const existing = await existingEvent(c.env.DB, event.title, event.date)
  if (existing !== null) throw new ApiError(409, `Already added as event ${existing}.`)
  const spec = RESOURCE_SPECS.events
  const { columns, values } = inputToColumns(spec, event)
  const row = await c.env.DB.prepare(
    `INSERT INTO ${spec.table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')}) RETURNING *`,
  )
    .bind(...values)
    .first<DbRow>()
  if (!row) throw new ApiError(500, 'Could not save the draft.')
  return c.json({ item: rowToItem(spec, row) }, 201)
})

export default app
