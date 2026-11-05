import { Field, Form } from '../components/Form'
import { BU_EMAIL_PATTERN } from '../components/formFields'
import { PageIntro } from '../components/PageIntro'
import { PrivacyNote } from '../components/PrivacyNote'
import { Select } from '../components/Select'
import ui from '../components/ui.module.css'
import { GRANTS_INTRO, IGNITE, INTEREST, PLAN, STATUS, STEPS } from '../content/grants'
import { api } from '../lib/api'
import { FUND_AMOUNTS, YEARS } from '../../shared/constants'
import styles from './Grants.module.css'

/**
 * The fund's coming-soon page, on one ground: the field over the intro, then harbor to the end.
 * Everything is said as sentences people would actually say. The plan is one sentence read down
 * the page with its small print beside it, the steps walk down like a route, and the interest
 * form is the ask itself, a sentence with blanks.
 */
export function Grants() {
  const { sentence, fields } = INTEREST

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

      {/* The plan as one sentence, a phrase to a line, each with its detail in the margin. */}
      <section className={styles.plan} aria-labelledby="plan">
        <h2 id="plan" className={ui.srOnly}>
          {PLAN.title}
        </h2>
        {PLAN.sentence.map((part) => (
          <div key={part.words} className={styles.gloss}>
            <p className={styles.words}>{part.words}</p>
            <p className={styles.note}>{part.note}</p>
          </div>
        ))}
      </section>

      {/* A real sequence, so it's numbered, and each step sits a little lower than the last. */}
      <section className={styles.how} aria-labelledby="how">
        <div className={styles.head}>
          <h2 id="how" className={styles.subtitle}>
            {STEPS.title}
          </h2>
          <p className={styles.lede}>{STEPS.lede}</p>
        </div>
        <ol className={styles.steps}>
          {STEPS.items.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNo} aria-hidden="true">
                {index + 1}
              </span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Ignite in the small, quiet voice; the plan answering it in the large one. */}
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
        <ul className={styles.pairs}>
          {IGNITE.pairs.map((pair) => (
            <li key={pair.proto} className={styles.pair}>
              <p className={styles.was}>{pair.ignite}</p>
              <p className={styles.will}>{pair.proto}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* The end of the page: the interest list, written as the ask it stands in for. */}
      <section id="interest" className={styles.interest} aria-labelledby="interest-title">
        <div className={styles.head}>
          <h2 id="interest-title" className={styles.subtitle}>
            {INTEREST.title}
          </h2>
          <p className={styles.lede}>{INTEREST.lede}</p>
        </div>

        {/* Interest list only, never an application. */}
        <Form
          className={styles.form}
          submitLabel={INTEREST.submit}
          thanks={INTEREST.thanks}
          turnstile="fund-interest"
          onSubmit={(values) => api<{ ok: true }>('/fund-interest', { body: values })}
        >
          {/* Each blank's label sits under it, like the caption under a line on a paper form. */}
          <p className={styles.sentence}>
            {sentence.before}{' '}
            <Field label={fields.target.label}>
              <input className={styles.blank} name="target" placeholder={fields.target.placeholder} maxLength={200} required />
            </Field>{' '}
            {sentence.by}{' '}
            <Field label={fields.spend.label}>
              <input className={styles.blank} name="spend" placeholder={fields.spend.placeholder} maxLength={1000} required />
            </Field>
            {', '}
            {sentence.for}{' '}
            <Field label={fields.amount.label}>
              <Select className={styles.blank} name="amount" options={FUND_AMOUNTS} placeholder={fields.amount.placeholder} required />
            </Field>
            {sentence.after}
          </p>

          <div className={styles.details}>
            <Field label="Name">
              <input className={styles.blank} name="name" autoComplete="name" maxLength={80} required />
            </Field>
            <Field label="BU email">
              <input
                className={styles.blank}
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
              <Select className={styles.blank} name="year" options={YEARS} required />
            </Field>
          </div>
        </Form>
        <PrivacyNote className={styles.privacy} text={INTEREST.privacy} />
      </section>
    </div>
  )
}
