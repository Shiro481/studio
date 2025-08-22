import type { SVGProps } from "react"

export function SwiftAttendLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" fill="currentColor" />
      <path
        d="M9.09 9.09a3 3 0 0 1 4.24-.52l.27.27"
        stroke="hsl(var(--primary-foreground))"
      />
      <path
        d="M14.73 14.73a3 3 0 0 1-4.24.52l-.27-.27"
        stroke="hsl(var(--primary-foreground))"
      />
      <path d="M9 12h1.5" stroke="hsl(var(--primary-foreground))" />
      <path d="M13.5 12H15" stroke="hsl(var(--primary-foreground))" />
    </svg>
  )
}
