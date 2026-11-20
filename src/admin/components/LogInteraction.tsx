import { useState } from 'react'
import { INTERACTION_KINDS, INTERACTION_KIND_LABELS, type FollowUp, type Interaction, type InteractionKind, type PersonLink } from '../../../shared/api'
import { api, ApiError } from '../../lib/api'
import ui from '../admin.module.css'
import { addDays, bostonToday, formatDay, usePickedPerson, useOwners } from '../lib/activity'
import { messageFor, useAuthGuard } from '../lib/session'
import { useToast } from '../lib/toast'
import { Field } from './Field'
import { FormDialog, Segmented } from './FormDialog'
import dialog from './FormDialog.module.css'
import { PersonPicker, type PickedPerson } from './PersonPicker'

// The Log interaction dialog: kind, day, who, what happened, and the next step as a follow-up.
// Opened from Today, a person, an org, a deal and Activity.

export interface LogInteractionProps {
  open: boolean
  /** Who it was with, when opened from their page. */
  personKey?: string | null
  /** Their name, when the page already has it, so the dialog doesn't look them up. */
  person?: PersonLink | null
  orgId?: number | null
  dealId?: number | null
  onClose: () => void
  onLogged?: (result: { item: Interaction; followUp: FollowUp | null }) => void
}

const KIND_OPTIONS = INTERACTION_KINDS.map((kind) => ({ value: kind, label: INTERACTION_KIND_LABELS[kind] }))

export function LogInteraction(props: LogInteractionProps) {
  // Mounted only while open, so each opening starts a fresh form.
  return props.open ? <LogInteractionForm {...props} /> : null
}

function LogInteractionForm({ open, personKey, person: given, orgId = null, dealId = null, onClose, onLogged }: LogInteractionProps) {
  const toast = useToast()
  const guard = useAuthGuard()
  const { owners, me } = useOwners()
  const lookup = usePickedPerson(given || !personKey ? null : personKey)
  const fixed: PickedPerson | null = given
    ? { key: given.key, name: given.name, detail: given.orgName ?? '' }
    : personKey
      ? (lookup.person ?? { key: personKey, name: lookup.failed ? 'This person' : 'Loading…', detail: '' })
      : null

  const [kind, setKind] = useState<InteractionKind>('call')
  const [day, setDay] = useState(bostonToday)
  // undefined: still the person it was opened for; null: cleared to pick someone else.
  const [picked, setPicked] = useState<PickedPerson | null | undefined>(undefined)
  const [summary, setSummary] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [due, setDue] = useState(() => addDays(bostonToday(), 3))
  const [owner, setOwner] = useState(me)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState('')
  const [saving, setSaving] = useState(false)

  const person = picked === undefined ? fixed : picked
  // With a deal or an org to hang it on, who it was with is optional.
  const needsPerson = orgId === null && dealId === null

  async function save() {
    const local: Record<string, string> = {}
    if (needsPerson && !person) local.personKey = 'Pick who it was with.'
    if (!day) local.happenedOn = 'Pick a day.'
    if (nextStep.trim() && !due) local['followUp.dueOn'] = 'Pick a day.'
    if (Object.keys(local).length) {
      setIssues(local)
      setFailure('')
      return
    }
    setSaving(true)
    setFailure('')
    try {
      const result = await api<{ item: Interaction; followUp: FollowUp | null }>('/admin/interactions', {
        body: {
          kind,
          happenedOn: day,
          summary,
          personKey: person?.key ?? null,
          orgId,
          dealId,
          followUp: nextStep.trim() ? { title: nextStep.trim(), dueOn: due, ownerEmail: owner } : null,
        },
      })
      toast({
        text: 'Interaction logged',
        detail: result.followUp ? `Next step due ${formatDay(result.followUp.dueOn)}` : undefined,
      })
      onLogged?.(result)
      onClose()
    } catch (error) {
      if (guard(error)) return
      setIssues(error instanceof ApiError ? error.issues : {})
      setFailure(messageFor(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      open={open}
      title="Log interaction"
      submitLabel="Save"
      busy={saving}
      error={failure}
      note="Shows on their timeline and in Activity."
      onSubmit={save}
      onClose={onClose}
    >
      <fieldset className={ui.field}>
        <legend className={dialog.legend}>Kind</legend>
        <Segmented label="Kind" options={KIND_OPTIONS} value={kind} onChange={setKind} />
      </fieldset>
      <div className={dialog.pairWide}>
        <Field label="With" error={issues.personKey}>
          {(control) => (
            <PersonPicker {...control} value={person} onChange={setPicked} placeholder={needsPerson ? undefined : 'Search People (optional)'} />
          )}
        </Field>
        <Field label="Day" error={issues.happenedOn}>
          {(control) => <input {...control} type="date" className={ui.input} value={day} max={bostonToday()} onChange={(event) => setDay(event.target.value)} />}
        </Field>
      </div>
      <Field label="What happened" error={issues.summary}>
        {(control) => (
          <textarea
            {...control}
            className={ui.input}
            rows={4}
            placeholder="What you talked about, what they asked for."
            value={summary}
            maxLength={8000}
            onChange={(event) => setSummary(event.target.value)}
          />
        )}
      </Field>
      <div className={dialog.pairWide}>
        <Field label="Next step" hint="Optional. Becomes a follow-up." error={issues['followUp.title']}>
          {(control) => (
            <input
              {...control}
              className={ui.input}
              placeholder="Send intro, share deck, invite to event"
              value={nextStep}
              maxLength={200}
              onChange={(event) => setNextStep(event.target.value)}
            />
          )}
        </Field>
        <Field label="Due" error={issues['followUp.dueOn']}>
          {(control) => <input {...control} type="date" className={ui.input} value={due} onChange={(event) => setDue(event.target.value)} />}
        </Field>
      </div>
      {nextStep.trim() && (
        <Field label="Owner" error={issues['followUp.ownerEmail']}>
          {(control) => (
            <select {...control} className={ui.input} value={owner} onChange={(event) => setOwner(event.target.value)}>
              {owners.map((option) => (
                <option key={option.email} value={option.email}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </Field>
      )}
    </FormDialog>
  )
}
