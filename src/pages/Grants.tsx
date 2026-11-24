import type { CSSProperties } from 'react'
import { Field, Form } from '../components/Form'
import { inputClass } from '../components/formFields'
import { PageIntro } from '../components/PageIntro'
import { Pictogram, type PictogramName } from '../components/Pictogram'
import { PrivacyNote } from '../components/PrivacyNote'
import { Select } from '../components/Select'
import ui from '../components/ui.module.css'
import { GRANTS_INTRO, INTEREST, PLAN, ROUTE, STATUS } from '../content/grants'
import { api } from '../lib/api'
import { hash } from '../lib/glyphArt'
import { FUND_AMOUNTS, YEARS } from '../../shared/constants'
import styles from './Grants.module.css'

/**
 * Each stop's sign, a flat drawing on a tile of its own colour: a question, a yes, the way there,
 * and play. The tiles read left to right from sky to rose.
 */
const STOP_SIGNS: readonly { picture: PictogramName; tone: 'sky' | 'mint' | 'amber' | 'rose' }[] = [
  { picture: 'ask', tone: 'sky' },
  { picture: 'yes', tone: 'mint' },
  { picture: 'go', tone: 'amber' },
  { picture: 'demo', tone: 'rose' },
]

/** The stub's barcode: bars of a few widths, laid out once, the same every time. */
const BAR_GAP = 2
const BARS = Array.from({ length: 34 }, (_, i) => 1 + Math.floor(hash(i, 9) * 4)).reduce<{ x: number; width: number }[]>(
  (bars, width) => [...bars, { x: bars.length ? bars[bars.length - 1]!.x + bars[bars.length - 1]!.width + BAR_GAP : 0, width }],
  [],
)
const BARCODE_WIDTH = BARS.length ? BARS[BARS.length - 1]!.x + BARS[BARS.length - 1]!.width : 0

function Barcode() {
  return (
    <svg className={styles.code} viewBox={`0 0 ${BARCODE_WIDTH} 40`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {BARS.map((bar, index) => (
        <rect key={index} x={bar.x} y={0} width={bar.width} height={40} />
      ))}
    </svg>
  )
}

/**
 * The fund's coming-soon page, on plain harbor like the other inner pages. The plan is printed as
 * the thing it pays for, a ticket; then the way it'll work as a row of signs on colour tiles; then
 * the interest list.
 */
export function Grants() {
  const { fields } = INTEREST

  return (
    <div className={styles.page}>
      <PageIntro intro={GRANTS_INTRO}>
        {/* Said once, before anything else: there is no money yet. */}
        <p className={styles.status} data-fog-clear>
          <strong className={styles.statusWord}>{STATUS.word}</strong> {STATUS.text}{' '}
          <a className={ui.textLink} href="#interest">
            {STATUS.link}
          </a>
        </p>
      </PageIntro>

      <section className={styles.ticket} aria-labelledby="plan">
        <h2 id="plan" className={ui.srOnly}>
          {PLAN.title}
        </h2>
        <div className={styles.ticketBody}>
          <p className={styles.leg}>
            <span>{PLAN.from}</span>
            <span className={ui.srOnly}> to </span>
            <span className={styles.rail} aria-hidden="true" />
            <span>{PLAN.to}</span>
          </p>
          <p className={styles.headline}>{PLAN.headline}</p>
          <ul className={styles.facts}>
            {PLAN.facts.map((fact) => (
              <li key={fact.title} className={styles.fact}>
                <h3 className={styles.factTitle}>{fact.title}</h3>
                <p className={styles.factText}>{fact.text}</p>
              </li>
            ))}
          </ul>
        </div>
        {/* The stub: what's still unsettled about all of the above. */}
        <div className={styles.stub}>
          <Barcode />
          <p className={styles.caveat}>
            <strong className={styles.caveatLead}>{PLAN.caveat.lead}</strong> {PLAN.caveat.text}
          </p>
        </div>
      </section>

      <section className={styles.route} aria-labelledby="route">
        <div className={styles.head}>
          <h2 id="route" className={styles.subtitle}>
            {ROUTE.title}
          </h2>
          <p className={styles.lede}>{ROUTE.lede}</p>
        </div>

        {/* The four stops, each with its sign on a tile of its own colour. */}
        <ol className={styles.steps} data-grid>
          {ROUTE.stops.map((stop, index) => (
            <li key={stop.title} className={styles.stop} style={{ '--col': index } as CSSProperties}>
              <span className={styles.sign} data-tone={STOP_SIGNS[index]?.tone}>
                <Pictogram name={STOP_SIGNS[index]?.picture ?? 'go'} />
              </span>
              <h3 className={styles.stopTitle}>{stop.title}</h3>
              <p className={styles.stopText}>{stop.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="interest" className={`${styles.section} ${styles.interest}`} aria-labelledby="interest-title">
        <div className={styles.head}>
          <h2 id="interest-title" className={styles.subtitle}>
            {INTEREST.title}
          </h2>
          <p className={styles.lede}>{INTEREST.lede}</p>
        </div>

        <div className={`${ui.panel} ${styles.formWrap}`}>
          {/* Interest list only, never an application. What you would build first, then who you are. */}
          <Form
            className={styles.form}
            submitLabel={INTEREST.submit}
            thanks={INTEREST.thanks}
            turnstile="fund-interest"
            onSubmit={(values) => api<{ ok: true }>('/fund-interest', { body: values })}
          >
            <Field label={fields.target.label}>
              <input
                className={inputClass}
                name="target"
                placeholder={fields.target.placeholder}
                maxLength={200}
                required
              />
            </Field>
            <Field label={fields.spend.label}>
              <input
                className={inputClass}
                name="spend"
                placeholder={fields.spend.placeholder}
                maxLength={1000}
                required
              />
            </Field>
            <Field label={fields.amount.label}>
              <Select name="amount" options={FUND_AMOUNTS} placeholder={fields.amount.placeholder} required />
            </Field>
            <Field label={fields.year.label}>
              <Select name="year" options={YEARS} placeholder={fields.year.placeholder} required />
            </Field>
            <Field label={fields.name.label}>
              <input className={inputClass} name="name" autoComplete="name" maxLength={80} required />
            </Field>
            <Field label={fields.email.label}>
              <input
                className={inputClass}
                name="email"
                type="email"
                autoComplete="email"
                placeholder={fields.email.placeholder}
                maxLength={254}
                required
              />
            </Field>
          </Form>
          <PrivacyNote className={styles.privacy} text={INTEREST.privacy} />
        </div>
      </section>
    </div>
  )
}
