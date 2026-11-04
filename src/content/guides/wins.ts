// The wins the guides point at. The ids match the wins table in production (7 to 16), so
// `/wins/<id>` links hold. If a win is re-imported under a new id, update it here.

import type { GuideLink, WinRef } from './types'

export const NEMO: WinRef = {
  id: 11,
  project: 'Nemo',
  prize: 'Third Place Overall and ASUS Sustainability',
  event: 'HackHarvard 2026',
}

export const ECOAPI: WinRef = {
  id: 7,
  project: 'EcoApi',
  prize: 'Best Web API (1st Place)',
  event: 'HackIllinois 2026',
}

export const NOOGIE: WinRef = {
  id: 12,
  project: 'noogie',
  prize: 'Best Design',
  event: 'PennApps XXVI',
}

export const EYRIE: WinRef = {
  id: 8,
  project: 'Eyrie',
  prize: 'Best AI Application Built with Cloudflare',
  event: 'HackHarvard 2025',
}

export const HEAR_ME_OUT: WinRef = {
  id: 10,
  project: 'Hear me Out',
  prize: 'Best Use of Notability',
  event: 'Cal Hacks 13.0',
}

export const SAPLING: WinRef = {
  id: 13,
  project: 'Sapling',
  prize: 'AI Tutor',
  event: 'Civic Hacks 2026',
}

export const SPLIT_WORLD: WinRef = {
  id: 14,
  project: 'Split World',
  prize: 'Best use of Snap Lens Studio',
  event: 'YHack Spring 2026',
}

export const FLOWCAST: WinRef = {
  id: 9,
  project: 'Flowcast',
  prize: 'Best First-Time Hacker',
  event: 'DS+X 2026',
}

export const STALK_MARKET: WinRef = {
  id: 15,
  project: 'Stalk Market',
  prize: 'Best Technical Execution',
  event: 'DS+X',
}

export const SUPER_ARTIFICIAL_BROS: WinRef = {
  id: 16,
  project: 'Super Artificial Bros.',
  prize: 'MakerMods Subtrack',
  event: 'BostonHacks 2025',
}

export function winHref(win: WinRef): string {
  return `/wins/${win.id}`
}

/** An inline link to a win's page, named by the project. */
export function winLink(win: WinRef, label = win.project): GuideLink {
  return { label, href: winHref(win) }
}
