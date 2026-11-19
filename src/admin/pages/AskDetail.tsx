import { useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { AskDetail, AskForm, AskSetup, AskStatus, FormAnswer } from '../../../shared/api'
import { TYPED_SOURCE } from '../../../shared/constants'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { Field } from '../components/Field'
import { ArrowOutIcon, SendIcon, TrashIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { FOLLOW_UP_CHOICES } from '../lib/asks'
import { useToast } from '../lib/toast'
import { ConfirmDialog } from './people/ConfirmDialog'
import { formatIsoDay, formatStamp, formatStampDate } from './people/format'
import shared from './people/people.module.css'
import { toApiError, useApi } from './people/useApi'
import { AskState, SetupNote } from './Asks'
import styles from './Asks.module.css'

type Busy = 'draft' | 'save' | 'send' | 'status' | 'delete' | 'form' | null
type Run = <T extends { item: AskDetail }>(kind: Busy, request: () => Promise<T>, done?: (result: T) => void) => Promise<void>

/** "184 KB", "1.2 MB". */
const fileSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)

async function copy(text: string, toast: ReturnType<typeof useToast>, what: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast(`${what} copied`)
  } catch {
    toast({ text: 'Your browser blocked the clipboard', detail: 'Select the text and copy it yourself.', tone: 'error' })
  }
}

/** One ask: the email waiting to go (with Claude's questions and the notes box), its forms, and what's been sent. */
export function Component() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, error, loading, setData } = useApi<{ item: AskDetail; setup: AskSetup }>(`/admin/asks/${id}`)
  const ask = data?.item
  const setup = data?.setup
  const [busy, setBusy] = useState<Busy>(null)
  const [problem, setProblem] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const apply = (item: AskDetail) => setData((prev) => (prev ? { ...prev, item } : prev))

  const run: Run = async (kind, request, done) => {
    if (busy) return
    setBusy(kind)
    setProblem('')
    try {
      const result = await request()
      apply(result.item)
      done?.(result)
    } catch (failure) {
      setProblem(toApiError(failure).message)
    } finally {
      setBusy(null)
    }
  }

  if (!ask) {
    return (
      <div className={shared.page}>
        <PageHeader title="Ask" back={{ to: '/admin/email/asks', label: 'Asks' }} />
        {loading ? (
          <div className={shared.panel} aria-hidden="true">
            <span className={ui.skeleton} style={{ width: 240 }} />
          </div>
        ) : (
          <p className={shared.error} role="alert">
            {error?.message ?? 'That ask no longer exists.'}
          </p>
        )}
      </div>
    )
  }

  const open = ask.status === 'draft' || ask.status === 'waiting'

  const setStatus = (status: AskStatus) =>
    run(
      'status',
      () => api<{ item: AskDetail }>(`/admin/asks/${ask.id}`, { method: 'PATCH', body: { status } }),
      () => toast(status === 'answered' ? 'Marked answered' : status === 'closed' ? 'Closed' : 'Open again'),
    )

  const remove = async () => {
    setBusy('delete')
    try {
      await api(`/admin/asks/${ask.id}`, { method: 'DELETE' })
      toast('Ask deleted')
      navigate('/admin/email/asks')
    } catch (failure) {
      setProblem(toApiError(failure).message)
      setBusy(null)
      setConfirmDelete(false)
    }
  }

  return (
    <div className={shared.page}>
      <PageHeader
        title={`To ${ask.toName}`}
        tabTitle={`Ask: ${ask.toName}`}
        back={{ to: '/admin/email/asks', label: 'Asks' }}
        actions={
          <>
            {ask.status === 'waiting' && (
              <button type="button" className={ui.button} disabled={busy !== null} onClick={() => setStatus('answered')}>
                Mark answered
              </button>
            )}
            {open && (
              <button type="button" className={ui.ghost} disabled={busy !== null} onClick={() => setStatus('closed')}>
                Close
              </button>
            )}
            {!open && (
              <button type="button" className={ui.button} disabled={busy !== null} onClick={() => setStatus(ask.sentAt ? 'waiting' : 'draft')}>
                Open again
              </button>
            )}
            <button type="button" className={ui.dangerGhost} aria-label="Delete this ask" disabled={busy !== null} onClick={() => setConfirmDelete(true)}>
              <TrashIcon />
            </button>
          </>
        }
      />
      <SetupNote setup={setup} />

      <div className={styles.stack}>
        <p className={styles.request}>{ask.request}</p>
        <p className={styles.meta}>
          <AskState ask={ask} />
          <span>
            {ask.toName} &lt;{ask.toEmail}&gt;{ask.toOrganization && `, ${ask.toOrganization}`}
          </span>
          <span>Asked by {ask.ownerName || ask.ownerEmail}</span>
          <span>{formatStampDate(ask.createdAt)}</span>
          {ask.contactId && (
            <Link to={`/admin/email/contacts#contact-${ask.contactId}`} className={shared.link}>
              Contact
            </Link>
          )}
        </p>
      </div>

      <p className={shared.error} role="alert" hidden={!problem}>
        {problem}
      </p>

      <div className={styles.layout}>
        {/* Keyed by the draft, so a new one from Claude starts the boxes over. */}
        <DraftColumn key={`${ask.id} ${ask.draftedAt} ${ask.status}`} ask={ask} setup={setup} busy={busy} problem={problem} run={run} />

        <div className={styles.column}>
          <FormsPanel ask={ask} busy={busy} setBusy={setBusy} onSaved={apply} />

          {ask.answers.length > 0 && (
            <section className={shared.panel} aria-labelledby="answers-title">
              <h2 id="answers-title" className={ui.panelTitle} style={{ marginBottom: 12 }}>
                What we told Claude
              </h2>
              <dl className={styles.sheet}>
                {ask.answers.map((answer) => (
                  <div key={answer.question}>
                    <dt>{answer.question}</dt>
                    <dd>
                      <span className={styles.value}>{answer.answer}</span>
                      <span className={styles.source}>{answer.by}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {ask.messages.length > 0 && (
            <section className={shared.panel} aria-labelledby="sent-title">
              <h2 id="sent-title" className={ui.panelTitle} style={{ marginBottom: 12 }}>
                Sent
              </h2>
              <ul className={styles.history}>
                {ask.messages.map((message) => (
                  <li key={message.id}>
                    <details>
                      <summary>
                        <span>{message.subject}</span>
                        <span className={ui.hint}>
                          {message.kind === 'follow-up' ? 'Follow-up, ' : ''}
                          {formatStamp(message.createdAt)} by {message.sentBy}
                          {message.status === 'logged' ? ' · logged, not sent' : message.status === 'failed' ? ' · failed' : ''}
                          {message.attachments.length ? ` · ${message.attachments.join(', ')}` : ''}
                        </span>
                      </summary>
                      <pre>{message.body}</pre>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {open && (
            <section className={shared.panel}>
              <Field label="Follow up" hint="If nobody replies, Claude drafts a follow-up for someone to check. It never sends one.">
                {(props) => (
                  <select
                    {...props}
                    className={ui.input}
                    value={ask.followUpDays}
                    disabled={busy !== null}
                    onChange={(event) =>
                      void run('status', () => api<{ item: AskDetail }>(`/admin/asks/${ask.id}`, { method: 'PATCH', body: { followUpDays: Number(event.target.value) } }))
                    }
                  >
                    {FOLLOW_UP_CHOICES.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </section>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this ask?"
        confirmLabel="Delete ask"
        danger
        busy={busy === 'delete'}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      >
        <p>Its draft, its forms and the record of what was sent go with it. Emails already sent stay sent. It can’t be undone.</p>
      </ConfirmDialog>
    </div>
  )
}

interface DraftColumnProps {
  ask: AskDetail
  setup: AskSetup | undefined
  busy: Busy
  problem: string
  run: Run
}

/** The email waiting to go, Claude's questions, the notes box, and Send. */
function DraftColumn({ ask, setup, busy, problem, run }: DraftColumnProps) {
  const toast = useToast()
  const [subject, setSubject] = useState(ask.subject)
  const [body, setBody] = useState(ask.body)
  const [notes, setNotes] = useState(ask.notes)
  const [answers, setAnswers] = useState<Record<string, { answer: string; remember: boolean }>>(() =>
    Object.fromEntries(ask.questions.map((question) => [question.question, { answer: '', remember: question.remember }])),
  )
  const [confirmSend, setConfirmSend] = useState(false)

  const open = ask.status === 'draft' || ask.status === 'waiting'
  const hasDraft = ask.body.trim() !== ''
  const edited = hasDraft && (subject !== ask.subject || body !== ask.body)
  const given = ask.questions
    .map((question) => ({ question: question.question, ...answers[question.question] }))
    .filter((entry) => entry.answer?.trim())
    .map((entry) => ({ question: entry.question, answer: entry.answer.trim(), remember: entry.remember }))
  const unanswered = ask.questions.length - given.length
  const attachments = ask.forms.filter((form) => form.kind === 'pdf' && form.attach)
  const owner = ask.ownerName || ask.ownerEmail

  const draft = () =>
    run(
      'draft',
      () => api<{ item: AskDetail; notice?: string }>(`/admin/asks/${ask.id}/draft`, { body: { notes, answers: given } }),
      (result) => toast({ text: hasDraft ? 'Redrafted' : 'Draft ready', detail: result.notice }),
    )

  const save = () =>
    run(
      'save',
      () => api<{ item: AskDetail }>(`/admin/asks/${ask.id}`, { method: 'PATCH', body: { subject, body } }),
      () => toast('Draft saved'),
    )

  const send = () =>
    run(
      'send',
      () => api<{ item: AskDetail; logged: boolean }>(`/admin/asks/${ask.id}/send`, { body: { subject, body } }),
      (result) => {
        setConfirmSend(false)
        toast(
          result.logged
            ? { text: 'Logged, not sent', detail: 'RESEND_API_KEY isn’t set here, so the email went to the server log.' }
            : { text: `Sent to ${ask.toName}`, detail: `Replies go to ${owner}.` },
        )
      },
    )

  return (
    <div className={styles.column}>
      {open && !hasDraft && (
        <section className={shared.panel}>
          <div className={styles.stack}>
            {ask.status === 'draft' ? (
              <>
                <h2 className={ui.panelTitle}>No draft yet</h2>
                <p className={ui.hint}>Claude writes it from what you asked, Proto’s facts and the forms beside it.</p>
              </>
            ) : (
              <>
                <h2 className={ui.panelTitle}>Waiting for a reply</h2>
                <p className={ui.hint}>
                  Sent {ask.sentAt ? formatStampDate(ask.sentAt) : ''}. Replies go to {owner}; mark it answered when one comes.{' '}
                  {ask.followUpDue
                    ? `If nothing comes, Claude drafts a follow-up on ${formatIsoDay(ask.followUpDue)} for someone to check.`
                    : 'No follow-up is planned.'}
                </p>
              </>
            )}
            <NotesBox notes={notes} setNotes={setNotes} />
            <div className={styles.row}>
              <button type="button" className={ui.primary} disabled={busy !== null} onClick={draft}>
                {busy === 'draft' ? 'Claude is writing…' : ask.status === 'draft' ? 'Write it with Claude' : 'Draft a follow-up now'}
              </button>
            </div>
          </div>
        </section>
      )}

      {open && hasDraft && (
        <section className={shared.panel} aria-labelledby="draft-title">
          <div className={styles.stack}>
            <div className={styles.spread}>
              <h2 id="draft-title" className={ui.panelTitle}>
                {ask.draftKind === 'follow-up' ? 'Follow-up' : 'Email'}
              </h2>
              {ask.draftedAt && <span className={ui.hint}>Drafted {formatStamp(ask.draftedAt)}</span>}
            </div>
            <dl className={styles.envelope}>
              <div>
                <dt>To</dt>
                <dd>
                  {ask.toName} &lt;{ask.toEmail}&gt;
                </dd>
              </div>
              <div>
                <dt>Cc</dt>
                <dd>{ask.ownerEmail}, and whoever presses Send</dd>
              </div>
              <div>
                <dt>Replies</dt>
                <dd>{ask.ownerEmail}</dd>
              </div>
              {attachments.length > 0 && (
                <div>
                  <dt>Attached</dt>
                  <dd>{attachments.map((form) => `${form.name} - Proto.pdf${form.filledSize ? '' : ' (not filled yet)'}`).join(', ')}</dd>
                </div>
              )}
            </dl>
            <Field label="Subject">
              {(props) => <input {...props} className={ui.input} value={subject} maxLength={200} onChange={(event) => setSubject(event.target.value)} />}
            </Field>
            <Field label="Message">
              {(props) => <textarea {...props} className={`${ui.input} ${styles.body}`} value={body} maxLength={20000} onChange={(event) => setBody(event.target.value)} />}
            </Field>
            <p className={styles.signature}>{`${owner}\nProto · Boston University\n${window.location.host}`}</p>
            <div className={styles.row}>
              <button type="button" className={ui.primary} disabled={busy !== null || !subject.trim() || !body.trim()} onClick={() => setConfirmSend(true)}>
                <SendIcon /> {ask.draftKind === 'follow-up' ? 'Send follow-up' : 'Send'}
              </button>
              {edited && (
                <button type="button" className={ui.button} disabled={busy !== null} onClick={save}>
                  {busy === 'save' ? 'Saving…' : 'Save edits'}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {open && hasDraft && (
        <section className={shared.panel} aria-labelledby="redraft-title">
          <div className={styles.stack}>
            <h2 id="redraft-title" className={ui.panelTitle}>
              {ask.questions.length ? 'Claude needs to know' : 'Change it with Claude'}
            </h2>
            {ask.questions.length > 0 && (
              <ul className={styles.questions}>
                {ask.questions.map((question) => (
                  <QuestionBox
                    key={question.question}
                    question={question.question}
                    value={answers[question.question] ?? { answer: '', remember: question.remember }}
                    onChange={(value) => setAnswers((prev) => ({ ...prev, [question.question]: value }))}
                  />
                ))}
              </ul>
            )}
            <NotesBox notes={notes} setNotes={setNotes} />
            <div className={styles.row}>
              <button type="button" className={ui.button} disabled={busy !== null} onClick={draft}>
                {busy === 'draft' ? 'Claude is writing…' : 'Redraft'}
              </button>
              {edited && <span className={ui.hint}>Redrafting replaces your edits.</span>}
            </div>
          </div>
        </section>
      )}

      {!open && (
        <section className={shared.panel}>
          <h2 className={ui.panelTitle}>{ask.status === 'answered' ? 'Answered' : 'Closed'}</h2>
          <p className={ui.hint}>
            {ask.closedAt ? `${ask.status === 'answered' ? 'Marked answered' : 'Closed'} ${formatStampDate(ask.closedAt)}. ` : ''}
            Open it again to write to them.
          </p>
        </section>
      )}

      <ConfirmDialog
        open={confirmSend}
        title={`Send to ${ask.toName}?`}
        confirmLabel={busy === 'send' ? 'Sending…' : 'Send it'}
        busy={busy === 'send'}
        error={confirmSend ? problem : ''}
        onConfirm={send}
        onCancel={() => setConfirmSend(false)}
      >
        <p>
          “{subject}” goes to {ask.toEmail} from {owner} at Proto, with {ask.ownerEmail} on Cc. Replies go to {owner}.
          {attachments.length > 0 && ` It carries ${attachments.map((form) => form.name).join(', ')}.`}
        </p>
        {unanswered > 0 && <p>Claude still has {unanswered === 1 ? 'a question' : `${unanswered} questions`} you haven’t answered. Send anyway?</p>}
        {setup && !setup.resend && <p>Email isn’t set up here, so it will only be logged.</p>}
      </ConfirmDialog>
    </div>
  )
}

function NotesBox({ notes, setNotes }: { notes: string; setNotes: (notes: string) => void }) {
  return (
    <Field label="Notes for Claude" hint="How to change it: what to say or leave out, the tone, anything it should know.">
      {(props) => (
        <textarea
          {...props}
          className={ui.input}
          rows={3}
          maxLength={4000}
          value={notes}
          placeholder="Shorter. Mention we co-hosted with them in October."
          onChange={(event) => setNotes(event.target.value)}
        />
      )}
    </Field>
  )
}

function QuestionBox({
  question,
  value,
  onChange,
}: {
  question: string
  value: { answer: string; remember: boolean }
  onChange: (value: { answer: string; remember: boolean }) => void
}) {
  const id = useId()
  return (
    <li>
      <label className={styles.question} htmlFor={id}>
        {question}
      </label>
      <input id={id} className={ui.input} value={value.answer} maxLength={2000} onChange={(event) => onChange({ ...value, answer: event.target.value })} />
      <label className={styles.remember}>
        <input type="checkbox" checked={value.remember} onChange={(event) => onChange({ ...value, remember: event.target.checked })} />
        Keep the answer as a Proto fact, so it’s never asked again
      </label>
    </li>
  )
}

// ---- Forms ----------------------------------------------------------------------------------

interface FormsPanelProps {
  ask: AskDetail
  busy: Busy
  setBusy: (busy: Busy) => void
  onSaved: (item: AskDetail) => void
}

function FormsPanel({ ask, busy, setBusy, onSaved }: FormsPanelProps) {
  const toast = useToast()
  const [adding, setAdding] = useState<'pdf' | 'web' | null>(null)
  const [web, setWeb] = useState({ url: '', questions: '' })
  const [error, setError] = useState('')
  const open = ask.status === 'draft' || ask.status === 'waiting'

  const call = async (request: () => Promise<{ item: AskDetail }>, done: string) => {
    if (busy) return
    setBusy('form')
    setError('')
    try {
      onSaved((await request()).item)
      toast(done)
      return true
    } catch (failure) {
      setError(toApiError(failure).message)
      return false
    } finally {
      setBusy(null)
    }
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    const body = new FormData()
    body.append('file', file)
    if (await call(() => api(`/admin/asks/${ask.id}/forms`, { body }), `${file.name} added. Redraft to fill it.`)) setAdding(null)
  }

  const addWeb = async () => {
    if (await call(() => api(`/admin/asks/${ask.id}/web-forms`, { body: { url: web.url.trim(), questions: web.questions.trim(), name: '' } }), 'Web form added. Redraft to answer it.')) {
      setAdding(null)
      setWeb({ url: '', questions: '' })
    }
  }

  return (
    <section className={shared.panel} aria-labelledby="forms-title">
      <div className={styles.stack}>
        <div className={styles.spread}>
          <h2 id="forms-title" className={ui.panelTitle}>
            Forms
          </h2>
          {open && !adding && (
            <div className={styles.row}>
              <button type="button" className={`${ui.button} ${ui.small}`} onClick={() => setAdding('pdf')}>
                Add a PDF
              </button>
              <button type="button" className={`${ui.button} ${ui.small}`} onClick={() => setAdding('web')}>
                Add a web form
              </button>
            </div>
          )}
        </div>
        {ask.forms.length === 0 && !adding && <p className={ui.hint}>None. Add a PDF to fill and attach, or a web form to answer.</p>}

        {adding === 'pdf' && (
          <Field label="PDF form" hint="Claude fills its boxes from Proto’s facts and what you’ve told it. A signature is always left for a person.">
            {(props) => <input {...props} type="file" accept="application/pdf,.pdf" className={ui.input} disabled={busy !== null} onChange={(event) => void upload(event.target.files?.[0])} />}
          </Field>
        )}
        {adding === 'web' && (
          <div className={styles.stack}>
            <Field label="Its link" hint="A public Google Form’s questions are read from the link.">
              {(props) => <input {...props} type="url" className={ui.input} placeholder="https://" value={web.url} onChange={(event) => setWeb({ ...web, url: event.target.value })} />}
            </Field>
            <Field label="Its questions" hint="For Engage, BU-only forms, anything behind a sign-in.">
              {(props) => <textarea {...props} className={ui.input} rows={3} value={web.questions} onChange={(event) => setWeb({ ...web, questions: event.target.value })} />}
            </Field>
            <div className={styles.row}>
              <button type="button" className={`${ui.button} ${ui.small}`} disabled={busy !== null} onClick={addWeb}>
                Add web form
              </button>
            </div>
          </div>
        )}
        {adding && (
          <div className={styles.row}>
            <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => setAdding(null)}>
              Cancel
            </button>
          </div>
        )}
        <p className={shared.error} role="alert" hidden={!error}>
          {error}
        </p>

        {ask.forms.length > 0 && (
          <ul className={styles.forms}>
            {ask.forms.map((form) => (
              <FormItem key={form.id} ask={ask} form={form} busy={busy} call={call} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

interface FormItemProps {
  ask: AskDetail
  form: AskForm
  busy: Busy
  call: (request: () => Promise<{ item: AskDetail }>, done: string) => Promise<boolean | undefined>
}

function FormItem({ ask, form, busy, call }: FormItemProps) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const base = `/api/admin/asks/${ask.id}/forms/${form.id}`
  const byField = new Map(form.answers.map((answer) => [answer.field, answer]))
  // What a value answers, as the form puts it: a box's tooltip or a question's title, else its name.
  const labelOf = (name: string) => {
    const field = form.fields.find((candidate) => candidate.name === name)
    return field?.label || name
  }
  const rows: { field: string; label: string; answer?: FormAnswer; signature?: boolean }[] = form.fields.length
    ? form.fields.map((field) => ({ field: field.name, label: field.label || field.name, answer: byField.get(field.name), signature: field.type === 'signature' }))
    : form.answers.map((answer) => ({ field: answer.field, label: answer.field, answer }))
  const sheet = form.answers.map((answer) => `${labelOf(answer.field)}\n${answer.value}`).join('\n\n')
  const forChrome = [
    `Fill out the form at ${form.url || '(the open tab)'} with these answers. Don't submit it: leave it for me to check and submit. Leave anything not listed here empty, and never fill a signature.`,
    '',
    sheet,
  ].join('\n')

  const startEditing = () => {
    setValues(Object.fromEntries(rows.filter((row) => !row.signature).map((row) => [row.field, row.answer?.value ?? ''])))
    setEditing(true)
  }

  const saveAnswers = async () => {
    const answers = Object.entries(values).map(([field, value]) => ({
      field,
      value,
      source: value === (byField.get(field)?.value ?? '') ? (byField.get(field)?.source ?? '') : TYPED_SOURCE,
    }))
    if (await call(() => api(`/admin/asks/${ask.id}/forms/${form.id}`, { method: 'PATCH', body: { answers } }), form.kind === 'pdf' ? 'Form filled again' : 'Answers saved')) {
      setEditing(false)
    }
  }

  return (
    <li className={styles.form}>
      <div className={styles.spread}>
        <div>
          <h3 className={styles.formName}>{form.name}</h3>
          <p className={ui.hint}>
            {form.kind === 'pdf'
              ? `PDF, ${fileSize(form.blankSize)}${form.fields.length ? `, ${form.fields.length} boxes` : ', no fillable boxes: answers are listed to copy'}`
              : form.fields.length
                ? `Google Form, ${form.fields.length} questions`
                : 'Web form'}
          </p>
        </div>
        <button
          type="button"
          className={ui.dangerGhost}
          aria-label={`Remove ${form.name}`}
          disabled={busy !== null}
          onClick={() => void call(() => api(`/admin/asks/${ask.id}/forms/${form.id}`, { method: 'DELETE' }), `${form.name} removed`)}
        >
          <TrashIcon />
        </button>
      </div>

      <div className={styles.row}>
        {form.kind === 'pdf' && (
          <>
            <a href={`${base}/blank`} target="_blank" rel="noopener" className={shared.link}>
              Blank <ArrowOutIcon />
            </a>
            {form.filledSize > 0 && (
              <a href={`${base}/filled`} target="_blank" rel="noopener" className={shared.link}>
                Filled <ArrowOutIcon />
              </a>
            )}
            {form.fields.length > 0 && (
              <label className={styles.remember}>
                <input
                  type="checkbox"
                  checked={form.attach}
                  disabled={busy !== null}
                  onChange={(event) =>
                    void call(
                      () => api(`/admin/asks/${ask.id}/forms/${form.id}`, { method: 'PATCH', body: { attach: event.target.checked } }),
                      event.target.checked ? 'It goes with the email' : 'It stays off the email',
                    )
                  }
                />
                Attach the filled copy to the email
              </label>
            )}
          </>
        )}
        {form.kind === 'web' && form.url && (
          <a href={form.prefillUrl ?? form.url} target="_blank" rel="noopener noreferrer" className={shared.link}>
            {form.prefillUrl ? 'Open it filled in' : 'Open the form'} <ArrowOutIcon />
          </a>
        )}
        {form.answers.length > 0 && (form.kind === 'web' || form.fields.length === 0) && (
          <>
            <button type="button" className={`${ui.button} ${ui.small}`} onClick={() => void copy(sheet, toast, 'Answers')}>
              Copy answers
            </button>
            {form.kind === 'web' && !form.prefillUrl && (
              <button
                type="button"
                className={`${ui.button} ${ui.small}`}
                title="Paste it into Claude in Chrome with the form open: it fills the form and leaves Submit to you."
                onClick={() => void copy(forChrome, toast, 'Instructions for Claude in Chrome')}
              >
                Copy for Claude in Chrome
              </button>
            )}
          </>
        )}
      </div>
      {form.kind === 'web' && form.prefillUrl && (
        <p className={ui.hint}>The link opens the form with Claude’s answers in. Check them, then press Submit yourself.</p>
      )}

      {form.missing.length > 0 && (
        <ul className={styles.missing}>
          {form.missing.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      {editing ? (
        <div className={styles.stack}>
          {Object.keys(values).length === 0 && <p className={ui.hint}>Nothing to answer yet. Redraft and Claude fills it in first.</p>}
          {rows
            .filter((row) => !row.signature)
            .map((row) => (
              <Field key={row.field} label={row.label}>
                {(props) => (
                  <input {...props} className={ui.input} value={values[row.field] ?? ''} onChange={(event) => setValues((prev) => ({ ...prev, [row.field]: event.target.value }))} />
                )}
              </Field>
            ))}
          <div className={styles.row}>
            <button type="button" className={`${ui.button} ${ui.small}`} disabled={busy !== null} onClick={saveAnswers}>
              {form.kind === 'pdf' && form.fields.length ? 'Save and fill again' : 'Save answers'}
            </button>
            <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {form.answers.length > 0 && (
            <dl className={styles.sheet}>
              {rows
                .filter((row) => row.answer)
                .map((row) => (
                  <div key={row.field}>
                    <dt>{row.label}</dt>
                    <dd>
                      <span className={styles.value}>{row.answer?.value}</span>
                      {form.kind === 'web' || form.fields.length === 0 ? (
                        <button type="button" className={`${ui.ghost} ${ui.small} ${styles.copy}`} onClick={() => void copy(row.answer?.value ?? '', toast, 'Answer')}>
                          Copy
                        </button>
                      ) : null}
                    </dd>
                    {row.answer?.source && <span className={styles.source}>From {row.answer.source}</span>}
                  </div>
                ))}
            </dl>
          )}
          {(form.answers.length > 0 || form.fields.length > 0) && (
            <div className={styles.row}>
              <button type="button" className={`${ui.ghost} ${ui.small}`} disabled={busy !== null} onClick={startEditing}>
                Change answers
              </button>
            </div>
          )}
        </>
      )}
    </li>
  )
}
