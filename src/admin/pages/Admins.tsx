import { useState, type FormEvent } from 'react'
import { useLoaderData, useRevalidator } from 'react-router'
import type { Admin, InviteEmail } from '../../../shared/api'
import { api, ApiError } from '../../lib/api'
import admin from '../admin.module.css'
import { StatusLine, type StatusTone } from '../components/bits'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Field } from '../components/Field'
import { PageHeader } from '../components/PageHeader'
import { formatRelative, formatTimestamp } from '../lib/format'
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

export function Component() {
  const admins = useLoaderData<typeof adminsLoader>()
  const { me } = useSession()
  const guard = useAuthGuard()
  const revalidator = useRevalidator()

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [adding, setAdding] = useState(false)
  const [status, setStatus] = useState<{ tone: StatusTone; text: string }>({ tone: 'info', text: '' })
  const [pending, setPending] = useState<Admin | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState('')
  const [inviting, setInviting] = useState<string | null>(null)

  const isSelf = (row: Admin) => row.email.toLowerCase() === me.email.toLowerCase()

  async function add(event: FormEvent) {
    event.preventDefault()
    // People paste "Name <name@bu.edu>" from mail clients; the API wants the bare address.
    const value = email.trim().replace(/^.*<([^>]+)>\s*$/, '$1').trim()
    setAdding(true)
    setEmailError('')
    setStatus({ tone: 'info', text: 'Adding…' })
    try {
      const { item, emailed } = await api<{ item: Admin; emailed: InviteEmail }>('/admin/admins', {
        method: 'POST',
        body: { email: value },
      })
      setEmail('')
      setStatus(inviteStatus(item.email, emailed, true))
      revalidator.revalidate()
    } catch (error) {
      if (guard(error)) return
      const issue = error instanceof ApiError ? error.issues.email : undefined
      setEmailError(issue ?? (error instanceof ApiError && error.status === 409 ? error.message : ''))
      setStatus({ tone: 'error', text: messageFor(error) })
    } finally {
      setAdding(false)
    }
  }

  async function resendInvite(row: Admin) {
    setInviting(row.email)
    setStatus({ tone: 'info', text: `Emailing ${row.email}…` })
    try {
      const { emailed } = await api<{ emailed: InviteEmail }>(`/admin/admins/${encodeURIComponent(row.email)}/invite`, {
        method: 'POST',
      })
      setStatus(inviteStatus(row.email, emailed, false))
    } catch (error) {
      if (guard(error)) return
      setStatus({ tone: 'error', text: messageFor(error) })
    } finally {
      setInviting(null)
    }
  }

  async function remove() {
    if (!pending) return
    setRemoving(true)
    setRemoveError('')
    try {
      await api(`/admin/admins/${encodeURIComponent(pending.email)}`, { method: 'DELETE' })
      setStatus({ tone: 'ok', text: `Removed ${pending.email}. Their sessions end now.` })
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
      <PageHeader title="Admins" lede="Everyone here can sign in to the portal with Google and change anything in it." />

      <section className={admin.panel} aria-labelledby="add-admin-title">
        <div className={admin.panelHead}>
          <h2 id="add-admin-title" className={admin.panelTitle}>
            Add an admin
          </h2>
        </div>
        <div className={styles.addLayout}>
          <form className={styles.addForm} onSubmit={add} noValidate>
            <Field
              label="Email"
              hint="The address of their Google account (Gmail or BU). They sign in with that account."
              error={emailError}
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
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              )}
            </Field>
            <button type="submit" className={admin.primary} disabled={adding || !email.trim()}>
              {adding ? 'Adding…' : 'Add admin'}
            </button>
          </form>
          <p className={`${admin.hint} ${styles.owners}`}>
            Owners are listed in the <span className={admin.mono}>ADMIN_EMAILS</span> secret in the Worker’s settings, so
            nobody can lock them out from here.
          </p>
        </div>
        <StatusLine tone={status.tone}>{status.text}</StatusLine>
      </section>

      <div className={admin.panelFlush}>
        <table className={admin.table}>
          <thead>
            <tr>
              <th scope="col">Admin</th>
              <th scope="col">Added</th>
              <th scope="col">Last seen</th>
              <th scope="col" className={admin.rowActions}>
                <span className={admin.srOnly}>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {admins.map((row) => (
              <tr key={row.email}>
                <td>
                  <span className={styles.email}>{row.email}</span>
                  {(row.isOwner || isSelf(row)) && (
                    <span className={`${admin.flags} ${admin.flagMuted}`}>
                      {row.isOwner && isSelf(row) ? 'Owner, you' : row.isOwner ? 'Owner' : 'You'}
                    </span>
                  )}
                </td>
                <td data-label="Added" className={admin.soft}>
                  {row.isOwner ? (
                    <span className={admin.dim}>In the Worker’s config</span>
                  ) : (
                    <>
                      {row.createdAt && <span className={admin.figure}>{formatTimestamp(row.createdAt)}</span>}
                      {row.addedBy && (
                        <span className={admin.dim}>
                          {row.createdAt ? ' by ' : 'By '}
                          <span>{row.addedBy}</span>
                        </span>
                      )}
                    </>
                  )}
                </td>
                <td data-label="Last seen" className={admin.soft}>
                  {row.lastSeenAt ? <time dateTime={row.lastSeenAt} title={formatTimestamp(row.lastSeenAt)}>{formatRelative(row.lastSeenAt)}</time> : 'Never signed in'}
                </td>
                <td className={admin.rowActions}>
                  {row.isOwner ? (
                    <span className={admin.dim}>Can’t be removed here</span>
                  ) : isSelf(row) ? (
                    <span className={admin.dim}>Another admin can remove you</span>
                  ) : (
                    <span className={styles.rowButtons}>
                      <button
                        type="button"
                        className={`${admin.ghost} ${admin.small}`}
                        aria-label={`Email ${row.email} the sign-in link again`}
                        disabled={inviting !== null}
                        onClick={() => resendInvite(row)}
                      >
                        {inviting === row.email ? 'Emailing…' : 'Resend email'}
                      </button>
                      <button
                        type="button"
                        className={`${admin.ghost} ${admin.small}`}
                        aria-label={`Remove ${row.email}`}
                        onClick={() => {
                          setRemoveError('')
                          setPending(row)
                        }}
                      >
                        Remove
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={`Remove ${pending?.email ?? ''}?`}
        confirmLabel="Remove admin"
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
