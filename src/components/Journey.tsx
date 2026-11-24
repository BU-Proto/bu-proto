import type { CSSProperties } from 'react'
import { JOURNEY, type Tone } from '../content/home'
import { RevealWords } from './motion/RevealWords'
import styles from './Journey.module.css'

/** Each step's colour, warming as the steps go on, as the field's light does. */
const STEP_TONES: readonly Tone[] = ['sky', 'iris', 'amber', 'rose']

/**
 * Each step's flat drawing in its colour: a spark for Start, two people for Team up, a hammer for
 * Build, an arrow out for Ship. Bold, single-colour shapes, after brand.dropbox.com's pictograms.
 */
function Picture({ step }: { step: number }) {
  const common = { className: styles.picture, viewBox: '0 0 120 120', 'aria-hidden': true, focusable: false } as const
  if (step === 0) {
    return (
      <svg {...common} fill="currentColor">
        <path d="M60 6l11 43 43 11-43 11-11 43-11-43L6 60l43-11z" />
      </svg>
    )
  }
  if (step === 1) {
    return (
      <svg {...common}>
        <circle cx="42" cy="60" r="30" fill="currentColor" />
        <circle cx="78" cy="60" r="25" fill="none" stroke="currentColor" strokeWidth="10" />
      </svg>
    )
  }
  if (step === 2) {
    return (
      <svg {...common} fill="currentColor">
        <path d="M22 16h62l14 14v20H22z" />
        <rect x="50" y="50" width="16" height="62" rx="4" />
      </svg>
    )
  }
  return (
    <svg {...common} fill="currentColor">
      <path d="M46 14h60v60L86 54 32 108 12 88l54-54z" />
    </svg>
  )
}

/**
 * What founders here have in common, whatever they study: the title large, then the four habits in
 * a row, each with its drawing, its number and its words, on the page's visible grid.
 */
export function Journey() {
  return (
    <section className={styles.section} aria-labelledby="journey" data-grid>
      <header className={styles.head}>
        <h2 id="journey" className={styles.title}>
          {JOURNEY.title.split('\n').map((line, index) => (
            <span key={line} className={styles.line} data-reveal="words" style={{ '--d': `${index * 160}ms` } as CSSProperties}>
              <RevealWords text={line} />
            </span>
          ))}
        </h2>
        <p className={styles.lede} data-reveal="rise" style={{ '--d': '240ms' } as CSSProperties}>
          {JOURNEY.lede}
        </p>
      </header>
      <ol className={styles.steps}>
        {JOURNEY.steps.map((step, index) => (
          <li
            key={step.name}
            className={styles.step}
            data-tone={STEP_TONES[index]}
            data-reveal="rise"
            style={{ '--d': `${index * 90}ms` } as CSSProperties}
          >
            <Picture step={index} />
            <div className={styles.stepHead}>
              <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
              <h3 className={styles.stepName}>{step.name}</h3>
            </div>
            <p className={styles.stepText}>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
