import type { CSSProperties } from 'react'
import { Link, useLoaderData } from 'react-router'
import type { ProtoEvent } from '../../shared/api'
import { Picture } from '../components/GroupsBento'
import ui from '../components/ui.module.css'
import { KIND_GROUP } from '../content/events'
import { GROUP_PAGE, GROUPS, type GroupSlug } from '../content/groups'
import { CONTACT_EMAIL } from '../content/legal'
import { BRAND } from '../content/site'
import { dateParts, daysUntil } from '../lib/dates'
import { eventPath } from '../lib/paths'
import styles from './GroupPage.module.css'

/** How many of the group's next nights the page lists. */
const NEXT_COUNT = 4

/**
 * A group's own page, after brand.dropbox.com: the group's colour as one big tile with its name,
 * what it's for and its drawing; what it runs as tiles on the hairline grid; its next nights from
 * the calendar; and how to help run it.
 */
export function GroupPage({ slug }: { slug: GroupSlug }) {
  const group = GROUPS[slug]
  const events = useLoaderData<ProtoEvent[]>()
  const next = events
    .filter((event) => KIND_GROUP[event.kind] === group.name && daysUntil(event.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, NEXT_COUNT)

  return (
    <div className={ui.page}>
      <title>{`${group.tab} · ${BRAND.name}`}</title>

      <header className={styles.hero} data-tone={group.tone}>
        <div className={styles.heroWords}>
          <p className={styles.label}>{GROUP_PAGE.label}</p>
          <h1 className={styles.title}>{group.title}</h1>
          <p className={styles.lede}>{group.lede}</p>
          {group.note && <p className={styles.note}>{group.note}</p>}
        </div>
        <Picture name={group.picture} className={styles.picture} />
      </header>

      <section className={styles.runs} aria-labelledby="runs" data-grid>
        <h2 id="runs" className={ui.sectionTitle} data-fog-clear>
          {GROUP_PAGE.runs}
        </h2>
        <ul className={styles.grid}>
          {group.activities.map((activity, index) => (
            <li key={activity.name} className={styles.activity} data-tone={group.tone} style={{ '--n': index } as CSSProperties}>
              <span className={styles.number} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className={styles.activityName}>{activity.name}</h3>
              <p className={styles.activityText}>{activity.text}</p>
              {activity.link && (
                <Link className={styles.activityLink} to={activity.link.href}>
                  {activity.link.label}
                  <span aria-hidden="true"> →</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
        <p className={styles.welcome}>{GROUP_PAGE.welcome}</p>
      </section>

      <section className={styles.next} aria-labelledby="next">
        <div className={styles.nextHead}>
          <h2 id="next" className={ui.sectionTitle} data-fog-clear>
            {GROUP_PAGE.next}
          </h2>
          <Link className={ui.textLink} to="/events">
            {GROUP_PAGE.allEvents}
          </Link>
        </div>
        {next.length === 0 ? (
          <p className={styles.empty}>
            {group.empty}{' '}
            <Link className={ui.textLink} to="/join">
              Join Proto
            </Link>
          </p>
        ) : (
          <ol className={styles.events}>
            {next.map((event) => {
              const { day, month, weekday } = dateParts(event.date)
              return (
                <li key={event.id} className={styles.event} data-tone={group.tone}>
                  <span className={styles.date}>
                    <span className={styles.day}>{day}</span>
                    <span className={styles.month}>
                      {month}
                      <br />
                      {weekday}
                    </span>
                  </span>
                  <span className={styles.eventWords}>
                    <Link className={styles.eventTitle} to={eventPath(event)}>
                      {event.title}
                    </Link>
                    <span className={styles.eventMeta}>
                      {event.kind} · {event.time} · {event.place}
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <p className={styles.help}>
        {group.help}{' '}
        <a className={ui.textLink} href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
      </p>
    </div>
  )
}

export const CsGroup = () => <GroupPage slug="cs" />
export const BusinessGroup = () => <GroupPage slug="business" />
