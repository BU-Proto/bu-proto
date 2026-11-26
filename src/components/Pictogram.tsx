import type { SVGProps } from 'react'

/**
 * Simple flat pictograms for the inner pages, after the section tiles on brand.dropbox.com: bold
 * shapes in one colour (currentColor), usually set in a tile's ink on its own tone. Decoration
 * only, so screen readers skip them.
 */
export type PictogramName =
  | 'ask'
  | 'yes'
  | 'go'
  | 'demo'
  | 'flag'
  | 'trophy'
  | 'seat'
  | 'compass'
  | 'calendar'
  | 'spark'

export function Pictogram({ name, ...props }: { name: PictogramName } & SVGProps<SVGSVGElement>) {
  const common = { viewBox: '0 0 120 120', 'aria-hidden': true, focusable: false, ...props } as const
  switch (name) {
    case 'ask':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round">
          <path d="M38 42a22 22 0 1 1 30 20c-6 3-8 7-8 14" />
          <circle cx="60" cy="98" r="3" fill="currentColor" strokeWidth={10} />
        </svg>
      )
    case 'yes':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 62l24 24 52-54" />
        </svg>
      )
    case 'go':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 60h80M68 30l30 30-30 30" />
        </svg>
      )
    case 'demo':
      return (
        <svg {...common} fill="currentColor">
          <path d="M36 22l64 38-64 38z" />
        </svg>
      )
    case 'flag':
      return (
        <svg {...common} fill="currentColor">
          <rect x="24" y="14" width="10" height="94" />
          <path d="M34 18h62l-14 22 14 22H34z" />
        </svg>
      )
    case 'trophy':
      return (
        <svg {...common} fill="currentColor" fillRule="evenodd">
          <path d="M34 14h52v30a26 26 0 0 1-52 0z M18 22h16v10H26v6a8 8 0 0 0 8 8v10a18 18 0 0 1-16-18z M102 22H86v10h8v6a8 8 0 0 1-8 8v10a18 18 0 0 0 16-18z" />
          <rect x="54" y="70" width="12" height="18" />
          <rect x="36" y="88" width="48" height="14" />
        </svg>
      )
    case 'seat':
      return (
        <svg {...common} fill="currentColor">
          <rect x="30" y="14" width="60" height="52" />
          <rect x="22" y="66" width="76" height="16" />
          <rect x="28" y="82" width="10" height="26" />
          <rect x="82" y="82" width="10" height="26" />
        </svg>
      )
    case 'compass':
      return (
        <svg {...common} fill="currentColor" fillRule="evenodd">
          <path d="M60 10a50 50 0 1 1 0 100a50 50 0 1 1 0-100z M60 24a36 36 0 1 0 0 72a36 36 0 1 0 0-72z" />
          <path d="M78 42L66 66 42 78 54 54z" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common} fill="currentColor" fillRule="evenodd">
          <path d="M14 26h92v80H14z M26 48v46h68V48z" />
          <rect x="32" y="12" width="10" height="24" />
          <rect x="78" y="12" width="10" height="24" />
          <rect x="34" y="58" width="16" height="14" />
        </svg>
      )
    case 'spark':
      return (
        <svg {...common} fill="currentColor">
          <path d="M60 8l10 40 40 12-40 12-10 40-10-40-40-12 40-12z" />
        </svg>
      )
  }
}
