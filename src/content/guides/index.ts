// Every written guide's text, by slug. Only the guide route imports this, and it's loaded lazily,
// so none of the long copy ships with the rest of the site.

import { AFTER } from './after'
import { BREAKDOWN_GUIDE } from './breakdowns'
import { DEMO } from './demo'
import { FIRST_HACKATHON } from './firstHackathon'
import { HOW_TO_WIN } from './howToWin'
import { IDEAS } from './ideas'
import { JUDGING } from './judging'
import { SHIPPING } from './shipping'
import { TEAM } from './team'
import type { GuideDoc } from './types'
import { WRITE_UP } from './writeUp'

const DOCS: readonly GuideDoc[] = [
  HOW_TO_WIN,
  FIRST_HACKATHON,
  TEAM,
  IDEAS,
  SHIPPING,
  DEMO,
  WRITE_UP,
  JUDGING,
  AFTER,
  BREAKDOWN_GUIDE,
]

export const GUIDE_DOCS: ReadonlyMap<string, GuideDoc> = new Map(DOCS.map((doc) => [doc.slug, doc]))
