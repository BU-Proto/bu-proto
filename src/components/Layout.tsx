import { useEffect, useRef } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { AsciiField, DEFAULT_FIELD_SETTINGS, type AsciiFieldHandle } from '../ascii-field'
import { Footer } from './Footer'
import { TopBar } from './TopBar'
import styles from './Layout.module.css'

/** Every page: the ASCII field mounted once behind everything, the top bar, the page, the footer. */
export function Layout() {
  const fieldRef = useRef<AsciiFieldHandle>(null)
  const shellRef = useRef<HTMLDivElement>(null)

  // The field re-measures marked text on scroll and resize, but not when a new page or a
  // form's thank-you state mounts new text. Tell it whenever the content changes.
  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return
    const pending = { frame: 0 }
    const observer = new MutationObserver(() => {
      if (pending.frame) return
      pending.frame = requestAnimationFrame(() => {
        pending.frame = 0
        fieldRef.current?.refreshClearMask()
      })
    })
    observer.observe(shell, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      cancelAnimationFrame(pending.frame)
    }
  }, [])

  return (
    <>
      <AsciiField ref={fieldRef} settings={DEFAULT_FIELD_SETTINGS} className={styles.field} />
      <div ref={shellRef} className={styles.shell}>
        <TopBar />
        <main className={styles.main}>
          <Outlet />
        </main>
        <Footer />
      </div>
      <ScrollRestoration />
    </>
  )
}
