import { Link, Navigate, useLocation } from 'react-router'
import type { Ask, AskSetup, EmailCampaign, MailThread } from '../../../shared/api'
import ui from '../admin.module.css'
import { ChevronRightIcon, PlusIcon, SendIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { formatRelative } from '../lib/format'
import { describeAudience, plural } from './people/format'
import shared from './people/people.module.css'
import { useApi } from './people/useApi'
import { AskState, SetupNote } from './Asks'
import dash from './Dashboard.module.css'
import styles from './EmailHome.module.css'

// Email's landing page: what's waiting on us first, then the inbox, the asks in flight and the
// lists, each a short look with the way into its own page. Nothing here is a tab; every page of
// Email starts from this one.

interface Todo {
  key: string
  to: string
  text: string
  detail: string
  aside: string
}

const firstLine = (text: string) => text.split('\n')[0].trim()
const who = (thread: MailThread) => thread.withName || thread.withEmail || 'Someone'
/** A person wrote it (or Claude hasn't read it yet), so it isn't a receipt or a newsletter. */
const fromAPerson = (thread: MailThread) => {
  const category = thread.latest?.direction === 'in' ? thread.latest.reading?.category : undefined
  return category !== 'automated' && category !== 'spam'
}
const VERDICTS = { yes: 'Answers what we asked', partly: 'Partly answers it', no: 'Doesn’t answer it yet' } as const

// Links from elsewhere used to open the composer here with its list picked; they still do.
const COMPOSE_PARAMS = ['audience', 'track', 'status', 'event']

export function Component() {
  const { search } = useLocation()
  const inbox = useApi<{ items: MailThread[]; setup: AskSetup }>('/admin/inbox?status=all')
  const asks = useApi<{ items: Ask[]; setup: AskSetup }>('/admin/asks')
  const campaigns = useApi<{ items: EmailCampaign[] }>('/admin/email/campaigns')

  const params = new URLSearchParams(search)
  if (COMPOSE_PARAMS.some((key) => params.has(key))) return <Navigate to={`/admin/email/compose${search}`} replace />

  const threads = inbox.data?.items ?? []
  const allAsks = asks.data?.items ?? []
  const loaded = Boolean(inbox.data && asks.data)

  // ---- Waiting on you: replies to read, emails to answer, follow-ups and drafts to check -----
  const replied = allAsks.filter((ask) => ask.status === 'waiting' && ask.lastReply)
  const repliedThreads = new Set(replied.map((ask) => ask.lastReply?.threadId))
  const toAnswer = threads.filter(
    (thread) =>
      thread.status === 'open' &&
      thread.latest?.direction === 'in' &&
      !repliedThreads.has(thread.id) &&
      fromAPerson(thread) &&
      (thread.latest.reading?.needsReply ?? true),
  )
  const followUps = allAsks.filter((ask) => ask.status === 'waiting' && !ask.lastReply && ask.body)
  const drafts = allAsks.filter((ask) => ask.status === 'draft')

  const todo: Todo[] = [
    ...replied.map((ask) => {
      const verdict = ask.lastReply?.reading?.answersAsk
      return {
        key: `replied-${ask.id}`,
        to: `/admin/email/asks/${ask.id}`,
        text: `${ask.toName} replied to your ask`,
        detail: [verdict ? VERDICTS[verdict] : '', ask.lastReply?.reading?.summary ?? firstLine(ask.request)].filter(Boolean).join('. '),
        aside: formatRelative(ask.lastReply?.at),
      }
    }),
    ...toAnswer.map((thread) => ({
      key: `thread-${thread.id}`,
      to: `/admin/email/inbox/${thread.id}`,
      text: `${who(thread)}: ${thread.subject}`,
      detail: thread.latest?.reading?.summary || thread.latest?.snippet || '',
      aside: thread.hasDraft ? 'Reply drafted' : formatRelative(thread.lastMessageAt),
    })),
    ...followUps.map((ask) => ({
      key: `follow-${ask.id}`,
      to: `/admin/email/asks/${ask.id}`,
      text: `Follow-up ready for ${ask.toName}`,
      detail: `No reply yet to: ${firstLine(ask.request)}`,
      aside: ask.sentAt ? `Sent ${formatRelative(ask.sentAt)}` : '',
    })),
    ...drafts.map((ask) => ({
      key: `draft-${ask.id}`,
      to: `/admin/email/asks/${ask.id}`,
      text: ask.body ? `Ask to ${ask.toName} is ready to send` : `Ask to ${ask.toName} isn’t written yet`,
      detail: firstLine(ask.request),
      aside: formatRelative(ask.updatedAt),
    })),
  ]

  // ---- The inbox, people first ------------------------------------------------------------
  const live = threads.filter((thread) => thread.status !== 'done')
  const people = live.filter(fromAPerson).slice(0, 5)
  const automatic = live.filter((thread) => !fromAPerson(thread)).length
  const unread = threads.filter((thread) => thread.unread > 0 && thread.status !== 'done').length

  // ---- Asks still open --------------------------------------------------------------------
  const inFlight = allAsks.filter((ask) => ask.status === 'draft' || ask.status === 'waiting')
  const waitingOn = allAsks.filter((ask) => ask.status === 'waiting' && !ask.lastReply).length

  const sends = (campaigns.data?.items ?? []).slice(0, 3)
  const error = inbox.error ?? asks.error

  // One line on where things stand, in place of a lede.
  const summary = loaded
    ? [
        toAnswer.length > 0 && `${plural(toAnswer.length, 'email')} to answer`,
        replied.length > 0 && `${plural(replied.length, 'reply', 'replies')} to your asks`,
        waitingOn > 0 && `${waitingOn === 1 ? '1 ask is' : `${waitingOn} asks are`} waiting on someone else`,
      ].filter(Boolean)
    : []

  return (
    <div className={shared.page}>
      <PageHeader
        title="Email"
        count={unread ? `${unread} unread` : undefined}
        actions={
          <>
            <Link className={ui.button} to="/admin/email/compose">
              <SendIcon /> Write to a list
            </Link>
            <Link className={ui.primary} to="/admin/email/asks/new">
              <PlusIcon /> Ask someone
            </Link>
          </>
        }
      />

      {loaded && (
        <p className={styles.summary}>
          {summary.length > 0 ? `${summary.join(', ').replace(/, ([^,]*)$/, ' and $1')}.` : 'All caught up. New mail and replies to asks show up here.'}
        </p>
      )}
      <SetupNote setup={inbox.data?.setup ?? asks.data?.setup} />
      <p className={shared.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      <section className={dash.attention} aria-labelledby="todo-title">
        <h2 id="todo-title" className={dash.heading}>
          Waiting on you
          {todo.length > 0 && <span className={ui.count}> {todo.length}</span>}
        </h2>
        {!loaded ? (
          <Skeleton rows={2} />
        ) : todo.length === 0 ? (
          <p className={dash.clear}>Nothing right now. Emails that need an answer, replies to asks and drafts to check show up here.</p>
        ) : (
          <ul className={dash.rows}>
            {todo.map((item) => (
              <li key={item.key}>
                <Link className={dash.row} to={item.to}>
                  <span className={dash.pip} aria-hidden="true" />
                  <span className={dash.rowText}>
                    <span className={dash.rowTitle}>{item.text}</span>
                    {item.detail && <span className={dash.rowDetail}>{item.detail}</span>}
                  </span>
                  {item.aside && <span className={`${dash.rowAside} ${dash.rowDetail}`}>{item.aside}</span>}
                  <ChevronRightIcon className={dash.go} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className={styles.pair}>
        <section className={ui.panelFlush} aria-labelledby="inbox-title">
          <div className={ui.flushHead}>
            <h2 id="inbox-title" className={ui.panelTitle}>
              Inbox
            </h2>
            <span className={ui.flushStatus} />
            <Link className={`${ui.ghost} ${ui.small}`} to="/admin/email/inbox">
              All mail
            </Link>
          </div>
          {!inbox.data ? (
            <Skeleton rows={3} flush />
          ) : people.length === 0 && automatic === 0 ? (
            <p className={styles.quiet}>No mail yet. Email to any address at proto.boston lands here.</p>
          ) : (
            <ul className={dash.rows}>
              {people.map((thread) => (
                <li key={thread.id}>
                  <Link className={dash.row} to={`/admin/email/inbox/${thread.id}`} data-unread={thread.unread > 0 || undefined}>
                    <span className={ui.avatar} aria-hidden="true">
                      {who(thread).slice(0, 1).toUpperCase()}
                    </span>
                    <span className={dash.rowText}>
                      <span className={`${dash.rowTitle} ${styles.title}`}>
                        {who(thread)}
                        <span className={styles.subject}>{thread.subject}</span>
                      </span>
                      <span className={dash.rowDetail}>
                        {thread.latest?.direction === 'out' ? `You: ${thread.latest.snippet}` : thread.latest?.reading?.summary || thread.latest?.snippet}
                      </span>
                    </span>
                    <span className={`${dash.rowAside} ${dash.rowDetail}`}>
                      {thread.unread > 0 && <span className={styles.unread}>Unread</span>}
                      {formatRelative(thread.lastMessageAt)}
                    </span>
                  </Link>
                </li>
              ))}
              {automatic > 0 && (
                <li>
                  <Link className={`${dash.row} ${styles.tucked}`} to="/admin/email/inbox">
                    <span className={dash.rowText}>
                      <span className={dash.rowDetail}>
                        And {plural(automatic, 'automatic email')}: receipts, notices and newsletters
                      </span>
                    </span>
                    <ChevronRightIcon className={dash.go} />
                  </Link>
                </li>
              )}
            </ul>
          )}
        </section>

        <section className={ui.panelFlush} aria-labelledby="asks-title">
          <div className={ui.flushHead}>
            <h2 id="asks-title" className={ui.panelTitle}>
              Asks in flight
            </h2>
            <span className={ui.flushStatus} />
            <Link className={`${ui.ghost} ${ui.small}`} to="/admin/email/asks">
              All asks
            </Link>
          </div>
          {!asks.data ? (
            <Skeleton rows={3} flush />
          ) : inFlight.length === 0 ? (
            <div className={ui.empty}>
              <h3>Nothing asked right now</h3>
              <p>Need a room, a form back or a sponsor’s answer? Say it in a sentence and Claude drafts the email.</p>
              <Link className={ui.button} to="/admin/email/asks/new">
                <PlusIcon /> Ask someone
              </Link>
            </div>
          ) : (
            <ul className={dash.rows}>
              {inFlight.slice(0, 5).map((ask) => (
                <li key={ask.id}>
                  <Link className={dash.row} to={`/admin/email/asks/${ask.id}`}>
                    <span className={dash.rowText}>
                      <span className={dash.rowTitle}>
                        {ask.toName}
                        {ask.toOrganization && <span className={styles.subject}>{ask.toOrganization}</span>}
                      </span>
                      <span className={dash.rowDetail}>{firstLine(ask.request)}</span>
                    </span>
                    <span className={dash.rowAside}>
                      <AskState ask={ask} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className={styles.pair}>
        <section className={ui.panelFlush} aria-labelledby="lists-title">
          <div className={ui.flushHead}>
            <h2 id="lists-title" className={ui.panelTitle}>
              Sent to lists
            </h2>
            <span className={ui.flushStatus} />
            <Link className={`${ui.ghost} ${ui.small}`} to="/admin/email/compose">
              Write to a list
            </Link>
          </div>
          {!campaigns.data ? (
            <Skeleton rows={2} flush />
          ) : sends.length === 0 ? (
            <p className={styles.quiet}>Nothing sent to a list yet. Members, a track, an event’s RSVPs or the fund list.</p>
          ) : (
            <ul className={dash.rows}>
              {sends.map((send) => (
                <li key={send.id}>
                  <Link className={dash.row} to="/admin/email/compose">
                    <span className={dash.rowText}>
                      <span className={dash.rowTitle}>{send.subject}</span>
                      <span className={dash.rowDetail}>
                        {describeAudience(send.audience)}, {plural(send.recipientCount, 'person', 'people')}
                        {send.status === 'logged' ? ', logged only' : send.failedCount > 0 ? `, ${send.failedCount} failed` : ''}
                      </span>
                    </span>
                    <span className={`${dash.rowAside} ${dash.rowDetail}`}>{formatRelative(send.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <nav className={ui.panelFlush} aria-labelledby="more-title">
          <div className={ui.flushHead}>
            <h2 id="more-title" className={ui.panelTitle}>
              Also in Email
            </h2>
          </div>
          <ul className={dash.rows}>
            {[
              { to: '/admin/email/contacts', title: 'Contacts', detail: 'Who we ask things of, and your notes on each' },
              { to: '/admin/email/facts', title: 'Proto facts', detail: 'What Claude knows about Proto when it writes' },
              { to: '/admin/email/automatic', title: 'Automatic emails', detail: 'What the site sends on its own' },
            ].map((link) => (
              <li key={link.to}>
                <Link className={dash.row} to={link.to}>
                  <span className={dash.rowText}>
                    <span className={dash.rowTitle}>{link.title}</span>
                    <span className={dash.rowDetail}>{link.detail}</span>
                  </span>
                  <ChevronRightIcon className={dash.go} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}

function Skeleton({ rows, flush = false }: { rows: number; flush?: boolean }) {
  return (
    <div className={flush ? styles.skeletonFlush : shared.panel} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} className={ui.skeleton} style={{ width: index % 2 ? 220 : 320 }} />
      ))}
    </div>
  )
}
