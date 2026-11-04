import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { LIGHTBOX } from '../content/site'
import { CloseIcon } from './icons'
import styles from './Gallery.module.css'

const COPY = LIGHTBOX

/**
 * A filmstrip of photos at their own shape: screenshots, diagrams and photos alike, never cropped.
 * It scrolls sideways (swipe, trackpad or the arrow buttons) and each photo opens full screen in a
 * modal lightbox. `label` names them in alt text.
 */
export function Gallery({ images, label }: { images: readonly string[]; label: string }) {
  const [open, setOpen] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const thumbs = useRef<(HTMLButtonElement | null)[]>([])
  // Which thumbnail to hand focus back to once the dialog has closed.
  const lastShown = useRef(0)

  const total = images.length
  const alt = (index: number) => `${label}, photo ${index + 1} of ${total}`

  // The strip's own arrows, shown only when there's more to scroll to on that side.
  const track = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })
  useEffect(() => {
    const node = track.current
    if (!node) return
    const measure = () =>
      setEdges({
        start: node.scrollLeft <= 4,
        end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 4,
      })
    measure()
    node.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    // Photos change the strip's width as they load.
    node.querySelectorAll('img').forEach((img) => img.addEventListener('load', measure))
    return () => {
      node.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [images])
  const scrollStrip = (direction: 1 | -1) => {
    const node = track.current
    if (node) node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: 'smooth' })
  }

  const show = (index: number) => {
    const wrapped = (index + total) % total
    lastShown.current = wrapped
    setOpen(wrapped)
  }

  // Render the photo first, then open in the same tick, so autofocus lands on the close button and
  // an arrow key pressed straight after the click already reaches the dialog.
  const openAt = (index: number) => {
    flushSync(() => show(index))
    dialogRef.current?.showModal()
  }

  // Runs for Escape, the close button and a click outside the photo alike. Focus goes to the photo
  // last shown, not the one that opened the viewer; on the next task, so the browser's own return
  // of focus to the opener doesn't win.
  const onClose = () => {
    setOpen(null)
    const index = lastShown.current
    setTimeout(() => thumbs.current[index]?.focus())
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (open === null) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      show(open + 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      show(open - 1)
    }
  }

  // The stage fills the screen, so a click that lands on it (not the photo or a button) means "out".
  const onStageClick = (event: MouseEvent<HTMLElement>) => {
    if (event.target === event.currentTarget) dialogRef.current?.close()
  }

  return (
    <>
      <div className={styles.strip}>
        <ul ref={track} className={styles.grid}>
          {images.map((src, index) => (
            <li key={`${src}-${index}`} className={styles.item}>
              <button
                ref={(node) => {
                  thumbs.current[index] = node
                }}
                type="button"
                className={styles.thumb}
                onClick={() => openAt(index)}
                aria-haspopup="dialog"
              >
                <img src={src} alt={alt(index)} loading="lazy" decoding="async" />
              </button>
            </li>
          ))}
        </ul>
        {!edges.start && (
          <button type="button" className={`${styles.stripControl} ${styles.stripPrev}`} onClick={() => scrollStrip(-1)} aria-label={COPY.scrollBack}>
            <span aria-hidden="true">←</span>
          </button>
        )}
        {!edges.end && (
          <button type="button" className={`${styles.stripControl} ${styles.stripNext}`} onClick={() => scrollStrip(1)} aria-label={COPY.scrollOn}>
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>

      <dialog ref={dialogRef} className={styles.lightbox} aria-label={COPY.label} onClose={onClose} onKeyDown={onKeyDown}>
        {open !== null && (
          <div className={styles.stage} onClick={onStageClick}>
            <figure className={styles.figure} onClick={onStageClick}>
              {/* key remounts the img so the fade-in plays for each photo. */}
              <img key={images[open]} className={styles.full} src={images[open]} alt={alt(open)} />
            </figure>

            <p className={styles.counter} aria-live="polite">
              {open + 1} of {total}
            </p>

            <button type="button" className={`${styles.control} ${styles.close}`} onClick={() => dialogRef.current?.close()} aria-label={COPY.close} autoFocus>
              <CloseIcon />
            </button>
            {total > 1 && (
              <>
                <button type="button" className={`${styles.control} ${styles.prev}`} onClick={() => show(open - 1)} aria-label={COPY.previous}>
                  <span aria-hidden="true">←</span>
                </button>
                <button type="button" className={`${styles.control} ${styles.nextBtn}`} onClick={() => show(open + 1)} aria-label={COPY.next}>
                  <span aria-hidden="true">→</span>
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  )
}
