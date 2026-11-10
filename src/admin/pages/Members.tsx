import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import type { Member } from '../../../shared/api'
import { TRACKS } from '../../../shared/constants'
import ui from '../admin.module.css'
import { Kbd } from '../components/Kbd'
import { ChevronRightIcon, DownloadIcon, MailIcon, SearchIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../lib/toast'
import { useSlashFocus } from '../lib/keys'
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
  const toast = useToast()
  const searchBox = useRef<HTMLInputElement>(null)
  useSlashFocus(searchBox)
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
    toast({ text: `${plural(members.length, 'member')} exported`, detail: filtered ? 'Only the people in this search or track.' : undefined })
  }

  const emailHref = track ? `/admin/email?audience=track&track=${encodeURIComponent(track)}` : '/admin/email?audience=members'
  const filtered = Boolean(q || track)

  return (
    <div className={shared.page}>
      <PageHeader
        title="Members"
        count={data ? (filtered ? `${members.length} of the list` : members.length) : undefined}
        actions={
          <>
            <button type="button" className={ui.button} onClick={exportCsv} disabled={members.length === 0}>
              <DownloadIcon /> Export CSV
            </button>
            <Link to={emailHref} className={ui.primary}>
              <MailIcon /> {track ? `Email the ${track} track` : 'Email all members'}
            </Link>
          </>
        }
      />

      <div className={ui.toolbar} role="search">
        <label className={`${ui.search} ${styles.search}`}>
          <span className={ui.srOnly}>Search members</span>
          <SearchIcon />
          <input
            ref={searchBox}
            type="search"
            className={ui.input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && query && setQuery('')}
            placeholder="Search by name or email"
            autoComplete="off"
            spellCheck={false}
          />
          <Kbd>/</Kbd>
        </label>
        <label className={styles.track}>
          <span className={ui.srOnly}>Track</span>
          <select className={ui.input} value={track} onChange={(event) => setTrack(event.target.value)}>
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

      <div className={ui.panelFlush} aria-busy={loading || undefined}>
        {data && members.length === 0 ? (
          <div className={shared.empty}>
            <h2>{filtered ? 'No members match that' : 'No members yet'}</h2>
            {filtered ? (
              <button
                type="button"
                className={ui.button}
                onClick={() => {
                  setQuery('')
                  setParams({}, { replace: true })
                }}
              >
                Clear search and track
              </button>
            ) : (
              <p>People who join from the site show up here.</p>
            )}
          </div>
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Year</th>
                <th scope="col">Track</th>
                <th scope="col">Joined</th>
                <th scope="col" className={ui.rowGo}>
                  <span className={ui.srOnly}>Open</span>
                </th>
              </tr>
            </thead>
            {!data ? (
              // The table's own shape while the first load is out, so nothing jumps when it lands.
              <tbody aria-hidden="true">
                {Array.from({ length: 6 }, (_, row) => (
                  <tr key={row}>
                    {[150, 190, 80, 60, 90].map((width, cell) => (
                      <td key={cell}>
                        <span className={ui.skeleton} style={{ width: width - (row % 3) * 14 }} />
                      </td>
                    ))}
                    <td />
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody className={loading ? styles.stale : undefined}>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td data-wide>
                      <span className={ui.person}>
                        <span className={ui.avatar} aria-hidden="true">
                          {member.name.trim().slice(0, 1).toUpperCase()}
                        </span>
                        <Link to={`/admin/members/${member.id}`} className={ui.rowTitle}>
                          {member.name}
                        </Link>
                        {member.unsubscribed && <span className={shared.flag}>Unsubscribed</span>}
                      </span>
                    </td>
                    <td data-wide className={styles.email}>
                      {member.email}
                    </td>
                    <td data-label="Year" className={styles.soft}>
                      {member.year}
                    </td>
                    <td data-label="Track" className={styles.soft}>
                      {member.track}
                    </td>
                    <td data-label="Joined" className={`${shared.figure} ${styles.soft}`}>
                      <time dateTime={stampToIso(member.createdAt)}>{formatStampDate(member.createdAt)}</time>
                    </td>
                    <td className={ui.rowGo} aria-hidden="true">
                      <ChevronRightIcon />
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        )}
      </div>
    </div>
  )
}
