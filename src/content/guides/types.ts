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

/** The facts about a win a guide needs to name it, link to it and show it. */
export interface WinRef {
  id: number
  project: string
  prize: string
  event: string
  /** The win's cover on Devpost's CDN, full size. `winThumb` gives the small one. */
  cover: string
}

/** Where a picture came from. Win images credit the team's write-up; BU photos their Commons page. */
export type ImageCredit = { win: WinRef } | { author: string; license: string; source: string }

export interface GuideImage {
  src: string
  alt: string
  credit: ImageCredit
  /** A smaller copy for thumbnails, when the source has one. */
  thumb?: string
}

/** One of our wins, told as an example of the point being made. */
export interface WinExample {
  win: WinRef
  text: Rich
}

/** The diagrams drawn in code. Each one is a component on the guide page. */
export type GraphicName =
  | 'weekend'
  | 'angles'
  | 'demo-clock'
  | 'win-index'
  | 'event-shape'
  | 'scorecard'
  | 'roles'
  | 'demo-path'

export type Block =
  | Rich
  | { list: readonly Rich[] }
  /** Numbered, for things that happen in order. Set big. */
  | { steps: readonly Rich[] }
  /** A rule of thumb worth stopping on. `label` replaces "Rule of thumb" above it. */
  | { callout: Rich; label?: string }
  /** A line lifted from the text around it and set large. Read once: screen readers skip it. */
  | { pull: string }
  /** "Do this": things to tick off before or during the weekend. */
  | { checklist: readonly Rich[]; title: string }
  | { example: WinExample }
  /** Label and detail pairs, for the breakdowns. */
  | { facts: readonly { term: string; detail: Rich }[] }
  /** A picture wider than the text. `tall` sets a portrait one beside its caption. */
  | { figure: GuideImage; caption: Rich; shape?: 'wide' | 'tall' }
  | { graphic: GraphicName }

export interface GuideSection {
  /** The anchor for the contents list. */
  id: string
  title: string
  body: readonly Block[]
}

/** A guide's body. Its title, one-line summary, lead image and byline live in the Resources
 * index, so the list page can show every guide without loading their text. */
export interface GuideDoc {
  slug: string
  /** The opening paragraph, set larger than the body, before the first section. */
  standfirst: Rich
  sections: readonly GuideSection[]
}
