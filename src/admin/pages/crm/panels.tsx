import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { INTRO_STATUS_LABELS, type FollowUp, type Intro, type IntroStatus, type TimelineItem } from '../../../../shared/crm'
import { api } from '../../../lib/api'
import ui from '../../admin.module.css'
import { useToast } from '../../lib/toast'
import { toApiError } from '../people/useApi'
import styles from './crm.module.css'
import { dueText, formatAt, isoOf, teammate } from './format'

// The panels a person's page and an org's page share: the timeline, follow-ups and intros.

/** The timeline's filters, each a set of TimelineItem kinds. */
const TIMELINE_GROUPS: { id: string; label: string; kinds: TimelineItem['kind'][] }[] = [
  { id: 'all', label: 'All', kinds: [] },
  { id: 'touch', label: 'Interactions', kinds: ['interaction'] },
  { id: 'event', label: 'Events', kinds: ['rsvp', 'guest', 'joined'] },
  { id: 'email', label: 'Email', kinds: ['email', 'ask'] },
  { id: 'fund', label: 'Fund and roles', kinds: ['fund', 'application', 'board_interest'] },
  { id: 'deal', label: 'Deals', kinds: ['deal'] },
  { id: 'intro', label: 'Intros', kinds: ['intro'] },
]

export function TimelinePanel({ items, action }: { items: TimelineItem[]; action?: ReactNode }) {
  const [group, setGroup] = useState('all')
  // Only the filters that would show something, so a contact's page doesn't offer "Fund and roles".
  const groups = TIMELINE_GROUPS.filter((entry) => entry.id === 'all' || items.some((item) => entry.kinds.includes(item.kind)))
  const current = groups.find((entry) => entry.id === group) ?? groups[0]
  const shown = current.id === 'all' ? items : items.filter((item) => current.kinds.includes(item.kind))

  return (
    <section className={ui.panelFlush} aria-labelledby="timeline-title">
      <div className={ui.flushHead}>
        <h2 id="timeline-title" className={ui.panelTitle}>
          Timeline
        </h2>
        {groups.length > 2 && (
          <div className={`${ui.tabs} ${styles.filter}`} role="group" aria-label="Show">
            {groups.map((entry) => (
              <button key={entry.id} type="button" className={ui.tab} aria-pressed={entry.id === current.id} onClick={() => setGroup(entry.id)}>
                {entry.label}
              </button>
            ))}
          </div>
        )}
        {action}
      </div>
      {shown.length === 0 ? (
        <p className={styles.none}>Nothing of this kind yet.</p>
      ) : (
        <ol className={styles.timeline}>
          {shown.map((item, index) => (
            <li key={`${item.kind}-${item.at}-${index}`}>
              <span className={styles.what} data-kind={item.kind}>
                {item.label}
              </span>
              <div className={styles.body}>
                {item.href ? (
                  <Link to={item.href} className={styles.t1}>
                    {item.title}
                  </Link>
                ) : (
                  <span className={styles.t1}>{item.title}</span>
                )}
                {item.detail && <p className={styles.detail}>{item.detail}</p>}
              </div>
              <span className={styles.when}>
                <time dateTime={isoOf(item.at)}>{formatAt(item.at)}</time>
                {item.by && (
                  <span className={styles.by} title={item.by}>
                    {teammate(item.by)}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/** "2 days late" in red, "Today" in amber, a later day plain. */
export function Due({ dueOn }: { dueOn: string }) {
  const { text, tone } = dueText(dueOn)
  return (
    <time className={styles[tone]} dateTime={dueOn}>
      {text}
    </time>
  )
}

/**
 * The next step and every other open follow-up. Ticking one off is the Activity area's endpoint;
 * the list refreshes after. `action` (Set follow-up) shows when there's nothing set; otherwise
 * the page header's button does it.
 */
export function FollowUpsPanel({ items, onChanged, action }: { items: FollowUp[]; onChanged: () => void; action: ReactNode }) {
  const toast = useToast()
  const [busy, setBusy] = useState<number | null>(null)
  const open = items.filter((item) => !item.doneAt)
  const [next, ...rest] = open

  const done = async (item: FollowUp) => {
    setBusy(item.id)
    try {
      await api(`/admin/follow-ups/${item.id}`, { method: 'PATCH', body: { done: true } })
      toast({ text: 'Done', detail: item.title })
      onChanged()
    } catch (failure) {
      toast({ text: 'Couldn’t tick that off', detail: toApiError(failure).message, tone: 'error' })
    } finally {
      setBusy(null)
    }
  }

  const doneButton = (item: FollowUp) => (
    <button type="button" className={`${ui.ghost} ${ui.small}`} onClick={() => done(item)} disabled={busy === item.id}>
      Done
    </button>
  )

  return (
    <section className={ui.panelFlush} aria-label="Next step">
      {next ? (
        <div className={styles.next}>
          <span className={styles.nextLabel}>Next step</span>
          <span className={styles.nextTitle}>{next.title}</span>
          <span className={styles.nextMeta}>
            <span>
              <Due dueOn={next.dueOn} /> <span className={ui.dim}>· {teammate(next.ownerEmail)}</span>
            </span>
            {doneButton(next)}
          </span>
        </div>
      ) : (
        <div className={styles.next}>
          <span className={styles.nextLabel}>Next step</span>
          <span className={styles.nextMeta}>
            <span className={ui.dim}>None set.</span>
            {action}
          </span>
        </div>
      )}
      {rest.length > 0 && (
        <ul className={styles.list}>
          {rest.map((item) => (
            <li key={item.id}>
              <div className={styles.grow}>
                <span className={styles.t1}>{item.title}</span>
                <span className={styles.t2}>
                  <Due dueOn={item.dueOn} /> · {teammate(item.ownerEmail)}
                </span>
              </div>
              {doneButton(item)}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const INTRO_TONE: Record<IntroStatus, string | undefined> = {
  drafting: 'draft',
  sent: 'sample',
  met: 'live',
  hired_or_funded: 'filled',
  passed: undefined,
}

/** Intros from this person's (or org's) side: who's on the other end, why, and where it stands. */
export function IntrosPanel({ items, selfKey, action }: { items: Intro[]; selfKey?: string; action?: ReactNode }) {
  return (
    <section className={ui.panelFlush} aria-labelledby="intros-title">
      <div className={ui.flushHead}>
        <h2 id="intros-title" className={`${ui.panelTitle} ${ui.flushStatus}`}>
          Intros
        </h2>
        {action}
      </div>
      {items.length === 0 ? (
        <p className={styles.none}>No intros yet.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((intro) => {
            // On a person's page, the other side; on an org's, both.
            const other = selfKey ? (intro.student.key === selfKey ? intro.contact : intro.student) : null
            return (
              <li key={intro.id}>
                <div className={styles.grow}>
                  {other ? (
                    <Link to={`/admin/people/${other.key}`} className={styles.t1}>
                      {other.name}
                    </Link>
                  ) : (
                    <span className={styles.t1}>
                      <Link to={`/admin/people/${intro.student.key}`}>{intro.student.name}</Link> to{' '}
                      <Link to={`/admin/people/${intro.contact.key}`}>{intro.contact.name}</Link>
                    </span>
                  )}
                  <span className={styles.t2}>{[other?.orgName, intro.outcome || intro.reason].filter(Boolean).join(' · ')}</span>
                </div>
                <span className={ui.state} data-tone={INTRO_TONE[intro.status]}>
                  {INTRO_STATUS_LABELS[intro.status]}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
