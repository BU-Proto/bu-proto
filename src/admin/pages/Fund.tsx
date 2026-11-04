import { useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import type { FundInterest, FundStatus } from '../../../shared/api'
import { FUND_AMOUNTS, FUND_STATUSES } from '../../../shared/constants'
import ui from '../admin.module.css'
import { api } from '../../lib/api'
import { ConfirmDialog } from './people/ConfirmDialog'
import { formatStampDate, plural, stampToIso } from './people/format'
import { toApiError, useApi } from './people/useApi'
import shared from './people/people.module.css'
import styles from './Fund.module.css'

const isStatus = (value: string | null): value is FundStatus => (FUND_STATUSES as readonly string[]).includes(value ?? '')

/** "$100–$250" → [100, 250]; "Not sure yet" → null. */
function bandRange(amount: string): [number, number] | null {
  const match = /\$(\d+)\D+\$(\d+)/.exec(amount)
  return match ? [Number(match[1]), Number(match[2])] : null
}

const dollars = (n: number) => `$${n.toLocaleString('en-US')}`

export function Component() {
  const [params] = useSearchParams()
  const raw = params.get('status')
  const status = isStatus(raw) ? raw : null

  // One fetch for everything: the tab counts and the demand summary need the whole list anyway,
  // and switching tabs is then instant.
  const { data, error, loading, setData } = useApi<{ items: FundInterest[] }>('/admin/fund')
  const all = data?.items ?? []
  const shown = status ? all.filter((entry) => entry.status === status) : all

  const [announcement, setAnnouncement] = useState('')
  const [deleting, setDeleting] = useState<FundInterest | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const replace = (item: FundInterest) =>
    setData((prev) => prev && { items: prev.items.map((entry) => (entry.id === item.id ? item : entry)) })

  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    setDeleteError('')
    try {
      await api(`/admin/fund/${deleting.id}`, { method: 'DELETE' })
      setData((prev) => prev && { items: prev.items.filter((entry) => entry.id !== deleting.id) })
      setAnnouncement(`Deleted ${deleting.name}’s entry.`)
      setDeleting(null)
    } catch (failure) {
      setDeleteError(toApiError(failure).message)
    } finally {
      setBusy(false)
    }
  }

  const emailHref = `/admin/email?audience=fund${status ? `&status=${status}` : ''}`

  return (
    <div className={shared.page}>
      <title>Fund · Admin · BU Proto</title>

      <header className={shared.head}>
        <div className={shared.headText}>
          <p className={shared.eyebrow}>People</p>
          <h1 className={shared.title}>
            Fund interest
            {data && <span className={shared.count}>{plural(all.length, 'person', 'people')}</span>}
          </h1>
        </div>
        <div className={shared.headActions}>
          <Link to={emailHref} className={ui.primary}>
            {status ? `Email the ${status} list` : 'Email this list'}
          </Link>
        </div>
      </header>

      <p className={shared.note}>
        <strong>The fund isn’t open yet.</strong> No one can apply for money. This is the interest list: people telling us
        what they’d use a $50–$500 microgrant for. It’s how we show sponsors there’s demand, so keep it tidy. Statuses are
        for our own triage; nothing is promised.
      </p>

      <p className={shared.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      {data && <Demand entries={all} />}

      <nav aria-label="Filter by status" className={styles.filters}>
        <ul className={shared.tabs}>
          <li>
            <Link to={{ search: '' }} className={shared.tab} aria-current={status === null ? 'page' : undefined}>
              All <span className={shared.tabCount}>{all.length}</span>
            </Link>
          </li>
          {FUND_STATUSES.map((value) => (
            <li key={value}>
              <Link to={{ search: `?status=${value}` }} className={shared.tab} aria-current={status === value ? 'page' : undefined}>
                {value} <span className={shared.tabCount}>{all.filter((entry) => entry.status === value).length}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className={styles.live} aria-live="polite">
          {announcement}
        </p>
      </nav>

      {!data && loading ? (
        <p className={shared.empty}>Loading the interest list…</p>
      ) : data && shown.length === 0 ? (
        <p className={`${shared.panel} ${shared.empty}`}>{status ? `Nothing marked ${status}.` : 'No one has signed up yet.'}</p>
      ) : (
        <ul className={styles.entries}>
          {shown.map((entry) => (
            <Entry key={entry.id} entry={entry} onSaved={replace} onAnnounce={setAnnouncement} onDelete={() => setDeleting(entry)} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={deleting ? `Delete ${deleting.name}’s entry?` : 'Delete entry?'}
        confirmLabel="Delete entry"
        danger
        busy={busy}
        error={deleteError}
        onConfirm={remove}
        onCancel={() => {
          setDeleting(null)
          setDeleteError('')
        }}
      >
        <p>It comes off the interest list and out of the demand totals. It can’t be undone.</p>
      </ConfirmDialog>
    </div>
  )
}

/** Rough demand by amount band, without the declined entries. These are the numbers for sponsors. */
function Demand({ entries }: { entries: FundInterest[] }) {
  const counted = entries.filter((entry) => entry.status !== 'declined')
  const bands = FUND_AMOUNTS.map((amount) => ({
    amount,
    count: counted.filter((entry) => entry.amount === amount).length,
    range: bandRange(amount),
  }))
  // Older rows might carry an amount that's since left the list; count them as unsure.
  const other = counted.filter((entry) => !(FUND_AMOUNTS as readonly string[]).includes(entry.amount)).length
  const unsure = bands.find((band) => !band.range)
  if (unsure) unsure.count += other
  const low = bands.reduce((sum, band) => sum + (band.range ? band.range[0] * band.count : 0), 0)
  const high = bands.reduce((sum, band) => sum + (band.range ? band.range[1] * band.count : 0), 0)
  const peak = Math.max(1, ...bands.map((band) => band.count))
  const declined = entries.length - counted.length

  return (
    <section className={`${shared.panel} ${styles.demand}`} aria-labelledby="demand-title">
      <div className={styles.demandHead}>
        <h2 id="demand-title" className={shared.panelTitle}>
          Demand by amount
        </h2>
        <p className={styles.total}>
          <span className={styles.totalValue}>{counted.length === 0 ? '$0' : `${dollars(low)}–${dollars(high)}`}</span>
          <span className={shared.dim}>
            {' '}
            from {plural(counted.length, 'person', 'people')}
            {unsure && unsure.count > 0 && `, ${unsure.count} unsure of the amount`}
            {declined > 0 && `. Leaves out ${declined} declined`}.
          </span>
        </p>
      </div>
      <dl className={styles.bands}>
        {bands.map((band) => (
          <div key={band.amount} className={styles.band}>
            <dt className={shared.mono}>{band.amount}</dt>
            <dd>
              <span className={styles.bar} style={{ inlineSize: `${(band.count / peak) * 100}%` }} aria-hidden="true" />
              <span className={shared.mono}>{band.count}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

interface EntryProps {
  entry: FundInterest
  onSaved: (item: FundInterest) => void
  onAnnounce: (message: string) => void
  onDelete: () => void
}

function Entry({ entry, onSaved, onAnnounce, onDelete }: EntryProps) {
  const id = useId()
  const [notes, setNotes] = useState(entry.notes)
  const [saving, setSaving] = useState<'status' | 'notes' | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const patch = async (kind: 'status' | 'notes', body: { status?: FundStatus; notes?: string }) => {
    if (saving) return
    setSaving(kind)
    setError('')
    setMessage('')
    try {
      const { item } = await api<{ item: FundInterest }>(`/admin/fund/${entry.id}`, { method: 'PATCH', body })
      if (kind === 'notes') setNotes(item.notes)
      // A status change can move the entry off the current tab, so announce it at page level.
      if (kind === 'status') onAnnounce(`${entry.name} marked ${item.status}.`)
      else setMessage('Notes saved.')
      onSaved(item)
    } catch (failure) {
      const apiError = toApiError(failure)
      setError(apiError.issues.notes ?? apiError.issues.status ?? apiError.message)
    } finally {
      setSaving(null)
    }
  }

  return (
    <li className={`${shared.panel} ${styles.entry}`}>
      <div className={styles.entryHead}>
        <div className={styles.who}>
          <h2 className={styles.name}>
            {entry.name}
            <span className={shared.badge} data-tone={entry.status}>
              {entry.status}
            </span>
          </h2>
          <a href={`mailto:${entry.email}`} className={`${shared.link} ${shared.mono} ${styles.email}`}>
            {entry.email}
          </a>
          <span className={shared.dim}>{entry.year}</span>
        </div>
        <div className={styles.facts}>
          <span className={styles.amount}>{entry.amount}</span>
          <time className={`${shared.mono} ${shared.dim}`} dateTime={stampToIso(entry.createdAt)}>
            {formatStampDate(entry.createdAt)}
          </time>
        </div>
      </div>

      <dl className={styles.answers}>
        <div>
          <dt className={shared.label}>Target</dt>
          <dd>{entry.target}</dd>
        </div>
        <div>
          <dt className={shared.label}>What they’d spend it on</dt>
          <dd className={styles.spend}>{entry.spend}</dd>
        </div>
      </dl>

      <div className={styles.controls}>
        <label className={`${shared.field} ${styles.statusField}`}>
          <span className={shared.label}>Status</span>
          <select
            className={shared.input}
            value={entry.status}
            disabled={saving !== null}
            onChange={(event) => patch('status', { status: event.target.value as FundStatus })}
          >
            {FUND_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <div className={`${shared.field} ${styles.notesField}`}>
          <label className={shared.label} htmlFor={`${id}-notes`}>
            Notes
          </label>
          <textarea
            id={`${id}-notes`}
            className={shared.input}
            rows={2}
            maxLength={2000}
            value={notes}
            placeholder="Only admins see these."
            onChange={(event) => {
              setNotes(event.target.value)
              setMessage('')
            }}
          />
        </div>
        <div className={styles.entryActions}>
          <button
            type="button"
            className={shared.small}
            disabled={saving !== null || notes === entry.notes}
            onClick={() => patch('notes', { notes })}
          >
            {saving === 'notes' ? 'Saving…' : 'Save notes'}
          </button>
          <button type="button" className={shared.dangerSmall} onClick={onDelete}>
            Delete
          </button>
          <span aria-live="polite">
            {message && <span className={shared.status}>{message}</span>}
            {error && <span className={shared.error}>{error}</span>}
          </span>
        </div>
      </div>
    </li>
  )
}
