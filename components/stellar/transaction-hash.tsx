"use client"

import React, { useState } from "react"
import { Copy, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface TransactionHashProps {
  hash: string
  network?: "testnet" | "mainnet"
  className?: string
  showCopy?: boolean
  showExplorer?: boolean
  truncate?: boolean
}

export function TransactionHash({
  hash,
  network = "testnet",
  className,
  showCopy = true,
  showExplorer = true,
  truncate = true,
}: TransactionHashProps) {
  const [copied, setCopied] = useState(false)

  const explorerUrl = network === "mainnet"
    ? `https://stellar.expert/explorer/public/tx/${hash}`
    : `https://stellar.expert/explorer/testnet/tx/${hash}`

  const displayHash = truncate
    ? `${hash.slice(0, 8)}...${hash.slice(-8)}`
    : hash

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(true)
      toast.success("Transaction hash copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy transaction hash")
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <code className="px-2 py-1 rounded bg-muted text-sm font-mono">
        {displayHash}
      </code>
      {showCopy && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleCopy}
          title="Copy transaction hash"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      )}
      {showExplorer && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          asChild
          title="View on Stellar Expert"
        >
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      )}
    </div>
  )
}

interface AccountLinkProps {
  address: string
  network?: "testnet" | "mainnet"
  className?: string
  truncate?: boolean
}

export function AccountLink({
  address,
  network = "testnet",
  className,
  truncate = true,
}: AccountLinkProps) {
  const explorerUrl = network === "mainnet"
    ? `https://stellar.expert/explorer/public/account/${address}`
    : `https://stellar.expert/explorer/testnet/account/${address}`

  const displayAddress = truncate
    ? `${address.slice(0, 8)}...${address.slice(-8)}`
    : address

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-primary hover:underline font-mono text-sm",
        className
      )}
    >
      {displayAddress}
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}

interface ContractLinkProps {
  contractId: string
  network?: "testnet" | "mainnet"
  className?: string
  truncate?: boolean
}

export function ContractLink({
  contractId,
  network = "testnet",
  className,
  truncate = true,
}: ContractLinkProps) {
  const explorerUrl = network === "mainnet"
    ? `https://stellar.expert/explorer/public/contract/${contractId}`
    : `https://stellar.expert/explorer/testnet/contract/${contractId}`

  const displayId = truncate
    ? `${contractId.slice(0, 8)}...${contractId.slice(-8)}`
    : contractId

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-primary hover:underline font-mono text-sm",
        className
      )}
    >
      {displayId}
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}
