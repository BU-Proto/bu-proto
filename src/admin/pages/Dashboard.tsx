import { Link, useLoaderData } from 'react-router'
import admin from '../admin.module.css'
import { PlusIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { plural } from '../lib/format'
import { useSession } from '../lib/session'
import type { dashboardLoader } from '../loaders'
import styles from './Dashboard.module.css'

export function Component() {
  const stats = useLoaderData<typeof dashboardLoader>()
  const { me } = useSession()

  const tiles = [
    { label: 'Members', value: stats.members, note: `${stats.membersThisWeek} new this week`, to: '/admin/members' },
    { label: 'Upcoming events', value: stats.upcomingEvents, note: `${plural(stats.upcomingRsvps, 'RSVP')} so far`, to: '/admin/events' },
    { label: 'Fund interest', value: stats.fundTotal, note: `${stats.fundNew} new to review`, to: '/admin/fund?status=new', highlight: stats.fundNew > 0 },
    {
      label: 'Wins',
      value: stats.wins,
      note: stats.wins > 0 ? 'Counted on the site' : `None real yet, ${stats.sampleWins} samples showing`,
      to: '/admin/wins',
    },
    { label: 'Admins', value: stats.admins, note: 'Can sign in here', to: '/admin/admins' },
  ]

  return (
    <div className={admin.page}>
      <PageHeader title={`Hi, ${(me.name ?? me.email.split('@')[0]).split(' ')[0]}`} tabTitle="Dashboard" lede="What’s happening at BU Proto." />

      <section aria-labelledby="stats-title">
        <h2 id="stats-title" className={styles.srOnly}>
          At a glance
        </h2>
        <ul className={styles.tiles}>
          {tiles.map((tile) => (
            <li key={tile.label}>
              <Link className={styles.tile} to={tile.to} data-highlight={tile.highlight || undefined}>
                <span className={styles.label}>{tile.label}</span>
                <span className={styles.value}>{tile.value.toLocaleString()}</span>
                <span className={styles.note}>{tile.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.split}>
        <section className={admin.panel} aria-labelledby="quick-title">
          <div className={admin.panelHead}>
            <h2 id="quick-title" className={admin.panelTitle}>
              Quick links
            </h2>
          </div>
          <div className={styles.quick}>
            <Link className={admin.primary} to="/admin/events/new">
              <PlusIcon /> New event
            </Link>
            <Link className={admin.button} to="/admin/email">
              Email members
            </Link>
            <Link className={admin.button} to="/admin/fund?status=new">
              {stats.fundNew > 0 ? (
                <>
                  Review fund <span className={styles.fresh}>{stats.fundNew} new</span>
                </>
              ) : (
                'Review fund'
              )}
            </Link>
          </div>
        </section>


        <section className={admin.panel} aria-labelledby="content-title">
          <div className={admin.panelHead}>
            <h2 id="content-title" className={admin.panelTitle}>
              Site content
            </h2>
            <p className={admin.hint}>Everything here shows on the public site once it’s published.</p>
          </div>
          <ul className={styles.contentLinks}>
            <li>
              <Link to="/admin/events">Events</Link>
              <span>Hack nights, panels, demo nights</span>
            </li>
            <li>
              <Link to="/admin/hackathons">Hackathons</Link>
              <span>Trips on the calendar</span>
            </li>
            <li>
              <Link to="/admin/wins">Wins</Link>
              <span>Projects that placed</span>
            </li>
            <li>
              <Link to="/admin/board">Board</Link>
              <span>Who runs Proto</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
