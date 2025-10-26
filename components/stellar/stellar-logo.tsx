import React from "react"
import { cn } from "@/lib/utils"

interface StellarLogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showText?: boolean
}

export function StellarLogo({ size = "md", className, showText = true }: StellarLogoProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        className={cn(sizeClasses[size])}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="11" fill="black" />
        <path
          d="M12 3L14.5 8.5L20 9.5L16 13.5L17 19L12 16L7 19L8 13.5L4 9.5L9.5 8.5L12 3Z"
          fill="white"
        />
      </svg>
      {showText && (
        <span className={cn("font-medium text-muted-foreground", textSizeClasses[size])}>
          Powered by Stellar
        </span>
      )}
    </div>
  )
}

export function StellarBadge({ className }: { className?: string }) {
  return (
    <a
      href="https://stellar.org"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10",
        "transition-colors duration-200",
        className
      )}
    >
      <StellarLogo size="sm" showText={true} />
    </a>
  )
}
