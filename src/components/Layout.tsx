import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Outlet, ScrollRestoration, useLocation, useNavigation } from 'react-router'
import { AsciiField, SHAPES, type AsciiFieldHandle, type ShapeName } from '../ascii-field'
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

/** The drain from the field into harbor: its glyph rows and cell size, and the air between the
    page's intro and where it begins. */
const DRAIN_ROWS = 12
const DRAIN_CELL = 10
const DRAIN_GAP = 12

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
  // A page can ask for another shape for a stretch of it (the landing does, for its last word).
  const [pageShape, setPageShape] = useState<ShapeName | null>(null)
  const shape = useShapePreview() ?? pageShape
  const field = useMemo(() => (shape ? { ...ground.field, shape } : ground.field), [ground.field, shape])
  const outlet = useMemo<LayoutOutlet>(() => ({ setFieldShape: setPageShape }), [])
  const texture = useMemo(() => glyphTexture(GROUND.texture), [])
  const textureMask = useMemo(() => glyphTexture(GROUND.textureMask), [])
  useSmoothAnchors()
  // Moving to a page that loads data keeps the old page up until the data lands; a line along
  // the top says the click registered.
  const navigating = useNavigation().state === 'loading'

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

  // The harbor starts under the page's intro, so the drain into it never runs over the title or
  // lede. Measured, not a fixed height: intros wrap to different lengths on every page and width.
  const groundRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const shell = shellRef.current
    const groundEl = groundRef.current
    if (!shell || !groundEl) return
    const watch: { intro: Element | null; frame: number } = { intro: null, frame: 0 }
    const place = () => {
      watch.frame = 0
      const found = shell.querySelector('[data-ground-after]')
      if (found !== watch.intro) {
        if (watch.intro) sizes.unobserve(watch.intro)
        if (found) sizes.observe(found)
        watch.intro = found
      }
      if (!found) {
        groundEl.style.removeProperty('--ground-top')
        return
      }
      const end = found.getBoundingClientRect().bottom - shell.getBoundingClientRect().top
      groundEl.style.setProperty('--ground-top', `${Math.round(end + DRAIN_GAP + DRAIN_ROWS * DRAIN_CELL)}px`)
    }
    const schedule = () => {
      if (!watch.frame) watch.frame = requestAnimationFrame(place)
    }
    const sizes = new ResizeObserver(schedule)
    const mounts = new MutationObserver(schedule)
    mounts.observe(shell, { childList: true, subtree: true })
    sizes.observe(shell)
    place()
    return () => {
      cancelAnimationFrame(watch.frame)
      sizes.disconnect()
      mounts.disconnect()
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
        <AsciiField ref={fieldRef} settings={field} className={styles.field} />
      </div>
      <div
        ref={shellRef}
        className={styles.shell}
        data-ground={shown}
        style={{ '--drain-h': `${DRAIN_GAP + DRAIN_ROWS * DRAIN_CELL}px` } as CSSProperties}
      >
        {/* Below the intro the field drains into solid harbor (see pageGround). */}
        <div
          ref={groundRef}
          className={styles.ground}
          data-reach={GROUNDS[target].reach}
          style={
            {
              '--texture': texture ? `url(${texture})` : 'none',
              '--texture-mask': textureMask ? `url(${textureMask})` : 'none',
            } as CSSProperties
          }
          aria-hidden="true"
        >
          <GlyphEdge color={GROUND.harbor} mode="drain" rows={DRAIN_ROWS} cell={DRAIN_CELL} />
          <span className={styles.groundTexture} />
        </div>
        <span className={styles.progress} data-active={navigating || undefined} aria-hidden="true" />
        <TopBar />
        <main className={styles.main}>
          <Outlet context={outlet} />
        </main>
        <Footer />
      </div>
      <ScrollRestoration />
    </>
  )
}

/** What Layout hands its pages (read with useOutletContext). */
export interface LayoutOutlet {
  /** Show the field in another shape, or null for the page's own. Reset it when leaving. */
  setFieldShape: (shape: ShapeName | null) => void
}

/** In development, `?shape=ripple` (any name in SHAPES) shows that shape on every page. */
function useShapePreview(): ShapeName | null {
  const { search } = useLocation()
  if (!import.meta.env.DEV) return null
  const name = new URLSearchParams(search).get('shape')
  return SHAPES.find((shape) => shape === name) ?? null
}
