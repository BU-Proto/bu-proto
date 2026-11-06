// Shared shapes for the page content in this folder.

/**
 * Copy in this folder that's made up (hack night's times and place, for example) carries
 * `placeholder: true` and renders with a small "sample" tag, so fake content can't ship
 * unnoticed. Delete the flag only once it's real and checked. Content in D1 has its own flag.
 */
export interface Sampleable {
  placeholder?: true
}

export interface Link {
  label: string
  href: string
}

/** Intro block at the top of every inner page. */
export interface PageIntro {
  /** Mono path shown above the title, e.g. `~/proto/hackathons`. */
  path: string
  title: string
  lede: string
}

export type TrackName = 'Start' | 'Build' | 'Launch'

/**
 * One of the field's named colours (see index.css), by size: sky for the everyday, iris for the
 * bigger, rose for the biggest. Set as data-hue on whatever carries it.
 */
export type Hue = 'sky' | 'iris' | 'rose'
