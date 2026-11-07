import { Field, Form } from '../components/Form'
import { BU_EMAIL_PATTERN, inputClass } from '../components/formFields'
import { MaskLines } from '../components/motion/MaskLines'
import { PageIntro } from '../components/PageIntro'
import { PrivacyNote } from '../components/PrivacyNote'
import { Select } from '../components/Select'
import ui from '../components/ui.module.css'
import { JOIN_FORM, JOIN_INTRO, JOIN_THANKS, PERKS } from '../content/join'
import { api } from '../lib/api'
import { TRACKS, YEARS } from '../../shared/constants'
import styles from './Join.module.css'

export function Join() {
  return (
    <div className={ui.page}>
      <PageIntro intro={JOIN_INTRO} />

      <div className={styles.layout}>
        <section className={styles.perks} aria-labelledby="perks">
          <h2 id="perks" className={ui.h2}>
            <MaskLines text={JOIN_FORM.perksTitle} />
          </h2>
          <ul className={ui.pts}>
            {PERKS.map((perk, index) => (
              <li key={perk.title}>
                <span className={ui.n} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className={styles.perk}>
                  <h3 className={styles.perkTitle}>{perk.title}</h3>
                  <p className={styles.perkText}>{perk.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className={styles.side}>
          <section className={ui.panel} aria-labelledby="join-form">
            <h2 id="join-form" className={`${ui.h2} ${styles.formTitle}`}>
              <MaskLines text={JOIN_FORM.title} />
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
      </div>
    </div>
  )
}
