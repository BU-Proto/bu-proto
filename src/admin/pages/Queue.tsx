import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useRevalidator, useSearchParams } from 'react-router'
import { FUND_STATUSES, type BoardInterest, type FundInterest, type FundStatus, type MailThreadDetail, type MemberDetail, type RoleApplication } from '../../../shared/api'
import { QUEUE_SOURCE_LABELS, QUEUE_SOURCES, type QueueItem, type QueueSource } from '../../../shared/crm'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { ArrowOutIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { useGated } from '../lib/access'
import { formatRelative, formatTimestamp, plural } from '../lib/format'
import { useKeys } from '../lib/keys'
import { readingChips, splitQuoted } from '../lib/mail'
import { messageFor, useAuthGuard } from '../lib/session'
import { useToast } from '../lib/toast'
import inbox from './Inbox.module.css'
import { useApi } from './people/useApi'
import styles from './Queue.module.css'
import { SegmentGroup } from '../components/SegmentGroup'

// The Inbox: everything waiting on the team in one list (email that's on us, sign-ups nobody has
// looked at, fund requests, role applications, board interest), with the selected one beside it
// and what can be done about it there. Recently handled ones stay in the list, without the dot.

interface QueueData {
  items: QueueItem[]
  counts: Record<QueueSource, number>
}

type Filter = QueueSource | 'all'

const FILTERS: { key: Filter; label: string; empty: string }[] = [
  { key: 'all', label: 'All', empty: 'Nothing waiting. New email, sign-ups and requests from the site land here.' },
  { key: 'email', label: 'Email', empty: 'No email waiting on us.' },
  { key: 'signup', label: 'Sign-ups', empty: 'No new sign-ups to look at.' },
  { key: 'fund', label: 'Fund requests', empty: 'No fund requests waiting.' },
  { key: 'application', label: 'Applications', empty: 'No role applications to read.' },
  { key: 'board', label: 'Board interest', empty: 'Nobody has put their hand up for a seat lately.' },
]

const FUND_LABELS: Record<FundStatus, string> = { new: 'New', reviewing: 'Reviewing', approved: 'Approved', declined: 'Declined' }

const keyOf = (item: Pick<QueueItem, 'source' | 'id'>) => `${item.source}-${item.id}`
const isFilter = (value: string | null): value is QueueSource => (QUEUE_SOURCES as readonly string[]).includes(value ?? '')

export function Component() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { revalidate } = useRevalidator()
  const raw = params.get('source')
  const filter: Filter = isFilter(raw) ? raw : 'all'
  const waitingOnly = params.get('waiting') === '1'
  const { data, error, loading, setData } = useApi<QueueData>('/admin/queue')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const list = useRef<HTMLUListElement>(null)

  const all = useMemo(() => data?.items ?? [], [data])
  const shown = useMemo(
    () => all.filter((item) => (filter === 'all' || item.source === filter) && (!waitingOnly || item.waiting)),
    [all, filter, waitingOnly],
  )
  const counts = data?.counts
  const total = counts ? QUEUE_SOURCES.reduce((sum, source) => sum + counts[source], 0) : 0
  const selected = shown.find((item) => keyOf(item) === selectedKey) ?? shown[0]
  const index = selected ? shown.indexOf(selected) : -1

  const setParam = (name: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === null) next.delete(name)
        else next.set(name, value)
        return next
      },
      { replace: true },
    )

  // j / k move down and up, Enter or o opens the item's own page: the email inbox's keys.
  const keys = useMemo(
    () => ({
      j: () => shown[index + 1] && setSelectedKey(keyOf(shown[index + 1])),
      k: () => shown[index - 1] && setSelectedKey(keyOf(shown[index - 1])),
      o: () => selected && navigate(selected.href),
      Enter: () => selected && navigate(selected.href),
    }),
    [shown, index, selected, navigate],
  )
  useKeys(keys, shown.length > 0)

  // The open row is kept in sight as j and k move through the list, and again once what's under
  // it has loaded and made it taller.
  const selectedId = selected ? keyOf(selected) : null
  useEffect(() => {
    const open = list.current?.querySelector('[data-open]')
    if (!open) return
    const reveal = () => open.scrollIntoView({ block: 'nearest' })
    reveal()
    const observer = new ResizeObserver(reveal)
    observer.observe(open)
    return () => observer.disconnect()
  }, [selectedId])

  /** An item was dealt with (or brought back): its dot, the tab counts and the sidebar's badges follow. */
  const setWaiting = (target: QueueItem, waiting: boolean) => {
    setData((prev) => {
      if (!prev) return prev
      const current = prev.items.find((item) => keyOf(item) === keyOf(target))
      if (!current || current.waiting === waiting) return prev
      return {
        items: prev.items.map((item) => (keyOf(item) === keyOf(target) ? { ...item, waiting } : item)),
        counts: { ...prev.counts, [target.source]: Math.max(0, prev.counts[target.source] + (waiting ? 1 : -1)) },
      }
    })
    void revalidate()
  }

  const filterInfo = FILTERS.find((entry) => entry.key === filter) ?? FILTERS[0]

  return (
    <div className={ui.page}>
      <PageHeader title="Inbox" count={counts ? `${total} waiting` : undefined} />

      <p className={ui.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      <div className={styles.toolbar}>
        <SegmentGroup label="Show">
          {FILTERS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              className={ui.tab}
              aria-pressed={entry.key === filter}
              onClick={() => setParam('source', entry.key === 'all' ? null : entry.key)}
            >
              {entry.label}{' '}
              <span className={ui.count}>{counts ? (entry.key === 'all' ? total : counts[entry.key]) : ''}</span>
            </button>
          ))}
        </SegmentGroup>
        <label className={styles.waitingOnly}>
          <input type="checkbox" role="switch" className={ui.switch} checked={waitingOnly} onChange={(event) => setParam('waiting', event.target.checked ? '1' : null)} />
          Waiting only
        </label>
      </div>

      {!data && loading ? (
        <div className={ui.panel} aria-hidden="true">
          <span className={ui.skeleton} style={{ width: 200, marginBottom: 14 }} />
          <span className={ui.skeleton} style={{ width: 360 }} />
        </div>
      ) : data && shown.length === 0 ? (
        <div className={`${ui.panel} ${ui.empty}`}>
          <h2>All clear</h2>
          <p>{waitingOnly ? filterInfo.empty : `${filterInfo.empty} Nothing handled in the last 30 days either.`}</p>
        </div>
      ) : data && selected ? (
        <>
          {/* One list, as tall as what's in it. The picked row opens in place: what it says and
              what can be done about it, under its own line, so nothing sits in a box of its own. */}
          <section className={ui.panelFlush} aria-label="Waiting">
            <ul ref={list} className={styles.list}>
              {shown.map((item) => {
                const open = item === selected
                return (
                  <li key={keyOf(item)} data-open={open || undefined}>
                    <button type="button" className={styles.row} data-waiting={item.waiting} aria-expanded={open} onClick={() => setSelectedKey(keyOf(item))}>
                      <span className={styles.dot} aria-label={item.waiting ? 'Waiting' : undefined} />
                      <span className={styles.name}>{item.name}</span>
                      <span className={styles.what}>
                        <span className={styles.subject}>{item.title}</span>
                        {item.snippet && <span className={styles.snippet}>{item.snippet}</span>}
                      </span>
                      <span className={styles.source}>{QUEUE_SOURCE_LABELS[item.source]}</span>
                      <span className={styles.when}>{formatRelative(item.at)}</span>
                    </button>
                    {open && <Detail key={keyOf(item)} item={item} onWaiting={(waiting) => setWaiting(item, waiting)} />}
                  </li>
                )
              })}
            </ul>
          </section>
          <p className={styles.keys}>Keys: j and k to move, Enter to open.</p>
        </>
      ) : null}
    </div>
  )
}

// ---- The selected item ----------------------------------------------------------------------------

interface DetailProps {
  item: QueueItem
  onWaiting: (waiting: boolean) => void
}

function Detail({ item, onWaiting }: DetailProps) {
  const toast = useToast()
  const guard = useAuthGuard()
  const [busy, setBusy] = useState(false)

  /** Run a change, say so with a way back, and keep the list's dot in step. */
  const change = async (run: () => Promise<unknown>, waiting: boolean, said: string, undo?: () => Promise<unknown>) => {
    if (busy) return
    setBusy(true)
    try {
      await run()
      onWaiting(waiting)
      toast({
        text: said,
        detail: item.name,
        action: undo ? { label: 'Undo', onAction: () => void change(undo, !waiting, 'Undone') } : undefined,
      })
    } catch (failure) {
      if (!guard(failure)) toast({ text: 'That didn’t save', detail: messageFor(failure), tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const review = (waiting: boolean) => () => api(`/admin/queue/${item.source}/${item.id}/review`, { method: 'POST', body: { waiting } })

  const openPerson = item.personKey && (
    <Link className={ui.ghost} to={`/admin/people/${item.personKey}`}>
      Open person
    </Link>
  )

  let body: ReactNode
  let actions: ReactNode
  switch (item.source) {
    case 'email':
      body = <EmailBody id={item.id} />
      actions = (
        <>
          <Link className={ui.primary} to={item.href}>
            Open conversation
          </Link>
          {item.waiting && (
            <button
              type="button"
              className={ui.button}
              disabled={busy}
              onClick={() =>
                void change(
                  () => api(`/admin/inbox/${item.id}`, { method: 'PATCH', body: { status: 'done' } }),
                  false,
                  'Marked done',
                  () => api(`/admin/inbox/${item.id}`, { method: 'PATCH', body: { status: 'open' } }),
                )
              }
            >
              Mark done
            </button>
          )}
          {openPerson}
        </>
      )
      break
    case 'signup':
      body = <SignupBody id={item.id} />
      actions = (
        <>
          {item.waiting ? (
            <button type="button" className={ui.primary} disabled={busy} onClick={() => void change(review(false), false, 'Marked seen', review(true))}>
              Mark seen
            </button>
          ) : (
            <button type="button" className={ui.button} disabled={busy} onClick={() => void change(review(true), true, 'Marked not seen yet')}>
              Mark not seen
            </button>
          )}
          {openPerson ?? (
            <Link className={ui.ghost} to={item.href}>
              Open person
            </Link>
          )}
        </>
      )
      break
    case 'fund':
      body = <FundBody id={item.id} onWaiting={onWaiting} />
      actions = (
        <>
          <Link className={ui.button} to={item.href}>
            Open fund
          </Link>
          {openPerson}
        </>
      )
      break
    case 'application':
      body = <ApplicationBody id={item.id} />
      actions = (
        <>
          <Link className={ui.primary} to={item.href}>
            Open application
          </Link>
          {openPerson}
        </>
      )
      break
    case 'board':
      body = <BoardBody id={item.id} />
      actions = (
        <>
          {item.waiting ? (
            <button type="button" className={ui.primary} disabled={busy} onClick={() => void change(review(false), false, 'Marked answered', review(true))}>
              Mark answered
            </button>
          ) : (
            <button type="button" className={ui.button} disabled={busy} onClick={() => void change(review(true), true, 'Marked not answered yet')}>
              Mark not answered
            </button>
          )}
          <Link className={ui.ghost} to={item.href}>
            Open board interest
          </Link>
          {openPerson}
        </>
      )
      break
  }

  // Laid out on the row's own columns: their address and where it stands under the name, and
  // what it says and what to do about it under the subject.
  return (
    <div className={styles.detail}>
      <div className={styles.detailSide}>
        {item.email && (
          <span className={styles.detailMeta} title={item.email}>
            {item.email}
          </span>
        )}
        <span className={ui.state} data-tone={item.waiting ? 'live' : undefined}>
          {item.waiting ? 'Waiting' : 'Handled'}
        </span>
      </div>
      <div className={styles.detailMain}>
        <div className={styles.detailBody}>{body}</div>
        <div className={styles.detailActions}>{actions}</div>
      </div>
    </div>
  )
}

/** Label and value rows, in the order given, skipping the ones with nothing to say. */
function Facts({ rows }: { rows: Record<string, ReactNode> }) {
  const shown = Object.entries(rows).filter(([, value]) => value !== '' && value !== null && value !== undefined && value !== false)
  if (shown.length === 0) return null
  return (
    <dl className={styles.facts}>
      {shown.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Loading() {
  return (
    <div className={styles.loading} aria-hidden="true">
      <span className={ui.skeleton} style={{ width: '70%' }} />
      <span className={ui.skeleton} style={{ width: '45%' }} />
    </div>
  )
}

function Failed({ message }: { message: string }) {
  return (
    <p className={ui.error} role="alert">
      {message}
    </p>
  )
}

/** The latest email in the conversation, and what Claude made of the latest one that came in. */
function EmailBody({ id }: { id: number }) {
  const { data, error } = useApi<{ item: MailThreadDetail }>(`/admin/inbox/${id}`)
  if (error) return <Failed message={error.message} />
  if (!data) return <Loading />
  const thread = data.item
  const latest = thread.messages.at(-1)
  const lastIn = [...thread.messages].reverse().find((message) => message.direction === 'in')
  const chips = readingChips(lastIn?.reading ?? null, thread.askId !== null)
  const own = latest ? splitQuoted(latest.text).own : ''
  // Long emails are cut here; the conversation has the rest.
  const shown = own.length > 1400 ? `${own.slice(0, 1400).trimEnd()}…` : own

  return (
    <>
      <p className={styles.subjectLine}>{thread.subject}</p>
      {latest && (
        <div className={inbox.message} data-direction={latest.direction}>
          <div className={inbox.messageHead}>
            <p className={inbox.from}>{latest.direction === 'out' ? `${latest.fromName || 'We'} wrote` : latest.fromName || latest.fromEmail}</p>
            <span className={ui.dim}>{formatTimestamp(latest.createdAt)}</span>
          </div>
          <p className={inbox.text}>{shown || '(No text. Open the conversation to see the email.)'}</p>
          {thread.messageCount > 1 && <p className={ui.dim}>{plural(thread.messageCount - 1, 'earlier email')} in the conversation.</p>}
        </div>
      )}
      {lastIn?.reading && (
        <div className={inbox.reading}>
          <p>
            <strong>Claude’s read.</strong> {lastIn.reading.summary}
          </p>
          {chips.length > 0 && (
            <span className={inbox.chips}>
              {chips.map((chip) => (
                <span key={chip.text} className={inbox.chip} data-tone={chip.tone}>
                  {chip.text}
                </span>
              ))}
            </span>
          )}
          {lastIn.reading.stillNeeded.length > 0 && (
            <ul>
              {lastIn.reading.stillNeeded.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  )
}

function SignupBody({ id }: { id: number }) {
  const { data, error } = useApi<MemberDetail>(`/admin/members/${id}`)
  if (error) return <Failed message={error.status === 404 ? 'This sign-up is gone.' : error.message} />
  if (!data) return <Loading />
  const { member, rsvps, fundInterest } = data
  return (
    <Facts
      rows={{
        Year: member.year,
        Track: member.track,
        'Signed up': formatTimestamp(member.createdAt),
        Notes: member.notes && <span className={styles.pre}>{member.notes}</span>,
        RSVPs: rsvps.length > 0 && rsvps.map((rsvp) => rsvp.eventTitle).slice(0, 3).join(', ') + (rsvps.length > 3 ? ` and ${rsvps.length - 3} more` : ''),
        'Fund requests': fundInterest.length > 0 && plural(fundInterest.length, 'request'),
        'List email': member.unsubscribed ? 'Unsubscribed' : '',
      }}
    />
  )
}

function FundBody({ id, onWaiting }: { id: number; onWaiting: (waiting: boolean) => void }) {
  const { data, error, setData } = useApi<{ items: FundInterest[] }>('/admin/fund')
  const gated = useGated()
  const toast = useToast()
  const guard = useAuthGuard()
  const [saving, setSaving] = useState(false)
  if (error) return <Failed message={error.message} />
  if (!data) return <Loading />
  const entry = data.items.find((row) => row.id === id)
  if (!entry) return <p className={ui.dim}>This fund request is gone.</p>

  const setStatus = async (status: FundStatus, undo = true) => {
    if (saving) return
    const before = entry.status
    setSaving(true)
    try {
      const { item } = await api<{ item: FundInterest }>(`/admin/fund/${entry.id}`, { method: 'PATCH', body: { status } })
      setData((prev) => prev && { items: prev.items.map((row) => (row.id === item.id ? item : row)) })
      onWaiting(item.status === 'new' || item.status === 'reviewing')
      toast({
        text: `Marked ${FUND_LABELS[item.status].toLowerCase()}`,
        detail: entry.name,
        action: undo ? { label: 'Undo', onAction: () => void setStatus(before, false) } : undefined,
      })
    } catch (failure) {
      if (!guard(failure)) toast({ text: 'That didn’t save', detail: messageFor(failure), tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Facts
        rows={{
          Amount: <span className={styles.figure}>{entry.amount}</span>,
          For: entry.target,
          'They’d spend it on': <span className={styles.pre}>{entry.spend}</span>,
          Year: entry.year,
          Notes: entry.notes && <span className={styles.pre}>{entry.notes}</span>,
        }}
      />
      <div className={styles.statusRow}>
        <span className={styles.statusLabel}>Status</span>
        <SegmentGroup className={styles.status} label={`Status for ${entry.name}`}>
          {FUND_STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              className={ui.tab}
              data-tone={value}
              aria-pressed={entry.status === value}
              disabled={saving}
              onClick={() => entry.status !== value && void setStatus(value)}
              {...gated('fund')}
            >
              {FUND_LABELS[value]}
            </button>
          ))}
        </SegmentGroup>
      </div>
    </>
  )
}

function ApplicationBody({ id }: { id: number }) {
  const { data, error } = useApi<{ items: RoleApplication[] }>('/admin/applications')
  if (error) return <Failed message={error.message} />
  if (!data) return <Loading />
  const entry = data.items.find((row) => row.id === id)
  if (!entry) return <p className={ui.dim}>This application is gone.</p>
  return (
    <>
      <Facts
        rows={{
          Role: entry.roleTitle + (entry.roleFilled ? ' (filled)' : ''),
          Year: entry.year,
          Link: entry.link && (
            <a className={ui.link} href={entry.link} target="_blank" rel="noreferrer">
              {entry.link.replace(/^https?:\/\//, '')}
            </a>
          ),
          'Résumé': entry.resume && (
            <a className={ui.link} href={`/api/admin/applications/${entry.id}/resume`} target="_blank" rel="noreferrer">
              {entry.resume.name} <ArrowOutIcon className={styles.out} />
            </a>
          ),
          Status: entry.status.charAt(0).toUpperCase() + entry.status.slice(1),
        }}
      />
      {entry.answers.length > 0 && (
        <dl className={styles.answers}>
          {entry.answers.map((answer) => (
            <div key={answer.question}>
              <dt>{answer.question}</dt>
              <dd className={styles.pre}>{answer.answer || '(No answer)'}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  )
}

function BoardBody({ id }: { id: number }) {
  const { data, error } = useApi<{ items: BoardInterest[] }>('/admin/board-interest')
  if (error) return <Failed message={error.message} />
  if (!data) return <Loading />
  const entry = data.items.find((row) => row.id === id)
  if (!entry) return <p className={ui.dim}>This entry is gone.</p>
  return (
    <Facts
      rows={{
        Seat: entry.role,
        Year: entry.year,
        'What they’d take on': entry.note && <span className={styles.pre}>{entry.note}</span>,
        Sent: formatTimestamp(entry.createdAt),
      }}
    />
  )
}
