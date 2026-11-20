import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import type { AskDetail, AskSetup, Contact, NewAskInput } from '../../../shared/api'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { Field } from '../components/Field'
import { PageHeader } from '../components/PageHeader'
import { FOLLOW_UP_CHOICES } from '../lib/asks'
import { useToast } from '../lib/toast'
import shared from './people/people.module.css'
import { toApiError, useApi } from './people/useApi'
import { SetupNote } from './Asks'
import styles from './Asks.module.css'

const NEW = 'new'

/** Say who it's to and what's needed, and Claude writes the first draft. */
export function Component() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data: contacts } = useApi<{ items: Contact[] }>('/admin/contacts')
  const { data: asks } = useApi<{ setup: AskSetup }>('/admin/asks')

  const [contactId, setContactId] = useState(params.get('contact') ?? '')
  const [person, setPerson] = useState({ name: '', email: '', organization: '', notes: '' })
  const [request, setRequest] = useState('')
  const [followUpDays, setFollowUpDays] = useState(5)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  const list = contacts?.items ?? []
  const chosen = contactId && contactId !== NEW ? list.find((contact) => String(contact.id) === contactId) : undefined
  const isNew = contactId === NEW || (contacts !== undefined && list.length === 0)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (progress) return
    setError('')
    setIssues({})
    const to: NewAskInput['to'] = isNew ? person : { contactId: Number(contactId) }
    if (!isNew && !chosen) {
      setIssues({ to: 'Pick who it’s to' })
      return
    }
    let ask: AskDetail
    try {
      setProgress('Saving…')
      ask = (await api<{ item: AskDetail }>('/admin/asks', { body: { to, request, followUpDays } satisfies NewAskInput })).item
    } catch (failure) {
      const apiError = toApiError(failure)
      // The person's fields come back as to.name, to.email…; show them under their boxes.
      setIssues(Object.fromEntries(Object.entries(apiError.issues).map(([key, value]) => [key.replace(/^to\./, ''), value])))
      setError(apiError.message)
      setProgress('')
      return
    }
    // From here the ask exists: whatever fails next is said on its own page, where it can be fixed.
    const problems: string[] = []
    setProgress('Claude is writing it…')
    let notice: string | undefined
    try {
      notice = (await api<{ item: AskDetail; notice?: string }>(`/admin/asks/${ask.id}/draft`, { body: { notes: '', answers: [] } })).notice
    } catch (failure) {
      problems.push(`The draft: ${toApiError(failure).message}`)
    }
    if (problems.length) toast({ text: 'Saved, with a problem', detail: problems.join(' · '), tone: 'error' })
    else toast({ text: 'Draft ready', detail: notice })
    navigate(`/admin/email/asks/${ask.id}`)
  }

  return (
    <div className={`${shared.page} ${ui.narrow}`}>
      <PageHeader title="New ask" back={{ to: '/admin/email/asks', label: 'Asks' }} lede="Say who it’s to and what we need. Claude writes the email; nothing is sent until you press Send." />
      <SetupNote setup={asks?.setup} />

      <form className={shared.panel} onSubmit={submit} noValidate>
        <div className={styles.stack}>
          {list.length > 0 && (
            <Field label="To" error={issues.to}>
              {(props) => (
                <select {...props} className={ui.input} value={contactId} onChange={(event) => setContactId(event.target.value)}>
                  <option value="" disabled>
                    Choose someone
                  </option>
                  {list.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                      {contact.organization ? `, ${contact.organization}` : ''} ({contact.email})
                    </option>
                  ))}
                  <option value={NEW}>Someone new…</option>
                </select>
              )}
            </Field>
          )}

          {isNew && (
            <div className={styles.formGrid}>
              <Field label="Their name" error={issues.name} hint="A person, or an office (“Spark! front desk”)">
                {(props) => <input {...props} className={ui.input} value={person.name} onChange={(event) => setPerson({ ...person, name: event.target.value })} />}
              </Field>
              <Field label="Their email" error={issues.email}>
                {(props) => (
                  <input {...props} type="email" className={ui.input} value={person.email} onChange={(event) => setPerson({ ...person, email: event.target.value })} />
                )}
              </Field>
              <Field label="Organization" error={issues.organization} hint="Optional">
                {(props) => (
                  <input {...props} className={ui.input} value={person.organization} onChange={(event) => setPerson({ ...person, organization: event.target.value })} />
                )}
              </Field>
              <Field label="What we know about them" error={issues.notes} hint="Optional. What they handle, how they like to be asked. Saved with the contact.">
                {(props) => <input {...props} className={ui.input} value={person.notes} onChange={(event) => setPerson({ ...person, notes: event.target.value })} />}
              </Field>
            </div>
          )}

          <Field
            label="What do we need?"
            error={issues.request}
            hint="Say it like you’d tell a teammate: what, when, any details. Claude asks for anything it’s missing instead of making it up."
          >
            {(props) => (
              <textarea
                {...props}
                className={ui.input}
                rows={5}
                value={request}
                placeholder="Need Spark’s big room for hack night on Dec 4, 6 to 9 PM, about 40 people. We’d bring our own food."
                onChange={(event) => setRequest(event.target.value)}
              />
            )}
          </Field>

          <Field label="Follow up" hint="If nobody replies, Claude drafts a polite follow-up for you to check. It never sends it.">
            {(props) => (
              <select {...props} className={ui.input} value={followUpDays} onChange={(event) => setFollowUpDays(Number(event.target.value))}>
                {FOLLOW_UP_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <div className={styles.row}>
            <button type="submit" className={ui.primary} disabled={progress !== ''}>
              {progress || 'Write it with Claude'}
            </button>
          </div>
          <p className={shared.error} role="alert" hidden={!error}>
            {error}
          </p>
        </div>
      </form>
    </div>
  )
}
