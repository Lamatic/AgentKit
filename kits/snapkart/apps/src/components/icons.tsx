interface IconProps {
  size?: number
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
}

function base(size: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }
}

export function IconShoppingBag({ size = 20, strokeWidth = 1.8, className, style }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true">
      <path d="M6 8h12l-1 12.5a1.5 1.5 0 0 1-1.5 1.5H8.5A1.5 1.5 0 0 1 7 20.5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

export function IconMessageCircle({ size = 20, strokeWidth = 1.8, className, style }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-4.11 7.19A8.5 8.5 0 0 1 3.5 15.5 8.38 8.38 0 0 1 7.5 4.62 8.5 8.5 0 0 1 21 11.5Z" />
    </svg>
  )
}

export function IconPackage({ size = 20, strokeWidth = 1.8, className, style }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v9l9 5 9-5V8" />
      <path d="M12 13v9" />
    </svg>
  )
}

export function IconMenu({ size = 22, strokeWidth = 1.8, className, style }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

export function IconX({ size = 22, strokeWidth = 1.8, className, style }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

export function IconRefresh({ size = 16, strokeWidth = 2, className, style }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

export function IconCheck({ size = 16, strokeWidth = 2.4, className, style }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function IconClock({ size = 14, strokeWidth = 2, className, style }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  )
}

export function IconTruck({ size = 14, strokeWidth = 2, className, style }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true">
      <path d="M3 7h11v9H3z" />
      <path d="M14 11h4l3 3v2h-7z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  )
}

export function IconAlertTriangle({ size = 18, strokeWidth = 1.8, className, style }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true">
      <path d="M10.6 3.9 1.8 19a1.5 1.5 0 0 0 1.3 2.2h17.8a1.5 1.5 0 0 0 1.3-2.2L13.4 3.9a1.5 1.5 0 0 0-2.8 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

export function IconSend({ size = 17, strokeWidth = 1.8, className, style }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  )
}

export function IconTrash({ size = 15, strokeWidth = 1.8, className, style }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function IconSparkle({ size = 15, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  )
}

export function IconUpload({ size = 15, strokeWidth = 1.8, className, style }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true">
      <path d="M12 16V4" />
      <path d="M6 10l6-6 6 6" />
      <path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
    </svg>
  )
}
