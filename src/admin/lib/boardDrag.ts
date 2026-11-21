import { pointerDrag } from './pointerDrag'

// A board's card drag, brought over from trov's ticket board (web/src/main.ts). Pointer-driven,
// not HTML5 drag-and-drop: the browser's own drag image is a shrunken, translucent snapshot the
// page can't size. Instead:
//   • the card lifts out: a full-size clone (the ghost) follows the pointer, and the card itself
//     is replaced by a slot the same height;
//   • the slot moves to the column under the pointer, at the place the card would land there,
//     and the cards around it slide apart to make room (FLIP: measure, move the slot, animate
//     each card from where it was);
//   • on release the ghost glides into the slot, then the move is handed to `onDrop`.
// The columns themselves aren't highlighted: the slot says where the card goes.
//
// The markup it reads: a lane is `[data-lane="<name>"]` with its cards as direct children, and a
// card is `[data-card]`. While lifted a card carries `data-lifted` (the page hides it). The slot
// and the ghost are this module's own nodes; the page's cards are never moved, so React's tree
// stays as it rendered it until `onDrop` changes the data.

const SLIDE_MS = 160
const EASE = 'cubic-bezier(.2,.7,.2,1)'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export interface BoardDragOptions {
  /** Classes for the two things the drag draws. */
  ghostClass: string
  slotClass: string
  /** Which of `cards` (another lane's, top to bottom) the dragged card would land before; null is the end. */
  landing(card: HTMLElement, cards: HTMLElement[]): HTMLElement | null
  /** The card was dropped in another lane. */
  onDrop(card: HTMLElement, lane: string): void
}

interface Press {
  card: HTMLElement
  from: string
  x: number
  y: number
  /** Where on the card it was pressed, so the ghost stays under the pointer as it was grabbed. */
  dx: number
  dy: number
  ghost: HTMLElement | null
  slot: HTMLElement | null
  /** Where the card started: its lane and the card after it. */
  home: HTMLElement | null
  homeNext: HTMLElement | null
}

/** A card that takes part in its lane's layout (not the lifted one). */
const isLive = (el: Element | null): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute('data-card') && !el.hasAttribute('data-lifted')
const liveCards = (lane: Element) => Array.from(lane.children).filter(isLive)

/** The first live card after `el` in its lane (null is the end). */
function nextLive(el: Element): HTMLElement | null {
  for (let next = el.nextElementSibling; next; next = next.nextElementSibling) {
    if (isLive(next)) return next
  }
  return null
}

/** Move the slot into `lane` before `ref` (null is the end), sliding every card it displaces from where it was. */
function moveSlot(slot: HTMLElement, lane: HTMLElement, ref: HTMLElement | null) {
  if (slot.parentElement === lane && nextLive(slot) === ref) return
  const lanes = new Set<HTMLElement>([lane])
  if (slot.parentElement instanceof HTMLElement) lanes.add(slot.parentElement)
  const cards = Array.from(lanes).flatMap(liveCards)
  const before = new Map(cards.map((card) => [card, card.getBoundingClientRect().top]))
  lane.insertBefore(slot, ref)
  if (reducedMotion()) return
  for (const card of cards) {
    const dy = (before.get(card) ?? 0) - card.getBoundingClientRect().top
    if (Math.abs(dy) < 0.5) continue
    card.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: SLIDE_MS, easing: EASE })
  }
  slot.animate([{ opacity: 0 }, { opacity: 1 }], { duration: SLIDE_MS })
}

/** Make the cards on `board` draggable between its lanes. Returns the way to stop. */
export function boardDrag(board: HTMLElement, options: BoardDragOptions): () => void {
  function clear(press: Press) {
    press.slot?.remove()
    press.ghost?.remove()
    press.card.removeAttribute('data-lifted')
  }

  return pointerDrag<Press>(board, {
    press(target, event) {
      const card = target.closest<HTMLElement>('[data-card]')
      const from = card?.closest<HTMLElement>('[data-lane]')?.dataset.lane
      if (!card || from === undefined) return null
      return { card, from, x: event.clientX, y: event.clientY, dx: 0, dy: 0, ghost: null, slot: null, home: null, homeNext: null }
    },

    begin(press) {
      const rect = press.card.getBoundingClientRect()
      press.dx = press.x - rect.left
      press.dy = press.y - rect.top
      const ghost = press.card.cloneNode(true) as HTMLElement
      ghost.classList.add(options.ghostClass)
      ghost.removeAttribute('data-card')
      ghost.setAttribute('aria-hidden', 'true')
      ghost.style.width = `${rect.width}px`
      ghost.style.height = `${rect.height}px`
      ghost.style.left = `${rect.left}px`
      ghost.style.top = `${rect.top}px`
      // Inside the board, so the card's colours resolve exactly as they do in a lane.
      board.appendChild(ghost)
      press.ghost = ghost
      const slot = document.createElement('div')
      slot.className = options.slotClass
      slot.style.height = `${rect.height}px`
      press.home = press.card.parentElement
      press.homeNext = nextLive(press.card)
      press.card.parentElement?.insertBefore(slot, press.card)
      press.card.setAttribute('data-lifted', '')
      press.slot = slot
    },

    over(press, event) {
      const { ghost, slot } = press
      if (!ghost || !slot) return
      ghost.style.left = `${event.clientX - press.dx}px`
      ghost.style.top = `${event.clientY - press.dy}px`
      const lane = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-lane]') ?? null
      if (!lane || !board.contains(lane)) return
      // Back over its own lane the slot returns to where the card was; anywhere else it shows
      // where the card would land.
      moveSlot(slot, lane, lane === press.home ? press.homeNext : options.landing(press.card, liveCards(lane)))
    },

    drop(press, commit, done) {
      const { ghost, slot } = press
      const to = slot?.closest<HTMLElement>('[data-lane]')?.dataset.lane ?? press.from
      const finish = () => {
        clear(press)
        done()
        if (commit && to !== press.from) options.onDrop(press.card, to)
      }
      if (!ghost || !slot || !commit || reducedMotion()) {
        finish()
        return
      }
      // Glide the lifted card into its slot, then commit.
      const target = slot.getBoundingClientRect()
      const now = ghost.getBoundingClientRect()
      const glide = ghost.animate(
        [{ transform: 'none' }, { transform: `translate(${target.left - now.left}px, ${target.top - now.top}px)`, boxShadow: 'none' }],
        { duration: 150, easing: EASE, fill: 'forwards' },
      )
      glide.onfinish = finish
      glide.oncancel = finish
    },
  })
}
