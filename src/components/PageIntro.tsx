import type { ReactNode } from 'react'
import { BRAND } from '../content/site'
import type { PageIntro as PageIntroContent } from '../content/types'
import { MaskLines } from './motion/MaskLines'
import ui from './ui.module.css'

/**
 * The top of every inner page, built like the home hero's copy: the tab title, the big title on the
 * left and the lede across a rule on the right. `children` go below, across both columns.
 */
export function PageIntro({ intro, children }: { intro: PageIntroContent; children?: ReactNode }) {
  return (
    <header className={ui.intro}>
      <title>{`${intro.title} · ${BRAND.full}`}</title>
      <h1 className={ui.introTitle}>
        <MaskLines text={intro.title} delay={100} />
      </h1>
      <p className={ui.introLede}>{intro.lede}</p>
      {children && <div className={ui.introMore}>{children}</div>}
    </header>
  )
}
