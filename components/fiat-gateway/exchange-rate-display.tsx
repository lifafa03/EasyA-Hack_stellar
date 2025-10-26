"use client"

import React, { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, RefreshCw, ArrowRightLeft, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { ExchangeRate } from "@/lib/stellar/services/anchor"
import { toast } from "sonner"

interface ExchangeRateDisplayProps {
  rate: ExchangeRate
  loading?: boolean
  error?: string | null
  onRefresh?: () => Promise<void>
  autoRefresh?: boolean
  refreshInterval?: number
  className?: string
}

export function ExchangeRateDisplay({
  rate,
  loading = false,
  error = null,
  onRefresh,
  autoRefresh = true,
  refreshInterval = 30000,
  className,
}: ExchangeRateDisplayProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [timeAgo, setTimeAgo] = useState<string>("")

  // Update time ago display
  useEffect(() => {
    const updateTimeAgo = () => {
      const now = Date.now() / 1000
      const diff = now - rate.timestamp

      if (diff < 60) {
        setTimeAgo("Just now")
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60)
        setTimeAgo(`${minutes} minute${minutes > 1 ? "s" : ""} ago`)
      } else {
        const hours = Math.floor(diff / 3600)
        setTimeAgo(`${hours} hour${hours > 1 ? "s" : ""} ago`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [rate.timestamp])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return

    const autoRefreshInterval = setInterval(async () => {
      try {
        await onRefresh()
      } catch (error) {
        console.error("Auto-refresh failed:", error)
      }
    }, refreshInterval)

    return () => clearInterval(autoRefreshInterval)
  }, [autoRefresh, onRefresh, refreshInterval])

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return

    setRefreshing(true)
    try {
      await onRefresh()
      toast.success("Exchange rate updated")
    } catch (error) {
      toast.error("Failed to refresh rate")
    } finally {
      setRefreshing(false)
    }
  }

  const rateValue = parseFloat(rate.rate)
  const feeValue = parseFloat(rate.fee)
  const effectiveRate = rateValue - feeValue

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Exchange Rate</CardTitle>
          <CardDescription>Current conversion rate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-destructive mb-4">{error}</p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Exchange Rate</CardTitle>
            <CardDescription>Current conversion rate</CardDescription>
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh rate"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Rate Display */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm font-mono">
              {rate.from}
            </Badge>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="text-sm font-mono">
              {rate.to}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{rateValue.toFixed(4)}</p>
            <p className="text-xs text-muted-foreground">per {rate.from}</p>
          </div>
        </div>

        {/* Fee Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Exchange Fee</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Fee charged by the anchor service</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="font-medium">{feeValue.toFixed(4)} {rate.to}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Effective Rate</span>
            <span className="font-medium">{effectiveRate.toFixed(4)}</span>
          </div>
        </div>

        {/* Rate Update Time */}
        <div className="pt-2 border-t flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Updated {timeAgo}
          </p>
          {autoRefresh && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="text-xs">
                    Auto-refresh
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Rate updates every {refreshInterval / 1000}s</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface CurrencyPair {
  from: string
  to: string
  label: string
}

const COMMON_PAIRS: CurrencyPair[] = [
  { from: "USD", to: "USDC", label: "USD → USDC" },
  { from: "EUR", to: "USDC", label: "EUR → USDC" },
  { from: "GBP", to: "USDC", label: "GBP → USDC" },
  { from: "USDC", to: "USD", label: "USDC → USD" },
  { from: "USDC", to: "EUR", label: "USDC → EUR" },
  { from: "USDC", to: "GBP", label: "USDC → GBP" },
]

interface ExchangeRateSelectorProps {
  rates: ExchangeRate[]
  selectedPair?: CurrencyPair
  onPairChange?: (pair: CurrencyPair) => void
  onRefresh?: (from: string, to: string) => Promise<void>
  loading?: boolean
  error?: string | null
  autoRefresh?: boolean
  className?: string
}

export function ExchangeRateSelector({
  rates,
  selectedPair = COMMON_PAIRS[0],
  onPairChange,
  onRefresh,
  loading = false,
  error = null,
  autoRefresh = true,
  className,
}: ExchangeRateSelectorProps) {
  const [currentPair, setCurrentPair] = useState<CurrencyPair>(selectedPair)

  const currentRate = rates.find(
    (r) => r.from === currentPair.from && r.to === currentPair.to
  )

  const handlePairChange = (value: string) => {
    const pair = COMMON_PAIRS.find((p) => `${p.from}-${p.to}` === value)
    if (pair) {
      setCurrentPair(pair)
      onPairChange?.(pair)
    }
  }

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh(currentPair.from, currentPair.to)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Currency Pair Selector */}
      <div className="flex items-center gap-2">
        <Select
          value={`${currentPair.from}-${currentPair.to}`}
          onValueChange={handlePairChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMON_PAIRS.map((pair) => (
              <SelectItem key={`${pair.from}-${pair.to}`} value={`${pair.from}-${pair.to}`}>
                {pair.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rate Display */}
      {currentRate ? (
        <ExchangeRateDisplay
          rate={currentRate}
          loading={loading}
          error={error}
          onRefresh={handleRefresh}
          autoRefresh={autoRefresh}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading rate..." : "Rate not available for this pair"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface ExchangeRateComparisonProps {
  rates: ExchangeRate[]
  baseCurrency?: string
  className?: string
}

export function ExchangeRateComparison({
  rates,
  baseCurrency = "USD",
  className,
}: ExchangeRateComparisonProps) {
  const relevantRates = rates.filter((r) => r.from === baseCurrency || r.to === baseCurrency)

  if (relevantRates.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No rates available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Exchange Rates</CardTitle>
        <CardDescription>Current rates for {baseCurrency}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {relevantRates.map((rate, index) => {
            const rateValue = parseFloat(rate.rate)
            const isPositive = rateValue >= 1

            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">
                    {rate.from}
                  </Badge>
                  <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="outline" className="font-mono">
                    {rate.to}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{rateValue.toFixed(4)}</span>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

interface ExchangeCalculatorProps {
  rate: ExchangeRate
  amount: string
  onAmountChange?: (amount: string) => void
  loading?: boolean
  error?: string | null
  className?: string
}

export function ExchangeCalculator({
  rate,
  amount,
  onAmountChange,
  loading = false,
  error = null,
  className,
}: ExchangeCalculatorProps) {
  const rateValue = parseFloat(rate.rate)
  const feeValue = parseFloat(rate.fee)
  const amountValue = parseFloat(amount) || 0

  const convertedAmount = amountValue * rateValue
  const totalFee = amountValue * feeValue
  const receiveAmount = convertedAmount - totalFee

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Exchange Calculator</CardTitle>
        <CardDescription>Calculate conversion amounts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">You Send</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => onAmountChange?.(e.target.value)}
              placeholder="0.00"
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
            />
            <Badge variant="outline" className="font-mono">
              {rate.from}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">You Receive</label>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm font-medium">
              {loading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                receiveAmount.toFixed(4)
              )}
            </div>
            <Badge variant="outline" className="font-mono">
              {rate.to}
            </Badge>
          </div>
        </div>

        <div className="pt-2 border-t space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Exchange Rate</span>
            <span className="font-mono">{rateValue.toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Fee</span>
            <span className="font-mono">{totalFee.toFixed(4)} {rate.to}</span>
          </div>
          <div className="flex justify-between pt-2 border-t font-medium">
            <span>Total Amount</span>
            <span className="font-mono text-lg">{receiveAmount.toFixed(4)} {rate.to}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
