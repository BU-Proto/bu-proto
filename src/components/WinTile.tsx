import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import type { Win } from '../../shared/api'
import { WIN_SHEET, WIN_SHOWCASE } from '../content/wins'
import { asciiWord } from '../lib/glyphArt'
import { reducedMotion, useInView } from '../lib/useInView'
import { accoladeOf, hackathonName, teamParts } from './accolade'
import { BuMark } from './BuMark'
import motion from './motion/motion.module.css'
import { SampleTag } from './SampleTag'
import styles from './WinSheet.module.css'

/** How much of a tile has to be on screen before its entrance plays. */
const ENTRANCE_AT = 0.2
const LETTER_COPIES = [0, 1, 2, 3]
const ROLL_STEP = 62.5

const DECODE_GLYPHS = ".,:;'-~=+<>*xo%#@○>_"
const DECODE_RATE = 40
const DECODE_NOISE = 5

const noiseGlyphs = (count: number) =>
  Array.from({ length: count }, () => DECODE_GLYPHS[Math.floor(Math.random() * DECODE_GLYPHS.length)]).join('')

/** "HACKHARVARD 2026 • 1ST PLACE BEST WEB API • TEAM OF 4", without the team when it isn't known. */
function tagLine(win: Win): string {
  const { prize, rank } = accoladeOf(win)
  const size = win.team.filter((person) => person.name.trim()).length
  const parts = [hackathonName(win.event), rank ? `${rank} ${prize}` : prize]
  if (size > 0) parts.push(WIN_SHEET.teamOf(size))
  return parts.join(WIN_SHEET.separator).toUpperCase()
}

/** The tag line, typed out behind a few loose glyphs. Its hidden twin holds the line's height. */
function TagLine({ text, inView }: { text: string; inView: boolean }) {
  const live = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = live.current
    if (!node) return
    if (!inView) {
      node.textContent = ''
      return
    }
    if (reducedMotion()) {
      node.textContent = text
      return
    }
    const frame = { id: 0 }
    const start = performance.now()
    const tick = (now: number) => {
      const shown = Math.floor(DECODE_RATE * ((now - start) / 1000))
      const real = Math.max(0, shown - DECODE_NOISE)
      if (real >= text.length) {
        node.textContent = text
        return
      }
      node.textContent = text.slice(0, real) + noiseGlyphs(Math.min(shown, DECODE_NOISE))
      frame.id = requestAnimationFrame(tick)
    }
    frame.id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.id)
  }, [text, inView])

  return (
    <p className={styles.tag} aria-label={text}>
      <span className={styles.tagTwin}>{text}</span>
      <span ref={live} className={styles.tagLive} aria-hidden="true" />
    </p>
  )
}

/** The project's name, each letter a column of copies that rolls into the one-line mask. */
function RollingTitle({ text, arrow }: { text: string; arrow: boolean }) {
  const chars = [...text]
  const letters = chars.filter((char) => char.trim()).length
  const seen = { count: 0 }
  return (
    <h3 className={styles.name} aria-label={text} style={{ '--n': chars.length } as CSSProperties}>
      <span className={styles.mask}>
        {arrow && (
          <span className={styles.arrow} aria-hidden="true">
            {'>'}
          </span>
        )}
        {chars.map((char, index) => {
          if (!char.trim()) return <span key={index} className={styles.space} aria-hidden="true" />
          const i = seen.count++
          const landing = letters > 1 ? 1 - Math.sin((Math.PI * i) / (letters - 1)) : 0
          const style = {
            '--i': i,
            '--r': letters - 1 - i,
            '--roll': `${ROLL_STEP * landing}ms`,
          } as CSSProperties
          return (
            <span key={index} className={styles.letter} style={style} aria-hidden="true">
              <span className={styles.column}>
                {LETTER_COPIES.map((copy) => (
                  <span key={copy} className={styles.copy}>
                    {char}
                  </span>
                ))}
              </span>
            </span>
          )
        })}
      </span>
    </h3>
  )
}

/** The cover, or the project's name set in the field's fine ramp when there's no photo yet. */
function Art({ win, alt, eager }: { win: Win; alt: string; eager: boolean }) {
  const lines = useMemo(() => (win.photo ? null : asciiWord(win.project).join('\n')), [win.photo, win.project])
  if (win.photo) return <img src={win.photo} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
  return (
    <pre className={`${motion.figure} ${styles.ascii}`} aria-hidden="true">
      {lines}
    </pre>
  )
}

/** "Built by Maya, Jordan and Priya", with the BU mark after each teammate from BU. */
function Team({ win }: { win: Win }) {
  const parts = teamParts(win.team, 6)
  if (parts.length === 0) return null
  return (
    <p className={styles.team}>
      {WIN_SHOWCASE.builtBy}{' '}
      {parts.map((part, index) =>
        part.kind === 'name' ? (
          <span key={index}>
            {part.text}
            {part.bu && <BuMark />}
          </span>
        ) : (
          part.text
        ),
      )}
    </p>
  )
}

/**
 * The cover, leaning toward the cursor: --mx and --my run -1 to 1 across it. Listened for on the
 * window's capture, because Layout holds pointermove back from anything inside a link.
 */
function Media({ side, children }: { side: WinTileProps['side']; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const media = ref.current
    if (!media || !window.matchMedia('(hover: hover)').matches || reducedMotion()) return
    const follow = (event: globalThis.PointerEvent) => {
      if (!(event.target instanceof Node) || !media.contains(event.target)) {
        media.style.setProperty('--mx', '0')
        media.style.setProperty('--my', '0')
        return
      }
      const box = media.getBoundingClientRect()
      media.style.setProperty('--mx', (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(3))
      media.style.setProperty('--my', (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(3))
    }
    window.addEventListener('pointermove', follow, { capture: true, passive: true })
    return () => window.removeEventListener('pointermove', follow, { capture: true })
  }, [])

  return (
    <div ref={ref} className={styles.media} data-side={side}>
      <div className={styles.clip}>
        <div className={styles.zoom}>
          <div className={styles.art}>{children}</div>
        </div>
      </div>
    </div>
  )
}

interface WinTileProps {
  win: Win
  /** Which column it sits in: the media comes in from that side, toward the centre. */
  side: 'left' | 'right'
  /** Show the blurb and the team's names under the title. */
  details?: boolean
  eager?: boolean
}

/** One win: its cover, a decoding tag line and its name, opening its Devpost page when it has one. */
export function WinTile({ win, side, details = false, eager = false }: WinTileProps) {
  // Each tile watches for itself, so a long grid's lower rows don't play out of sight.
  const [ref, inView] = useInView<HTMLLIElement>('0px', ENTRANCE_AT)
  const { hackathon } = accoladeOf(win)
  const content = (
    <>
      <Media side={side}>
        <Art win={win} alt={`${win.project} at ${hackathon}`} eager={eager} />
      </Media>
      <TagLine text={tagLine(win)} inView={inView} />
      <RollingTitle text={win.project} arrow={Boolean(win.devpost)} />
      {win.placeholder && (
        <p className={styles.sample}>
          <SampleTag />
        </p>
      )}
      {details && win.blurb && <p className={styles.blurb}>{win.blurb}</p>}
      {details && <Team win={win} />}
    </>
  )

  return (
    <li ref={ref} className={styles.item} data-in={inView || undefined}>
      {win.devpost ? (
        <a className={styles.tile} data-link href={win.devpost} target="_blank" rel="noreferrer">
          {content}
        </a>
      ) : (
        <div className={styles.tile}>{content}</div>
      )}
    </li>
  )
}
