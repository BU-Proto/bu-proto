// Who can change what in the portal. Everyone signed in reads everything; what they can change
// depends on their level and, on the board, the areas their seat looks after. Plain values only,
// so the portal and the Worker both import this.
//
//   owner  in ADMIN_EMAILS: changes everything, can't be removed in the portal
//   admin  changes everything (what every added admin could do before roles existed)
//   board  shared work, plus the areas they hold
//   team   shared work only: scouts, event helpers, anyone helping without a seat
//
// Shared work is the day-to-day CRM: People and contacts, Orgs (but not their logo-wall spot),
// interactions, follow-ups, intros, asks and the one-to-one Inbox, triaging sign-ups and board
// interest, checking people in at an event, and members' notes.

export const ADMIN_LEVELS = ['admin', 'board', 'team'] as const
export type AdminLevel = (typeof ADMIN_LEVELS)[number]
export type AccessLevel = 'owner' | AdminLevel

export const ADMIN_LEVEL_LABELS: Record<AccessLevel, string> = {
  owner: 'Owner',
  admin: 'Admin',
  board: 'Board',
  team: 'Team',
}

/**
 * The parts of Proto a board seat looks after.
 *   partnerships  Pipeline (deals), an org's logo-wall spot
 *   fund          fund requests: status, decisions, payouts
 *   community     events (and their guests), hackathons, imports of either, list email and automatic email
 *   scouting      wins and the Devpost import
 * Everything else that isn't shared work (board members, roles and applications, admins, the
 * hackathon import runs' settings) is 'admin': owners and admins only.
 */
export const AREAS = ['partnerships', 'fund', 'community', 'scouting'] as const
export type Area = (typeof AREAS)[number]

export const AREA_LABELS: Record<Area, string> = {
  partnerships: 'Partnerships',
  fund: 'Fund',
  community: 'Community',
  scouting: 'Scouting',
}

/** The seat that usually holds an area. */
export const AREA_SEATS: Record<Area, string> = {
  partnerships: 'Head of Partnerships',
  fund: 'Head of the Fund',
  community: 'Head of Community',
  scouting: 'Head of Scouting',
}

/** What an area covers, in a few words, for the Access page. */
export const AREA_COVERS: Record<Area, string> = {
  partnerships: 'Pipeline and logo walls',
  fund: 'Fund requests and payouts',
  community: 'Events, hackathons and list email',
  scouting: 'Wins',
}

/** What a change needs: shared work, one area, or full access. */
export type Gate = 'shared' | Area | 'admin'

export interface Access {
  level: AccessLevel
  areas: readonly Area[]
}

/** Whether someone with this access may make a change behind this gate. */
export function canChange(access: Access, gate: Gate): boolean {
  if (gate === 'shared') return true
  if (access.level === 'owner' || access.level === 'admin') return true
  if (gate === 'admin') return false
  return access.level === 'board' && access.areas.includes(gate)
}

/** Who may make a change behind this gate, for a disabled button's title: "Only the Head of Community and admins can change this." */
export function whoCanChange(gate: Gate): string {
  if (gate === 'shared') return 'Anyone in the portal can change this.'
  if (gate === 'admin') return 'Only owners and admins can change this.'
  return `Only the ${AREA_SEATS[gate]} (or whoever holds ${AREA_LABELS[gate]}) and admins can change this.`
}

/** "partnerships,fund" from the admins table → the areas it names, ignoring anything unknown. */
export function parseAreas(value: string | null | undefined): Area[] {
  const known = new Set<string>(AREAS)
  return [...new Set(String(value ?? '').split(',').map((part) => part.trim()))].filter((part): part is Area => known.has(part))
}
