// The shape of a playbook guide. Guides are typed content, like the legal pages, so the copy
// lives here and the page only lays it out.

/** A link inside guide copy. `/…` routes inside the site; anything else opens as a plain link. */
export interface GuideLink {
  label: string
  href: string
}

/** A run of text: plain, a link, or a bold lead-in. */
export type Inline = string | GuideLink | { strong: string }

/** One paragraph, or one list item. A string when it has no links or bold. */
export type Rich = string | readonly Inline[]

/** One of our wins, told as an example of the point being made. */
export interface WinExample {
  win: WinRef
  text: Rich
}

export type Block =
  | Rich
  | { list: readonly Rich[] }
  /** Numbered, for things that happen in order. */
  | { steps: readonly Rich[] }
  /** A short aside worth stopping on: a rule of thumb or a warning. */
  | { callout: Rich }
  /** "Do this": things to tick off before or during the weekend. */
  | { checklist: readonly Rich[]; title: string }
  | { example: WinExample }
  /** Label and detail pairs, for the breakdowns. */
  | { facts: readonly { term: string; detail: Rich }[] }

export interface GuideSection {
  /** The anchor for the contents list. */
  id: string
  title: string
  body: readonly Block[]
}

/** A guide's body. Its title and one-line summary live in the Resources index, so the list
 * page can name every guide without loading their text. */
export interface GuideDoc {
  slug: string
  sections: readonly GuideSection[]
}

/** The facts about a win a guide needs to name it and link to it. */
export interface WinRef {
  id: number
  project: string
  prize: string
  event: string
}
