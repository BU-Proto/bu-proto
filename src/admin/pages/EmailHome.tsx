import type { ReactNode } from 'react'
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
import styles from './EmailHome.module.css'

// Email's landing page: one line on where things stand, then four boxes of the same size (what's
// waiting on us, the inbox, the asks in flight, the list sends), each a short look with the way
// into its own page. Nothing here is a tab; every page of Email starts from this one.

/** How many rows a box holds. Every box is this tall, full or empty (see --slots in the CSS). */
const SLOTS = 5

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
/** "a", "a and b", "a, b and c". */
const listOf = (parts: string[]) => (parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`)

// Links from elsewhere used to open the composer here with its list picked; they still do.
const COMPOSE_PARAMS = ['audience', 'track', 'status', 'event']

const MORE = [
  { to: '/admin/email/contacts', title: 'Contacts', detail: 'Who we ask things of, and your notes on each' },
  { to: '/admin/email/facts', title: 'Proto facts', detail: 'What Claude knows about Proto when it writes' },
  { to: '/admin/email/automatic', title: 'Automatic emails', detail: 'What the site sends on its own' },
]

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

  // ---- The inbox, people first; receipts and newsletters fold into the last slot -----------
  const live = threads.filter((thread) => thread.status !== 'done')
  const automatic = live.filter((thread) => !fromAPerson(thread)).length
  const people = live.filter(fromAPerson).slice(0, automatic > 0 ? SLOTS - 1 : SLOTS)
  const unread = threads.filter((thread) => thread.unread > 0 && thread.status !== 'done').length

  // ---- Asks still open, and the last list sends --------------------------------------------
  const inFlight = allAsks.filter((ask) => ask.status === 'draft' || ask.status === 'waiting')
  const waitingOn = allAsks.filter((ask) => ask.status === 'waiting' && !ask.lastReply).length
  const sends = campaigns.data?.items ?? []
  const error = inbox.error ?? asks.error

  // Where things stand, as the page's one large line.
  const unwritten = drafts.filter((ask) => !ask.body).length
  const toCheck = followUps.length + drafts.length - unwritten
  const standing = [
    toAnswer.length > 0 && `${plural(toAnswer.length, 'email')} to answer`,
    replied.length > 0 && `${plural(replied.length, 'reply', 'replies')} to your asks`,
    toCheck > 0 && `${plural(toCheck, 'draft')} to check`,
    unwritten > 0 && `${plural(unwritten, 'ask')} to write`,
    waitingOn > 0 && `${waitingOn === 1 ? '1 ask is' : `${waitingOn} asks are`} waiting on someone else`,
  ].filter((part) => part !== false)

  return (
    <div className={`${shared.page} ${styles.home}`} data-fit>
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

      <div className={styles.top}>
        <h2 className={styles.standing}>{!loaded ? ' ' : standing.length > 0 ? `${listOf(standing)}.` : 'All caught up.'}</h2>
        <SetupNote setup={inbox.data?.setup ?? asks.data?.setup} />
        <p className={shared.error} role="alert" hidden={!error}>
          {error?.message}
        </p>
      </div>

      <div className={styles.boxes}>
        <Box id="todo" title="Waiting on you" count={todo.length} ready={loaded} scrolls>
          {todo.length === 0 ? (
            <Empty title="Nothing waiting on you">Emails that need an answer, replies to asks and drafts to check show up here.</Empty>
          ) : (
            todo.map((item) => (
              <li key={item.key}>
                <Link className={styles.row} to={item.to}>
                  <span className={styles.lead}>
                    <span className={styles.dot} />
                  </span>
                  <span className={styles.text}>
                    <span className={styles.title}>{item.text}</span>
                    {item.detail && <span className={styles.detail}>{item.detail}</span>}
                  </span>
                  {item.aside && <span className={styles.aside}>{item.aside}</span>}
                </Link>
              </li>
            ))
          )}
        </Box>

        <Box id="inbox" title="Inbox" count={live.length} ready={Boolean(inbox.data)} more={{ to: '/admin/email/inbox', label: 'All mail' }}>
          {people.length === 0 && automatic === 0 ? (
            <Empty title="No mail yet">Email to any address at proto.boston lands here.</Empty>
          ) : (
            <>
              {people.map((thread) => (
                <li key={thread.id}>
                  <Link className={styles.row} to={`/admin/email/inbox/${thread.id}`} data-unread={thread.unread > 0 || undefined}>
                    <span className={styles.lead}>{thread.unread > 0 && <span className={styles.dot} aria-label="Unread" />}</span>
                    <span className={styles.text}>
                      <span className={styles.title}>
                        {who(thread)}
                        <span className={styles.second}>{thread.subject}</span>
                      </span>
                      <span className={styles.detail}>
                        {thread.latest?.direction === 'out' ? `You: ${thread.latest.snippet}` : thread.latest?.reading?.summary || thread.latest?.snippet}
                      </span>
                    </span>
                    <span className={styles.aside}>{formatRelative(thread.lastMessageAt)}</span>
                  </Link>
                </li>
              ))}
              {automatic > 0 && (
                <li>
                  <Link className={styles.row} to="/admin/email/inbox">
                    <span className={styles.lead} />
                    <span className={styles.text}>
                      <span className={styles.detail}>And {plural(automatic, 'automatic email')}: receipts, notices and newsletters</span>
                    </span>
                  </Link>
                </li>
              )}
            </>
          )}
        </Box>

        <Box id="asks" title="Asks in flight" count={inFlight.length} ready={Boolean(asks.data)} more={{ to: '/admin/email/asks', label: 'All asks' }}>
          {inFlight.length === 0 ? (
            <Empty title="Nothing asked right now" action={{ to: '/admin/email/asks/new', label: 'Ask someone' }}>
              Need a room, a form back or a sponsor’s answer? Say it in a sentence and Claude drafts the email.
            </Empty>
          ) : (
            inFlight.slice(0, SLOTS).map((ask) => (
              <li key={ask.id}>
                <Link className={styles.row} to={`/admin/email/asks/${ask.id}`}>
                  <span className={styles.text}>
                    <span className={styles.title}>
                      {ask.toName}
                      {ask.toOrganization && <span className={styles.second}>{ask.toOrganization}</span>}
                    </span>
                    <span className={styles.detail}>{firstLine(ask.request)}</span>
                  </span>
                  <span className={styles.aside}>
                    <AskState ask={ask} />
                  </span>
                </Link>
              </li>
            ))
          )}
        </Box>

        <Box id="lists" title="Sent to lists" count={sends.length} ready={Boolean(campaigns.data)} more={{ to: '/admin/email/compose', label: 'All sends' }}>
          {sends.length === 0 ? (
            <Empty title="Nothing sent to a list yet" action={{ to: '/admin/email/compose', label: 'Write to a list' }}>
              One email to all members, a track, an event’s RSVPs or the fund list.
            </Empty>
          ) : (
            sends.slice(0, SLOTS).map((send) => (
              <li key={send.id}>
                <Link className={styles.row} to="/admin/email/compose">
                  <span className={styles.text}>
                    <span className={styles.title}>{send.subject}</span>
                    <span className={styles.detail}>
                      {describeAudience(send.audience)}, {plural(send.recipientCount, 'person', 'people')}
                      {send.status === 'logged' ? ', logged only' : send.failedCount > 0 ? `, ${send.failedCount} failed` : ''}
                    </span>
                  </span>
                  <span className={styles.aside}>{formatRelative(send.createdAt)}</span>
                </Link>
              </li>
            ))
          )}
        </Box>
      </div>

      {/* The rest of Email: plain links on the ground, not a fifth box. */}
      <nav aria-label="More in Email">
        <ul className={styles.more}>
          {MORE.map((link) => (
            <li key={link.to}>
              <Link className={styles.moreLink} to={link.to}>
                <span className={styles.text}>
                  <span className={styles.title}>{link.title}</span>
                  <span className={styles.detail}>{link.detail}</span>
                </span>
                <ChevronRightIcon className={styles.go} />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

interface BoxProps {
  id: string
  title: string
  count: number
  /** Its data has arrived; until then the box holds stand-in lines at the same size. */
  ready: boolean
  /** The way into the full page, at the head's far end. */
  more?: { to: string; label: string }
  /** Holds everything and scrolls inside itself past its slots, rather than cutting the list off. */
  scrolls?: boolean
  children: ReactNode
}

/** One of the four boxes: a head, then a body that is the same height whatever it holds. */
function Box({ id, title, count, ready, more, scrolls, children }: BoxProps) {
  return (
    <section className={styles.box} aria-labelledby={`${id}-title`}>
      <div className={styles.head}>
        <h2 id={`${id}-title`} className={styles.boxTitle}>
          {title}
          {ready && count > 0 && <span className={styles.boxCount}>{count}</span>}
        </h2>
        {more && (
          <Link className={`${ui.ghost} ${ui.small}`} to={more.to}>
            {more.label}
          </Link>
        )}
      </div>
      {ready ? (
        <ul className={styles.body} data-scrolls={scrolls || undefined}>
          {children}
        </ul>
      ) : (
        <div className={styles.body} aria-hidden="true">
          {[280, 200, 240].map((width) => (
            <span key={width} className={styles.waiting}>
              <span className={ui.skeleton} style={{ width }} />
            </span>
          ))}
        </div>
      )}
    </section>
  )
}

/** A box with nothing in it: the same body, with what would show here and the way to start. */
function Empty({ title, action, children }: { title: string; action?: { to: string; label: string }; children: ReactNode }) {
  return (
    <li className={styles.empty}>
      <h3>{title}</h3>
      <p>{children}</p>
      {action && (
        <Link className={`${ui.button} ${ui.small}`} to={action.to}>
          {action.label}
        </Link>
      )}
    </li>
  )
}
