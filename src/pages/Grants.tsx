import { Field, Form } from '../components/Form'
import { BU_EMAIL_PATTERN } from '../components/formFields'
import { MaskLines } from '../components/motion/MaskLines'
import motion from '../components/motion/motion.module.css'
import { useReveal } from '../components/motion/useReveal'
import { PageIntro } from '../components/PageIntro'
import { PixelFlow } from '../components/PixelFlow'
import { PrivacyNote } from '../components/PrivacyNote'
import { Select } from '../components/Select'
import ui from '../components/ui.module.css'
import { GRANTS_INTRO, IGNITE, INTEREST, PLAN, ROUTE, STATUS } from '../content/grants'
import { api } from '../lib/api'
import { FUND_AMOUNTS, YEARS } from '../../shared/constants'
import styles from './Grants.module.css'

/** A list number with its leading zero: 01, 02. */
const numbered = (index: number) => String(index + 1).padStart(2, '0')

/**
 * The fund's coming-soon page. The plan in one line, then the way it'll work drawn as a band of
 * pixels over its four stops, then Ignite side by side on the dark panel, then the interest list.
 */
export function Grants() {
  const { fields } = INTEREST
  const root = useReveal<HTMLDivElement>()

  return (
    <div ref={root} className={`${ui.page} ${motion.reveal} ${styles.page}`}>
      <PageIntro intro={GRANTS_INTRO}>
        {/* Said once, before anything else: there is no money yet. */}
        <p className={styles.status}>
          <strong className={`${ui.tag} ${ui.tagGold} ${styles.statusWord}`}>{STATUS.word}</strong> {STATUS.text}{' '}
          <a className={ui.textLink} href="#interest">
            {STATUS.link}
          </a>
        </p>
      </PageIntro>

      <section className={ui.split} aria-labelledby="plan">
        <h2 id="plan" className={ui.srOnly}>
          {PLAN.title}
        </h2>
        <div className={styles.planLead}>
          <p className={ui.h2}>
            <MaskLines text={PLAN.headline} />
          </p>
          <p className={ui.small} data-reveal>
            {PLAN.caveat}
          </p>
        </div>
        <ul className={ui.pts} data-reveal>
          {PLAN.facts.map((fact, index) => (
            <li key={fact.title}>
              <span className={ui.n} aria-hidden="true">
                {numbered(index)}
              </span>
              <div>
                <h3 className={styles.factTitle}>{fact.title}</h3>
                <p className={styles.factText}>{fact.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.route} aria-labelledby="route">
        <div className={ui.split}>
          <h2 id="route" className={ui.h2}>
            <MaskLines text={ROUTE.title} />
          </h2>
          <p className={ui.body} data-reveal>
            {ROUTE.lede}
          </p>
        </div>

        <PixelFlow variant="bands" />

        <ol className={ui.steps} data-reveal>
          {ROUTE.stops.map((stop, index) => (
            <li key={stop.title} className={ui.step}>
              <div className={ui.stepHead}>
                <span className={ui.badge} aria-hidden="true">
                  {numbered(index)}
                </span>
                <h3 className={ui.stepTitle}>{stop.title}</h3>
              </div>
              <p className={ui.stepText}>{stop.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${ui.dark} ${styles.ignite}`} aria-labelledby="ignite" data-reveal>
        <div className={`${ui.wrap} ${ui.split}`}>
          <div className={styles.igniteHead}>
            <h2 id="ignite" className={ui.darkTitle}>
              {IGNITE.title}
            </h2>
            <p className={styles.igniteLede}>
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
                <th scope="col" className={ui.darkLabel}>
                  {IGNITE.heads.ignite}
                </th>
                <th scope="col" className={`${ui.darkLabel} ${styles.colProto}`}>
                  {IGNITE.heads.proto}
                </th>
              </tr>
            </thead>
            <tbody>
              {IGNITE.rows.map((row) => (
                <tr key={row.topic}>
                  <th scope="row" className={`${ui.darkLabel} ${styles.topic}`}>
                    {row.topic}
                  </th>
                  <td className={styles.was}>{row.ignite}</td>
                  <td className={styles.will}>{row.proto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="interest" className={`${ui.split} ${styles.interest}`} aria-labelledby="interest-title">
        <div className={styles.interestHead}>
          <h2 id="interest-title" className={ui.h2}>
            <MaskLines text={INTEREST.title} />
          </h2>
          <p className={ui.body} data-reveal>
            {INTEREST.lede}
          </p>
        </div>

        <div className={styles.formWrap} data-reveal>
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
