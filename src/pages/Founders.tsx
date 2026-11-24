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
  FOUNDERS_FOR,
  FOUNDERS_FORM,
  FOUNDERS_GET,
  FOUNDERS_HEAD,
  FOUNDERS_INTRO,
  FOUNDERS_OPEN,
  FOUNDERS_RECORD,
  FOUNDERS_STARTUPS,
  FOUNDERS_STEPS,
} from '../content/founders'
import { api } from '../lib/api'
import { winPath } from '../lib/paths'
import { tallyWins } from '../lib/wins'
import { FOUNDER_COMMITMENTS, FOUNDER_STAGES } from '../../shared/constants'
import styles from './Founders.module.css'

/** Numbers as the rest of the site shows them: 01, 02. */
const number = (index: number) => String(index + 1).padStart(2, '0')

/** "Oct 2026" from yyyy-mm-dd, or nothing when the date isn't known. */
function monthYear(date: string): string {
  if (!date) return ''
  const [year, month] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** The record: one line counted from the wins, then every win as a ruled row, newest first. */
function Record({ wins }: { wins: readonly Win[] }) {
  const tally = tallyWins(wins)
  const dated = wins.filter((win) => win.date).map((win) => win.date).sort()
  const since = dated[0]?.slice(0, 4)

  return (
    <section className={styles.block} aria-labelledby="circle-record">
      <header className={styles.head}>
        <h2 id="circle-record" className={styles.subtitle}>
          {FOUNDERS_RECORD.title}
        </h2>
        {since && <p className={styles.lede}>{FOUNDERS_RECORD.lede(since)}</p>}
      </header>
      {wins.length === 0 ? (
        <p className={styles.lede}>{FOUNDERS_RECORD.empty}</p>
      ) : (
        <>
          <p className={styles.tally}>
            <span>
              <b>{tally.wins}</b> {FOUNDERS_RECORD.wins(tally.wins)}
            </span>
            <span>
              <b>{tally.hackathons}</b> {FOUNDERS_RECORD.events(tally.hackathons)}
            </span>
            <span>
              <b>{tally.builders}</b> {FOUNDERS_RECORD.builders(tally.builders)}
            </span>
          </p>
          <ol className={styles.record}>
            {wins.map((win) => (
              <li key={win.id} className={styles.recordRow}>
                <Link className={styles.recordLink} to={winPath(win)}>
                  <span className={styles.recordProject}>{win.project}</span>
                  <span className={styles.recordPrize}>{win.placement}</span>
                  <span className={styles.recordEvent}>{win.event}</span>
                  <span className={styles.recordDate}>{monthYear(win.date)}</span>
                </Link>
              </li>
            ))}
          </ol>
          <p className={styles.more}>
            <Link className={ui.textLink} to={FOUNDERS_RECORD.link.href}>
              {FOUNDERS_RECORD.link.label}
            </Link>
          </p>
        </>
      )}
    </section>
  )
}

/** The projects named in FOUNDERS_STARTUPS, each with its photo, line and prize from its win. */
function Startups({ wins }: { wins: readonly Win[] }) {
  const picked = FOUNDERS_STARTUPS.projects
    .map((name) => wins.find((win) => win.project.trim().toLowerCase() === name.toLowerCase()))
    .filter((win): win is Win => Boolean(win))
  if (picked.length === 0) return null

  return (
    <section className={styles.block} aria-labelledby="circle-startups">
      <header className={styles.head}>
        <h2 id="circle-startups" className={styles.subtitle}>
          {FOUNDERS_STARTUPS.title}
        </h2>
        <p className={styles.lede}>{FOUNDERS_STARTUPS.lede}</p>
      </header>
      <ul className={styles.startups}>
        {picked.map((win) => (
          <li key={win.id} className={styles.startup}>
            <Link className={styles.startupLink} to={winPath(win)}>
              <div className={styles.startupPicture}>
                {win.photo ? <img src={win.photo} alt="" loading="lazy" decoding="async" /> : <span aria-hidden="true">{win.project.slice(0, 1)}</span>}
              </div>
              <h3 className={styles.startupName}>{win.project}</h3>
              {win.blurb && <p className={styles.startupText}>{win.blurb}</p>}
              <p className={styles.startupWin}>
                <span className={styles.startupPrize}>{win.placement}</span>
                <span>{win.event}</span>
              </p>
              <span className={styles.startupMore}>{FOUNDERS_STARTUPS.more}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * The Founders Circle: the one part of Proto people apply to. Kept quiet on purpose, in plain
 * ink with one amber accent: who gets in, the record, the startups, what members get, the way in,
 * a line that the rest of Proto stays open, and the application.
 */
export function Founders() {
  const all = useLoaderData<Win[]>()
  const wins = all.filter((win) => !win.placeholder)
  const { fields } = FOUNDERS_FORM

  return (
    <div className={styles.page}>
      <PageIntro intro={FOUNDERS_INTRO}>
        <p className={styles.badge} data-fog-clear>
          {FOUNDERS_HEAD.badge}
        </p>
        <div className={styles.headActions} data-fog-clear="box">
          <a className={ui.primary} href="#apply">
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
        <ol className={styles.criteria}>
          {FOUNDERS_FOR.items.map((text, index) => (
            <li key={text} className={styles.criterion}>
              <span className={styles.number} aria-hidden="true">
                {number(index)}
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </section>

      <Record wins={wins} />
      <Startups wins={wins} />

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
            <li key={step.title} className={styles.step}>
              <span className={styles.number} aria-hidden="true">
                {number(index)}
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
