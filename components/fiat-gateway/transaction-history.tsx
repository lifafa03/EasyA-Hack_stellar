"use client"

import React, { useState, useMemo } from "react"
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  ExternalLink,
  Filter,
  Search
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { FiatTransaction, TransactionStatus, TransactionType } from "@/lib/stellar/types/fiat-gateway"
import { TransactionHash } from "@/components/stellar/transaction-hash"

interface TransactionHistoryProps {
  transactions: FiatTransaction[]
  network?: "testnet" | "mainnet"
  className?: string
}

const STATUS_CONFIG: Record<TransactionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  pending_user_transfer_start: { label: "Awaiting Payment", variant: "outline", color: "text-blue-500" },
  pending_user_transfer_complete: { label: "Payment Received", variant: "outline", color: "text-blue-500" },
  pending_external: { label: "Processing", variant: "outline", color: "text-blue-500" },
  pending_anchor: { label: "Anchor Processing", variant: "outline", color: "text-blue-500" },
  pending_stellar: { label: "Stellar Transaction", variant: "outline", color: "text-blue-500" },
  pending_trust: { label: "Awaiting Trustline", variant: "outline", color: "text-yellow-600" },
  pending_user: { label: "Action Required", variant: "outline", color: "text-yellow-600" },
  completed: { label: "Completed", variant: "secondary", color: "text-green-600" },
  error: { label: "Failed", variant: "destructive", color: "text-red-600" },
  expired: { label: "Expired", variant: "outline", color: "text-gray-500" },
  refunded: { label: "Refunded", variant: "outline", color: "text-orange-600" },
}

function TransactionCard({ 
  transaction, 
  network = "testnet",
  isExpanded,
  onToggle
}: { 
  transaction: FiatTransaction
  network?: "testnet" | "mainnet"
  isExpanded: boolean
  onToggle: () => void
}) {
  const statusConfig = STATUS_CONFIG[transaction.status]
  const isOnRamp = transaction.type === "on-ramp"
  const Icon = isOnRamp ? ArrowDownToLine : ArrowUpFromLine

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatAmount = (amount: string, currency: string) => {
    const num = parseFloat(amount)
    return `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
  }

  return (
    <Card className="hover:shadow-md transition-shadow" role="article" aria-label={`${isOnRamp ? 'Deposit' : 'Withdrawal'} transaction - ${statusConfig.label}`}>
      <CardContent className="p-4">
        {/* Main Transaction Info */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div 
              className={cn(
                "p-2 rounded-lg",
                isOnRamp ? "bg-green-500/10" : "bg-blue-500/10"
              )}
              role="img"
              aria-label={isOnRamp ? "Deposit transaction" : "Withdrawal transaction"}
            >
              <Icon className={cn(
                "h-5 w-5",
                isOnRamp ? "text-green-600" : "text-blue-600"
              )} aria-hidden="true" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">
                  {isOnRamp ? "Deposit" : "Withdrawal"}
                </h3>
                <Badge variant={statusConfig.variant} className="text-xs" aria-label={`Status: ${statusConfig.label}`}>
                  {statusConfig.label}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground" aria-label={`Amount: ${formatAmount(transaction.amount, transaction.currency)} converted to ${formatAmount(transaction.cryptoAmount, transaction.cryptoCurrency)}`}>
                  {formatAmount(transaction.amount, transaction.currency)}
                  {" → "}
                  {formatAmount(transaction.cryptoAmount, transaction.cryptoCurrency)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  <time dateTime={new Date(transaction.createdAt).toISOString()}>
                    {formatDate(transaction.createdAt)}
                  </time>
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            className="shrink-0"
            aria-label={isExpanded ? "Collapse transaction details" : "Expand transaction details"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-3" role="region" aria-label="Transaction details">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Exchange Rate</p>
                <p className="font-medium" aria-label={`Exchange rate: ${transaction.exchangeRate}`}>{transaction.exchangeRate}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Fees</p>
                <p className="font-medium" aria-label={`Fees: ${transaction.fees} ${transaction.currency}`}>{transaction.fees} {transaction.currency}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Anchor</p>
                <p className="font-medium">{transaction.anchorName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Transaction ID</p>
                <p className="font-mono text-xs truncate" title={transaction.id} aria-label={`Transaction ID: ${transaction.id}`}>
                  {transaction.id}
                </p>
              </div>
            </div>

            {transaction.completedAt && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Completed At</p>
                <p className="text-sm">
                  <time dateTime={new Date(transaction.completedAt).toISOString()}>
                    {formatDate(transaction.completedAt)}
                  </time>
                </p>
              </div>
            )}

            {transaction.errorMessage && (
              <div className="p-3 bg-destructive/10 rounded-lg" role="alert" aria-live="polite">
                <p className="text-xs font-medium text-destructive mb-1">Error</p>
                <p className="text-xs text-destructive/80">{transaction.errorMessage}</p>
              </div>
            )}

            {transaction.stellarTxHash && (
              <div>
                <p className="text-muted-foreground text-xs mb-2">Stellar Transaction</p>
                <TransactionHash
                  hash={transaction.stellarTxHash}
                  network={network}
                  showCopy={true}
                  showExplorer={true}
                />
              </div>
            )}

            {transaction.externalTxId && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">External Transaction ID</p>
                <p className="font-mono text-xs" aria-label={`External transaction ID: ${transaction.externalTxId}`}>{transaction.externalTxId}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function TransactionHistory({ 
  transactions, 
  network = "testnet",
  className 
}: TransactionHistoryProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<"all" | "7d" | "30d" | "90d">("all")

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(tx => tx.type === typeFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(tx => tx.status === statusFilter)
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = Date.now()
      const ranges = {
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        "90d": 90 * 24 * 60 * 60 * 1000,
      }
      const cutoff = now - ranges[dateRange]
      filtered = filtered.filter(tx => tx.createdAt >= cutoff)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tx => 
        tx.id.toLowerCase().includes(query) ||
        tx.anchorName.toLowerCase().includes(query) ||
        tx.stellarTxHash?.toLowerCase().includes(query) ||
        tx.externalTxId?.toLowerCase().includes(query)
      )
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => b.createdAt - a.createdAt)

    return filtered
  }, [transactions, typeFilter, statusFilter, dateRange, searchQuery])

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Type",
      "Status",
      "Amount",
      "Currency",
      "Crypto Amount",
      "Crypto Currency",
      "Exchange Rate",
      "Fees",
      "Anchor",
      "Stellar TX Hash",
      "External TX ID"
    ]

    const rows = filteredTransactions.map(tx => [
      new Date(tx.createdAt).toISOString(),
      tx.type,
      tx.status,
      tx.amount,
      tx.currency,
      tx.cryptoAmount,
      tx.cryptoCurrency,
      tx.exchangeRate,
      tx.fees,
      tx.anchorName,
      tx.stellarTxHash || "",
      tx.externalTxId || ""
    ])

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fiat-transactions-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToJSON = () => {
    const json = JSON.stringify(filteredTransactions, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fiat-transactions-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn("space-y-4", className)} role="region" aria-label="Transaction history">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle id="transaction-history-title">Transaction History</CardTitle>
              <CardDescription>
                View and manage your fiat gateway transactions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={filteredTransactions.length === 0}
                aria-label="Export transactions to CSV"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToJSON}
                disabled={filteredTransactions.length === 0}
                aria-label="Export transactions to JSON"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3" role="search" aria-label="Filter transactions">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Search transactions by ID, anchor name, or transaction hash"
              />
            </div>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger aria-label="Filter by transaction type">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="on-ramp">Deposits</SelectItem>
                <SelectItem value="off-ramp">Withdrawals</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger aria-label="Filter by transaction status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending_user_transfer_start">Awaiting Payment</SelectItem>
                <SelectItem value="pending_anchor">Processing</SelectItem>
                <SelectItem value="error">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
              <SelectTrigger aria-label="Filter by date range">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground" role="status" aria-live="polite">
            <p aria-label={`Showing ${filteredTransactions.length} of ${transactions.length} transactions`}>
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
            {(typeFilter !== "all" || statusFilter !== "all" || dateRange !== "all" || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter("all")
                  setStatusFilter("all")
                  setDateRange("all")
                  setSearchQuery("")
                }}
                aria-label="Clear all filters"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <Card role="status" aria-live="polite">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {transactions.length === 0 
                ? "No transactions yet" 
                : "No transactions match your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3" role="list" aria-label="Transaction list" aria-labelledby="transaction-history-title">
          {filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              network={network}
              isExpanded={expandedIds.has(transaction.id)}
              onToggle={() => toggleExpanded(transaction.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
