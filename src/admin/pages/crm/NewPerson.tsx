import { useState } from 'react'
import { CONTACT_KINDS, PERSON_KIND_LABELS, type ContactKind, type PersonDetail, type PersonInput } from '../../../../shared/crm'
import { api } from '../../../lib/api'
import ui from '../../admin.module.css'
import { Field } from '../../components/Field'
import { useSession } from '../../lib/session'
import { useToast } from '../../lib/toast'
import { toApiError } from '../people/useApi'
import styles from './crm.module.css'
import { FormDialog } from './FormDialog'
import { NewOrg } from './NewOrg'
import { NEW_ORG, useOrgList, useTeam } from './data'
import { OrgSelect, OwnerSelect } from './pickers'

interface NewPersonProps {
  open: boolean
  initialKind?: ContactKind
  /** Set when it's opened from an org's page. */
  initialOrgId?: number | null
  onClose: () => void
  onCreated: (person: PersonDetail) => void
}

const KIND_HINTS: Record<ContactKind, string> = {
  contact: 'Someone outside BU’s students: a VC, a recruiter, staff.',
  lead: 'A student we’ve scouted who hasn’t signed up. They become a member when they do.',
  alum: 'A BU alum.',
}

/** A contact, lead or alum. Members aren't made here: they sign up on the site. */
export function NewPerson({ open, initialKind = 'contact', initialOrgId = null, onClose, onCreated }: NewPersonProps) {
  const { me } = useSession()
  const team = useTeam(open)
  const { orgs, setData: setOrgs } = useOrgList(open)
  const toast = useToast()
  const blank = (): PersonInput => ({ name: '', email: '', kind: initialKind, orgId: initialOrgId, title: '', link: '', notes: '', ownerEmail: me.email })
  const [values, setValues] = useState<PersonInput>(blank)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [makingOrg, setMakingOrg] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setValues(blank())
      setIssues({})
      setError('')
    }
  }

  const set = <K extends keyof PersonInput>(key: K, value: PersonInput[K]) => setValues((prev) => ({ ...prev, [key]: value }))
  const kind = values.kind ?? 'contact'

  const submit = async () => {
    setBusy(true)
    setIssues({})
    setError('')
    try {
      const { item } = await api<{ item: PersonDetail }>('/admin/people', { body: values })
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
    <>
      <FormDialog open={open && !makingOrg} title="New person" submitLabel="Add person" busy={busy} error={error} onSubmit={submit} onClose={onClose}>
        <div className={ui.tabs} role="group" aria-label="Kind">
          {CONTACT_KINDS.map((option) => (
            <button key={option} type="button" className={ui.tab} aria-pressed={kind === option} onClick={() => set('kind', option)}>
              {PERSON_KIND_LABELS[option]}
            </button>
          ))}
        </div>
        <p className={ui.hint}>{KIND_HINTS[kind]}</p>
        <Field label="Name" error={issues.name}>
          {(control) => <input className={ui.input} value={values.name} onChange={(event) => set('name', event.target.value)} maxLength={120} {...control} />}
        </Field>
        <Field label="Email" error={issues.email}>
          {(control) => (
            <input
              className={ui.input}
              type="email"
              value={values.email}
              onChange={(event) => set('email', event.target.value)}
              maxLength={254}
              autoComplete="off"
              spellCheck={false}
              {...control}
            />
          )}
        </Field>
        {kind === 'lead' ? (
          <Field label="Year or school" error={issues.title}>
            {(control) => (
              <input className={ui.input} value={values.title} onChange={(event) => set('title', event.target.value)} placeholder="Third year, CS" maxLength={120} {...control} />
            )}
          </Field>
        ) : (
          <div className={styles.pair}>
            <Field label="Org" error={issues.orgId}>
              {(control) => (
                <OrgSelect
                  value={values.orgId ?? null}
                  orgs={orgs}
                  onChange={(next) => (next === NEW_ORG ? setMakingOrg(true) : set('orgId', next))}
                  {...control}
                />
              )}
            </Field>
            <Field label="Title" error={issues.title}>
              {(control) => (
                <input className={ui.input} value={values.title} onChange={(event) => set('title', event.target.value)} placeholder="Partner" maxLength={120} {...control} />
              )}
            </Field>
          </div>
        )}
        <Field label="Owner" error={issues.ownerEmail}>
          {(control) => <OwnerSelect value={values.ownerEmail ?? ''} team={team} onChange={(email) => set('ownerEmail', email)} {...control} />}
        </Field>
      </FormDialog>
      <NewOrg
        open={open && makingOrg}
        onClose={() => setMakingOrg(false)}
        onCreated={(org) => {
          setOrgs((prev) => ({ items: [...(prev?.items ?? []), org].sort((a, b) => a.name.localeCompare(b.name)) }))
          set('orgId', org.id)
          setMakingOrg(false)
        }}
      />
    </>
  )
}
