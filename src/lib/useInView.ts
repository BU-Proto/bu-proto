import { useEffect, useRef, useState } from 'react'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * True once the element has scrolled into view (and stays true), `threshold` of it showing. With
 * reduced motion, or without IntersectionObserver, it's true from the start so nothing waits on an
 * animation.
 */
export function useInView<T extends Element>(rootMargin = '0px 0px -12% 0px', threshold = 0) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined' || reducedMotion())

  useEffect(() => {
    const node = ref.current
    if (!node || inView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [inView, rootMargin, threshold])

  return [ref, inView] as const
}

export { reducedMotion }
