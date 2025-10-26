"use client"

import React, { useEffect, useState } from "react"
import { Activity, AlertCircle, CheckCircle, Clock, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { STELLAR_CONFIG } from "@/lib/stellar/config"

interface NetworkStatusProps {
  className?: string
  compact?: boolean
}

interface NetworkHealth {
  status: "healthy" | "degraded" | "down"
  latency: number
  lastChecked: Date
}

export function NetworkStatus({ className, compact = false }: NetworkStatusProps) {
  const [health, setHealth] = useState<NetworkHealth>({
    status: "healthy",
    latency: 0,
    lastChecked: new Date(),
  })
  const [baseFee, setBaseFee] = useState<number>(100)
  const [loading, setLoading] = useState(true)

  const network = STELLAR_CONFIG.network as "testnet" | "mainnet"
  const avgConfirmTime = 5 // Stellar average confirmation time in seconds

  useEffect(() => {
    const checkNetworkHealth = async () => {
      try {
        const startTime = Date.now()
        const response = await fetch(STELLAR_CONFIG.horizonUrl)
        const latency = Date.now() - startTime

        if (response.ok) {
          setHealth({
            status: latency < 1000 ? "healthy" : "degraded",
            latency,
            lastChecked: new Date(),
          })
        } else {
          setHealth({
            status: "degraded",
            latency,
            lastChecked: new Date(),
          })
        }

        // Fetch base fee from Horizon
        try {
          const feeStatsResponse = await fetch(`${STELLAR_CONFIG.horizonUrl}/fee_stats`)
          if (feeStatsResponse.ok) {
            const feeStats = await feeStatsResponse.json()
            setBaseFee(parseInt(feeStats.last_ledger_base_fee) || 100)
          }
        } catch (error) {
          console.error("Failed to fetch fee stats:", error)
        }
      } catch (error) {
        setHealth({
          status: "down",
          latency: 0,
          lastChecked: new Date(),
        })
      } finally {
        setLoading(false)
      }
    }

    checkNetworkHealth()
    const interval = setInterval(checkNetworkHealth, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const statusConfig = {
    healthy: {
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      label: "Operational",
    },
    degraded: {
      icon: AlertCircle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      label: "Degraded",
    },
    down: {
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      label: "Down",
    },
  }

  const config = statusConfig[health.status]
  const StatusIcon = config.icon

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge
          variant="outline"
          className={cn("gap-1.5", config.bgColor)}
        >
          <StatusIcon className={cn("h-3 w-3", config.color)} />
          <span className="text-xs">
            {network === "mainnet" ? "Mainnet" : "Testnet"}
          </span>
        </Badge>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Network Status</CardTitle>
            <CardDescription>Stellar blockchain health</CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn("gap-1.5", config.bgColor)}
          >
            <StatusIcon className={cn("h-3 w-3", config.color)} />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Type */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Network</span>
          </div>
          <Badge variant={network === "mainnet" ? "default" : "secondary"}>
            {network === "mainnet" ? "Mainnet" : "Testnet"}
          </Badge>
        </div>

        {/* Confirmation Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Avg. Confirmation</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {avgConfirmTime}s
          </span>
        </div>

        {/* Base Fee */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Base Fee</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {baseFee} stroops
          </span>
        </div>

        {/* Latency */}
        {!loading && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">API Latency</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {health.latency}ms
            </span>
          </div>
        )}

        {/* Last Checked */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Last checked: {health.lastChecked.toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function NetworkIndicator({ className }: { className?: string }) {
  const network = STELLAR_CONFIG.network as "testnet" | "mainnet"

  return (
    <Badge
      variant={network === "mainnet" ? "default" : "secondary"}
      className={cn("gap-1.5", className)}
    >
      <div className={cn(
        "h-2 w-2 rounded-full",
        network === "mainnet" ? "bg-green-500 animate-pulse" : "bg-blue-500"
      )} />
      {network === "mainnet" ? "Mainnet" : "Testnet"}
    </Badge>
  )
}
