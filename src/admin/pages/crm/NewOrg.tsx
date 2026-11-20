import { useState } from 'react'
import { ORG_KINDS, ORG_KIND_LABELS, type OrgDetail, type OrgInput, type OrgKind } from '../../../../shared/crm'
import { api } from '../../../lib/api'
import ui from '../../admin.module.css'
import { Field } from '../../components/Field'
import { useSession } from '../../lib/session'
import { useToast } from '../../lib/toast'
import { toApiError } from '../people/useApi'
import { FormDialog } from './FormDialog'
import { useTeam } from './data'
import { OwnerSelect } from './pickers'

interface NewOrgProps {
  open: boolean
  /** Prefilled, when it's opened from somewhere that already has a name typed. */
  initialName?: string
  initialKind?: OrgKind
  onClose: () => void
  onCreated: (org: OrgDetail) => void
}

/** A new org: its name, kind, site and focus. The logo wall is set on its page afterwards. */
export function NewOrg({ open, initialName = '', initialKind = 'company', onClose, onCreated }: NewOrgProps) {
  const { me } = useSession()
  const team = useTeam(open)
  const toast = useToast()
  const blank = (): OrgInput => ({ name: initialName, kind: initialKind, website: '', focus: '', ownerEmail: me.email })
  const [values, setValues] = useState<OrgInput>(blank)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)

  // Start clean each time it opens.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setValues(blank())
      setIssues({})
      setError('')
    }
  }

  const set = <K extends keyof OrgInput>(key: K, value: OrgInput[K]) => setValues((prev) => ({ ...prev, [key]: value }))

  const submit = async () => {
    setBusy(true)
    setIssues({})
    setError('')
    try {
      const { item } = await api<{ item: OrgDetail }>('/admin/orgs', { body: values })
      toast(`${item.name} added`)
      onCreated(item)
    } catch (failure) {
      const apiError = toApiError(failure)
      setIssues(apiError.issues)
      setError(apiError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <FormDialog open={open} title="New org" submitLabel="Add org" busy={busy} error={error} onSubmit={submit} onClose={onClose}>
      <Field label="Name" error={issues.name}>
        {(control) => <input className={ui.input} value={values.name} onChange={(event) => set('name', event.target.value)} maxLength={120} {...control} />}
      </Field>
      <Field label="Kind" error={issues.kind}>
        {(control) => (
          <select className={ui.input} value={values.kind} onChange={(event) => set('kind', event.target.value as OrgKind)} {...control}>
            {ORG_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind === 'hackathon' ? 'Hackathon organizer' : ORG_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Website" error={issues.website}>
        {(control) => (
          <input className={ui.input} value={values.website} onChange={(event) => set('website', event.target.value)} placeholder="northline.vc" maxLength={300} {...control} />
        )}
      </Field>
      <Field label="Focus" hint="What they care about, in a line." error={issues.focus}>
        {(control) => (
          <input className={ui.input} value={values.focus} onChange={(event) => set('focus', event.target.value)} placeholder="Seed, AI and dev tools" maxLength={160} {...control} />
        )}
      </Field>
      <Field label="Owner" error={issues.ownerEmail}>
        {(control) => <OwnerSelect value={values.ownerEmail ?? ''} team={team} onChange={(email) => set('ownerEmail', email)} {...control} />}
      </Field>
    </FormDialog>
  )
}
