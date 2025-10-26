"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, DollarSign, Users, Clock, CheckCircle2, Shield, Loader2, ExternalLink, AlertCircle, Target, TrendingUp, Download, FileText } from "lucide-react"
import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { GradientBackground } from "@/components/gradient-background"
import { useWalletKit } from "@/hooks/use-wallet-kit"
import { submitBidWithCheckpoints, BidFormData } from "@/lib/stellar/bid-validation"
import { SignedBid, fetchEscrowBids, verifyBidSignature } from "@/lib/stellar/contracts"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock project data
const projectData = {
  id: 1,
  title: "Mobile App Development for E-commerce",
  description:
    "We are looking for an experienced React Native developer to build a cross-platform mobile shopping application. The app needs to support iOS and Android, integrate with our existing backend API, and include features like product browsing, cart management, secure checkout, and order tracking.",
  category: "Development",
  budget: 5000,
  funded: 3200,
  bids: 12,
  daysLeft: 14,
  postedDate: "2025-01-10",
  skills: ["React Native", "Node.js", "Payment APIs", "REST API", "Mobile UI/UX"],
  milestones: [
    { title: "UI/UX Design & Wireframes", budget: 1000, status: "completed" },
    { title: "Core App Development", budget: 2500, status: "in-progress" },
    { title: "Payment Integration", budget: 1000, status: "pending" },
    { title: "Testing & Deployment", budget: 500, status: "pending" },
  ],
  client: {
    name: "TechCorp Inc.",
    avatar: "/diverse-company-team.png",
    rating: 4.8,
    projectsPosted: 23,
  },
  // Stellar blockchain integration
  escrowId: "ESCROW_DEMO_12345", // In production, this would be fetched from blockchain
  escrowStatus: "active", // active, completed, disputed
  escrowContractAddress: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
  escrowTotalAmount: "5000",
  escrowReleasedAmount: "1000",
  escrowReleaseType: "milestone-based",
  // Crowdfunding pool data
  hasCrowdfunding: true,
  poolId: "POOL_DEMO_67890",
  poolStatus: "funding", // funding, funded, failed
  poolGoal: "3000",
  poolRaised: "2100",
  poolDeadline: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60), // 14 days from now
  poolContributors: 8,
  topBids: [
    {
      id: 1,
      freelancer: "Sarah Chen",
      avatar: "/developer-working.png",
      amount: 4800,
      deliveryDays: 30,
      rating: 4.9,
      verified: true, // On-chain verified
      signature: "MOCK_SIGNATURE_1",
    },
    {
      id: 2,
      freelancer: "Mike Johnson",
      avatar: "/coder.png",
      amount: 5200,
      deliveryDays: 25,
      rating: 4.7,
      verified: true,
      signature: "MOCK_SIGNATURE_2",
    },
    {
      id: 3,
      freelancer: "Alex Kumar",
      avatar: "/programmer.png",
      amount: 4500,
      deliveryDays: 35,
      rating: 4.8,
      verified: false, // Off-chain bid
    },
  ],
}

type SubmitState = 
  | 'idle'
  | 'validating'
  | 'signing'
  | 'verifying'
  | 'submitting'
  | 'success'
  | 'error';

export default function ProjectDetailPage() {
  const wallet = useWalletKit();
  const fundedPercentage = (projectData.funded / projectData.budget) * 100
  const [bidDialogOpen, setBidDialogOpen] = React.useState(false)
  const [fundDialogOpen, setFundDialogOpen] = React.useState(false)
  
  // Bid form state
  const [bidFormData, setBidFormData] = React.useState<BidFormData>({
    bidAmount: '',
    deliveryDays: '',
    proposal: '',
    portfolioLink: '',
    milestonesApproach: '',
  });
  
  // Submission state tracking
  const [submitState, setSubmitState] = React.useState<SubmitState>('idle');
  const [transactionHash, setTransactionHash] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  
  const isSubmitting = submitState !== 'idle' && submitState !== 'success' && submitState !== 'error';
  
  // Escrow and pool management state
  const [isCompletingMilestone, setIsCompletingMilestone] = React.useState(false);
  const [isWithdrawing, setIsWithdrawing] = React.useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = React.useState<number | null>(null);
  const [poolContributionAmount, setPoolContributionAmount] = React.useState('');
  const [isContributingToPool, setIsContributingToPool] = React.useState(false);

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Wallet Not Connected', {
        description: 'Please connect your Stellar wallet to submit a bid.',
      });
      return;
    }
    
    try {
      setErrorMessage(null);
      setSubmitState('validating');
      
      // Submit bid with 5-checkpoint validation
      const walletTypeForBid = (wallet.walletType === 'freighter' || wallet.walletType === 'albedo') 
        ? wallet.walletType 
        : 'freighter';
      
      const result = await submitBidWithCheckpoints(
        bidFormData,
        projectData.escrowId,
        wallet.publicKey,
        projectData.budget,
        wallet.connected,
        walletTypeForBid
      );
      
      if (result.success) {
        setSubmitState('success');
        setTransactionHash(result.transactionHash || null);
        
        // Reset form and close dialog after 3 seconds
        setTimeout(() => {
          setBidDialogOpen(false);
          setSubmitState('idle');
          setBidFormData({
            bidAmount: '',
            deliveryDays: '',
            proposal: '',
            portfolioLink: '',
            milestonesApproach: '',
          });
          setTransactionHash(null);
        }, 3000);
      } else {
        setSubmitState('error');
        setErrorMessage(result.error || 'Failed to submit bid');
      }
    } catch (error) {
      setSubmitState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      console.error('Bid submission error:', error);
    }
  }

  const handleFundSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Funding submitted")
    setFundDialogOpen(false)
  }

  const handleCompleteMilestone = async (milestoneId: number) => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsCompletingMilestone(true);
    setSelectedMilestoneId(milestoneId);
    
    try {
      // In production, this would call the EscrowService
      // await escrowService.completeMilestone(projectData.escrowContractAddress, milestoneId, signer);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Milestone completed successfully!', {
        description: 'Funds have been released to the service provider',
      });
      
      // Refresh project data
      // In production: await fetchProjectData();
    } catch (error: any) {
      console.error('Failed to complete milestone:', error);
      toast.error('Failed to complete milestone', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsCompletingMilestone(false);
      setSelectedMilestoneId(null);
    }
  };

  const handleWithdrawFunds = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsWithdrawing(true);
    
    try {
      // In production, this would call the EscrowService
      // await escrowService.withdrawReleased(projectData.escrowContractAddress, signer);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Funds withdrawn successfully!', {
        description: 'Check your wallet balance',
      });
      
      // Refresh wallet balance
      await wallet.refreshBalance();
    } catch (error: any) {
      console.error('Failed to withdraw funds:', error);
      toast.error('Failed to withdraw funds', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleContributeToPool = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!poolContributionAmount || parseFloat(poolContributionAmount) <= 0) {
      toast.error('Please enter a valid contribution amount');
      return;
    }

    setIsContributingToPool(true);
    
    try {
      // In production, this would call the CrowdfundingService
      // await crowdfundingService.contribute(projectData.poolId, poolContributionAmount, signer);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Contribution successful!', {
        description: `You contributed ${poolContributionAmount} USDC`,
      });
      
      setPoolContributionAmount('');
      await wallet.refreshBalance();
    } catch (error: any) {
      console.error('Failed to contribute:', error);
      toast.error('Failed to contribute', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsContributingToPool(false);
    }
  };

  return (
    <GradientBackground variant="default">
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-[#4ade80]/10 text-[#22c55e] hover:bg-[#4ade80]/20">{projectData.category}</Badge>
                  <span className="text-sm text-muted flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Posted on {new Date(projectData.postedDate).toLocaleDateString()}
                  </span>
                </div>

                <h1 className="text-4xl font-bold mb-4 text-balance">{projectData.title}</h1>

                <div className="flex flex-wrap gap-4 text-sm text-muted mb-6">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {projectData.daysLeft} days left
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {projectData.bids} bids
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />${projectData.budget.toLocaleString()} budget
                  </span>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Project Description</h2>
                  <p className="text-muted leading-relaxed mb-6">{projectData.description}</p>

                  <h3 className="font-semibold mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {projectData.skills.map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-surface-dark rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="p-6">
                  <Tabs defaultValue="milestones" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="milestones">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Milestones
                      </TabsTrigger>
                      <TabsTrigger value="escrow">
                        <Shield className="h-4 w-4 mr-2" />
                        Escrow
                      </TabsTrigger>
                      {projectData.hasCrowdfunding && (
                        <TabsTrigger value="crowdfunding">
                          <Target className="h-4 w-4 mr-2" />
                          Crowdfunding
                        </TabsTrigger>
                      )}
                    </TabsList>

                    {/* Milestones Tab */}
                    <TabsContent value="milestones" className="space-y-4 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Project Milestones</h2>
                        {wallet.publicKey === projectData.client.name && (
                          <Badge variant="outline">You are the Client</Badge>
                        )}
                      </div>
                      <div className="space-y-4">
                        {projectData.milestones.map((milestone, index) => (
                          <div key={index} className="flex items-start gap-4 p-4 bg-surface-dark rounded-lg">
                            <div
                              className={`mt-1 ${
                                milestone.status === "completed"
                                  ? "text-[#4ade80]"
                                  : milestone.status === "in-progress"
                                    ? "text-[#fbbf24]"
                                    : "text-muted"
                              }`}
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold">{milestone.title}</h4>
                                <span className="text-sm font-semibold">${milestone.budget.toLocaleString()}</span>
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  milestone.status === "completed"
                                    ? "bg-[#4ade80]/10 text-[#22c55e]"
                                    : milestone.status === "in-progress"
                                      ? "bg-[#fbbf24]/10 text-[#fbbf24]"
                                      : "bg-surface text-muted"
                                }`}
                              >
                                {milestone.status.replace("-", " ")}
                              </span>
                              {milestone.status === "in-progress" && wallet.connected && (
                                <div className="mt-3">
                                  <Button
                                    size="sm"
                                    onClick={() => handleCompleteMilestone(index)}
                                    disabled={isCompletingMilestone}
                                    className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
                                  >
                                    {isCompletingMilestone && selectedMilestoneId === index ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Completing...
                                      </>
                                    ) : (
                                      'Mark as Complete'
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Escrow Tab */}
                    <TabsContent value="escrow" className="space-y-4 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Escrow Contract</h2>
                        <Badge 
                          variant="outline" 
                          className={
                            projectData.escrowStatus === 'active' 
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              : projectData.escrowStatus === 'completed'
                              ? 'bg-green-500/10 text-green-500 border-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }
                        >
                          {projectData.escrowStatus.charAt(0).toUpperCase() + projectData.escrowStatus.slice(1)}
                        </Badge>
                      </div>

                      {/* Escrow Progress */}
                      <Card className="bg-surface-dark">
                        <div className="p-6 space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted">Released</span>
                              <span className="font-semibold">
                                ${projectData.escrowReleasedAmount} / ${projectData.escrowTotalAmount} USDC
                              </span>
                            </div>
                            <Progress 
                              value={(parseFloat(projectData.escrowReleasedAmount) / parseFloat(projectData.escrowTotalAmount)) * 100} 
                              className="h-3" 
                            />
                            <div className="flex justify-between text-xs text-muted">
                              <span>
                                {((parseFloat(projectData.escrowReleasedAmount) / parseFloat(projectData.escrowTotalAmount)) * 100).toFixed(1)}% completed
                              </span>
                              <span className="capitalize">{projectData.escrowReleaseType.replace('-', ' ')}</span>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Contract Details */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="bg-surface-dark">
                          <div className="p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted">
                              <FileText className="h-4 w-4" />
                              <span>Contract Address</span>
                            </div>
                            <p className="text-xs font-mono break-all">
                              {projectData.escrowContractAddress.slice(0, 12)}...{projectData.escrowContractAddress.slice(-12)}
                            </p>
                            <a
                              href={`https://stellar.expert/explorer/testnet/contract/${projectData.escrowContractAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#22c55e] hover:text-[#4ade80] flex items-center gap-1"
                            >
                              View on Explorer <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </Card>

                        <Card className="bg-surface-dark">
                          <div className="p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted">
                              <DollarSign className="h-4 w-4" />
                              <span>Available to Withdraw</span>
                            </div>
                            <p className="text-2xl font-bold text-[#22c55e]">
                              ${projectData.escrowReleasedAmount} USDC
                            </p>
                            {parseFloat(projectData.escrowReleasedAmount) > 0 && wallet.connected && (
                              <Button
                                size="sm"
                                onClick={handleWithdrawFunds}
                                disabled={isWithdrawing}
                                className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white mt-2"
                              >
                                {isWithdrawing ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Withdrawing...
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Withdraw Funds
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </Card>
                      </div>

                      {/* Transaction History */}
                      <Card className="bg-surface-dark">
                        <div className="p-4">
                          <h3 className="font-semibold mb-3">Transaction History</h3>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium">Milestone 1 Completed</p>
                                <p className="text-xs text-muted">Released $1,000 USDC • 2 days ago</p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-3 text-sm">
                              <FileText className="h-4 w-4 text-blue-500 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium">Escrow Contract Created</p>
                                <p className="text-xs text-muted">Locked $5,000 USDC • 5 days ago</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </TabsContent>

                    {/* Crowdfunding Tab */}
                    {projectData.hasCrowdfunding && (
                      <TabsContent value="crowdfunding" className="space-y-4 mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold">Crowdfunding Pool</h2>
                          <Badge 
                            variant="outline"
                            className={
                              projectData.poolStatus === 'funded'
                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                : projectData.poolStatus === 'failed'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }
                          >
                            {projectData.poolStatus.charAt(0).toUpperCase() + projectData.poolStatus.slice(1)}
                          </Badge>
                        </div>

                        {/* Pool Progress */}
                        <Card className="bg-surface-dark">
                          <div className="p-6 space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted">Funding Progress</span>
                                <span className="text-sm font-semibold">
                                  {((parseFloat(projectData.poolRaised) / parseFloat(projectData.poolGoal)) * 100).toFixed(1)}%
                                </span>
                              </div>
                              <Progress 
                                value={(parseFloat(projectData.poolRaised) / parseFloat(projectData.poolGoal)) * 100} 
                                className="h-4" 
                              />
                              <div className="flex justify-between">
                                <span className="text-2xl font-bold">${parseFloat(projectData.poolRaised).toLocaleString()} USDC</span>
                                <span className="text-lg text-muted">of ${parseFloat(projectData.poolGoal).toLocaleString()} USDC</span>
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* Pool Stats */}
                        <div className="grid grid-cols-3 gap-4">
                          <Card className="bg-surface-dark">
                            <div className="p-4">
                              <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-[#4ade80]" />
                                <div>
                                  <p className="text-sm text-muted">Contributors</p>
                                  <p className="text-xl font-bold">{projectData.poolContributors}</p>
                                </div>
                              </div>
                            </div>
                          </Card>

                          <Card className="bg-surface-dark">
                            <div className="p-4">
                              <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-[#4ade80]" />
                                <div>
                                  <p className="text-sm text-muted">Days Left</p>
                                  <p className="text-xl font-bold">
                                    {Math.ceil((projectData.poolDeadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Card>

                          <Card className="bg-surface-dark">
                            <div className="p-4">
                              <div className="flex items-center gap-3">
                                <DollarSign className="h-5 w-5 text-[#4ade80]" />
                                <div>
                                  <p className="text-sm text-muted">Avg. Contribution</p>
                                  <p className="text-xl font-bold">
                                    ${(parseFloat(projectData.poolRaised) / projectData.poolContributors).toFixed(0)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>

                        {/* Contribution Form */}
                        {projectData.poolStatus === 'funding' && (
                          <Card className="bg-surface-dark">
                            <div className="p-6 space-y-4">
                              <h3 className="font-semibold flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-[#4ade80]" />
                                Make a Contribution
                              </h3>
                              <div className="space-y-2">
                                <Label htmlFor="pool-contribution">Contribution Amount (USDC)</Label>
                                <Input
                                  id="pool-contribution"
                                  type="number"
                                  step="0.01"
                                  placeholder="100.00"
                                  value={poolContributionAmount}
                                  onChange={(e) => setPoolContributionAmount(e.target.value)}
                                />
                                {wallet.usdcBalance && (
                                  <p className="text-sm text-muted">
                                    Available balance: {parseFloat(wallet.usdcBalance).toFixed(2)} USDC
                                  </p>
                                )}
                              </div>
                              <Button
                                onClick={handleContributeToPool}
                                disabled={!wallet.connected || isContributingToPool || !poolContributionAmount}
                                className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white"
                              >
                                {isContributingToPool ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Contributing...
                                  </>
                                ) : (
                                  <>
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Contribute
                                  </>
                                )}
                              </Button>
                            </div>
                          </Card>
                        )}
                      </TabsContent>
                    )}
                  </Tabs>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Top Bids</h2>
                  <div className="space-y-4">
                    {projectData.topBids.map((bid) => (
                      <div key={bid.id} className="flex items-center justify-between p-4 bg-surface-dark rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <img src={bid.avatar || "/placeholder.svg"} alt={bid.freelancer} />
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{bid.freelancer}</h4>
                            <p className="text-sm text-muted">⭐ {bid.rating} rating</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${bid.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted">{bid.deliveryDays} days</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <Card className="p-6 sticky top-24">
                  <h3 className="font-bold text-lg mb-4">Funding Progress</h3>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#22c55e]">${projectData.funded.toLocaleString()}</span>
                      <span className="text-muted">of ${projectData.budget.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-surface-dark rounded-full overflow-hidden mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${fundedPercentage}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-[#4ade80] rounded-full"
                      />
                    </div>
                    <p className="text-sm text-muted">{fundedPercentage.toFixed(0)}% funded</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white" size="lg">
                          Place a Bid
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Submit Your Bid</DialogTitle>
                          <DialogDescription>
                            Provide details about your proposal and how you'll deliver this project
                          </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleBidSubmit} className="space-y-4 mt-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="bid-amount">Bid Amount (USD) *</Label>
                              <div className="relative mt-2">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                <Input id="bid-amount" type="number" placeholder="4500" required className="pl-9" />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="delivery-time">Delivery Time (days) *</Label>
                              <div className="relative mt-2">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                <Input id="delivery-time" type="number" placeholder="30" required className="pl-9" />
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="proposal">Your Proposal *</Label>
                            <Textarea
                              id="proposal"
                              placeholder="Explain your approach, relevant experience, and why you're the best fit for this project..."
                              required
                              className="mt-2 min-h-32"
                            />
                          </div>

                          <div>
                            <Label htmlFor="portfolio">Portfolio Links</Label>
                            <Input id="portfolio" type="url" placeholder="https://yourportfolio.com" className="mt-2" />
                          </div>

                          <div>
                            <Label htmlFor="milestones-approach">Milestone Approach</Label>
                            <Textarea
                              id="milestones-approach"
                              placeholder="How will you tackle each milestone? What's your timeline for each phase?"
                              className="mt-2 min-h-24"
                            />
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button type="submit" className="flex-1 bg-[#4ade80] hover:bg-[#22c55e] text-white">
                              Submit Bid
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setBidDialogOpen(false)}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-transparent" variant="outline" size="lg">
                          Fund This Project
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Fund This Project</DialogTitle>
                          <DialogDescription>
                            Invest in this project and help bring it to life. You'll receive updates on progress.
                          </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleFundSubmit} className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="fund-amount">Funding Amount (USD) *</Label>
                            <div className="relative mt-2">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                              <Input id="fund-amount" type="number" placeholder="500" required className="pl-9" />
                            </div>
                            <p className="text-xs text-muted mt-2">
                              Remaining to fund: ${(projectData.budget - projectData.funded).toLocaleString()}
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="fund-message">Message to Project Owner (Optional)</Label>
                            <Textarea
                              id="fund-message"
                              placeholder="Share why you're excited about this project..."
                              className="mt-2 min-h-24"
                            />
                          </div>

                          <div className="bg-surface-dark p-4 rounded-lg">
                            <h4 className="font-semibold mb-2 text-sm">Funding Details</h4>
                            <ul className="text-sm text-muted space-y-1">
                              <li>• Funds held in secure escrow</li>
                              <li>• Released upon milestone completion</li>
                              <li>• Full transparency on blockchain</li>
                            </ul>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button type="submit" className="flex-1 bg-[#4ade80] hover:bg-[#22c55e] text-white">
                              Confirm Funding
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setFundDialogOpen(false)}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <h4 className="font-semibold mb-3">Posted by</h4>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <img src={projectData.client.avatar || "/placeholder.svg"} alt={projectData.client.name} />
                      </Avatar>
                      <div>
                        <p className="font-semibold">{projectData.client.name}</p>
                        <p className="text-sm text-muted">⭐ {projectData.client.rating} rating</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted">{projectData.client.projectsPosted} projects posted</p>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </GradientBackground>
  )
}
