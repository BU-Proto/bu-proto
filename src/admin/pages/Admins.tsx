import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useLoaderData, useRevalidator } from 'react-router'
import {
  ADMIN_LEVEL_LABELS,
  ADMIN_LEVELS,
  AREA_COVERS,
  AREA_LABELS,
  AREA_SEATS,
  AREAS,
  type AccessLevel,
  type AdminLevel,
  type Area,
} from '../../../shared/access'
import type { Admin, InviteEmail } from '../../../shared/api'
import { api, ApiError } from '../../lib/api'
import admin from '../admin.module.css'
import { StatusLine, type StatusTone } from '../components/bits'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Field } from '../components/Field'
import { ChevronRightIcon, PlusIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { SegmentGroup } from '../components/SegmentGroup'
import { useGated } from '../lib/access'
import { formatRelative, formatTimestamp } from '../lib/format'
import { useToast } from '../lib/toast'
import { messageFor, useAuthGuard, useSession } from '../lib/session'
import type { adminsLoader } from '../loaders'
import styles from './Admins.module.css'

/** What to say once the "you're an admin" email has (or hasn't) gone out, after an add or a resend. */
function inviteStatus(email: string, emailed: InviteEmail, added: boolean): { tone: StatusTone; text: string } {
  const signIn = `${location.origin}/admin`
  if (added) {
    switch (emailed) {
      case 'sent':
        return { tone: 'ok', text: `Added ${email}, and we emailed them. They sign in with Google using that address.` }
      case 'logged':
        return { tone: 'ok', text: `Added ${email}. No RESEND_API_KEY here, so their email went to the server log.` }
      case 'failed':
        return { tone: 'error', text: `Added ${email}, but the email didn’t send. Tell them yourself: sign in at ${signIn} with Google, as ${email}.` }
    }
  }
  switch (emailed) {
    case 'sent':
      return { tone: 'ok', text: `Emailed ${email} the sign-in link again.` }
    case 'logged':
      return { tone: 'ok', text: `No RESEND_API_KEY here, so the email to ${email} went to the server log.` }
    case 'failed':
      return { tone: 'error', text: `The email to ${email} didn’t send. Tell them yourself: sign in at ${signIn} with Google, as ${email}.` }
  }
}

/** One line on each level, under the picker and in "Who can change what". */
const LEVEL_NOTES: Record<AccessLevel, string> = {
  owner: 'Changes everything. Set in the Worker’s ADMIN_EMAILS, so nobody can lock them out from here.',
  admin: 'Changes everything, including who has access.',
  board: 'Shared work, plus the areas their seat looks after.',
  team: 'Shared work only. For scouts, event helpers and anyone helping without a seat.',
}

/** The level's dot: owners and admins in mint, the board in sky, the team plain. */
function LevelState({ level }: { level: AccessLevel }) {
  return (
    <span
      className={level === 'board' ? `${admin.state} ${styles.board}` : admin.state}
      data-tone={level === 'owner' || level === 'admin' ? 'live' : undefined}
    >
      {ADMIN_LEVEL_LABELS[level]}
    </span>
  )
}

/** "Everything, including Access", "Shared work, Fund", "Shared work". */
function canChangeText(row: Pick<Admin, 'level' | 'areas'>): string {
  if (row.level === 'owner' || row.level === 'admin') return 'Everything, including Access'
  if (row.level === 'team') return 'Shared work'
  return row.areas.length ? ['Shared work', ...row.areas.map((area) => AREA_LABELS[area])].join(', ') : 'Shared work, no area yet'
}

/** An initial, from their Google name when we have it. */
const initialOf = (row: Admin) => (row.name?.trim() || row.email).slice(0, 1).toUpperCase()

export function Component() {
  const admins = useLoaderData<typeof adminsLoader>()
  const { me } = useSession()
  const guard = useAuthGuard()
  const gated = useGated()
  const revalidator = useRevalidator()
  const toast = useToast()
  const locked = gated('admin')

  // The dialog: adding someone, or one row being edited.
  const [editing, setEditing] = useState<Admin | 'new' | null>(null)
  const [pending, setPending] = useState<Admin | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState('')

  const isSelf = (row: Admin) => row.email.toLowerCase() === me.email.toLowerCase()
  const count = admins.length === 1 ? '1 person' : `${admins.length} people`

  async function remove() {
    if (!pending) return
    setRemoving(true)
    setRemoveError('')
    try {
      await api(`/admin/admins/${encodeURIComponent(pending.email)}`, { method: 'DELETE' })
      toast(`Removed ${pending.email}. Their sessions end now.`)
      setPending(null)
      revalidator.revalidate()
    } catch (error) {
      if (guard(error)) return
      setRemoveError(messageFor(error))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className={admin.page}>
      <PageHeader
        title="Access"
        count={count}
        lede="Everyone here signs in with Google and can read everything. Their level decides what they can change."
        actions={
          <button type="button" className={admin.primary} onClick={() => setEditing('new')} {...locked}>
            <PlusIcon /> Add someone
          </button>
        }
      />

      <section className={admin.panelFlush} aria-label="People with access">
        <table className={admin.table}>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Level</th>
              <th scope="col">Seat</th>
              <th scope="col">Can change</th>
              <th scope="col">Last seen</th>
              <th scope="col" className={admin.rowGo}>
                <span className={admin.srOnly}>Edit</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {admins.map((row) => {
              // Owners aren't edited here, and nobody without full access edits anyone.
              const opens = !row.isOwner && !locked.disabled
              const name = row.name?.trim() || row.email
              return (
                <tr key={row.email}>
                  <td>
                    <span className={admin.person}>
                      {row.avatarUrl ? (
                        <img className={styles.picture} src={row.avatarUrl} alt="" width={26} height={26} referrerPolicy="no-referrer" />
                      ) : (
                        <span className={admin.avatar} aria-hidden="true">
                          {initialOf(row)}
                        </span>
                      )}
                      <span className={styles.who}>
                        <span className={styles.nameLine}>
                          {opens ? (
                            <button type="button" className={`${admin.rowTitle} ${styles.open}`} onClick={() => setEditing(row)}>
                              {name}
                            </button>
                          ) : (
                            <span className={admin.rowTitle}>{name}</span>
                          )}
                          {isSelf(row) && <span className={`${admin.flags} ${admin.flagMuted}`}>You</span>}
                        </span>
                        {row.name?.trim() && <span className={styles.email}>{row.email}</span>}
                      </span>
                    </span>
                  </td>
                  <td data-label="Level">
                    <LevelState level={row.level} />
                  </td>
                  <td data-label="Seat" className={admin.soft}>
                    {row.seat || <span className={admin.dim}>{row.isOwner ? 'Set in ADMIN_EMAILS' : 'No seat'}</span>}
                  </td>
                  <td data-label="Can change" className={`${admin.soft} ${styles.changes}`}>
                    {canChangeText(row)}
                  </td>
                  <td data-label="Last seen" className={admin.soft}>
                    {row.lastSeenAt ? (
                      <time dateTime={row.lastSeenAt} title={formatTimestamp(row.lastSeenAt)}>
                        {formatRelative(row.lastSeenAt)}
                      </time>
                    ) : (
                      <span className={admin.dim}>Not yet</span>
                    )}
                  </td>
                  <td className={admin.rowGo} aria-hidden="true">
                    {opens && <ChevronRightIcon />}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      {/* Straight on the page, not a second table: four levels, a line each, and under the board
          what each seat adds. */}
      <section className={styles.rules} aria-labelledby="rules-title">
        <h2 id="rules-title" className={admin.panelTitle}>
          Who can change what
        </h2>
        <dl className={styles.levels}>
          {(['owner', 'admin', 'board', 'team'] as const).map((level) => (
            <div key={level} className={styles.level}>
              <dt>
                <LevelState level={level} />
              </dt>
              <dd>
                {LEVEL_NOTES[level]}
                {level === 'board' && (
                  <ul className={styles.seats}>
                    {AREAS.map((area) => (
                      <li key={area}>
                        <span>{AREA_LABELS[area]}</span>
                        <span className={admin.dim}>{AREA_COVERS[area]}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {editing && (
        <AccessDialog
          key={editing === 'new' ? 'new' : editing.email}
          row={editing === 'new' ? null : editing}
          self={editing !== 'new' && isSelf(editing)}
          onClose={() => setEditing(null)}
          onDone={(next) => {
            setEditing(null)
            toast(next)
            revalidator.revalidate()
          }}
          onRemove={(row) => {
            setEditing(null)
            setRemoveError('')
            setPending(row)
          }}
        />
      )}

      <ConfirmDialog
        open={pending !== null}
        title={`Remove ${pending?.email ?? ''}?`}
        confirmLabel="Remove access"
        danger
        busy={removing}
        error={removeError}
        onConfirm={remove}
        onCancel={() => setPending(null)}
      >
        <p>They’re signed out everywhere and can’t get back in unless someone adds them again.</p>
      </ConfirmDialog>
    </div>
  )
}

interface AccessDialogProps {
  /** The person being edited, or null to add someone. */
  row: Admin | null
  /** The signed-in admin's own row: their seat can change, their level and areas can't. */
  self: boolean
  onClose: () => void
  onDone: (status: { tone: StatusTone; text: string }) => void
  onRemove: (row: Admin) => void
}

/** Add someone, or change someone's level, areas and seat. Mounted only while open. */
function AccessDialog({ row, self, onClose, onDone, onRemove }: AccessDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const guard = useAuthGuard()

  const [email, setEmail] = useState('')
  const [level, setLevel] = useState<AdminLevel>(row && row.level !== 'owner' ? row.level : 'admin')
  const [areas, setAreas] = useState<Area[]>(row?.areas ?? [])
  const [seat, setSeat] = useState(row?.seat ?? '')
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<'save' | 'invite' | null>(null)
  const [message, setMessage] = useState<{ tone: StatusTone; text: string }>({ tone: 'info', text: '' })

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const toggleArea = (area: Area) =>
    setAreas((current) => (current.includes(area) ? current.filter((value) => value !== area) : AREAS.filter((value) => value === area || current.includes(value))))

  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy('save')
    setIssues({})
    setMessage({ tone: 'info', text: '' })
    const chosen = level === 'board' ? areas : []
    try {
      if (row) {
        // Your own level and areas stay put (the server says so too), so only the seat goes.
        const body = self ? { seat } : { level, areas: chosen, seat }
        await api<{ item: Admin }>(`/admin/admins/${encodeURIComponent(row.email)}`, { method: 'PATCH', body })
        onDone({ tone: 'ok', text: `Saved ${row.name?.trim() || row.email}.` })
      } else {
        // People paste "Name <name@bu.edu>" from mail clients; the API wants the bare address.
        const value = email.trim().replace(/^.*<([^>]+)>\s*$/, '$1').trim()
        const { item, emailed } = await api<{ item: Admin; emailed: InviteEmail }>('/admin/admins', {
          method: 'POST',
          body: { email: value, level, areas: chosen, seat },
        })
        onDone(inviteStatus(item.email, emailed, true))
      }
    } catch (error) {
      if (guard(error)) return
      setIssues(error instanceof ApiError ? error.issues : {})
      setMessage({ tone: 'error', text: messageFor(error) })
    } finally {
      setBusy(null)
    }
  }

  async function resendInvite() {
    if (!row) return
    setBusy('invite')
    setMessage({ tone: 'info', text: `Emailing ${row.email}…` })
    try {
      const { emailed } = await api<{ emailed: InviteEmail }>(`/admin/admins/${encodeURIComponent(row.email)}/invite`, { method: 'POST' })
      setMessage(inviteStatus(row.email, emailed, false))
    } catch (error) {
      if (guard(error)) return
      setMessage({ tone: 'error', text: messageFor(error) })
    } finally {
      setBusy(null)
    }
  }

  return (
    <dialog
      ref={ref}
      className={`${admin.dialog} ${styles.dialog}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <form className={admin.dialogBody} onSubmit={save} noValidate>
        <h2 id={titleId} className={admin.dialogTitle}>
          {row ? row.name?.trim() || row.email : 'Add someone'}
        </h2>
        {row?.name?.trim() && <p className={`${admin.hint} ${styles.dialogEmail}`}>{row.email}</p>}

        <div className={styles.dialogFields}>
          {!row && (
            <Field
              label="Email"
              hint="The address of their Google account (Gmail or BU). They sign in with that account, and we email them the link."
              error={issues.email}
            >
              {(control) => (
                <input
                  {...control}
                  className={admin.input}
                  type="email"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="name@bu.edu"
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              )}
            </Field>
          )}

          <fieldset className={styles.fieldset} disabled={self}>
            <legend className={admin.label}>Level</legend>
            <SegmentGroup label="Level">
              {ADMIN_LEVELS.map((value) => (
                <button key={value} type="button" className={admin.tab} aria-pressed={level === value} onClick={() => setLevel(value)}>
                  {ADMIN_LEVEL_LABELS[value]}
                </button>
              ))}
            </SegmentGroup>
            <p className={admin.hint}>{self ? 'You can’t change your own level. Another admin can.' : LEVEL_NOTES[level]}</p>
            {issues.level && <p className={admin.error}>{issues.level}</p>}
          </fieldset>

          {level === 'board' && (
            <fieldset className={styles.fieldset} disabled={self}>
              <legend className={admin.label}>Areas they can change</legend>
              <ul className={styles.areas}>
                {AREAS.map((area) => (
                  <li key={area}>
                    <label className={styles.area}>
                      <input type="checkbox" checked={areas.includes(area)} onChange={() => toggleArea(area)} />
                      <span>{AREA_SEATS[area]}</span>
                      <span className={admin.dim}>{AREA_COVERS[area]}</span>
                    </label>
                  </li>
                ))}
              </ul>
              {issues.areas && <p className={admin.error}>{issues.areas}</p>}
            </fieldset>
          )}

          <Field label="Seat" hint="Shown next to their name, like Head of Community or Scout. Optional." error={issues.seat}>
            {(control) => (
              <input
                {...control}
                className={admin.input}
                type="text"
                maxLength={80}
                autoComplete="off"
                placeholder={level === 'board' && areas.length === 1 ? AREA_SEATS[areas[0]] : ''}
                value={seat}
                onChange={(event) => setSeat(event.target.value)}
              />
            )}
          </Field>
        </div>

        <div className={styles.dialogStatus}>
          <StatusLine tone={message.tone}>{message.text}</StatusLine>
        </div>

        <div className={`${admin.dialogActions} ${styles.dialogActions}`}>
          {row && !self && (
            <span className={styles.rowButtons}>
              <button type="button" className={`${admin.dangerGhost} ${admin.small}`} disabled={busy !== null} onClick={() => onRemove(row)}>
                Remove access
              </button>
              <button
                type="button"
                className={`${admin.ghost} ${admin.small}`}
                aria-label={`Email ${row.email} the sign-in link again`}
                disabled={busy !== null}
                onClick={resendInvite}
              >
                {busy === 'invite' ? 'Emailing…' : 'Resend email'}
              </button>
            </span>
          )}
          <button type="button" className={admin.button} onClick={onClose} disabled={busy !== null}>
            Cancel
          </button>
          <button type="submit" className={admin.primary} disabled={busy !== null || (!row && !email.trim())}>
            {busy === 'save' ? 'Saving…' : row ? 'Save' : 'Add and email them'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
