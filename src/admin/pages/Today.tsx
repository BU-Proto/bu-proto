import { useState, type Dispatch, type SetStateAction } from 'react'
import { Link, useRevalidator, useSearchParams } from 'react-router'
import { QUEUE_SOURCES, type FollowUp, type QueueSource, type TimelineItem, type Today } from '../../../shared/crm'
import { api } from '../../lib/api'
import ui from '../admin.module.css'
import { CheckIcon, PlusIcon } from '../components/icons'
import { LogInteraction } from '../components/LogInteraction'
import { PageHeader } from '../components/PageHeader'
import { formatRelative, plural } from '../lib/format'
import { messageFor, useAuthGuard, useSession } from '../lib/session'
import { useToast } from '../lib/toast'
import { useApi } from './people/useApi'
import styles from './Today.module.css'
import { SegmentGroup } from '../components/SegmentGroup'

// Today: the portal's front page. What the team owes people this week, what's waiting in the
// Inbox, what's coming up, and what happened lately. Replaces the old overview.

const DAY = 86_400_000

/** A moment's day as yyyy-mm-dd in the admin's own zone, to compare with due days and event dates. */
function isoDay(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const daysUntil = (day: string, today: string) => Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY)
const asDate = (day: string) => new Date(`${day}T00:00:00Z`)
const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const weekdayFormat = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' })
const weekdayShort = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })
const shortDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const longToday = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

/** "today", "tomorrow", "Thursday" inside a week, then "in 12 days". */
function whenText(day: string, today: string): string {
  const days = daysUntil(day, today)
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days < 7) return weekdayFormat.format(asDate(day))
  return `in ${days} days`
}

/** When a follow-up is due, as the list says it: late in coral, today in amber, later quietly. */
function dueWord(day: string, today: string): { text: string; tone: 'late' | 'today' | 'later' } {
  const days = daysUntil(day, today)
  if (days < 0) return { text: `${plural(-days, 'day')} late`, tone: 'late' }
  if (days === 0) return { text: 'Today', tone: 'today' }
  if (days === 1) return { text: 'Tomorrow', tone: 'later' }
  if (days < 7) return { text: weekdayShort.format(asDate(day)), tone: 'later' }
  return { text: shortDay.format(asDate(day)), tone: 'later' }
}

function greeting(now: Date): string {
  const hour = now.getHours()
  return hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

/** "a", "a and b", "a, b, and c". */
function listOf(parts: string[]): string {
  if (parts.length <= 2) return parts.join(' and ')
  return `${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}`
}

/** Two letters for an owner's avatar, from their email: "andres.lopez@" or "al@" → "AL". */
function initials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]+/).filter(Boolean)
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : (parts[0] ?? '?').slice(0, 2)).toUpperCase()
}

const SOURCE_NAMES: Record<QueueSource, [string, string]> = {
  email: ['email', 'emails'],
  signup: ['sign-up', 'sign-ups'],
  fund: ['fund request', 'fund requests'],
  application: ['role application', 'role applications'],
  founder: ['Founders Circle application', 'Founders Circle applications'],
  board: ['board interest', 'board interest'],
}
const SOURCE_TITLES: Record<QueueSource, string> = {
  email: 'Email',
  signup: 'Sign-ups',
  fund: 'Fund requests',
  application: 'Role applications',
  founder: 'Founders Circle',
  board: 'Board interest',
}

type Scope = 'mine' | 'everyone'

export function Component() {
  const { me } = useSession()
  const { data, error, loading, reload } = useApi<Today>('/admin/today')
  const [params, setParams] = useSearchParams()
  const scope: Scope = params.get('who') === 'everyone' ? 'everyone' : 'mine'
  const [logging, setLogging] = useState(false)
  // Follow-ups ticked off on this visit: they stay listed (struck through) but stop counting.
  const [done, setDone] = useState<Record<number, boolean>>({})
  const { revalidate } = useRevalidator()
  // Taken when the page renders, so "today" and the greeting agree with each other.
  const [clock] = useState(() => new Date())
  const today = isoDay(clock)
  const firstName = me.name?.trim().split(/\s+/)[0]

  const setScope = (next: Scope) =>
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev)
        if (next === 'mine') out.delete('who')
        else out.set('who', next)
        return out
      },
      { replace: true },
    )

  const mine = (followUp: FollowUp) => followUp.ownerEmail.toLowerCase() === me.email.toLowerCase()
  const followUps = data?.followUps ?? []
  const inScope = followUps.filter((followUp) => scope === 'everyone' || mine(followUp))
  const open = inScope.filter((followUp) => !done[followUp.id])
  const due = open.filter((followUp) => followUp.dueOn <= today)
  const overdue = open.filter((followUp) => followUp.dueOn < today)
  const myOverdue = followUps.filter((followUp) => mine(followUp) && !done[followUp.id] && followUp.dueOn < today).length

  const waiting = data?.waiting
  const waitingTotal = waiting ? QUEUE_SOURCES.reduce((sum, source) => sum + waiting[source], 0) : 0
  const busiest = waiting
    ? QUEUE_SOURCES.filter((source) => waiting[source] > 0)
        .sort((a, b) => waiting[b] - waiting[a])
        .slice(0, 2)
        .map((source) => `${waiting[source]} ${SOURCE_NAMES[source][waiting[source] === 1 ? 0 : 1]}`)
    : []

  const upcoming = data?.upcoming ?? []
  const fortnight = upcoming.filter((item) => item.kind === 'event' && daysUntil(item.date, today) <= 14)
  const nextEvent = upcoming.find((item) => item.kind === 'event')

  const said = [
    myOverdue > 0 && `${plural(myOverdue, 'follow-up')} of yours ${myOverdue === 1 ? 'is' : 'are'} overdue`,
    waitingTotal > 0 && `${waitingTotal} ${waitingTotal === 1 ? 'thing is' : 'things are'} waiting in the Inbox`,
    nextEvent && `${nextEvent.title} is ${whenText(nextEvent.date, today)}`,
  ].filter((part): part is string => Boolean(part))
  const sentence = said.length ? listOf(said) : 'Nothing overdue and nothing waiting'

  return (
    <div className={ui.page} data-fit>
      <PageHeader
        title="Today"
        actions={
          <>
            <Link className={ui.button} to="/admin/pipeline?new=1">
              New deal
            </Link>
            <Link className={ui.button} to="/admin/people?new=1">
              New person
            </Link>
            <button type="button" className={ui.primary} onClick={() => setLogging(true)}>
              <PlusIcon /> Log interaction
            </button>
          </>
        }
      />

      <div className={styles.hello}>
        <h2 className={styles.greeting}>
          {greeting(clock)}
          {firstName ? `, ${firstName}` : ''}
        </h2>
        <p className={styles.today}>
          {longToday.format(clock)}.{data ? ` ${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.` : ''}
        </p>
      </div>

      <p className={ui.error} role="alert" hidden={!error}>
        {error?.message}
      </p>

      <section aria-labelledby="figures-title">
        <h2 id="figures-title" className={ui.srOnly}>
          At a glance
        </h2>
        <ul className={styles.figures}>
          <li>
            <Link className={styles.figure} to="/admin/activity/follow-ups">
              <span className={styles.figureLabel}>Follow-ups due</span>
              <span className={styles.figureValue}>{data ? due.length : '–'}</span>
              <span className={styles.figureNote} data-tone={overdue.length > 0 ? 'late' : undefined}>
                {!data
                  ? ' '
                  : overdue.length > 0
                    ? `${overdue.length} overdue`
                    : open.length > due.length
                      ? `${open.length - due.length} more this week`
                      : 'Nothing overdue'}
              </span>
            </Link>
          </li>
          <li>
            <Link className={styles.figure} to="/admin/inbox">
              <span className={styles.figureLabel}>Inbox</span>
              <span className={styles.figureValue}>{data ? waitingTotal : '–'}</span>
              <span className={styles.figureNote}>{!data ? ' ' : busiest.length ? busiest.join(', ') : 'All clear'}</span>
            </Link>
          </li>
          <li>
            <Link className={styles.figure} to="/admin/events">
              <span className={styles.figureLabel}>Events in the next 14 days</span>
              <span className={styles.figureValue}>{data ? fortnight.length : '–'}</span>
              <span className={styles.figureNote}>
                {!data ? ' ' : nextEvent ? `Next is ${nextEvent.title}, ${whenText(nextEvent.date, today)}` : 'Nothing planned yet'}
              </span>
            </Link>
          </li>
          <li>
            <Link className={styles.figure} to="/admin/pipeline">
              <span className={styles.figureLabel}>Open deals</span>
              <span className={styles.figureValue}>{data ? data.openDeals : '–'}</span>
              <span className={styles.figureNote}>{!data ? ' ' : data.openDeals > 0 ? 'Not passed or delivered' : 'None in the pipeline'}</span>
            </Link>
          </li>
        </ul>
      </section>

      {/* A bento that fits the screen: what's owed, what happened, and beside them what's
          waiting and what's coming up. Each box scrolls inside when it holds more. */}
      <div className={`${ui.bento} ${styles.todayBento}`}>
        <div className={`${ui.cell} ${styles.cellFollow}`}>
          <FollowUps
            items={inScope}
            done={done}
            onDone={setDone}
            loading={!data && loading}
            scope={scope}
            counts={{ mine: followUps.filter(mine).length, everyone: followUps.length }}
            today={today}
            onScope={setScope}
            onLog={() => setLogging(true)}
            onChanged={() => void revalidate()}
          />
        </div>

        <div className={`${ui.cell} ${styles.cellWaiting}`}>
          <section className={ui.panelFlush} aria-labelledby="waiting-title">
            <div className={ui.flushHead}>
              <h2 id="waiting-title" className={ui.panelTitle}>
                Waiting in the Inbox
              </h2>
              <span className={ui.flushStatus} />
              <Link className={`${ui.ghost} ${ui.small}`} to="/admin/inbox">
                Open inbox
              </Link>
            </div>
            <ul className={styles.rows}>
              {QUEUE_SOURCES.map((source) => (
                <li key={source}>
                  <Link className={styles.countRow} to={`/admin/inbox?source=${source}`} data-zero={(waiting?.[source] ?? 0) === 0 || undefined}>
                    <span>{SOURCE_TITLES[source]}</span>
                    <span className={styles.countValue}>{waiting ? waiting[source] : '–'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className={`${ui.cell} ${styles.cellComing}`}>
          <section className={ui.panelFlush} aria-labelledby="next-title">
            <div className={ui.flushHead}>
              <h2 id="next-title" className={ui.panelTitle}>
                Coming up
              </h2>
              <span className={ui.flushStatus} />
              <Link className={`${ui.ghost} ${ui.small}`} to="/admin/events">
                All events
              </Link>
            </div>
            {data && upcoming.length === 0 ? (
              <div className={ui.empty}>
                <h3>Nothing on the calendar</h3>
                <p>Published events and hackathon deadlines from today on show here.</p>
              </div>
            ) : (
              <ul className={styles.rows}>
                {upcoming.slice(0, 6).map((item) => {
                  const [first, ...rest] = item.detail.split(' · ')
                  return (
                    <li key={`${item.kind}-${item.id}`}>
                      <Link className={styles.row} to={item.href}>
                        <time className={styles.leaf} dateTime={item.date}>
                          <span className={styles.leafMonth}>{monthFormat.format(asDate(item.date))}</span>
                          <span className={styles.leafDay}>{asDate(item.date).getUTCDate()}</span>
                        </time>
                        <span className={styles.rowText}>
                          <span className={styles.rowTitle}>{item.title}</span>
                          <span className={styles.rowDetail}>
                            {/* A deadline is the one thing here someone might miss. */}
                            {item.kind === 'hackathon' ? <span className={styles.warn}>{first}</span> : first}
                            {rest.length > 0 && ` · ${rest.join(' · ')}`}
                          </span>
                        </span>
                        <span className={styles.rowAside}>{whenText(item.date, today)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <div className={`${ui.cell} ${styles.cellActivity}`}>
          <section className={ui.panelFlush} aria-labelledby="activity-title">
            <div className={ui.flushHead}>
              <h2 id="activity-title" className={ui.panelTitle}>
                Recent activity
              </h2>
              <span className={ui.flushStatus} />
              <Link className={`${ui.ghost} ${ui.small}`} to="/admin/activity">
                All activity
              </Link>
            </div>
            {data && data.activity.length === 0 ? (
              <div className={ui.empty}>
                <h3>Nothing yet</h3>
                <p>Logged calls and coffees, deals, sign-ups, wins and intros show up here as they happen.</p>
              </div>
            ) : (
              <ul className={styles.rows}>
                {(data?.activity ?? []).map((item, index) => (
                  <li key={`${item.kind}-${item.at}-${index}`}>
                    <ActivityRow item={item} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <LogInteraction
        open={logging}
        onClose={() => setLogging(false)}
        onLogged={() => {
          setLogging(false)
          reload()
          void revalidate()
        }}
      />
    </div>
  )
}

function ActivityRow({ item }: { item: TimelineItem }) {
  const when = /^\d{4}-\d{2}-\d{2}$/.test(item.at) ? shortDay.format(asDate(item.at)) : formatRelative(item.at)
  const body = (
    <>
      <span className={styles.kind} data-kind={item.label === 'Win' ? 'win' : item.kind}>
        {item.label}
      </span>
      <span className={styles.rowText}>
        <span className={styles.rowTitle}>{item.title}</span>
        {item.detail && <span className={styles.rowDetail}>{item.detail}</span>}
      </span>
      <span className={styles.rowAside}>{when}</span>
    </>
  )
  return item.href ? (
    <Link className={styles.row} to={item.href}>
      {body}
    </Link>
  ) : (
    <div className={styles.row}>{body}</div>
  )
}

interface FollowUpsProps {
  items: FollowUp[]
  done: Record<number, boolean>
  onDone: Dispatch<SetStateAction<Record<number, boolean>>>
  loading: boolean
  scope: Scope
  counts: Record<Scope, number>
  today: string
  onScope: (scope: Scope) => void
  onLog: () => void
  onChanged: () => void
}

/**
 * The week's follow-ups with a box to tick each off. A ticked one stays, struck through, until
 * the page reloads, so a slip of the finger is one click to undo.
 */
function FollowUps({ items, done, onDone: setDone, loading, scope, counts, today, onScope, onLog, onChanged }: FollowUpsProps) {
  const toast = useToast()
  const guard = useAuthGuard()
  const [busy, setBusy] = useState<Record<number, boolean>>({})

  const mark = async (item: FollowUp, value: boolean) => {
    if (busy[item.id]) return
    setBusy((prev) => ({ ...prev, [item.id]: true }))
    setDone((prev) => ({ ...prev, [item.id]: value }))
    try {
      await api(`/admin/follow-ups/${item.id}`, { method: 'PATCH', body: { done: value } })
      if (value) toast({ text: 'Ticked off', detail: item.title, action: { label: 'Undo', onAction: () => void mark(item, false) } })
      onChanged()
    } catch (failure) {
      setDone((prev) => ({ ...prev, [item.id]: !value }))
      if (!guard(failure)) toast({ text: value ? 'Couldn’t tick that off' : 'Couldn’t undo that', detail: messageFor(failure), tone: 'error' })
    } finally {
      setBusy((prev) => ({ ...prev, [item.id]: false }))
    }
  }

  return (
    <section className={ui.panelFlush} aria-labelledby="follow-ups-title">
      <div className={ui.flushHead}>
        <h2 id="follow-ups-title" className={ui.panelTitle}>
          Follow-ups
        </h2>
        <SegmentGroup className={styles.scope} label="Whose follow-ups">
          {(['mine', 'everyone'] as const).map((value) => (
            <button key={value} type="button" className={ui.tab} aria-pressed={scope === value} onClick={() => onScope(value)}>
              {value === 'mine' ? 'Mine' : 'Everyone'} <span className={ui.count}>{counts[value]}</span>
            </button>
          ))}
        </SegmentGroup>
        <span className={ui.flushStatus} />
        <Link className={`${ui.ghost} ${ui.small}`} to="/admin/activity/follow-ups">
          All follow-ups
        </Link>
      </div>
      {loading ? (
        <div className={styles.skeletons} aria-hidden="true">
          <span className={ui.skeleton} style={{ width: '60%' }} />
          <span className={ui.skeleton} style={{ width: '40%' }} />
          <span className={ui.skeleton} style={{ width: '52%' }} />
        </div>
      ) : items.length === 0 ? (
        <div className={ui.empty}>
          <h3>{scope === 'mine' ? 'Nothing due for you this week' : 'Nothing due this week'}</h3>
          <p>Follow-ups due in the next seven days show here. Log an interaction to set the next step.</p>
          <button type="button" className={ui.button} onClick={onLog}>
            <PlusIcon /> Log interaction
          </button>
        </div>
      ) : (
        <ul className={styles.rows}>
          {items.map((item) => {
            const ticked = done[item.id] ?? false
            const when = dueWord(item.dueOn, today)
            return (
              <li key={item.id} className={styles.task} data-done={ticked || undefined}>
                <button
                  type="button"
                  className={styles.check}
                  role="checkbox"
                  aria-checked={ticked}
                  aria-label={`Done: ${item.title}`}
                  disabled={busy[item.id]}
                  onClick={() => void mark(item, !ticked)}
                >
                  {ticked && <CheckIcon />}
                </button>
                <span className={styles.rowText}>
                  <span className={styles.rowTitle}>{item.title}</span>
                  <About item={item} />
                </span>
                <span className={styles.due} data-tone={ticked ? 'done' : when.tone}>
                  {ticked ? 'Done' : when.text}
                </span>
                {scope === 'everyone' && (
                  <span className={ui.avatar} title={item.ownerEmail}>
                    {initials(item.ownerEmail)}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/** Who and what a follow-up is about, each a link to its page: "Nina Patel · Lumen Labs · Spring sponsor". */
function About({ item }: { item: FollowUp }) {
  const parts = [
    item.person && (
      <Link key="person" to={`/admin/people/${item.person.key}`}>
        {item.person.name}
      </Link>
    ),
    item.orgId !== null && item.orgName ? (
      <Link key="org" to={`/admin/orgs/${item.orgId}`}>
        {item.orgName}
      </Link>
    ) : (
      item.person?.orgName && <span key="org">{item.person.orgName}</span>
    ),
    item.dealId !== null && item.dealTitle && (
      <Link key="deal" to={`/admin/pipeline/${item.dealId}`}>
        {item.dealTitle}
      </Link>
    ),
  ].filter(Boolean)
  if (parts.length === 0) return null
  return (
    <span className={`${styles.rowDetail} ${styles.about}`}>
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 && ' · '}
          {part}
        </span>
      ))}
    </span>
  )
}
