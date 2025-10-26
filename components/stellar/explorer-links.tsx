"use client"

import React from "react"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionHash, AccountLink, ContractLink } from "./transaction-hash"

interface ExplorerLinksProps {
  transactionHash?: string
  accountAddress?: string
  contractId?: string
  network?: "testnet" | "mainnet"
}

export function ExplorerLinks({
  transactionHash,
  accountAddress,
  contractId,
  network = "testnet",
}: ExplorerLinksProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Blockchain Explorer</CardTitle>
        <CardDescription>
          View transaction details on Stellar Expert
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactionHash && (
          <div>
            <p className="text-sm font-medium mb-2">Transaction Hash</p>
            <TransactionHash hash={transactionHash} network={network} />
          </div>
        )}
        {accountAddress && (
          <div>
            <p className="text-sm font-medium mb-2">Account Address</p>
            <AccountLink address={accountAddress} network={network} />
          </div>
        )}
        {contractId && (
          <div>
            <p className="text-sm font-medium mb-2">Smart Contract</p>
            <ContractLink contractId={contractId} network={network} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface QuickExplorerButtonProps {
  type: "transaction" | "account" | "contract"
  id: string
  network?: "testnet" | "mainnet"
  label?: string
}

export function QuickExplorerButton({
  type,
  id,
  network = "testnet",
  label = "View on Explorer",
}: QuickExplorerButtonProps) {
  const baseUrl = network === "mainnet"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet"

  const url = `${baseUrl}/${type}/${id}`

  return (
    <Button variant="outline" size="sm" asChild>
      <a href={url} target="_blank" rel="noopener noreferrer">
        {label}
        <ExternalLink className="h-3 w-3 ml-2" />
      </a>
    </Button>
  )
}
