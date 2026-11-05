import type { SVGProps } from 'react'
import type { CoverIconName } from '../content/grants'
import type { NoteIconName } from '../content/home'

type IconProps = SVGProps<SVGSVGElement>

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export function MenuIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 9h16M4 15h16" />
    </Svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  )
}

export function PinIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <path d="M12 21s6-5.5 6-10a6 6 0 0 0-12 0c0 4.5 6 10 6 10z" />
      <circle cx="12" cy="11" r="2" />
    </Svg>
  )
}

export function NoteIcon({ name, ...props }: IconProps & { name: NoteIconName }) {
  switch (name) {
    case 'grants':
      return (
        <Svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v8M9 10.5h4.5a1.5 1.5 0 0 1 0 3H10.5a1.5 1.5 0 0 0 0 3H15" />
        </Svg>
      )
    case 'handoff':
      return (
        <Svg {...props}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </Svg>
      )
  }
}

export function CoverIcon({ name, ...props }: IconProps & { name: CoverIconName }) {
  switch (name) {
    case 'travel':
      return (
        <Svg {...props}>
          <rect x="5" y="4" width="14" height="13" rx="3" />
          <path d="M5 11h14M8.5 20l1.5-3M15.5 20 14 17" />
          <circle cx="8.5" cy="14" r=".6" />
          <circle cx="15.5" cy="14" r=".6" />
        </Svg>
      )
    case 'registration':
      return (
        <Svg {...props}>
          <path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2z" />
          <path d="M14 6v12" strokeDasharray="1.5 2" />
        </Svg>
      )
    case 'credits':
      return (
        <Svg {...props}>
          <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12" />
        </Svg>
      )
    case 'hardware':
      return (
        <Svg {...props}>
          <rect x="7" y="7" width="10" height="10" rx="1.5" />
          <path d="M10 4v3M14 4v3M10 17v3M14 17v3M4 10h3M4 14h3M17 10h3M17 14h3" />
        </Svg>
      )
  }
}
