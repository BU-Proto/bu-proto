import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AsciiField,
  DEFAULT_FIELD_SETTINGS,
  type AsciiFieldHandle,
  type FieldSettings,
} from '../ascii-field'
import { FEATURES, HERO_COPY, SCHEDULE } from '../content/hero'
import { FeatureStrip } from './FeatureStrip'
import { ScheduleCard } from './ScheduleCard'
import { TopBar } from './TopBar'
import { TweakPanel } from './TweakPanel'
import styles from './Hero.module.css'

/** The home hero: the ASCII field behind a glass UI layer. */
export function Hero() {
  const [settings, setSettings] = useState<FieldSettings>(DEFAULT_FIELD_SETTINGS)
  const [contentVisible, setContentVisible] = useState(true)
  const fieldRef = useRef<AsciiFieldHandle>(null)

  // Hidden copy no longer needs the trail to step around it; shown copy does again.
  useEffect(() => {
    fieldRef.current?.refreshClearMask()
  }, [contentVisible])

  const updateSetting = useCallback(
    <K extends keyof FieldSettings>(key: K, value: FieldSettings[K]) => {
      setSettings((current) => ({ ...current, [key]: value }))
    },
    [],
  )

  const { headline, lede, primaryCta, secondaryCta } = HERO_COPY

  return (
    <>
      <AsciiField ref={fieldRef} settings={settings} className={styles.field} />

      <main className={styles.hero} data-content-hidden={contentVisible ? undefined : true}>
        <TopBar>
          <TweakPanel
            settings={settings}
            onSettingChange={updateSetting}
            contentVisible={contentVisible}
            onContentVisibleChange={setContentVisible}
            onSettle={() => fieldRef.current?.settle()}
          />
        </TopBar>

        <section className={styles.mid}>
          <ScheduleCard className={styles.card} location={SCHEDULE.location} slots={SCHEDULE.slots} />

          <div className={styles.copy}>
            <h1 className={styles.headline} data-fog-clear>
              {headline[0]}
              <br />
              {headline[1]}
            </h1>
            <p className={styles.lede} data-fog-clear>
              {lede}
            </p>
          </div>

          <div className={styles.ctas}>
            <a className={styles.primary} href={primaryCta.href} data-fog-clear="box">
              {primaryCta.label} <span aria-hidden="true">↗</span>
            </a>
            <a className={styles.secondary} href={secondaryCta.href} data-fog-clear>
              {secondaryCta.label} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <FeatureStrip features={FEATURES} />
      </main>
    </>
  )
}
