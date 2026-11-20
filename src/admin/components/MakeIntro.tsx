import type { Intro } from '../../../shared/api'

// The Make intro dialog: a student (member or lead), a contact, and why. Placeholder from the
// foundation commit.

export interface MakeIntroProps {
  open: boolean
  /** Prefilled from the page it's opened on: a member or lead as the student, a contact as the other side. */
  studentKey?: string | null
  contactKey?: string | null
  onClose: () => void
  onMade?: (intro: Intro) => void
}

export function MakeIntro(_props: MakeIntroProps) {
  return null
}
