import type { CSSProperties } from 'react'
import { STARTED_HERE, type MapPlace, type Tone } from '../content/home'
import styles from './BostonMap.module.css'

/** Each place's pin colour. */
const PIN_TONE: Record<Exclude<MapPlace, 'bu'>, Tone> = {
  harvard: 'sky',
  allston: 'mint',
  mit: 'rose',
  cambridge: 'iris',
  boston: 'amber',
}

type RiverPoint = readonly [x: number, y: number, width: number]

/**
 * The Charles, west to east, as points along its middle with its width there: narrow past Harvard
 * and Allston, wide through the basin between BU and MIT, narrow again at the Longfellow, then out
 * into the harbour. Drawn as a smooth band through them.
 */
const CHARLES: readonly RiverPoint[] = [
  [-40, 296, 20],
  [80, 322, 22],
  [190, 346, 24],
  [300, 378, 28],
  [410, 410, 36],
  [480, 410, 62],
  [570, 392, 98],
  [670, 366, 108],
  [770, 334, 96],
  [835, 304, 56],
  [890, 268, 44],
  [960, 228, 64],
  [1060, 190, 90],
]

/** Where the bridges cross, by how far east they are: Anderson, BU, Harvard (Mass Ave), Longfellow. */
const BRIDGES = [232, 452, 588, 836]

/** The harbour along the east edge, with the peninsula's shore drawn loosely. */
const HARBOR =
  'M 952 0 C 930 70, 968 140, 942 214 C 922 282, 970 352, 944 430 C 922 500, 962 572, 942 640 L 1000 640 L 1000 0 Z'

/** A few big roads, faint, so the land reads as a city: Mass Ave and Comm Ave. */
const ROADS = [
  'M 170 100 C 210 150, 230 180, 255 196 C 330 230, 430 250, 520 300 C 570 330, 590 380, 600 440 C 610 520, 625 580, 640 660',
  'M -20 540 C 90 510, 180 492, 300 488 C 400 486, 470 500, 560 488 C 680 472, 780 462, 900 452',
]

/** Two parks, as flat patches: the Fens and the Common with the Public Garden. */
const PARKS = [
  'M 540 520 C 560 500, 610 505, 622 530 C 632 556, 600 580, 570 574 C 545 568, 528 540, 540 520 Z',
  'M 820 478 C 842 462, 892 466, 902 490 C 910 514, 884 534, 852 530 C 826 526, 806 496, 820 478 Z',
]

/** Catmull-Rom through the river's points, `steps` samples between each pair. */
function sampleRiver(points: readonly RiverPoint[], steps = 14): RiverPoint[] {
  const out: RiverPoint[] = []
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps
      const at = (k: 0 | 1 | 2) =>
        0.5 *
        (2 * p1[k] +
          (p2[k] - p0[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t +
          (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t * t * t)
      out.push([at(0), at(1), at(2)])
    }
  }
  out.push(points[points.length - 1])
  return out
}

/** The unit normal to the river at sample `i`, pointing north-ish. */
function normalAt(samples: readonly RiverPoint[], i: number): [number, number] {
  const a = samples[Math.max(i - 1, 0)]
  const b = samples[Math.min(i + 1, samples.length - 1)]
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const length = Math.hypot(dx, dy) || 1
  return [dy / length, -dx / length]
}

const SAMPLES = sampleRiver(CHARLES)
const round = (n: number) => Math.round(n * 10) / 10

/** The river as one closed shape: up its north bank, back down its south bank. */
const RIVER = (() => {
  const north: string[] = []
  const south: string[] = []
  SAMPLES.forEach(([x, y, width], i) => {
    const [nx, ny] = normalAt(SAMPLES, i)
    north.push(`${round(x + (nx * width) / 2)} ${round(y + (ny * width) / 2)}`)
    south.push(`${round(x - (nx * width) / 2)} ${round(y - (ny * width) / 2)}`)
  })
  return `M ${north.join(' L ')} L ${south.reverse().join(' L ')} Z`
})()

/** Each bridge as a short rule straight across the river, a little past both banks. */
const BRIDGE_LINES = BRIDGES.map((east) => {
  let index = 0
  SAMPLES.forEach(([x], i) => {
    if (Math.abs(x - east) < Math.abs(SAMPLES[index][0] - east)) index = i
  })
  const [x, y, width] = SAMPLES[index]
  const [nx, ny] = normalAt(SAMPLES, index)
  const reach = width / 2 + 9
  return { key: east, x1: round(x + nx * reach), y1: round(y + ny * reach), x2: round(x - nx * reach), y2: round(y - ny * reach) }
})

/** A point on the 1000 by 640 drawing, as a position over it. */
const at = (x: number, y: number) => ({ left: `${x / 10}%`, top: `${y / 6.4}%` })

/**
 * Boston and Cambridge as a flat map in its own panel: land, the Charles and the harbour in
 * halftone dots like the page behind it, the bridges, two parks and two big roads. Each place a
 * company in the list began has a pin with its name on a tag in its colour; pointing at a pin or a
 * row lights both. Proto's own pin, at BU, is white and pulses. The names are HTML over the
 * drawing so they stay readable at any size. Not to scale; the list beside it carries the words,
 * so screen readers get the caption only.
 */
export function BostonMap({ active, onActive }: { active: MapPlace | null; onActive: (place: MapPlace | null) => void }) {
  const places = Object.entries(STARTED_HERE.places) as [MapPlace, (typeof STARTED_HERE.places)[MapPlace]][]
  const counts = STARTED_HERE.items.reduce<Partial<Record<MapPlace, number>>>((all, item) => {
    all[item.place] = (all[item.place] ?? 0) + 1
    return all
  }, {})

  return (
    <figure className={styles.map}>
      <div className={styles.panel}>
        <svg className={styles.svg} viewBox="0 0 1000 640" preserveAspectRatio="none" role="img" aria-label={STARTED_HERE.mapCaption}>
          <defs>
            <pattern id="boston-map-river" width="11" height="11" patternUnits="userSpaceOnUse">
              <circle cx="5.5" cy="5.5" r="1.9" className={styles.waterDot} />
            </pattern>
            <pattern id="boston-map-harbor" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="7" cy="7" r="2.6" className={styles.waterDot} />
            </pattern>
            <linearGradient id="boston-map-fade" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
              <stop offset="1" stopColor="#fff" stopOpacity="1" />
            </linearGradient>
            <mask id="boston-map-harbor-mask">
              <rect x="900" width="100" height="640" fill="url(#boston-map-fade)" />
            </mask>
          </defs>

          {PARKS.map((d) => (
            <path key={d} d={d} className={styles.park} />
          ))}
          {ROADS.map((d) => (
            <path key={d} d={d} className={styles.road} />
          ))}

          <path d={HARBOR} className={styles.water} />
          <path d={HARBOR} fill="url(#boston-map-harbor)" mask="url(#boston-map-harbor-mask)" />
          <path d={RIVER} className={styles.water} />
          <path d={RIVER} fill="url(#boston-map-river)" />
          <path d={RIVER} className={styles.bank} />

          {BRIDGE_LINES.map(({ key, ...line }) => (
            <line key={key} {...line} className={styles.bridge} />
          ))}
        </svg>

        <div className={styles.layer} aria-hidden="true">
          {STARTED_HERE.areas.map((area) => (
            <span
              key={area.label}
              className={styles.area}
              data-water={area.water || undefined}
              style={{ ...at(area.x, area.y), '--angle': `${area.angle ?? 0}deg` } as CSSProperties}
            >
              {area.label}
            </span>
          ))}

          {places.map(([id, place], index) => {
            const proto = id === 'bu'
            const count = counts[id] ?? 0
            return (
              <div key={id} className={styles.spot} style={at(place.x, place.y)}>
                <div
                  className={styles.pin}
                  data-tone={proto ? undefined : PIN_TONE[id]}
                  data-proto={proto || undefined}
                  data-active={active === id || undefined}
                  data-side={place.side}
                  data-reveal="rise"
                  style={{ '--d': `${200 + index * 90}ms` } as CSSProperties}
                  onMouseEnter={() => onActive(id)}
                  onMouseLeave={() => onActive(null)}
                >
                  <span className={styles.halo} />
                  <span className={styles.dot} />
                  <span className={styles.tag}>
                    <span>
                      {proto ? STARTED_HERE.proto.name : place.label}
                      {proto && <span className={styles.note}> {STARTED_HERE.proto.note}</span>}
                    </span>
                    {!proto && count > 1 && <span className={styles.count}>{count}</span>}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <figcaption className={styles.caption}>{STARTED_HERE.mapCaption}</figcaption>
    </figure>
  )
}
