import { useEffect, type RefObject } from 'react'
import { reducedMotion } from '../lib/useInView'

/** How far off the surface the pointer starts to light its rim, in px. */
const REACH = 150
const EASE = 0.18

/**
 * Lets the pointer light a glass surface: sets --light-x, --light-y and --light (0 to 1) on it. Runs
 * only while the light is moving, and not on touch screens or under reduced motion.
 */
export function useGlassLight(surface: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = surface.current
    if (!element || reducedMotion() || !matchMedia('(hover: hover)').matches) return
    const light = { x: 0, y: 0, power: 0, goalX: 0, goalY: 0, goalPower: 0, frame: 0 }

    const paint = () => {
      element.style.setProperty('--light-x', `${light.x.toFixed(1)}px`)
      element.style.setProperty('--light-y', `${light.y.toFixed(1)}px`)
      element.style.setProperty('--light', light.power.toFixed(3))
    }

    const tick = () => {
      light.x += (light.goalX - light.x) * EASE
      light.y += (light.goalY - light.y) * EASE
      light.power += (light.goalPower - light.power) * EASE
      paint()
      const settled = Math.abs(light.goalX - light.x) < 0.2 && Math.abs(light.goalY - light.y) < 0.2 && Math.abs(light.goalPower - light.power) < 0.002
      if (!settled) {
        light.frame = requestAnimationFrame(tick)
        return
      }
      // Land exactly, so a light that has gone out stays out and far moves stop waking the loop.
      light.x = light.goalX
      light.y = light.goalY
      light.power = light.goalPower
      paint()
      light.frame = 0
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const box = element.getBoundingClientRect()
      const offX = Math.max(box.left - event.clientX, 0, event.clientX - box.right)
      const offY = Math.max(box.top - event.clientY, 0, event.clientY - box.bottom)
      const power = Math.max(0, 1 - Math.hypot(offX, offY) / REACH)
      if (power === 0 && light.power === 0) return
      // Coming from nowhere, the light starts where the pointer is instead of sliding in.
      if (light.power === 0) {
        light.x = event.clientX - box.left
        light.y = event.clientY - box.top
      }
      light.goalX = event.clientX - box.left
      light.goalY = event.clientY - box.top
      light.goalPower = power
      if (!light.frame) light.frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(light.frame)
      window.removeEventListener('pointermove', onMove)
    }
  }, [surface])
}
