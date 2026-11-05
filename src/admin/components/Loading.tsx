// Inline styles on purpose: this renders before any portal CSS has loaded.

/** Shown while the shell's code and /api/admin/me load on a fresh visit. */
export function Loading() {
  return (
    <p role="status" style={{ margin: 0, padding: 24, color: 'var(--ink-dim)', fontFamily: 'var(--font-ui)', fontSize: 13 }}>
      Loading the portal…
    </p>
  )
}
