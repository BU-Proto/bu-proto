// The portal's pointer drag: the press → drag → drop lifecycle a draggable list needs, brought over
// from trov (web/src/pointer-drag.ts). What a list draws while it drags and what a drop commits
// are its own handlers; this module owns the rules:
//   • mouse and pen only: on touch a press must still scroll the list;
//   • a press becomes a drag only past DRAG_SLOP px, so a plain click still opens what was
//     pressed, and the click a real drag's release fires is swallowed (it is not an "open");
//   • a claimed press never selects text or starts the browser's own drag;
//   • Escape (the drag's alone) and pointercancel cancel; pointerup drops.
// One drag at a time across every list.

export const DRAG_SLOP = 5

export interface DragHandlers<P> {
  /** A press on `target`: this list's payload when it is one of its rows, else null (not ours). */
  press(target: Element, event: PointerEvent): P | null
  /** The press moved past the slop: lift it (build the ghost, mark the row). */
  begin(payload: P, event: PointerEvent): void
  /** The pointer moved while dragging. */
  over(payload: P, event: PointerEvent): void
  /** Released (`commit`) or cancelled. Call `done()` once the drop has settled (an animation may run first). */
  drop(payload: P, commit: boolean, done: () => void): void
}

interface Live {
  mount: HTMLElement
  handlers: DragHandlers<unknown>
  payload: unknown
  x: number
  y: number
  begun: boolean
  settling: boolean
}

let live: Live | null = null
let swallowClick = false
let listening = false

function finish() {
  live = null
  delete document.documentElement.dataset.grabbing
}

function end(commit: boolean) {
  const drag = live
  if (!drag || drag.settling) return
  if (!drag.begun) {
    // A plain click: let it open what was pressed.
    live = null
    return
  }
  // The click this release fires is not an "open".
  swallowClick = true
  setTimeout(() => {
    swallowClick = false
  }, 0)
  drag.settling = true
  let once = false
  drag.handlers.drop(drag.payload, commit, () => {
    if (once) return
    once = true
    finish()
  })
}

function listen() {
  if (listening) return
  listening = true
  document.addEventListener('pointermove', (event) => {
    const drag = live
    if (!drag || drag.settling) return
    if (!drag.begun) {
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < DRAG_SLOP) return
      drag.begun = true
      // A selection made before the press.
      document.getSelection()?.removeAllRanges()
      document.documentElement.dataset.grabbing = ''
      drag.handlers.begin(drag.payload, event)
    }
    event.preventDefault()
    drag.handlers.over(drag.payload, event)
  })
  // A claimed press is a drag handle: no text selection (the highlight would trail the drag) and
  // no native drag of a selection or a link (it would cancel this one with a pointercancel).
  document.addEventListener('selectstart', (event) => {
    if (live) event.preventDefault()
  })
  document.addEventListener('dragstart', (event) => {
    if (live) event.preventDefault()
  })
  document.addEventListener('pointerup', () => end(true))
  document.addEventListener('pointercancel', () => end(false))
  // Escape mid-drag cancels the drag and nothing else (not the dialog or menu the list sits in):
  // heard in the capture phase, ahead of every other key handler.
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape' || !live?.begun) return
      event.preventDefault()
      event.stopImmediatePropagation()
      end(false)
    },
    true,
  )
  document.addEventListener(
    'click',
    (event) => {
      if (!swallowClick) return
      swallowClick = false
      event.stopPropagation()
      event.preventDefault()
    },
    true,
  )
}

/** Make the rows inside `mount` draggable. Returns the way to stop (a drag under way is cancelled). */
export function pointerDrag<P>(mount: HTMLElement, handlers: DragHandlers<P>): () => void {
  listen()
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || event.pointerType === 'touch' || live) return
    if (!(event.target instanceof Element)) return
    const payload = handlers.press(event.target, event)
    if (payload === null) return
    live = { mount, handlers: handlers as DragHandlers<unknown>, payload, x: event.clientX, y: event.clientY, begun: false, settling: false }
  }
  mount.addEventListener('pointerdown', down)
  return () => {
    mount.removeEventListener('pointerdown', down)
    if (live?.mount === mount) end(false)
  }
}
