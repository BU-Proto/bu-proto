import type { Feature } from '../content/hero'
import { FeatureIcon } from './icons'
import styles from './FeatureStrip.module.css'

/** The ruled strip of club features along the bottom of the hero. */
export function FeatureStrip({ features }: { features: readonly Feature[] }) {
  return (
    <ul className={styles.strip}>
      {features.map((feature) => (
        <li key={feature.text} className={styles.item} data-fog-clear>
          <FeatureIcon name={feature.icon} />
          {feature.text}
        </li>
      ))}
    </ul>
  )
}
