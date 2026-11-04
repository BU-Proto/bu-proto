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
