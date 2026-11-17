import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
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
      <path d="M4 8h16M4 16h16" />
    </Svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function ArrowOutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 16L16 8M9 8h7v7" />
    </Svg>
  )
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 15l6-6 6 6" />
    </Svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  )
}

// Sidebar icons: one stroked shape each, drawn on the same 24px grid as the rest.

export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </Svg>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </Svg>
  )
}

export function CodeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 8l-4 4 4 4M15 8l4 4-4 4M13.2 6l-2.4 12" />
    </Svg>
  )
}

export function TrophyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 4.5h8v5a4 4 0 0 1-8 0v-5zM8 6.5H5.5a2.5 2.5 0 0 0 2.6 3.6M16 6.5h2.5a2.5 2.5 0 0 1-2.6 3.6M12 13.5V17M8.5 20h7M9.5 17h5" />
    </Svg>
  )
}

export function SeatIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </Svg>
  )
}

/** A sign-up sheet on a clipboard: the roles and who's applied for them. */
export function SheetIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 4.5H6.5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-14a1 1 0 0 0-1-1H15" />
      <path d="M9.5 3h5v3h-5zM9 11.5h6M9 15.5h4" />
    </Svg>
  )
}

export function PeopleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.4a5.5 5.5 0 0 1 3 5.1" />
    </Svg>
  )
}

export function CoinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M14.6 9.4c-.4-.9-1.4-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1.1 1.6 2.6 2 2.6.8 2.6 2-1.1 2-2.6 2c-1.2 0-2.2-.5-2.6-1.4M12 6.5V8M12 16v1.5" />
    </Svg>
  )
}

export function MailIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="M4.5 7.5l7.5 5.5 7.5-5.5" />
    </Svg>
  )
}

export function KeyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8.5" cy="15.5" r="4" />
      <path d="M11.4 12.6L19 5M16 8l2.5 2.5M14 10l1.8 1.8" />
    </Svg>
  )
}

// Controls: search, ways in and out, and the small marks toasts and menus carry.

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </Svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 6l6 6-6 6" />
    </Svg>
  )
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Svg>
  )
}

/** Two chevrons, up and down: this row opens a menu. */
export function SelectorIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4" />
    </Svg>
  )
}

export function SignOutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14M10 8l-4 4 4 4M6 12h9" />
    </Svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5M12 16v.2" />
    </Svg>
  )
}

/** An arrow into a tray: bring something in from another site. */
export function ImportIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4v10M8 10.5l4 4 4-4M5 16.5v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" />
    </Svg>
  )
}

export function SendIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 4L10.5 13.5M20 4l-6 16-3.5-6.5L4 10l16-6z" />
    </Svg>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 7h14M10 7V5h4v2M7 7l.8 11a2 2 0 0 0 2 1.8h4.4a2 2 0 0 0 2-1.8L17 7M10.5 11v5M13.5 11v5" />
    </Svg>
  )
}

export function DownloadIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4.5v11M7.5 11l4.5 4.5 4.5-4.5M5 19.5h14" />
    </Svg>
  )
}

export function ReturnIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 6v5a3 3 0 0 1-3 3H6M10 10l-4 4 4 4" />
    </Svg>
  )
}
