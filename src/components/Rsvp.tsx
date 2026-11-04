// The RSVP for one event: a button that opens a short form, and "You're going" once it's sent.
// The events list and the event's own page both use it; they place the button and the form
// themselves, so the hook (lib/useRsvp) holds the state and the two components share it.

import type { KeyboardEvent } from 'react'
import { RSVP } from '../content/events'
import type { RsvpState } from '../lib/useRsvp'
import { Field, Form } from './Form'
import { inputClass } from './formFields'
import { PrivacyNote } from './PrivacyNote'
import ui from './ui.module.css'
import styles from './Rsvp.module.css'

/** `prominent` sets the RSVP as the main action, as on the event's own page; in a list it stays quiet. */
export function RsvpButton({ rsvp, className, prominent }: { rsvp: RsvpState; className?: string; prominent?: boolean }) {
  const { going, open, setOpen, close, buttonRef, formId } = rsvp
  const extra = className ? ` ${className}` : ''
  if (going) {
    // Already in: nothing left to do here, but it stays focusable so the change is announced.
    return (
      <button ref={buttonRef} type="button" className={`${ui.primary}${extra}`} aria-disabled="true" data-fog-clear="box" data-fog-ignore>
        {RSVP.going}
      </button>
    )
  }
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`${prominent ? ui.primary : ui.secondary}${extra}`}
      aria-expanded={open}
      aria-controls={open ? formId : undefined}
      onClick={() => (open ? close() : setOpen(true))}
      data-fog-clear="box"
      data-fog-ignore
    >
      {RSVP.label}
    </button>
  )
}

/** The form itself, rendered only while it's open. `className` places it. */
export function RsvpForm({ rsvp, className }: { rsvp: RsvpState; className?: string }) {
  const { event, going, open, close, submit, formId } = rsvp
  if (!open || going) return null

  const onKeyDown = (keyEvent: KeyboardEvent) => {
    if (keyEvent.key !== 'Escape') return
    keyEvent.stopPropagation()
    close()
  }

  return (
    <div id={formId} className={className} role="group" aria-label={RSVP.formLabel(event.title)} onKeyDown={onKeyDown}>
      <Form
        submitLabel={RSVP.submit}
        pendingLabel={RSVP.pending}
        turnstile="rsvp"
        onSubmit={submit}
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
      <PrivacyNote text={RSVP.privacy} className={styles.privacy} />
    </div>
  )
}
