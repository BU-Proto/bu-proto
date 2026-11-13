import { useRef, type MouseEvent } from 'react'
import { Link, useLoaderData } from 'react-router'
import { MAX_ROLE_QUESTIONS, RESUME_MAX_BYTES, RESUME_TYPE, YEARS } from '../../shared/constants'
import { DetailLoadError, Prose } from '../components/DetailPage'
import { FileDrop } from '../components/FileDrop'
import { Field, Form, type FormValues } from '../components/Form'
import { BU_EMAIL_PATTERN, inputClass } from '../components/formFields'
import { PrivacyNote } from '../components/PrivacyNote'
import { RoleList } from '../components/RoleList'
import { SampleTag } from '../components/SampleTag'
import { Select } from '../components/Select'
import ui from '../components/ui.module.css'
import { ROLE_FORM, ROLE_NOT_FOUND, ROLE_PAGE, ROLE_THANKS, ROLES_LIST } from '../content/roles'
import { BRAND } from '../content/site'
import { api } from '../lib/api'
import type { RolePageData } from '../lib/content'
import { formatDay } from '../lib/dates'
import { deadlineOf, roleIsOpen } from '../lib/roles'
import { reducedMotion } from '../lib/useInView'
import styles from './RoleDetail.module.css'

/** The name an answer's field goes by: the key the server's complaint about it comes back under. */
const answerName = (index: number) => `answers.${index}`

/**
 * The application as the multipart form the API takes: the form's text values as they are, and
 * the résumé, which <Form> leaves out of its values because it isn't text.
 */
function toApplication(values: FormValues, resume: File | null) {
  const body = new FormData()
  for (const [key, value] of Object.entries(values)) body.append(key, value)
  if (resume) body.append('resume', resume)
  return body
}

/**
 * One role: what it is and what it takes, the write-up, then the application on a sheet of its
 * own. Once the apply-by day has passed the page stays up, without the form.
 */
export function RoleDetail() {
  const { role, roles } = useLoaderData<RolePageData>()
  const open = roleIsOpen(role)
  const deadline = deadlineOf(role, ROLES_LIST.untilFilled)
  const questions = role.questions.slice(0, MAX_ROLE_QUESTIONS)
  const others = roles.filter((other) => other.id !== role.id && roleIsOpen(other)).slice(0, 3)
  const formRef = useRef<HTMLElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  // The chosen résumé. A ref, since nothing on the page draws from it: it's only read on send.
  const resume = useRef<File | null>(null)

  const toForm = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    formRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
    // Not on touch screens, where focusing would throw the keyboard up over the scroll.
    if (window.matchMedia('(pointer: fine)').matches) nameRef.current?.focus({ preventScroll: true })
  }

  return (
    <article className={`${ui.page} ${styles.page}`}>
      <title>{`${role.title} · ${BRAND.full}`}</title>

      <header className={styles.head} data-ground-after="">
        <Link className={styles.back} to="/roles" data-fog-clear>
          <span aria-hidden="true">←</span> {ROLE_PAGE.back}
        </Link>
        <h1 className={`${ui.introTitle} ${styles.title}`} data-fog-clear>
          {role.title}
          <SampleTag show={role.placeholder} />
        </h1>
        {role.summary && (
          <p className={styles.lede} data-fog-clear>
            {role.summary}
          </p>
        )}

        <dl className={styles.facts}>
          {role.team && (
            <div data-fog-clear>
              <dt>{ROLE_PAGE.facts.team}</dt>
              <dd>{role.team}</dd>
            </div>
          )}
          {role.commitment && (
            <div data-fog-clear>
              <dt>{ROLE_PAGE.facts.commitment}</dt>
              <dd>{role.commitment}</dd>
            </div>
          )}
          <div data-fog-clear>
            <dt>{ROLE_PAGE.facts.applyBy}</dt>
            <dd className={deadline.soon ? styles.soon : undefined}>
              {role.applyBy ? formatDay(role.applyBy) : ROLES_LIST.untilFilled}
              {deadline.soon && <span className={styles.soonNote}>{deadline.text}</span>}
            </dd>
          </div>
        </dl>

        {open && (
          // A plain anchor underneath, so it still lands on the form without JS.
          <a className={`${ui.primary} ${styles.toForm}`} href={`#${ROLE_FORM.id}`} onClick={toForm} data-fog-clear="box">
            {ROLE_PAGE.apply}
          </a>
        )}
      </header>

      {role.description.trim() && (
        <div className={styles.about}>
          <Prose text={role.description} />
        </div>
      )}

      {open ? (
        <section ref={formRef} id={ROLE_FORM.id} className={`${ui.panelDeep} ${styles.apply}`} aria-labelledby="apply-title">
          <div className={styles.applyLead}>
            <h2 id="apply-title" className={ui.sectionTitle}>
              {ROLE_FORM.title}
            </h2>
            <p className={styles.applyFor}>{role.title}</p>
            <p className={styles.applyText}>{ROLE_FORM.text}</p>
            <p className={styles.applyText}>{ROLE_FORM.again}</p>
            <PrivacyNote text={ROLE_FORM.privacy} className={styles.privacy} />
          </div>
          <Form
            // A different role is a different form: nothing typed for one carries to the next.
            key={role.id}
            submitLabel={ROLE_FORM.submit}
            thanks={ROLE_THANKS}
            turnstile="role-application"
            onSubmit={(values) => api<{ ok: true }>(`/roles/${role.id}/apply`, { body: toApplication(values, resume.current) })}
          >
            <Field label="Name">
              <input ref={nameRef} className={inputClass} name="name" autoComplete="name" maxLength={80} required />
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
              <Select name="year" options={YEARS} required />
            </Field>
            <Field label={ROLE_FORM.link.label} hint={ROLE_FORM.link.hint}>
              {/* Text, not type="url": people type "linkedin.com/in/…" and the server adds the https://. */}
              <input className={inputClass} name="link" inputMode="url" autoCapitalize="none" spellCheck={false} maxLength={300} />
            </Field>
            <Field label={ROLE_FORM.resume.label} wide>
              <FileDrop
                name="resume"
                type={RESUME_TYPE}
                extension=".pdf"
                maxBytes={RESUME_MAX_BYTES}
                copy={ROLE_FORM.resume.drop}
                onFile={(file) => {
                  resume.current = file
                }}
                required
              />
            </Field>
            {questions.map((question, index) => (
              <Field key={question} label={question} wide>
                <textarea className={inputClass} name={answerName(index)} maxLength={1500} rows={4} required />
              </Field>
            ))}
          </Form>
        </section>
      ) : (
        <section className={styles.closed} aria-labelledby="closed-title">
          <h2 id="closed-title" className={ui.sectionTitle}>
            {ROLE_PAGE.closed.title}
          </h2>
          <p className={styles.applyText}>{ROLE_PAGE.closed.text(formatDay(role.applyBy))}</p>
          <Link className={ui.primary} to="/roles">
            {ROLE_PAGE.closed.back}
          </Link>
        </section>
      )}

      {others.length > 0 && (
        <section className={styles.others} aria-labelledby="other-roles">
          <h2 id="other-roles" className={ui.sectionTitle}>
            {ROLE_PAGE.others}
          </h2>
          <RoleList roles={others} compact />
        </section>
      )}
    </article>
  )
}

export function RoleLoadError() {
  return <DetailLoadError copy={ROLE_NOT_FOUND} to="/roles" />
}
