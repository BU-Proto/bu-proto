import type { EventKind } from '../../shared/constants'
import { KIND_HUE } from '../content/events'
import lui from './landing.module.css'

/**
 * The kind of event, as plain words in its size's colour: sky for the weekly night, iris for the
 * month's one-offs, rose for the semester's demo night. Not a chip.
 */
export function KindTag({ kind }: { kind: EventKind }) {
  return (
    <span className={lui.tag} data-hue={KIND_HUE[kind]}>
      {kind}
    </span>
  )
}
