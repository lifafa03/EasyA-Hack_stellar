"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GradientBackground } from "@/components/gradient-background"
import {
  StellarLogo,
  StellarBadge,
  StellarLoading,
  StellarTransactionLoading,
  BlockchainTooltip,
  StellarFAQ,
  OnboardingFlow,
  TransactionHash,
  AccountLink,
  ContractLink,
  ExplorerLinks,
  QuickExplorerButton,
  NetworkStatus,
  NetworkIndicator,
} from "@/components/stellar"

export default function StellarDemoPage() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  return (
    <main className="min-h-screen">
      <GradientBackground variant="default">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto mb-12"
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Stellar Components Demo
              </h1>
              <p className="text-xl text-muted-foreground">
                Showcase of all Stellar branding and educational components
              </p>
            </motion.div>

            <div className="grid gap-8 max-w-6xl mx-auto">
              {/* Branding Components */}
              <Card>
                <CardHeader>
                  <CardTitle>Branding Components</CardTitle>
                  <CardDescription>Stellar logo and badges</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-medium mb-3">Logo Sizes</p>
                    <div className="flex items-center gap-6">
                      <StellarLogo size="sm" />
                      <StellarLogo size="md" />
                      <StellarLogo size="lg" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">Badge</p>
                    <StellarBadge />
                  </div>
                </CardContent>
              </Card>

              {/* Loading States */}
              <Card>
                <CardHeader>
                  <CardTitle>Loading States</CardTitle>
                  <CardDescription>Branded loading indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-medium mb-3">Loading Sizes</p>
                    <div className="flex items-center gap-8">
                      <StellarLoading size="sm" />
                      <StellarLoading size="md" message="Processing..." />
                      <StellarLoading size="lg" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">Transaction Loading</p>
                    <StellarTransactionLoading />
                  </div>
                </CardContent>
              </Card>

              {/* Educational Components */}
              <Card>
                <CardHeader>
                  <CardTitle>Educational Components</CardTitle>
                  <CardDescription>Tooltips and onboarding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-medium mb-3">Blockchain Tooltips</p>
                    <div className="space-y-2 text-sm">
                      <p>
                        This project uses <BlockchainTooltip term="escrow" /> to protect payments.
                      </p>
                      <p>
                        Funds are held in a <BlockchainTooltip term="smart contract" /> on the{" "}
                        <BlockchainTooltip term="stellar" /> network.
                      </p>
                      <p>
                        Connect your <BlockchainTooltip term="wallet" /> to get started.
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">Onboarding Flow</p>
                    <Button onClick={() => setShowOnboarding(true)}>
                      Launch Onboarding
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Explorer Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Blockchain Explorer Links</CardTitle>
                  <CardDescription>Transaction and account links</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-medium mb-3">Transaction Hash</p>
                    <TransactionHash
                      hash="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
                      network="testnet"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">Account Link</p>
                    <AccountLink
                      address="GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"
                      network="testnet"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">Contract Link</p>
                    <ContractLink
                      contractId="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM"
                      network="testnet"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">Quick Explorer Button</p>
                    <QuickExplorerButton
                      type="transaction"
                      id="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
                      network="testnet"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">Explorer Links Card</p>
                    <ExplorerLinks
                      transactionHash="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
                      accountAddress="GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"
                      contractId="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM"
                      network="testnet"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Network Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Network Status Components</CardTitle>
                  <CardDescription>Network health and indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-medium mb-3">Network Indicator</p>
                    <NetworkIndicator />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">Full Network Status</p>
                    <NetworkStatus />
                  </div>
                </CardContent>
              </Card>

              {/* FAQ */}
              <StellarFAQ />
            </div>
          </div>
        </section>
      </GradientBackground>

      <OnboardingFlow
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={() => console.log("Onboarding completed")}
      />
    </main>
  )
}
