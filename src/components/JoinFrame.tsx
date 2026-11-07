import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link } from 'react-router'
import { JOIN_CTA } from '../content/home'
import { CONTACT_EMAIL, LEGAL_LINKS } from '../content/legal'
import { BRAND, FOOTER } from '../content/site'
import { createEdgeLight } from '../lib/edgeLight'
import { onFrame } from '../lib/smoothScroll'
import { reducedMotion } from '../lib/useInView'
import { AsciiFigure } from './motion/AsciiFigure'
import { MaskLines } from './motion/MaskLines'
import { ProtoMark } from './ProtoMark'
import ui from './ui.module.css'
import styles from './JoinFrame.module.css'

/** How much of a screen short of full the frame's light starts to come up. */
const POWER_RANGE = 0.5

/** The screen's own edge, lit, while the frame fills it. Without WebGL2 the section is plain black. */
function EdgeCanvas({ section }: { section: RefObject<HTMLElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const surface = canvas.current
    const box = section.current
    if (!surface || !box) return
    const light = createEdgeLight(surface, () => setFailed(true))
    if (!light) {
      setFailed(true)
      return
    }
    const still = reducedMotion()
    const state = { stop: null as (() => void) | null, onScreen: false, visible: !document.hidden }

    const power = () => {
      if (still) return 1
      const top = box.getBoundingClientRect().top / window.innerHeight
      const t = Math.max(0, 1 - Math.abs(top) / POWER_RANGE)
      return t * t * (3 - 2 * t)
    }
    const draw = (now: number) => light.frame(now, power())
    const sync = () => {
      const run = !still && state.onScreen && state.visible
      if (run && !state.stop) state.stop = onFrame(draw)
      else if (!run && state.stop) {
        state.stop()
        state.stop = null
      }
    }

    const sizes = new ResizeObserver(() => {
      light.resize(surface.clientWidth, surface.clientHeight)
      draw(performance.now())
    })
    sizes.observe(surface)
    const screen = new IntersectionObserver(([entry]) => {
      state.onScreen = entry.isIntersecting
      sync()
    })
    screen.observe(box)
    const onVisibility = () => {
      state.visible = !document.hidden
      sync()
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !state.onScreen) return
      const rect = surface.getBoundingClientRect()
      light.point(event.clientX - rect.left, event.clientY - rect.top)
    }
    const onOut = (event: PointerEvent) => {
      if (!event.relatedTarget) light.point(null, 0)
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pointermove', onMove, { capture: true, passive: true })
    window.addEventListener('pointerout', onOut, { passive: true })

    return () => {
      state.stop?.()
      sizes.disconnect()
      screen.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onMove, { capture: true })
      window.removeEventListener('pointerout', onOut)
      light.destroy()
    }
  }, [section])

  if (failed) return null
  return <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
}

/** The landing's last screen: the ask, framed in moving light, then the site's links. */
export function JoinFrame() {
  const section = useRef<HTMLElement>(null)
  return (
    <section ref={section} className={styles.frame} aria-labelledby="join-cta">
      <EdgeCanvas section={section} />
      <div className={styles.inner}>
        <header className={styles.head}>
          <h2 id="join-cta" className={styles.title}>
            <MaskLines text={JOIN_CTA.title} />
            <span className={styles.star} aria-hidden="true">
              *
            </span>
          </h2>
          <p className={styles.tag}>{JOIN_CTA.tag}</p>
        </header>

        <div className={styles.stage}>
          <div className={styles.hint}>
            <span className={styles.hintGlyph} aria-hidden="true">
              {'>_'}
            </span>
            <p className={styles.hintLine}>{JOIN_CTA.hint}</p>
          </div>

          <div className={styles.ring}>
            <AsciiFigure shape="ring" rows={22} className={styles.figure} />
            <Link className={`${ui.btn} ${styles.cta}`} to={JOIN_CTA.cta.href}>
              {JOIN_CTA.cta.label}
            </Link>
          </div>

          <p className={styles.aside}>
            {JOIN_CTA.aside.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        </div>

        <p className={styles.lede}>{JOIN_CTA.lede}</p>

        <p className={styles.note}>
          {JOIN_CTA.footnote.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </div>

      <footer className={styles.foot}>
        <div className={styles.footRow}>
          <p className={styles.brand}>
            <ProtoMark size={16} />
            {BRAND.full}
          </p>
          <nav aria-label="Footer">
            <ul className={styles.links}>
              {FOOTER.groups
                .flatMap((group) => group.links)
                .filter((item, index, all) => all.findIndex((other) => other.to === item.to) === index)
                .map((item) => (
                  <li key={item.to}>
                    <Link to={item.to}>{item.label}</Link>
                  </li>
                ))}
              {LEGAL_LINKS.map((item) => (
                <li key={item.href}>
                  <Link to={item.href}>{item.label}</Link>
                </li>
              ))}
              <li>
                <a className={styles.email} href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <p className={styles.small}>{FOOTER.note}</p>
      </footer>
    </section>
  )
}
