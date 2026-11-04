import { useLayoutEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { EMAIL_VARIABLES, type AdminEvent, type AudienceCount, type EmailAudience, type EmailCampaign, type FundStatus, type Track } from '../../../shared/api'
import { FUND_STATUSES, TRACKS } from '../../../shared/constants'
import ui from '../admin.module.css'
import { api } from '../../lib/api'
import { daysUntil, formatDay } from '../../lib/dates'
import { ConfirmDialog } from './people/ConfirmDialog'
import { describeAudience, formatIsoDay, formatStamp, plural, stampToIso } from './people/format'
import { toApiError, useApi } from './people/useApi'
import { useEmailPreview } from './people/useEmailPreview'
import shared from './people/people.module.css'
import styles from './Email.module.css'

type Kind = EmailAudience['type']

const TEST_ADDRESS_KEY = 'proto-admin:test-email'

const CAMPAIGN_STATUS_LABELS: Record<EmailCampaign['status'], string> = {
  sent: 'Sent',
  partial: 'Partly sent',
  failed: 'Failed',
  logged: 'Logged only',
}


const isTrack = (value: string | null): value is Track => (TRACKS as readonly string[]).includes(value ?? '')
const isStatus = (value: string | null): value is FundStatus => (FUND_STATUSES as readonly string[]).includes(value ?? '')

/** Reads ?audience=…, ?track=…, ?status=… and ?event=… once, for links from the other pages. */
function initialAudience(params: URLSearchParams) {
  const event = Number(params.get('event'))
  const kind = params.get('audience')
  const track = params.get('track')
  const status = params.get('status')
  return {
    kind: (Number.isInteger(event) && event > 0 ? 'event' : kind === 'track' || kind === 'fund' ? kind : 'members') as Kind,
    track: isTrack(track) ? track : TRACKS[0],
    eventId: Number.isInteger(event) && event > 0 ? event : null,
    fundStatus: (isStatus(status) ? status : '') as FundStatus | '',
  }
}

const readTestAddress = () => {
  try {
    return localStorage.getItem(TEST_ADDRESS_KEY) ?? ''
  } catch {
    return ''
  }
}

export function Component() {
  const [params] = useSearchParams()
  const [initial] = useState(() => initialAudience(params))
  const [kind, setKind] = useState<Kind>(initial.kind)
  const [track, setTrack] = useState<Track>(initial.track)
  const [eventId, setEventId] = useState<number | null>(initial.eventId)
  const [fundStatus, setFundStatus] = useState<FundStatus | ''>(initial.fundStatus)

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [issues, setIssues] = useState<Record<string, string>>({})

  // Variables go in at the caret of whichever field was focused last.
  const subjectRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const lastField = useRef<'subject' | 'body'>('body')
  const caret = useRef<{ field: 'subject' | 'body'; at: number } | null>(null)

  useLayoutEffect(() => {
    const pending = caret.current
    if (!pending) return
    caret.current = null
    const element = pending.field === 'subject' ? subjectRef.current : bodyRef.current
    element?.focus()
    element?.setSelectionRange(pending.at, pending.at)
  }, [subject, body])

  const insertVariable = (token: string) => {
    const field = lastField.current
    const element = field === 'subject' ? subjectRef.current : bodyRef.current
    const value = field === 'subject' ? subject : body
    if (!element) return
    const start = element.selectionStart ?? value.length
    const end = element.selectionEnd ?? start
    const next = value.slice(0, start) + token + value.slice(end)
    if (next.length > element.maxLength && element.maxLength > 0) return
    caret.current = { field, at: start + token.length }
    if (field === 'subject') setSubject(next)
    else setBody(next)
  }

  const audience: EmailAudience | null =
    kind === 'members'
      ? { type: 'members' }
      : kind === 'track'
        ? { type: 'track', track }
        : kind === 'event'
          ? eventId
            ? { type: 'event', eventId }
            : null
          : fundStatus
            ? { type: 'fund', status: fundStatus }
            : { type: 'fund' }
  const audienceKey = audience && JSON.stringify(audience)

  // Which recipient the preview shows; a new audience starts again from the first.
  const [step, setStep] = useState({ audience: audienceKey, index: 0 })
  const previewIndex = step.audience === audienceKey ? step.index : 0
  const preview = useEmailPreview(audience, subject, body, previewIndex)
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html')

  const events = useApi<{ items: AdminEvent[] }>('/admin/content/events')
  const countPath = audienceKey && `/admin/email/audience?audience=${encodeURIComponent(audienceKey)}`
  const count = useApi<AudienceCount>(countPath)
  const campaigns = useApi<{ items: EmailCampaign[] }>('/admin/email/campaigns')

  // Only trust a count fetched for the audience on screen; the previous one lingers while the next loads.
  const recipients = countPath && count.dataPath === countPath && !count.loading ? count.data?.count : undefined

  const { upcoming, past, titles } = useMemo(() => {
    const items = events.data?.items ?? []
    return {
      upcoming: items.filter((e) => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)),
      past: items.filter((e) => daysUntil(e.date) < 0).sort((a, b) => b.date.localeCompare(a.date)),
      titles: new Map(items.map((e) => [e.id, e.title])),
    }
  }, [events.data])

  // Test send
  const [testTo, setTestTo] = useState(readTestAddress)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null)

  // Real send
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const sendingRef = useRef(false)
  const [sendError, setSendError] = useState('')
  const [sent, setSent] = useState<EmailCampaign | null>(null)

  const composeReady = subject.trim() !== '' && body.trim() !== ''
  const canSend = composeReady && audience !== null && recipients !== undefined && recipients > 0 && !sending

  const checkCompose = () => {
    const next: Record<string, string> = {}
    if (!subject.trim()) next.subject = 'Add a subject.'
    if (!body.trim()) next.body = 'Write something.'
    setIssues(next)
    return Object.keys(next).length === 0
  }

  const sendTest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (testing) return
    setTestResult(null)
    if (!checkCompose()) return
    const to = testTo.trim()
    if (!to) {
      setIssues((prev) => ({ ...prev, to: 'Enter an address.' }))
      return
    }
    try {
      localStorage.setItem(TEST_ADDRESS_KEY, to)
    } catch {
      // Private mode can refuse storage; the test still goes.
    }
    setTesting(true)
    try {
      const result = await api<{ ok: true; logged: boolean }>('/admin/email/test', { method: 'POST', body: { to, subject, body } })
      setTestResult({
        ok: true,
        text: result.logged
          ? `Logged, not sent: RESEND_API_KEY isn’t set, so nothing actually left for ${to}.`
          : `Test sent to ${to}. Check the inbox (and spam).`,
      })
    } catch (error) {
      const failure = toApiError(error)
      setIssues(failure.issues)
      setTestResult({ ok: false, text: failure.issues.to ?? failure.message })
    } finally {
      setTesting(false)
    }
  }

  const openConfirm = () => {
    setSent(null)
    setSendError('')
    if (!checkCompose() || !canSend) return
    setConfirming(true)
  }

  const send = async () => {
    // A ref, not state: two quick clicks land before React re-renders the disabled button.
    if (sendingRef.current || !audience) return
    sendingRef.current = true
    setSending(true)
    setSendError('')
    try {
      const { item } = await api<{ item: EmailCampaign }>('/admin/email/send', { method: 'POST', body: { audience, subject, body } })
      setSent(item)
      setConfirming(false)
      // Clear the draft so the same email can't go out twice by accident.
      setSubject('')
      setBody('')
      setIssues({})
      campaigns.reload()
    } catch (error) {
      const failure = toApiError(error)
      setIssues(failure.issues)
      setSendError(failure.message)
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  const audienceText = audience ? describeAudience(audience, titles) : 'Pick an event'

  return (
    <div className={`${shared.page} ${styles.root}`}>
      <title>Email · Admin · BU Proto</title>

      <header className={shared.head}>
        <div className={shared.headText}>
          <h1 className={shared.title}>Email</h1>
          <p className={shared.lede}>Write once, send to a list. Every send is logged below.</p>
        </div>
        <Link className={ui.button} to="/admin/email/automatic">
          Automatic emails
        </Link>
      </header>

      <div aria-live="polite">{sent && <SentResult campaign={sent} audienceText={describeAudience(sent.audience, titles)} />}</div>

      <div className={styles.layout}>
        <div className={styles.compose}>
          <fieldset className={`${shared.panel} ${styles.audience}`}>
            <legend className={`${shared.panelTitle} ${styles.legend}`}>Audience</legend>

            <AudienceOption kind="members" current={kind} onPick={setKind} label="All members" hint="Everyone who joined and hasn’t unsubscribed." />

            <AudienceOption kind="track" current={kind} onPick={setKind} label="One track" hint="Members on a track who haven’t unsubscribed.">
              <select
                className={shared.input}
                aria-label="Track"
                value={track}
                onChange={(event) => setTrack(event.target.value as Track)}
              >
                {TRACKS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </AudienceOption>

            <AudienceOption kind="event" current={kind} onPick={setKind} label="An event’s RSVPs" hint="Everyone who RSVP’d, member or not.">
              <select
                className={shared.input}
                aria-label="Event"
                value={eventId ?? ''}
                onChange={(event) => setEventId(event.target.value ? Number(event.target.value) : null)}
              >
                <option value="">{events.loading && !events.data ? 'Loading events…' : 'Choose an event'}</option>
                {upcoming.length > 0 && (
                  <optgroup label="Upcoming">
                    {upcoming.map((e) => (
                      <EventOption key={e.id} event={e} />
                    ))}
                  </optgroup>
                )}
                {past.length > 0 && (
                  <optgroup label="Past">
                    {past.map((e) => (
                      <EventOption key={e.id} event={e} withYear />
                    ))}
                  </optgroup>
                )}
                {/* A link can name an event this list doesn't have (yet, or any more). */}
                {eventId && events.data && !titles.has(eventId) && <option value={eventId}>Event #{eventId}</option>}
              </select>
              {events.error && <p className={shared.error}>Couldn’t load events: {events.error.message}</p>}
            </AudienceOption>

            <AudienceOption kind="fund" current={kind} onPick={setKind} label="Fund interest list" hint="People on the fund list, by status.">
              <select
                className={`${shared.input} ${styles.capitalize}`}
                aria-label="Fund status"
                value={fundStatus}
                onChange={(event) => setFundStatus(event.target.value as FundStatus | '')}
              >
                <option value="">Everyone</option>
                {FUND_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </AudienceOption>

            <p className={styles.recipients} aria-live="polite">
              {!audience ? (
                <span className={shared.dim}>Choose an event to see who’d get it.</span>
              ) : count.error ? (
                <span className={shared.error}>Couldn’t count recipients: {count.error.message}</span>
              ) : recipients === undefined ? (
                <span className={shared.dim}>Counting…</span>
              ) : (
                <>
                  <span className={styles.recipientCount}>{recipients}</span> {recipients === 1 ? 'recipient' : 'recipients'}
                </>
              )}
            </p>
            {issues.audience && <p className={shared.fieldError}>{issues.audience}</p>}
          </fieldset>

          <div className={`${shared.panel} ${styles.message}`}>
            <h2 className={shared.panelTitle}>Message</h2>
            <label className={shared.field}>
              <span className={shared.label}>Subject</span>
              <input
                className={shared.input}
                value={subject}
                ref={subjectRef}
                onFocus={() => (lastField.current = 'subject')}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={150}
                aria-invalid={issues.subject ? true : undefined}
                aria-describedby={issues.subject ? 'issue-subject' : undefined}
              />
              {issues.subject && (
                <p id="issue-subject" className={shared.fieldError}>
                  {issues.subject}
                </p>
              )}
            </label>
            <label className={shared.field}>
              <span className={shared.label}>Body</span>
              <textarea
                className={`${shared.input} ${styles.body}`}
                value={body}
                ref={bodyRef}
                onFocus={() => (lastField.current = 'body')}
                onChange={(event) => setBody(event.target.value)}
                maxLength={20000}
                rows={12}
                aria-invalid={issues.body ? true : undefined}
                aria-describedby={`body-hint${issues.body ? ' issue-body' : ''}`}
              />
              {issues.body && (
                <p id="issue-body" className={shared.fieldError}>
                  {issues.body}
                </p>
              )}
            </label>
            <p id="body-hint" className={shared.hint}>
              Plain text. Leave a blank line between paragraphs. Emails to members get an unsubscribe link at the bottom
              automatically.
            </p>
            <Variables kind={kind} onInsert={insertVariable} />
          </div>

          <form className={`${shared.panel} ${styles.test}`} onSubmit={sendTest} noValidate>
            <h2 className={shared.panelTitle}>Send a test</h2>
            <div className={styles.testRow}>
              <label className={`${shared.field} ${styles.testField}`}>
                <span className={shared.label}>Your address</span>
                <input
                  type="email"
                  className={shared.input}
                  value={testTo}
                  onChange={(event) => setTestTo(event.target.value)}
                  autoComplete="email"
                  spellCheck={false}
                  aria-invalid={issues.to ? true : undefined}
                />
              </label>
              <button type="submit" className={ui.secondary} disabled={testing}>
                {testing ? 'Sending…' : 'Send test'}
              </button>
            </div>
            <div aria-live="polite">
              {issues.to && !testResult && <p className={shared.fieldError}>{issues.to}</p>}
              {testResult && <p className={testResult.ok ? shared.status : shared.error}>{testResult.text}</p>}
            </div>
          </form>

          <div className={styles.sendBar}>
            <button type="button" className={ui.primary} onClick={openConfirm} disabled={!canSend} aria-busy={sending || undefined}>
              {sending ? 'Sending…' : recipients ? `Send to ${plural(recipients, 'person', 'people')}…` : 'Send…'}
            </button>
            <p className={shared.hint}>
              {!composeReady
                ? 'Add a subject and a message to send.'
                : recipients === 0
                  ? 'No one is on that list yet.'
                  : 'You’ll confirm before anything goes out.'}
            </p>
          </div>
        </div>

        <aside className={`${shared.panel} ${styles.preview}`} aria-labelledby="preview-title">
          <div className={styles.previewHead}>
            <h2 id="preview-title" className={shared.panelTitle}>
              Preview
            </h2>
            <div className={styles.modes} role="group" aria-label="Preview format">
              {(['html', 'text'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={styles.mode}
                  aria-pressed={previewMode === mode}
                  onClick={() => setPreviewMode(mode)}
                >
                  {mode === 'html' ? 'HTML' : 'Plain text'}
                </button>
              ))}
            </div>
          </div>
          <PreviewPane
            audience={audience}
            state={preview}
            mode={previewMode}
            onStep={(index) => setStep({ audience: audienceKey, index })}
          />
        </aside>
      </div>

      <History campaigns={campaigns} titles={titles} />

      <ConfirmDialog
        open={confirming}
        title={`Send to ${plural(recipients ?? 0, 'person', 'people')}?`}
        confirmLabel="Send now"
        busy={sending}
        error={sendError}
        onConfirm={send}
        onCancel={() => {
          setConfirming(false)
          setSendError('')
        }}
      >
        <p>
          <span className={shared.dim}>Subject:</span> {subject}
        </p>
        <p>
          <span className={shared.dim}>To:</span> {audienceText}
        </p>
        <p>Once it’s sent, it can’t be called back.</p>
      </ConfirmDialog>
    </div>
  )
}

/** The variable menu. Ones the audience can't fill stay listed, flagged, so nobody wonders where they went. */
function Variables({ kind, onInsert }: { kind: Kind; onInsert: (token: string) => void }) {
  return (
    <details className={styles.variables}>
      <summary className={styles.variablesSummary}>Insert variable</summary>
      <p className={shared.hint}>Goes in at the cursor in the subject or body, whichever you were last in.</p>
      <ul className={styles.variableList}>
        {EMAIL_VARIABLES.map((variable) => {
          const available = !variable.audiences || variable.audiences.includes(kind)
          return (
            <li key={variable.token}>
              <button
                type="button"
                className={styles.variable}
                aria-disabled={!available || undefined}
                onClick={() => available && onInsert(variable.token)}
              >
                <span className={styles.variableLabel}>{variable.label}</span>
                <code className={styles.variableToken}>{variable.token}</code>
                <span className={styles.variableExample}>
                  {available ? `e.g. ${variable.example}` : 'not available for this audience'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </details>
  )
}

interface PreviewPaneProps {
  audience: EmailAudience | null
  state: ReturnType<typeof useEmailPreview>
  mode: 'html' | 'text'
  onStep: (index: number) => void
}

function PreviewPane({ audience, state, mode, onStep }: PreviewPaneProps) {
  const { preview, error, loading } = state
  if (!audience) return <p className={shared.dim}>Choose an event to preview the email.</p>
  if (!preview) {
    return <p className={error ? shared.error : shared.dim}>{error ? `Preview unavailable: ${error.message}` : 'Rendering preview…'}</p>
  }

  const { recipient, index, recipientCount, unfilled } = preview
  const canStep = !recipient.sample && recipientCount > 1
  return (
    <div className={styles.previewBody} aria-busy={loading || undefined}>
      <div className={styles.recipientBar}>
        <p className={styles.to}>
          <span className={shared.dim}>To:</span>{' '}
          {recipient.sample ? (
            <>
              Sample recipient{' '}
              <span className={`${shared.mono} ${shared.dim}`}>
                {recipient.name} &lt;{recipient.email}&gt;
              </span>
            </>
          ) : (
            <>
              {recipient.name} <span className={`${shared.mono} ${shared.dim}`}>&lt;{recipient.email}&gt;</span>
            </>
          )}
        </p>
        {canStep && (
          <div className={styles.stepper}>
            <button
              type="button"
              className={shared.small}
              aria-label="Previous recipient"
              onClick={() => onStep((index - 1 + recipientCount) % recipientCount)}
            >
              ←
            </button>
            <span className={shared.mono} aria-live="polite">
              {index + 1} of {recipientCount}
            </span>
            <button type="button" className={shared.small} aria-label="Next recipient" onClick={() => onStep((index + 1) % recipientCount)}>
              →
            </button>
          </div>
        )}
      </div>

      <p className={styles.previewSubject}>{preview.subject || <span className={shared.dim}>No subject yet</span>}</p>

      {unfilled.length > 0 && (
        <p className={styles.unfilled} role="status">
          {unfilled.join(', ')} {unfilled.length === 1 ? 'is' : 'are'} empty for this audience.
        </p>
      )}
      {error && <p className={shared.hint}>Couldn’t refresh the preview ({error.message}). Showing the last one.</p>}

      <div className={loading ? styles.stale : undefined}>
        {mode === 'html' ? (
          <iframe className={styles.frame} title={`Email preview: ${preview.subject || 'no subject'}`} sandbox="" srcDoc={preview.html} />
        ) : (
          <pre className={styles.plain}>{preview.text}</pre>
        )}
      </div>
    </div>
  )
}

function EventOption({ event, withYear }: { event: AdminEvent; withYear?: boolean }) {
  const day = withYear ? formatIsoDay(event.date) : formatDay(event.date)
  return (
    <option value={event.id}>
      {`${event.title} (${day}, ${plural(event.rsvpCount, 'RSVP')})`}

    </option>
  )
}

interface AudienceOptionProps {
  kind: Kind
  current: Kind
  onPick: (kind: Kind) => void
  label: string
  hint: string
  children?: ReactNode
}

function AudienceOption({ kind, current, onPick, label, hint, children }: AudienceOptionProps) {
  const checked = kind === current
  return (
    <div className={styles.option} data-checked={checked || undefined}>
      <label className={styles.optionLabel}>
        <input type="radio" name="audience" value={kind} checked={checked} onChange={() => onPick(kind)} />
        <span>
          <span className={styles.optionTitle}>{label}</span>
          <span className={shared.hint}>{hint}</span>
        </span>
      </label>
      {checked && children && <div className={styles.optionControl}>{children}</div>}
    </div>
  )
}

function SentResult({ campaign, audienceText }: { campaign: EmailCampaign; audienceText: string }) {
  const { status, sentCount, failedCount, recipientCount } = campaign
  const text =
    status === 'logged'
      ? `Logged, not sent. RESEND_API_KEY isn’t set on this Worker, so none of the ${plural(recipientCount, 'email')} actually left. Set the key to send for real.`
      : status === 'sent'
        ? `Sent to ${plural(sentCount, 'person', 'people')}.`
        : status === 'partial'
          ? `Sent to ${sentCount} of ${recipientCount}. ${failedCount} failed; they’re counted in the history below.`
          : `Nothing went out: all ${plural(recipientCount, 'email')} failed. Check the Worker logs.`
  return (
    <div className={styles.result} data-tone={status} role="status">
      <p className={styles.resultTitle}>
        “{campaign.subject}” <span className={shared.dim}>to {audienceText}</span>
      </p>
      <p>{text}</p>
    </div>
  )
}

function History({ campaigns, titles }: { campaigns: ReturnType<typeof useApi<{ items: EmailCampaign[] }>>; titles: ReadonlyMap<number, string> }) {
  const items = campaigns.data?.items ?? []
  return (
    <section className={styles.history} aria-labelledby="history-title">
      <h2 id="history-title" className={shared.panelTitle}>
        History {campaigns.data && <span className={shared.count}>{items.length}</span>}
      </h2>
      {campaigns.error && (
        <p className={shared.error} role="alert">
          {campaigns.error.message}
        </p>
      )}
      {!campaigns.data && campaigns.loading ? (
        <p className={shared.dim}>Loading…</p>
      ) : campaigns.data && items.length === 0 ? (
        <p className={`${shared.panel} ${shared.empty}`}>Nothing sent yet.</p>
      ) : (
        <ul className={styles.campaigns}>
          {items.map((campaign) => (
            <li key={campaign.id}>
              <details className={styles.campaign}>
                <summary className={styles.summary}>
                  <span className={styles.summaryWhat}>
                    <span className={styles.summarySubject}>{campaign.subject}</span>
                    <span className={styles.summaryAudience}>{describeAudience(campaign.audience, titles)}</span>
                  </span>
                  <span className={styles.summaryResult}>
                    <span className={shared.state} data-tone={campaign.status}>
                      {CAMPAIGN_STATUS_LABELS[campaign.status]}
                    </span>
                    <span className={`${shared.figure} ${shared.dim}`}>
                      {campaign.sentCount} of {campaign.recipientCount} sent
                      {campaign.failedCount > 0 && <span className={styles.failed}>, {campaign.failedCount} failed</span>}
                    </span>
                  </span>
                  <span className={styles.summaryWho}>
                    <time className={shared.figure} dateTime={stampToIso(campaign.createdAt)}>
                      {formatStamp(campaign.createdAt)}
                    </time>
                    <span className={shared.dim}>
                      by <span className={shared.mono}>{campaign.sentBy}</span>
                    </span>
                  </span>
                </summary>
                <div className={styles.campaignBody}>
                  {campaign.status === 'logged' && (
                    <p className={shared.hint}>Logged only: RESEND_API_KEY wasn’t set, so this never left.</p>
                  )}
                  <pre className={styles.bodyText}>{campaign.body}</pre>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
