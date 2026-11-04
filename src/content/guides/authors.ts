// Who writes the playbook. Each author's note is built from the wins they were on, so it says
// only what the wins table already does. Add an author here, then list them on a guide in
// `../resources.ts`.

import type { WinRef } from './types'
import { ECOAPI, EYRIE, FLOWCAST, HEAR_ME_OUT, NEMO, NOOGIE, SAPLING, SPLIT_WORLD } from './wins'

export interface Author {
  name: string
  /** For "Andres was on this team" under a win example. */
  firstName: string
  initials: string
  /** Their Devpost profile: the name links here. */
  href: string
  /** Their Devpost avatar. Without one, the initials stand in. */
  photo?: string
  bu: boolean
  /** The first line of their note. */
  role: string
  /** Wins they were on, as listed on each win's team. */
  wins: readonly WinRef[]
}

const AVATARS = 'https://d112y698adiu2z.cloudfront.net/photos/production/user_photos/'

export const ANDRES: Author = {
  name: 'Andres Lopez',
  firstName: 'Andres',
  initials: 'AL',
  href: 'https://devpost.com/AndresL230',
  photo: `${AVATARS}003/827/688/datas/profile.jpeg`,
  bu: true,
  role: 'A BU student on the Proto team.',
  wins: [ECOAPI, EYRIE, NOOGIE, FLOWCAST, SAPLING],
}

export const JOSE: Author = {
  name: 'Jose Cruz',
  firstName: 'Jose',
  initials: 'JC',
  href: 'https://devpost.com/jose-colorstack',
  photo: `${AVATARS}004/505/262/datas/profile.jpg`,
  bu: true,
  role: 'A BU student on the Proto team.',
  wins: [NEMO, HEAR_ME_OUT, SPLIT_WORLD, SAPLING],
}

export const PLAYBOOK_AUTHORS: readonly Author[] = [ANDRES, JOSE]

/** The authors who were on a win's team, for the note under an example. */
export function authorsOn(win: WinRef, authors: readonly Author[] = PLAYBOOK_AUTHORS): Author[] {
  return authors.filter((author) => author.wins.some((w) => w.id === win.id))
}

/** "Andres", "Andres and Jose", "Andres, Jose and Sam". */
export function nameList(names: readonly string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}
