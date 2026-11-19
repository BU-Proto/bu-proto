import { factLabelFor } from '../../../shared/constants'
import styles from '../pages/Asks.module.css'
import ui from '../admin.module.css'

export interface RememberValue {
  answer: string
  remember: boolean
  /** The fact it's saved as; empty means the name suggested from the question. */
  factLabel: string
}

/**
 * Under an answer to Claude's question: keep it as a Proto fact, and under what name. The name is
 * suggested from the question, and the existing facts are offered, so "What is Proto's email?"
 * can update "Email" instead of starting a second fact beside it.
 */
export function RememberFact({
  id,
  question,
  value,
  factLabels,
  onChange,
}: {
  id: string
  question: string
  value: RememberValue
  factLabels: string[]
  onChange: (value: RememberValue) => void
}) {
  const suggested = factLabelFor(question)
  const name = value.factLabel || suggested
  const updates = factLabels.some((label) => label.toLowerCase() === name.trim().toLowerCase())
  return (
    <>
      <label className={styles.remember}>
        <input type="checkbox" checked={value.remember} onChange={(event) => onChange({ ...value, remember: event.target.checked })} />
        It’s about Proto itself: keep it as a Proto fact
      </label>
      {value.remember && (
        <div className={styles.factName}>
          <label htmlFor={`${id}-fact`} className={ui.hint}>
            Saved as
          </label>
          <input
            id={`${id}-fact`}
            className={ui.input}
            list={`${id}-facts`}
            value={name}
            maxLength={80}
            onChange={(event) => onChange({ ...value, factLabel: event.target.value })}
          />
          <datalist id={`${id}-facts`}>
            {factLabels.map((label) => (
              <option key={label} value={label} />
            ))}
          </datalist>
          <span className={ui.hint}>{updates ? 'Updates that fact.' : 'A new fact. Pick an existing one from the list to update it instead.'}</span>
        </div>
      )}
    </>
  )
}
