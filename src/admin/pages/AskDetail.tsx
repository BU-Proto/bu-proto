import { useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { AskDetail, AskSetup, AskStatus, Fact } from '../../../shared/api'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { Field } from '../components/Field'
import { SendIcon, TrashIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { RememberFact, type RememberValue } from '../components/RememberFact'
import { FOLLOW_UP_CHOICES } from '../lib/asks'
import { useToast } from '../lib/toast'
import { ConfirmDialog } from './people/ConfirmDialog'
import { formatIsoDay, formatStamp, formatStampDate } from './people/format'
import shared from './people/people.module.css'
import { toApiError, useApi } from './people/useApi'
import { AskState, SetupNote } from './Asks'
import styles from './Asks.module.css'

type Busy = 'draft' | 'save' | 'send' | 'status' | 'delete' | null
type Run = <T extends { item: AskDetail }>(kind: Busy, request: () => Promise<T>, done?: (result: T) => void) => Promise<void>

/** One ask: the email waiting to go (with Claude's questions and the notes box), and what's been sent. */
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

          {ask.messages.length > 0 && <Conversation ask={ask} />}

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
        <p>Its draft and the record of what was sent go with it. Emails already sent stay sent. It can’t be undone.</p>
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
  const [answers, setAnswers] = useState<Record<string, RememberValue>>(() =>
    Object.fromEntries(ask.questions.map((question) => [question.question, { answer: '', remember: question.remember, factLabel: '' }])),
  )
  // The facts a remembered answer can update, offered by name.
  const facts = useApi<{ items: Fact[] }>(ask.questions.length ? '/admin/facts' : null)
  const factLabels = facts.data?.items.map((fact) => fact.label) ?? []
  const [confirmSend, setConfirmSend] = useState(false)

  const open = ask.status === 'draft' || ask.status === 'waiting'
  const hasDraft = ask.body.trim() !== ''
  const edited = hasDraft && (subject !== ask.subject || body !== ask.body)
  const given = ask.questions
    .map((question) => ({ question: question.question, ...answers[question.question] }))
    .filter((entry) => entry.answer?.trim())
    .map((entry) => ({ question: entry.question, answer: entry.answer.trim(), remember: entry.remember, factLabel: entry.factLabel.trim() || undefined }))
  const unanswered = ask.questions.length - given.length
  const owner = ask.ownerName || ask.ownerEmail
  const repliesGo = setup?.inbox ? 'to the Inbox, and here' : `to ${owner}`
  const replied = ask.status === 'waiting' && ask.lastReply !== null

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
            : { text: `Sent to ${ask.toName}`, detail: `Replies come back ${repliesGo}.` },
        )
      },
    )

  return (
    <div className={styles.column}>
      {ask.lastReply && <ReplyCard ask={ask} busy={busy} run={run} />}

      {open && !hasDraft && !replied && (
        <section className={shared.panel}>
          <div className={styles.stack}>
            {ask.status === 'draft' ? (
              <>
                <h2 className={ui.panelTitle}>No draft yet</h2>
                <p className={ui.hint}>Claude writes it from what you asked and Proto’s facts.</p>
              </>
            ) : (
              <>
                <h2 className={ui.panelTitle}>Waiting for a reply</h2>
                <p className={ui.hint}>
                  Sent {ask.sentAt ? formatStampDate(ask.sentAt) : ''}. Replies come back {repliesGo}.{' '}
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
                <dd>{setup?.inbox ? 'Come back to the Inbox' : ask.ownerEmail}</dd>
              </div>
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
                    value={answers[question.question] ?? { answer: '', remember: question.remember, factLabel: '' }}
                    factLabels={factLabels}
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
          “{subject}” goes to {ask.toEmail} from {owner} at Proto, with {ask.ownerEmail} on Cc. Replies come back {repliesGo}.
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
  factLabels,
  onChange,
}: {
  question: string
  value: RememberValue
  factLabels: string[]
  onChange: (value: RememberValue) => void
}) {
  const id = useId()
  return (
    <li>
      <label className={styles.question} htmlFor={id}>
        {question}
      </label>
      <input id={id} className={ui.input} value={value.answer} maxLength={2000} onChange={(event) => onChange({ ...value, answer: event.target.value })} />
      <RememberFact id={id} question={question} value={value} factLabels={factLabels} onChange={onChange} />
    </li>
  )
}

// ---- Replies and the conversation ---------------------------------------------------------------

const VERDICT: Record<'yes' | 'partly' | 'no', { text: string; tone: string }> = {
  yes: { text: 'Gives us what we asked for', tone: 'live' },
  partly: { text: 'Answers part of it', tone: 'sample' },
  no: { text: 'Doesn’t give us what we asked for yet', tone: 'draft' },
}

/** The latest reply to the ask, with Claude's take on whether it answers it. */
function ReplyCard({ ask, busy, run }: { ask: AskDetail; busy: Busy; run: Run }) {
  const toast = useToast()
  const reply = ask.lastReply
  if (!reply) return null
  const reading = reply.reading
  const verdict = reading?.answersAsk ? VERDICT[reading.answersAsk] : null
  return (
    <section className={shared.panel} aria-labelledby="reply-title">
      <div className={styles.stack}>
        <div className={styles.spread}>
          <h2 id="reply-title" className={ui.panelTitle}>
            {ask.toName} replied
          </h2>
          <span className={ui.hint}>{formatStamp(reply.at)}</span>
        </div>
        {reading ? (
          <>
            {verdict && (
              <span className={ui.state} data-tone={verdict.tone}>
                {verdict.text}
              </span>
            )}
            <p className={styles.request}>{reading.summary}</p>
            {reading.stillNeeded.length > 0 && (
              <div className={ui.hint}>
                <p>Still open:</p>
                <ul>
                  {reading.stillNeeded.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className={ui.hint}>Claude hasn’t read it yet. Open the conversation to read it yourself.</p>
        )}
        <div className={styles.row}>
          <Link to={`/admin/email/inbox/${reply.threadId}`} className={ui.primary}>
            Read and reply
          </Link>
          {ask.status === 'waiting' && (
            <button
              type="button"
              className={ui.button}
              disabled={busy !== null}
              onClick={() =>
                void run(
                  'status',
                  () => api<{ item: AskDetail }>(`/admin/asks/${ask.id}`, { method: 'PATCH', body: { status: 'answered' } }),
                  () => toast('Marked answered'),
                )
              }
            >
              Mark answered
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

/** Every email in the ask's conversation, ours and theirs. The latest reply starts open. */
function Conversation({ ask }: { ask: AskDetail }) {
  const lastIn = [...ask.messages].reverse().find((message) => message.direction === 'in')
  return (
    <section className={shared.panel} aria-labelledby="conversation-title">
      <div className={styles.spread} style={{ marginBottom: 12 }}>
        <h2 id="conversation-title" className={ui.panelTitle}>
          Conversation
        </h2>
        {ask.threadId && (
          <Link to={`/admin/email/inbox/${ask.threadId}`} className={shared.link}>
            Open in Inbox
          </Link>
        )}
      </div>
      <ul className={styles.history}>
        {ask.messages.map((message) => (
          <li key={message.id}>
            <details open={message.id === lastIn?.id}>
              <summary>
                <span>{message.direction === 'in' ? `${message.fromName || message.fromEmail} replied` : message.subject}</span>
                <span className={ui.hint}>
                  {message.direction === 'out' ? `${message.kind === 'follow-up' ? 'Follow-up' : message.kind === 'reply' ? 'Reply' : 'Ask'} by ${message.sentBy}, ` : ''}
                  {formatStamp(message.createdAt)}
                  {message.status === 'logged' ? ' · logged, not sent' : message.status === 'failed' ? ' · failed' : ''}
                </span>
              </summary>
              {message.reading && <p className={ui.hint}>Claude: {message.reading.summary}</p>}
              <pre>{message.text}</pre>
            </details>
          </li>
        ))}
      </ul>
    </section>
  )
}
