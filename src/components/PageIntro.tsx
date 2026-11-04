import type { ReactNode } from 'react'
import { BRAND } from '../content/site'
import type { PageIntro as PageIntroContent } from '../content/types'
import ui from './ui.module.css'

/** The top of every inner page: tab title, mono path, big title and lede. `children` go below. */
export function PageIntro({ intro, children }: { intro: PageIntroContent; children?: ReactNode }) {
  return (
    <header className={ui.intro}>
      <title>{`${intro.title} · ${BRAND.full}`}</title>
      <p className={ui.path} data-fog-clear>
        {intro.path}
        <span className={ui.caret} aria-hidden="true">
          _
        </span>
      </p>
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
