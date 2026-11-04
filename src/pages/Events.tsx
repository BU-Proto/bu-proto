import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { useLoaderData } from 'react-router'
import type { ProtoEvent, RsvpResult } from '../../shared/api'
import { Field, Form } from '../components/Form'
import { inputClass } from '../components/formFields'
import { PageIntro } from '../components/PageIntro'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { EVENTS_INTRO, RSVP } from '../content/events'
import { api } from '../lib/api'
import { dateParts, daysUntil, formatMonth } from '../lib/dates'
import styles from './Events.module.css'

const rsvpKey = (id: number) => `proto:rsvp:${id}`

// localStorage throws in some private modes; an RSVP that isn't remembered is still an RSVP.
function rememberedGoing(id: number): boolean {
  try {
    return localStorage.getItem(rsvpKey(id)) === '1'
  } catch {
    return false
  }
}

function rememberGoing(id: number) {
  try {
    localStorage.setItem(rsvpKey(id), '1')
  } catch {
    // Nothing to do: the button still shows the RSVP until the page is left.
  }
}

function EventRow({ event }: { event: ProtoEvent }) {
  const [going, setGoing] = useState(() => rememberedGoing(event.id))
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const formId = useId()
  const { month, day, weekday } = dateParts(event.date)

  const close = () => {
    setOpen(false)
    requestAnimationFrame(() => buttonRef.current?.focus())
  }

  const onKeyDown = (keyEvent: KeyboardEvent) => {
    if (keyEvent.key !== 'Escape') return
    keyEvent.stopPropagation()
    close()
  }

  const rsvp = async (values: Record<string, string>) => {
    await api<RsvpResult>(`/events/${event.id}/rsvp`, { body: values })
    rememberGoing(event.id)
    setGoing(true)
    close()
  }

  return (
    <li className={styles.event}>
      <div className={styles.tile} data-fog-clear="box">
        <span className={styles.tileMonth}>{month}</span>
        <b>{day}</b>
        <span>{weekday}</span>
      </div>

      <div className={styles.body}>
        <p className={styles.kind} data-kind={event.kind} data-fog-clear>
          {event.kind} <SampleTag show={event.placeholder} />
        </p>
        <h3 className={styles.title} data-fog-clear>
          {event.title}
        </h3>
        <p className={styles.meta} data-fog-clear>
          {event.time} · {event.place}
        </p>
        {event.text && (
          <p className={styles.text} data-fog-clear>
            {event.text}
          </p>
        )}
      </div>

      {going ? (
        // Already in: nothing left to do here, but it stays focusable so the change is announced.
        <button ref={buttonRef} type="button" className={ui.primary} aria-disabled="true" data-fog-clear="box" data-fog-ignore>
          {RSVP.going}
        </button>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          className={ui.secondary}
          aria-expanded={open}
          aria-controls={open ? formId : undefined}
          onClick={() => (open ? close() : setOpen(true))}
          data-fog-clear="box"
          data-fog-ignore
        >
          {RSVP.label}
        </button>
      )}

      {open && !going && (
        <div
          id={formId}
          className={`${ui.inset} ${styles.rsvp}`}
          role="group"
          aria-label={RSVP.formLabel(event.title)}
          onKeyDown={onKeyDown}
        >
          <Form
            submitLabel={RSVP.submit}
            pendingLabel={RSVP.pending}
            onSubmit={rsvp}
            actions={
              <button type="button" className={ui.secondary} onClick={close} data-fog-clear="box">
                {RSVP.cancel}
              </button>
            }
          >
            <Field label="Name">
              {/* The person just asked for this form, so going straight to its first field is expected. */}
              <input className={inputClass} name="name" autoComplete="name" required autoFocus />
            </Field>
            <Field label="Email" hint={RSVP.hint}>
              <input className={inputClass} name="email" type="email" autoComplete="email" required />
            </Field>
          </Form>
        </div>
      )}
    </li>
  )
}

/** Upcoming events, grouped under month headings. */
export function Events() {
  const events = useLoaderData<ProtoEvent[]>()
  const upcoming = events
    .filter((event) => daysUntil(event.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
  const months = new Map<string, ProtoEvent[]>()
  for (const event of upcoming) {
    const month = formatMonth(event.date)
    months.set(month, [...(months.get(month) ?? []), event])
  }

  return (
    <div className={ui.page}>
      <PageIntro intro={EVENTS_INTRO} />

      {months.size === 0 && (
        <p className={ui.panel} data-fog-clear>
          {RSVP.empty}
        </p>
      )}

      {[...months].map(([month, monthEvents]) => (
        <section key={month} className={styles.month} aria-label={month}>
          <h2 className={styles.monthName} data-fog-clear>
            {month}
          </h2>
          <ol className={`${ui.panel} ${styles.list}`}>
            {monthEvents.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
