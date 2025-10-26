"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, DollarSign, Calendar, Shield, CheckCircle, Download, ExternalLink, AlertCircle, Loader2, FileText } from "lucide-react"
import Link from "next/link"
import { GradientBackground } from "@/components/gradient-background"
import { useState } from "react"
import { useWalletKit } from "@/hooks/use-wallet-kit"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

const myBids = [
  {
    id: 1,
    projectTitle: "Mobile App Development for E-commerce",
    projectId: 1,
    bidAmount: 4800,
    deliveryDays: 30,
    status: "pending",
    submittedDate: "2025-01-15",
    totalBids: 12,
    // No escrow yet
    escrowId: null,
    escrowStatus: null,
  },
  {
    id: 2,
    projectTitle: "AI-Powered Content Platform",
    projectId: 3,
    bidAmount: 14500,
    deliveryDays: 45,
    status: "accepted",
    submittedDate: "2025-01-12",
    totalBids: 24,
    // Escrow data for accepted bid
    escrowId: "ESCROW_ABC123XYZ",
    escrowStatus: "active",
    escrowTotalAmount: 14500,
    escrowReleasedAmount: 5000,
    milestones: [
      { id: 0, title: "Initial Setup & Architecture", amount: 3000, status: "completed", completedAt: Date.now() - (5 * 24 * 60 * 60 * 1000) },
      { id: 1, title: "Core Features Development", amount: 5000, status: "completed", completedAt: Date.now() - (2 * 24 * 60 * 60 * 1000) },
      { id: 2, title: "AI Integration", amount: 4000, status: "in-progress", completedAt: null },
      { id: 3, title: "Testing & Deployment", amount: 2500, status: "pending", completedAt: null },
    ],
    paymentHistory: [
      { date: Date.now() - (2 * 24 * 60 * 60 * 1000), amount: 5000, milestone: "Core Features Development", txHash: "TX123ABC" },
      { date: Date.now() - (5 * 24 * 60 * 60 * 1000), amount: 3000, milestone: "Initial Setup & Architecture", txHash: "TX456DEF" },
    ],
  },
  {
    id: 3,
    projectTitle: "Blockchain Smart Contract Development",
    projectId: 5,
    bidAmount: 7800,
    deliveryDays: 25,
    status: "rejected",
    submittedDate: "2025-01-10",
    totalBids: 6,
    // No escrow for rejected bid
    escrowId: null,
    escrowStatus: null,
  },
]

const statusColors = {
  pending: "bg-[#fbbf24]/10 text-[#fbbf24]",
  accepted: "bg-[#4ade80]/10 text-[#22c55e]",
  rejected: "bg-red-500/10 text-red-500",
}

export default function MyBidsPage() {
  const wallet = useWalletKit()
  const [isWithdrawing, setIsWithdrawing] = useState<string | null>(null)
  
  const handleWithdrawFunds = async (escrowId: string, amount: number) => {
    if (!wallet.connected) {
      toast.error('Please connect your wallet first')
      return
    }
    
    setIsWithdrawing(escrowId)
    
    try {
      // In production, this would call the EscrowService
      // await escrowService.withdrawReleased(escrowId, signer)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Funds withdrawn successfully!', {
        description: `${amount} USDC has been transferred to your wallet`,
      })
      
      await wallet.refreshBalance()
    } catch (error: any) {
      console.error('Failed to withdraw funds:', error)
      toast.error('Failed to withdraw funds', {
        description: error.message || 'Please try again',
      })
    } finally {
      setIsWithdrawing(null)
    }
  }
  return (
    <GradientBackground variant="default">
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">My Bids</h1>
            <p className="text-muted text-lg mb-8">Track all your project proposals and their status</p>
          </motion.div>

          <div className="space-y-4">
            {myBids.map((bid, index) => (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">{bid.projectTitle}</h3>
                        <Badge className={statusColors[bid.status as keyof typeof statusColors]}>
                          {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                        </Badge>
                        {bid.escrowId && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            <Shield className="h-3 w-3 mr-1" />
                            Escrow Active
                          </Badge>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/project/${bid.projectId}`}>View Project</Link>
                      </Button>
                    </div>

                    {/* Bid Details for Pending/Rejected */}
                    {(bid.status === "pending" || bid.status === "rejected") && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-4 text-sm text-muted">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Bid: ${bid.bidAmount.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {bid.deliveryDays} days
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Submitted {new Date(bid.submittedDate).toLocaleDateString()}
                          </span>
                          <span>Competing with {bid.totalBids - 1} other bids</span>
                        </div>

                        {bid.status === "pending" && (
                          <Button variant="ghost" size="sm" className="text-[#22c55e] hover:text-[#4ade80]">
                            Edit Bid
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Escrow Details for Accepted Bids */}
                    {bid.status === "accepted" && bid.escrowId && (
                      <Tabs defaultValue="milestones" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="milestones">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Milestones
                          </TabsTrigger>
                          <TabsTrigger value="escrow">
                            <Shield className="h-4 w-4 mr-2" />
                            Escrow
                          </TabsTrigger>
                          <TabsTrigger value="payments">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Payments
                          </TabsTrigger>
                        </TabsList>

                        {/* Milestones Tab */}
                        <TabsContent value="milestones" className="space-y-4 mt-4">
                          <div className="space-y-3">
                            {bid.milestones?.map((milestone, idx) => (
                              <div key={milestone.id} className="p-4 bg-surface-dark rounded-lg">
                                <div className="flex items-start gap-3">
                                  <div className={`mt-1 rounded-full p-1 ${
                                    milestone.status === 'completed'
                                      ? 'bg-green-500/20 text-green-500'
                                      : milestone.status === 'in-progress'
                                      ? 'bg-blue-500/20 text-blue-500'
                                      : 'bg-gray-500/20 text-gray-500'
                                  }`}>
                                    <CheckCircle className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold">{milestone.title}</h4>
                                      <span className="text-sm font-semibold">${milestone.amount.toLocaleString()}</span>
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        milestone.status === 'completed'
                                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                          : milestone.status === 'in-progress'
                                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                      }
                                    >
                                      {milestone.status.replace('-', ' ').charAt(0).toUpperCase() + milestone.status.replace('-', ' ').slice(1)}
                                    </Badge>
                                    {milestone.completedAt && (
                                      <p className="text-xs text-muted mt-2">
                                        Completed {new Date(milestone.completedAt).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between p-3 bg-surface-dark rounded-lg">
                            <span className="text-sm text-muted">Progress</span>
                            <span className="font-semibold">
                              {bid.milestones?.filter(m => m.status === 'completed').length} / {bid.milestones?.length} completed
                            </span>
                          </div>
                        </TabsContent>

                        {/* Escrow Tab */}
                        <TabsContent value="escrow" className="space-y-4 mt-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted">Escrow Status</span>
                              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                {bid.escrowStatus?.charAt(0).toUpperCase() + bid.escrowStatus?.slice(1)}
                              </Badge>
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-muted">Funds Released</span>
                                <span className="font-semibold">
                                  ${bid.escrowReleasedAmount?.toLocaleString()} / ${bid.escrowTotalAmount?.toLocaleString()}
                                </span>
                              </div>
                              <Progress 
                                value={((bid.escrowReleasedAmount || 0) / (bid.escrowTotalAmount || 1)) * 100} 
                                className="h-3" 
                              />
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-surface-dark rounded-lg">
                                <p className="text-sm text-muted mb-1">Total Contract</p>
                                <p className="text-xl font-bold">${bid.escrowTotalAmount?.toLocaleString()}</p>
                              </div>
                              <div className="p-3 bg-surface-dark rounded-lg">
                                <p className="text-sm text-muted mb-1">Available to Withdraw</p>
                                <p className="text-xl font-bold text-[#22c55e]">${bid.escrowReleasedAmount?.toLocaleString()}</p>
                              </div>
                            </div>

                            {(bid.escrowReleasedAmount || 0) > 0 && (
                              <Button
                                onClick={() => handleWithdrawFunds(bid.escrowId!, bid.escrowReleasedAmount!)}
                                disabled={isWithdrawing === bid.escrowId}
                                className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white"
                              >
                                {isWithdrawing === bid.escrowId ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Withdrawing...
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Withdraw ${bid.escrowReleasedAmount?.toLocaleString()}
                                  </>
                                )}
                              </Button>
                            )}

                            <div className="flex items-center gap-2 text-xs text-muted">
                              <span>Contract:</span>
                              <span className="font-mono">{bid.escrowId.slice(0, 12)}...{bid.escrowId.slice(-12)}</span>
                              <a
                                href={`https://stellar.expert/explorer/testnet/contract/${bid.escrowId}`}
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
                                Your funds are secured in a smart contract. Payments are released automatically as milestones are completed by the client.
                              </AlertDescription>
                            </Alert>
                          </div>
                        </TabsContent>

                        {/* Payments Tab */}
                        <TabsContent value="payments" className="space-y-4 mt-4">
                          <div className="space-y-3">
                            <h4 className="font-semibold">Payment History</h4>
                            {bid.paymentHistory && bid.paymentHistory.length > 0 ? (
                              <div className="space-y-3">
                                {bid.paymentHistory.map((payment, idx) => (
                                  <div key={idx} className="flex items-start gap-3 p-3 bg-surface-dark rounded-lg">
                                    <div className="mt-1">
                                      <DollarSign className="h-4 w-4 text-green-500" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium">{payment.milestone}</p>
                                        <span className="text-sm font-semibold text-[#22c55e]">
                                          +${payment.amount.toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted mb-2">
                                        {new Date(payment.date).toLocaleDateString()} at {new Date(payment.date).toLocaleTimeString()}
                                      </p>
                                      <a
                                        href={`https://stellar.expert/explorer/testnet/tx/${payment.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#22c55e] hover:text-[#4ade80] flex items-center gap-1"
                                      >
                                        View Transaction <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted">
                                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No payments received yet</p>
                              </div>
                            )}

                            <Separator />

                            <div className="flex items-center justify-between p-3 bg-surface-dark rounded-lg">
                              <span className="text-sm text-muted">Total Earned</span>
                              <span className="text-xl font-bold text-[#22c55e]">
                                ${bid.escrowReleasedAmount?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {myBids.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <p className="text-muted text-lg mb-4">You haven't placed any bids yet</p>
              <Button className="bg-[#4ade80] hover:bg-[#22c55e] text-white" asChild>
                <Link href="/browse">Browse Projects</Link>
              </Button>
            </motion.div>
          )}
        </div>
      </main>
    </GradientBackground>
  )
}
