import type { CSSProperties } from 'react'
import { Field, Form } from '../components/Form'
import { BU_EMAIL_PATTERN } from '../components/formFields'
import { PageIntro } from '../components/PageIntro'
import { PrivacyNote } from '../components/PrivacyNote'
import { Select } from '../components/Select'
import ui from '../components/ui.module.css'
import { GRANTS_INTRO, IGNITE, INTEREST, PLAN, ROUTE, STATUS } from '../content/grants'
import { api } from '../lib/api'
import { hash } from '../lib/glyphArt'
import { useInView } from '../lib/useInView'
import { FUND_AMOUNTS, YEARS } from '../../shared/constants'
import styles from './Grants.module.css'

/**
 * Each stop's colour, read along the field's light as the trip gets bigger (sky, iris, rose), and
 * ending on mint, the site's colour for what's yours: the demo. `tone` is for text, `glow` lights
 * the ground around it.
 */
const STOP_TONES = [
  { '--tone': 'var(--tone-sky)', '--glow': 'var(--glow-sky)' },
  { '--tone': 'var(--tone-iris)', '--glow': 'var(--glow-iris)' },
  { '--tone': 'var(--tone-rose)', '--glow': 'var(--glow-rose)' },
  { '--tone': 'var(--mint)', '--glow': 'var(--mint-rgb)' },
]

/**
 * The route, written in the field's characters: a dense core of `=` rails with the odd `+` and
 * `#`, and a haze of dots either side that thins out the way the field thins out around a bright patch.
 * Long enough to cross the widest page; the rest is clipped.
 */
const glyphRow = (row: number, pick: (v: number) => string) =>
  Array.from({ length: 320 }, (_, i) => pick(hash(i, row))).join('')
const haze = (v: number) => (v > 0.82 ? ':' : v > 0.5 ? '.' : ' ')
const faint = (v: number) => (v > 0.8 ? '.' : ' ')
const rails = (v: number) => (v > 0.92 ? '#' : v > 0.8 ? '+' : '=')
const TRACK = [glyphRow(0, faint), glyphRow(1, haze), glyphRow(2, rails), glyphRow(3, haze), glyphRow(4, faint)]

/**
 * The fund's coming-soon page, on one harbor ground lit by soft pools of the field's own colours.
 * The plan in one line, then the way it'll work drawn as a transit strip map in glyphs, each stop
 * in its own colour, then Ignite side by side, then the interest list.
 */
export function Grants() {
  const { fields } = INTEREST
  // The page's one motion: the route draws itself in once it's on screen.
  const [mapRef, drawn] = useInView<HTMLDivElement>()

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

      <section className={styles.plan} aria-labelledby="plan">
        <h2 id="plan" className={ui.srOnly}>
          {PLAN.title}
        </h2>
        <div className={styles.planLead}>
          <p className={styles.headline}>{PLAN.headline}</p>
          <p className={styles.caveat}>{PLAN.caveat}</p>
        </div>
        <ul className={styles.facts}>
          {PLAN.facts.map((fact) => (
            <li key={fact.title} className={styles.fact}>
              <h3 className={styles.factTitle}>{fact.title}</h3>
              <p className={styles.factText}>{fact.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.route} aria-labelledby="route">
        <div className={styles.head}>
          <h2 id="route" className={styles.subtitle}>
            {ROUTE.title}
          </h2>
          <p className={styles.lede}>{ROUTE.lede}</p>
        </div>

        {/* A strip map, like the one over a train's doors: one line, the stops along it. */}
        <div ref={mapRef} className={styles.map} data-drawn={drawn || undefined}>
          <div className={styles.track} aria-hidden="true">
            {TRACK.map((row, index) => (
              <span key={index} className={styles.trackRow}>
                {row}
              </span>
            ))}
          </div>
          <ol className={styles.stops}>
            {ROUTE.stops.map((stop, index) => (
              <li
                key={stop.title}
                className={styles.stop}
                style={{ ...STOP_TONES[index], '--i': index } as CSSProperties}
              >
                <span className={styles.ring} aria-hidden="true" />
                <h3 className={styles.stopTitle}>{stop.title}</h3>
                <p className={styles.stopText}>{stop.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.ignite} aria-labelledby="ignite">
        <div className={styles.head}>
          <h2 id="ignite" className={styles.subtitle}>
            {IGNITE.title}
          </h2>
          <p className={styles.lede}>
            <a className={ui.textLink} href={IGNITE.link.href} target="_blank" rel="noreferrer">
              {IGNITE.link.label}
            </a>{' '}
            {IGNITE.intro}
          </p>
        </div>
        <table className={styles.compare}>
          <thead>
            <tr>
              <td />
              <th scope="col" className={styles.colIgnite}>
                {IGNITE.heads.ignite}
              </th>
              <th scope="col" className={styles.colProto}>
                {IGNITE.heads.proto}
              </th>
            </tr>
          </thead>
          <tbody>
            {IGNITE.rows.map((row) => (
              <tr key={row.topic}>
                <th scope="row" className={styles.topic}>
                  {row.topic}
                </th>
                <td className={styles.was}>{row.ignite}</td>
                <td className={styles.will}>{row.proto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section id="interest" className={styles.interest} aria-labelledby="interest-title">
        <div className={styles.head}>
          <h2 id="interest-title" className={styles.subtitle}>
            {INTEREST.title}
          </h2>
          <p className={styles.lede}>{INTEREST.lede}</p>
        </div>

        <div className={styles.formWrap}>
          {/* Interest list only, never an application. The trip first, then who you are. */}
          <Form
            className={styles.form}
            submitLabel={INTEREST.submit}
            thanks={INTEREST.thanks}
            turnstile="fund-interest"
            onSubmit={(values) => api<{ ok: true }>('/fund-interest', { body: values })}
          >
            <Field label={fields.target.label}>
              <input
                className={styles.input}
                name="target"
                placeholder={fields.target.placeholder}
                maxLength={200}
                required
              />
            </Field>
            <Field label={fields.spend.label}>
              <input
                className={styles.input}
                name="spend"
                placeholder={fields.spend.placeholder}
                maxLength={1000}
                required
              />
            </Field>
            <Field label={fields.amount.label}>
              <Select
                className={styles.input}
                name="amount"
                options={FUND_AMOUNTS}
                placeholder={fields.amount.placeholder}
                required
              />
            </Field>
            <Field label={fields.year.label}>
              <Select
                className={styles.input}
                name="year"
                options={YEARS}
                placeholder={fields.year.placeholder}
                required
              />
            </Field>
            <Field label={fields.name.label}>
              <input className={styles.input} name="name" autoComplete="name" maxLength={80} required />
            </Field>
            <Field label={fields.email.label}>
              <input
                className={styles.input}
                name="email"
                type="email"
                autoComplete="email"
                placeholder={fields.email.placeholder}
                pattern={BU_EMAIL_PATTERN}
                title="Use your @bu.edu address"
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
