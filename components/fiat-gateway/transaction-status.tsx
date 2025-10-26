"use client"

import React, { useState, useEffect } from "react"
import { RefreshCw, CheckCircle, Clock, AlertCircle, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { TransactionHash } from "@/components/stellar/transaction-hash"
import { TransactionStatus as TxStatus } from "@/lib/stellar/services/anchor"
import { toast } from "sonner"

interface TransactionStatusProps {
  transactionId: string
  type: "onramp" | "offramp"
  status: TxStatus
  amount?: string
  currency?: string
  stellarTxHash?: string
  estimatedCompletion?: number
  network?: "testnet" | "mainnet"
  onRefresh?: () => Promise<void>
  className?: string
}

const STATUS_CONFIG = {
  pending_user_transfer_start: {
    label: "Awaiting Payment",
    description: "Please complete your payment to continue",
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    progress: 10,
  },
  pending_user_transfer_complete: {
    label: "Payment Received",
    description: "Your payment has been received and is being processed",
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    progress: 30,
  },
  pending_external: {
    label: "Processing Payment",
    description: "Payment is being processed by external provider",
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    progress: 40,
  },
  pending_anchor: {
    label: "Anchor Processing",
    description: "Transaction is being processed by the anchor service",
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    progress: 60,
  },
  pending_stellar: {
    label: "Stellar Transaction",
    description: "Transaction is being submitted to Stellar network",
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    progress: 80,
  },
  pending_trust: {
    label: "Awaiting Trustline",
    description: "Waiting for trustline to be established",
    icon: Clock,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    progress: 50,
  },
  pending_user: {
    label: "Action Required",
    description: "Additional action required from you",
    icon: AlertCircle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    progress: 50,
  },
  completed: {
    label: "Completed",
    description: "Transaction completed successfully",
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    progress: 100,
  },
  error: {
    label: "Failed",
    description: "Transaction failed. Please contact support",
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    progress: 0,
  },
  refunded: {
    label: "Refunded",
    description: "Transaction was refunded",
    icon: AlertCircle,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    progress: 100,
  },
}

const PROGRESS_STEPS = [
  { key: "pending_user_transfer_start", label: "Payment Initiated" },
  { key: "pending_user_transfer_complete", label: "Payment Received" },
  { key: "pending_anchor", label: "Anchor Processing" },
  { key: "pending_stellar", label: "Stellar Transaction" },
  { key: "completed", label: "Completed" },
]

export function TransactionStatus({
  transactionId,
  type,
  status,
  amount,
  currency,
  stellarTxHash,
  estimatedCompletion,
  network = "testnet",
  onRefresh,
  className,
}: TransactionStatusProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>("")

  const config = STATUS_CONFIG[status]
  const StatusIcon = config.icon

  useEffect(() => {
    if (!estimatedCompletion || status === "completed" || status === "error" || status === "refunded") {
      setTimeRemaining("")
      return
    }

    const updateTimeRemaining = () => {
      const now = Date.now() / 1000
      const remaining = estimatedCompletion - now

      if (remaining <= 0) {
        setTimeRemaining("Completing soon...")
        return
      }

      const hours = Math.floor(remaining / 3600)
      const minutes = Math.floor((remaining % 3600) / 60)

      if (hours > 0) {
        setTimeRemaining(`~${hours}h ${minutes}m remaining`)
      } else if (minutes > 0) {
        setTimeRemaining(`~${minutes}m remaining`)
      } else {
        setTimeRemaining("Less than 1 minute")
      }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [estimatedCompletion, status])

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return

    setRefreshing(true)
    try {
      await onRefresh()
      toast.success("Status updated")
    } catch (error) {
      toast.error("Failed to refresh status")
    } finally {
      setRefreshing(false)
    }
  }

  const getCurrentStepIndex = () => {
    const stepKeys = PROGRESS_STEPS.map(s => s.key)
    const currentIndex = stepKeys.indexOf(status)
    return currentIndex >= 0 ? currentIndex : 0
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {type === "onramp" ? "On-Ramp" : "Off-Ramp"} Transaction
            </CardTitle>
            <CardDescription>Transaction ID: {transactionId}</CardDescription>
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh status"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn("gap-2 px-3 py-1", config.bgColor)}>
            <StatusIcon className={cn("h-4 w-4", config.color)} />
            <span className="font-medium">{config.label}</span>
          </Badge>
          {amount && currency && (
            <div className="text-right">
              <p className="text-sm font-medium">{amount} {currency}</p>
            </div>
          )}
        </div>

        {/* Status Description */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{config.description}</p>
          {timeRemaining && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeRemaining}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={config.progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {config.progress}% complete
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Transaction Progress</p>
          <div className="space-y-2">
            {PROGRESS_STEPS.map((step, index) => {
              const currentIndex = getCurrentStepIndex()
              const isCompleted = index < currentIndex || status === "completed"
              const isCurrent = index === currentIndex && status !== "completed"
              const isError = status === "error" && isCurrent

              return (
                <div
                  key={step.key}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors",
                    isCurrent && "bg-muted",
                    isCompleted && "opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium",
                      isCompleted && "bg-green-500 text-white",
                      isCurrent && !isError && "bg-blue-500 text-white animate-pulse",
                      isError && "bg-red-500 text-white",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      isCurrent && "font-medium",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stellar Transaction Hash */}
        {stellarTxHash && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium">Stellar Transaction</p>
            <TransactionHash
              hash={stellarTxHash}
              network={network}
              showCopy={true}
              showExplorer={true}
            />
          </div>
        )}

        {/* Additional Actions */}
        {status === "pending_user" && (
          <div className="pt-4 border-t">
            <Button variant="default" className="w-full">
              Complete Required Action
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full">
              Contact Support
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface TransactionStatusListProps {
  transactions: Array<{
    id: string
    type: "onramp" | "offramp"
    status: TxStatus
    amount?: string
    currency?: string
    stellarTxHash?: string
    estimatedCompletion?: number
  }>
  network?: "testnet" | "mainnet"
  onRefresh?: (id: string) => Promise<void>
  className?: string
}

export function TransactionStatusList({
  transactions,
  network = "testnet",
  onRefresh,
  className,
}: TransactionStatusListProps) {
  if (transactions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No transactions found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {transactions.map((tx) => (
        <TransactionStatus
          key={tx.id}
          transactionId={tx.id}
          type={tx.type}
          status={tx.status}
          amount={tx.amount}
          currency={tx.currency}
          stellarTxHash={tx.stellarTxHash}
          estimatedCompletion={tx.estimatedCompletion}
          network={network}
          onRefresh={onRefresh ? () => onRefresh(tx.id) : undefined}
        />
      ))}
    </div>
  )
}
