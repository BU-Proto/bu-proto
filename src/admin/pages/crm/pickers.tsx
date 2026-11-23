import type { Org } from '../../../../shared/api'
import ui from '../../admin.module.css'
import type { ControlProps } from '../../components/Field'
import { NEW_ORG } from './data'
import { useSession } from '../../lib/session'
import { initials, teammate } from './format'

// The two pickers People and Orgs share: a teammate as owner, and an org.

interface OwnerSelectProps extends Partial<ControlProps> {
  value: string
  team: string[]
  /** Offer "Nobody yet" (an owner is optional on people and orgs, not on follow-ups). */
  allowNone?: boolean
  onChange: (email: string) => void
}

/** Who on the team looks after this. Keeps a current owner selectable even if they've left the portal. */
export function OwnerSelect({ value, team, allowNone = true, onChange, ...control }: OwnerSelectProps) {
  const options = value && !team.some((email) => email.toLowerCase() === value.toLowerCase()) ? [value, ...team] : team
  return (
    <select className={ui.input} value={value} onChange={(event) => onChange(event.target.value)} {...control}>
      {allowNone && <option value="">Nobody yet</option>}
      {options.map((email) => (
        <option key={email} value={email}>
          {email}
        </option>
      ))}
    </select>
  )
}

interface OrgSelectProps extends Partial<ControlProps> {
  value: number | null
  orgs: Org[]
  /** Called with null for no org, or NEW_ORG when they want to make one. */
  onChange: (value: number | null | typeof NEW_ORG) => void
}

export function OrgSelect({ value, orgs, onChange, ...control }: OrgSelectProps) {
  return (
    <select
      className={ui.input}
      value={value === null ? '' : String(value)}
      onChange={(event) => {
        const next = event.target.value
        onChange(next === '' ? null : next === NEW_ORG ? NEW_ORG : Number(next))
      }}
      {...control}
    >
      <option value="">No org</option>
      {orgs.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
      <option value={NEW_ORG}>New org…</option>
    </select>
  )
}

/** "jose.cruz@…" → "JC", "andres@…" → "A": the email is all the portal knows about a teammate. */
function ownerInitials(email: string): string {
  const parts = (email.split('@')[0] ?? '').split(/[._+-]/).filter(Boolean)
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : (parts[0]?.[0] ?? '?').toUpperCase()
}

/** A teammate's initials in a disc, with their email on hover. Nothing when no one owns it. */
export function OwnerAvatar({ email }: { email: string | null }) {
  const { me } = useSession()
  if (!email) return <span className={ui.dim}>None</span>
  // The signed-in admin's own name is known, so their disc matches the sidebar's.
  const mine = me.name && email.toLowerCase() === me.email.toLowerCase() ? me.name : null
  return (
    <span className={ui.avatar} title={email} aria-label={mine ?? teammate(email)}>
      {mine ? initials(mine) : ownerInitials(email)}
    </span>
  )
}
