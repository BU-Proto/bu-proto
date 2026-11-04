import type { ImportRun, ImportSource } from '../../../shared/api'
import { bostonToday } from '../dates'
import type { ImportedEvent, Importer } from './common'
import { devpost } from './devpost'
import { mlh } from './mlh'

// Runs every importer, each on its own, and logs one import_runs row per source. A source that
// fails records its error and leaves the other's results standing.

export const IMPORTERS: readonly Importer[] = [mlh, devpost]

/** Rows still 'new' take the source's latest details; added and dismissed rows are left alone. */
const UPSERT = `
  INSERT INTO hackathon_candidates (source, source_id, name, starts, ends, location, mode, url, image, raw)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (source, source_id) DO UPDATE SET
    name = excluded.name, starts = excluded.starts, ends = excluded.ends, location = excluded.location,
    mode = excluded.mode, url = excluded.url, image = excluded.image, raw = excluded.raw,
    last_seen_at = datetime('now')
  WHERE hackathon_candidates.status = 'new'`

const BATCH_SIZE = 100

export interface RunRow {
  id: number
  source: string
  started_at: string
  finished_at: string | null
  found: number
  new: number
  error: string | null
}

export function runToApi(row: RunRow): ImportRun {
  return {
    id: row.id,
    source: row.source as ImportSource,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    found: Number(row.found),
    new: Number(row.new),
    error: row.error,
  }
}

async function countFor(db: D1Database, source: string): Promise<number> {
  const row = await db.prepare('SELECT COUNT(*) AS n FROM hackathon_candidates WHERE source = ?').bind(source).first<{ n: number }>()
  return Number(row?.n ?? 0)
}

async function save(db: D1Database, source: string, events: ImportedEvent[]) {
  const statements = events.map((event) =>
    db
      .prepare(UPSERT)
      .bind(
        source,
        event.sourceId,
        event.name,
        event.starts,
        event.ends,
        event.location,
        event.mode,
        event.url,
        event.image,
        JSON.stringify(event.raw ?? {}).slice(0, 20_000),
      ),
  )
  for (let i = 0; i < statements.length; i += BATCH_SIZE) await db.batch(statements.slice(i, i + BATCH_SIZE))
}

async function runOne(db: D1Database, importer: Importer, today: string): Promise<ImportRun> {
  const started = await db
    .prepare('INSERT INTO import_runs (source) VALUES (?) RETURNING id')
    .bind(importer.source)
    .first<{ id: number }>()
  const runId = started?.id
  let found = 0
  let added = 0
  let error: string | null = null
  try {
    const events = await importer.fetchEvents(today)
    found = events.length
    const before = await countFor(db, importer.source)
    await save(db, importer.source, events)
    added = (await countFor(db, importer.source)) - before
  } catch (failure) {
    error = (failure instanceof Error ? failure.message : String(failure)).slice(0, 500)
    console.error(`import ${importer.source} failed:`, failure)
  }
  const row = await db
    .prepare(`UPDATE import_runs SET finished_at = datetime('now'), found = ?, new = ?, error = ? WHERE id = ? RETURNING *`)
    .bind(found, added, error, runId ?? 0)
    .first<RunRow>()
  if (!row) throw new Error(`import ${importer.source}: lost its run row`)
  return runToApi(row)
}

/** Import from every source now. Never throws for a source's failure; that's in its run's error. */
export async function runImports(env: Env, importers: readonly Importer[] = IMPORTERS): Promise<ImportRun[]> {
  const today = bostonToday()
  return Promise.all(importers.map((importer) => runOne(env.DB, importer, today)))
}
