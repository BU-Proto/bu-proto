import { useId, useRef, useState, type KeyboardEvent } from 'react'
import type { PersonKind, PersonSummary } from '../../../shared/api'
import ui from '../admin.module.css'
import { personDetail, toPicked, type PickedPerson } from '../lib/activity'
import { useApi, useDebounced } from '../pages/people/useApi'
import type { ControlProps } from './Field'
import { SearchIcon } from './icons'
import styles from './PersonPicker.module.css'

export type { PickedPerson } from '../lib/activity'

interface PersonPickerProps extends Partial<ControlProps> {
  value: PickedPerson | null
  onChange: (person: PickedPerson | null) => void
  /** Which kinds of people it offers (all of them when left out). */
  kinds?: readonly PersonKind[]
  /** Keys it leaves out (the other side of an intro, guests already on the event). */
  exclude?: readonly string[]
  placeholder?: string
  disabled?: boolean
}

/**
 * Search People by name or email and pick one. A combobox: type to search, arrows to move,
 * Enter to pick, Escape to close the list. Once someone's picked they show as a chip with a way
 * to change them. People is searched on the server (GET /api/admin/people?q=), so a list of
 * thousands stays quick; if it can't be reached, the list says so instead of breaking the form.
 */
export function PersonPicker({ value, onChange, kinds, exclude, placeholder = 'Search by name or email', disabled, ...control }: PersonPickerProps) {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const debounced = useDebounced(query.trim(), 200)
  // One kind is filtered on the server; several (members and leads) are filtered here.
  const kindParam = kinds?.length === 1 ? `&kind=${kinds[0]}` : ''
  const { data, error, loading } = useApi<{ items: PersonSummary[] }>(open ? `/admin/people?q=${encodeURIComponent(debounced)}${kindParam}` : null)
  const results = (data?.items ?? [])
    .filter((person) => !kinds || kinds.includes(person.kind))
    .filter((person) => !exclude?.includes(person.key))
    .slice(0, 8)

  function pick(person: PersonSummary) {
    onChange(toPicked(person))
    setQuery('')
    setOpen(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && open) {
      // Enter picks rather than submitting the dialog's form.
      event.preventDefault()
      const person = results[active]
      if (person) pick(person)
    } else if (event.key === 'Escape' && open) {
      // Closes the list, not the dialog around it.
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    }
  }

  if (value) {
    return (
      <div className={styles.chosen}>
        <span className={ui.avatar} aria-hidden="true">
          {value.name.slice(0, 1).toUpperCase()}
        </span>
        <span className={styles.chosenText}>
          <span className={styles.chosenName}>{value.name}</span>
          {value.detail && <span className={styles.chosenDetail}>{value.detail}</span>}
        </span>
        {!disabled && (
          <button
            type="button"
            className={`${ui.ghost} ${ui.small}`}
            onClick={() => {
              onChange(null)
              setOpen(true)
              requestAnimationFrame(() => inputRef.current?.focus())
            }}
          >
            Change
          </button>
        )}
      </div>
    )
  }

  const activeId = open && results[active] ? `${listId}-${active}` : undefined
  return (
    <div className={styles.picker}>
      <div className={ui.search}>
        <SearchIcon />
        <input
          {...control}
          ref={inputRef}
          type="search"
          className={ui.input}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          // Late enough that a click on an option lands first.
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && (
        <ul id={listId} role="listbox" className={styles.list} aria-label="People">
          {error ? (
            <li className={styles.message}>Couldn’t load People. {error.message}</li>
          ) : !data && loading ? (
            <li className={styles.message}>Searching…</li>
          ) : results.length === 0 ? (
            <li className={styles.message}>{debounced ? `No one matches “${debounced}”.` : 'No one to pick yet.'}</li>
          ) : (
            results.map((person, index) => (
              <li
                key={person.key}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                className={styles.option}
                // mousedown, so the input keeps focus and the blur doesn't close the list first.
                onMouseDown={(event) => {
                  event.preventDefault()
                  pick(person)
                }}
                onMouseEnter={() => setActive(index)}
              >
                <span className={styles.optionName}>{person.name}</span>
                <span className={styles.optionDetail}>{personDetail(person)}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
