import { useEffect, useId, useRef, useState } from 'react'
import { canRefract, glassMaps, type GlassMaps } from '../lib/liquidGlass'
import styles from './Glass.module.css'

interface GlassProps {
  /** The surface's corner radius in px. It must match the parent's, since the maps are cut to it. */
  radius: number
  /** How far in from the rim the edge curves, in px. */
  bezel: number
  /** The filter's displacement scale. The view at the rim moves about half this many px. */
  bend: number
}

interface Built extends GlassMaps {
  width: number
  height: number
}

/**
 * A surface of liquid glass, filling its positioned parent from behind the content. Bottom to top:
 * frost, which blurs the page and compresses its brightness so labels hold their contrast over
 * anything; the lens, which bends the view at the rim; and the rim of light. Each is its own layer:
 * the frost is there at once, and stays if the lens can't run.
 *
 * Nothing above this in the tree may set `filter`, `opacity`, `mask`, `clip-path` or `backdrop-filter`:
 * any of them would stop the glass seeing the page.
 */
export function Glass({ radius, bezel, bend }: GlassProps) {
  const root = useRef<HTMLSpanElement>(null)
  const id = `glass-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [built, setBuilt] = useState<Built | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const surface = root.current
    if (!surface) return
    const refract = canRefract()
    const state = { live: true, timer: 0 }

    const build = () => {
      const width = surface.offsetWidth
      const height = surface.offsetHeight
      if (!width || !height) return
      const maps = glassMaps(width, height, radius, bezel)
      surface.style.setProperty('--rim', `url("${maps.rim}")`)
      if (!refract) return
      // Decoded first: a filter whose image isn't ready shifts the whole view instead of bending it.
      const image = new Image()
      image.src = maps.map
      image
        .decode()
        .then(() => {
          if (!state.live) return
          setBuilt({ ...maps, width, height })
          requestAnimationFrame(() => state.live && setReady(true))
        })
        .catch(() => undefined)
    }

    build()
    const sizes = new ResizeObserver(() => {
      window.clearTimeout(state.timer)
      state.timer = window.setTimeout(build, 60)
    })
    sizes.observe(surface)
    return () => {
      state.live = false
      window.clearTimeout(state.timer)
      sizes.disconnect()
    }
  }, [radius, bezel])

  return (
    <span ref={root} className={styles.glass} aria-hidden="true">
      <span className={styles.frost} />
      {built && (
        <svg className={styles.defs} width="0" height="0">
          <filter
            id={id}
            x="0"
            y="0"
            width={built.width}
            height={built.height}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage href={built.map} x="0" y="0" width={built.width} height={built.height} preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={bend} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      <span
        className={styles.lens}
        data-ready={ready || undefined}
        style={built ? { backdropFilter: `url(#${id}) blur(0.5px)` } : undefined}
      />
      <span className={styles.rim} />
    </span>
  )
}
