// Shared shapes for the page content in this folder.

/**
 * Anything made up (sample hackathons, wins, people, times and places) carries
 * `placeholder: true` and renders with a small "sample" tag, so fake content can't ship
 * unnoticed. Delete the flag only once the item is real and checked.
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
