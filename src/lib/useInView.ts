import { useEffect, useRef, useState } from 'react'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * True once the element has scrolled into view, `threshold` of it showing. It stays true, or with
 * `repeat` goes false again once the element is off screen, so an entrance can play every time.
 * With reduced motion, or without IntersectionObserver, it's true from the start so nothing waits
 * on an animation.
 */
export function useInView<T extends Element>(
  rootMargin = '0px 0px -12% 0px',
  threshold = 0,
  repeat = false,
) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined' || reducedMotion())

  const done = inView && !repeat

  useEffect(() => {
    const node = ref.current
    if (!node || done || typeof IntersectionObserver === 'undefined' || reducedMotion()) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          if (!repeat) observer.disconnect()
        } else if (repeat) {
          setInView(false)
        }
      },
      { rootMargin, threshold },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [done, repeat, rootMargin, threshold])

  return [ref, inView] as const
}

export { reducedMotion }
