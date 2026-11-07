import { useEffect, useRef } from 'react'

/** Lets a mouse drag a sideways-scrolling track. Touch already scrolls it natively. */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const track = ref.current
    if (!track) return
    const drag = { active: false, moved: false, startX: 0, startScroll: 0 }

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      drag.active = true
      drag.moved = false
      drag.startX = event.clientX
      drag.startScroll = track.scrollLeft
    }
    const onMove = (event: PointerEvent) => {
      if (!drag.active) return
      const distance = event.clientX - drag.startX
      if (Math.abs(distance) > 4) drag.moved = true
      track.scrollLeft = drag.startScroll - distance
    }
    const onUp = () => {
      drag.active = false
    }
    // A drag that ends on a link isn't a click on it.
    const onClick = (event: MouseEvent) => {
      if (!drag.moved) return
      event.preventDefault()
      event.stopPropagation()
      drag.moved = false
    }

    track.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    track.addEventListener('click', onClick, { capture: true })
    return () => {
      track.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      track.removeEventListener('click', onClick, { capture: true })
    }
  }, [])

  return ref
}
