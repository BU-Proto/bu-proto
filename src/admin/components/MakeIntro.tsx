import { useState } from 'react'
import { INTRO_STATUSES, INTRO_STATUS_LABELS, type Intro, type IntroStatus } from '../../../shared/api'
import { api, ApiError } from '../../lib/api'
import ui from '../admin.module.css'
import { usePickedPerson } from '../lib/activity'
import { messageFor, useAuthGuard } from '../lib/session'
import { useToast } from '../lib/toast'
import { Field } from './Field'
import { FormDialog } from './FormDialog'
import dialog from './FormDialog.module.css'
import { PersonPicker, type PickedPerson } from './PersonPicker'

// The Make intro dialog: a student (member or lead), a contact, and why.

export interface MakeIntroProps {
  open: boolean
  /** Prefilled from the page it's opened on: a member or lead as the student, a contact as the other side. */
  studentKey?: string | null
  contactKey?: string | null
  onClose: () => void
  onMade?: (intro: Intro) => void
}

export function MakeIntro(props: MakeIntroProps) {
  // Mounted only while open, so each opening starts a fresh form.
  return props.open ? <MakeIntroForm {...props} /> : null
}

/** A picker's value: the prefilled person until it's changed. */
function usePrefilled(key: string | null | undefined) {
  const lookup = usePickedPerson(key)
  const [picked, setPicked] = useState<PickedPerson | null | undefined>(undefined)
  const prefilled = key ? (lookup.person ?? { key, name: lookup.failed ? 'This person' : 'Loading…', detail: '' }) : null
  return [picked === undefined ? prefilled : picked, setPicked] as const
}

function MakeIntroForm({ open, studentKey, contactKey, onClose, onMade }: MakeIntroProps) {
  const toast = useToast()
  const guard = useAuthGuard()
  const [student, setStudent] = usePrefilled(studentKey)
  const [contact, setContact] = usePrefilled(contactKey)
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<IntroStatus>('drafting')
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    const local: Record<string, string> = {}
    if (!student) local.studentKey = 'Pick a member or a lead.'
    if (!contact) local.contactKey = 'Pick who they meet.'
    if (!student || !contact) {
      setIssues(local)
      setFailure('')
      return
    }
    setSaving(true)
    setFailure('')
    try {
      const { item } = await api<{ item: Intro }>('/admin/intros', {
        body: { studentKey: student.key, contactKey: contact.key, reason, status },
      })
      toast({ text: 'Intro logged', detail: `${item.student.name} to ${item.contact.name}` })
      onMade?.(item)
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
      title="Make an intro"
      submitLabel="Log intro"
      busy={saving}
      error={failure}
      note="Only the reason and the outcome are kept. Keep anything private out of it."
      onSubmit={save}
      onClose={onClose}
    >
      <div className={dialog.pair}>
        <Field label="Student" error={issues.studentKey}>
          {(control) => (
            <PersonPicker {...control} value={student} onChange={setStudent} kinds={['member', 'lead']} exclude={contact ? [contact.key] : undefined} placeholder="A member or a lead" />
          )}
        </Field>
        <Field label="Introduce to" error={issues.contactKey}>
          {(control) => (
            <PersonPicker {...control} value={contact} onChange={setContact} kinds={['contact', 'alum']} exclude={student ? [student.key] : undefined} placeholder="A contact" />
          )}
        </Field>
      </div>
      <div className={dialog.pairWide}>
        <Field label="Why" error={issues.reason}>
          {(control) => (
            <input {...control} className={ui.input} placeholder="Pre-seed, hardware" value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} />
          )}
        </Field>
        <Field label="Status" error={issues.status}>
          {(control) => (
            <select {...control} className={ui.input} value={status} onChange={(event) => setStatus(event.target.value as IntroStatus)}>
              {INTRO_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {INTRO_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
    </FormDialog>
  )
}
