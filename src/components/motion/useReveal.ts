// Scroll-in reveals for a whole page section: put the hook's ref on a wrapper, `motion.reveal` on
// its class, and `data-reveal` on anything inside that should settle in as it comes up the screen.
// Nothing is hidden until this has run and is watching: without scripts, without
// IntersectionObserver or under reduced motion the wrapper is never armed, so everything just shows.

import { useLayoutEffect, useRef } from 'react'
import { reducedMotion } from '../../lib/useInView'

export function useReveal<T extends HTMLElement>(rootMargin = '0px 0px -8% 0px') {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const root = ref.current
    if (!root || typeof IntersectionObserver === 'undefined' || reducedMotion()) return

    const show = (node: Element) => node.setAttribute('data-shown', '')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          show(entry.target)
          observer.unobserve(entry.target)
        }
      },
      { rootMargin },
    )
    const watch = () => {
      root.querySelectorAll('[data-reveal]:not([data-shown])').forEach((node) => {
        // Already scrolled past (a restored scroll position): no reason to make it wait.
        if (node.getBoundingClientRect().bottom < 0) show(node)
        else observer.observe(node)
      })
    }

    watch()
    root.setAttribute('data-armed', '')
    // Parts that mount later (an RSVP form opening, new data) are watched too.
    const mutations = new MutationObserver(watch)
    mutations.observe(root, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      mutations.disconnect()
      root.removeAttribute('data-armed')
    }
  }, [rootMargin])

  return ref
}
