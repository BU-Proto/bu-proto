// Helpers for the detail pages (/wins/:id, /events/:id, /hackathons/:id).

/** Rows stored before the detail-page columns existed can still send null for the text fields. */
export const filled = (value: string | null | undefined): value is string => Boolean(value?.trim())

/** Plain text with blank lines between paragraphs, as the portal stores it. */
export const paragraphs = (value: string) =>
  value
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)

/** The one before and after `id` in an already ordered list. */
export function neighboursOf<T extends { id: number }>(items: readonly T[], id: number) {
  const index = items.findIndex((item) => item.id === id)
  return {
    previous: index > 0 ? items[index - 1] : undefined,
    next: index >= 0 ? items[index + 1] : undefined,
  }
}

/**
 * A long name cut to about `max` characters at the end of a word, with an ellipsis: for places
 * that show a title in passing (the earlier / later bar) and shouldn't break one mid-word.
 */
export function clipAtWord(value: string, max: number): string {
  if (value.length <= max) return value
  const cut = value.slice(0, max + 1)
  const end = cut.lastIndexOf(' ')
  return `${cut.slice(0, end > 0 ? end : max).replace(/[\s,;:.@&|-]+$/, '')}…`
}
