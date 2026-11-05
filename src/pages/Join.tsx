import { Field, Form } from '../components/Form'
import { BU_EMAIL_PATTERN, inputClass } from '../components/formFields'
import { PageIntro } from '../components/PageIntro'
import { PrivacyNote } from '../components/PrivacyNote'
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
          <h2 id="perks" className={ui.sectionTitle} data-fog-clear>
            {JOIN_FORM.perksTitle}
          </h2>
          <ul className={styles.perkList}>
            {PERKS.map((perk) => (
              <li key={perk.title} className={styles.perk}>
                <h3 className={styles.perkTitle} data-fog-clear>
                  {perk.title}
                </h3>
                <p className={styles.perkText} data-fog-clear>
                  {perk.text}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className={styles.side}>
          <section className={ui.panel} aria-labelledby="join-form">
            <h2 id="join-form" className={`${ui.sectionTitle} ${styles.formTitle}`} data-fog-clear>
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
                <select className={inputClass} name="year" required defaultValue="">
                  <option value="" disabled>
                    Pick one
                  </option>
                  {YEARS.map((year) => (
                    <option key={year}>{year}</option>
                  ))}
                </select>
              </Field>
              <Field label="Track">
                <select className={inputClass} name="track" required defaultValue="">
                  <option value="" disabled>
                    Pick one
                  </option>
                  {TRACKS.map((track) => (
                    <option key={track}>{track}</option>
                  ))}
                </select>
              </Field>
            </Form>
            <PrivacyNote text={JOIN_FORM.privacy} className={styles.privacy} />
          </section>
        </div>
      </div>
    </div>
  )
}
