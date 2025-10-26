"use client"

import React from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function StellarFAQ() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequently Asked Questions</CardTitle>
        <CardDescription>Learn about Stellar blockchain transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>What is Stellar and why do you use it?</AccordionTrigger>
            <AccordionContent>
              Stellar is a fast, low-cost blockchain network designed for payments and asset transfers.
              We use it because transactions confirm in just 5-7 seconds, fees are minimal (fractions of a cent),
              and it provides the security and transparency of blockchain technology. This means your payments
              are processed quickly, cheaply, and securely.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>How long do transactions take?</AccordionTrigger>
            <AccordionContent>
              Stellar transactions typically confirm in 5-7 seconds. This is much faster than traditional
              payment processors and other blockchain networks. You'll see real-time updates as your
              transaction is processed and confirmed on the network.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>What are the transaction fees?</AccordionTrigger>
            <AccordionContent>
              Stellar transaction fees are extremely low - typically just 0.00001 XLM (fractions of a cent).
              This base fee helps prevent spam on the network while keeping costs minimal for users.
              You'll see the exact fee before confirming any transaction.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>Do I need cryptocurrency to use the platform?</AccordionTrigger>
            <AccordionContent>
              No! We support fiat on-ramping, which means you can convert your regular currency (USD, EUR, etc.)
              directly into Stellar assets through our integrated anchor services. Similarly, you can convert
              your Stellar assets back to fiat currency and withdraw to your bank account.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>How does escrow protect my payment?</AccordionTrigger>
            <AccordionContent>
              Our smart contract escrow system holds your funds securely on the blockchain until agreed-upon
              conditions are met. For milestone-based projects, funds are released as each milestone is completed.
              For time-based projects, funds are released according to a schedule. Neither party can access the
              funds until the conditions are satisfied, providing protection for both clients and service providers.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger>What happens if there's a dispute?</AccordionTrigger>
            <AccordionContent>
              If a dispute arises, the escrow contract can be flagged for dispute resolution. The funds remain
              locked until the dispute is resolved. Our platform provides tools for both parties to present their
              case, and resolution mechanisms ensure fair outcomes based on the evidence provided.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger>Is my wallet secure?</AccordionTrigger>
            <AccordionContent>
              Yes! We never store your private keys. Your wallet is managed by trusted wallet providers
              (Freighter, Lobstr, Albedo, or xBull) that you control. We only request permission to read
              your public address and sign transactions when you explicitly approve them. Your funds remain
              under your complete control at all times.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger>Can I track my transactions?</AccordionTrigger>
            <AccordionContent>
              Absolutely! Every transaction on Stellar is recorded on the public blockchain. We provide
              direct links to blockchain explorers where you can view your transaction details, including
              confirmation status, timestamp, and all transaction data. This transparency ensures you can
              always verify your payments.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-9">
            <AccordionTrigger>What's the difference between testnet and mainnet?</AccordionTrigger>
            <AccordionContent>
              Testnet is a separate blockchain network used for testing without real money. It's perfect for
              trying out features and learning how the platform works. Mainnet is the live Stellar blockchain
              where real transactions occur with actual value. You can switch between them in your settings,
              and we clearly indicate which network you're using.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-10">
            <AccordionTrigger>How does crowdfunding work?</AccordionTrigger>
            <AccordionContent>
              Project owners can create crowdfunding pools with a funding goal and deadline. Multiple investors
              can contribute to the pool. If the goal is reached before the deadline, the project is funded and
              an escrow contract is automatically created to manage payments. If the goal isn't met, all
              contributors can withdraw their funds. This ensures investors only commit funds to viable projects.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
