import { useLoaderData } from 'react-router'
import type { Win } from '../../shared/api'
import { showcaseOrder } from '../components/accolade'
import { AccoladeFeatures, AccoladePlates } from '../components/Accolades'
import { PageIntro } from '../components/PageIntro'
import { WinTally } from '../components/WinTally'
import ui from '../components/ui.module.css'
import { WIN_SHOWCASE, WINS_EMPTY, WINS_INTRO } from '../content/wins'
import styles from './Wins.module.css'

/** The record, then the big placements across the window's width, then every other prize. */
export function Wins() {
  const wins = useLoaderData<Win[]>()
  const { featured, rest } = showcaseOrder(wins)

  return (
    <div className={ui.page}>
      <PageIntro intro={WINS_INTRO} />
      <WinTally wins={wins} />
      {wins.length === 0 ? (
        <p className={ui.panel} data-fog-clear>
          {WINS_EMPTY}
        </p>
      ) : (
        <div className={styles.showcase}>
          <AccoladeFeatures wins={featured} eagerFirst />
          {rest.length > 0 && (
            <section className={styles.more} aria-labelledby="more-prizes">
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
