import { useState, type FormEvent } from 'react'
import { useLoaderData, useRevalidator } from 'react-router'
import type { Admin } from '../../../shared/api'
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

export function Component() {
  const admins = useLoaderData<typeof adminsLoader>()
  const { me } = useSession()
  const guard = useAuthGuard()
  const revalidator = useRevalidator()

  const [login, setLogin] = useState('')
  const [loginError, setLoginError] = useState('')
  const [adding, setAdding] = useState(false)
  const [status, setStatus] = useState<{ tone: StatusTone; text: string }>({ tone: 'info', text: '' })
  const [pending, setPending] = useState<Admin | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState('')

  const isSelf = (row: Admin) => row.login.toLowerCase() === me.login.toLowerCase()

  async function add(event: FormEvent) {
    event.preventDefault()
    // People paste profile URLs and @handles; the API wants the bare login.
    const value = login.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\/.*$/, '')
    setAdding(true)
    setLoginError('')
    setStatus({ tone: 'info', text: 'Adding…' })
    try {
      const { item } = await api<{ item: Admin }>('/admin/admins', { method: 'POST', body: { login: value } })
      setLogin('')
      setStatus({ tone: 'ok', text: `Added @${item.login}. They can sign in with GitHub now.` })
      revalidator.revalidate()
    } catch (error) {
      if (guard(error)) return
      const issue = error instanceof ApiError ? error.issues.login : undefined
      setLoginError(issue ?? (error instanceof ApiError && error.status === 409 ? error.message : ''))
      setStatus({ tone: 'error', text: messageFor(error) })
    } finally {
      setAdding(false)
    }
  }

  async function remove() {
    if (!pending) return
    setRemoving(true)
    setRemoveError('')
    try {
      await api(`/admin/admins/${encodeURIComponent(pending.login)}`, { method: 'DELETE' })
      setStatus({ tone: 'ok', text: `Removed @${pending.login}. Their sessions end now.` })
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
      <PageHeader title="Admins" lede="Everyone here can sign in to the portal with GitHub and change anything in it." />

      <section className={admin.panel} aria-labelledby="add-admin-title">
        <div className={admin.panelHead}>
          <h2 id="add-admin-title" className={admin.panelTitle}>
            Add an admin
          </h2>
        </div>
        <form className={styles.addForm} onSubmit={add} noValidate>
          <Field label="GitHub username" hint="Their login, e.g. octocat. They sign in with that account." error={loginError}>
            {(control) => (
              <input
                {...control}
                className={`${admin.input} ${admin.mono}`}
                type="text"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="octocat"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
              />
            )}
          </Field>
          <button type="submit" className={admin.primary} disabled={adding || !login.trim()}>
            {adding ? 'Adding…' : 'Add admin'}
          </button>
        </form>
        <StatusLine tone={status.tone}>{status.text}</StatusLine>
      </section>

      <div className={admin.panelFlush}>
        <table className={admin.table}>
          <thead>
            <tr>
              <th scope="col">Admin</th>
              <th scope="col">Added</th>
              <th scope="col">Last seen</th>
              <th scope="col">
                <span className={admin.dim}>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {admins.map((row) => (
              <tr key={row.login}>
                <td>
                  <a className={`${admin.rowTitle} ${admin.mono}`} href={`https://github.com/${row.login}`} target="_blank" rel="noreferrer">
                    @{row.login}
                  </a>
                  <span className={admin.badges}>
                    {row.isOwner && <span className={admin.badgeAccent}>owner</span>}
                    {isSelf(row) && <span className={admin.badge}>you</span>}
                  </span>
                </td>
                <td data-label="Added" className={admin.soft}>
                  {row.isOwner ? (
                    <span className={admin.dim}>Set in the Worker’s config</span>
                  ) : (
                    <>
                      {row.addedBy ? <>by @{row.addedBy}</> : 'Added'}
                      {row.createdAt && <span className={`${admin.mono} ${admin.dim}`}> · {formatTimestamp(row.createdAt)}</span>}
                    </>
                  )}
                </td>
                <td data-label="Last seen" className={admin.soft}>
                  {row.lastSeenAt ? <time dateTime={row.lastSeenAt} title={formatTimestamp(row.lastSeenAt)}>{formatRelative(row.lastSeenAt)}</time> : 'Never signed in'}
                </td>
                <td>
                  {row.isOwner ? (
                    <span className={admin.hint}>Owners can’t be removed here.</span>
                  ) : isSelf(row) ? (
                    <span className={admin.hint}>Ask another admin to remove you.</span>
                  ) : (
                    <button
                      type="button"
                      className={`${admin.ghost} ${admin.small}`}
                      aria-label={`Remove @${row.login}`}
                      onClick={() => {
                        setRemoveError('')
                        setPending(row)
                      }}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={admin.hint}>
        Owners are listed in <span className={admin.mono}>ADMIN_GITHUB_LOGINS</span> in the Worker’s settings, so nobody can lock them out from here.
      </p>

      <ConfirmDialog
        open={pending !== null}
        title={`Remove @${pending?.login ?? ''}?`}
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
