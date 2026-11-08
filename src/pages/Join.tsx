import { Field, Form } from '../components/Form'
import { BU_EMAIL_PATTERN, inputClass } from '../components/formFields'
import { HeroBloom } from '../components/HeroBloom'
import { MaskLines } from '../components/motion/MaskLines'
import { PrivacyNote } from '../components/PrivacyNote'
import { Select } from '../components/Select'
import { BRAND } from '../content/site'
import { JOIN_FORM, JOIN_INTRO, JOIN_THANKS, PERKS } from '../content/join'
import { api } from '../lib/api'
import { TRACKS, YEARS } from '../../shared/constants'
import styles from './Join.module.css'

/**
 * Joining, set as a moment: the landing's mountains lit behind the page's title, the sign-up sheet in
 * frosted glass over them, then what you get as a row of numbered cards.
 */
export function Join() {
  return (
    <div className={styles.page}>
      <title>{`${JOIN_INTRO.title} · ${BRAND.full}`}</title>

      <section className={styles.stage} aria-labelledby="join-title">
        <HeroBloom shape="beacon" />
        <div className={styles.stageInner}>
          <header className={styles.head}>
            <h1 id="join-title" className={styles.title} data-fog-clear>
              <MaskLines text={JOIN_INTRO.title} delay={100} />
            </h1>
            <p className={styles.lede} data-fog-clear>
              {JOIN_INTRO.lede}
            </p>
          </header>

          <section className={styles.sheet} aria-labelledby="join-form">
            <h2 id="join-form" className={styles.sheetTitle}>
              {JOIN_FORM.title}
            </h2>
            <Form
              submitLabel={JOIN_FORM.submit}
              thanks={JOIN_THANKS}
              turnstile="join"
              onSubmit={(values) => api<{ ok: true }>('/join', { body: values })}
            >
              <Field label="Name" wide>
                <input className={inputClass} name="name" autoComplete="name" required />
              </Field>
              <Field label="BU email" wide>
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
                <Select name="year" options={YEARS} required />
              </Field>
              <Field label="Track">
                <Select name="track" options={TRACKS} required />
              </Field>
            </Form>
            <PrivacyNote text={JOIN_FORM.privacy} className={styles.privacy} />
          </section>
        </div>
      </section>

      <section className={styles.perks} aria-labelledby="perks">
        <h2 id="perks" className={styles.perksTitle}>
          <MaskLines text={JOIN_FORM.perksTitle} />
        </h2>
        <ol className={styles.cards}>
          {PERKS.map((perk, index) => (
            <li key={perk.title} className={styles.card}>
              <span className={styles.number} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className={styles.cardTitle}>{perk.title}</h3>
              <p className={styles.cardText}>{perk.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
