import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Field, Form } from '../components/Form'
import { BU_EMAIL_PATTERN, inputClass } from '../components/formFields'
import { PageIntro } from '../components/PageIntro'
import { PrivacyNote } from '../components/PrivacyNote'
import ui from '../components/ui.module.css'
import { AUDIENCE, GRANTS_INTRO, INTEREST, RANGE, STATUS, STEPS, TRAVEL } from '../content/grants'
import { api } from '../lib/api'
import { FINE_RAMP, hash, rampWedge } from '../lib/glyphArt'
import { reducedMotion, useInView } from '../lib/useInView'
import { FUND_AMOUNTS, YEARS } from '../../shared/constants'
import styles from './Grants.module.css'

// Fewer, bigger cells on a phone, where the wedge gets the column to itself under the numbers.
const WEDGE_ROWS = 6
const wedgeCols = () => (typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches ? 56 : 96)

/** The wedge part way drawn: cells settle from the left, unsettled ones flicker faintly. */
function partial(lines: readonly string[], progress: number, frame: number): string {
  return lines
    .map((line, j) => {
      let out = ''
      for (let i = 0; i < line.length; i++) {
        const settleAt = (i / line.length) * 0.7 + hash(i, j) * 0.3
        out += progress >= settleAt ? line[i] : hash(i + frame, j) < 0.12 ? FINE_RAMP[1 + ((i + frame) % 5)] : ' '
      }
      return out
    })
    .join('\n')
}

/**
 * The range's measure, the page's one motion: the first time it's seen it fills from $50 to
 * $500. With reduced motion it's simply there.
 */
function RangeWedge() {
  const [cols] = useState(wedgeCols)
  const lines = useMemo(() => rampWedge(cols, WEDGE_ROWS), [cols])
  const final = useMemo(() => lines.join('\n'), [lines])
  const [ref, inView] = useInView<HTMLSpanElement>('0px 0px -15% 0px')
  const [shown, setShown] = useState(() => (typeof window === 'undefined' || reducedMotion() ? final : partial(lines, 0, 0)))

  useEffect(() => {
    if (!inView || reducedMotion()) return
    const frame = { id: 0 }
    const start = performance.now() + 150
    const tick = (now: number) => {
      const progress = Math.max(0, (now - start) / 1400)
      setShown(progress >= 1 ? final : partial(lines, progress, Math.floor(now / 80)))
      if (progress < 1) frame.id = requestAnimationFrame(tick)
    }
    frame.id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.id)
  }, [inView, lines, final])

  return (
    <span ref={ref} className={styles.wedge} style={{ '--cols': cols } as CSSProperties} aria-hidden="true">
      <span className={styles.wedgeText}>{shown}</span>
    </span>
  )
}

/**
 * The fund's coming-soon page. The field over the intro, then harbor to the end: one ground, with
 * the rhythm carried by type, space and rules. The range is the one loud thing.
 */
export function Grants() {
  return (
    <>
      <div className={`${styles.column} ${styles.intro}`}>
        <PageIntro intro={GRANTS_INTRO}>
          {/* Said once, before anything else: there is no money yet. */}
          <p className={styles.status} data-fog-clear>
            <strong className={styles.statusWord}>{STATUS.word}</strong> {STATUS.text}{' '}
            <a className={ui.textLink} href="#interest">
              {STATUS.link}
            </a>
          </p>
        </PageIntro>
      </div>

      {/* Where the field has just drained: the range, measured in the field's ramp. */}
      <section className={`${styles.column} ${styles.range}`} aria-labelledby="range">
        {/* The two ends of the range with the wedge measured out between them. */}
        <h2 id="range" className={styles.amounts}>
          <span className={styles.min}>${RANGE.min}</span>
          <span className={ui.srOnly}> to </span>
          <RangeWedge />
          <span className={styles.max}>${RANGE.max}</span>
        </h2>
        <div className={styles.rangeCopy}>
          <p className={styles.lede}>{RANGE.lede}</p>
          <p className={styles.note}>{RANGE.note}</p>
        </div>
      </section>

      {/* What it pays for: travel, and only travel for now. */}
      <section className={`${styles.column} ${styles.section}`} aria-labelledby="travel">
        <h2 id="travel" className={styles.title}>
          {TRAVEL.title}
        </h2>
        <ul className={styles.travelList}>
          {TRAVEL.items.map((item) => (
            <li key={item.title} className={styles.travel}>
              <h3 className={styles.travelTitle}>{item.title}</h3>
              <p className={styles.travelText}>{item.text}</p>
            </li>
          ))}
        </ul>
        <p className={styles.note}>{TRAVEL.note}</p>
      </section>

      <section className={`${styles.column} ${styles.section} ${styles.audience}`} aria-labelledby="audience">
        <div className={styles.audienceHead}>
          <h2 id="audience" className={styles.subtitle}>
            {AUDIENCE.title}
          </h2>
          <p className={`${styles.lede} ${styles.soft}`}>{AUDIENCE.lede}</p>
          <a className={ui.textLink} href={AUDIENCE.source.href} target="_blank" rel="noreferrer">
            {AUDIENCE.source.label} <span aria-hidden="true">↗</span>
          </a>
        </div>
        <table className={styles.compare}>
          <thead>
            <tr>
              <td />
              <th scope="col">{AUDIENCE.columns.ignite}</th>
              <th scope="col" className={styles.ours}>
                {AUDIENCE.columns.proto}
              </th>
            </tr>
          </thead>
          <tbody>
            {AUDIENCE.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.ignite}</td>
                <td className={styles.ours}>{row.proto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* The plan as a sequence, ending in the one thing asked back. */}
      <section className={`${styles.column} ${styles.section}`} aria-labelledby="how">
        <header className={styles.head}>
          <h2 id="how" className={styles.title}>
            {STEPS.title}
          </h2>
          <p className={`${styles.lede} ${styles.soft}`}>{STEPS.lede}</p>
        </header>
        <ol className={styles.steps}>
          {STEPS.items.map((step, index) => (
            <li key={step.title} className={styles.step} data-last={index === STEPS.items.length - 1 || undefined}>
              <span className={styles.stepNo} aria-hidden="true">
                {index + 1}
              </span>
              <span className={styles.stop} aria-hidden="true" />
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* The end of the page, and the only thing on it to fill in, on a solid panel. */}
      <section id="interest" className={`${styles.column} ${styles.end}`} aria-labelledby="interest-title">
        <div className={`${ui.panelDeep} ${styles.interest}`}>
          <div className={styles.interestHead}>
            <h2 id="interest-title" className={styles.title}>
              {INTEREST.title}
            </h2>
            <p className={`${styles.lede} ${styles.soft}`}>{INTEREST.lede}</p>
            <PrivacyNote text={INTEREST.privacy} />
          </div>

          {/* Interest list only, never an application. */}
          <Form
            submitLabel={INTEREST.submit}
            thanks={INTEREST.thanks}
            turnstile="fund-interest"
            onSubmit={(values) => api<{ ok: true }>('/fund-interest', { body: values })}
          >
            <Field label="Name">
              <input className={inputClass} name="name" autoComplete="name" required />
            </Field>
            <Field label="BU email">
              <input
                className={inputClass}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@bu.edu"
                pattern={BU_EMAIL_PATTERN}
                title="Use your @bu.edu address"
                required
              />
            </Field>
            <Field label="Year">
              <select className={inputClass} name="year" required defaultValue="">
                <option value="" disabled>
                  Pick one
                </option>
                {YEARS.map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </Field>
            <Field label="Rough amount">
              <select className={inputClass} name="amount" required defaultValue="">
                <option value="" disabled>
                  Pick one
                </option>
                {FUND_AMOUNTS.map((amount) => (
                  <option key={amount}>{amount}</option>
                ))}
              </select>
            </Field>
            <Field label={INTEREST.fields.target.label} wide>
              <input className={inputClass} name="target" placeholder={INTEREST.fields.target.placeholder} required />
            </Field>
            <Field label={INTEREST.fields.spend.label} wide>
              <textarea className={inputClass} name="spend" placeholder={INTEREST.fields.spend.placeholder} required />
            </Field>
          </Form>
        </div>
      </section>
    </>
  )
}
