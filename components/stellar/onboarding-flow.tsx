"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Wallet, Shield, Zap, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react"
import { StellarLogo } from "./stellar-logo"

interface OnboardingFlowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

const steps = [
  {
    title: "Welcome to StellarWork+",
    description: "Let's get you started with blockchain-powered work",
    icon: StellarLogo,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          StellarWork+ uses blockchain technology to provide secure, transparent, and instant payments
          for freelance work and project funding.
        </p>
        <div className="grid gap-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Zap className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Fast Transactions</p>
              <p className="text-xs text-muted-foreground">Payments confirm in 5-7 seconds</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Secure Escrow</p>
              <p className="text-xs text-muted-foreground">Smart contracts protect your funds</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Transparent</p>
              <p className="text-xs text-muted-foreground">Track all transactions on the blockchain</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Connect Your Wallet",
    description: "Your wallet is your digital identity on the blockchain",
    icon: Wallet,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          A wallet stores your cryptographic keys and allows you to send, receive, and manage your Stellar assets.
          We support multiple wallet providers for your convenience.
        </p>
        <div className="space-y-3">
          <div className="p-4 rounded-lg border">
            <h4 className="font-medium mb-2">Supported Wallets</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Freighter</strong> - Browser extension wallet</li>
              <li>• <strong>Lobstr</strong> - Mobile and web wallet</li>
              <li>• <strong>Albedo</strong> - Web-based wallet</li>
              <li>• <strong>xBull</strong> - Multi-platform wallet</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <strong>Security Note:</strong> We never store your private keys. Your wallet provider
              manages your keys securely, and you maintain full control of your funds.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Understanding Escrow",
    description: "How smart contracts protect your payments",
    icon: Shield,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Escrow smart contracts hold funds securely until agreed-upon conditions are met, protecting
          both clients and service providers.
        </p>
        <div className="space-y-3">
          <div className="p-4 rounded-lg border">
            <h4 className="font-medium mb-2">How It Works</h4>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Client creates an escrow contract with project details</li>
              <li>Funds are locked in the smart contract</li>
              <li>Service provider completes milestones</li>
              <li>Client approves completed work</li>
              <li>Funds are automatically released to provider</li>
            </ol>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium text-sm mb-1">Milestone-Based</p>
              <p className="text-xs text-muted-foreground">Release funds as work is completed</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium text-sm mb-1">Time-Based</p>
              <p className="text-xs text-muted-foreground">Release funds on a schedule</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "You're All Set!",
    description: "Start exploring the platform",
    icon: CheckCircle,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          You now understand the basics of how StellarWork+ uses blockchain technology to create
          a secure, transparent marketplace.
        </p>
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-xs font-bold">1</span>
                </div>
                <p>Connect your wallet using the button in the top right</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-xs font-bold">2</span>
                </div>
                <p>Browse projects or post your own</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-xs font-bold">3</span>
                </div>
                <p>Start working or investing with confidence</p>
              </div>
            </CardContent>
          </Card>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm">
              <strong>Need help?</strong> Check out our{" "}
              <a href="/how-it-works" className="text-primary hover:underline">
                How It Works
              </a>{" "}
              page for detailed guides and FAQs.
            </p>
          </div>
        </div>
      </div>
    ),
  },
]

export function OnboardingFlow({ open, onOpenChange, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete?.()
      onOpenChange(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onComplete?.()
    onOpenChange(false)
  }

  const step = steps[currentStep]
  const Icon = step.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {Icon === StellarLogo ? (
                <StellarLogo size="sm" showText={false} />
              ) : (
                <Icon className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle>{step.title}</DialogTitle>
              <DialogDescription>{step.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step.content}
          </motion.div>
        </AnimatePresence>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mt-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                index <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <div>
            {currentStep > 0 && (
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentStep < steps.length - 1 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                "Get Started"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
