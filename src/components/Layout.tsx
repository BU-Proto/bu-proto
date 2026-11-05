import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { AsciiField, type AsciiFieldHandle } from '../ascii-field'
import { glyphTexture } from '../lib/glyphArt'
import { GROUND, GROUNDS, groundFor, lightFilter, type GroundName } from '../lib/pageGround'
import { useSmoothAnchors } from '../lib/smoothScroll'
import { reducedMotion } from '../lib/useInView'
import { Footer } from './Footer'
import { GlyphEdge } from './GlyphEdge'
import { TopBar } from './TopBar'
import styles from './Layout.module.css'

const CONTROLS = 'a, button, input, select, textarea, label, summary, [role="button"], [role="tab"]'

/** How long the field dims before it takes the next page's settings (see the CSS for the rise). */
const DIM_MS = 200

/**
 * Every page: the ASCII field mounted once behind everything, tuned to the page's ground, then the
 * top bar, the page and the footer.
 */
export function Layout() {
  const fieldRef = useRef<AsciiFieldHandle>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const target = groundFor(pathname).name
  // The ground the field is showing. It trails the route by a beat: the field dims, swaps its
  // settings while it can't be seen (a new glyph size rebuilds its grid), then comes back up.
  const [trailing, setTrailing] = useState<GroundName>(target)
  // Under reduced motion there's no dim: the field takes the new page's settings at once.
  const shown = reducedMotion() ? target : trailing
  const dimmed = shown !== target
  const ground = GROUNDS[shown]
  const texture = useMemo(() => glyphTexture(GROUND.texture), [])
  useSmoothAnchors()

  useEffect(() => {
    if (trailing === target) return
    const timer = window.setTimeout(() => setTrailing(target), reducedMotion() ? 0 : DIM_MS)
    return () => window.clearTimeout(timer)
  }, [trailing, target])

  // A click splashes the field and a move draws its trail, which is right on open ground but noisy
  // on a button. The field skips pointer-downs inside [data-fog-ignore], so mark whichever control
  // was pressed before the field's own (bubbling) listener reads the event.
  useEffect(() => {
    const markControl = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return
      event.target.closest(CONTROLS)?.setAttribute('data-fog-ignore', '')
    }
    // The trail too: moves over a control never reach the field's window listener. Entering one
    // tells the field the pointer left, so moving off it again starts a fresh trail instead of
    // drawing a streak from where the pointer went in.
    let overControl = false
    const holdTrail = (event: PointerEvent) => {
      const over = event.target instanceof Element && event.target.closest(CONTROLS) !== null
      if (over && !overControl) window.dispatchEvent(new PointerEvent('pointerout', { relatedTarget: null }))
      overControl = over
      if (over) event.stopPropagation()
    }
    window.addEventListener('pointerdown', markControl, { capture: true, passive: true })
    window.addEventListener('pointermove', holdTrail, { capture: true, passive: true })
    return () => {
      window.removeEventListener('pointerdown', markControl, { capture: true })
      window.removeEventListener('pointermove', holdTrail, { capture: true })
    }
  }, [])

  // The field re-measures marked text on scroll and resize, but not when a new page or a
  // form's thank-you state mounts new text. Tell it whenever the content changes.
  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return
    const pending = { frame: 0 }
    const observer = new MutationObserver(() => {
      if (pending.frame) return
      pending.frame = requestAnimationFrame(() => {
        pending.frame = 0
        fieldRef.current?.refreshClearMask()
      })
    })
    observer.observe(shell, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      cancelAnimationFrame(pending.frame)
    }
  }, [])

  return (
    <>
      <div
        className={styles.fieldLight}
        data-dimmed={dimmed || undefined}
        style={{ filter: lightFilter(ground.light) }}
      >
        <AsciiField ref={fieldRef} settings={ground.field} className={styles.field} />
      </div>
      <div ref={shellRef} className={styles.shell} data-ground={shown}>
        {/* Below the header the field drains into harbor, solid or veiled (see pageGround). */}
        <div
          className={styles.ground}
          data-reach={GROUNDS[target].reach}
          style={{ '--texture': texture ? `url(${texture})` : 'none' } as CSSProperties}
          aria-hidden="true"
        >
          <GlyphEdge color={GROUND.harbor} mode="drain" rows={28} cell={10} />
          <span className={styles.groundTexture} />
        </div>
        <TopBar />
        <main className={styles.main}>
          <Outlet />
        </main>
        <Footer />
      </div>
      <ScrollRestoration />
    </>
  )
}
