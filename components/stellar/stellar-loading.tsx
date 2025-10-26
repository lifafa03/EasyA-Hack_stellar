import React from "react"
import { cn } from "@/lib/utils"

interface StellarLoadingProps {
  size?: "sm" | "md" | "lg"
  className?: string
  message?: string
}

export function StellarLoading({ size = "md", className, message }: StellarLoadingProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        <svg
          className={cn(sizeClasses[size], "animate-spin")}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="60"
            strokeDashoffset="20"
            className="text-muted-foreground/30"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="60"
            strokeDashoffset="20"
            className="text-primary"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className={cn(sizeClasses[size === "sm" ? "sm" : size === "md" ? "sm" : "md"])}
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
        </div>
      </div>
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  )
}

export function StellarTransactionLoading({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <StellarLoading size="lg" message="Processing transaction on Stellar network..." />
      <p className="text-xs text-muted-foreground mt-4">
        This usually takes 5-7 seconds
      </p>
    </div>
  )
}
