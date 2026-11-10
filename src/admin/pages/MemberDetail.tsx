import { useCallback, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { Member, MemberDetail } from '../../../shared/api'
import { TRACKS, YEARS } from '../../../shared/constants'
import ui from '../admin.module.css'
import { MailIcon, TrashIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../lib/toast'
import { useSaveShortcut } from '../lib/keys'
import { api } from '../../lib/api'
import { ConfirmDialog } from './people/ConfirmDialog'
import { formatIsoDay, formatStamp, formatStampDate, stampToIso } from './people/format'
import { toApiError, useApi } from './people/useApi'
import shared from './people/people.module.css'
import styles from './MemberDetail.module.css'

export function Component() {
  const { id } = useParams()
  const { data, error, loading } = useApi<MemberDetail>(`/admin/members/${encodeURIComponent(id ?? '')}`)

  if (!data) {
    return (
      <div className={shared.page}>
        <PageHeader title={loading ? 'Member' : 'Not found'} tabTitle="Member" back={{ to: '/admin/members', label: 'Members' }} />
        {loading ? (
          <div className={shared.panel} aria-hidden="true">
            <span className={ui.skeleton} style={{ width: 180, marginBottom: 14 }} />
            <span className={ui.skeleton} style={{ width: 260 }} />
          </div>
        ) : (
          <p className={shared.error} role="alert">
            {error?.status === 404 ? 'That member doesn’t exist, or was deleted.' : error?.message}
          </p>
        )}
      </div>
    )
  }

  // Keyed by id so moving between members resets the form.
  return <Detail key={data.member.id} detail={data} />
}

type Draft = Pick<Member, 'name' | 'year' | 'track' | 'notes' | 'unsubscribed'>

const draftOf = (member: Member): Draft => ({
  name: member.name,
  year: member.year,
  track: member.track,
  notes: member.notes,
  unsubscribed: member.unsubscribed,
})

function Detail({ detail }: { detail: MemberDetail }) {
  const navigate = useNavigate()
  const toast = useToast()
  const form = useRef<HTMLFormElement>(null)
  const [member, setMember] = useState(detail.member)
  const [draft, setDraft] = useState<Draft>(() => draftOf(detail.member))
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const saved = draftOf(member)
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((key) => draft[key] !== saved[key])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    // Only send what changed, so a stale tab can't quietly overwrite someone else's edit.
    const patch = Object.fromEntries((Object.keys(draft) as (keyof Draft)[]).filter((key) => draft[key] !== saved[key]).map((key) => [key, draft[key]]))
    setSaving(true)
    setFormError('')
    setIssues({})
    try {
      const { item } = await api<{ item: Member }>(`/admin/members/${member.id}`, { method: 'PATCH', body: patch })
      setMember(item)
      setDraft(draftOf(item))
      toast('Member saved')
    } catch (error) {
      const failure = toApiError(error)
      setIssues(failure.issues)
      setFormError(failure.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await api(`/admin/members/${member.id}`, { method: 'DELETE' })
      toast('Member deleted')
      navigate('/admin/members', { replace: true })
    } catch (error) {
      setDeleteError(toApiError(error).message)
      setDeleting(false)
    }
  }

  const submit = useCallback(() => form.current?.requestSubmit(), [])
  useSaveShortcut(submit, dirty && !saving)

  const fieldProps = (key: keyof Draft) => ({
    'aria-invalid': issues[key] ? true : undefined,
    'aria-describedby': issues[key] ? `issue-${key}` : undefined,
  })
  const issue = (key: keyof Draft) =>
    issues[key] && (
      <p id={`issue-${key}`} className={shared.fieldError}>
        {issues[key]}
      </p>
    )

  return (
    <div className={shared.page}>
      <PageHeader
        title={member.name}
        tabTitle={`${member.name} · Members`}
        back={{ to: '/admin/members', label: 'Members' }}
        actions={
          <>
            <span className={styles.saveState} role="status">
              {saving ? 'Saving…' : dirty ? 'Unsaved changes' : ''}
            </span>
            {dirty && !saving && (
              <button type="button" className={ui.ghost} onClick={() => setDraft(draftOf(member))}>
                Discard
              </button>
            )}
            <a href={`mailto:${member.email}`} className={ui.button}>
              <MailIcon /> Write to {member.name.split(/\s+/)[0]}
            </a>
            <button type="submit" form="member-form" className={ui.primary} disabled={saving || !dirty}>
              Save changes
            </button>
          </>
        }
      />

      <div className={styles.who}>
        <span className={styles.avatar} aria-hidden="true">
          {member.name.trim().slice(0, 1).toUpperCase()}
        </span>
        <div className={styles.whoText}>
          <h2 className={styles.name}>{member.name}</h2>
          <p className={styles.meta}>
            <a href={`mailto:${member.email}`} className={shared.link}>
              {member.email}
            </a>
            <span className={shared.dim}>
              Joined <time dateTime={stampToIso(member.createdAt)}>{formatStamp(member.createdAt)}</time>
            </span>
            {member.unsubscribed && <span className={shared.flag}>Unsubscribed from email</span>}
          </p>
        </div>
      </div>

      <div className={styles.layout}>
        <form id="member-form" ref={form} className={`${shared.panel} ${styles.form}`} onSubmit={save} noValidate>
          <h2 className={shared.panelTitle}>Details</h2>

          <label className={shared.field}>
            <span className={shared.label}>Name</span>
            <input
              className={shared.input}
              value={draft.name}
              onChange={(event) => set('name', event.target.value)}
              maxLength={80}
              required
              {...fieldProps('name')}
            />
            {issue('name')}
          </label>

          <div className={styles.pair}>
            <label className={shared.field}>
              <span className={shared.label}>Year</span>
              <select className={shared.input} value={draft.year} onChange={(event) => set('year', event.target.value)} {...fieldProps('year')}>
                {/* Keep an old value selectable if it predates the current list. */}
                {!(YEARS as readonly string[]).includes(draft.year) && <option value={draft.year}>{draft.year}</option>}
                {YEARS.map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
              {issue('year')}
            </label>
            <label className={shared.field}>
              <span className={shared.label}>Track</span>
              <select className={shared.input} value={draft.track} onChange={(event) => set('track', event.target.value)} {...fieldProps('track')}>
                {!(TRACKS as readonly string[]).includes(draft.track) && <option value={draft.track}>{draft.track}</option>}
                {TRACKS.map((track) => (
                  <option key={track}>{track}</option>
                ))}
              </select>
              {issue('track')}
            </label>
          </div>

          <label className={shared.field}>
            <span className={shared.label}>Notes</span>
            <textarea
              className={shared.input}
              value={draft.notes}
              onChange={(event) => set('notes', event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Only admins see these."
              {...fieldProps('notes')}
            />
            {issue('notes')}
          </label>

          <div className={shared.field}>
            <label className={ui.switchRow}>
              <input
                type="checkbox"
                role="switch"
                className={ui.switch}
                checked={draft.unsubscribed}
                onChange={(event) => set('unsubscribed', event.target.checked)}
              />
              <span className={ui.switchText}>
                <span className={ui.switchLabel}>Unsubscribed from email</span>
                <span className={shared.hint}>They won’t get member or track emails. Event RSVP and fund emails still reach them.</span>
              </span>
            </label>
            {issue('unsubscribed')}
          </div>

          <p className={shared.error} role="alert" hidden={!formError}>
            {formError}
          </p>
        </form>

        <div className={styles.side}>
          <section className={shared.panel} aria-labelledby="rsvps-title">
            <h2 id="rsvps-title" className={shared.panelTitle}>
              RSVPs <span className={shared.count}>{detail.rsvps.length}</span>
            </h2>
            {detail.rsvps.length === 0 ? (
              <p className={shared.dim}>No RSVPs with this email.</p>
            ) : (
              <ul className={styles.list}>
                {[...detail.rsvps]
                  .sort((a, b) => b.eventDate.localeCompare(a.eventDate))
                  .map((rsvp) => (
                    <li key={rsvp.id} className={styles.item}>
                      <span>{rsvp.eventTitle}</span>
                      <time className={`${shared.figure} ${shared.dim}`} dateTime={rsvp.eventDate}>
                        {formatIsoDay(rsvp.eventDate)}
                      </time>

                    </li>
                  ))}
              </ul>
            )}
          </section>

          <section className={shared.panel} aria-labelledby="fund-title">
            <h2 id="fund-title" className={shared.panelTitle}>
              Fund interest <span className={shared.count}>{detail.fundInterest.length}</span>
            </h2>
            {detail.fundInterest.length === 0 ? (
              <p className={shared.dim}>Not on the fund interest list.</p>
            ) : (
              <ul className={styles.list}>
                {detail.fundInterest.map((entry) => (
                  <li key={entry.id} className={styles.fundItem}>
                    <div className={styles.item}>
                      <span>{entry.target}</span>
                      <span className={shared.state} data-tone={entry.status}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                    </div>
                    <p className={styles.fundMeta}>
                      <span className={styles.fundAmount}>{entry.amount}</span>
                      <time className={shared.dim} dateTime={stampToIso(entry.createdAt)}>
                        {formatStampDate(entry.createdAt)}
                      </time>
                    </p>
                    <p className={styles.spend}>{entry.spend}</p>
                  </li>
                ))}
              </ul>
            )}
            {detail.fundInterest.length > 0 && (
              <Link to="/admin/fund" className={`${shared.link} ${styles.more}`}>
                Review on the fund page
              </Link>
            )}
          </section>

          {/* On its own at the end of the page, away from Save. */}
          <button type="button" className={ui.dangerGhost} onClick={() => setConfirming(true)}>
            <TrashIcon /> Delete member
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Delete ${member.name}?`}
        confirmLabel="Delete member"
        danger
        busy={deleting}
        error={deleteError}
        onConfirm={remove}
        onCancel={() => {
          setConfirming(false)
          setDeleteError('')
        }}
      >
        <p>
          This removes {member.email} from the member list for good, along with their RSVPs and fund sign-ups. It can’t be undone.
        </p>
      </ConfirmDialog>
    </div>
  )
}
