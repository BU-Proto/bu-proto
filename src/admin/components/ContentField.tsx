import { useId, useState } from 'react'
import type { FieldSpec } from '../../../shared/api'
import admin from '../admin.module.css'
import { issueFor, type FormValue, type LinkValue } from '../lib/content'
import styles from './ContentField.module.css'
import { Field } from './Field'
import { PlusIcon } from './icons'

const MAX_LINKS = 6

interface ContentFieldProps {
  field: FieldSpec
  value: FormValue
  /** Every issue from the last save, keyed like the API sends them ("links.1.href"). */
  issues: Record<string, string>
  onChange: (value: FormValue) => void
}

/** One editable field from RESOURCE_SPECS, drawn for its type. */
export function ContentField({ field, value, issues, onChange }: ContentFieldProps) {
  const error = issueFor(issues, field.key)

  switch (field.type) {
    case 'boolean':
      return <SwitchField field={field} checked={Boolean(value)} error={error} onChange={onChange} />
    case 'links':
      return <LinksField field={field} links={value as LinkValue[]} issues={issues} onChange={onChange} />
    case 'image':
      return <ImageField field={field} value={String(value)} error={error} onChange={onChange} />
  }

  const text = String(value)
  return (
    <Field label={field.label} hint={field.type === 'list' ? (field.hint ?? 'One per line.') : field.hint} error={error}>
      {(control) => {
        switch (field.type) {
          case 'textarea':
            return <textarea {...control} className={admin.input} rows={4} value={text} onChange={(event) => onChange(event.target.value)} />
          case 'list':
            return (
              <textarea {...control} className={admin.input} rows={5} value={text} onChange={(event) => onChange(event.target.value)} />
            )
          case 'select': {
            const options = field.options ?? []
            return (
              <select {...control} className={admin.input} value={text} onChange={(event) => onChange(event.target.value)}>
                {/* Keep a value the options no longer list, rather than silently changing it. */}
                {!options.includes(text) && <option value={text}>{text || 'Choose…'}</option>}
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )
          }
          case 'date':
            return <input {...control} className={admin.input} type="date" value={text} onChange={(event) => onChange(event.target.value)} />
          case 'number':
            return (
              <input
                {...control}
                className={`${admin.input} ${admin.mono}`}
                type="number"
                inputMode="numeric"
                step={1}
                value={text}
                onChange={(event) => onChange(event.target.value)}
              />
            )
          case 'url':
            return (
              <input
                {...control}
                className={admin.input}
                type="url"
                inputMode="url"
                placeholder="https://"
                autoComplete="off"
                value={text}
                onChange={(event) => onChange(event.target.value)}
              />
            )
          default:
            return <input {...control} className={admin.input} type="text" value={text} onChange={(event) => onChange(event.target.value)} />
        }
      }}
    </Field>
  )
}

function SwitchField({ field, checked, error, onChange }: { field: FieldSpec; checked: boolean; error?: string; onChange: (value: boolean) => void }) {
  const id = useId()
  return (
    <div className={admin.field}>
      <label className={admin.switchRow} htmlFor={id}>
        <input
          id={id}
          className={admin.switch}
          type="checkbox"
          role="switch"
          checked={checked}
          aria-describedby={field.hint || error ? `${id}-text` : undefined}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className={admin.switchText}>
          <span className={admin.switchLabel}>{field.label}</span>
          <span id={`${id}-text`} className={admin.hint}>
            {error ? <span className={admin.error}>{error} </span> : null}
            {field.hint}
          </span>
        </span>
      </label>
    </div>
  )
}

const looksLikeImage = (value: string) => /^(https?:\/\/|\/)\S+$/.test(value)

function ImageField({ field, value, error, onChange }: { field: FieldSpec; value: string; error?: string; onChange: (value: string) => void }) {
  // Remembers which value failed to load, so typing a new one retries.
  const [broken, setBroken] = useState<string | null>(null)
  const trimmed = value.trim()
  const preview = looksLikeImage(trimmed) ? trimmed : null

  return (
    <div className={styles.image}>
      <Field label={field.label} hint={field.hint ?? 'A full URL or a /path under public/.'} error={error}>
        {(control) => (
          <input
            {...control}
            className={admin.input}
            type="text"
            inputMode="url"
            placeholder="https://… or /photos/…"
            autoComplete="off"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </Field>
      <div className={styles.preview} aria-live="polite">
        {preview && broken !== preview ? (
          <img src={preview} alt={`Preview of ${field.label.toLowerCase()}`} onError={() => setBroken(preview)} />
        ) : (
          <span className={admin.hint}>{preview ? 'Couldn’t load that image.' : 'No image'}</span>
        )}
      </div>
    </div>
  )
}

function LinksField({
  field,
  links,
  issues,
  onChange,
}: {
  field: FieldSpec
  links: LinkValue[]
  issues: Record<string, string>
  onChange: (value: LinkValue[]) => void
}) {
  const id = useId()
  // The row just added takes focus, so keyboard users land in it.
  const [focusRow, setFocusRow] = useState<number | null>(null)
  const topIssue = issues[field.key]

  const update = (index: number, patch: Partial<LinkValue>) => onChange(links.map((link, i) => (i === index ? { ...link, ...patch } : link)))

  return (
    <fieldset className={admin.field} aria-describedby={`${id}-hint`}>
      <legend className={admin.label}>{field.label}</legend>
      {links.length > 0 && (
        <ol className={styles.links}>
          {links.map((link, index) => {
            const labelError = issues[`${field.key}.${index}.label`]
            const hrefError = issues[`${field.key}.${index}.href`]
            return (
              <li key={index} className={styles.linkRow}>
                <div className={styles.linkInputs}>
                  <label className={styles.srOnly} htmlFor={`${id}-${index}-label`}>
                    Link {index + 1} label
                  </label>
                  <input
                    id={`${id}-${index}-label`}
                    className={admin.input}
                    type="text"
                    placeholder="Label, e.g. GitHub"
                    value={link.label}
                    autoFocus={focusRow === index}
                    aria-invalid={labelError ? true : undefined}
                    aria-describedby={labelError ? `${id}-${index}-error` : undefined}
                    onChange={(event) => update(index, { label: event.target.value })}
                  />
                  <label className={styles.srOnly} htmlFor={`${id}-${index}-href`}>
                    Link {index + 1} URL
                  </label>
                  <input
                    id={`${id}-${index}-href`}
                    className={admin.input}
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    autoComplete="off"
                    value={link.href}
                    aria-invalid={hrefError ? true : undefined}
                    aria-describedby={hrefError ? `${id}-${index}-error` : undefined}
                    onChange={(event) => update(index, { href: event.target.value })}
                  />
                  <button
                    type="button"
                    className={`${admin.ghost} ${admin.small}`}
                    aria-label={`Remove link ${index + 1}${link.label ? ` (${link.label})` : ''}`}
                    onClick={() => onChange(links.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                </div>
                {(labelError || hrefError) && (
                  <p id={`${id}-${index}-error`} className={admin.error}>
                    {[labelError && `Label: ${labelError}`, hrefError && `URL: ${hrefError}`].filter(Boolean).join('. ')}

                  </p>
                )}
              </li>
            )
          })}
        </ol>
      )}
      <div>
        <button
          type="button"
          className={`${admin.button} ${admin.small}`}
          disabled={links.length >= MAX_LINKS}
          onClick={() => {
            setFocusRow(links.length)
            onChange([...links, { label: '', href: '' }])
          }}
        >
          <PlusIcon width={14} height={14} /> Add link
        </button>
      </div>
      <p id={`${id}-hint`} className={admin.hint}>
        {field.hint ? `${field.hint} ` : ''}Up to {MAX_LINKS}.
      </p>
      {topIssue && <p className={admin.error}>{topIssue}</p>}
    </fieldset>
  )
}
