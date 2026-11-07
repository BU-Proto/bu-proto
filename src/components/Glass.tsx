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

/** Blue bends further than red, and this much keeps the fringe to a pixel or two at the very rim. */
const DISPERSION = 0.08

const CHANNELS = [
  { name: 'red', spread: 1 - DISPERSION, matrix: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { name: 'green', spread: 1, matrix: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { name: 'blue', spread: 1 + DISPERSION, matrix: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0' },
]

interface Built extends GlassMaps {
  width: number
  height: number
}

/**
 * A surface of liquid glass, filling its positioned parent from behind the content. Bottom to top:
 * frost, which blurs the page and compresses its brightness so labels hold their contrast over
 * anything; the lens, which bends the view at the rim; and the rim of light. Where the lens runs, the
 * frost pulls back from the rim over a clear layer, so what bends there stays sharp. Each is its own
 * layer: the frost is there at once, and stays if the lens can't run.
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
      surface.style.setProperty('--core', `url("${maps.core}")`)
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
    <span ref={root} className={styles.glass} data-refract={ready || undefined} aria-hidden="true">
      <span className={styles.clear} />
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
            {CHANNELS.flatMap((channel) => [
              <feDisplacementMap
                key={`${channel.name}-bent`}
                in="SourceGraphic"
                in2="map"
                scale={bend * channel.spread}
                xChannelSelector="R"
                yChannelSelector="G"
                result={`${channel.name}-bent`}
              />,
              <feColorMatrix
                key={channel.name}
                in={`${channel.name}-bent`}
                type="matrix"
                values={channel.matrix}
                result={channel.name}
              />,
            ])}
            <feBlend in="red" in2="green" mode="screen" result="warm" />
            <feBlend in="warm" in2="blue" mode="screen" result="view" />
            {/* The rim picks up the colour of what's behind it, the way an edge of real glass does. */}
            <feImage href={built.rim} x="0" y="0" width={built.width} height={built.height} preserveAspectRatio="none" result="rim" />
            <feColorMatrix in="view" type="saturate" values="4" result="vivid" />
            <feComponentTransfer in="vivid" result="lit">
              <feFuncR type="linear" slope="1.9" />
              <feFuncG type="linear" slope="1.9" />
              <feFuncB type="linear" slope="1.9" />
            </feComponentTransfer>
            <feComposite in="lit" in2="rim" operator="in" result="glint" />
            <feBlend in="glint" in2="view" mode="screen" />
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
