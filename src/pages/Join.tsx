import { Field, Form } from '../components/Form'
import { inputClass } from '../components/formFields'
import { PageIntro } from '../components/PageIntro'
import { PrivacyNote } from '../components/PrivacyNote'
import { Select } from '../components/Select'
import ui from '../components/ui.module.css'
import { JOIN_FORM, JOIN_INTRO, JOIN_THANKS, PERKS } from '../content/join'
import { api } from '../lib/api'
import { FIELDS, TRACKS, YEARS } from '../../shared/constants'
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
              <Field label="Email" wide>
                <input
                  className={inputClass}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@school.edu"
                  required
                />
              </Field>
              <Field label={JOIN_FORM.school.label} hint={JOIN_FORM.school.hint} wide>
                <input className={inputClass} name="school" autoComplete="organization" maxLength={120} placeholder={JOIN_FORM.school.placeholder} />
              </Field>
              <Field label={JOIN_FORM.field}>
                <Select name="field" options={FIELDS} required />
              </Field>
              <Field label="Year">
                <Select name="year" options={YEARS} required />
              </Field>
              <Field label="Track" hint={JOIN_FORM.trackHint} wide>
                <Select name="track" options={TRACKS} required />
              </Field>
              <Field label={JOIN_FORM.building.label} hint={JOIN_FORM.building.hint} wide>
                <textarea className={inputClass} name="building" maxLength={500} rows={3} placeholder={JOIN_FORM.building.placeholder} />
              </Field>
            </Form>
            <PrivacyNote text={JOIN_FORM.privacy} className={styles.privacy} />
          </section>
        </div>
      </div>
    </div>
  )
}
