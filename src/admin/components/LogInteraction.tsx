import type { FollowUp, Interaction } from '../../../shared/api'

// The Log interaction dialog: kind, day, who, what happened, and the next step as a follow-up.
// Opened from Today, a person, an org, a deal and Activity. Placeholder from the foundation commit.

export interface LogInteractionProps {
  open: boolean
  /** Who it was with, when opened from their page. */
  personKey?: string | null
  orgId?: number | null
  dealId?: number | null
  onClose: () => void
  onLogged?: (result: { item: Interaction; followUp: FollowUp | null }) => void
}

export function LogInteraction(_props: LogInteractionProps) {
  return null
}
