import type { SVGProps } from 'react'
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

