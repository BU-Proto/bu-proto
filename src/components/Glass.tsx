import { useEffect, useRef } from 'react'
import { glassMaps } from '../lib/liquidGlass'
import styles from './Glass.module.css'

interface GlassProps {
  /** The surface's corner radius in px. It must match the parent's, since the maps are cut to it. */
  radius: number
  /** How far in from the rim the edge curves, in px. */
  bezel: number
}

/**
 * A surface of glass, filling its positioned parent from behind the content: frost, which blurs the
 * page and compresses its brightness so labels hold their contrast over anything, and a rim of light.
 *
 * Nothing above this in the tree may set `filter`, `opacity`, `mask`, `clip-path` or `backdrop-filter`:
 * any of them would stop the glass seeing the page.
 */
export function Glass({ radius, bezel }: GlassProps) {
  const root = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const surface = root.current
    if (!surface) return
    const state = { timer: 0 }

    const build = () => {
      const width = surface.offsetWidth
      const height = surface.offsetHeight
      if (!width || !height) return
      surface.style.setProperty('--rim', `url("${glassMaps(width, height, radius, bezel).rim}")`)
    }

    build()
    const sizes = new ResizeObserver(() => {
      window.clearTimeout(state.timer)
      state.timer = window.setTimeout(build, 60)
    })
    sizes.observe(surface)
    return () => {
      window.clearTimeout(state.timer)
      sizes.disconnect()
    }
  }, [radius, bezel])

  return (
    <span ref={root} className={styles.glass} aria-hidden="true">
      <span className={styles.frost} />
      <span className={styles.rim} />
    </span>
  )
}
