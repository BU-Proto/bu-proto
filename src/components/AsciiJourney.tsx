import { useRef } from 'react'
import { JOURNEY } from '../content/home'
import { JOURNEY_PALETTE, journeyFrame, journeyGlyph } from '../lib/pixelGrid'
import { MaskLines } from './motion/MaskLines'
import { usePixelCanvas } from './usePixelCanvas'
import ui from './ui.module.css'
import styles from './AsciiJourney.module.css'

const pitchFor = (width: number) => (width < 600 ? 8 : 12)

/** A person's time at Proto, in ASCII: a loose crowd narrows into a team and opens out into what ships. */
export function AsciiJourney() {
  const canvas = useRef<HTMLCanvasElement>(null)
  usePixelCanvas(canvas, { palette: JOURNEY_PALETTE, pitch: pitchFor, fps: 12, still: 6, fontScale: 0.96, glyph: journeyGlyph, frame: journeyFrame })

  return (
    <section className={styles.section} aria-labelledby="journey">
      <header className={styles.head}>
        <h2 id="journey" className={styles.title}>
          {JOURNEY.title.split('\n').map((line) => (
            <span key={line} className={styles.line}>
              <MaskLines text={line} />
            </span>
          ))}
        </h2>
        <p className={styles.lede} data-reveal="rise">
          {JOURNEY.lede}
        </p>
      </header>
      <canvas ref={canvas} className={styles.art} aria-hidden="true" />
      <ol className={`${ui.steps} ${styles.steps}`}>
        {JOURNEY.steps.map((step, index) => (
          <li key={step.name} className={ui.step}>
            <div className={ui.stepHead}>
              <span className={ui.badge}>{String(index + 1).padStart(2, '0')}</span>
              <h3 className={styles.stepName}>{step.name}</h3>
            </div>
            <p className={styles.stepText}>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
