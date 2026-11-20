import { useState } from 'react'
import type { FollowUp, FollowUpInput } from '../../../../shared/crm'
import { api } from '../../../lib/api'
import ui from '../../admin.module.css'
import { Field } from '../../components/Field'
import { useSession } from '../../lib/session'
import { useToast } from '../../lib/toast'
import { toApiError } from '../people/useApi'
import { todayIso } from './format'
import { FormDialog } from './FormDialog'
import { useTeam } from './data'
import { OwnerSelect } from './pickers'

interface SetFollowUpProps {
  open: boolean
  /** Who or what it's about: one of these. */
  personKey?: string | null
  orgId?: number | null
  /** Whose it is to start with: the person's or org's owner, else whoever's making it. */
  ownerEmail?: string | null
  /** "Rachel Kim", for the title. */
  about: string
  onClose: () => void
  onSaved: (followUp: FollowUp) => void
}

/** Something someone on the team owes this person or org, by a day. */
export function SetFollowUp({ open, personKey = null, orgId = null, ownerEmail, about, onClose, onSaved }: SetFollowUpProps) {
  const { me } = useSession()
  const team = useTeam(open)
  const toast = useToast()
  const blank = () => ({ title: '', dueOn: todayIso(3), ownerEmail: ownerEmail || me.email })
  const [values, setValues] = useState(blank)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setValues(blank())
      setIssues({})
      setError('')
    }
  }

  const submit = async () => {
    setBusy(true)
    setIssues({})
    setError('')
    try {
      const body: FollowUpInput = { ...values, personKey, orgId }
      const { item } = await api<{ item: FollowUp }>('/admin/follow-ups', { body })
      toast('Follow-up set')
      onSaved(item)
    } catch (failure) {
      const apiError = toApiError(failure)
      setIssues(apiError.issues)
      setError(apiError.status === 404 ? 'Follow-ups can’t be saved yet.' : apiError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <FormDialog open={open} title={`Follow up with ${about}`} submitLabel="Set follow-up" busy={busy} error={error} onSubmit={submit} onClose={onClose}>
      <Field label="What needs doing" error={issues.title}>
        {(control) => (
          <input
            className={ui.input}
            value={values.title}
            onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Send the sponsor deck"
            maxLength={200}
            {...control}
          />
        )}
      </Field>
      <Field label="By" error={issues.dueOn}>
        {(control) => (
          <input
            className={ui.input}
            type="date"
            value={values.dueOn}
            onChange={(event) => setValues((prev) => ({ ...prev, dueOn: event.target.value }))}
            {...control}
          />
        )}
      </Field>
      <Field label="Whose" error={issues.ownerEmail}>
        {(control) => (
          <OwnerSelect value={values.ownerEmail} team={team} allowNone={false} onChange={(email) => setValues((prev) => ({ ...prev, ownerEmail: email }))} {...control} />
        )}
      </Field>
    </FormDialog>
  )
}
