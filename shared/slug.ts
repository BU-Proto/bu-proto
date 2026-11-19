// Events, wins and roles each have a page named by what they're called: /events/spring-demo-night,
// /wins/sapling, /roles/head-of-scouting. The name is the address, so the portal won't save two
// of one kind under the same name (worker/routes/content.ts).

/** What a name reads as in a URL: "Head of the Fund" is head-of-the-fund, "Pixx AR" is pixx-ar. */
export const slugOf = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** The field each kind of page is named by. */
export const NAME_FIELDS = { events: 'title', wins: 'project', roles: 'title' } as const
export type NamedResource = keyof typeof NAME_FIELDS
