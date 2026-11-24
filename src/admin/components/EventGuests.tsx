import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { GUEST_ROLES, GUEST_STATUSES, type EventGuest, type GuestRole, type GuestStatus } from '../../../shared/api'
import { api, ApiError } from '../../lib/api'
import ui from '../admin.module.css'
import { useGated } from '../lib/access'
import { initials, useOwners } from '../lib/activity'
import { messageFor, useAuthGuard } from '../lib/session'
import { useToast } from '../lib/toast'
import { useApi } from '../pages/people/useApi'
import { EmptyState } from './bits'
import { ConfirmDialog } from './ConfirmDialog'
import { PlusIcon } from './icons'
import { PersonPicker, type PickedPerson } from './PersonPicker'
import styles from './EventGuests.module.css'

const ROLE_LABELS: Record<GuestRole, string> = {
  speaker: 'Speaker',
  judge: 'Judge',
  sponsor: 'Sponsor',
  host: 'Host',
  moderator: 'Moderator',
  guest: 'Guest',
}
const STATUS_LABELS: Record<GuestStatus, string> = { invited: 'Invited', confirmed: 'Confirmed', declined: 'Declined' }
const STATUS_TONES: Record<GuestStatus, string> = { invited: 'sample', confirmed: 'live', declined: 'draft' }

/**
 * Speakers, judges, sponsors and VCs coming to one event, under its editor. Anyone can read the
 * list; adding, confirming and removing guests is Community's (the Worker checks too). An
 * invite-only event takes no RSVPs, so its guests are everyone coming, members included.
 */
export function EventGuests({ eventId, inviteOnly = false }: { eventId: number; inviteOnly?: boolean }) {
  const guard = useAuthGuard()
  const toast = useToast()
  const gated = useGated()('community')
  const { labelFor } = useOwners()
  const { data, error, loading, setData } = useApi<{ items: EventGuest[] }>(`/admin/events/${eventId}/guests`)
  const guests = data?.items ?? []

  const [adding, setAdding] = useState(false)
  const [person, setPerson] = useState<PickedPerson | null>(null)
  const [role, setRole] = useState<GuestRole>('speaker')
  const [addError, setAddError] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [pending, setPending] = useState<EventGuest | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState('')

  const replace = (guest: EventGuest) => setData((current) => current && { items: current.items.map((item) => (item.id === guest.id ? guest : item)) })

  async function add(event: FormEvent) {
    event.preventDefault()
    if (!person) {
      setAddError(inviteOnly ? 'Pick someone.' : 'Pick a contact.')
      return
    }
    setSaving(true)
    setAddError('')
    try {
      const { item } = await api<{ item: EventGuest }>(`/admin/events/${eventId}/guests`, { body: { contactKey: person.key, role } })
      setData((current) => ({ items: [...(current?.items ?? []), item] }))
      toast(`${item.contact.name} added as ${ROLE_LABELS[item.role].toLowerCase()}`)
      setPerson(null)
      setAdding(false)
    } catch (failure) {
      if (guard(failure)) return
      setAddError(failure instanceof ApiError && failure.issues.contactKey ? `${messageFor(failure)} ${failure.issues.contactKey}.` : messageFor(failure))
    } finally {
      setSaving(false)
    }
  }

  async function setStatus(guest: EventGuest, status: GuestStatus) {
    setBusyId(guest.id)
    try {
      const { item } = await api<{ item: EventGuest }>(`/admin/events/${eventId}/guests/${guest.id}`, { method: 'PATCH', body: { status } })
      replace(item)
    } catch (failure) {
      if (guard(failure)) return
      toast({ text: 'Couldn’t change that guest', detail: messageFor(failure), tone: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  async function remove() {
    if (!pending) return
    setRemoving(true)
    setRemoveError('')
    try {
      await api(`/admin/events/${eventId}/guests/${pending.id}`, { method: 'DELETE' })
      setData((current) => current && { items: current.items.filter((item) => item.id !== pending.id) })
      toast(`${pending.contact.name} is off the guest list`)
      setPending(null)
    } catch (failure) {
      if (guard(failure)) return
      setRemoveError(messageFor(failure))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <section className={ui.panelFlush} aria-labelledby="guests-title">
      <div className={ui.flushHead}>
        <h2 id="guests-title" className={ui.panelTitle}>
          Guests <span className={ui.count}>{guests.length}</span>
        </h2>
        <div className={ui.flushStatus} />
        {!adding && (
          <button type="button" className={`${ui.button} ${ui.small}`} onClick={() => setAdding(true)} {...gated}>
            <PlusIcon /> Add guest
          </button>
        )}
      </div>

      {adding && (
        <form className={styles.add} onSubmit={add} noValidate>
          <div className={styles.addPerson}>
            <label className={ui.label} htmlFor={`guest-person-${eventId}`}>
              {inviteOnly ? 'Person' : 'Contact'}
            </label>
            <PersonPicker
              id={`guest-person-${eventId}`}
              value={person}
              onChange={setPerson}
              kinds={inviteOnly ? undefined : ['contact', 'alum']}
              exclude={guests.map((guest) => guest.contact.key)}
              placeholder="Search People"
            />
          </div>
          <div className={styles.addRole}>
            <label className={ui.label} htmlFor={`guest-role-${eventId}`}>
              Role
            </label>
            <select id={`guest-role-${eventId}`} className={ui.input} value={role} onChange={(event) => setRole(event.target.value as GuestRole)}>
              {GUEST_ROLES.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.addActions}>
            <button type="button" className={ui.ghost} onClick={() => setAdding(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={ui.primary} disabled={saving || gated.disabled}>
              {saving ? 'Adding…' : 'Add'}
            </button>
          </div>
          <p className={`${ui.error} ${styles.addError}`} role="alert" hidden={!addError}>
            {addError}
          </p>
        </form>
      )}

      {error && !data ? (
        <p className={`${ui.error} ${styles.loadError}`} role="alert">
          {error.message}
        </p>
      ) : !data && loading ? (
        <div className={styles.loading} aria-hidden="true">
          <span className={ui.skeleton} style={{ width: 220 }} />
        </div>
      ) : guests.length === 0 ? (
        <EmptyState title="No guests yet">
          {inviteOnly ? (
            <p>This event is invite only, so the site takes no RSVPs. Add everyone you invite here, Founders Circle members included.</p>
          ) : (
            <p>Add the speakers, judges, sponsors and VCs coming to this event.</p>
          )}
        </EmptyState>
      ) : (
        <table className={ui.table}>
          <thead>
            <tr>
              <th scope="col">Guest</th>
              <th scope="col">Org</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Owner</th>
              <th scope="col" className={ui.rowActions}>
                <span className={ui.srOnly}>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest.id}>
                <td>
                  <Link to={`/admin/people/${guest.contact.key}`} className={ui.rowTitle}>
                    {guest.contact.name}
                  </Link>
                </td>
                <td data-label="Org" className={ui.soft}>
                  {guest.contact.orgName ?? <span className={ui.dim}>None</span>}
                </td>
                <td data-label="Role" className={ui.soft}>
                  {ROLE_LABELS[guest.role]}
                </td>
                <td data-label="Status">
                  {gated.disabled ? (
                    <span className={ui.state} data-tone={STATUS_TONES[guest.status]}>
                      {STATUS_LABELS[guest.status]}
                    </span>
                  ) : (
                    // The row state's dot and word, as a select, so any status is one change away.
                    <label className={styles.statusPick} data-tone={STATUS_TONES[guest.status]}>
                      <span className={ui.srOnly}>{guest.contact.name}’s status</span>
                      <select value={guest.status} disabled={busyId === guest.id} onChange={(event) => setStatus(guest, event.target.value as GuestStatus)}>
                        {GUEST_STATUSES.map((value) => (
                          <option key={value} value={value}>
                            {STATUS_LABELS[value]}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </td>
                <td data-label="Owner">
                  {guest.ownerEmail ? (
                    <span className={ui.avatar} title={labelFor(guest.ownerEmail)}>
                      {initials(guest.ownerEmail)}
                    </span>
                  ) : (
                    <span className={ui.dim}>No one</span>
                  )}
                </td>
                <td className={ui.rowActions}>
                  {guest.status === 'invited' && (
                    <button type="button" className={`${ui.button} ${ui.small}`} disabled={busyId === guest.id || gated.disabled} title={gated.title} onClick={() => setStatus(guest, 'confirmed')}>
                      Mark confirmed
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${ui.ghost} ${ui.small}`}
                    aria-label={`Remove ${guest.contact.name}`}
                    disabled={gated.disabled}
                    title={gated.title}
                    onClick={() => {
                      setRemoveError('')
                      setPending(guest)
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
        title="Remove this guest?"
        confirmLabel="Remove guest"
        danger
        busy={removing}
        error={removeError}
        onConfirm={remove}
        onCancel={() => setPending(null)}
      >
        {pending && <p>{pending.contact.name} comes off this event’s guest list. They stay in People.</p>}
      </ConfirmDialog>
    </section>
  )
}
