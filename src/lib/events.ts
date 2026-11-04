// Small helpers for showing an event, shared by the home page and the events page.

/** The kind only adds something when the title doesn't already say it ("Hack night" vs "Weekly hack night"). */
export const kindAddsInfo = (kind: string, title: string) => !title.toLowerCase().includes(kind.toLowerCase())
