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

/** The Charles, from Watertown to the harbour, as one stroke: Cambridge above it, Boston below. */
const RIVER = 'M -30 365 C 110 385, 190 430, 300 438 C 385 444, 432 426, 474 398 C 540 352, 602 332, 680 332 C 760 332, 812 302, 872 268 L 1030 222'
const HARBOR = 'M 905 0 C 885 80, 935 150, 902 238 C 878 300, 925 380, 885 468 C 856 540, 898 600, 870 640 L 1000 640 L 1000 0 Z'
/** Bridges across the river, each a short rule: the BU Bridge, Mass Ave, Longfellow. */
const BRIDGES = [
  [400, 412, 414, 452],
  [560, 337, 572, 377],
  [826, 276, 848, 314],
]

/**
 * Boston and Cambridge, drawn plainly: the Charles between them, a few bridges, the harbour, and
 * a pin where each company in the list began. Pointing at a pin or a row lights both. Proto's
 * own pin pulses at BU. Not to scale; the list beside it carries the words, so screen readers get
 * the caption only.
 */
export function BostonMap({ active, onActive }: { active: MapPlace | null; onActive: (place: MapPlace | null) => void }) {
  const places = Object.entries(STARTED_HERE.places) as [MapPlace, (typeof STARTED_HERE.places)[MapPlace]][]
  const counts = STARTED_HERE.items.reduce<Partial<Record<MapPlace, number>>>((all, item) => {
    all[item.place] = (all[item.place] ?? 0) + 1
    return all
  }, {})

  return (
    <figure className={styles.map}>
      <svg className={styles.svg} viewBox="0 0 1000 640" role="img" aria-label={STARTED_HERE.mapCaption}>
        <defs>
          <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" className={styles.gridLine} />
          </pattern>
        </defs>
        <rect width="1000" height="640" fill="url(#map-grid)" />
        <path d={HARBOR} className={styles.harbor} />
        <path d={RIVER} className={styles.river} />
        <path d={RIVER} className={styles.riverLine} />
        {BRIDGES.map(([x1, y1, x2, y2]) => (
          <line key={x1} x1={x1} y1={y1} x2={x2} y2={y2} className={styles.bridge} />
        ))}
        {STARTED_HERE.areas.map((area) => (
          <text
            key={area.label}
            x={area.x}
            y={area.y}
            className={styles.area}
            transform={area.vertical ? `rotate(-90 ${area.x} ${area.y})` : undefined}
          >
            {area.label}
          </text>
        ))}

        {places.map(([id, place]) => {
          const proto = id === 'bu'
          const count = counts[id] ?? 0
          return (
            <g
              key={id}
              className={styles.pin}
              data-tone={proto ? undefined : PIN_TONE[id]}
              data-proto={proto || undefined}
              data-active={active === id || undefined}
              onMouseEnter={() => onActive(id)}
              onMouseLeave={() => onActive(null)}
            >
              <circle cx={place.x} cy={place.y} r={proto ? 22 : 20} className={styles.halo} />
              <circle cx={place.x} cy={place.y} r={proto ? 12 : 11} className={styles.dot} />
              <text
                x={place.labelBelow ? place.x - 18 : place.x + 20}
                y={place.labelBelow ? place.y + 46 : place.y - 16}
                className={styles.label}
              >
                {proto ? STARTED_HERE.proto : place.label}
                {!proto && count > 1 ? ` · ${count}` : ''}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className={styles.caption}>{STARTED_HERE.mapCaption}</figcaption>
    </figure>
  )
}
