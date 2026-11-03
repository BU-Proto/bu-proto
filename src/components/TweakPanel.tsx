import { useId, useRef, useState } from 'react'
import {
  RAMPS,
  RAMP_LABELS,
  TRAIL_COLORS,
  TRAIL_COLOR_LABELS,
  type FieldSettings,
  type RampName,
  type TrailColor,
} from '../ascii-field'
import { IconButton } from './IconButton'
import { SlidersIcon } from './icons'
import styles from './TweakPanel.module.css'

type NumericSetting = {
  [K in keyof FieldSettings]: FieldSettings[K] extends number ? K : never
}[keyof FieldSettings]

interface SliderSpec {
  key: NumericSetting
  label: string
  min: number
  max: number
  step: number
  /** Slider units per setting unit (sliders work in integers). */
  scale: number
}

const SLIDERS: readonly SliderSpec[] = [
  { key: 'cellSize', label: 'Glyph size', min: 9, max: 20, step: 1, scale: 1 },
  { key: 'glyphContrast', label: 'Glyph contrast', min: 20, max: 160, step: 5, scale: 100 },
  { key: 'baseColor', label: 'Base color', min: 0, max: 100, step: 1, scale: 100 },
  { key: 'wind', label: 'Wind', min: 20, max: 250, step: 5, scale: 100 },
  { key: 'trailLength', label: 'Trail length', min: 30, max: 300, step: 10, scale: 100 },
  { key: 'push', label: 'Character push', min: 0, max: 100, step: 5, scale: 100 },
  { key: 'ribbing', label: 'Ribbing', min: 0, max: 100, step: 5, scale: 100 },
]

const isTrailColor = (value: string): value is TrailColor => Object.hasOwn(TRAIL_COLORS, value)
const isRampName = (value: string): value is RampName => Object.hasOwn(RAMPS, value)
const TRAIL_COLOR_OPTIONS = Object.keys(TRAIL_COLOR_LABELS).filter(isTrailColor)
const RAMP_OPTIONS = Object.keys(RAMP_LABELS).filter(isRampName)

interface TweakPanelProps {
  settings: FieldSettings
  onSettingChange: <K extends keyof FieldSettings>(key: K, value: FieldSettings[K]) => void
  contentVisible: boolean
  onContentVisibleChange: (visible: boolean) => void
  onSettle: () => void
}

/** A round button that opens a panel of live controls for the field and the trail. */
export function TweakPanel({
  settings,
  onSettingChange,
  contentVisible,
  onContentVisibleChange,
  onSettle,
}: TweakPanelProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)

  return (
    <div
      className={styles.root}
      data-fog-ignore
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          toggleRef.current?.focus()
        }
      }}
    >
      <IconButton
        ref={toggleRef}
        label="Tweak the field"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <SlidersIcon />
      </IconButton>

      <div id={panelId} className={styles.panel} role="group" aria-label="Field settings" hidden={!open}>
        <p className={styles.hint}>Move to leave a trail. Click for a shockwave.</p>

        {SLIDERS.map((slider) => (
          <label key={slider.key} className={styles.row}>
            {slider.label}
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={Math.round(settings[slider.key] * slider.scale)}
              onChange={(event) => onSettingChange(slider.key, Number(event.target.value) / slider.scale)}
            />
          </label>
        ))}

        <label className={styles.row}>
          Trail color
          <select
            value={settings.trailColor}
            onChange={(event) => {
              const { value } = event.target
              if (isTrailColor(value)) onSettingChange('trailColor', value)
            }}
          >
            {TRAIL_COLOR_OPTIONS.map((color) => (
              <option key={color} value={color}>
                {TRAIL_COLOR_LABELS[color]}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.row}>
          Characters
          <select
            value={settings.ramp}
            onChange={(event) => {
              const { value } = event.target
              if (isRampName(value)) onSettingChange('ramp', value)
            }}
          >
            {RAMP_OPTIONS.map((ramp) => (
              <option key={ramp} value={ramp}>
                {RAMP_LABELS[ramp]}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={contentVisible}
            onChange={(event) => onContentVisibleChange(event.target.checked)}
          />
          Show page content
        </label>

        <button type="button" className={styles.settle} onClick={onSettle}>
          Settle the surface
        </button>
      </div>
    </div>
  )
}
