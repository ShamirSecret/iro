import React from "react"

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {}

export default function LogoIcon({ className, ...props }: LogoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="24" height="24" rx="4" fill="#FACC15" />
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" fill="#000000" />
    </svg>
  )
} 