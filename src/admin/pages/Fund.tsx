import { useId, useState } from 'react'
import { Link, useRevalidator, useSearchParams } from 'react-router'
import type { FundInterest, FundStatus } from '../../../shared/api'
import { FUND_AMOUNTS, FUND_STATUSES } from '../../../shared/constants'
import ui from '../admin.module.css'
import { MailIcon, TrashIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../lib/toast'
import { api } from '../../lib/api'
import { ConfirmDialog } from './people/ConfirmDialog'
import { formatStampDate, plural, stampToIso } from './people/format'
import { toApiError, useApi } from './people/useApi'
import shared from './people/people.module.css'
import styles from './Fund.module.css'

const isStatus = (value: string | null): value is FundStatus => (FUND_STATUSES as readonly string[]).includes(value ?? '')

const STATUS_LABELS: Record<FundStatus, string> = { new: 'New', reviewing: 'Reviewing', approved: 'Approved', declined: 'Declined' }

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

  const toast = useToast()
  // The sidebar's count of new entries comes from the shell's loader; a change here refreshes it.
  const { revalidate } = useRevalidator()
  const [deleting, setDeleting] = useState<FundInterest | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const replace = (item: FundInterest) => {
    setData((prev) => prev && { items: prev.items.map((entry) => (entry.id === item.id ? item : entry)) })
    void revalidate()
  }

  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    setDeleteError('')
    try {
      await api(`/admin/fund/${deleting.id}`, { method: 'DELETE' })
      setData((prev) => prev && { items: prev.items.filter((entry) => entry.id !== deleting.id) })
      toast(`${deleting.name}’s entry deleted`)
      setDeleting(null)
      void revalidate()
    } catch (failure) {
      setDeleteError(toApiError(failure).message)
    } finally {
      setBusy(false)
    }
  }

  const emailHref = `/admin/email?audience=fund${status ? `&status=${status}` : ''}`

  return (
    <div className={shared.page}>
      <PageHeader
        title="Fund interest"
        tabTitle="Fund"
        count={data ? all.length : undefined}
        lede="The fund isn’t open yet, so no one can apply. This is who’d use a $50–$500 microgrant and for what: it’s how we show sponsors there’s demand. Statuses are our own triage; nothing is promised."
        actions={
          <Link to={emailHref} className={ui.primary}>
            <MailIcon /> {status ? `Email everyone ${STATUS_LABELS[status].toLowerCase()}` : 'Email this list'}
          </Link>
        }
      />

      <p className={shared.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      {data && all.length > 0 && <Demand entries={all} />}

      {data && all.length > 0 && (
        <nav aria-label="Filter by status">
          <ul className={shared.tabs}>
            <li>
              <Link to={{ search: '' }} replace className={shared.tab} aria-current={status === null ? 'page' : undefined}>
                All <span className={shared.tabCount}>{all.length}</span>
              </Link>
            </li>
            {FUND_STATUSES.map((value) => (
              <li key={value}>
                <Link to={{ search: `?status=${value}` }} replace className={shared.tab} aria-current={status === value ? 'page' : undefined}>
                  {STATUS_LABELS[value]} <span className={shared.tabCount}>{all.filter((entry) => entry.status === value).length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {!data && loading ? (
        <div className={shared.panel} aria-hidden="true">
          <span className={ui.skeleton} style={{ width: 160, marginBottom: 14 }} />
          <span className={ui.skeleton} style={{ width: 320, marginBottom: 10 }} />
          <span className={ui.skeleton} style={{ width: 240 }} />
        </div>
      ) : data && shown.length === 0 ? (
        <div className={`${shared.panel} ${shared.empty}`}>
          <h2>{status ? `Nothing marked ${STATUS_LABELS[status].toLowerCase()}` : 'No one has signed up yet'}</h2>
          {status ? (
            <Link to={{ search: '' }} replace className={ui.button}>
              Show the whole list
            </Link>
          ) : (
            <p>People who fill in the fund form on the site show up here.</p>
          )}
        </div>
      ) : (
        <ul className={styles.entries}>
          {shown.map((entry) => (
            <Entry key={entry.id} entry={entry} onSaved={replace} onDelete={() => setDeleting(entry)} />
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
          <span className={styles.totalValue}>{counted.length === 0 ? '$0' : `${dollars(low)} to ${dollars(high)}`}</span>
          <span className={styles.totalNote}>
            from {plural(counted.length, 'person', 'people')}
            {unsure && unsure.count > 0 && `, ${unsure.count} unsure of the amount`}
            {declined > 0 && `. Leaves out ${declined} declined`}.
          </span>
        </p>
      </div>
      <dl className={styles.bands}>
        {bands.map((band) => (
          <div key={band.amount} className={styles.band}>
            <dt className={shared.figure}>{band.amount}</dt>
            <dd>
              <span className={styles.bar} style={{ inlineSize: `${(band.count / peak) * 100}%` }} aria-hidden="true" />
              <span className={`${shared.figure} ${styles.bandCount}`}>{band.count}</span>
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
  onDelete: () => void
}

function Entry({ entry, onSaved, onDelete }: EntryProps) {
  const id = useId()
  const toast = useToast()
  const [notes, setNotes] = useState(entry.notes)
  const [saving, setSaving] = useState<'status' | 'notes' | null>(null)
  const [error, setError] = useState('')
  const first = entry.name.trim().split(/\s+/)[0]

  const patch = async (kind: 'status' | 'notes', body: { status?: FundStatus; notes?: string }, undo = true) => {
    if (saving) return
    const before = entry.status
    setSaving(kind)
    setError('')
    try {
      const { item } = await api<{ item: FundInterest }>(`/admin/fund/${entry.id}`, { method: 'PATCH', body })
      if (kind === 'notes') {
        setNotes(item.notes)
        toast('Notes saved')
      } else {
        // A status change can move the entry off the current tab, so it's said where it can
        // still be read, with the way back.
        toast({
          text: `${first} marked ${STATUS_LABELS[item.status].toLowerCase()}`,
          action: undo ? { label: 'Undo', onAction: () => void patch('status', { status: before }, false) } : undefined,
        })
      }
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
        <span className={ui.avatar} aria-hidden="true">
          {entry.name.trim().slice(0, 1).toUpperCase()}
        </span>
        <div className={styles.who}>
          <h2 className={styles.name}>{entry.name}</h2>
          <p className={styles.meta}>
            <a href={`mailto:${entry.email}`} className={shared.link}>
              {entry.email}
            </a>
            <span>{entry.year}</span>
            <time dateTime={stampToIso(entry.createdAt)}>Signed up {formatStampDate(entry.createdAt)}</time>
          </p>
        </div>
        {/* One click sets it, as a switch would; the toast carries the undo. */}
        <div className={`${ui.tabs} ${styles.status}`} role="group" aria-label={`Status for ${entry.name}`}>
          {FUND_STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              className={ui.tab}
              data-tone={value}
              aria-pressed={entry.status === value}
              disabled={saving !== null}
              onClick={() => entry.status !== value && patch('status', { status: value })}
            >
              {STATUS_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <dl className={styles.answers}>
        <div>
          <dt>Amount</dt>
          <dd className={shared.figure}>{entry.amount}</dd>
        </div>
        <div>
          <dt>For</dt>
          <dd>{entry.target}</dd>
        </div>
        <div>
          <dt>They’d spend it on</dt>
          <dd className={styles.spend}>{entry.spend}</dd>
        </div>
      </dl>

      <div className={styles.foot}>
        <label className={ui.srOnly} htmlFor={`${id}-notes`}>
          Notes on {entry.name}
        </label>
        <textarea
          id={`${id}-notes`}
          className={`${shared.input} ${styles.notes}`}
          rows={1}
          maxLength={2000}
          value={notes}
          placeholder="Add a note. Only admins see these."
          onChange={(event) => setNotes(event.target.value)}
        />
        {notes !== entry.notes && (
          <button type="button" className={`${ui.button} ${styles.saveNotes}`} disabled={saving !== null} onClick={() => patch('notes', { notes })}>
            {saving === 'notes' ? 'Saving…' : 'Save notes'}
          </button>
        )}
        <button type="button" className={`${ui.dangerGhost} ${styles.delete}`} aria-label={`Delete ${entry.name}’s entry`} onClick={onDelete}>
          <TrashIcon />
        </button>
      </div>
      <p className={shared.error} role="alert" hidden={!error}>
        {error}
      </p>
    </li>
  )
}
