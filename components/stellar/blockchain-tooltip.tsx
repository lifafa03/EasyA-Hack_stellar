"use client"

import React from "react"
import { HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface BlockchainTooltipProps {
  term: string
  children?: React.ReactNode
  className?: string
}

const BLOCKCHAIN_TERMS: Record<string, string> = {
  escrow: "A smart contract that holds funds securely until predefined conditions are met, protecting both parties in a transaction.",
  milestone: "A specific deliverable or checkpoint in a project. Funds are released when milestones are completed and approved.",
  "smart contract": "Self-executing code on the blockchain that automatically enforces agreement terms without intermediaries.",
  wallet: "A digital tool that stores your cryptographic keys and allows you to send, receive, and manage your Stellar assets.",
  blockchain: "A distributed ledger technology that records transactions across multiple computers, ensuring transparency and security.",
  stellar: "A fast, low-cost blockchain network designed for payments and asset transfers. Transactions confirm in 5-7 seconds.",
  soroban: "Stellar's smart contract platform that enables complex programmable transactions and decentralized applications.",
  "transaction hash": "A unique identifier for your blockchain transaction. Use it to track and verify your transaction on block explorers.",
  lumens: "The native cryptocurrency of the Stellar network (XLM), used to pay transaction fees and as a bridge currency.",
  testnet: "A separate blockchain network used for testing without real money. Perfect for trying features risk-free.",
  mainnet: "The live Stellar blockchain where real transactions occur with actual value.",
  "public key": "Your blockchain address that others can use to send you funds. Safe to share publicly.",
  "private key": "Secret code that proves ownership of your wallet. Never share this with anyone.",
  crowdfunding: "A method of raising funds from multiple investors who contribute to a shared pool for a project.",
  anchor: "A trusted service that connects traditional banking with blockchain, enabling fiat currency conversions.",
  "on-ramp": "Converting traditional currency (like USD) into cryptocurrency to use on the blockchain.",
  "off-ramp": "Converting cryptocurrency back into traditional currency that can be withdrawn to your bank account.",
}

export function BlockchainTooltip({ term, children, className }: BlockchainTooltipProps) {
  const definition = BLOCKCHAIN_TERMS[term.toLowerCase()]

  if (!definition) {
    return <>{children || term}</>
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1 cursor-help border-b border-dotted border-muted-foreground/50", className)}>
            {children || term}
            <HelpCircle className="h-3 w-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
