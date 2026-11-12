import { useEffect, type CSSProperties } from 'react'
import { Link, useLoaderData, useOutletContext } from 'react-router'
import { newestWins } from '../components/accolade'
import { GlyphEdge } from '../components/GlyphEdge'
import { GlyphRibbon } from '../components/GlyphRibbon'
import { Hero } from '../components/Hero'
import { JourneyReel } from '../components/JourneyReel'
import type { LayoutOutlet } from '../components/Layout'
import motion from '../components/motion/motion.module.css'
import { RevealWords } from '../components/motion/RevealWords'
import { useReveal } from '../components/motion/useReveal'
import ui from '../components/ui.module.css'
import { LatestWins } from '../components/WinSheet'
import { WHY } from '../content/about'
import { JOIN_CTA } from '../content/home'
import { BRAND } from '../content/site'
import type { HomeData } from '../lib/content'
import { GROUND } from '../lib/pageGround'
import { useWheelEasing } from '../lib/smoothScroll'
import { useMediaQuery } from '../lib/useMediaQuery'
import styles from './Home.module.css'

/** How many wins the landing shows: three rows of two. */
const LATEST = 6

/** The drain back into the field at the foot of the page, in rows of glyphs. */
const DRAIN = { rows: 24, cell: 10 } as const

/**
 * The closing ribbon's two courses. With room it's laid out on the section, 1000 wide: it sets off
 * from under the wins, comes down through the ask, round under it and up its near end, over the
 * top and down through it again, and runs out in the open ground beside the last words. In one
 * column it's laid out on the ask alone, 1000 to its row: down through both lines, round under
 * them and back up. Either way it crosses the letters steeply and never runs along them.
 */
const RIBBON = { box: [1000, 1000], thickness: 24 } as const
const RIBBON_PATH = {
  wide: 'M 430 -60 C 600 -80, 760 -40, 740 50 C 720 140, 560 200, 450 290 C 340 380, 130 420, 64 320 C 14 240, 60 124, 190 116 C 300 108, 350 200, 330 330 C 316 420, 380 480, 470 470',
  column: 'M 150 -90 C 180 100, 300 362, 520 350 C 760 338, 830 100, 860 -90',
} as const
const COLUMN = '(max-width: 860px)'

/** Staggers the parts of a block as it settles in. */
const after = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

/**
 * The field comes back under the footer in a shape of its own: dawn, light coming up from the foot
 * of the page. It changes over once the hero's window has left the screen and back before it
 * returns; between the two the page is all harbor, so the field is never seen to switch.
 */
function useFootShape() {
  const { setFieldShape } = useOutletContext<LayoutOutlet>()
  useEffect(() => {
    const state: { frame: number; foot: boolean | null } = { frame: 0, foot: null }
    const check = () => {
      state.frame = 0
      const foot = window.scrollY > window.innerHeight * 1.1
      if (foot === state.foot) return
      state.foot = foot
      setFieldShape(foot ? 'dawn' : null)
    }
    const schedule = () => {
      if (!state.frame) state.frame = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(state.frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      setFieldShape(null)
    }
  }, [setFieldShape])
}

/**
 * The last word: the ask set as large as the page allows, and under it, held to the right, why
 * Proto exists, what joining takes, and the way in.
 */
function Closing() {
  const column = useMediaQuery(COLUMN)
  return (
    <section className={styles.closing} aria-labelledby="join-cta">
      {!column && <GlyphRibbon className={styles.ribbon} hue="sky" path={RIBBON_PATH.wide} {...RIBBON} />}
      <div className={styles.statementRow}>
        {column && <GlyphRibbon className={styles.ribbon} hue="sky" path={RIBBON_PATH.column} {...RIBBON} />}
        <h2 id="join-cta" className={styles.statement} data-reveal="words">
          <RevealWords text={JOIN_CTA.title} />
        </h2>
      </div>
      <div className={styles.closingWords}>
        <p data-reveal="rise">{WHY.text}</p>
        <p data-reveal="rise" style={after(90)}>
          {JOIN_CTA.lede}
        </p>
        <p className={styles.closingAction} data-reveal="rise" style={after(180)}>
          <Link className={`${ui.primary} ${styles.join}`} to={JOIN_CTA.cta.href}>
            {JOIN_CTA.cta.label}
          </Link>
        </p>
      </div>
    </section>
  )
}

/**
 * The landing, four parts down one harbor ground: the hero, a window onto the field; how a
 * person's time at Proto goes; the latest wins; and the ask. The field shows through the hero's
 * frame and comes back under the footer, where harbor drains away into its characters.
 */
export function Home() {
  const { wins } = useLoaderData<HomeData>()
  const latest = newestWins(wins, LATEST)
  const revealRef = useReveal<HTMLDivElement>()
  useWheelEasing()
  useFootShape()

  return (
    <div ref={revealRef} className={motion.reveal}>
      <title>{`${BRAND.full} · The home base for building things at BU`}</title>
      <Hero />
      <div className={styles.ground} style={{ '--drain': `${DRAIN.rows * DRAIN.cell}px` } as CSSProperties}>
        <JourneyReel />
        <LatestWins wins={latest} id="latest-wins" />
        <Closing />
        <GlyphEdge color={GROUND.harbor} mode="drain" side="bottom" rows={DRAIN.rows} cell={DRAIN.cell} />
      </div>
    </div>
  )
}
