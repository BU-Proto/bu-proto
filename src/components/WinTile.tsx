import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { Win } from '../../shared/api'
import { WIN_SHEET, WIN_SHOWCASE } from '../content/wins'
import { asciiWord } from '../lib/glyphArt'
import { reducedMotion, useInView } from '../lib/useInView'
import { accoladeOf, hackathonName, teamParts } from './accolade'
import { BuMark } from './BuMark'
import motion from './motion/motion.module.css'
import { SampleTag } from './SampleTag'
import ui from './ui.module.css'
import styles from './WinSheet.module.css'

const LETTER_COPIES = [0, 1, 2, 3]
const ROLL_STEP = 62.5

const DECODE_GLYPHS = ".,:;'-~=+<>*xo%#@○>_"
const DECODE_RATE = 40
const DECODE_NOISE = 5

const noiseGlyphs = (count: number) =>
  Array.from({ length: count }, () => DECODE_GLYPHS[Math.floor(Math.random() * DECODE_GLYPHS.length)]).join('')

/**
 * Where, what and who, as separate parts: "HackHarvard 2026", "1st Place, Best Web API", "Team of
 * 4", the team left off when it isn't known. They're set apart by space, not a separator.
 */
function tagParts(win: Win): string[] {
  const { prize, rank } = accoladeOf(win)
  const size = win.team.filter((person) => person.name.trim()).length
  const parts = [hackathonName(win.event), rank ? `${rank}, ${prize}` : prize]
  if (size > 0) parts.push(WIN_SHEET.teamOf(size))
  return parts
}

/**
 * The tag line, typed out behind a few loose glyphs, one part after another. Its hidden twin holds
 * the line's height, and a screen reader gets the parts as one plain sentence.
 */
function TagLine({ parts, inView }: { parts: readonly string[]; inView: boolean }) {
  const live = useRef<HTMLSpanElement>(null)
  const key = parts.join('\n')

  useEffect(() => {
    const node = live.current
    if (!node) return
    const texts = key.split('\n')
    const total = texts.reduce((sum, text) => sum + text.length, 0)
    // One text node per part, rewritten in place: replacing them each frame would have Layout's
    // watch on the page's content re-measure the field's text sixty times a second.
    const settled = inView && reducedMotion()
    const words = texts.map((text) => document.createTextNode(settled ? text : ''))
    node.replaceChildren(
      ...words.map((text) => {
        const part = document.createElement('span')
        part.append(text)
        return part
      }),
    )
    if (!inView || reducedMotion()) return
    // The whole line's characters, split back across the parts by length.
    const show = (line: string) => {
      let at = 0
      texts.forEach((text, index) => {
        words[index].data = line.slice(at, at + text.length)
        at += text.length
      })
    }
    const frame = { id: 0 }
    const start = performance.now()
    const full = texts.join('')
    const tick = (now: number) => {
      const shown = Math.floor(DECODE_RATE * ((now - start) / 1000))
      const real = Math.max(0, shown - DECODE_NOISE)
      if (real >= total) {
        show(full)
        return
      }
      show(full.slice(0, real) + noiseGlyphs(Math.min(DECODE_NOISE, total - real)))
      frame.id = requestAnimationFrame(tick)
    }
    frame.id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.id)
  }, [key, inView])

  return (
    <p className={styles.tag}>
      <span className={ui.srOnly}>{parts.join(', ')}</span>
      <span className={styles.tagTwin} aria-hidden="true">
        {parts.map((part, index) => (
          <span key={index}>{part}</span>
        ))}
      </span>
      <span ref={live} className={styles.tagLive} aria-hidden="true" />
    </p>
  )
}

/** The project's name, each letter a column of copies that rolls into the one-line mask. */
function RollingTitle({ text }: { text: string }) {
  const chars = [...text]
  const letters = chars.filter((char) => char.trim()).length
  const seen = { count: 0 }
  return (
    <h3 className={styles.name} aria-label={text} style={{ '--n': chars.length } as CSSProperties}>
      <span className={styles.mask}>
        <span className={styles.arrow} aria-hidden="true">
          {'>'}
        </span>
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
    <pre className={`${motion.figure} ${styles.ascii}`} aria-hidden="true" data-trail-art>
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

/** One win: its cover, a decoding tag line and its name, opening its Devpost page or else its own page. */
export function WinTile({ win, side, details = false, eager = false }: WinTileProps) {
  // The cover plays as the tile crosses the fold and the words as they do, every time either comes
  // back on screen, from above or below.
  const [ref, inView] = useInView<HTMLLIElement>('0px', 0, true)
  const [wordsRef, wordsIn] = useInView<HTMLDivElement>('0px', 0, true)
  const { hackathon } = accoladeOf(win)
  const content = (
    <>
      <Media side={side}>
        <Art win={win} alt={`${win.project} at ${hackathon}`} eager={eager} />
      </Media>
      <div ref={wordsRef} data-in={wordsIn || undefined} className={styles.words}>
        <TagLine parts={tagParts(win)} inView={wordsIn} />
        <RollingTitle text={win.project} />
      </div>
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
    <li ref={ref} className={styles.item} data-entrance data-in={inView || undefined}>
      {win.devpost ? (
        <a className={styles.tile} data-link href={win.devpost} target="_blank" rel="noreferrer">
          {content}
        </a>
      ) : (
        <Link className={styles.tile} data-link to={`/wins/${win.id}`}>
          {content}
        </Link>
      )}
    </li>
  )
}
