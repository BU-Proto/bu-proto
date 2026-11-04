import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import type { Member } from '../../../shared/api'
import { TRACKS } from '../../../shared/constants'
import ui from '../../components/ui.module.css'
import { downloadFile, formatStampDate, plural, stampToIso, toCsv } from './people/format'
import { useApi, useDebounced } from './people/useApi'
import shared from './people/people.module.css'
import styles from './Members.module.css'

export function Component() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const track = params.get('track') ?? ''

  // The box is local so typing stays snappy; the URL (and the fetch) follow once typing pauses.
  const [query, setQuery] = useState(q)
  const settled = useDebounced(query.trim(), 250)

  // Push to the URL only when the typed value settles, so Back (which changes q) isn't undone.
  const pushed = useRef(settled)
  useEffect(() => {
    if (settled === pushed.current) return
    pushed.current = settled
    if (settled === q) return
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (settled) next.set('q', settled)
        else next.delete('q')
        return next
      },
      { replace: true },
    )
  }, [settled, q, setParams])

  // Back and forward change q under the box; follow them.
  useEffect(() => {
    if (q !== pushed.current) {
      pushed.current = q
      setQuery(q)
    }
  }, [q])

  const search = new URLSearchParams()
  if (q) search.set('q', q)
  if (track) search.set('track', track)
  const { data, error, loading } = useApi<{ items: Member[] }>(`/admin/members?${search}`)
  const members = data?.items ?? []

  const setTrack = (value: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set('track', value)
      else next.delete('track')
      return next
    })

  const exportCsv = () => {
    const rows = members.map((m) => [m.name, m.email, m.year, m.track, m.createdAt, m.unsubscribed ? 'yes' : 'no', m.notes])
    const suffix = [track && track.toLowerCase().replaceAll(' ', '-'), q && 'search'].filter(Boolean).join('-')
    const day = new Date().toISOString().slice(0, 10)
    downloadFile(
      `proto-members${suffix ? `-${suffix}` : ''}-${day}.csv`,
      toCsv(['Name', 'Email', 'Year', 'Track', 'Joined (UTC)', 'Unsubscribed', 'Notes'], rows),
    )
  }

  const emailHref = track ? `/admin/email?audience=track&track=${encodeURIComponent(track)}` : '/admin/email?audience=members'
  const filtered = Boolean(q || track)

  return (
    <div className={shared.page}>
      <title>Members · Admin · BU Proto</title>

      <header className={shared.head}>
        <div className={shared.headText}>
          <p className={shared.eyebrow}>People</p>
          <h1 className={shared.title}>
            Members
            {data && (
              <span className={shared.count} aria-live="polite">
                {filtered ? `${plural(members.length, 'match', 'matches')}` : plural(members.length, 'person', 'people')}
              </span>
            )}
          </h1>
        </div>
        <div className={shared.headActions}>
          <button type="button" className={ui.secondary} onClick={exportCsv} disabled={members.length === 0}>
            Export CSV
          </button>
          <Link to={emailHref} className={ui.primary}>
            {track ? `Email the ${track} track` : 'Email all members'}
          </Link>
        </div>
      </header>

      <div className={shared.toolbar} role="search">
        <label className={`${shared.field} ${styles.search}`}>
          <span className={shared.label}>Search</span>
          <input
            type="search"
            className={shared.input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or email"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className={shared.field}>
          <span className={shared.label}>Track</span>
          <select className={shared.input} value={track} onChange={(event) => setTrack(event.target.value)}>
            <option value="">All tracks</option>
            {TRACKS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {q && (
        <p className={shared.hint}>
          Export uses this search. Email goes to {track ? `everyone on the ${track} track` : 'all members'} who hasn’t
          unsubscribed, not just these matches.
        </p>
      )}

      <p className={shared.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      <div className={shared.tableWrap} aria-busy={loading || undefined}>
        {data && members.length === 0 ? (
          <p className={shared.empty}>{filtered ? 'No one matches that.' : 'No one has joined yet.'}</p>
        ) : !data && loading ? (
          <p className={shared.empty}>Loading members…</p>
        ) : (
          <table className={shared.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Year</th>
                <th scope="col">Track</th>
                <th scope="col">Joined</th>
              </tr>
            </thead>
            <tbody className={loading ? styles.stale : undefined}>
              {members.map((member) => (
                <tr key={member.id}>
                  <td data-wide>
                    <Link to={`/admin/members/${member.id}`} className={shared.rowLink}>
                      {member.name}
                    </Link>
                    {member.unsubscribed && (
                      <span className={`${shared.badge} ${styles.unsub}`} data-tone="warn">
                        unsubscribed
                      </span>
                    )}
                  </td>
                  <td data-wide className={`${shared.mono} ${styles.email}`}>
                    {member.email}
                  </td>
                  <td data-label="Year">{member.year}</td>
                  <td data-label="Track">{member.track}</td>
                  <td data-label="Joined" className={shared.mono}>
                    <time dateTime={stampToIso(member.createdAt)}>{formatStampDate(member.createdAt)}</time>
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
