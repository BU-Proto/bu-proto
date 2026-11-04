import { useState } from 'react'
import { Link } from 'react-router'
import type { Rsvp } from '../../../shared/api'
import { api } from '../../lib/api'
import admin from '../admin.module.css'
import { formatTimestamp, plural } from '../lib/format'
import { messageFor, useAuthGuard } from '../lib/session'
import { EmptyState, StatusLine, type StatusTone } from './bits'
import { ConfirmDialog } from './ConfirmDialog'

/** Who RSVP'd to one event, under its editor. */
export function RsvpPanel({ eventId, initial }: { eventId: number; initial: Rsvp[] }) {
  const guard = useAuthGuard()
  const [rsvps, setRsvps] = useState(initial)
  const [status, setStatus] = useState<{ tone: StatusTone; text: string }>({ tone: 'info', text: '' })
  const [pending, setPending] = useState<Rsvp | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState('')

  const emails = [...new Set(rsvps.map((rsvp) => rsvp.email))]

  async function copyEmails() {
    try {
      await navigator.clipboard.writeText(emails.join(', '))
      setStatus({ tone: 'ok', text: `Copied ${plural(emails.length, 'email')}.` })
    } catch {
      setStatus({ tone: 'error', text: 'Your browser blocked the clipboard. Select the emails in the table instead.' })
    }
  }

  async function remove() {
    if (!pending) return
    setRemoving(true)
    setRemoveError('')
    try {
      await api(`/admin/rsvps/${pending.id}`, { method: 'DELETE' })
      setRsvps((list) => list.filter((rsvp) => rsvp.id !== pending.id))
      setStatus({ tone: 'ok', text: `Removed ${pending.name}’s RSVP.` })
      setPending(null)
    } catch (error) {
      if (guard(error)) return
      setRemoveError(messageFor(error))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <section className={admin.panelFlush} aria-labelledby="rsvps-title">
      <div className={admin.flushHead}>
        <h2 id="rsvps-title" className={admin.panelTitle}>
          RSVPs <span className={admin.count}>{rsvps.length}</span>
        </h2>
        <div className={admin.flushStatus}>
          <StatusLine tone={status.tone}>{status.text}</StatusLine>
        </div>
        {rsvps.length > 0 && (
          <div className={admin.actions}>
            <button type="button" className={`${admin.button} ${admin.small}`} onClick={copyEmails}>
              Copy all emails
            </button>
            <Link className={`${admin.button} ${admin.small}`} to={`/admin/email?event=${eventId}`}>
              Email these people
            </Link>
          </div>
        )}
      </div>


      {rsvps.length === 0 ? (
        <EmptyState title="No RSVPs yet">
          <p>People who RSVP on the public events page show up here.</p>
        </EmptyState>
      ) : (
        <table className={admin.table}>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">RSVP’d</th>
              <th scope="col" className={admin.rowActions}>
                <span className={admin.srOnly}>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rsvps.map((rsvp) => (
              <tr key={rsvp.id}>
                <td>{rsvp.name}</td>
                <td data-label="Email" className={admin.mono}>
                  {rsvp.email}
                </td>
                <td data-label="RSVP’d" className={`${admin.soft} ${admin.figure}`}>
                  {formatTimestamp(rsvp.createdAt)}
                </td>
                <td className={admin.rowActions}>

                  <button
                    type="button"
                    className={`${admin.ghost} ${admin.small}`}
                    aria-label={`Remove ${rsvp.name}’s RSVP`}
                    onClick={() => {
                      setRemoveError('')
                      setPending(rsvp)
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={pending !== null}
        title="Remove this RSVP?"
        confirmLabel="Remove RSVP"
        danger
        busy={removing}
        error={removeError}
        onConfirm={remove}
        onCancel={() => setPending(null)}
      >
        {pending && (
          <p>
            {pending.name} (<span className={admin.mono}>{pending.email}</span>) comes off the list. They can RSVP again from the site.
          </p>
        )}
      </ConfirmDialog>
    </section>
  )
}
