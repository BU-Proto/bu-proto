import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import type { AskDetail, AskSetup, Contact, NewAskInput, WebFormInput } from '../../../shared/api'
import { FORM_MAX_BYTES } from '../../../shared/constants'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { Field } from '../components/Field'
import { PageHeader } from '../components/PageHeader'
import { TrashIcon } from '../components/icons'
import { FOLLOW_UP_CHOICES } from '../lib/asks'
import { useToast } from '../lib/toast'
import shared from './people/people.module.css'
import { toApiError, useApi } from './people/useApi'
import { SetupNote } from './Asks'
import styles from './Asks.module.css'

const NEW = 'new'

/** Say who it's to and what's needed, add any forms, and Claude writes the first draft. */
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
  const [pdfs, setPdfs] = useState<File[]>([])
  const [webForms, setWebForms] = useState<WebFormInput[]>([])
  const [web, setWeb] = useState<{ url: string; questions: string }>({ url: '', questions: '' })
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  const list = contacts?.items ?? []
  const chosen = contactId && contactId !== NEW ? list.find((contact) => String(contact.id) === contactId) : undefined
  const isNew = contactId === NEW || (contacts !== undefined && list.length === 0)

  const addPdfs = (files: FileList | null) => {
    const picked = [...(files ?? [])]
    const tooBig = picked.find((file) => file.size > FORM_MAX_BYTES)
    if (tooBig) {
      setIssues((prev) => ({ ...prev, file: `${tooBig.name} is over ${FORM_MAX_BYTES / 1024 / 1024} MB.` }))
      return
    }
    setIssues((prev) => ({ ...prev, file: '' }))
    setPdfs((prev) => [...prev, ...picked.filter((file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name))])
  }

  const addWebForm = () => {
    if (!web.url.trim() && !web.questions.trim()) {
      setIssues((prev) => ({ ...prev, web: 'Add the form’s link or paste its questions.' }))
      return
    }
    if (web.url.trim() && !/^https?:\/\//i.test(web.url.trim())) {
      setIssues((prev) => ({ ...prev, web: 'The link starts with https://' }))
      return
    }
    setWebForms((prev) => [...prev, { url: web.url.trim(), questions: web.questions.trim(), name: '' }])
    setWeb({ url: '', questions: '' })
    setIssues((prev) => ({ ...prev, web: '' }))
  }

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
    for (const file of pdfs) {
      setProgress(`Reading ${file.name}…`)
      const body = new FormData()
      body.append('file', file)
      await api(`/admin/asks/${ask.id}/forms`, { body }).catch((failure: unknown) => problems.push(`${file.name}: ${toApiError(failure).message}`))
    }
    for (const form of webForms) {
      setProgress('Reading the web form…')
      await api(`/admin/asks/${ask.id}/web-forms`, { body: form }).catch((failure: unknown) =>
        problems.push(`${form.url || 'Web form'}: ${toApiError(failure).message}`),
      )
    }
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
      <PageHeader title="New ask" back={{ to: '/admin/email/asks', label: 'Asks' }} lede="Say who it’s to and what we need. Claude writes the email and fills in any forms; nothing is sent until you press Send." />
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

          <div className={styles.stack}>
            <div className={styles.spread}>
              <span className={ui.label}>Forms</span>
              <span className={ui.hint}>A PDF to fill and attach, or a web form (Google Forms, Engage) to answer</span>
            </div>
            {(pdfs.length > 0 || webForms.length > 0) && (
              <ul className={styles.pending}>
                {pdfs.map((file, index) => (
                  <li key={`pdf-${file.name}-${index}`}>
                    <span>{file.name}</span>
                    <button type="button" className={ui.dangerGhost} aria-label={`Remove ${file.name}`} onClick={() => setPdfs((prev) => prev.filter((_, at) => at !== index))}>
                      <TrashIcon />
                    </button>
                  </li>
                ))}
                {webForms.map((form, index) => (
                  <li key={`web-${index}`}>
                    <span className={styles.clip}>{form.url || form.questions}</span>
                    <button type="button" className={ui.dangerGhost} aria-label="Remove this web form" onClick={() => setWebForms((prev) => prev.filter((_, at) => at !== index))}>
                      <TrashIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Field label="Add a PDF form" error={issues.file}>
              {(props) => (
                <input
                  {...props}
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  className={ui.input}
                  onChange={(event) => {
                    addPdfs(event.target.files)
                    event.target.value = ''
                  }}
                />
              )}
            </Field>
            <div className={styles.formGrid}>
              <Field label="Add a web form: its link" hint="A public Google Form’s questions are read from the link.">
                {(props) => <input {...props} type="url" className={ui.input} placeholder="https://" value={web.url} onChange={(event) => setWeb({ ...web, url: event.target.value })} />}
              </Field>
              <Field label="…or its questions" hint="For Engage, BU-only Google Forms, anything behind a sign-in: paste the questions.">
                {(props) => <textarea {...props} className={ui.input} rows={2} value={web.questions} onChange={(event) => setWeb({ ...web, questions: event.target.value })} />}
              </Field>
              <div className={styles.wide}>
                {issues.web && <p className={ui.error}>{issues.web}</p>}
                <button type="button" className={`${ui.button} ${ui.small}`} onClick={addWebForm}>
                  Add web form
                </button>
              </div>
            </div>
          </div>

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
