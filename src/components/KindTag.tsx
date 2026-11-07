import type { EventKind } from '../../shared/constants'
import { KIND_HUE } from '../content/events'
import type { Hue } from '../content/types'
import ui from './ui.module.css'

/** Weekly, monthly, once a semester: the tag's colour grows with the event. */
const TAG: Record<Hue, string> = { sky: ui.tagBlue!, iris: ui.tagGold!, rose: ui.tagRed! }

/** The kind of event as a tag. */
export function KindTag({ kind }: { kind: EventKind }) {
  return <span className={`${ui.tag} ${TAG[KIND_HUE[kind]]}`}>{kind}</span>
}
