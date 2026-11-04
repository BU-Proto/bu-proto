import { Field, Form } from '../components/Form'
import { BU_EMAIL_PATTERN, inputClass } from '../components/formFields'
import { CoverIcon } from '../components/icons'
import { PageIntro } from '../components/PageIntro'
import ui from '../components/ui.module.css'
import {
  AMOUNTS,
  COMPARISON,
  COVERS,
  GRANTS_INTRO,
  INTEREST,
  SECTION_TITLES,
  STATUS,
  STEPS,
  THE_ASK,
} from '../content/grants'
import { api } from '../lib/api'
import { FUND_AMOUNTS, YEARS } from '../../shared/constants'
import styles from './Grants.module.css'

/** The fund's coming-soon page: the plan, then an interest list. Not an application. */
export function Grants() {
  return (
    <div className={ui.page}>
      <PageIntro intro={GRANTS_INTRO}>
        <p className={styles.status}>
          <span className={styles.badge} data-fog-clear="box">
            {STATUS.badge}
          </span>
          <span className={styles.statusNote} data-fog-clear>
            {STATUS.note}
          </span>
        </p>
      </PageIntro>

      <div className={styles.top}>
        <section className={ui.panel} aria-labelledby="covers">
          <h2 id="covers" className={ui.eyebrow} data-fog-clear>
            {SECTION_TITLES.covers}
          </h2>
          <ul className={styles.covers}>
            {COVERS.map((cover) => (
              <li key={cover.title} className={ui.inset}>
                <CoverIcon name={cover.icon} className={styles.coverIcon} />
                <h3 className={styles.coverTitle} data-fog-clear>
                  {cover.title}
                </h3>
                <p className={styles.coverText} data-fog-clear>
                  {cover.text}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${ui.panelDeep} ${styles.amounts}`} aria-labelledby="amounts">
          <h2 id="amounts" className={ui.eyebrow} data-fog-clear>
            {AMOUNTS.label}
          </h2>
          <p className={styles.range} data-fog-clear>
            <span>${AMOUNTS.min}</span>
            <span className={styles.rangeTo} aria-label="to">
              →
            </span>
            <span>${AMOUNTS.max}</span>
          </p>
          <div className={styles.scale} aria-hidden="true">
            <span className={styles.scaleFill} />
          </div>
          <p className={styles.planned} data-fog-clear>
            <span className={styles.plannedTag}>planned</span> {AMOUNTS.note}
          </p>
        </section>
      </div>

      <section className={ui.panel} aria-labelledby="how">
        <h2 id="how" className={ui.eyebrow} data-fog-clear>
          {SECTION_TITLES.how}
        </h2>
        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNo} aria-hidden="true" data-fog-clear="box">
                {index + 1}
              </span>
              <h3 className={styles.stepTitle} data-fog-clear>
                {step.title}
              </h3>
              <p className={styles.stepText} data-fog-clear>
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.ask} aria-labelledby="ask">
        <h2 id="ask" className={ui.eyebrow} data-fog-clear>
          {THE_ASK.title}
        </h2>
        <blockquote className={styles.quote} data-fog-clear>
          {THE_ASK.quote}
        </blockquote>
        <p className={styles.askText} data-fog-clear>
          {THE_ASK.text}
        </p>
      </section>

      <section className={ui.panelDeep} aria-labelledby="compare">
        <div className={ui.sectionHead}>
          <h2 id="compare" className={ui.sectionTitle} data-fog-clear>
            {COMPARISON.title}
          </h2>
          <p className={ui.sectionLede} data-fog-clear>
            {COMPARISON.lede}{' '}
            <a className={ui.textLink} href={COMPARISON.source.href} target="_blank" rel="noreferrer">
              {COMPARISON.source.label} <span aria-hidden="true">↗</span>
            </a>
          </p>
        </div>
        <table className={styles.compare}>
          <thead>
            <tr>
              <td />
              <th scope="col" data-fog-clear>
                {COMPARISON.columns.ignite}
              </th>
              <th scope="col" className={styles.us} data-fog-clear>
                {COMPARISON.columns.proto} <span className={styles.plannedTag}>planned</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" data-fog-clear>
                  {row.label}
                </th>
                <td data-fog-clear>{row.ignite}</td>
                <td className={styles.us} data-fog-clear>
                  {row.proto}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={`${ui.panel} ${styles.interest}`} aria-labelledby="interest">
        <div className={styles.interestHead}>
          <h2 id="interest" className={ui.sectionTitle} data-fog-clear>
            {INTEREST.title}
          </h2>
          <p className={ui.sectionLede} data-fog-clear>
            {INTEREST.lede}
          </p>
        </div>

        {/* Interest list only, never an application. */}
        <Form
          submitLabel={INTEREST.submit}
          thanks={INTEREST.thanks}
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
          <Field label="Which hackathon or project" wide>
            <input className={inputClass} name="target" placeholder="e.g. TreeHacks, or a hardware side project" required />
          </Field>
          <Field label="What you’d spend it on" wide>
            <textarea className={inputClass} name="spend" placeholder="Bus tickets, entry fee, API credits, parts…" required />
          </Field>
        </Form>
      </section>
    </div>
  )
}
