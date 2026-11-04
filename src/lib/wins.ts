import type { Win } from '../../shared/api'

export interface WinTally {
  wins: number
  hackathons: number
  builders: number
  firsts: number
  /** True when there are no real wins yet, so the numbers come from the sample rows. */
  sample: boolean
}

// "1st Place", "First place overall", "Grand prize": not "Best First-Time Hacker".
const FIRST = /\b(1st|first)[ -]place\b|\bgrand prize\b/i

/**
 * Proto's record so far, from the published wins. Real wins only: sample rows count just while
 * there are no real ones, so the site never shows made-up numbers as if they were true.
 */
export function tallyWins(published: readonly Win[]): WinTally {
  const real = published.filter((win) => !win.placeholder)
  const sample = real.length === 0
  const counted = sample ? published : real

  const hackathons = new Set(counted.map((win) => win.event.trim().toLowerCase()))
  // A builder who placed twice counts once. Sample teams are all "Sample Student", so for samples
  // every seat counts, which keeps the preview from reading "1 builder".
  const builders = new Set<string>()
  counted.forEach((win, index) =>
    win.team.forEach((person, seat) =>
      builders.add(sample ? `${index}:${seat}` : person.name.trim().toLowerCase()),
    ),
  )

  return {
    wins: counted.length,
    hackathons: hackathons.size,
    builders: builders.size,
    firsts: counted.filter((win) => FIRST.test(win.placement)).length,
    sample: sample && counted.length > 0,
  }
}
