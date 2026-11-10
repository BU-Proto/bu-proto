import { useState } from 'react'
import { Link } from 'react-router'
import { DEVPOST_MAX_INPUTS, type DevpostImportResult, type DevpostLookupItem } from '../../../shared/api'
import { api } from '../../lib/api'
import admin from '../admin.module.css'
import { StatusLine, type StatusTone } from '../components/bits'
import { PageHeader } from '../components/PageHeader'
import styles from './WinImport.module.css'

// Devpost projects to win drafts. Look up shows what each project would become; importing makes
// unpublished drafts, which the Worker builds from Devpost again rather than from this list.

const EXAMPLE = ['https://devpost.com/AndresL230', 'https://devpost.com/jose-colorstack', 'https://devpost.com/jackhe'].join('\n')

const message = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.')

const linesOf = (text: string) => [...new Set(text.split(/\s+/).map((line) => line.trim()).filter(Boolean))]

const importable = (item: DevpostLookupItem) => !item.error && item.existingWinId === null

function Status({ item }: { item: DevpostLookupItem }) {
  if (item.existingWinId !== null) {
    return (
      <Link className={admin.link} to={`/admin/wins/${item.existingWinId}`}>
        Already imported
      </Link>
    )
  }
  if (item.error) return <span className={styles.error}>Error: {item.error}</span>
  if (item.won) return <span className={styles.winner}>Winner</span>
  return <span className={admin.dim}>{item.event ? 'Submitted only' : 'Not submitted'}</span>
}

export function Component() {
  const [text, setText] = useState('')
  const [items, setItems] = useState<DevpostLookupItem[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<'lookup' | 'import' | null>(null)
  const [notice, setNotice] = useState<{ tone: StatusTone; text: string } | null>(null)
  const [result, setResult] = useState<DevpostImportResult | null>(null)

  const urls = linesOf(text)

  const lookUp = async () => {
    if (!urls.length) return setNotice({ tone: 'error', text: 'Paste at least one Devpost link.' })
    if (urls.length > DEVPOST_MAX_INPUTS) return setNotice({ tone: 'error', text: `Up to ${DEVPOST_MAX_INPUTS} links at a time.` })
    setBusy('lookup')
    setResult(null)
    setNotice({ tone: 'info', text: 'Reading each project from Devpost. This takes about a second a project.' })
    try {
      const data = await api<{ items: DevpostLookupItem[] }>('/admin/devpost/lookup', { body: { urls } })
      setItems(data.items)
      // Winners not imported yet are what this is usually for; everything else is a deliberate tick.
      setSelected(new Set(data.items.filter((item) => importable(item) && item.won).map((item) => item.url)))
      const ok = data.items.filter((item) => !item.error).length
      setNotice({ tone: 'ok', text: `Found ${ok} project${ok === 1 ? '' : 's'}.` })
    } catch (error) {
      setNotice({ tone: 'error', text: message(error) })
    } finally {
      setBusy(null)
    }
  }

  const importSelected = async () => {
    if (!items) return
    const chosen = items.filter((item) => selected.has(item.url) && importable(item)).map((item) => item.url)
    if (!chosen.length) return
    setBusy('import')
    setNotice({ tone: 'info', text: `Importing ${chosen.length}…` })
    try {
      const data = await api<DevpostImportResult>('/admin/devpost/import', { body: { urls: chosen } })
      setResult(data)
      const ids = new Map([...data.created, ...data.skipped].map((entry) => [entry.url, entry.id]))
      setItems(items.map((item) => (ids.has(item.url) ? { ...item, existingWinId: ids.get(item.url) ?? null } : item)))
      setSelected(new Set())
      setNotice(
        data.failed.length
          ? { tone: 'error', text: `Made ${data.created.length} draft${data.created.length === 1 ? '' : 's'}; ${data.failed.length} failed.` }
          : { tone: 'ok', text: `Made ${data.created.length} draft${data.created.length === 1 ? '' : 's'}.` },
      )
    } catch (error) {
      setNotice({ tone: 'error', text: message(error) })
    } finally {
      setBusy(null)
    }
  }

  const toggle = (url: string, on: boolean) => {
    const next = new Set(selected)
    if (on) next.add(url)
    else next.delete(url)
    setSelected(next)
  }

  const choosable = items?.filter(importable) ?? []
  const count = choosable.filter((item) => selected.has(item.url)).length
  const allOn = choosable.length > 0 && count === choosable.length

  return (
    <div className={admin.page}>
      <PageHeader
        title="Wins"
        tabTitle="Import wins from Devpost"
        lede={
          <>
            <p>
              Paste Devpost profiles or projects, one per line. Each project becomes a win draft with its write-up, team, stack,
              links and photos.
            </p>
            <p className={admin.dim}>
              Drafts stay unpublished until someone reviews and publishes them. Photos are linked from Devpost’s servers, not
              copied here.
            </p>
          </>
        }
      />

      <div className={`${admin.panel} ${styles.form}`}>
        <label className={admin.field}>
          <span className={admin.label}>Devpost links</span>
          <textarea
            className={`${admin.input} ${styles.urls}`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={EXAMPLE}
            rows={4}
            spellCheck={false}
            autoComplete="off"
          />
          <span className={admin.hint}>
            A profile (devpost.com/name) brings in all its projects; a project is devpost.com/software/name. Up to{' '}
            {DEVPOST_MAX_INPUTS} links.
          </span>
        </label>
        <div className={styles.row}>
          <button type="button" className={admin.primary} onClick={lookUp} disabled={busy !== null || !urls.length}>
            {busy === 'lookup' ? 'Looking up…' : 'Look up'}
          </button>
          <StatusLine tone={notice?.tone}>{notice?.text}</StatusLine>
        </div>
      </div>

      {items && items.length > 0 && (
        <>
          <div className={admin.panelFlush}>
            <table className={admin.table}>
              <thead>
                <tr>
                  <th scope="col" className={styles.check}>
                    <input
                      type="checkbox"
                      className={styles.box}
                      aria-label="Select every project that can be imported"
                      checked={allOn}
                      disabled={!choosable.length || busy !== null}
                      onChange={(event) => setSelected(event.target.checked ? new Set(choosable.map((item) => item.url)) : new Set())}
                    />
                  </th>
                  <th scope="col">Project</th>
                  <th scope="col">Hackathon</th>
                  <th scope="col">Prize</th>
                  <th scope="col">Team</th>
                  <th scope="col" className={admin.num}>
                    Photos
                  </th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.url}>
                    <td className={styles.check}>
                      <input
                        type="checkbox"
                        className={styles.box}
                        aria-label={`Import ${item.project || item.url}`}
                        checked={selected.has(item.url) && importable(item)}
                        disabled={!importable(item) || busy !== null}
                        onChange={(event) => toggle(item.url, event.target.checked)}
                      />
                    </td>
                    <td>
                      <div className={styles.project}>
                        {item.thumbnail ? (
                          <img className={styles.thumb} src={item.thumbnail} alt="" loading="lazy" />
                        ) : (
                          <span className={styles.thumb} aria-hidden="true" />
                        )}
                        <span className={styles.projectText}>
                          <a className={admin.rowTitle} href={item.url} target="_blank" rel="noreferrer">
                            {item.project || item.url.replace('https://devpost.com/', '')}
                            <span className={admin.srOnly}> (opens on Devpost)</span>
                          </a>
                          {item.tagline && <span className={styles.tagline}>{item.tagline}</span>}
                        </span>
                      </div>
                    </td>
                    <td className={admin.soft} data-label="Hackathon">
                      {item.event || '—'}
                    </td>
                    <td className={admin.soft} data-label="Prize">
                      {item.won ? item.placement : '—'}
                      {item.track && <span className={styles.subline}>{item.track}</span>}
                    </td>
                    <td className={admin.soft} data-label="Team">
                      {item.team.join(', ') || '—'}
                    </td>
                    <td className={`${admin.num} ${admin.figure}`} data-label="Photos">
                      {item.error ? '—' : item.imageCount}
                    </td>
                    <td data-label="Status">
                      <Status item={item} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.row}>
            <button type="button" className={admin.primary} onClick={importSelected} disabled={busy !== null || count === 0}>
              {busy === 'import' ? 'Importing…' : `Import ${count} as draft${count === 1 ? '' : 's'}`}
            </button>
          </div>
        </>
      )}

      {result && (result.created.length > 0 || result.failed.length > 0 || result.skipped.length > 0) && (
        <div className={`${admin.panel} ${styles.result}`}>
          {result.created.length > 0 && (
            <>
              <h2 className={admin.panelTitle}>New drafts</h2>
              <ul className={styles.list}>
                {result.created.map((entry) => (
                  <li key={entry.id}>
                    <Link className={admin.link} to={`/admin/wins/${entry.id}`}>
                      {entry.project}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {result.skipped.length > 0 && (
            <>
              <h2 className={admin.panelTitle}>Already there</h2>
              <ul className={styles.list}>
                {result.skipped.map((entry) => (
                  <li key={entry.url}>
                    <Link className={admin.link} to={`/admin/wins/${entry.id}`}>
                      {entry.url.replace('https://devpost.com/software/', '')}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {result.failed.length > 0 && (
            <>
              <h2 className={admin.panelTitle}>Couldn’t import</h2>
              <ul className={styles.list}>
                {result.failed.map((entry) => (
                  <li key={entry.url}>
                    {entry.url}: <span className={styles.error}>{entry.error}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
