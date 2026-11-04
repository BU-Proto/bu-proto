import { Hono } from 'hono'
import {
  DEVPOST_MAX_PROJECTS,
  RESOURCE_SPECS,
  devpostUrlsInput,
  winInput,
  type DevpostImportResult,
  type DevpostLookupItem,
} from '../../shared/api'
import { inputToColumns, rowToItem, type DbRow } from '../lib/content'
import { ApiError, readBody } from '../lib/http'
import { sleep } from '../lib/importers/common'
import {
  devpostTarget,
  fetchDevpostPage,
  headline,
  parseProfilePage,
  parseProjectPage,
  profileKey,
  projectToWin,
  type DevpostProject,
} from '../lib/importers/devpostProject'
import type { AppEnv } from '../types'

// Turns Devpost projects into unpublished win drafts. Lookup shows what an import would make;
// import reads each project from Devpost again rather than trusting what the portal sends back.
// Images stay on Devpost's CloudFront and are linked, not copied.

const app = new Hono<AppEnv>()

/** Between requests to Devpost, so a lookup of three profiles doesn't arrive as a burst. */
const PAUSE_MS = 400
/** A profile lists a page of projects; follow "next" this many times at most. */
const MAX_PROFILE_PAGES = 3

type Failure = { url: string; error: string }

const message = (error: unknown) => (error instanceof Error && error.message) || 'Could not read that page.'

/** The pasted links as canonical project URLs, profiles expanded. Profiles that fail come back as failures. */
async function collectProjects(urls: string[]): Promise<{ projects: string[]; failures: Failure[] }> {
  const targets = urls.filter((url) => url.trim()).map((url) => ({ url, target: devpostTarget(url) }))
  const bad = targets.filter((entry) => !entry.target).map((entry) => entry.url)
  if (bad.length) {
    throw new ApiError(400, `Not a Devpost profile or project link: ${bad.join(', ')}`)
  }
  if (!targets.length) throw new ApiError(400, 'Paste at least one Devpost link.')

  const projects: string[] = []
  const failures: Failure[] = []
  let first = true
  for (const { target } of targets) {
    if (!target) continue
    if (target.kind === 'project') {
      if (!projects.includes(target.url)) projects.push(target.url)
      continue
    }
    let page: string | null = target.url
    for (let count = 0; page && count < MAX_PROFILE_PAGES; count++) {
      if (!first) await sleep(PAUSE_MS)
      first = false
      const current: string = page
      try {
        const parsed = parseProfilePage(await fetchDevpostPage(current))
        for (const url of parsed.projects) if (!projects.includes(url)) projects.push(url)
        page = parsed.next
      } catch (error) {
        failures.push({ url: current, error: message(error) })
        page = null
      }
    }
  }
  return { projects, failures }
}

/** Fetch and parse projects one at a time. A failure is kept per project, never thrown. */
async function readProjects(urls: string[], each: (url: string, result: DevpostProject | Failure) => void | Promise<void>) {
  for (const [index, url] of urls.entries()) {
    if (index > 0) await sleep(PAUSE_MS)
    let result: DevpostProject | Failure
    try {
      const project = parseProjectPage(await fetchDevpostPage(url), url)
      result = project.title ? project : { url, error: 'No project on that page (deleted or private?).' }
    } catch (error) {
      result = { url, error: message(error) }
    }
    await each(url, result)
  }
}

/** Wins that already link a Devpost project, keyed by its canonical URL. */
async function existingWins(db: D1Database): Promise<Map<string, number>> {
  const { results } = await db
    .prepare(`SELECT id, devpost FROM wins WHERE devpost IS NOT NULL AND devpost != '' ORDER BY id ASC`)
    .all<{ id: number; devpost: string }>()
  const byUrl = new Map<string, number>()
  for (const row of results) {
    const target = devpostTarget(row.devpost)
    if (target?.kind === 'project' && !byUrl.has(target.url)) byUrl.set(target.url, row.id)
  }
  return byUrl
}

/**
 * Profile links of everyone marked BU on any win, so a person marked once is marked on every
 * later import. Rows with broken team JSON are skipped rather than failing the query.
 */
async function buProfiles(db: D1Database): Promise<Set<string>> {
  const { results } = await db
    .prepare(
      `SELECT DISTINCT json_extract(person.value, '$.href') AS href
       FROM wins, json_each(wins.team) AS person
       WHERE json_valid(wins.team) AND json_extract(person.value, '$.bu') = 1
         AND json_extract(person.value, '$.href') IS NOT NULL`,
    )
    .all<{ href: string }>()
  return new Set(results.map((row) => profileKey(String(row.href))))
}

const tooMany = (urls: string[]): Failure[] =>
  urls.map((url) => ({ url, error: `Over the ${DEVPOST_MAX_PROJECTS}-project limit for one go. Look it up on its own.` }))

app.post('/api/admin/devpost/lookup', async (c) => {
  const { urls } = await readBody(c, devpostUrlsInput)
  const { projects, failures } = await collectProjects(urls)
  const existing = await existingWins(c.env.DB)
  const items: DevpostLookupItem[] = []
  const blank = (failure: Failure): DevpostLookupItem => ({
    url: failure.url,
    project: '',
    tagline: '',
    event: '',
    placement: '',
    track: '',
    won: false,
    team: [],
    imageCount: 0,
    thumbnail: null,
    existingWinId: existing.get(failure.url) ?? null,
    error: failure.error,
  })
  await readProjects(projects.slice(0, DEVPOST_MAX_PROJECTS), (url, result) => {
    if ('error' in result) return void items.push(blank(result))
    const win = projectToWin(result)
    items.push({
      url,
      project: win.project,
      tagline: win.blurb,
      event: headline(result).submission?.hackathon ?? '',
      placement: win.placement,
      track: win.track,
      won: headline(result).won,
      team: win.team.map((person) => person.name),
      imageCount: result.images.length,
      thumbnail: result.thumbnail,
      existingWinId: existing.get(url) ?? null,
    })
  })
  items.push(...tooMany(projects.slice(DEVPOST_MAX_PROJECTS)).map(blank), ...failures.map(blank))
  return c.json({ items })
})

app.post('/api/admin/devpost/import', async (c) => {
  const { urls } = await readBody(c, devpostUrlsInput)
  const { projects, failures } = await collectProjects(urls)
  const existing = await existingWins(c.env.DB)
  const bu = await buProfiles(c.env.DB)
  const spec = RESOURCE_SPECS.wins
  const result: DevpostImportResult = { created: [], skipped: [], failed: [...failures, ...tooMany(projects.slice(DEVPOST_MAX_PROJECTS))] }

  const fresh: string[] = []
  for (const url of projects.slice(0, DEVPOST_MAX_PROJECTS)) {
    const id = existing.get(url)
    if (id === undefined) fresh.push(url)
    else result.skipped.push({ url, id, reason: 'Already imported.' })
  }

  await readProjects(fresh, async (url, read) => {
    if ('error' in read) return void result.failed.push(read)
    const input = winInput.safeParse(projectToWin(read, bu))
    if (!input.success) {
      const issue = input.error.issues[0]
      return void result.failed.push({ url, error: `Parsed, but ${issue.path.join('.') || 'a field'}: ${issue.message}` })
    }
    const { columns, values } = inputToColumns(spec, input.data)
    const row = await c.env.DB.prepare(
      `INSERT INTO ${spec.table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')}) RETURNING *`,
    )
      .bind(...values)
      .first<DbRow>()
    if (!row) return void result.failed.push({ url, error: 'Could not save the draft.' })
    const item = rowToItem(spec, row)
    result.created.push({ url, id: Number(item.id), project: String(item.project) })
  })

  return c.json(result, result.created.length ? 201 : 200)
})

export default app
