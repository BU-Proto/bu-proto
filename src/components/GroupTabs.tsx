import { Link, useLocation } from 'react-router'
import { GROUP_TABS, GROUP_TABS_LABEL } from '../content/groupTabs'
import type { GroupSlug } from '../content/groups'
import styles from './GroupTabs.module.css'

/**
 * A group's tabs, as a bar at the top of each of its pages: the group's name on its colour, then
 * its pages, the current one marked. A tab matches on path and, for Wins, on its group too.
 */
export function GroupTabs({ group }: { group: GroupSlug }) {
  const { pathname, search } = useLocation()
  const { name, tone, tabs } = GROUP_TABS[group]
  const here = `${pathname}${search}`
  return (
    <nav className={styles.bar} data-tone={tone} aria-label={GROUP_TABS_LABEL(name)} data-fog-clear="box">
      <Link to={tabs[0].to} className={styles.name}>
        {name}
      </Link>
      <ul className={styles.tabs}>
        {tabs.map((tab) => {
          const current = tab.to.includes('?') ? here === tab.to : pathname === tab.to
          return (
            <li key={tab.to}>
              <Link to={tab.to} className={styles.tab} aria-current={current ? 'page' : undefined}>
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
