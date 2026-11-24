import { useId, useState } from 'react'
import { Link, useRevalidator, useSearchParams } from 'react-router'
import type { FounderApplication, FounderStatus } from '../../../shared/api'
import { FOUNDER_STATUSES } from '../../../shared/constants'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { DownloadIcon, TrashIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { SegmentGroup } from '../components/SegmentGroup'
import { useGated } from '../lib/access'
import { useToast } from '../lib/toast'
import { ConfirmDialog } from './people/ConfirmDialog'
import { downloadFile, formatIsoDay, formatStampDate, stampToIso, toCsv } from './people/format'
import { toApiError, useApi } from './people/useApi'
import shared from './people/people.module.css'
import entries from './Fund.module.css'
import styles from './Founders.module.css'

// Applications to the Founders Circle, the small invite-only group inside Proto for founders
// already building something real. Read them, ask some to a call, decide. Deciding is for owners
// and admins, as roles are (the Worker checks too).

const isStatus = (value: string | null): value is FounderStatus => (FOUNDER_STATUSES as readonly string[]).includes(value ?? '')

const STATUS_LABELS: Record<FounderStatus, string> = { new: 'New', interview: 'Interview', accepted: 'Accepted', declined: 'Declined' }

/** Everything in one sheet, for reading side by side or sharing with whoever does the calls. */
function exportCsv(applications: FounderApplication[]) {
  const header = [
    'Name',
    'Email',
    'School',
    'Company',
    'Link',
    'Stage',
    'Time on it',
    "What they're building",
    'The last three months',
    'Who else is on it',
    'What would help most',
    'Status',
    'Interview',
    'Applied',
    'Notes',
  ]
  const rows = applications.map((entry) => [
    entry.name,
    entry.email,
    entry.school,
    entry.company,
    entry.link,
    entry.stage,
    entry.commitment,
    entry.building,
    entry.progress,
    entry.team,
    entry.help,
    STATUS_LABELS[entry.status],
    entry.interviewOn ?? '',
    stampToIso(entry.createdAt).slice(0, 10),
    entry.notes,
  ])
  downloadFile(`proto-founders-circle-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(header, rows))
}

/** Everyone who applied to the Founders Circle, newest first, with where each one stands. */
export function Component() {
  const [params] = useSearchParams()
  const raw = params.get('status')
  const status = isStatus(raw) ? raw : null

  // One fetch for everything: the tab counts need the whole list anyway, and filtering is then instant.
  const { data, error, loading, setData } = useApi<{ items: FounderApplication[] }>('/admin/founders')
  const all = data?.items ?? []
  const shown = status ? all.filter((entry) => entry.status === status) : all

  const toast = useToast()
  // The sidebar's count of new applications comes from the shell's loader; a change here refreshes it.
  const { revalidate } = useRevalidator()
  const [deleting, setDeleting] = useState<FounderApplication | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const replace = (item: FounderApplication) => {
    setData((prev) => prev && { items: prev.items.map((entry) => (entry.id === item.id ? item : entry)) })
    void revalidate()
  }

  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    setDeleteError('')
    try {
      await api(`/admin/founders/${deleting.id}`, { method: 'DELETE' })
      setData((prev) => prev && { items: prev.items.filter((entry) => entry.id !== deleting.id) })
      toast(`${deleting.name}'s application deleted`)
      setDeleting(null)
      void revalidate()
    } catch (failure) {
      setDeleteError(toApiError(failure).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={shared.page}>
      <PageHeader
        title="Founders Circle"
        count={data ? all.length : undefined}
        lede="Who applied from the Founders Circle page. Each got an email saying we read every application and invite some applicants to a short call. Statuses are our own triage: nobody is told anything until one of us writes to them. To bring someone accepted to an invite-only event, add them as a guest on that event."
        actions={
          all.length > 0 ? (
            <button type="button" className={ui.button} onClick={() => exportCsv(shown)}>
              <DownloadIcon /> Download CSV
            </button>
          ) : undefined
        }
      />

      <p className={shared.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      {data && all.length > 0 && (
        <nav aria-label="Filter by status">
          <ul className={shared.tabs}>
            <li>
              <Link to={{ search: '' }} replace className={shared.tab} aria-current={status === null ? 'page' : undefined}>
                All <span className={shared.tabCount}>{all.length}</span>
              </Link>
            </li>
            {FOUNDER_STATUSES.map((value) => (
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
      ) : data && all.length === 0 ? (
        <div className={`${shared.panel} ${shared.empty}`}>
          <h2>No one has applied yet</h2>
          <p>Applications sent from the Founders Circle page on the site show up here.</p>
        </div>
      ) : data && shown.length === 0 ? (
        <div className={`${shared.panel} ${shared.empty}`}>
          <h2>{status ? `Nothing marked ${STATUS_LABELS[status].toLowerCase()}` : 'Nothing here'}</h2>
          <Link to={{ search: '' }} replace className={ui.button}>
            Show every application
          </Link>
        </div>
      ) : (
        <ul className={entries.entries}>
          {shown.map((entry) => (
            <Entry key={entry.id} entry={entry} onSaved={replace} onDelete={() => setDeleting(entry)} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={deleting ? `Delete ${deleting.name}'s application?` : 'Delete application?'}
        confirmLabel="Delete application"
        danger
        busy={busy}
        error={deleteError}
        onConfirm={remove}
        onCancel={() => {
          setDeleting(null)
          setDeleteError('')
        }}
      >
        <p>Their answers and your notes go with it. It can't be undone.</p>
      </ConfirmDialog>
    </div>
  )
}

interface EntryProps {
  entry: FounderApplication
  onSaved: (item: FounderApplication) => void
  onDelete: () => void
}

type Saving = 'status' | 'notes' | 'interview'

function Entry({ entry, onSaved, onDelete }: EntryProps) {
  const id = useId()
  const toast = useToast()
  // Who joins is for owners and admins, as roles are.
  const locked = useGated()('admin')
  const [notes, setNotes] = useState(entry.notes)
  const [interviewOn, setInterviewOn] = useState(entry.interviewOn ?? '')
  const [saving, setSaving] = useState<Saving | null>(null)
  const [error, setError] = useState('')
  const first = entry.name.trim().split(/\s+/)[0]
  const mail = `mailto:${entry.email}?subject=${encodeURIComponent('Your Founders Circle application')}`
  const dayChanged = interviewOn !== (entry.interviewOn ?? '')

  const patch = async (kind: Saving, body: { status?: FounderStatus; notes?: string; interviewOn?: string | null }, undo = true) => {
    if (saving) return
    const before = entry.status
    setSaving(kind)
    setError('')
    try {
      const { item } = await api<{ item: FounderApplication }>(`/admin/founders/${entry.id}`, { method: 'PATCH', body })
      if (kind === 'notes') {
        setNotes(item.notes)
        toast('Notes saved')
      } else if (kind === 'interview') {
        setInterviewOn(item.interviewOn ?? '')
        toast(item.interviewOn ? `${first}'s interview set for ${formatIsoDay(item.interviewOn)}` : `${first}'s interview day cleared`)
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
      setError(apiError.issues.notes ?? apiError.issues.status ?? apiError.issues.interviewOn ?? apiError.message)
    } finally {
      setSaving(null)
    }
  }

  return (
    <li className={`${shared.panel} ${entries.entry}`}>
      <div className={entries.entryHead}>
        <span className={ui.avatar} aria-hidden="true">
          {entry.name.trim().slice(0, 1).toUpperCase()}
        </span>
        <div className={entries.who}>
          <h2 className={entries.name}>{entry.name}</h2>
          <p className={entries.meta}>
            <a href={mail} className={shared.link}>
              {entry.email}
            </a>
            {entry.school && <span>{entry.school}</span>}
            <time dateTime={stampToIso(entry.createdAt)}>Applied {formatStampDate(entry.createdAt)}</time>
          </p>
        </div>
        {/* One click sets it, as a switch would; the toast carries the undo. */}
        <SegmentGroup className={entries.status} label={`Status for ${entry.name}`}>
          {FOUNDER_STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              className={ui.tab}
              data-tone={value}
              aria-pressed={entry.status === value}
              disabled={saving !== null || locked.disabled}
              title={locked.title}
              onClick={() => entry.status !== value && patch('status', { status: value })}
            >
              {STATUS_LABELS[value]}
            </button>
          ))}
        </SegmentGroup>
      </div>

      <dl className={entries.answers}>
        <div>
          <dt>Company</dt>
          <dd>
            {entry.company}
            {entry.link && (
              <>
                {' · '}
                <a href={entry.link} target="_blank" rel="noopener noreferrer" className={`${shared.link} ${styles.url}`}>
                  {entry.link.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>Stage</dt>
          <dd>{entry.stage}</dd>
        </div>
        <div>
          <dt>Time on it</dt>
          <dd>{entry.commitment}</dd>
        </div>
        <div>
          <dt>What they're building</dt>
          <dd className={entries.spend}>{entry.building}</dd>
        </div>
        <div>
          <dt>The last three months</dt>
          <dd className={entries.spend}>{entry.progress}</dd>
        </div>
        {entry.team && (
          <div>
            <dt>Who else is on it</dt>
            <dd className={entries.spend}>{entry.team}</dd>
          </div>
        )}
        {entry.help && (
          <div>
            <dt>What would help most</dt>
            <dd className={entries.spend}>{entry.help}</dd>
          </div>
        )}
        <div>
          <dt>
            <label htmlFor={`${id}-interview`}>Interview</label>
          </dt>
          <dd className={styles.interview}>
            <input
              id={`${id}-interview`}
              type="date"
              className={`${shared.input} ${styles.day}`}
              value={interviewOn}
              disabled={locked.disabled}
              title={locked.title}
              onChange={(event) => setInterviewOn(event.target.value)}
            />
            {dayChanged && (
              <button
                type="button"
                className={`${ui.button} ${ui.small}`}
                disabled={saving !== null || locked.disabled}
                onClick={() => patch('interview', { interviewOn: interviewOn || null })}
              >
                {saving === 'interview' ? 'Saving…' : interviewOn ? 'Save day' : 'Clear day'}
              </button>
            )}
            {!dayChanged && entry.interviewOn && (
              <button
                type="button"
                className={`${ui.ghost} ${ui.small}`}
                disabled={saving !== null || locked.disabled}
                title={locked.title}
                onClick={() => patch('interview', { interviewOn: null })}
              >
                Clear
              </button>
            )}
            {!entry.interviewOn && !dayChanged && <span className={shared.dim}>No call set</span>}
          </dd>
        </div>
      </dl>

      <div className={entries.foot}>
        <label className={ui.srOnly} htmlFor={`${id}-notes`}>
          Notes on {entry.name}
        </label>
        <textarea
          id={`${id}-notes`}
          className={`${shared.input} ${entries.notes}`}
          rows={1}
          maxLength={2000}
          value={notes}
          placeholder="Add a note. Only admins see these."
          onChange={(event) => setNotes(event.target.value)}
        />
        {notes !== entry.notes && (
          <button type="button" className={`${ui.button} ${entries.saveNotes}`} disabled={saving !== null || locked.disabled} title={locked.title} onClick={() => patch('notes', { notes })}>
            {saving === 'notes' ? 'Saving…' : 'Save notes'}
          </button>
        )}
        <button type="button" className={`${ui.dangerGhost} ${entries.delete}`} aria-label={`Delete ${entry.name}'s application`} {...locked} onClick={onDelete}>
          <TrashIcon />
        </button>
      </div>
      <p className={shared.error} role="alert" hidden={!error}>
        {error}
      </p>
    </li>
  )
}
