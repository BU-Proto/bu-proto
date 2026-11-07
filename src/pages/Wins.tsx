import { useLoaderData } from 'react-router'
import type { Win } from '../../shared/api'
import { showcaseOrder } from '../components/accolade'
import { PageIntro } from '../components/PageIntro'
import { WinSheet } from '../components/WinSheet'
import { WinTally } from '../components/WinTally'
import ui from '../components/ui.module.css'
import { WINS_EMPTY, WINS_INTRO } from '../content/wins'
import styles from './Wins.module.css'

/** The record, then every win on the light sheet: the big placements first, then the rest. */
export function Wins() {
  const wins = useLoaderData<Win[]>()
  const { featured, rest } = showcaseOrder(wins)

  return (
    <>
      <div className={ui.page}>
        <PageIntro intro={WINS_INTRO} />
        <WinTally wins={wins} />
        {wins.length === 0 && (
          <p className={ui.panel}>
            {WINS_EMPTY}
          </p>
        )}
      </div>
      {wins.length > 0 && (
        <div className={styles.bleed}>
          <WinSheet wins={[...featured, ...rest]} />
        </div>
      )}
    </>
  )
}
