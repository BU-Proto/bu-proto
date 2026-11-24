import { useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import type { Win } from '../../shared/api'
import { Field, Form } from '../components/Form'
import { inputClass } from '../components/formFields'
import { PageIntro } from '../components/PageIntro'
import { PrivacyNote } from '../components/PrivacyNote'
import { SampleTag } from '../components/SampleTag'
import { Select } from '../components/Select'
import ui from '../components/ui.module.css'
import {
  FOUNDERS_FORM,
  FOUNDERS_GET,
  FOUNDERS_HEAD,
  FOUNDERS_INTRO,
  FOUNDERS_NUMBERS,
  FOUNDERS_STARTUPS,
} from '../content/founders'
import { api } from '../lib/api'
import { winPath } from '../lib/paths'
import { reducedMotion } from '../lib/useInView'
import { tallyWins } from '../lib/wins'
import { FOUNDER_COMMITMENTS, FOUNDER_STAGES } from '../../shared/constants'
import styles from './Founders.module.css'

/** The projects named in FOUNDERS_STARTUPS that have a published win, in the order listed. */
function startupsFrom(wins: readonly Win[]): Win[] {
  return FOUNDERS_STARTUPS.projects
    .map((name) => wins.find((win) => win.project.trim().toLowerCase() === name.toLowerCase()))
    .filter((win): win is Win => Boolean(win))
}

/** The numbers, large, in one ruled row: wins, events, builders and startups. */
function Numbers({ wins, startups }: { wins: readonly Win[]; startups: number }) {
  const tally = tallyWins(wins)
  if (tally.wins === 0) return null
  const since = wins.map((win) => win.date).filter(Boolean).sort()[0]?.slice(0, 4)
  const figures = [
    { value: tally.wins, label: FOUNDERS_NUMBERS.wins },
    { value: tally.hackathons, label: FOUNDERS_NUMBERS.events },
    { value: tally.builders, label: FOUNDERS_NUMBERS.builders },
    ...(startups > 0 ? [{ value: startups, label: FOUNDERS_NUMBERS.startups }] : []),
  ]

  return (
    <section className={styles.block} aria-labelledby="circle-numbers">
      <h2 id="circle-numbers" className={ui.srOnly}>
        {FOUNDERS_NUMBERS.title}
      </h2>
      <dl className={styles.numbers}>
        {figures.map((figure) => (
          <div key={figure.label} className={styles.figure}>
            <dt className={styles.figureLabel}>{figure.label}</dt>
            <dd className={styles.figureValue}>{figure.value}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.small}>
        {since && `${FOUNDERS_NUMBERS.since(since)} `}
        <Link className={ui.textLink} to={FOUNDERS_NUMBERS.link.href}>
          {FOUNDERS_NUMBERS.link.label}
        </Link>
      </p>
    </section>
  )
}

/** Arriving at /founders#apply, the application starts open. */
const arrivedToApply = () => typeof window !== 'undefined' && window.location.hash === '#apply'

/**
 * The Founders Circle: the one part of Proto people apply to. It says as little as it can: the
 * numbers, what members get, a few of our startups, and the form with a line on who it's for. The
 * form stays folded away until someone asks for it, so the page stays short for everyone else.
 * Once opened it stays mounted when folded again, so nothing typed is lost.
 */
export function Founders() {
  const wins = useLoaderData<Win[]>().filter((win) => !win.placeholder)
  const startups = startupsFrom(wins)
  const { fields } = FOUNDERS_FORM
  const [applying, setApplying] = useState(arrivedToApply)
  const [opened, setOpened] = useState(arrivedToApply)
  const toggle = (open: boolean) => {
    setApplying(open)
    if (open) setOpened(true)
  }
  /** The button at the top: open the application and bring it into view. */
  const startApplying = () => {
    toggle(true)
    requestAnimationFrame(() =>
      document.getElementById('apply')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }),
    )
  }

  return (
    <div className={styles.page}>
      <PageIntro intro={FOUNDERS_INTRO}>
        <p className={styles.badge} data-fog-clear>
          {FOUNDERS_HEAD.badge}
        </p>
        <div className={styles.headActions} data-fog-clear="box">
          <button type="button" className={ui.primary} onClick={startApplying}>
            {FOUNDERS_HEAD.apply}
          </button>
        </div>
      </PageIntro>

      <Numbers wins={wins} startups={startups.length} />

      <section className={styles.block} aria-labelledby="circle-get">
        <h2 id="circle-get" className={styles.subtitle}>
          {FOUNDERS_GET.title}
        </h2>
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

      {startups.length > 0 && (
        <section className={styles.block} aria-labelledby="circle-startups">
          <h2 id="circle-startups" className={styles.subtitle}>
            {FOUNDERS_STARTUPS.title}
          </h2>
          <ul className={styles.startups}>
            {startups.map((win) => (
              <li key={win.id}>
                <Link className={styles.startup} to={winPath(win)}>
                  <span className={styles.startupPicture}>
                    {win.photo ? <img src={win.photo} alt="" loading="lazy" decoding="async" /> : <span aria-hidden="true">{win.project.slice(0, 1)}</span>}
                  </span>
                  <span className={styles.startupName}>{win.project}</span>
                  <span className={styles.startupPrize}>{win.placement}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="apply" className={`${styles.block} ${styles.apply}`} aria-labelledby="circle-apply">
        <header className={styles.applyHead}>
          <h2 id="circle-apply" className={styles.subtitle}>
            {FOUNDERS_FORM.title}
          </h2>
          {FOUNDERS_FORM.lines.map((line) => (
            <p key={line} className={styles.line}>
              {line}
            </p>
          ))}
          <p className={styles.small}>
            {FOUNDERS_FORM.open.text}{' '}
            <Link className={ui.textLink} to={FOUNDERS_FORM.open.link.href}>
              {FOUNDERS_FORM.open.link.label}
            </Link>
          </p>
          <button
            type="button"
            className={`${applying ? ui.secondary : ui.primary} ${styles.toggle}`}
            aria-expanded={applying}
            aria-controls={opened ? 'apply-form' : undefined}
            onClick={() => toggle(!applying)}
          >
            {applying ? FOUNDERS_FORM.toggle.close : FOUNDERS_FORM.toggle.open}
            <span className={styles.chevron} data-open={applying || undefined} aria-hidden="true" />
          </button>
        </header>

        {opened && (
          <div id="apply-form" className={`${ui.panel} ${styles.formWrap}`} hidden={!applying}>
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
        )}
      </section>
    </div>
  )
}
