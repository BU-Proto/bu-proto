import { useState, type FormEvent } from 'react'
import type { Fact, FactInput } from '../../../shared/api'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { Field } from '../components/Field'
import { PlusIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { formatRelative } from '../lib/format'
import { useToast } from '../lib/toast'
import { ConfirmDialog } from './people/ConfirmDialog'
import shared from './people/people.module.css'
import { toApiError, useApi } from './people/useApi'
import styles from './Asks.module.css'

const EMPTY: FactInput = { label: '', value: '', source: '' }

/** What Proto is, for Claude to write and fill forms from. It never makes one up: what's missing, it asks. */
export function Component() {
  const toast = useToast()
  const { data, error, loading, setData } = useApi<{ items: Fact[] }>('/admin/facts')
  const [editing, setEditing] = useState<{ id: number | null; values: FactInput } | null>(null)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleting, setDeleting] = useState<Fact | null>(null)
  const all = data?.items ?? []

  const edit = (fact: Fact | null) => {
    setIssues({})
    setFormError('')
    setEditing({ id: fact?.id ?? null, values: fact ? { label: fact.label, value: fact.value, source: fact.source } : EMPTY })
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing || busy) return
    setBusy(true)
    setIssues({})
    setFormError('')
    try {
      const { item } = await api<{ item: Fact }>(editing.id ? `/admin/facts/${editing.id}` : '/admin/facts', {
        method: editing.id ? 'PATCH' : 'POST',
        body: editing.values,
      })
      setData((prev) => {
        const items = prev?.items ?? []
        const next = editing.id ? items.map((entry) => (entry.id === item.id ? item : entry)) : [...items, item]
        return { items: next.sort((a, b) => a.label.localeCompare(b.label)) }
      })
      toast(editing.id ? 'Fact saved' : 'Fact added')
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
      await api(`/admin/facts/${deleting.id}`, { method: 'DELETE' })
      setData((prev) => prev && { items: prev.items.filter((entry) => entry.id !== deleting.id) })
      toast('Fact removed')
      setDeleting(null)
    } catch (failure) {
      setFormError(toApiError(failure).message)
    } finally {
      setBusy(false)
    }
  }

  const set = (key: keyof FactInput, value: string) => setEditing((prev) => prev && { ...prev, values: { ...prev.values, [key]: value } })

  return (
    <div className={shared.page}>
      <PageHeader
        title="Email"
        tabTitle="Proto facts"
        lede="What Claude knows about Proto when it writes and fills forms: our name, what we do, our advisor, our address. It never makes a fact up. What isn’t here, it asks, and an answer about Proto itself lands here so it’s never asked twice."
        actions={
          <button type="button" className={ui.primary} onClick={() => edit(null)}>
            <PlusIcon /> New fact
          </button>
        }
      />
      <p className={shared.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      {editing && (
        <form className={shared.panel} onSubmit={save} noValidate>
          <div className={styles.stack}>
            <h2 className={ui.panelTitle}>{editing.id ? 'Edit fact' : 'New fact'}</h2>
            <div className={styles.formGrid}>
              <Field label="What it is" error={issues.label} hint="“Faculty advisor”, “Mailing address”, “Member count”">
                {(props) => <input {...props} className={ui.input} value={editing.values.label} onChange={(event) => set('label', event.target.value)} />}
              </Field>
              <Field label="Where it’s from" error={issues.source} hint="Optional. Who said so, or where it’s written down.">
                {(props) => <input {...props} className={ui.input} value={editing.values.source} onChange={(event) => set('source', event.target.value)} />}
              </Field>
              <div className={styles.wide}>
                <Field label="The fact" error={issues.value}>
                  {(props) => <textarea {...props} className={ui.input} rows={3} value={editing.values.value} onChange={(event) => set('value', event.target.value)} />}
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
          <h2>No facts yet</h2>
          <p>Add what’s true about Proto. Claude also fills this in as you answer its questions.</p>
        </div>
      ) : data ? (
        <div className={ui.panelFlush}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>What</th>
                <th>The fact</th>
                <th>From</th>
                <th aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {all.map((fact) => (
                <tr key={fact.id}>
                  <td>
                    <span className={ui.rowTitle}>{fact.label}</span>
                  </td>
                  <td data-label="Fact">
                    <span className={styles.value}>{fact.value}</span>
                  </td>
                  <td data-label="From" className={ui.dim}>
                    {fact.source || '—'}
                    <div className={styles.whatLine}>{formatRelative(fact.updatedAt)}</div>
                  </td>
                  <td className={ui.rowActions}>
                    <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => edit(fact)}>
                      Edit
                    </button>
                    <button type="button" className={`${ui.dangerGhost} ${ui.small}`} onClick={() => setDeleting(fact)}>
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
        title={deleting ? `Remove “${deleting.label}”?` : 'Remove fact?'}
        confirmLabel="Remove fact"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      >
        <p>Claude stops using it, and asks again the next time a form needs it.</p>
      </ConfirmDialog>
    </div>
  )
}
