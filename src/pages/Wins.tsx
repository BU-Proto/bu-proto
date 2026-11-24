import { Link, useLoaderData, useSearchParams } from 'react-router'
import type { Win } from '../../shared/api'
import { showcaseOrder } from '../components/accolade'
import { AccoladeFeatures, AccoladePlates } from '../components/Accolades'
import { GroupTabs } from '../components/GroupTabs'
import { PageIntro } from '../components/PageIntro'
import { WinTally } from '../components/WinTally'
import { WonAtBand } from '../components/WonAtBand'
import ui from '../components/ui.module.css'
import { WIN_FILTERS, WIN_GROUP, WIN_SHOWCASE, WINS_EMPTY, WINS_EMPTY_GROUP, WINS_INTRO } from '../content/wins'
import type { GroupSlug } from '../content/groups'
import styles from './Wins.module.css'

const isGroup = (value: string | null): value is GroupSlug => value === 'cs' || value === 'business'

/**
 * The record, the schools it was won at, then the most recent win across the window's width, then
 * every other prize. `?group=cs` or `?group=business` narrows it to one group's wins and shows that
 * group's tabs.
 */
export function Wins() {
  const all = useLoaderData<Win[]>()
  const [params] = useSearchParams()
  const param = params.get('group')
  const group = isGroup(param) ? param : null
  const wins = group ? all.filter((win) => WIN_GROUP[win.kind] === group) : all
  const { featured, rest } = showcaseOrder(wins)

  return (
    <div className={ui.page}>
      {group && <GroupTabs group={group} />}
      <PageIntro intro={WINS_INTRO} />
      <nav className={styles.filters} aria-label="Show wins from">
        {WIN_FILTERS.map((filter) => (
          <Link
            key={filter.label}
            to={filter.group ? `/wins?group=${filter.group}` : '/wins'}
            className={styles.filter}
            aria-current={filter.group === group ? 'page' : undefined}
          >
            {filter.label}
          </Link>
        ))}
      </nav>
      <WinTally wins={wins} />
      <WonAtBand wins={wins} />
      {wins.length === 0 ? (
        <p className={ui.panel} data-fog-clear>
          {group ? WINS_EMPTY_GROUP[group] : WINS_EMPTY}
        </p>
      ) : (
        <div className={styles.showcase}>
          <AccoladeFeatures wins={featured} eagerFirst />
          {rest.length > 0 && (
            <section className={styles.more} aria-labelledby="more-prizes" data-grid>
              <h2 id="more-prizes" className={styles.moreTitle} data-fog-clear>
                {WIN_SHOWCASE.moreTitle}
              </h2>
              <AccoladePlates wins={rest} />
            </section>
          )}
        </div>
      )}
    </div>
  )
}
