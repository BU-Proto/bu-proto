import { useId, useState } from 'react'
import { Link, useRevalidator, useSearchParams } from 'react-router'
import type { ApplicationStatus, RoleApplication } from '../../../shared/api'
import { APPLICATION_STATUSES } from '../../../shared/constants'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { ArrowOutIcon, DownloadIcon, TrashIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../lib/toast'
import { ConfirmDialog } from './people/ConfirmDialog'
import { downloadFile, formatStampDate, stampToIso, toCsv } from './people/format'
import { toApiError, useApi } from './people/useApi'
import shared from './people/people.module.css'
import entries from './Fund.module.css'
import styles from './Applications.module.css'

const isStatus = (value: string | null): value is ApplicationStatus => (APPLICATION_STATUSES as readonly string[]).includes(value ?? '')

const STATUS_LABELS: Record<ApplicationStatus, string> = { new: 'New', reviewing: 'Reviewing', accepted: 'Accepted', declined: 'Declined' }

/** "184 KB", "1.2 MB". */
const fileSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)

/** Everything in one sheet, a column per question asked, for reading side by side. */
function exportCsv(applications: RoleApplication[]) {
  const questions = [...new Set(applications.flatMap((entry) => entry.answers.map((answer) => answer.question)))]
  const header = ['Role', 'Name', 'Email', 'Year', 'Status', 'Applied', 'Link', 'Résumé', ...questions, 'Notes']
  const rows = applications.map((entry) => [
    entry.roleTitle,
    entry.name,
    entry.email,
    entry.year,
    STATUS_LABELS[entry.status],
    stampToIso(entry.createdAt).slice(0, 10),
    entry.link,
    // The file can't ride in a sheet; its address opens it for anyone signed in to the portal.
    entry.resume ? `${window.location.origin}/api/admin/applications/${entry.id}/resume` : '',
    ...questions.map((question) => entry.answers.find((answer) => answer.question === question)?.answer ?? ''),
    entry.notes,
  ])
  downloadFile(`proto-role-applications-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(header, rows))
}

/** Everyone who applied for a role on the site, newest first, with where each one stands. */
export function Component() {
  const [params, setParams] = useSearchParams()
  const rawStatus = params.get('status')
  const status = isStatus(rawStatus) ? rawStatus : null
  const role = params.get('role') ?? ''

  // One fetch for everything: the counts need the whole list anyway, and filtering is then instant.
  const { data, error, loading, setData } = useApi<{ items: RoleApplication[] }>('/admin/applications')
  const all = data?.items ?? []
  const roleTitles = [...new Set(all.map((entry) => entry.roleTitle))].sort((a, b) => a.localeCompare(b))
  const forRole = role ? all.filter((entry) => entry.roleTitle === role) : all
  const shown = status ? forRole.filter((entry) => entry.status === status) : forRole

  const toast = useToast()
  // The sidebar's count of unread applications comes from the shell's loader; a change here refreshes it.
  const { revalidate } = useRevalidator()
  const [deleting, setDeleting] = useState<RoleApplication | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const setParam = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  const search = (nextStatus: ApplicationStatus | null) => {
    const next = new URLSearchParams()
    if (nextStatus) next.set('status', nextStatus)
    if (role) next.set('role', role)
    const text = next.toString()
    return text ? `?${text}` : ''
  }

  const replace = (item: RoleApplication) => {
    setData((prev) => prev && { items: prev.items.map((entry) => (entry.id === item.id ? item : entry)) })
    void revalidate()
  }

  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    setDeleteError('')
    try {
      await api(`/admin/applications/${deleting.id}`, { method: 'DELETE' })
      setData((prev) => prev && { items: prev.items.filter((entry) => entry.id !== deleting.id) })
      toast(`${deleting.name}’s application deleted`)
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
        title="Roles"
        tabTitle="Role applications"
        lede="Who applied for which role on the site, with their résumé. Each applicant got a confirmation email, and the owners a note. Statuses are our own triage: nobody is told anything until one of us writes to them."
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
        <div className={styles.filters}>
          <nav aria-label="Filter by status">
            <ul className={shared.tabs}>
              <li>
                <Link to={{ search: search(null) }} replace className={shared.tab} aria-current={status === null ? 'page' : undefined}>
                  All <span className={shared.tabCount}>{forRole.length}</span>
                </Link>
              </li>
              {APPLICATION_STATUSES.map((value) => (
                <li key={value}>
                  <Link to={{ search: search(value) }} replace className={shared.tab} aria-current={status === value ? 'page' : undefined}>
                    {STATUS_LABELS[value]} <span className={shared.tabCount}>{forRole.filter((entry) => entry.status === value).length}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {roleTitles.length > 1 && (
            <label className={styles.roleFilter}>
              <span className={ui.srOnly}>Filter by role</span>
              <select className={shared.input} value={roleTitles.includes(role) ? role : ''} onChange={(event) => setParam('role', event.target.value)}>
                <option value="">Every role</option>
                {roleTitles.map((title) => (
                  <option key={title} value={title}>
                    {title} ({all.filter((entry) => entry.roleTitle === title).length})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
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
          <p>Applications sent from a role’s page on the site show up here. A role needs to be published to take them.</p>
          <Link to="/admin/roles" className={ui.button}>
            See the roles
          </Link>
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
        title={deleting ? `Delete ${deleting.name}’s application?` : 'Delete application?'}
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
        <p>Their résumé, their answers and your notes go with it. It can’t be undone.</p>
      </ConfirmDialog>
    </div>
  )
}

interface EntryProps {
  entry: RoleApplication
  onSaved: (item: RoleApplication) => void
  onDelete: () => void
}

function Entry({ entry, onSaved, onDelete }: EntryProps) {
  const id = useId()
  const toast = useToast()
  const [notes, setNotes] = useState(entry.notes)
  const [saving, setSaving] = useState<'status' | 'notes' | null>(null)
  const [error, setError] = useState('')
  const first = entry.name.trim().split(/\s+/)[0]
  const mail = `mailto:${entry.email}?subject=${encodeURIComponent(`Your BU Proto application: ${entry.roleTitle}`)}`

  const patch = async (kind: 'status' | 'notes', body: { status?: ApplicationStatus; notes?: string }, undo = true) => {
    if (saving) return
    const before = entry.status
    setSaving(kind)
    setError('')
    try {
      const { item } = await api<{ item: RoleApplication }>(`/admin/applications/${entry.id}`, { method: 'PATCH', body })
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
            <span>{entry.year}</span>
            <time dateTime={stampToIso(entry.createdAt)}>Applied {formatStampDate(entry.createdAt)}</time>
            {entry.updatedAt.slice(0, 10) !== entry.createdAt.slice(0, 10) && <span>Changed {formatStampDate(entry.updatedAt)}</span>}
          </p>
        </div>
        {/* One click sets it, as a switch would; the toast carries the undo. */}
        <div className={`${ui.tabs} ${entries.status}`} role="group" aria-label={`Status for ${entry.name}`}>
          {APPLICATION_STATUSES.map((value) => (
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

      <dl className={entries.answers}>
        <div>
          <dt>Role</dt>
          <dd>
            {entry.roleId === null ? (
              <>
                {entry.roleTitle} <span className={shared.dim}>(role since deleted)</span>
              </>
            ) : (
              <Link to={`/admin/roles/${entry.roleId}`} className={shared.link}>
                {entry.roleTitle}
              </Link>
            )}
          </dd>
        </div>
        {entry.link && (
          <div>
            <dt>Their link</dt>
            <dd className={styles.url}>
              <a href={entry.link} target="_blank" rel="noopener noreferrer" className={shared.link}>
                {entry.link.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </dd>
          </div>
        )}
        <div>
          <dt>Résumé</dt>
          <dd>
            {entry.resume ? (
              <>
                <a href={`/api/admin/applications/${entry.id}/resume`} target="_blank" rel="noopener" className={`${shared.link} ${styles.resume}`}>
                  {entry.resume.name} <ArrowOutIcon />
                </a>{' '}
                <span className={shared.dim}>{fileSize(entry.resume.size)}</span>
              </>
            ) : (
              <span className={shared.dim}>None sent</span>
            )}
          </dd>
        </div>
        {/* A question can run to a sentence, so it sits over its answer, not in the label column. */}
        {entry.answers.map(({ question, answer }) => (
          <div key={question} className={styles.asked}>
            <dt>{question}</dt>
            <dd className={entries.spend}>{answer}</dd>
          </div>
        ))}
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
          <button type="button" className={`${ui.button} ${entries.saveNotes}`} disabled={saving !== null} onClick={() => patch('notes', { notes })}>
            {saving === 'notes' ? 'Saving…' : 'Save notes'}
          </button>
        )}
        <button type="button" className={`${ui.dangerGhost} ${entries.delete}`} aria-label={`Delete ${entry.name}’s application`} onClick={onDelete}>
          <TrashIcon />
        </button>
      </div>
      <p className={shared.error} role="alert" hidden={!error}>
        {error}
      </p>
    </li>
  )
}
