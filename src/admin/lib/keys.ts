import { useEffect, type RefObject } from 'react'

/** Whether this is a Mac, for how shortcuts are written. */
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

/** The command menu's shortcut and the save shortcut, as this machine writes them. */
export const COMMAND_KEYS = isMac ? '⌘K' : 'Ctrl K'
export const SAVE_KEYS = isMac ? '⌘S' : 'Ctrl S'

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

/** "/" puts the cursor in a page's search box, unless you're already typing somewhere. */
export function useSlashFocus(input: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      // A dialog over the page owns the keyboard.
      if (document.querySelector('dialog[open]')) return
      event.preventDefault()
      input.current?.focus()
      input.current?.select()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [input])
}

/** How sending is written on this machine: ⌘↵ or Ctrl ↵. */
export const SEND_KEYS = isMac ? '⌘↵' : 'Ctrl ↵'

/**
 * Single-key shortcuts for a page, like a mail app's: each key runs its action unless you're
 * typing in a field, a modifier is held, or a dialog is open.
 */
export function useKeys(actions: Record<string, () => void>, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      if (document.querySelector('dialog[open]')) return
      const action = actions[event.key]
      if (!action) return
      event.preventDefault()
      action()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [actions, enabled])
}

/** ⌘S / Ctrl+S saves the form on screen instead of the web page. */
export function useSaveShortcut(save: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 's' || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return
      event.preventDefault()
      if (document.querySelector('dialog[open]')) return
      save()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save, enabled])
}
