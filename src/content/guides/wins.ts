// The wins the guides point at. The ids match the wins table in production (7 to 16), so
// `/wins/<id>` links hold. If a win is re-imported under a new id, update it here. The covers
// and photos are the ones in each win's Devpost gallery, which the import copies too.

import type { GuideImage, GuideLink, WinRef } from './types'

const DEVPOST_PHOTOS = 'https://d112y698adiu2z.cloudfront.net/photos/production/software_photos/'

/** A photo from a win's Devpost gallery, by the part of its path after `software_photos/`. */
export function devpost(path: string): string {
  return DEVPOST_PHOTOS + path
}

export const NEMO: WinRef = {
  id: 11,
  project: 'Nemo',
  prize: 'Third Place Overall and ASUS Sustainability',
  event: 'HackHarvard 2026',
  cover: devpost('005/605/974/datas/original.png'),
}

export const ECOAPI: WinRef = {
  id: 7,
  project: 'EcoApi',
  prize: 'Best Web API (1st Place)',
  event: 'HackIllinois 2026',
  cover: devpost('004/386/258/datas/original.png'),
}

export const NOOGIE: WinRef = {
  id: 12,
  project: 'noogie',
  prize: 'Best Design',
  event: 'PennApps XXVI',
  cover: devpost('003/761/894/datas/original.png'),
}

export const EYRIE: WinRef = {
  id: 8,
  project: 'Eyrie',
  prize: 'Best AI Application Built with Cloudflare',
  event: 'HackHarvard 2025',
  cover: devpost('003/818/148/datas/original.png'),
}

export const HEAR_ME_OUT: WinRef = {
  id: 10,
  project: 'Hear me Out',
  prize: 'Best Use of Notability',
  event: 'Cal Hacks 13.0',
  cover: devpost('005/692/850/datas/original.png'),
}

export const SAPLING: WinRef = {
  id: 13,
  project: 'Sapling',
  prize: 'AI Tutor',
  event: 'Civic Hacks 2026',
  cover: devpost('004/359/951/datas/original.png'),
}

export const SPLIT_WORLD: WinRef = {
  id: 14,
  project: 'Split World',
  prize: 'Best use of Snap Lens Studio',
  event: 'YHack Spring 2026',
  cover: devpost('004/511/388/datas/original.png'),
}

export const FLOWCAST: WinRef = {
  id: 9,
  project: 'Flowcast',
  prize: 'Best First-Time Hacker',
  event: 'DS+X 2026',
  cover: devpost('005/692/792/datas/original.png'),
}

export const STALK_MARKET: WinRef = {
  id: 15,
  project: 'Stalk Market',
  prize: 'Best Technical Execution',
  event: 'DS+X',
  cover: devpost('003/887/595/datas/original.png'),
}

export const SUPER_ARTIFICIAL_BROS: WinRef = {
  id: 16,
  project: 'Super Artificial Bros.',
  prize: 'MakerMods Subtrack',
  event: 'BostonHacks 2025',
  cover: devpost('003/839/740/datas/original.png'),
}

export function winHref(win: WinRef): string {
  return `/wins/${win.id}`
}

/** An inline link to a win's page, named by the project. */
export function winLink(win: WinRef, label = win.project): GuideLink {
  return { label, href: winHref(win) }
}

/** Devpost keeps a 333px copy of every gallery photo beside the original. */
export function winThumb(src: string): string {
  return src.replace('/original.', '/medium.')
}

/** A photo from a win's gallery, credited to the team's write-up. */
export function winImage(win: WinRef, path: string, alt: string): GuideImage {
  const src = devpost(path)
  return { src, alt, thumb: winThumb(src), credit: { win } }
}

/** The win's own cover. */
export function winCover(win: WinRef, alt: string): GuideImage {
  return { src: win.cover, alt, thumb: winThumb(win.cover), credit: { win } }
}

/** Every win the guides know, in the order the breakdowns tell them. */
export const ALL_WINS: readonly WinRef[] = [
  NEMO,
  ECOAPI,
  NOOGIE,
  EYRIE,
  HEAR_ME_OUT,
  SAPLING,
  SPLIT_WORLD,
  FLOWCAST,
  STALK_MARKET,
  SUPER_ARTIFICIAL_BROS,
]
