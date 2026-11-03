import type { SVGProps } from 'react'
import type { FeatureIconName } from '../content/hero'

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

export function LogoMark(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 4h7.2a3.8 3.8 0 0 1 0 7.6H5z" />
      <path d="M5 11.6h8.4a4.2 4.2 0 0 1 0 8.4H5z" />
    </Svg>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  )
}

export function MenuIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 9h16M4 15h16" />
    </Svg>
  )
}

export function SlidersIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="15.5" cy="7" r="2.2" />
      <circle cx="9.5" cy="17" r="2.2" />
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

export function FeatureIcon({ name, ...props }: IconProps & { name: FeatureIconName }) {
  switch (name) {
    case 'hackNight':
      return (
        <Svg {...props}>
          <rect x="4" y="5" width="16" height="14" rx="3" />
          <path d="M8 11h8M8 15h5" />
        </Svg>
      )
    case 'trips':
      return (
        <Svg {...props}>
          <path d="M13 3 5 14h6l-1 7 8-11h-6z" />
        </Svg>
      )
    case 'grants':
      return (
        <Svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v8M9 10.5h4.5a1.5 1.5 0 0 1 0 3H10.5a1.5 1.5 0 0 0 0 3H15" />
        </Svg>
      )
    case 'demo':
      return (
        <Svg {...props}>
          <path d="M4 18h16M6 18V9l6-4 6 4v9" />
          <path d="M10 18v-5h4v5" />
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
