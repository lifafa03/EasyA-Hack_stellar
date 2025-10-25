"use client"

import type React from "react"

interface GradientBackgroundProps {
  children: React.ReactNode
  variant?: "default" | "surface" | "minimal"
  className?: string
}

export function GradientBackground({ children, variant = "default", className = "" }: GradientBackgroundProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Gradient backdrop */}
      {variant === "default" && <div className="absolute inset-0 bg-gradient-to-b from-surface to-background -z-10" />}
      {variant === "surface" && <div className="absolute inset-0 bg-gradient-to-br from-surface to-background -z-10" />}

      {/* Decorative gradient blobs */}
      {variant !== "minimal" && (
        <>
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#4ade80]/5 dark:bg-[#4ade80]/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#3d4a2c]/5 dark:bg-[#3d4a2c]/10 rounded-full blur-3xl -z-10" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-[#4ade80]/3 dark:bg-[#4ade80]/5 rounded-full blur-3xl -z-10" />
        </>
      )}

      {/* Content */}
      {children}
    </div>
  )
}
