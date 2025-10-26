'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  DollarSign,
  Calendar,
  Shield,
  CheckCircle,
  Download,
  ExternalLink,
  AlertCircle,
  Loader2,
  FileText,
  TrendingUp,
  Target,
  RefreshCw,
  Briefcase,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { GradientBackground } from '@/components/gradient-background';
import { useState } from 'react';
import { useWalletKit } from '@/hooks/use-wallet-kit';
import { toast } from 'sonner';

// Mock data for bids
const myBids = [
  {
    id: 1,
    projectTitle: 'Mobile App Development for E-commerce',
    projectId: 1,
    bidAmount: 4800,
    deliveryDays: 30,
    status: 'pending',
    submittedDate: '2025-01-15',
    totalBids: 12,
    escrowId: null,
    escrowStatus: null,
  },
  {
    id: 2,
    projectTitle: 'AI-Powered Content Platform',
    projectId: 3,
    bidAmount: 14500,
    deliveryDays: 45,
    status: 'accepted',
    submittedDate: '2025-01-12',
    totalBids: 24,
    escrowId: 'ESCROW_ABC123XYZ',
    escrowStatus: 'active',
    escrowTotalAmount: 14500,
    escrowReleasedAmount: 5000,
    milestones: [
      { id: 0, title: 'Initial Setup & Architecture', amount: 3000, status: 'completed', completedAt: Date.now() - 5 * 24 * 60 * 60 * 1000 },
      { id: 1, title: 'Core Features Development', amount: 5000, status: 'completed', completedAt: Date.now() - 2 * 24 * 60 * 60 * 1000 },
      { id: 2, title: 'AI Integration', amount: 4000, status: 'in-progress', completedAt: null },
      { id: 3, title: 'Testing & Deployment', amount: 2500, status: 'pending', completedAt: null },
    ],
    paymentHistory: [
      { date: Date.now() - 2 * 24 * 60 * 60 * 1000, amount: 5000, milestone: 'Core Features Development', txHash: 'TX123ABC' },
      { date: Date.now() - 5 * 24 * 60 * 60 * 1000, amount: 3000, milestone: 'Initial Setup & Architecture', txHash: 'TX456DEF' },
    ],
  },
  {
    id: 3,
    projectTitle: 'Blockchain Smart Contract Development',
    projectId: 5,
    bidAmount: 7800,
    deliveryDays: 25,
    status: 'rejected',
    submittedDate: '2025-01-10',
    totalBids: 6,
    escrowId: null,
    escrowStatus: null,
  },
];

// Mock data for investments
const myInvestments = [
  {
    id: 1,
    projectTitle: 'Mobile App Development for E-commerce',
    projectId: 1,
    amountInvested: 1000,
    totalBudget: 5000,
    currentFunding: 3200,
    status: 'active',
    investedDate: '2025-01-12',
    expectedReturn: 'Milestone-based returns',
    progress: 64,
    poolId: 'POOL_ABC123',
    poolGoal: 3000,
    poolRaised: 2100,
    poolStatus: 'funding',
    poolDeadline: Math.floor(Date.now() / 1000) + 10 * 24 * 60 * 60,
    escrowId: 'ESCROW_XYZ789',
    escrowStatus: 'active',
    escrowReleased: 1000,
  },
  {
    id: 2,
    projectTitle: 'AI-Powered Content Platform',
    projectId: 3,
    amountInvested: 2500,
    totalBudget: 15000,
    currentFunding: 8900,
    status: 'active',
    investedDate: '2025-01-08',
    expectedReturn: 'Revenue share',
    progress: 59,
    poolId: 'POOL_DEF456',
    poolGoal: 10000,
    poolRaised: 8900,
    poolStatus: 'funding',
    poolDeadline: Math.floor(Date.now() / 1000) + 20 * 24 * 60 * 60,
    escrowId: null,
    escrowStatus: null,
    escrowReleased: 0,
  },
  {
    id: 3,
    projectTitle: 'Brand Identity Design for Tech Startup',
    projectId: 2,
    amountInvested: 500,
    totalBudget: 2500,
    currentFunding: 2500,
    status: 'completed',
    investedDate: '2025-01-05',
    expectedReturn: 'Fixed return',
    progress: 100,
    poolId: 'POOL_GHI789',
    poolGoal: 2500,
    poolRaised: 2500,
    poolStatus: 'funded',
    poolDeadline: Math.floor(Date.now() / 1000) - 5 * 24 * 60 * 60,
    escrowId: 'ESCROW_JKL012',
    escrowStatus: 'completed',
    escrowReleased: 2500,
  },
];

const statusColors = {
  pending: 'bg-[#fbbf24]/10 text-[#fbbf24]',
  accepted: 'bg-[#4ade80]/10 text-[#22c55e]',
  rejected: 'bg-red-500/10 text-red-500',
  active: 'bg-[#4ade80]/10 text-[#22c55e]',
  completed: 'bg-blue-500/10 text-blue-500',
  failed: 'bg-red-500/10 text-red-500',
};

export default function DashboardPage() {
  const wallet = useWalletKit();
  const [isWithdrawing, setIsWithdrawing] = useState<string | null>(null);
  const [isRefunding, setIsRefunding] = useState<string | null>(null);

  const totalInvested = myInvestments.reduce((sum, inv) => sum + inv.amountInvested, 0);
  const totalEarned = myBids
    .filter((bid) => bid.escrowReleasedAmount)
    .reduce((sum, bid) => sum + (bid.escrowReleasedAmount || 0), 0);
  const activeBids = myBids.filter((bid) => bid.status === 'accepted').length;
  const activeInvestments = myInvestments.filter((inv) => inv.status === 'active').length;

  const handleWithdrawFunds = async (escrowId: string, amount: number) => {
    if (!wallet.connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsWithdrawing(escrowId);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success('Funds withdrawn successfully!', {
        description: `${amount} USDC has been transferred to your wallet`,
      });
      await wallet.refreshBalance();
    } catch (error: any) {
      console.error('Failed to withdraw funds:', error);
      toast.error('Failed to withdraw funds', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsWithdrawing(null);
    }
  };

  const handleRequestRefund = async (poolId: string, amount: number) => {
    if (!wallet.connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsRefunding(poolId);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success('Refund processed successfully!', {
        description: `${amount} USDC has been returned to your wallet`,
      });
      await wallet.refreshBalance();
    } catch (error: any) {
      console.error('Failed to request refund:', error);
      toast.error('Failed to request refund', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsRefunding(null);
    }
  };

  return (
    <GradientBackground variant="default">
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Dashboard</h1>
            <p className="text-muted text-lg mb-8">Manage your bids, investments, and earnings</p>
          </motion.div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#4ade80]/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-[#22c55e]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Active Bids</p>
                    <p className="text-2xl font-bold">{activeBids}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Total Earned</p>
                    <p className="text-2xl font-bold">${totalEarned.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Investments</p>
                    <p className="text-2xl font-bold">{activeInvestments}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#fbbf24]/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-[#fbbf24]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Total Invested</p>
                    <p className="text-2xl font-bold">${totalInvested.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="bids" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="bids" className="gap-2">
                <Briefcase className="h-4 w-4" />
                My Bids
              </TabsTrigger>
              <TabsTrigger value="investments" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                My Investments
              </TabsTrigger>
            </TabsList>

            {/* Bids Tab */}
            <TabsContent value="bids" className="space-y-4">
              {myBids.map((bid, index) => (
                <motion.div
                  key={bid.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="space-y-4">
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

                      {(bid.status === 'pending' || bid.status === 'rejected') && (
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
                        </div>
                      )}

                      {bid.status === 'accepted' && bid.escrowId && (
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

                          <TabsContent value="milestones" className="space-y-4 mt-4">
                            <div className="space-y-3">
                              {bid.milestones?.map((milestone) => (
                                <div key={milestone.id} className="p-4 bg-surface-dark rounded-lg">
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`mt-1 rounded-full p-1 ${
                                        milestone.status === 'completed'
                                          ? 'bg-green-500/20 text-green-500'
                                          : milestone.status === 'in-progress'
                                          ? 'bg-blue-500/20 text-blue-500'
                                          : 'bg-gray-500/20 text-gray-500'
                                      }`}
                                    >
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
                                        <p className="text-xs text-muted mt-2">Completed {new Date(milestone.completedAt).toLocaleDateString()}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="escrow" className="space-y-4 mt-4">
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span className="text-muted">Funds Released</span>
                                  <span className="font-semibold">
                                    ${bid.escrowReleasedAmount?.toLocaleString()} / ${bid.escrowTotalAmount?.toLocaleString()}
                                  </span>
                                </div>
                                <Progress value={((bid.escrowReleasedAmount || 0) / (bid.escrowTotalAmount || 1)) * 100} className="h-3" />
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

                              <Alert className="border-[#4ade80]/50 bg-[#4ade80]/10">
                                <Shield className="h-4 w-4 text-[#22c55e]" />
                                <AlertDescription className="text-sm">
                                  Your funds are secured in a smart contract. Payments are released automatically as milestones are completed.
                                </AlertDescription>
                              </Alert>
                            </div>
                          </TabsContent>

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
                                          <span className="text-sm font-semibold text-[#22c55e]">+${payment.amount.toLocaleString()}</span>
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
                            </div>
                          </TabsContent>
                        </Tabs>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}

              {myBids.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <p className="text-muted text-lg mb-4">You haven't placed any bids yet</p>
                  <Button className="bg-[#4ade80] hover:bg-[#22c55e] text-white" asChild>
                    <Link href="/browse">Browse Projects</Link>
                  </Button>
                </motion.div>
              )}
            </TabsContent>

            {/* Investments Tab */}
            <TabsContent value="investments" className="space-y-4">
              {myInvestments.map((investment, index) => (
                <motion.div
                  key={investment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="space-y-4">
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

                        <TabsContent value="overview" className="space-y-4 mt-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted mb-1">Your Investment</p>
                              <p className="text-xl font-bold text-[#22c55e]">${investment.amountInvested.toLocaleString()}</p>
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

                          <p className="text-sm text-muted">Invested on {new Date(investment.investedDate).toLocaleDateString()}</p>
                        </TabsContent>

                        <TabsContent value="pool" className="space-y-4 mt-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted">Pool Status</span>
                              <Badge
                                className={
                                  investment.poolStatus === 'funded'
                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                    : investment.poolStatus === 'failed'
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                }
                              >
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
                              <Progress value={(investment.poolRaised / investment.poolGoal) * 100} className="h-2" />
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted mb-1">Your Contribution</p>
                                <p className="font-semibold">${investment.amountInvested.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted mb-1">{investment.poolStatus === 'funding' ? 'Days Left' : 'Ended'}</p>
                                <p className="font-semibold">
                                  {investment.poolStatus === 'funding'
                                    ? Math.ceil((investment.poolDeadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
                                    : new Date(investment.poolDeadline * 1000).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {investment.poolStatus === 'failed' && (
                              <Alert className="border-red-500/50 bg-red-500/10">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <AlertDescription>
                                  <div className="space-y-3">
                                    <p className="text-sm">This pool failed to reach its funding goal. You can request a refund of your contribution.</p>
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

                        {investment.escrowId && (
                          <TabsContent value="escrow" className="space-y-4 mt-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted">Escrow Status</span>
                                <Badge
                                  className={
                                    investment.escrowStatus === 'active'
                                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                      : 'bg-green-500/10 text-green-500 border-green-500/20'
                                  }
                                >
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
                                <Progress value={(investment.escrowReleased / investment.totalBudget) * 100} className="h-2" />
                              </div>

                              <Separator />

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted mb-1">Your Share</p>
                                  <p className="font-semibold">{((investment.amountInvested / investment.poolGoal) * 100).toFixed(1)}%</p>
                                </div>
                                <div>
                                  <p className="text-muted mb-1">Your Returns</p>
                                  <p className="font-semibold text-[#22c55e]">
                                    ${((investment.amountInvested / investment.poolGoal) * investment.escrowReleased).toFixed(2)}
                                  </p>
                                </div>
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

              {myInvestments.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <p className="text-muted text-lg mb-4">You haven't invested in any projects yet</p>
                  <Button className="bg-[#4ade80] hover:bg-[#22c55e] text-white" asChild>
                    <Link href="/browse">Discover Projects</Link>
                  </Button>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </GradientBackground>
  );
}
