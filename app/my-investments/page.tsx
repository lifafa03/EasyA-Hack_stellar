"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Calendar, ArrowRight, Target, Shield, AlertCircle, ExternalLink, RefreshCw } from "lucide-react"
import Link from "next/link"
import { GradientBackground } from "@/components/gradient-background"
import { useState } from "react"
import { useWallet } from "@/hooks/use-wallet"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

const myInvestments = [
  {
    id: 1,
    projectTitle: "Mobile App Development for E-commerce",
    projectId: 1,
    amountInvested: 1000,
    totalBudget: 5000,
    currentFunding: 3200,
    status: "active",
    investedDate: "2025-01-12",
    expectedReturn: "Milestone-based returns",
    progress: 64,
    // Pool data
    poolId: "POOL_ABC123",
    poolGoal: 3000,
    poolRaised: 2100,
    poolStatus: "funding",
    poolDeadline: Math.floor(Date.now() / 1000) + (10 * 24 * 60 * 60),
    // Escrow data
    escrowId: "ESCROW_XYZ789",
    escrowStatus: "active",
    escrowReleased: 1000,
  },
  {
    id: 2,
    projectTitle: "AI-Powered Content Platform",
    projectId: 3,
    amountInvested: 2500,
    totalBudget: 15000,
    currentFunding: 8900,
    status: "active",
    investedDate: "2025-01-08",
    expectedReturn: "Revenue share",
    progress: 59,
    // Pool data
    poolId: "POOL_DEF456",
    poolGoal: 10000,
    poolRaised: 8900,
    poolStatus: "funding",
    poolDeadline: Math.floor(Date.now() / 1000) + (20 * 24 * 60 * 60),
    // Escrow data
    escrowId: null,
    escrowStatus: null,
    escrowReleased: 0,
  },
  {
    id: 3,
    projectTitle: "Brand Identity Design for Tech Startup",
    projectId: 2,
    amountInvested: 500,
    totalBudget: 2500,
    currentFunding: 2500,
    status: "completed",
    investedDate: "2025-01-05",
    expectedReturn: "Fixed return",
    progress: 100,
    // Pool data
    poolId: "POOL_GHI789",
    poolGoal: 2500,
    poolRaised: 2500,
    poolStatus: "funded",
    poolDeadline: Math.floor(Date.now() / 1000) - (5 * 24 * 60 * 60),
    // Escrow data
    escrowId: "ESCROW_JKL012",
    escrowStatus: "completed",
    escrowReleased: 2500,
  },
  {
    id: 4,
    projectTitle: "Failed Blockchain Project",
    projectId: 4,
    amountInvested: 750,
    totalBudget: 8000,
    currentFunding: 1200,
    status: "failed",
    investedDate: "2025-01-01",
    expectedReturn: "N/A",
    progress: 15,
    // Pool data
    poolId: "POOL_MNO345",
    poolGoal: 8000,
    poolRaised: 1200,
    poolStatus: "failed",
    poolDeadline: Math.floor(Date.now() / 1000) - (2 * 24 * 60 * 60),
    // Escrow data
    escrowId: null,
    escrowStatus: null,
    escrowReleased: 0,
  },
]

const statusColors = {
  active: "bg-[#4ade80]/10 text-[#22c55e]",
  completed: "bg-blue-500/10 text-blue-500",
  pending: "bg-[#fbbf24]/10 text-[#fbbf24]",
  failed: "bg-red-500/10 text-red-500",
}

export default function MyInvestmentsPage() {
  const wallet = useWallet()
  const [isRefunding, setIsRefunding] = useState<string | null>(null)
  
  const totalInvested = myInvestments.reduce((sum, inv) => sum + inv.amountInvested, 0)
  const activeInvestments = myInvestments.filter((inv) => inv.status === "active").length
  
  const handleRequestRefund = async (poolId: string, amount: number) => {
    if (!wallet.connected) {
      toast.error('Please connect your wallet first')
      return
    }
    
    setIsRefunding(poolId)
    
    try {
      // In production, this would call the CrowdfundingService
      // await crowdfundingService.requestRefund(poolId, signer)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Refund processed successfully!', {
        description: `${amount} USDC has been returned to your wallet`,
      })
      
      await wallet.refreshBalance()
    } catch (error: any) {
      console.error('Failed to request refund:', error)
      toast.error('Failed to request refund', {
        description: error.message || 'Please try again',
      })
    } finally {
      setIsRefunding(null)
    }
  }

  return (
    <GradientBackground variant="default">
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">My Investments</h1>
            <p className="text-muted text-lg mb-8">Track your portfolio and project funding</p>
          </motion.div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[#4ade80]/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-[#22c55e]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Total Invested</p>
                    <p className="text-2xl font-bold">${totalInvested.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Active Projects</p>
                    <p className="text-2xl font-bold">{activeInvestments}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[#fbbf24]/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-[#fbbf24]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Total Projects</p>
                    <p className="text-2xl font-bold">{myInvestments.length}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Investments List */}
          <div className="space-y-4">
            {myInvestments.map((investment, index) => (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">{investment.projectTitle}</h3>
                        <Badge className={statusColors[investment.status as keyof typeof statusColors]}>
                          {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/project/${investment.projectId}`}>
                          View Project <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>

                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="pool">
                          <Target className="h-4 w-4 mr-2" />
                          Pool
                        </TabsTrigger>
                        <TabsTrigger value="escrow" disabled={!investment.escrowId}>
                          <Shield className="h-4 w-4 mr-2" />
                          Escrow
                        </TabsTrigger>
                      </TabsList>

                      {/* Overview Tab */}
                      <TabsContent value="overview" className="space-y-4 mt-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted mb-1">Your Investment</p>
                            <p className="text-xl font-bold text-[#22c55e]">
                              ${investment.amountInvested.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted mb-1">Expected Return</p>
                            <p className="text-sm font-semibold">{investment.expectedReturn}</p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted">Project Funding Progress</span>
                            <span className="font-semibold">
                              ${investment.currentFunding.toLocaleString()} / ${investment.totalBudget.toLocaleString()}
                            </span>
                          </div>
                          <Progress value={investment.progress} className="h-2" />
                        </div>

                        <p className="text-sm text-muted">
                          Invested on {new Date(investment.investedDate).toLocaleDateString()}
                        </p>
                      </TabsContent>

                      {/* Pool Tab */}
                      <TabsContent value="pool" className="space-y-4 mt-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted">Pool Status</span>
                            <Badge className={
                              investment.poolStatus === 'funded' 
                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                : investment.poolStatus === 'failed'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }>
                              {investment.poolStatus.charAt(0).toUpperCase() + investment.poolStatus.slice(1)}
                            </Badge>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted">Pool Progress</span>
                              <span className="font-semibold">
                                ${investment.poolRaised.toLocaleString()} / ${investment.poolGoal.toLocaleString()}
                              </span>
                            </div>
                            <Progress 
                              value={(investment.poolRaised / investment.poolGoal) * 100} 
                              className="h-2" 
                            />
                          </div>

                          <Separator />

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted mb-1">Your Contribution</p>
                              <p className="font-semibold">${investment.amountInvested.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted mb-1">
                                {investment.poolStatus === 'funding' ? 'Days Left' : 'Ended'}
                              </p>
                              <p className="font-semibold">
                                {investment.poolStatus === 'funding'
                                  ? Math.ceil((investment.poolDeadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
                                  : new Date(investment.poolDeadline * 1000).toLocaleDateString()
                                }
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted">
                            <span>Pool ID:</span>
                            <span className="font-mono">{investment.poolId}</span>
                            <a
                              href={`https://stellar.expert/explorer/testnet/contract/${investment.poolId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#22c55e] hover:text-[#4ade80] flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>

                          {/* Refund Button for Failed Pools */}
                          {investment.poolStatus === 'failed' && (
                            <Alert className="border-red-500/50 bg-red-500/10">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <AlertDescription>
                                <div className="space-y-3">
                                  <p className="text-sm">
                                    This pool failed to reach its funding goal. You can request a refund of your contribution.
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRequestRefund(investment.poolId, investment.amountInvested)}
                                    disabled={isRefunding === investment.poolId}
                                    className="w-full"
                                  >
                                    {isRefunding === investment.poolId ? (
                                      <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Processing Refund...
                                      </>
                                    ) : (
                                      <>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Request Refund (${investment.amountInvested})
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Success Message for Funded Pools */}
                          {investment.poolStatus === 'funded' && investment.escrowId && (
                            <Alert className="border-green-500/50 bg-green-500/10">
                              <Target className="h-4 w-4 text-green-500" />
                              <AlertDescription className="text-sm">
                                <strong>Pool Funded!</strong> An escrow contract has been created. View the Escrow tab for payment details.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </TabsContent>

                      {/* Escrow Tab */}
                      {investment.escrowId && (
                        <TabsContent value="escrow" className="space-y-4 mt-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted">Escrow Status</span>
                              <Badge className={
                                investment.escrowStatus === 'active'
                                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                  : 'bg-green-500/10 text-green-500 border-green-500/20'
                              }>
                                {investment.escrowStatus?.charAt(0).toUpperCase() + investment.escrowStatus?.slice(1)}
                              </Badge>
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-muted">Funds Released</span>
                                <span className="font-semibold">
                                  ${investment.escrowReleased.toLocaleString()} / ${investment.totalBudget.toLocaleString()}
                                </span>
                              </div>
                              <Progress 
                                value={(investment.escrowReleased / investment.totalBudget) * 100} 
                                className="h-2" 
                              />
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted mb-1">Your Share</p>
                                <p className="font-semibold">
                                  {((investment.amountInvested / investment.poolGoal) * 100).toFixed(1)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-muted mb-1">Your Returns</p>
                                <p className="font-semibold text-[#22c55e]">
                                  ${((investment.amountInvested / investment.poolGoal) * investment.escrowReleased).toFixed(2)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted">
                              <span>Escrow ID:</span>
                              <span className="font-mono">{investment.escrowId}</span>
                              <a
                                href={`https://stellar.expert/explorer/testnet/contract/${investment.escrowId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#22c55e] hover:text-[#4ade80] flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>

                            <Alert className="border-[#4ade80]/50 bg-[#4ade80]/10">
                              <Shield className="h-4 w-4 text-[#22c55e]" />
                              <AlertDescription className="text-sm">
                                Funds are secured in an escrow contract and released as project milestones are completed.
                              </AlertDescription>
                            </Alert>
                          </div>
                        </TabsContent>
                      )}
                    </Tabs>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {myInvestments.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <p className="text-muted text-lg mb-4">You haven't invested in any projects yet</p>
              <Button className="bg-[#4ade80] hover:bg-[#22c55e] text-white" asChild>
                <Link href="/browse">Discover Projects</Link>
              </Button>
            </motion.div>
          )}
        </div>
      </main>
    </GradientBackground>
  )
}
