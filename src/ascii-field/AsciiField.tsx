import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { AsciiFieldEngine, type FieldEngineOptions } from './engine'
import type { FieldSettings } from './settings'

export interface AsciiFieldHandle {
  /** Clear the trail and still the wind. */
  settle(): void
  /** Re-measure the elements marked `data-fog-clear` (call after showing or hiding them). */
  refreshClearMask(): void
}

interface AsciiFieldProps {
  settings: FieldSettings
  className?: string
  ref?: Ref<AsciiFieldHandle>
  /** Read once, when the field mounts. */
  options?: FieldEngineOptions
}

/**
 * Full-viewport canvas running the ASCII gradient field and the cursor trail.
 * Mark text the trail should avoid with `data-fog-clear` (or `data-fog-clear="box"`), and
 * controls whose clicks shouldn't trigger the shockwave with `data-fog-ignore`.
 */
export function AsciiField({ settings, className, ref, options }: AsciiFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<AsciiFieldEngine | null>(null)
  const initialSettings = useRef(settings)
  const initialOptions = useRef(options)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new AsciiFieldEngine(canvas, initialSettings.current, initialOptions.current)
    engineRef.current = engine
    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    engineRef.current?.setSettings(settings)
  }, [settings])

  useImperativeHandle(
    ref,
    () => ({
      settle: () => engineRef.current?.settle(),
      refreshClearMask: () => engineRef.current?.refreshClearMask(),
    }),
    [],
  )

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
