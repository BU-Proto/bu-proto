import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useRevalidator } from 'react-router'
import type { AskDetail, AskSetup, Fact, MailMessage, MailThreadDetail, ReplyDraftInput, ReplySendInput, ThreadPatch } from '../../../shared/api'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { Field } from '../components/Field'
import { ArrowOutIcon, CheckIcon, SendIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { RememberFact, type RememberValue } from '../components/RememberFact'
import { SEND_KEYS, useKeys } from '../lib/keys'
import { readingChips, splitQuoted } from '../lib/mail'
import { useToast } from '../lib/toast'
import { ConfirmDialog } from './people/ConfirmDialog'
import { formatStamp } from './people/format'
import shared from './people/people.module.css'
import { toApiError, useApi } from './people/useApi'
import { SetupNote } from './Asks'
import asks from './Asks.module.css'
import styles from './Inbox.module.css'

type Busy = 'draft' | 'send' | 'status' | 'save' | null

/** Addresses typed as "a@b.edu, c@d.org" (or on separate lines). */
const addressesOf = (text: string) =>
  text
    .split(/[,;\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)

/** One conversation: every email in it, Claude's reading of each one that arrived, and the reply box. */
export function Component() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { revalidate } = useRevalidator()
  const { data, error, loading, setData } = useApi<{ item: MailThreadDetail; setup: AskSetup }>(`/admin/inbox/${id}`)
  const thread = data?.item
  const [busy, setBusy] = useState<Busy>(null)
  const [problem, setProblem] = useState('')
  const replyBody = useRef<HTMLTextAreaElement>(null)

  const apply = (item: MailThreadDetail) => setData((prev) => (prev ? { ...prev, item } : prev))

  // Opening it reads it: the sidebar's unread count drops.
  const unread = thread?.unread ?? 0
  const threadId = thread?.id
  useEffect(() => {
    if (!threadId || unread === 0) return
    api<{ item: MailThreadDetail }>(`/admin/inbox/${threadId}`, { method: 'PATCH', body: { read: true } satisfies ThreadPatch })
      .then(({ item }) => {
        setData((prev) => (prev ? { ...prev, item } : prev))
        void revalidate()
      })
      .catch(() => {})
  }, [threadId, unread, setData, revalidate])

  const setStatus = async (status: MailThreadDetail['status']) => {
    if (!thread || busy) return
    setBusy('status')
    setProblem('')
    try {
      const { item } = await api<{ item: MailThreadDetail }>(`/admin/inbox/${thread.id}`, { method: 'PATCH', body: { status } satisfies ThreadPatch })
      apply(item)
      void revalidate()
      if (status === 'done') {
        toast({ text: 'Marked done', action: { label: 'Undo', onAction: () => void setStatus('open') } })
        navigate('/admin/email/inbox')
      }
    } catch (failure) {
      setProblem(toApiError(failure).message)
    } finally {
      setBusy(null)
    }
  }

  // r to reply, e to mark it done: a mail app's keys.
  const keys = useMemo(
    () => ({
      r: () => replyBody.current?.focus(),
      e: () => void setStatus('done'),
    }),
    // setStatus closes over the thread; refresh the keys with it.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [thread, busy],
  )
  useKeys(keys, Boolean(thread))

  if (!thread) {
    return (
      <div className={shared.page}>
        <PageHeader title="Email" tabTitle="Conversation" back={{ to: '/admin/email/inbox', label: 'Inbox' }} />
        {loading ? (
          <div className={shared.panel} aria-hidden="true">
            <span className={ui.skeleton} style={{ width: 240 }} />
          </div>
        ) : (
          <p className={shared.error} role="alert">
            {error?.message ?? 'That conversation no longer exists.'}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={shared.page}>
      <PageHeader
        title={thread.subject}
        tabTitle={thread.subject}
        back={{ to: '/admin/email/inbox', label: 'Inbox' }}
        actions={
          thread.status === 'done' ? (
            <button type="button" className={ui.button} disabled={busy !== null} onClick={() => void setStatus('open')}>
              Move to To do
            </button>
          ) : (
            <button type="button" className={ui.button} disabled={busy !== null} onClick={() => void setStatus('done')} title="Done (e)">
              <CheckIcon /> Done
            </button>
          )
        }
      />
      <SetupNote setup={data?.setup} />
      <p className={shared.error} role="alert" hidden={!problem}>
        {problem}
      </p>

      <div className={styles.layout}>
        {thread.ask && <AskBar thread={thread} onAnswered={apply} />}

        {thread.messages.map((message) => (
          <Message key={message.id} message={message} isAsk={thread.askId !== null} />
        ))}

        {/* Keyed by the draft, so a new one from Claude starts the box over. */}
        <ReplyBox key={`${thread.id} ${thread.draftedAt} ${thread.messageCount}`} thread={thread} setup={data?.setup} busy={busy} setBusy={setBusy} onSaved={apply} bodyRef={replyBody} />
        <p className={styles.keys}>
          Keys: r to reply, e to mark done, {SEND_KEYS} to send.
        </p>
      </div>
    </div>
  )
}

/** The ask a conversation started from, with Mark answered one press away. */
function AskBar({ thread, onAnswered }: { thread: MailThreadDetail; onAnswered: (item: MailThreadDetail) => void }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const ask = thread.ask
  if (!ask) return null
  const markAnswered = async () => {
    setSaving(true)
    try {
      await api<{ item: AskDetail }>(`/admin/asks/${ask.id}`, { method: 'PATCH', body: { status: 'answered' } })
      toast('Ask marked answered')
      onAnswered({ ...thread, ask: { ...ask, status: 'answered' } })
    } catch (failure) {
      toast({ text: 'Couldn’t mark it answered', detail: toApiError(failure).message, tone: 'error' })
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className={styles.ask}>
      <p>
        <span className={ui.dim}>Our ask: </span>
        {ask.request.split('\n')[0]}
      </p>
      <div className={asks.row}>
        <Link to={`/admin/email/asks/${ask.id}`} className={shared.link}>
          Open the ask
        </Link>
        {ask.status === 'waiting' && (
          <button type="button" className={`${ui.button} ${ui.small}`} disabled={saving} onClick={markAnswered}>
            Mark answered
          </button>
        )}
        {ask.status === 'answered' && <span className={ui.state} data-tone="live">Answered</span>}
      </div>
    </div>
  )
}

/** Remote images stay off (they can track who opened an email); the frame runs no scripts. */
const ORIGINAL_GUARD = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">`

function Message({ message, isAsk }: { message: MailMessage; isAsk: boolean }) {
  const [showQuoted, setShowQuoted] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  const { own, quoted } = splitQuoted(message.text)
  const incoming = message.direction === 'in'
  const chips = incoming ? readingChips(message.reading, isAsk) : []
  return (
    <article className={styles.message} data-direction={message.direction}>
      <header className={styles.messageHead}>
        <p className={styles.from}>
          {incoming ? message.fromName || message.fromEmail : message.fromName}
          <span className={styles.fromEmail}>{incoming ? message.fromEmail : `by ${message.sentBy}`}</span>
        </p>
        <time className={ui.hint} dateTime={message.createdAt}>
          {formatStamp(message.createdAt)}
          {message.status === 'logged' ? ', logged (not sent)' : message.status === 'failed' ? ', failed' : ''}
        </time>
      </header>
      <p className={styles.addressees}>
        To {message.to.join(', ')}
        {message.cc.length > 0 && ` · Cc ${message.cc.join(', ')}`}
      </p>

      {incoming && message.reading && (
        <div className={styles.reading}>
          <p>
            <strong>Claude:</strong> {message.reading.summary}
          </p>
          {chips.length > 0 && (
            <span className={styles.chips}>
              {chips.map((chip) => (
                <span key={chip.text} className={styles.chip} data-tone={chip.tone}>
                  {chip.text}
                </span>
              ))}
            </span>
          )}
          {message.reading.stillNeeded.length > 0 && (
            <ul>
              {message.reading.stillNeeded.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {own ? <pre className={styles.text}>{own}</pre> : !message.html && <p className={ui.hint}>No text in this email.</p>}
      {quoted && (
        <>
          <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => setShowQuoted((value) => !value)}>
            {showQuoted ? 'Hide the quoted email' : 'Show the quoted email'}
          </button>
          {showQuoted && <pre className={`${styles.text} ${styles.quoted}`}>{quoted}</pre>}
        </>
      )}

      {message.attachments.length > 0 && (
        <ul className={styles.files}>
          {message.attachments.map((file) =>
            file.id && incoming ? (
              <li key={file.id}>
                <a href={`/api/admin/inbox/messages/${message.id}/attachments/${encodeURIComponent(file.id)}`} className={shared.link}>
                  {file.filename} <ArrowOutIcon />
                </a>
              </li>
            ) : (
              <li key={file.filename} className={ui.dim}>
                {file.filename}
              </li>
            ),
          )}
        </ul>
      )}

      {incoming && message.html && (
        <div>
          <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => setShowOriginal((value) => !value)}>
            {showOriginal ? 'Hide the original' : 'Show the original (formatted)'}
          </button>
          {showOriginal && <iframe className={styles.original} title={`The original email from ${message.fromEmail}`} sandbox="" srcDoc={ORIGINAL_GUARD + message.html} />}
        </div>
      )}
    </article>
  )
}

interface ReplyBoxProps {
  thread: MailThreadDetail
  setup: AskSetup | undefined
  busy: Busy
  setBusy: (busy: Busy) => void
  onSaved: (item: MailThreadDetail) => void
  bodyRef: React.RefObject<HTMLTextAreaElement | null>
}

function reSubject(subject: string) {
  return /^re:/i.test(subject.trim()) ? subject.trim() : `Re: ${subject.trim()}`
}

/** The reply: Claude drafts it (with your notes and answers), you edit it, ⌘↵ sends it in the same thread. */
function ReplyBox({ thread, setup, busy, setBusy, onSaved, bodyRef }: ReplyBoxProps) {
  const toast = useToast()
  const { revalidate } = useRevalidator()
  const id = useId()
  const [to, setTo] = useState(thread.replyTo.join(', '))
  const [cc, setCc] = useState(thread.replyCc.join(', '))
  const [subject, setSubject] = useState(reSubject(thread.subject))
  const [body, setBody] = useState(thread.draftBody)
  const [notes, setNotes] = useState(thread.draftNotes)
  const [answers, setAnswers] = useState<Record<string, RememberValue>>({})
  // The facts a remembered answer can update, offered by name.
  const facts = useApi<{ items: Fact[] }>(thread.draftQuestions.length ? '/admin/facts' : null)
  const factLabels = facts.data?.items.map((fact) => fact.label) ?? []
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  const given = thread.draftQuestions
    .map((question) => ({
      question,
      answer: answers[question]?.answer?.trim() ?? '',
      remember: answers[question]?.remember ?? false,
      factLabel: answers[question]?.factLabel?.trim() || undefined,
    }))
    .filter((entry) => entry.answer)

  const draft = async () => {
    if (busy) return
    setBusy('draft')
    setError('')
    try {
      const result = await api<{ item: MailThreadDetail; notice?: string }>(`/admin/inbox/${thread.id}/draft`, {
        body: { notes, answers: given } satisfies ReplyDraftInput,
      })
      onSaved(result.item)
      toast({ text: thread.draftBody ? 'Redrafted' : 'Reply drafted', detail: result.notice })
    } catch (failure) {
      setError(toApiError(failure).message)
    } finally {
      setBusy(null)
    }
  }

  // The draft is kept on the thread, so it's there after a reload or for another teammate.
  const saveDraft = async () => {
    if (busy || body === thread.draftBody) return
    try {
      const { item } = await api<{ item: MailThreadDetail }>(`/admin/inbox/${thread.id}`, { method: 'PATCH', body: { draftBody: body } satisfies ThreadPatch })
      onSaved({ ...item, draftBody: body })
    } catch {
      // Not worth interrupting the writing for; Send still sends what's on screen.
    }
  }

  const send = async () => {
    if (busy) return
    setBusy('send')
    setError('')
    try {
      const result = await api<{ item: MailThreadDetail; logged: boolean }>(`/admin/inbox/${thread.id}/send`, {
        body: { to: addressesOf(to), cc: addressesOf(cc), subject, body } satisfies ReplySendInput,
      })
      setConfirming(false)
      onSaved(result.item)
      void revalidate()
      toast(result.logged ? { text: 'Logged, not sent', detail: 'RESEND_API_KEY isn’t set here, so the email went to the server log.' } : { text: 'Reply sent' })
    } catch (failure) {
      const apiError = toApiError(failure)
      setError(Object.values(apiError.issues)[0] ?? apiError.message)
    } finally {
      setBusy(null)
    }
  }

  const ready = addressesOf(to).length > 0 && subject.trim() !== '' && body.trim() !== ''
  const unanswered = thread.draftQuestions.length - given.length

  return (
    <section className={styles.reply} aria-labelledby={`${id}-title`}>
      <div className={styles.replyHead}>
        <h2 id={`${id}-title`} className={ui.panelTitle}>
          Reply
        </h2>
        {thread.draftedAt && thread.draftBody && <span className={ui.hint}>Drafted by Claude {formatStamp(thread.draftedAt)}</span>}
      </div>

      <div className={styles.addressRow}>
        <label htmlFor={`${id}-to`}>To</label>
        <input id={`${id}-to`} className={ui.input} value={to} onChange={(event) => setTo(event.target.value)} />
      </div>
      <div className={styles.addressRow}>
        <label htmlFor={`${id}-cc`}>Cc</label>
        <input id={`${id}-cc`} className={ui.input} value={cc} placeholder="No one" onChange={(event) => setCc(event.target.value)} />
      </div>
      <div className={styles.addressRow}>
        <label htmlFor={`${id}-subject`}>Subject</label>
        <input id={`${id}-subject`} className={ui.input} value={subject} maxLength={200} onChange={(event) => setSubject(event.target.value)} />
      </div>

      <textarea
        ref={bodyRef}
        aria-label="Reply"
        className={`${ui.input} ${styles.replyBody}`}
        value={body}
        maxLength={20000}
        placeholder={'Write your reply, or press "Draft with Claude".'}
        onChange={(event) => setBody(event.target.value)}
        onBlur={() => void saveDraft()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && ready) {
            event.preventDefault()
            setConfirming(true)
          }
        }}
      />
      <p className={ui.hint}>
        Your name and Proto’s signature go under it. {setup?.inbox ? 'Their answer comes back to this conversation.' : 'Their answer goes to your own inbox until receiving is set up.'}
      </p>

      {thread.draftQuestions.length > 0 && (
        <div className={asks.stack}>
          <h3 className={ui.panelTitle}>Claude needs to know</h3>
          <ul className={asks.questions}>
            {thread.draftQuestions.map((question) => (
              <li key={question}>
                <label className={asks.question} htmlFor={`${id}-${question}`}>
                  {question}
                </label>
                <input
                  id={`${id}-${question}`}
                  className={ui.input}
                  value={answers[question]?.answer ?? ''}
                  onChange={(event) =>
                    setAnswers((prev) => ({ ...prev, [question]: { ...(prev[question] ?? { remember: false, factLabel: '' }), answer: event.target.value } }))
                  }
                />
                <RememberFact
                  id={`${id}-${question}`}
                  question={question}
                  value={answers[question] ?? { answer: '', remember: false, factLabel: '' }}
                  factLabels={factLabels}
                  onChange={(value) => setAnswers((prev) => ({ ...prev, [question]: value }))}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <Field label="Notes for Claude" hint="What to say, what to leave out, the tone. Then press Draft.">
        {(props) => <input {...props} className={ui.input} maxLength={4000} value={notes} placeholder="Say yes to Dec 4, ask if 6:30 works instead" onChange={(event) => setNotes(event.target.value)} />}
      </Field>

      <div className={styles.row2}>
        <button type="button" className={ui.primary} disabled={busy !== null || !ready} onClick={() => setConfirming(true)}>
          <SendIcon /> {busy === 'send' ? 'Sending…' : 'Send'}
        </button>
        <button type="button" className={ui.button} disabled={busy !== null} onClick={draft}>
          {busy === 'draft' ? 'Claude is writing…' : thread.draftBody || body ? 'Redraft with Claude' : 'Draft with Claude'}
        </button>
        {body !== thread.draftBody && thread.draftBody && <span className={ui.hint}>Redrafting replaces your edits.</span>}
      </div>
      <p className={shared.error} role="alert" hidden={!error}>
        {error}
      </p>

      <ConfirmDialog
        open={confirming}
        title="Send this reply?"
        confirmLabel={busy === 'send' ? 'Sending…' : 'Send it'}
        busy={busy === 'send'}
        error={confirming ? error : ''}
        onConfirm={send}
        onCancel={() => setConfirming(false)}
      >
        <p>
          “{subject}” goes to {addressesOf(to).join(', ')}
          {addressesOf(cc).length > 0 && `, with ${addressesOf(cc).join(', ')} on Cc`}, from you at Proto.
        </p>
        {unanswered > 0 && <p>Claude still has {unanswered === 1 ? 'a question' : `${unanswered} questions`} you haven’t answered. Send anyway?</p>}
        {setup && !setup.resend && <p>Email isn’t set up here, so it will only be logged.</p>}
      </ConfirmDialog>
    </section>
  )
}
