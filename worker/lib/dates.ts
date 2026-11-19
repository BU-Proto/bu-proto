/** Today in Boston as yyyy-mm-dd. Event dates are local days, and UTC rolls over mid-evening. */
export function bostonToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
}

/** The day in Boston (yyyy-mm-dd) of a UTC timestamp as SQLite writes it ("2026-11-20 01:30:00"). */
export function bostonDay(stamp: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(`${stamp.replace(' ', 'T')}Z`))
}
