import type { CSSProperties } from 'react'
import { Field, Form } from '../components/Form'
import { BU_EMAIL_PATTERN, inputClass } from '../components/formFields'
import { AsciiFigure } from '../components/motion/AsciiFigure'
import { PageIntro } from '../components/PageIntro'
import { PrivacyNote } from '../components/PrivacyNote'
import { Select } from '../components/Select'
import ui from '../components/ui.module.css'
import { GRANTS_INTRO, IGNITE, INTEREST, PLAN, ROUTE, STATUS } from '../content/grants'
import { api } from '../lib/api'
import { asciiDrawing, hash } from '../lib/glyphArt'
import { FUND_AMOUNTS, YEARS } from '../../shared/constants'
import styles from './Grants.module.css'

type Pen = (ctx: CanvasRenderingContext2D) => void

/**
 * A sign for each stop, as pen strokes in a -1..1 square: a question, a yes, the way there, and
 * play. They're drawn in the field's characters.
 */
const SIGNS: Record<'ask' | 'yes' | 'go' | 'demo', Pen> = {
  ask: (ctx) => {
    ctx.beginPath()
    ctx.arc(0, -0.38, 0.4, Math.PI * 0.95, Math.PI * 2.5)
    ctx.lineTo(0, 0.3)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0.72, 0.17, 0, Math.PI * 2)
    ctx.fill()
  },
  yes: (ctx) => {
    ctx.beginPath()
    ctx.moveTo(-0.64, 0.06)
    ctx.lineTo(-0.2, 0.52)
    ctx.lineTo(0.66, -0.52)
    ctx.stroke()
  },
  go: (ctx) => {
    ctx.beginPath()
    ctx.moveTo(-0.7, 0)
    ctx.lineTo(0.66, 0)
    ctx.moveTo(0.18, -0.48)
    ctx.lineTo(0.68, 0)
    ctx.lineTo(0.18, 0.48)
    ctx.stroke()
  },
  demo: (ctx) => {
    ctx.beginPath()
    ctx.moveTo(-0.4, -0.58)
    ctx.lineTo(0.56, 0)
    ctx.lineTo(-0.4, 0.58)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  },
}

/** The stops' signs, in order. */
const STOP_SIGNS = ['ask', 'yes', 'go', 'demo'] as const

/** Rows of glyphs in a sign: enough that a curve reads as a curve. */
const SIGN_ROWS = 28

const sign = (name: keyof typeof SIGNS) => asciiDrawing(name, SIGNS[name], SIGN_ROWS)

/**
 * The line between the ticket's two places, in the field's characters: `=` rails with the odd `+`
 * and `#`. Long enough to cross the widest ticket; the rest is clipped.
 */
const RAIL = Array.from({ length: 200 }, (_, i) => {
  const v = hash(i, 2)
  return v > 0.92 ? '#' : v > 0.8 ? '+' : '='
}).join('')

/** The stub's code: bars and gaps in the same characters, a few rows deep so the bars join up. */
const CODE = Array.from({ length: 56 }, (_, i) => (hash(i, 9) > 0.42 ? '|' : ' ')).join('')

/**
 * The fund's coming-soon page, on plain harbor like the other inner pages. The plan is printed as
 * the thing it pays for, a ticket; then the way it'll work as a row of signs in the field's
 * characters; then Ignite side by side; then the interest list.
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
            <span className={styles.rail} aria-hidden="true">
              {RAIL}
            </span>
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
          <p className={styles.code} aria-hidden="true">
            {CODE}
            {'\n'}
            {CODE}
            {'\n'}
            {CODE}
          </p>
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

        {/* The page's one motion: each sign develops out of loose glyphs, one after the other. */}
        <ol className={styles.steps}>
          {ROUTE.stops.map((stop, index) => (
            <li key={stop.title} className={styles.stop} style={{ '--col': index } as CSSProperties}>
              <AsciiFigure lines={sign(STOP_SIGNS[index]!)} delay={index * SIGN_DELAY} className={styles.sign} />
              <h3 className={styles.stopTitle}>{stop.title}</h3>
              <p className={styles.stopText}>{stop.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="ignite">
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

      <section id="interest" className={`${styles.section} ${styles.interest}`} aria-labelledby="interest-title">
        <div className={styles.head}>
          <h2 id="interest-title" className={styles.subtitle}>
            {INTEREST.title}
          </h2>
          <p className={styles.lede}>{INTEREST.lede}</p>
        </div>

        <div className={`${ui.panel} ${styles.formWrap}`}>
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

/** Milliseconds between one sign starting to develop and the next. */
const SIGN_DELAY = 180
