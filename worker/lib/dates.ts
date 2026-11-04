/** Today in Boston as yyyy-mm-dd. Event dates are local days, and UTC rolls over mid-evening. */
export function bostonToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
}
