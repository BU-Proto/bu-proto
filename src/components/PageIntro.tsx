import type { ReactNode } from 'react'
import { BRAND } from '../content/site'
import type { PageIntro as PageIntroContent } from '../content/types'
import ui from './ui.module.css'

/**
 * The top of every inner page: tab title, big title and lede. `children` go below. The ground
 * drains into harbor under it, unless the page sets the intro beside something else and marks
 * that whole row instead (`groundAfter={false}`, then `data-ground-after` on the row).
 */
export function PageIntro({
  intro,
  children,
  groundAfter = true,
}: {
  intro: PageIntroContent
  children?: ReactNode
  groundAfter?: boolean
}) {
  return (
    <header className={ui.intro} data-ground-after={groundAfter ? '' : undefined}>
      <title>{`${intro.title} · ${BRAND.full}`}</title>
      <h1 className={ui.introTitle} data-fog-clear>
        {intro.title}
      </h1>
      <p className={ui.introLede} data-fog-clear>
        {intro.lede}
      </p>
      {children}
    </header>
  )
}
