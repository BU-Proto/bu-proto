import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useInView } from '../../lib/useInView'
import styles from './motion.module.css'

/** Splits the text into the lines it wraps to at the current width, using a hidden copy of it. */
function measureLines(root: HTMLElement, text: string): string[] {
  const words = text.split(' ')
  const probe = document.createElement('span')
  probe.className = styles.maskProbe ?? ''
  words.forEach((word, index) => {
    const span = document.createElement('span')
    span.textContent = word
    probe.append(span, index < words.length - 1 ? ' ' : '')
  })
  root.append(probe)
  const lines: string[] = []
  let top = Number.NaN
  for (const [index, span] of [...probe.querySelectorAll('span')].entries()) {
    if (span.offsetTop !== top) {
      top = span.offsetTop
      lines.push(words[index]!)
    } else {
      lines[lines.length - 1] += ` ${words[index]!}`
    }
  }
  probe.remove()
  return lines
}

/** The whole entrance of a text starts within this long, however many letters it has. */
const STAGGER_SPAN = 620
const LETTER_STEP = 33
/** The longest the words wait for their typeface, so they never move and then change shape. */
const FONT_WAIT = 900

/** Resolves once the display type has arrived, or the wait is over. One wait for the whole page. */
let fontsArrived: Promise<unknown> | null = null
function whenFontsArrive() {
  fontsArrived ??= Promise.race([
    document.fonts?.load('400 40px "Host Grotesk"') ?? Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, FONT_WAIT)),
  ])
  return fontsArrived
}

interface MaskLinesProps {
  text: string
  /** Milliseconds before the first letter moves. */
  delay?: number
}

/**
 * Text that comes up letter by letter out of its line, tipping upright as it lands: the same
 * entrance as the Latest wins heading. Put it inside the heading or paragraph that carries the
 * type. The lines are found by measuring, again whenever the width changes or the font arrives,
 * and nothing moves until the typeface is in. Screen readers get the plain text.
 */
export function MaskLines({ text, delay = 0 }: MaskLinesProps) {
  const [ref, inView] = useInView<HTMLSpanElement>('0px 0px -6% 0px')
  const [lines, setLines] = useState<string[] | null>(null)
  const [fontsIn, setFontsIn] = useState(false)
  const lastWidth = useRef(-1)

  useEffect(() => {
    const mounted = { live: true }
    void whenFontsArrive().then(() => {
      if (mounted.live) setFontsIn(true)
    })
    return () => {
      mounted.live = false
    }
  }, [])

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const update = () => {
      const next = measureLines(root, text)
      setLines((now) => (now && now.join('\n') === next.join('\n') ? now : next))
    }
    update()
    lastWidth.current = root.clientWidth
    const resize = new ResizeObserver(() => {
      if (root.clientWidth === lastWidth.current) return
      lastWidth.current = root.clientWidth
      update()
    })
    resize.observe(root)
    const mounted = { live: true }
    document.fonts?.ready.then(() => {
      if (mounted.live) update()
    })
    return () => {
      mounted.live = false
      resize.disconnect()
    }
  }, [ref, text])

  const letters = text.replace(/\s/g, '').length
  const step = Math.min(LETTER_STEP, STAGGER_SPAN / Math.max(1, letters))
  const seen = { count: 0 }

  return (
    <span
      ref={ref}
      className={styles.mask}
      data-shown={(inView && fontsIn) || undefined}
      style={{ '--delay': `${delay}ms`, '--step': `${step.toFixed(2)}ms` } as CSSProperties}
    >
      <span className={styles.maskSr}>{text}</span>
      <span aria-hidden="true">
        {(lines ?? [text]).map((line, index) => (
          <span key={index} className={styles.maskLine}>
            {line.split(' ').map((word, wordIndex) => (
              <span key={wordIndex}>
                {wordIndex > 0 && ' '}
                <span className={styles.maskWord}>
                  {[...word].map((char, charIndex) => (
                    <span key={charIndex} className={styles.maskChar} style={{ '--i': seen.count++ } as CSSProperties}>
                      {char}
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </span>
        ))}
      </span>
    </span>
  )
}
