import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import type { AskSetup, MailStatus, MailThread } from '../../../shared/api'
import ui from '../admin.module.css'
import { PlusIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { formatRelative } from '../lib/format'
import { useKeys, useSlashFocus } from '../lib/keys'
import { readingChips } from '../lib/mail'
import shared from './people/people.module.css'
import { useApi } from './people/useApi'
import { SetupNote } from './Asks'
import styles from './Inbox.module.css'

const FILTERS: { key: MailStatus | 'all'; label: string; empty: string }[] = [
  { key: 'open', label: 'To do', empty: 'Nothing waiting on us. New mail and replies land here.' },
  { key: 'waiting', label: 'Waiting', empty: 'Nothing sent that’s waiting on an answer.' },
  { key: 'done', label: 'Done', empty: 'Nothing marked done yet.' },
  { key: 'all', label: 'All', empty: 'No email yet.' },
]

/** The inbox: every conversation by email, the ones on us first. */
export function Component() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const filter = FILTERS.find((entry) => entry.key === params.get('show')) ?? FILTERS[0]
  const { data, error, loading } = useApi<{ items: MailThread[]; setup: AskSetup }>('/admin/inbox?status=all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const search = useRef<HTMLInputElement>(null)
  useSlashFocus(search)

  const all = useMemo(() => data?.items ?? [], [data])
  const counts = useMemo(() => {
    const by: Record<string, number> = { all: all.length }
    for (const thread of all) by[thread.status] = (by[thread.status] ?? 0) + 1
    return by
  }, [all])
  const needle = query.trim().toLowerCase()
  const shown = all
    .filter((thread) => filter.key === 'all' || thread.status === filter.key)
    .filter(
      (thread) =>
        !needle ||
        [thread.withName, thread.withEmail, thread.subject, thread.latest?.snippet ?? '', thread.latest?.reading?.summary ?? ''].some((text) =>
          text.toLowerCase().includes(needle),
        ),
    )
  const unread = all.filter((thread) => thread.unread > 0 && thread.status !== 'done').length

  // j / k move down and up, Enter or o opens: a mail app's keys.
  const index = Math.min(selected, Math.max(shown.length - 1, 0))
  const keys = useMemo(
    () => ({
      j: () => setSelected((at) => Math.min(at + 1, shown.length - 1)),
      k: () => setSelected((at) => Math.max(at - 1, 0)),
      o: () => shown[index] && navigate(`/admin/email/inbox/${shown[index].id}`),
      Enter: () => shown[index] && navigate(`/admin/email/inbox/${shown[index].id}`),
    }),
    [shown, index, navigate],
  )
  useKeys(keys, shown.length > 0)

  const setFilter = (key: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (key === 'open') next.delete('show')
        else next.set('show', key)
        return next
      },
      { replace: true },
    )

  return (
    <div className={shared.page}>
      <PageHeader
        title="Email"
        tabTitle="Inbox"
        count={unread ? `${unread} unread` : undefined}
        lede="One-to-one email: everything sent to proto.boston, and the replies to our asks. Claude reads each email and says what it needs; press Reply and it drafts the answer for you to check and send. List emails to members stay on Compose."
        actions={
          <Link to="/admin/email/asks/new" className={ui.primary}>
            <PlusIcon /> Ask someone
          </Link>
        }
      />
      <SetupNote setup={data?.setup} />
      <p className={shared.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      <div className={styles.toolbar}>
        <nav aria-label="Show">
          <ul className={shared.tabs}>
            {FILTERS.map((entry) => (
              <li key={entry.key}>
                <button type="button" className={shared.tab} aria-current={entry.key === filter.key ? 'page' : undefined} onClick={() => setFilter(entry.key)}>
                  {entry.label} <span className={shared.tabCount}>{counts[entry.key] ?? 0}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <label className={styles.search}>
          <span className={ui.srOnly}>Search email</span>
          <input ref={search} className={ui.input} type="search" placeholder="Search  /" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>

      {!data && loading ? (
        <div className={shared.panel} aria-hidden="true">
          <span className={ui.skeleton} style={{ width: 200, marginBottom: 14 }} />
          <span className={ui.skeleton} style={{ width: 360 }} />
        </div>
      ) : data && shown.length === 0 ? (
        <div className={`${shared.panel} ${shared.empty}`}>
          <h2>{needle ? 'Nothing matches' : 'All clear'}</h2>
          <p>{needle ? 'Try other words, or another tab.' : filter.empty}</p>
        </div>
      ) : data ? (
        <>
          <div className={ui.panelFlush}>
            <ul className={styles.list}>
              {shown.map((thread, at) => {
                const latestIn = thread.latest?.direction === 'in'
                const chips = latestIn ? readingChips(thread.latest?.reading ?? null, thread.askId !== null) : []
                return (
                  <li key={thread.id}>
                    <Link
                      to={`/admin/email/inbox/${thread.id}`}
                      className={styles.row}
                      data-unread={thread.unread > 0}
                      data-selected={at === index}
                      onFocus={() => setSelected(at)}
                    >
                      <span className={styles.dot} aria-label={thread.unread > 0 ? 'Unread' : undefined} />
                      <span className={styles.who}>
                        {thread.withName || thread.withEmail || 'Unknown'}
                        {thread.messageCount > 1 && <span className={ui.dim}> {thread.messageCount}</span>}
                      </span>
                      <span className={styles.what}>
                        <span className={styles.subject}>{thread.subject}</span>
                        <span className={styles.snippet}>
                          {latestIn && thread.latest?.reading ? thread.latest.reading.summary : `${thread.latest?.direction === 'out' ? 'You: ' : ''}${thread.latest?.snippet ?? ''}`}
                        </span>
                        {(chips.length > 0 || thread.hasDraft || thread.askId) && (
                          <span className={styles.chips}>
                            {thread.hasDraft && (
                              <span className={styles.chip} data-tone="good">
                                Reply drafted
                              </span>
                            )}
                            {chips.map((chip) => (
                              <span key={chip.text} className={styles.chip} data-tone={chip.tone}>
                                {chip.text}
                              </span>
                            ))}
                            {thread.askId && <span className={styles.chip}>Ask</span>}
                          </span>
                        )}
                      </span>
                      <span className={styles.when}>{formatRelative(thread.lastMessageAt)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
          <p className={styles.keys}>Keys: j and k to move, Enter to open, / to search.</p>
        </>
      ) : null}
    </div>
  )
}
