import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { FieldSpec } from '../../../shared/api'
import admin from '../admin.module.css'
import {
  issueFor,
  looksLikeImage,
  MAX_IMAGES,
  MAX_PEOPLE,
  moveItem,
  type FormValue,
  type LinkValue,
  type PersonValue,
} from '../lib/content'
import styles from './ContentField.module.css'
import { Field } from './Field'
import { ChevronDownIcon, ChevronUpIcon, PlusIcon } from './icons'

const MAX_LINKS = 6

interface ContentFieldProps {
  field: FieldSpec
  value: FormValue
  /** Every issue from the last save, keyed like the API sends them ("links.1.href"). */
  issues: Record<string, string>
  onChange: (value: FormValue) => void
  /** Textarea height, when the field holds more than the default few lines. */
  rows?: number
}

/** One editable field from RESOURCE_SPECS, drawn for its type. */
export function ContentField({ field, value, issues, onChange, rows }: ContentFieldProps) {
  const error = issueFor(issues, field.key)

  switch (field.type) {
    case 'boolean':
      return <SwitchField field={field} checked={Boolean(value)} error={error} onChange={onChange} />
    case 'links':
      return <LinksField field={field} links={value as LinkValue[]} issues={issues} onChange={onChange} />
    case 'image':
      return <ImageField field={field} value={String(value)} error={error} onChange={onChange} />
    case 'people':
      return <PeopleField field={field} people={value as PersonValue[]} issues={issues} onChange={onChange} />
    case 'images':
      return <ImagesField field={field} images={value as string[]} issues={issues} onChange={onChange} />
  }

  const text = String(value)
  return (
    <Field label={field.label} hint={field.type === 'list' ? (field.hint ?? 'One per line.') : field.hint} error={error}>
      {(control) => {
        switch (field.type) {
          case 'textarea':
            return <textarea {...control} className={admin.input} rows={rows ?? 4} value={text} onChange={(event) => onChange(event.target.value)} />
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

/** Keeps keyboard focus with a row as it moves or goes away, instead of on whatever row lands under it. */
function useRowFocus<AddControl extends HTMLElement>() {
  const listRef = useRef<HTMLOListElement>(null)
  const addRef = useRef<AddControl>(null)
  // Set during a move or remove, and run once the list has re-rendered with the new order.
  const pending = useRef<(() => void) | null>(null)

  useLayoutEffect(() => {
    pending.current?.()
    pending.current = null
  })

  function rowButton(index: number, selector: string) {
    return listRef.current?.children[index]?.querySelector<HTMLButtonElement>(`${selector}:not(:disabled)`) ?? null
  }

  return {
    listRef,
    addRef,
    afterMove(to: number, direction: 'up' | 'down') {
      pending.current = () => (rowButton(to, `[data-move="${direction}"]`) ?? rowButton(to, '[data-move]'))?.focus()
    },
    afterRemove(index: number, remaining: number) {
      pending.current = () => {
        const next = remaining > 0 ? rowButton(Math.min(index, remaining - 1), '[data-remove]') : null
        ;(next ?? addRef.current)?.focus()
      }
    },
  }
}

interface RowControlsProps {
  index: number
  count: number
  /** What the row is, for screen readers: "Ada Lovelace", "photo 3". */
  name: string
  onMove: (to: number, direction: 'up' | 'down') => void
  onRemove: () => void
}

function RowControls({ index, count, name, onMove, onRemove }: RowControlsProps) {
  return (
    <div className={styles.rowControls}>
      <button
        type="button"
        className={`${admin.ghost} ${admin.small} ${styles.iconButton}`}
        aria-label={`Move ${name} up`}
        title="Move up"
        data-move="up"
        disabled={index === 0}
        onClick={() => onMove(index - 1, 'up')}
      >
        <ChevronUpIcon />
      </button>
      <button
        type="button"
        className={`${admin.ghost} ${admin.small} ${styles.iconButton}`}
        aria-label={`Move ${name} down`}
        title="Move down"
        data-move="down"
        disabled={index === count - 1}
        onClick={() => onMove(index + 1, 'down')}
      >
        <ChevronDownIcon />
      </button>
      <button type="button" className={`${admin.ghost} ${admin.small}`} aria-label={`Remove ${name}`} data-remove onClick={onRemove}>
        Remove
      </button>
    </div>
  )
}

function PeopleField({
  field,
  people,
  issues,
  onChange,
}: {
  field: FieldSpec
  people: PersonValue[]
  issues: Record<string, string>
  onChange: (value: PersonValue[]) => void
}) {
  const id = useId()
  const [focusRow, setFocusRow] = useState<number | null>(null)
  const { listRef, addRef, afterMove, afterRemove } = useRowFocus<HTMLButtonElement>()
  const topIssue = issues[field.key]

  const update = (index: number, patch: Partial<PersonValue>) =>
    onChange(people.map((person, i) => (i === index ? { ...person, ...patch } : person)))

  return (
    <fieldset className={admin.field} aria-describedby={`${id}-hint`}>
      <legend className={admin.label}>{field.label}</legend>
      {people.length > 0 && (
        <ol ref={listRef} className={styles.rows}>
          {people.map((person, index) => {
            const nameError = issues[`${field.key}.${index}.name`]
            const hrefError = issues[`${field.key}.${index}.href`]
            const rowError = issues[`${field.key}.${index}`]
            const errorId = `${id}-${index}-error`
            const who = person.name.trim() || `person ${index + 1}`
            return (
              <li key={index} className={styles.row}>
                <div className={styles.personInputs}>
                  <label className={styles.srOnly} htmlFor={`${id}-${index}-name`}>
                    Person {index + 1} name
                  </label>
                  <input
                    id={`${id}-${index}-name`}
                    className={`${admin.input} ${styles.personName}`}
                    type="text"
                    placeholder="Name"
                    autoComplete="off"
                    value={person.name}
                    autoFocus={focusRow === index}
                    aria-invalid={nameError ? true : undefined}
                    aria-describedby={nameError ? errorId : undefined}
                    onChange={(event) => update(index, { name: event.target.value })}
                  />
                  <label className={styles.srOnly} htmlFor={`${id}-${index}-href`}>
                    Person {index + 1} link
                  </label>
                  <input
                    id={`${id}-${index}-href`}
                    className={`${admin.input} ${styles.personLink}`}
                    type="url"
                    inputMode="url"
                    placeholder="Link (LinkedIn, site or GitHub)"
                    autoComplete="off"
                    value={person.href}
                    aria-invalid={hrefError ? true : undefined}
                    aria-describedby={hrefError ? errorId : undefined}
                    onChange={(event) => update(index, { href: event.target.value })}
                  />
                  <label className={styles.personBu} title="A BU student or alum: shown with a BU mark on the site">
                    <input
                      type="checkbox"
                      checked={person.bu}
                      onChange={(event) => update(index, { bu: event.target.checked })}
                    />
                    BU
                  </label>
                  <RowControls
                    index={index}
                    count={people.length}
                    name={who}
                    onMove={(to, direction) => {
                      onChange(moveItem(people, index, to))
                      afterMove(to, direction)
                    }}
                    onRemove={() => {
                      onChange(people.filter((_, i) => i !== index))
                      afterRemove(index, people.length - 1)
                    }}
                  />
                </div>
                {(nameError || hrefError || rowError) && (
                  <p id={errorId} className={admin.error}>
                    {[rowError, nameError && `Name: ${nameError}`, hrefError && `Link: ${hrefError}`].filter(Boolean).join('. ')}
                  </p>
                )}
              </li>
            )
          })}
        </ol>
      )}
      <div>
        <button
          ref={addRef}
          type="button"
          className={`${admin.button} ${admin.small}`}
          disabled={people.length >= MAX_PEOPLE}
          onClick={() => {
            setFocusRow(people.length)
            onChange([...people, { name: '', href: '', bu: false }])
          }}
        >
          <PlusIcon width={14} height={14} /> Add person
        </button>
      </div>
      <p id={`${id}-hint`} className={admin.hint}>
        {field.hint ? `${field.hint} ` : ''}Links are optional. Up to {MAX_PEOPLE}.
      </p>
      {topIssue && <p className={admin.error}>{topIssue}</p>}
    </fieldset>
  )
}

/** A small preview that says so plainly when the image won't load. */
function Thumb({ src, onBroken }: { src: string; onBroken: (broken: boolean) => void }) {
  // Remembers which src failed, so editing the URL retries.
  const [broken, setBroken] = useState<string | null>(null)
  const trimmed = src.trim()
  const usable = looksLikeImage(trimmed)
  const failed = !usable || broken === trimmed

  return (
    <div className={failed ? `${styles.thumb} ${styles.thumbBroken}` : styles.thumb}>
      {failed ? (
        <span>{usable ? 'Won’t load' : 'Not a URL'}</span>
      ) : (
        <img
          src={trimmed}
          alt=""
          loading="lazy"
          onLoad={() => onBroken(false)}
          onError={() => {
            setBroken(trimmed)
            onBroken(true)
          }}
        />
      )}
    </div>
  )
}

function ImagesField({
  field,
  images,
  issues,
  onChange,
}: {
  field: FieldSpec
  images: string[]
  issues: Record<string, string>
  onChange: (value: string[]) => void
}) {
  const id = useId()
  const [draft, setDraft] = useState('')
  const [note, setNote] = useState('')
  // Which rows' previews failed, by src, so the row can say why under the URL.
  const [brokenSrcs, setBrokenSrcs] = useState<ReadonlySet<string>>(new Set())
  const { listRef, addRef, afterMove, afterRemove } = useRowFocus<HTMLTextAreaElement>()
  const topIssue = issues[field.key]
  const room = MAX_IMAGES - images.length

  function markBroken(src: string, broken: boolean) {
    setBrokenSrcs((current) => {
      if (current.has(src) === broken) return current
      const next = new Set(current)
      if (broken) next.add(src)
      else next.delete(src)
      return next
    })
  }

  function add() {
    // URLs never hold spaces, so any whitespace separates them: a pasted column, a line, or a row.
    const entries = draft.split(/\s+/).filter(Boolean)
    if (entries.length === 0) return
    const valid = entries.filter(looksLikeImage)
    const invalid = entries.filter((entry) => !looksLikeImage(entry))
    const taken = valid.slice(0, Math.max(room, 0))
    const overflow = valid.slice(taken.length)
    if (taken.length) onChange([...images, ...taken])
    setDraft([...overflow, ...invalid].join('\n'))
    const notes = []
    if (invalid.length) notes.push(`${invalid.length === 1 ? 'One line isn’t' : `${invalid.length} lines aren’t`} a full URL or a /path, so ${invalid.length === 1 ? 'it’s' : 'they’re'} still in the box.`)
    if (overflow.length) notes.push(`The gallery holds ${MAX_IMAGES}; ${overflow.length} didn’t fit.`)
    setNote(notes.join(' '))
  }

  function onDraftKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter adds, as in a one-line box; Shift+Enter still starts a new line for typing several.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      add()
    }
  }

  return (
    <fieldset className={admin.field} aria-describedby={`${id}-hint`}>
      <legend className={admin.label}>{field.label}</legend>
      {images.length > 0 && (
        <ol ref={listRef} className={styles.rows}>
          {images.map((src, index) => {
            const issue = issues[`${field.key}.${index}`]
            // The contract's URL-or-path union fails with zod's generic message; say what it wants.
            const error = issue === 'Invalid input' ? 'Use a full URL (https://…) or a /path under public/.' : issue
            const broken = !error && brokenSrcs.has(src.trim())
            const messageId = `${id}-${index}-message`
            return (
              <li key={index} className={styles.row}>
                <div className={styles.imageRow}>
                  <Thumb src={src} onBroken={(isBroken) => markBroken(src.trim(), isBroken)} />
                  <label className={styles.srOnly} htmlFor={`${id}-${index}`}>
                    Photo {index + 1} URL
                  </label>
                  <input
                    id={`${id}-${index}`}
                    className={`${admin.input} ${styles.imageUrl}`}
                    type="text"
                    inputMode="url"
                    placeholder="https://… or /photos/…"
                    autoComplete="off"
                    value={src}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error || broken ? messageId : undefined}
                    onChange={(event) => onChange(images.map((image, i) => (i === index ? event.target.value : image)))}
                  />
                  <RowControls
                    index={index}
                    count={images.length}
                    name={`photo ${index + 1}`}
                    onMove={(to, direction) => {
                      onChange(moveItem(images, index, to))
                      afterMove(to, direction)
                    }}
                    onRemove={() => {
                      onChange(images.filter((_, i) => i !== index))
                      afterRemove(index, images.length - 1)
                    }}
                  />
                </div>
                {error ? (
                  <p id={messageId} className={admin.error}>
                    {error}
                  </p>
                ) : (
                  broken && (
                    <p id={messageId} className={styles.warn}>
                      Couldn’t load this image. Check the link, or that the file is under public/.
                    </p>
                  )
                )}
              </li>
            )
          })}
        </ol>
      )}

      <div className={styles.addImages}>
        <label className={styles.srOnly} htmlFor={`${id}-add`}>
          Add photos by URL
        </label>
        <textarea
          ref={addRef}
          id={`${id}-add`}
          className={`${admin.input} ${styles.addBox}`}
          rows={1}
          placeholder={room > 0 ? 'Paste an image URL or /path. Several? One per line.' : 'The gallery is full.'}
          autoComplete="off"
          spellCheck={false}
          disabled={room <= 0}
          value={draft}
          aria-describedby={note ? `${id}-note` : undefined}
          onChange={(event) => {
            setDraft(event.target.value)
            if (note) setNote('')
          }}
          onKeyDown={onDraftKey}
        />
        <button type="button" className={`${admin.button} ${admin.small}`} disabled={room <= 0 || !draft.trim()} onClick={add}>
          <PlusIcon width={14} height={14} /> {draft.trim().split(/\s+/).length > 1 ? 'Add photos' : 'Add photo'}
        </button>
      </div>
      {note && (
        <p id={`${id}-note`} className={styles.warn} role="status">
          {note}
        </p>
      )}
      <p id={`${id}-hint`} className={admin.hint}>
        {field.hint ? `${field.hint} ` : ''}Full URLs or /paths under public/. Up to {MAX_IMAGES}, shown in this order.
      </p>
      {topIssue && <p className={admin.error}>{topIssue}</p>}
    </fieldset>
  )
}
