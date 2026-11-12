import { useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import admin from '../admin.module.css'
import { ChevronRightIcon, MailIcon, PlusIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import type { ContentRow } from '../lib/content'
import { formatRelative, parseTimestamp, plural } from '../lib/format'
import { useSession } from '../lib/session'
import type { dashboardLoader } from '../loaders'
import styles from './Dashboard.module.css'

const DAY = 86_400_000

/** A moment's day as yyyy-mm-dd in the admin's own zone, to compare with content dates. */
function isoDay(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const isDay = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
const daysUntil = (day: string, today: string) => Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY)

const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const weekdayFormat = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' })
const shortDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const longToday = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const asDate = (day: string) => new Date(`${day}T00:00:00Z`)

/** "today", "tomorrow", "Thursday" inside a week, then "in 12 days". */
function whenText(day: string, today: string): string {
  const days = daysUntil(day, today)
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days < 7) return weekdayFormat.format(asDate(day))
  return `in ${days} days`
}

function greeting(now: Date): string {
  const hour = now.getHours()
  return hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

interface Upcoming {
  key: string
  to: string
  day: string
  title: string
  detail: string
  aside: string
  draft: boolean
}

interface Attention {
  key: string
  to: string
  text: string
  detail: string
}

export function Component() {
  const { stats, events, hackathons, members, fund, now } = useLoaderData<typeof dashboardLoader>()
  const { me } = useSession()
  const clock = new Date(now)
  const today = isoDay(clock)
  const firstName = me.name?.trim().split(/\s+/)[0]

  const text = (row: ContentRow, key: string) => (typeof row[key] === 'string' ? (row[key] as string) : '')

  // What's on the calendar from today on: events and hackathon trips, in one line of dates.
  const upcoming: Upcoming[] = [
    ...events
      .filter((row) => isDay(row.date) && row.date >= today)
      .map((row) => ({
        key: `events/${row.id}`,
        to: `/admin/events/${row.id}`,
        day: row.date as string,
        title: text(row, 'title'),
        detail: [text(row, 'kind'), text(row, 'time')].filter(Boolean).join(', '),
        aside: text(row, 'registerUrl') ? 'Sign-up on its own page' : plural(row.rsvpCount ?? 0, 'RSVP'),
        draft: !row.published,
      })),
    ...hackathons
      .filter((row) => isDay(row.starts) && row.starts >= today)
      .map((row) => ({
        key: `hackathons/${row.id}`,
        to: `/admin/hackathons/${row.id}`,
        day: row.starts as string,
        title: text(row, 'name'),
        detail: ['Hackathon', text(row, 'location')].filter(Boolean).join(', '),
        aside: isDay(row.applyBy) && row.applyBy >= today ? `Apply by ${shortDay.format(asDate(row.applyBy))}` : '',
        draft: !row.published,
      })),
  ].sort((a, b) => a.day.localeCompare(b.day))
  const next = upcoming.slice(0, 6)

  // Things that are waiting on an admin. Each is a link to where it gets dealt with.
  const fundNew = fund.filter((entry) => entry.status === 'new')
  const eventDrafts = events.filter((row) => !row.published)
  const hackathonDrafts = hackathons.filter((row) => !row.published)
  const closing = hackathons.filter((row) => row.published && isDay(row.applyBy) && row.applyBy >= today && daysUntil(row.applyBy, today) <= 7)
  const soonest = events.find((row) => row.published && isDay(row.date) && row.date >= today)
  const attention: Attention[] = [
    fundNew.length > 0 && {
      key: 'fund',
      to: '/admin/fund?status=new',
      text: `${plural(fundNew.length, 'fund sign-up')} to review`,
      detail: fundNew.map((entry) => entry.name.split(/\s+/)[0]).slice(0, 3).join(', ') + (fundNew.length > 3 ? ` and ${fundNew.length - 3} more` : ''),
    },
    eventDrafts.length > 0 && {
      key: 'event-drafts',
      to: '/admin/events?show=drafts',
      text: `${plural(eventDrafts.length, 'event draft')} not on the site yet`,
      detail: eventDrafts.map((row) => text(row, 'title')).slice(0, 2).join(', '),
    },
    hackathonDrafts.length > 0 && {
      key: 'hackathon-drafts',
      to: '/admin/hackathons?show=drafts',
      text: `${plural(hackathonDrafts.length, 'hackathon draft')} not on the site yet`,
      detail: hackathonDrafts.map((row) => text(row, 'name')).slice(0, 2).join(', '),
    },
    // A week with many deadlines is one line, not a wall of them.
    closing.length === 1 && {
      key: 'closing',
      to: `/admin/hackathons/${closing[0].id}`,
      text: `Applications for ${text(closing[0], 'name')} close ${whenText(closing[0].applyBy as string, today)}`,
      detail: 'Worth a reminder to members',
    },
    closing.length > 1 && {
      key: 'closing',
      to: '/admin/hackathons',
      text: `${closing.length} hackathon applications close this week`,
      detail:
        closing
          .slice(0, 3)
          .map((row) => text(row, 'name'))
          .join(', ') + (closing.length > 3 ? ` and ${closing.length - 3} more` : ''),
    },
    soonest &&
      !text(soonest, 'registerUrl') &&
      (soonest.rsvpCount ?? 0) === 0 &&
      daysUntil(soonest.date as string, today) <= 7 && {
        key: 'quiet-event',
        to: `/admin/events/${soonest.id}`,
        text: `${text(soonest, 'title')} is ${whenText(soonest.date as string, today)} with no RSVPs`,
        detail: 'An email to members might help',
      },
  ].filter((item): item is Attention => Boolean(item))

  const newest = [...members].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  return (
    <div className={admin.page}>
      <PageHeader
        title="Overview"
        actions={
          <>
            <Link className={admin.button} to="/admin/email">
              <MailIcon /> Write an email
            </Link>
            <Link className={admin.primary} to="/admin/events/new">
              <PlusIcon /> New event
            </Link>
          </>
        }
      />

      <div className={styles.hello}>
        <h2 className={styles.greeting}>
          {greeting(clock)}
          {firstName ? `, ${firstName}` : ''}
        </h2>
        <p className={styles.today}>
          {longToday.format(clock)}.{' '}
          {next[0]
            ? `Next up is ${next[0].title}, ${whenText(next[0].day, today)}.`
            : 'Nothing on the calendar yet.'}
        </p>
      </div>

      <section className={styles.attention} aria-labelledby="attention-title">
        <h2 id="attention-title" className={styles.heading}>
          Waiting on you
          {attention.length > 0 && <span className={admin.count}> {attention.length}</span>}
        </h2>
        {attention.length === 0 ? (
          <p className={styles.clear}>Nothing right now. New fund sign-ups, drafts and closing deadlines show up here.</p>
        ) : (
          <ul className={styles.rows}>
            {attention.map((item) => (
              <li key={item.key}>
                <Link className={styles.row} to={item.to}>
                  <span className={styles.pip} aria-hidden="true" />
                  <span className={styles.rowText}>
                    <span className={styles.rowTitle}>{item.text}</span>
                    {item.detail && <span className={styles.rowDetail}>{item.detail}</span>}
                  </span>
                  <ChevronRightIcon className={styles.go} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="figures-title">
        <h2 id="figures-title" className={admin.srOnly}>
          At a glance
        </h2>
        <ul className={styles.figures}>
          <li>
            <Joins total={stats.members} stamps={members.map((member) => member.createdAt)} now={now} />
          </li>
          <li>
            <Link className={styles.figure} to="/admin/events">
              <span className={styles.figureLabel}>Upcoming events</span>
              <span className={styles.figureValue}>{stats.upcomingEvents.toLocaleString()}</span>
              <span className={styles.figureNote}>{plural(stats.upcomingRsvps, 'RSVP')} so far</span>
            </Link>
          </li>
          <li>
            <Link className={styles.figure} to="/admin/fund">
              <span className={styles.figureLabel}>Fund interest</span>
              <span className={styles.figureValue}>{stats.fundTotal.toLocaleString()}</span>
              <span className={styles.figureNote}>{stats.fundNew > 0 ? `${stats.fundNew} new to review` : 'All reviewed'}</span>
            </Link>
          </li>
          <li>
            <Link className={styles.figure} to="/admin/wins">
              <span className={styles.figureLabel}>Wins</span>
              <span className={styles.figureValue}>{stats.wins.toLocaleString()}</span>
              <span className={styles.figureNote}>
                {stats.wins > 0 ? 'Counted on the site' : `None real yet, ${plural(stats.sampleWins, 'sample')} showing`}
              </span>
            </Link>
          </li>
        </ul>
      </section>

      <div className={styles.split}>
        <section className={admin.panelFlush} aria-labelledby="next-title">
          <div className={admin.flushHead}>
            <h2 id="next-title" className={admin.panelTitle}>
              Coming up
            </h2>
            <span className={admin.flushStatus} />
            <Link className={`${admin.ghost} ${admin.small}`} to="/admin/events">
              All events
            </Link>
          </div>
          {next.length === 0 ? (
            <div className={admin.empty}>
              <h3>Nothing on the calendar</h3>
              <p>Events and hackathon trips dated today or later show here.</p>
              <Link className={admin.button} to="/admin/events/new">
                <PlusIcon /> New event
              </Link>
            </div>
          ) : (
            <ul className={styles.rows}>
              {next.map((item) => (
                <li key={item.key}>
                  <Link className={styles.row} to={item.to}>
                    <time className={styles.leaf} dateTime={item.day}>
                      <span className={styles.leafMonth}>{monthFormat.format(asDate(item.day))}</span>
                      <span className={styles.leafDay}>{asDate(item.day).getUTCDate()}</span>
                    </time>
                    <span className={styles.rowText}>
                      <span className={styles.rowTitle}>
                        {item.title}
                        {item.draft && <span className={styles.draft}>Draft</span>}
                      </span>
                      <span className={styles.rowDetail}>{item.detail}</span>
                    </span>
                    <span className={styles.rowAside}>
                      <span>{whenText(item.day, today)}</span>
                      {item.aside && <span className={styles.rowDetail}>{item.aside}</span>}
                    </span>
                    <ChevronRightIcon className={styles.go} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={admin.panelFlush} aria-labelledby="new-title">
          <div className={admin.flushHead}>
            <h2 id="new-title" className={admin.panelTitle}>
              Newest members
            </h2>
            <span className={admin.flushStatus} />
            <Link className={`${admin.ghost} ${admin.small}`} to="/admin/members">
              All members
            </Link>
          </div>
          {newest.length === 0 ? (
            <div className={admin.empty}>
              <h3>No members yet</h3>
              <p>People who join from the site show up here.</p>
            </div>
          ) : (
            <ul className={styles.rows}>
              {newest.map((member) => (
                <li key={member.id}>
                  <Link className={styles.row} to={`/admin/members/${member.id}`}>
                    <span className={admin.avatar} aria-hidden="true">
                      {member.name.trim().slice(0, 1).toUpperCase()}
                    </span>
                    <span className={styles.rowText}>
                      <span className={styles.rowTitle}>{member.name}</span>
                      <span className={styles.rowDetail}>
                        {member.track}, {member.year.toLowerCase()}
                      </span>
                    </span>
                    <span className={styles.rowAside}>
                      <span className={styles.rowDetail}>{formatRelative(member.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

const WEEKS = 8
const weekStart = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

/**
 * Members, with who joined in each of the last eight weeks as a row of bars. Pointing at (or
 * tabbing to) a bar swaps the note under the figure for that week's count, so the chart can be
 * read exactly without a legend or axis.
 */
function Joins({ total, stamps, now }: { total: number; stamps: string[]; now: number }) {
  const [hovered, setHovered] = useState<number | null>(null)
  // Bucket 0 is the oldest week, the last is the seven days up to now.
  const weeks = Array.from({ length: WEEKS }, (_, index) => {
    const end = now - (WEEKS - 1 - index) * 7 * DAY
    return { start: end - 7 * DAY, end, count: 0 }
  })
  for (const stamp of stamps) {
    const at = parseTimestamp(stamp).getTime()
    const week = weeks.find((bucket) => at > bucket.start && at <= bucket.end)
    if (week) week.count++
  }
  const peak = Math.max(1, ...weeks.map((week) => week.count))
  const latest = weeks[WEEKS - 1].count
  const shown = hovered === null ? null : weeks[hovered]

  return (
    <div className={styles.figure}>
      <Link className={styles.figureLink} to="/admin/members">
        <span className={styles.figureLabel}>Members</span>
        <span className={styles.figureValue}>{total.toLocaleString()}</span>
      </Link>
      <span className={styles.figureNote} aria-live="off">
        {shown
          ? `${shown.count} joined ${hovered === WEEKS - 1 ? 'in the last 7 days' : `the week of ${weekStart.format(shown.start + DAY)}`}`
          : `${latest} new this week`}
      </span>
      <div className={styles.spark} role="img" aria-label={`Joined per week, oldest first: ${weeks.map((week) => week.count).join(', ')}`} onPointerLeave={() => setHovered(null)}>
        {weeks.map((week, index) => (
          <span key={week.start} className={styles.sparkSlot} onPointerEnter={() => setHovered(index)}>
            <span
              className={styles.sparkBar}
              data-now={index === WEEKS - 1 || undefined}
              data-on={hovered === index || undefined}
              // An empty week still shows a stub, so the row reads as eight weeks, not a gap.
              style={{ height: `${Math.max(8, (week.count / peak) * 100)}%` }}
            />
          </span>
        ))}
      </div>
    </div>
  )
}
