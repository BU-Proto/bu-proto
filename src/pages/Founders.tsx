import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { Field, Form } from '../components/Form'
import { inputClass } from '../components/formFields'
import { PageIntro } from '../components/PageIntro'
import { PrivacyNote } from '../components/PrivacyNote'
import { SampleTag } from '../components/SampleTag'
import { Select } from '../components/Select'
import ui from '../components/ui.module.css'
import {
  FOUNDERS_FOR,
  FOUNDERS_FORM,
  FOUNDERS_GET,
  FOUNDERS_HEAD,
  FOUNDERS_INTRO,
  FOUNDERS_OPEN,
  FOUNDERS_STEPS,
} from '../content/founders'
import { api } from '../lib/api'
import { FOUNDER_COMMITMENTS, FOUNDER_STAGES } from '../../shared/constants'
import styles from './Founders.module.css'

/** Step numbers as the rest of the site shows them: 01, 02. */
const stepNumber = (index: number) => String(index + 1).padStart(2, '0')

/**
 * The Founders Circle: the one invite-only part of Proto. Who it's for on colour tiles, what
 * members get, the way in as four numbered steps, a plain line that the rest of Proto stays open,
 * and the application.
 */
export function Founders() {
  const { fields } = FOUNDERS_FORM

  return (
    <div className={styles.page}>
      <PageIntro intro={FOUNDERS_INTRO}>
        <p className={styles.badge} data-fog-clear>
          {FOUNDERS_HEAD.badge}
        </p>
        <div className={styles.headActions} data-fog-clear="box">
          <a className={`${ui.primary} ${styles.applyButton}`} href="#apply">
            {FOUNDERS_HEAD.apply}
          </a>
          <a className={ui.secondary} href="#how">
            {FOUNDERS_HEAD.how}
          </a>
        </div>
      </PageIntro>

      <section className={styles.block} aria-labelledby="circle-for">
        <header className={styles.head}>
          <h2 id="circle-for" className={styles.subtitle}>
            {FOUNDERS_FOR.title}
          </h2>
          <p className={styles.lede}>{FOUNDERS_FOR.lede}</p>
        </header>
        <ul className={styles.tiles}>
          {FOUNDERS_FOR.items.map((item) => (
            <li key={item.text} className={styles.tile} data-tone={item.tone}>
              {item.text}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="circle-get">
        <header className={styles.head}>
          <h2 id="circle-get" className={styles.subtitle}>
            {FOUNDERS_GET.title}
          </h2>
          <p className={styles.lede}>{FOUNDERS_GET.note}</p>
        </header>
        <ul className={styles.perks}>
          {FOUNDERS_GET.items.map((perk) => (
            <li key={perk.title} className={styles.perk}>
              <h3 className={styles.perkTitle}>
                {perk.title}
                <SampleTag show={perk.placeholder} />
              </h3>
              <p className={styles.perkText}>{perk.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="how" className={styles.block} aria-labelledby="circle-steps">
        <header className={styles.head}>
          <h2 id="circle-steps" className={styles.subtitle}>
            {FOUNDERS_STEPS.title}
          </h2>
        </header>
        <ol className={styles.steps}>
          {FOUNDERS_STEPS.items.map((step, index) => (
            <li key={step.title} className={styles.step} style={{ '--i': index } as CSSProperties}>
              <span className={styles.stepNumber} aria-hidden="true">
                {stepNumber(index)}
              </span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </li>
          ))}
        </ol>
        <p className={styles.open}>
          {FOUNDERS_OPEN.text}{' '}
          <Link className={ui.textLink} to={FOUNDERS_OPEN.link.href}>
            {FOUNDERS_OPEN.link.label}
          </Link>
        </p>
      </section>

      <section id="apply" className={`${styles.block} ${styles.apply}`} aria-labelledby="circle-apply">
        <header className={styles.head}>
          <h2 id="circle-apply" className={styles.subtitle}>
            {FOUNDERS_FORM.title}
          </h2>
          <p className={styles.lede}>{FOUNDERS_FORM.lede}</p>
        </header>

        <div className={`${ui.panel} ${styles.formWrap}`}>
          <Form
            className={styles.form}
            submitLabel={FOUNDERS_FORM.submit}
            thanks={FOUNDERS_FORM.thanks}
            turnstile="founders-apply"
            onSubmit={(values) => api<{ ok: true }>('/founders/apply', { body: values })}
          >
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
            <Field label={fields.company.label}>
              <input className={inputClass} name="company" autoComplete="organization" maxLength={120} required />
            </Field>
            <Field label={fields.school.label} hint={fields.school.hint}>
              <input className={inputClass} name="school" maxLength={120} />
            </Field>
            <Field label={fields.stage.label}>
              <Select name="stage" options={FOUNDER_STAGES} placeholder={fields.stage.placeholder} required />
            </Field>
            <Field label={fields.commitment.label}>
              <Select name="commitment" options={FOUNDER_COMMITMENTS} placeholder={fields.commitment.placeholder} required />
            </Field>
            <Field label={fields.link.label} hint={fields.link.hint} wide>
              <input className={inputClass} name="link" inputMode="url" placeholder={fields.link.placeholder} maxLength={300} />
            </Field>
            <Field label={fields.building.label} wide>
              <textarea className={inputClass} name="building" maxLength={1000} rows={4} required />
            </Field>
            <Field label={fields.progress.label} hint={fields.progress.hint} wide>
              <textarea className={inputClass} name="progress" maxLength={1000} rows={4} required />
            </Field>
            <Field label={fields.team.label} hint={fields.team.hint} wide>
              <textarea className={inputClass} name="team" maxLength={500} rows={2} />
            </Field>
            <Field label={fields.help.label} hint={fields.help.hint} wide>
              <textarea className={inputClass} name="help" maxLength={600} rows={2} />
            </Field>
          </Form>
          <PrivacyNote className={styles.privacy} text={FOUNDERS_FORM.privacy} />
        </div>
      </section>
    </div>
  )
}
