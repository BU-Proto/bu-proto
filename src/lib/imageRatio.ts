// A picture's shape, measured before the page that shows it renders. An event's page lays itself
// out by its picture (a flyer stands beside the text, a wide photo runs across as a banner), and
// the picture's size isn't stored with the event, so the route loader asks the browser for it.

/** Width over height for every picture measured so far, by URL. */
const measured = new Map<string, number>()

/** How long a page waits on its picture before rendering without knowing its shape. */
const GIVE_UP_MS = 1500
const POLL_MS = 40

/** Keeps a ratio read some other way (the page's own <img>, once loaded) for the next visit. */
export function rememberImageRatio(src: string, ratio: number) {
  if (Number.isFinite(ratio) && ratio > 0) measured.set(src, ratio)
}

/**
 * Width over height of the picture at `src`, or null if it can't be read in time (a slow host, a
 * broken link). Browser only: anywhere without `Image` it answers null at once.
 */
export function imageRatio(src: string): Promise<number | null> {
  const known = measured.get(src)
  if (known) return Promise.resolve(known)
  if (typeof Image === 'undefined') return Promise.resolve(null)

  return new Promise((resolve) => {
    const probe = new Image()
    const read = () => (probe.naturalWidth > 0 && probe.naturalHeight > 0 ? probe.naturalWidth / probe.naturalHeight : null)
    const finish = (ratio: number | null) => {
      window.clearInterval(poll)
      window.clearTimeout(timer)
      probe.onload = probe.onerror = null
      if (ratio) rememberImageRatio(src, ratio)
      resolve(ratio)
    }
    // The size is known once the file's first bytes are in, well before the whole picture is.
    const poll = window.setInterval(() => {
      const ratio = read()
      if (ratio) finish(ratio)
    }, POLL_MS)
    const timer = window.setTimeout(() => finish(read()), GIVE_UP_MS)
    probe.onload = () => finish(read())
    probe.onerror = () => finish(null)
    probe.src = src
  })
}
