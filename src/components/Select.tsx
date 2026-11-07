import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Glass } from './Glass'
import { inputClass } from './formFields'
import styles from './Select.module.css'

export type SelectOption<T extends string = string> = T | { value: T; label: string }

interface SelectProps<T extends string> {
  /** The field's name in the form's values. */
  name: string
  /** Plain strings are both the value and the label, as with a bare <option>. */
  options: readonly SelectOption<T>[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  defaultValue?: T | ''
  /** Pass with onChange to control it; leave both out and it keeps its own value. */
  value?: T | ''
  onChange?: (value: T) => void
  /** Goes on the trigger, so a <label htmlFor> can point at it. */
  id?: string
  /** Replaces the trigger's input look, e.g. for a page with its own field style. */
  className?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

/** The list's corner, --radius-menu in index.css: the glass's maps are cut to it. */
const MENU_RADIUS = 20

/** Tallest the list grows before it scrolls. */
const MAX_HEIGHT = 288
/** Space between the trigger and the list, and the least it keeps from the viewport's edge. */
const GAP = 6
const EDGE = 8
/** How long a pause in typing starts a fresh type-ahead search. */
const TYPEAHEAD_MS = 600

interface Placement {
  left: number
  width: number
  top?: number
  bottom?: number
  maxHeight: number
  up: boolean
}

/**
 * A single-select dropdown in the site's own style, after the WAI-ARIA select-only combobox.
 * Focus stays on the trigger; the list is portalled to <body> so no panel clips it, and it flips
 * above the trigger when there isn't room below. The value rides along in a visually hidden
 * input, so a plain <form> (and its required check) sees it like any other field.
 */
export function Select<T extends string>({
  name,
  options,
  placeholder = 'Pick one',
  required,
  disabled,
  defaultValue = '',
  value,
  onChange,
  id,
  className = inputClass,
  ...aria
}: SelectProps<T>) {
  const items = options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option))
  const [own, setOwn] = useState<T | ''>(defaultValue)
  const current = value !== undefined ? value : own
  const selectedIndex = items.findIndex((item) => item.value === current)

  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [place, setPlace] = useState<Placement | null>(null)
  // Set when a submit found it empty, so it shows as wrong until someone picks.
  const [missed, setMissed] = useState(false)

  const baseId = useId()
  const listId = `${baseId}-list`
  const optionId = (index: number) => `${baseId}-option-${index}`

  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const proxyRef = useRef<HTMLInputElement>(null)
  const typed = useRef({ text: '', at: 0 })
  // Hovering moves the highlight without scrolling; keys and opening scroll it into view.
  const reveal = useRef(true)
  const announce = useRef(false)

  const show = (index: number) => {
    reveal.current = true
    setActive(Math.max(0, Math.min(items.length - 1, index)))
    setOpen(true)
  }

  const choose = (index: number) => {
    const item = items[index]
    setOpen(false)
    if (!item) return
    setMissed(false)
    if (item.value === current) return
    if (value === undefined) setOwn(item.value)
    announce.current = true
    onChange?.(item.value)
  }

  // Tell the form a field changed, as typing in an input would, once the new value is in place.
  useEffect(() => {
    if (!announce.current) return
    announce.current = false
    proxyRef.current?.dispatchEvent(new Event('input', { bubbles: true }))
  }, [current])

  // Match the native select's wording rather than the text input's "fill out this field".
  useEffect(() => {
    proxyRef.current?.setCustomValidity(required && !current ? 'Pick one from the list.' : '')
  }, [required, current])

  // A form reset puts it back to where it started, as it would a native select.
  useEffect(() => {
    const form = proxyRef.current?.form
    if (!form) return
    const reset = () => {
      setOwn(defaultValue)
      setMissed(false)
    }
    form.addEventListener('reset', reset)
    return () => form.removeEventListener('reset', reset)
  }, [defaultValue])

  // Fixed to the viewport, so it follows the trigger through scrolls and resizes.
  useLayoutEffect(() => {
    if (!open) return
    const measure = () => {
      const trigger = triggerRef.current
      const list = listRef.current
      if (!trigger || !list) return
      const rect = trigger.getBoundingClientRect()
      const viewport = document.documentElement.clientHeight
      const wanted = Math.min(list.scrollHeight, MAX_HEIGHT)
      const below = viewport - rect.bottom - GAP - EDGE
      const above = rect.top - GAP - EDGE
      const up = below < wanted && above > below
      setPlace({
        left: rect.left,
        width: rect.width,
        top: up ? undefined : rect.bottom + GAP,
        bottom: up ? viewport - rect.top + GAP : undefined,
        maxHeight: Math.max(0, Math.min(MAX_HEIGHT, up ? above : below)),
        up,
      })
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { capture: true, passive: true })
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, { capture: true })
    }
  }, [open])

  // Scroll the list itself (not the page) so the active option is in view.
  useLayoutEffect(() => {
    const list = listRef.current
    if (!open || !list || !reveal.current) return
    const option = list.children[active] as HTMLElement | undefined
    if (!option) return
    // Keep the list's own padding in view too, so the first and last options sit flush.
    const pad = (list.firstElementChild as HTMLElement).offsetTop
    const top = option.offsetTop - pad
    const bottom = option.offsetTop + option.offsetHeight + pad
    if (top < list.scrollTop) list.scrollTop = top
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight
  }, [open, active, place])

  // A press anywhere else closes it without choosing.
  useEffect(() => {
    if (!open) return
    const away = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', away, true)
    return () => document.removeEventListener('pointerdown', away, true)
  }, [open])

  /** The next option whose label starts with what's been typed, starting past the active one. */
  const typeahead = (key: string) => {
    const now = Date.now()
    const text = now - typed.current.at > TYPEAHEAD_MS ? key : typed.current.text + key
    typed.current = { text, at: now }
    // Pressing one letter over and over steps through the options that start with it.
    const query = [...text].every((char) => char === text[0]) ? text[0] : text
    const from = open ? active : Math.max(selectedIndex, 0)
    const start = query.length === 1 ? from + 1 : from
    for (let step = 0; step < items.length; step++) {
      const index = (start + step) % items.length
      if (items[index].label.toLowerCase().startsWith(query.toLowerCase())) return index
    }
    return -1
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const { key, altKey, ctrlKey, metaKey } = event
    const last = items.length - 1
    const typing = key.length === 1 && !ctrlKey && !metaKey && !altKey
    const midWord = Date.now() - typed.current.at <= TYPEAHEAD_MS && typed.current.text !== ''

    if (typing && !(key === ' ' && !midWord)) {
      event.preventDefault()
      const match = typeahead(key)
      if (match >= 0) show(match)
      else if (!open) show(Math.max(selectedIndex, 0))
      return
    }

    if (!open) {
      const from = Math.max(selectedIndex, 0)
      const opens: Record<string, number> = { ArrowDown: from, ArrowUp: from, Enter: from, ' ': from, Home: 0, End: last }
      if (key in opens) {
        event.preventDefault()
        show(opens[key])
      }
      return
    }

    const page = Math.max(1, Math.floor((listRef.current?.clientHeight ?? 0) / 40) - 1)
    const moves: Record<string, number> = {
      ArrowDown: active + 1,
      ArrowUp: active - 1,
      Home: 0,
      End: last,
      PageDown: active + page,
      PageUp: active - page,
    }
    if (key in moves && !(key === 'ArrowUp' && altKey)) {
      event.preventDefault()
      show(moves[key])
    } else if (key === 'Enter' || key === ' ' || (key === 'ArrowUp' && altKey)) {
      event.preventDefault()
      choose(active)
    } else if (key === 'Escape') {
      // Keep an enclosing dialog from closing along with the list.
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    } else if (key === 'Tab') {
      // Let focus move on as usual, keeping what was highlighted.
      choose(active)
    }
  }

  const listStyle: CSSProperties | undefined = place
    ? { left: place.left, width: place.width, top: place.top, bottom: place.bottom, maxHeight: place.maxHeight }
    : undefined

  const label = selectedIndex >= 0 ? items[selectedIndex].label : null
  const invalid = aria['aria-invalid'] || missed

  return (
    <span className={styles.root}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        className={`${className} ${styles.trigger}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-required={required || undefined}
        aria-label={aria['aria-label']}
        aria-labelledby={aria['aria-labelledby']}
        aria-describedby={aria['aria-describedby']}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show(Math.max(selectedIndex, 0)))}
        onKeyDown={onKeyDown}
        // A button acts on Space's keyup; the keydown above has already handled it.
        onKeyUp={(event) => event.key === ' ' && event.preventDefault()}
        onBlur={(event) => {
          if (!listRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false)
        }}
      >
        <span className={label === null ? styles.placeholder : styles.value}>{label ?? placeholder}</span>
        <svg className={styles.chevron} viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>
      {/* Not type="hidden": those skip the required check. Focus that lands here goes to the trigger. */}
      <input
        ref={proxyRef}
        className={styles.proxy}
        name={name}
        value={current}
        onChange={() => {}}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        onFocus={() => triggerRef.current?.focus()}
        onInvalid={() => setMissed(true)}
      />
      {createPortal(
        // The list floats over the page, so it's the same liquid glass as the top bar's menus: the
        // glass on the outer box, the options scrolling inside it.
        <div
          className={styles.menu}
          style={listStyle}
          data-up={place?.up || undefined}
          hidden={!open}
          // Keep focus (and the highlight) on the trigger while choosing with a pointer.
          onMouseDown={(event) => event.preventDefault()}
        >
          <Glass radius={MENU_RADIUS} bezel={14} bend={28} />
          <div ref={listRef} id={listId} role="listbox" className={styles.list} tabIndex={-1}>
          {items.map((item, index) => (
            <div
              key={item.value}
              id={optionId(index)}
              role="option"
              className={styles.option}
              aria-selected={index === selectedIndex}
              data-active={index === active || undefined}
              onPointerMove={(event) => {
                if (event.pointerType !== 'mouse' || index === active) return
                reveal.current = false
                setActive(index)
              }}
              onClick={() => {
                choose(index)
                triggerRef.current?.focus()
              }}
            >
              <span>{item.label}</span>
              <svg className={styles.check} viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
              </svg>
            </div>
          ))}
          </div>
        </div>,
        document.body,
      )}
    </span>
  )
}
