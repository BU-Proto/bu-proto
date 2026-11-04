import { Hono, type Context } from 'hono'
import { fundInterestInput, joinInput, rsvpInput, type RsvpResult } from '../../shared/api'
import { randomToken } from '../lib/crypto'
import { bostonToday } from '../lib/dates'
import { limitForms } from '../lib/forms'
import { ApiError, idParam, readBody } from '../lib/http'
import type { AppEnv } from '../types'

// The three forms the public site posts. None needs a session; all are rate limited per IP.

const app = new Hono<AppEnv>()

/**
 * Whether the hidden `website` field came back filled. The shared schemas would reject that with
 * a 400, which tells a bot exactly what tripped it, so we check first and pretend it worked.
 * Hono caches the parsed body, so readBody can still read it afterwards.
 */
async function isBot(c: Context<AppEnv>): Promise<boolean> {
  const raw: unknown = await c.req.json().catch(() => null)
  if (typeof raw !== 'object' || raw === null || !('website' in raw)) return false
  const { website } = raw
  return website !== undefined && website !== null && website !== ''
}

app.post('/api/join', limitForms, async (c) => {
  if (await isBot(c)) return c.json({ ok: true }, 201)
  const input = await readBody(c, joinInput)
  const token = randomToken()
  // On conflict the stored token survives, so getting ours back means the row is new.
  const row = await c.env.DB.prepare(
    `INSERT INTO members (name, email, year, track, unsubscribe_token) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (email) DO UPDATE SET
       name = excluded.name, year = excluded.year, track = excluded.track,
       unsubscribed = 0, updated_at = datetime('now')
     RETURNING unsubscribe_token = ? AS inserted`,
  )
    .bind(input.name, input.email, input.year, input.track, token, token)
    .first<{ inserted: number }>()
  return c.json({ ok: true }, row?.inserted ? 201 : 200)
})

app.post('/api/fund-interest', limitForms, async (c) => {
  if (await isBot(c)) return c.json({ ok: true }, 201)
  const input = await readBody(c, fundInterestInput)
  await c.env.DB.prepare(
    'INSERT INTO fund_interest (name, email, year, target, spend, amount) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(input.name, input.email, input.year, input.target, input.spend, input.amount)
    .run()
  return c.json({ ok: true }, 201)
})

app.post('/api/events/:id/rsvp', limitForms, async (c) => {
  const id = idParam(c)
  const event = await c.env.DB.prepare('SELECT date FROM events WHERE id = ? AND published = 1')
    .bind(id)
    .first<{ date: string }>()
  if (!event) throw new ApiError(404, 'That event isn’t on the calendar.')
  if (event.date < bostonToday()) throw new ApiError(400, 'That event has already happened.')

  const countRsvps = c.env.DB.prepare('SELECT COUNT(*) AS count FROM rsvps WHERE event_id = ?').bind(id)
  if (await isBot(c)) {
    const row = await countRsvps.first<{ count: number }>()
    return c.json({ ok: true, count: row?.count ?? 0 } satisfies RsvpResult, 201)
  }

  const input = await readBody(c, rsvpInput)
  const [insert, count] = await c.env.DB.batch<{ count: number }>([
    c.env.DB.prepare('INSERT INTO rsvps (event_id, name, email) VALUES (?, ?, ?) ON CONFLICT DO NOTHING').bind(
      id,
      input.name,
      input.email,
    ),
    countRsvps,
  ])
  const result: RsvpResult = { ok: true, count: count.results[0]?.count ?? 0 }
  return c.json(result, insert.meta.changes > 0 ? 201 : 200)
})

export default app
