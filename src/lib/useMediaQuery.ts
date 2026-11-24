import { useSyncExternalStore } from 'react'

/** Whether a media query matches right now, kept current as the window changes. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (changed) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', changed)
      return () => media.removeEventListener('change', changed)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
