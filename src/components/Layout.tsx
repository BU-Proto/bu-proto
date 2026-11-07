import { useEffect, useRef } from 'react'
import { Outlet, ScrollRestoration, useLocation, useNavigation } from 'react-router'
import { AsciiField, DEFAULT_FIELD_SETTINGS, type AsciiFieldHandle, type FieldEngineOptions, type FieldSettings } from '../ascii-field'
import { useSmoothScroll } from '../lib/smoothScroll'
import { Footer } from './Footer'
import { TopBar } from './TopBar'
import styles from './Layout.module.css'

const CONTROLS = 'a, button, input, select, textarea, label, summary, [role="button"], [role="tab"]'

/** The cursor trail as the field drew it before the redesign, in the landing's glyph size. */
const TRAIL: FieldSettings = { ...DEFAULT_FIELD_SETTINGS, cellSize: 10 }

/**
 * The trail steps back from the copy so it stays legible, as it did from the old field's marked
 * text. Line boxes only, so it still runs right up to the words.
 */
const TRAIL_OPTIONS: FieldEngineOptions = {
  layer: 'trail',
  // [data-trail-skip]: art that draws the trail itself (the landing's field), cleared as a box.
  clearSelector:
    'h1, h2, h3, h4, h5, p, li, dt, dd, blockquote, figcaption, label, input, textarea, button, [data-fog-clear], [data-trail-skip]',
}

/** Every public page, on the one dark ground: the fixed top tab, the page and, except on the landing, the footer. */
export function Layout() {
  useSmoothScroll()
  const trailRef = useRef<AsciiFieldHandle>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  // Moving to a page that loads data keeps the old page up until the data lands; a line along
  // the top says the click registered.
  const navigating = useNavigation().state === 'loading'

  // A click splashes the trail and a move draws it, which is right over the art but noisy on a
  // button. The trail skips pointer-downs inside [data-fog-ignore], so mark whichever control was
  // pressed before its own (bubbling) listener reads the event. Moves over a control never reach
  // it either; entering one tells it the pointer left, so moving off again starts a fresh trail
  // instead of drawing a streak from where the pointer went in.
  useEffect(() => {
    const markControl = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return
      event.target.closest(CONTROLS)?.setAttribute('data-fog-ignore', '')
    }
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

  // The trail re-measures the copy on scroll and resize, but not when a new page or a form's
  // thank-you mounts new text. Tell it whenever the content changes.
  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return
    const pending = { frame: 0 }
    const observer = new MutationObserver(() => {
      if (pending.frame) return
      pending.frame = requestAnimationFrame(() => {
        pending.frame = 0
        trailRef.current?.refreshClearMask()
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
      <div ref={shellRef} className={styles.shell} data-site="public">
        <span className={styles.progress} data-active={navigating || undefined} aria-hidden="true" />
        <AsciiField ref={trailRef} settings={TRAIL} options={TRAIL_OPTIONS} className={styles.trail} />
        <TopBar />
        <main className={styles.main}>
          <Outlet />
        </main>
        {/* The landing ends on its own join frame, which carries the footer's links. */}
        {pathname !== '/' && <Footer />}
      </div>
      <ScrollRestoration />
    </>
  )
}
