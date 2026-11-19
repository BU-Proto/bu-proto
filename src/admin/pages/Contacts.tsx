import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import type { Contact, ContactInput } from '../../../shared/api'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { Field } from '../components/Field'
import { PlusIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../lib/toast'
import { ConfirmDialog } from './people/ConfirmDialog'
import shared from './people/people.module.css'
import { toApiError, useApi } from './people/useApi'
import styles from './Asks.module.css'

const EMPTY: ContactInput = { name: '', email: '', organization: '', notes: '' }

/** The people and offices we ask things of. Claude reads each one's notes when it writes to them. */
export function Component() {
  const toast = useToast()
  const { data, error, loading, setData } = useApi<{ items: Contact[] }>('/admin/contacts')
  const [editing, setEditing] = useState<{ id: number | null; values: ContactInput } | null>(null)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleting, setDeleting] = useState<Contact | null>(null)
  const all = data?.items ?? []

  const edit = (contact: Contact | null) => {
    setIssues({})
    setFormError('')
    setEditing({ id: contact?.id ?? null, values: contact ? { name: contact.name, email: contact.email, organization: contact.organization, notes: contact.notes } : EMPTY })
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing || busy) return
    setBusy(true)
    setIssues({})
    setFormError('')
    try {
      const { item } = await api<{ item: Contact }>(editing.id ? `/admin/contacts/${editing.id}` : '/admin/contacts', {
        method: editing.id ? 'PATCH' : 'POST',
        body: editing.values,
      })
      setData((prev) => {
        const items = prev?.items ?? []
        const next = editing.id ? items.map((entry) => (entry.id === item.id ? item : entry)) : [...items, item]
        return { items: next.sort((a, b) => a.name.localeCompare(b.name)) }
      })
      toast(editing.id ? 'Contact saved' : `${item.name} added`)
      setEditing(null)
    } catch (failure) {
      const apiError = toApiError(failure)
      setIssues(apiError.issues)
      setFormError(apiError.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await api(`/admin/contacts/${deleting.id}`, { method: 'DELETE' })
      setData((prev) => prev && { items: prev.items.filter((entry) => entry.id !== deleting.id) })
      toast(`${deleting.name} removed`)
      setDeleting(null)
    } catch (failure) {
      setFormError(toApiError(failure).message)
    } finally {
      setBusy(false)
    }
  }

  const set = (key: keyof ContactInput, value: string) => setEditing((prev) => prev && { ...prev, values: { ...prev.values, [key]: value } })

  return (
    <div className={shared.page}>
      <PageHeader
        title="Email"
        tabTitle="Contacts"
        lede="Who we ask things of: BU offices, sponsors, organizers, speakers. What you write about each one, Claude reads when it writes to them."
        actions={
          <button type="button" className={ui.primary} onClick={() => edit(null)}>
            <PlusIcon /> New contact
          </button>
        }
      />
      <p className={shared.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      {editing && (
        <form className={shared.panel} onSubmit={save} noValidate>
          <div className={styles.stack}>
            <h2 className={ui.panelTitle}>{editing.id ? 'Edit contact' : 'New contact'}</h2>
            <div className={styles.formGrid}>
              <Field label="Name" error={issues.name} hint="A person, or an office (“Spark! front desk”)">
                {(props) => <input {...props} className={ui.input} value={editing.values.name} onChange={(event) => set('name', event.target.value)} />}
              </Field>
              <Field label="Email" error={issues.email}>
                {(props) => <input {...props} type="email" className={ui.input} value={editing.values.email} onChange={(event) => set('email', event.target.value)} />}
              </Field>
              <Field label="Organization" error={issues.organization} hint="Optional">
                {(props) => <input {...props} className={ui.input} value={editing.values.organization} onChange={(event) => set('organization', event.target.value)} />}
              </Field>
              <div className={styles.wide}>
                <Field label="What we know about them" error={issues.notes} hint="What they handle, how they like to be asked, what we’ve done with them before.">
                  {(props) => <textarea {...props} className={ui.input} rows={3} value={editing.values.notes} onChange={(event) => set('notes', event.target.value)} />}
                </Field>
              </div>
            </div>
            <div className={styles.row}>
              <button type="submit" className={ui.primary} disabled={busy}>
                {busy ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className={ui.ghost} onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
            <p className={shared.error} role="alert" hidden={!formError}>
              {formError}
            </p>
          </div>
        </form>
      )}

      {!data && loading ? (
        <div className={shared.panel} aria-hidden="true">
          <span className={ui.skeleton} style={{ width: 240 }} />
        </div>
      ) : data && all.length === 0 ? (
        <div className={`${shared.panel} ${shared.empty}`}>
          <h2>No contacts yet</h2>
          <p>Add someone here, or just make an ask: whoever it goes to is saved as a contact.</p>
        </div>
      ) : data ? (
        <div className={ui.panelFlush}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>What we know</th>
                <th>Asks</th>
                <th aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {all.map((contact) => (
                <tr key={contact.id} id={`contact-${contact.id}`}>
                  <td>
                    <span className={ui.rowTitle}>{contact.name}</span>
                    {contact.organization && <div className={styles.whatLine}>{contact.organization}</div>}
                  </td>
                  <td data-label="Email" className={ui.mono}>
                    {contact.email}
                  </td>
                  <td data-label="Notes">
                    <span className={styles.clip}>{contact.notes || <span className={ui.dim}>Nothing yet</span>}</span>
                  </td>
                  <td data-label="Asks" className={ui.num}>
                    {contact.askCount}
                  </td>
                  <td className={ui.rowActions}>
                    <Link to={`/admin/email/asks/new?contact=${contact.id}`} className={`${ui.button} ${ui.small}`}>
                      Ask them
                    </Link>
                    <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => edit(contact)}>
                      Edit
                    </button>
                    <button type="button" className={`${ui.dangerGhost} ${ui.small}`} onClick={() => setDeleting(contact)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title={deleting ? `Remove ${deleting.name}?` : 'Remove contact?'}
        confirmLabel="Remove contact"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      >
        <p>Asks to them stay, with the name and email they went to. What we know about them goes.</p>
      </ConfirmDialog>
    </div>
  )
}
