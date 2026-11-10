import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import {
  CANDIDATE_STATUSES,
  IMPORT_SOURCES,
  type AddedCandidate,
  type CandidateList,
  type CandidateMode,
  type CandidateStatus,
  type HackathonCandidate,
  type ImportRun,
  type ImportSource,
} from '../../../shared/api'
import { api, ApiError } from '../../lib/api'
import admin from '../admin.module.css'
import { EmptyState, StatusLine, type StatusTone } from '../components/bits'
import { ArrowOutIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { formatRelative, formatTimestamp } from '../lib/format'
import styles from './HackathonImport.module.css'

// The review queue for hackathons the daily import found on MLH and Devpost. Adding one makes an
// unpublished draft and opens its editor, since neither source says when applications close,
// whether travel is covered, or who from BU is going.

const SOURCE_LABELS: Record<ImportSource, string> = { mlh: 'MLH', devpost: 'Devpost' }
const STATUS_LABELS: Record<CandidateStatus, string> = { new: 'New', added: 'Added', dismissed: 'Dismissed' }
const MODE_LABELS: Record<CandidateMode, string> = { 'in-person': 'In person', hybrid: 'Hybrid', online: 'Online' }
const MODE_FILTERS = [null, 'in-person', 'hybrid', 'online'] as const

const isStatus = (value: string | null): value is CandidateStatus => (CANDIDATE_STATUSES as readonly string[]).includes(value ?? '')
const isMode = (value: string | null): value is CandidateMode => value !== null && value in MODE_LABELS

const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const yearFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** "Nov 7 – 8, 2026", "Dec 28, 2026 – Jan 3, 2027". */
function formatRange(starts: string, ends: string): string {
  const start = new Date(`${starts}T00:00:00Z`)
  const end = new Date(`${ends}T00:00:00Z`)
  if (starts === ends) return yearFormat.format(start)
  if (starts.slice(0, 4) !== ends.slice(0, 4)) return `${yearFormat.format(start)} – ${yearFormat.format(end)}`
  const sameMonth = starts.slice(0, 7) === ends.slice(0, 7)
  return `${dayFormat.format(start)} – ${sameMonth ? end.getUTCDate() : dayFormat.format(end)}, ${starts.slice(0, 4)}`
}

/** The icon stays on the line with the name's last word, never wrapping onto a line by itself. */
function NameWithIcon({ name }: { name: string }) {
  const cut = name.trimEnd().lastIndexOf(' ')
  return (
    <>
      {cut > 0 ? name.slice(0, cut + 1) : ''}
      <span className={admin.nowrap}>
        {cut > 0 ? name.slice(cut + 1) : name}
        <ArrowOutIcon aria-hidden="true" />
      </span>
    </>
  )
}

/** The location, or the format
 when that's all there is to say ("Online"). */
function whereText(candidate: HackathonCandidate): string {
  const location = candidate.location.trim()
  if (candidate.mode === 'online' && (!location || /^online$/i.test(location))) return 'Online'
  return location || '—'
}

const message = (error: unknown) =>
 (error instanceof Error ? error.message : 'Something went wrong.')

/** "MLH checked 5 minutes ago: 67 upcoming, 3 new." One sentence per source. */
function RunSummary({ source, run }: { source: ImportSource; run: ImportRun | undefined }) {
  const label = SOURCE_LABELS[source]
  if (!run) return <p>{label} hasn’t been checked yet.</p>
  if (!run.finishedAt) return <p>Checking {label} now…</p>
  return (
    <p>
      {label} checked <span title={formatTimestamp(run.finishedAt)}>{formatRelative(run.finishedAt)}</span>
      {run.error ? (
        <span className={styles.failed}> and failed: {run.error}</span>
      ) : (
        <span className={admin.dim}>
          : {run.found} upcoming, {run.new} new.
        </span>
      )}
    </p>
  )
}

export function Component() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const status = isStatus(params.get('status')) ? (params.get('status') as CandidateStatus) : 'new'
  // In person by default: Proto goes to hackathons as a group, and Devpost's months-long online
  // challenges would otherwise fill the top of the list. `?mode=any` shows every format.
  const modeParam = params.get('mode')
  const mode = modeParam === 'any' ? null : isMode(modeParam) ? (modeParam as CandidateMode) : 'in-person'
  const near = params.get('near') === '1'

  const [list, setList] = useState<CandidateList | null>(null)
  const [runs, setRuns] = useState<ImportRun[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState<{ tone: StatusTone; text: string } | null>(null)
  const [busy, setBusy] = useState<number | 'run' | null>(null)
  const [nonce, setNonce] = useState(0)

  const query = new URLSearchParams({ status, ...(mode && { mode }), ...(near && { near: '1' }) }).toString()

  useEffect(() => {
    const controller = new AbortController()
    api<CandidateList>(`/admin/hackathon-imports?${query}`, { signal: controller.signal })
      .then((data) => {
        setList(data)
        setLoadError('')
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setLoadError(message(error))
      })
    return () => controller.abort()
  }, [query, nonce])

  // Runs reload with the list, so "Check now" and every action refresh the header too.
  useEffect(() => {
    const controller = new AbortController()
    api<{ items: ImportRun[] }>('/admin/hackathon-imports/runs', { signal: controller.signal })
      .then((data) => setRuns(data.items))
      .catch(() => {
        if (!controller.signal.aborted) setRuns([])
      })
    return () => controller.abort()
  }, [nonce])

  const lastRun = (source: ImportSource) => runs?.find((run) => run.source === source)

  const setFilter = (key: 'status' | 'mode' | 'near', value: string | null) => {
    const next = new URLSearchParams(params)
    if ((key === 'status' && value === 'new') || (key === 'mode' && value === 'in-person')) next.delete(key)
    else if (key === 'mode' && value === null) next.set('mode', 'any')
    else if (value === null) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const checkNow = async () => {
    setBusy('run')
    setNotice({ tone: 'info', text: 'Checking MLH and Devpost…' })
    try {
      const { items } = await api<{ items: ImportRun[] }>('/admin/hackathon-imports/run', { method: 'POST' })
      const failed = items.filter((run) => run.error)
      const fresh = items.reduce((sum, run) => sum + run.new, 0)
      setNotice(
        failed.length
          ? { tone: 'error', text: `${failed.map((run) => SOURCE_LABELS[run.source]).join(' and ')} failed. ${fresh} new from the rest.` }
          : { tone: 'ok', text: fresh ? `Found ${fresh} new.` : 'Up to date: nothing new.' },
      )
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof ApiError && error.status === 429 ? error.message : message(error) })
    } finally {
      setBusy(null)
      setNonce((n) => n + 1)
    }
  }

  const act = async (candidate: HackathonCandidate, action: 'dismiss' | 'restore') => {
    setBusy(candidate.id)
    try {
      await api(`/admin/hackathon-imports/${candidate.id}/${action}`, { method: 'POST' })
      setNotice({ tone: 'ok', text: `${action === 'dismiss' ? 'Dismissed' : 'Restored'} ${candidate.name}.` })
      setNonce((n) => n + 1)
    } catch (error) {
      setNotice({ tone: 'error', text: message(error) })
    } finally {
      setBusy(null)
    }
  }

  const add = async (candidate: HackathonCandidate) => {
    setBusy(candidate.id)
    try {
      const { item } = await api<AddedCandidate>(`/admin/hackathon-imports/${candidate.id}/add`, { method: 'POST' })
      navigate(`/admin/hackathons/${item.id}`)
    } catch (error) {
      setNotice({ tone: 'error', text: message(error) })
      setBusy(null)
    }
  }

  const items = list?.items ?? []
  const filtered = mode !== null || near

  return (
    <div className={admin.page}>
      <PageHeader
        title="Hackathons"
        tabTitle="Import hackathons"
        lede={IMPORT_SOURCES.map((source) => (
          <RunSummary key={source} source={source} run={lastRun(source)} />
        ))}
        actions={
          <>
            {/* Beside the button that usually caused it, and out of the way when there's nothing to say. */}
            <div className={styles.notice}>
              <StatusLine tone={notice?.tone}>{notice?.text}</StatusLine>
            </div>
            <button type="button" className={admin.button} onClick={checkNow} disabled={busy === 'run'}>
              {busy === 'run' ? 'Checking…' : 'Check now'}
            </button>
          </>
        }
      />

      <div className={styles.bar}>
        <nav className={admin.tabs} aria-label="Import status">
          {CANDIDATE_STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              className={admin.tab}
              aria-current={value === status ? 'page' : undefined}
              onClick={() => setFilter('status', value)}
            >
              {STATUS_LABELS[value]}
              <span className={admin.count}>{list?.counts[value] ?? '–'}</span>
            </button>
          ))}
        </nav>

        <div className={styles.filters}>
          <label className={styles.filter}>
            <span>Format</span>
            <select
              className={`${admin.input} ${styles.select}`}
              value={mode ?? 'any'}
              onChange={(event) => setFilter('mode', event.target.value === 'any' ? null : event.target.value)}
            >
              {MODE_FILTERS.map((value) => (
                <option key={value ?? 'any'} value={value ?? 'any'}>
                  {value ? MODE_LABELS[value] : 'Any format'}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.filter}>
            <input
              type="checkbox"
              role="switch"
              className={admin.switch}
              checked={near}
              onChange={(event) => setFilter('near', event.target.checked ? '1' : null)}
            />
            <span>Near Boston only</span>
          </label>
        </div>
      </div>


      {loadError && (
        <div className={admin.callout} role="alert">
          <h2>Couldn’t load imports</h2>
          <p>{loadError}</p>
        </div>
      )}

      <div className={admin.panelFlush}>
        {!list ? (
          !loadError && (
            <p role="status" className={`${admin.empty} ${admin.dim}`}>
              Loading imports…
            </p>
          )
        ) : items.length === 0 ? (
          <EmptyState title={filtered ? 'Nothing matches these filters' : `No ${STATUS_LABELS[status].toLowerCase()} imports`}>
            {filtered ? (
              <p>
                <button type="button" className={admin.link} onClick={() => setParams({ ...(status !== 'new' && { status }) }, { replace: true })}>
                  Clear the filters
                </button>
              </p>
            ) : (
              <p>
                Every morning around 5 AM Boston time, the portal checks the{' '}
                <a className={admin.link} href="https://www.mlh.com/seasons" target="_blank" rel="noreferrer">
                  MLH season list
                </a>{' '}
                and{' '}
                <a className={admin.link} href="https://devpost.com/hackathons" target="_blank" rel="noreferrer">
                  Devpost
                </a>{' '}
                for hackathons that haven’t happened yet. New ones land here for review; nothing goes on the site until
                you add it and publish the draft. Use “Check now” to look again.
              </p>
            )}
          </EmptyState>
        ) : (
          <table className={admin.table}>
            <thead>
              <tr>
                <th scope="col">Hackathon</th>
                <th scope="col">Source</th>
                <th scope="col">Dates</th>
                <th scope="col">Where</th>
                <th scope="col" className={admin.rowActions}>
                  <span className={admin.srOnly}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((candidate) => (
                <tr key={candidate.id}>
                  <td className={styles.name}>
                    {candidate.url ? (
                      <a className={admin.rowTitle} href={candidate.url} target="_blank" rel="noreferrer">
                        <NameWithIcon name={candidate.name} />
                        <span className={admin.srOnly}> (opens the event site)</span>
                      </a>
                    ) : (
                      <span className={admin.rowTitle}>{candidate.name}</span>
                    )}
                  </td>
                  <td className={admin.soft} data-label="Source">
                    {SOURCE_LABELS[candidate.source]}
                  </td>
                  <td className={`${admin.soft} ${admin.figure}`} data-label="Dates">
                    {formatRange(candidate.starts, candidate.ends)}
                  </td>
                  <td data-label="Where">
                    <span className={styles.location}>
                      <span className={admin.soft}>{whereText(candidate)}</span>
                      {(candidate.mode !== 'online' || candidate.nearBoston) && (
                        <span className={styles.detail}>
                          {candidate.mode !== 'online' && <span>{MODE_LABELS[candidate.mode]}</span>}
                          {candidate.nearBoston && <span className={styles.near}>Near Boston</span>}
                        </span>
                      )}

                    </span>
                  </td>
                  <td className={admin.rowActions}>

                    {candidate.status === 'new' && (
                      <>
                        <button
                          type="button"
                          className={`${admin.button} ${admin.small}`}
                          disabled={busy !== null}
                          onClick={() => add(candidate)}
                        >
                          Add as draft
                        </button>
                        <button
                          type="button"
                          className={`${admin.ghost} ${admin.small}`}
                          disabled={busy !== null}
                          onClick={() => act(candidate, 'dismiss')}
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                    {candidate.status === 'added' &&
                      (candidate.hackathonId !== null ? (
                        <Link className={`${admin.button} ${admin.small}`} to={`/admin/hackathons/${candidate.hackathonId}`}>
                          Open draft
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={`${admin.ghost} ${admin.small}`}
                          disabled={busy !== null}
                          onClick={() => act(candidate, 'restore')}
                          title="Its hackathon was deleted"
                        >
                          Restore
                        </button>
                      ))}
                    {candidate.status === 'dismissed' && (
                      <button
                        type="button"
                        className={`${admin.ghost} ${admin.small}`}
                        disabled={busy !== null}
                        onClick={() => act(candidate, 'restore')}
                      >
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
