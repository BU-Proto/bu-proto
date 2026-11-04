import { Hono } from 'hono'
import { z } from 'zod'
import {
  CANDIDATE_STATUSES,
  IMPORT_COOLDOWN_MINUTES,
  RESOURCE_SPECS,
  candidateQuery,
  hackathonInput,
  type CandidateMode,
  type CandidateStatus,
  type HackathonCandidate,
  type ImportSource,
} from '../../shared/api'
import { inputToColumns, rowToItem, type DbRow } from '../lib/content'
import { bostonToday } from '../lib/dates'
import { ApiError, idParam } from '../lib/http'
import { isNearBoston } from '../lib/importers/common'
import { runImports, runToApi, type RunRow } from '../lib/importers'
import type { AppEnv } from '../types'

// The review queue for hackathons imported from MLH and Devpost. Nothing here publishes: adding a
// candidate makes an unpublished draft for an admin to finish (apply-by, travel, BU going).

const app = new Hono<AppEnv>()

interface CandidateRow {
  id: number
  source: string
  source_id: string
  name: string
  starts: string
  ends: string
  location: string
  mode: string
  url: string
  image: string | null
  status: string
  hackathon_id: number | null
  first_seen_at: string
  last_seen_at: string
}

const COLUMNS = 'id, source, source_id, name, starts, ends, location, mode, url, image, status, hackathon_id, first_seen_at, last_seen_at'

function toCandidate(row: CandidateRow): HackathonCandidate {
  const mode = row.mode as CandidateMode
  return {
    id: row.id,
    source: row.source as ImportSource,
    sourceId: row.source_id,
    name: row.name,
    starts: row.starts,
    ends: row.ends,
    location: row.location,
    mode,
    url: row.url,
    image: row.image,
    status: row.status as CandidateStatus,
    hackathonId: row.hackathon_id,
    nearBoston: isNearBoston(row.location, mode),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
  }
}

async function findCandidate(db: D1Database, id: number): Promise<CandidateRow> {
  const row = await db.prepare(`SELECT ${COLUMNS} FROM hackathon_candidates WHERE id = ?`).bind(id).first<CandidateRow>()
  if (!row) throw new ApiError(404, 'Not found.')
  return row
}

// One query for every status, so the tabs can show counts under the same filters.
app.get('/api/admin/hackathon-imports', async (c) => {
  const parsed = candidateQuery.safeParse(c.req.query())
  if (!parsed.success) throw new ApiError(400, 'Unknown filter.')
  const { status, mode, near } = parsed.data
  const { results } = await c.env.DB.prepare(
    `SELECT ${COLUMNS} FROM hackathon_candidates WHERE ends >= ?1 AND (?2 IS NULL OR mode = ?2) ORDER BY starts ASC, id ASC`,
  )
    .bind(bostonToday(), mode ?? null)
    .all<CandidateRow>()
  const filtered = results.map(toCandidate).filter((candidate) => !near || candidate.nearBoston)
  const counts = Object.fromEntries(CANDIDATE_STATUSES.map((value) => [value, 0])) as Record<CandidateStatus, number>
  for (const candidate of filtered) counts[candidate.status]++
  return c.json({ items: filtered.filter((candidate) => candidate.status === status), counts })
})

app.get('/api/admin/hackathon-imports/runs', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM import_runs AS r
     WHERE id IN (SELECT id FROM import_runs WHERE source = r.source ORDER BY id DESC LIMIT 5)
     ORDER BY id DESC`,
  ).all<RunRow>()
  return c.json({ items: results.map(runToApi) })
})

app.post('/api/admin/hackathon-imports/run', async (c) => {
  // The sources are other people's servers: a run in progress or one just finished is enough.
  const recent = await c.env.DB.prepare(
    `SELECT 1 FROM import_runs WHERE COALESCE(finished_at, started_at) > datetime('now', ?)`,
  )
    .bind(`-${IMPORT_COOLDOWN_MINUTES} minutes`)
    .first()
  if (recent) throw new ApiError(429, `Checked in the last ${IMPORT_COOLDOWN_MINUTES} minutes. Try again in a few.`)
  return c.json({ items: await runImports(c.env) }, 201)
})

const asUrl = z.url()

app.post('/api/admin/hackathon-imports/:id/add', async (c) => {
  const id = idParam(c)
  const candidate = await findCandidate(c.env.DB, id)
  if (candidate.status === 'added' && candidate.hackathon_id !== null) {
    throw new ApiError(409, 'Already added as a hackathon.')
  }
  const spec = RESOURCE_SPECS.hackathons
  // Unpublished and not a sample; apply-by is a stand-in the admin has to correct.
  const input = hackathonInput.safeParse({
    name: candidate.name.slice(0, 80),
    starts: candidate.starts,
    ends: candidate.ends < candidate.starts ? candidate.starts : candidate.ends,
    location: (candidate.location || (candidate.mode === 'online' ? 'Online' : 'To be announced')).slice(0, 80),
    applyBy: candidate.starts,
    travelCovered: false,
    buGoing: 0,
    href: asUrl.safeParse(candidate.url).success ? candidate.url : '',
    placeholder: false,
    published: false,
  })
  if (!input.success) throw new ApiError(422, 'This import is missing details a hackathon needs.')
  const { columns, values } = inputToColumns(spec, input.data)
  // One transaction: the draft and the candidate's link to it land together or not at all.
  const [inserted, updated] = await c.env.DB.batch<DbRow>([
    c.env.DB.prepare(
      `INSERT INTO ${spec.table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')}) RETURNING *`,
    ).bind(...values),
    c.env.DB.prepare(
      `UPDATE hackathon_candidates SET status = 'added', hackathon_id = last_insert_rowid() WHERE id = ? RETURNING ${COLUMNS}`,
    ).bind(id),
  ])
  const hackathon = inserted.results[0]
  const row = updated.results[0] as unknown as CandidateRow | undefined
  if (!hackathon || !row) throw new ApiError(500, 'Could not add that.')
  return c.json({ item: rowToItem(spec, hackathon), candidate: toCandidate(row) }, 201)
})

app.post('/api/admin/hackathon-imports/:id/dismiss', async (c) => {
  const id = idParam(c)
  const candidate = await findCandidate(c.env.DB, id)
  if (candidate.status !== 'new') throw new ApiError(409, 'Only new imports can be dismissed.')
  const row = await c.env.DB.prepare(`UPDATE hackathon_candidates SET status = 'dismissed' WHERE id = ? RETURNING ${COLUMNS}`)
    .bind(id)
    .first<CandidateRow>()
  if (!row) throw new ApiError(404, 'Not found.')
  return c.json({ item: toCandidate(row) })
})

// Back to 'new': a dismissal undone, or an added one whose draft was deleted.
app.post('/api/admin/hackathon-imports/:id/restore', async (c) => {
  const id = idParam(c)
  const candidate = await findCandidate(c.env.DB, id)
  const restorable = candidate.status === 'dismissed' || (candidate.status === 'added' && candidate.hackathon_id === null)
  if (!restorable) throw new ApiError(409, 'Nothing to restore.')
  const row = await c.env.DB.prepare(
    `UPDATE hackathon_candidates SET status = 'new', hackathon_id = NULL WHERE id = ? RETURNING ${COLUMNS}`,
  )
    .bind(id)
    .first<CandidateRow>()
  if (!row) throw new ApiError(404, 'Not found.')
  return c.json({ item: toCandidate(row) })
})

export default app
