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
import { useFiatBalance } from "@/hooks/use-fiat-balance"
import { submitBidWithCheckpoints, BidFormData } from "@/lib/stellar/bid-validation"
import { SignedBid, fetchEscrowBids, verifyBidSignature } from "@/lib/stellar/contracts"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  getEscrowStatus, 
  fundEscrow, 
  releaseMilestone, 
  withdrawFunds,
  submitBid,
  fetchBids,
  EscrowStatus,
  SignedBid as TrustlessWorkBid,
  TrustlessWorkError
} from "@/lib/stellar/trustless-work"
import { getAccountBalance } from "@/lib/stellar/wallet"
import { STELLAR_CONFIG } from "@/lib/stellar/config"

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
  const fiatBalance = useFiatBalance();
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
  
  // Trustless Work integration state
  const [escrowStatus, setEscrowStatus] = React.useState<EscrowStatus | null>(null);
  const [loadingEscrow, setLoadingEscrow] = React.useState(true);
  const [escrowBids, setEscrowBids] = React.useState<TrustlessWorkBid[]>([]);
  const [loadingBids, setLoadingBids] = React.useState(false);
  const [fundAmount, setFundAmount] = React.useState('');
  const [isFunding, setIsFunding] = React.useState(false);
  
  // Fetch escrow status on mount
  React.useEffect(() => {
    const fetchEscrowStatus = async () => {
      try {
        setLoadingEscrow(true);
        const status = await getEscrowStatus(projectData.escrowId);
        setEscrowStatus(status);
      } catch (error) {
        console.error('Error fetching escrow status:', error);
        if (error instanceof TrustlessWorkError) {
          toast.error('Failed to load escrow status', {
            description: error.message,
          });
        }
      } finally {
        setLoadingEscrow(false);
      }
    };
    
    fetchEscrowStatus();
  }, []);
  
  // Fetch bids when escrow tab is active
  const fetchEscrowBidsData = React.useCallback(async () => {
    try {
      setLoadingBids(true);
      const bids = await fetchBids(projectData.escrowId);
      setEscrowBids(bids);
    } catch (error) {
      console.error('Error fetching bids:', error);
      toast.error('Failed to load bids');
    } finally {
      setLoadingBids(false);
    }
  }, []);
  
  // Refresh escrow status
  const refreshEscrowStatus = React.useCallback(async () => {
    try {
      const status = await getEscrowStatus(projectData.escrowId);
      setEscrowStatus(status);
    } catch (error) {
      console.error('Error refreshing escrow status:', error);
    }
  }, []);

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
      
      // Validate bid amount against budget
      const bidAmount = parseFloat(bidFormData.bidAmount);
      if (isNaN(bidAmount) || bidAmount <= 0) {
        setSubmitState('error');
        setErrorMessage('Please enter a valid bid amount');
        return;
      }
      
      if (bidAmount > projectData.budget) {
        setSubmitState('error');
        setErrorMessage(`Bid amount cannot exceed project budget of $${projectData.budget.toLocaleString()} USDC`);
        return;
      }
      
      setSubmitState('signing');
      
      // Submit bid with wallet signature via Trustless Work
      const walletTypeForBid = (wallet.walletType === 'freighter' || wallet.walletType === 'albedo') 
        ? wallet.walletType 
        : 'freighter';
      
      const result = await submitBid(
        {
          escrowId: projectData.escrowId,
          freelancerAddress: wallet.publicKey,
          bidAmount: bidFormData.bidAmount,
          deliveryDays: parseInt(bidFormData.deliveryDays),
          proposal: bidFormData.proposal,
          portfolioLink: bidFormData.portfolioLink,
          milestonesApproach: bidFormData.milestonesApproach,
        },
        walletTypeForBid
      );
      
      setSubmitState('success');
      setTransactionHash(result.bidHash);
      
      toast.success('Bid submitted successfully!', {
        description: 'Your bid has been cryptographically signed and submitted.',
      });
      
      // Refresh bids list
      await fetchEscrowBidsData();
      
      // Reset form and close dialog after 2 seconds
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
      }, 2000);
    } catch (error) {
      setSubmitState('error');
      if (error instanceof TrustlessWorkError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      }
      console.error('Bid submission error:', error);
      
      toast.error('Failed to submit bid', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  }

  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    // Validate fund amount
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid funding amount');
      return;
    }
    
    try {
      setIsFunding(true);
      
      // Check USDC balance
      const balanceInfo = await getAccountBalance(wallet.publicKey);
      const usdcBalance = parseFloat(balanceInfo.usdc);
      
      if (!balanceInfo.hasUSDCTrustline) {
        toast.error('USDC Trustline Required', {
          description: 'Please establish a USDC trustline first. Go to Profile → Deposit to set up.',
        });
        return;
      }
      
      if (usdcBalance < amount) {
        toast.error('Insufficient USDC Balance', {
          description: `You have ${usdcBalance.toFixed(2)} USDC. You need ${amount.toFixed(2)} USDC. Go to Profile → Deposit to add funds.`,
        });
        return;
      }
      
      // Fund the escrow
      const walletTypeForFund = (wallet.walletType === 'freighter' || wallet.walletType === 'albedo') 
        ? wallet.walletType 
        : 'freighter';
      
      const result = await fundEscrow(
        projectData.escrowId,
        fundAmount,
        wallet.publicKey,
        walletTypeForFund
      );
      
      if (result.success) {
        toast.success('Project funded successfully!', {
          description: `You contributed ${amount.toFixed(2)} USDC to this project.`,
        });
        
        // Refresh escrow status and wallet balance
        await refreshEscrowStatus();
        await wallet.refreshBalance();
        
        setFundAmount('');
        setFundDialogOpen(false);
      } else {
        throw new Error('Funding transaction failed');
      }
    } catch (error) {
      console.error('Funding error:', error);
      
      if (error instanceof TrustlessWorkError) {
        toast.error('Funding Failed', {
          description: error.message,
        });
      } else {
        toast.error('Failed to fund project', {
          description: error instanceof Error ? error.message : 'Please try again',
        });
      }
    } finally {
      setIsFunding(false);
    }
  }

  const handleCompleteMilestone = async (milestoneId: string) => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsCompletingMilestone(true);
    setSelectedMilestoneId(parseInt(milestoneId));
    
    try {
      // Release milestone via Trustless Work
      const walletTypeForRelease = (wallet.walletType === 'freighter' || wallet.walletType === 'albedo') 
        ? wallet.walletType 
        : 'freighter';
      
      const result = await releaseMilestone(
        projectData.escrowId,
        milestoneId,
        wallet.publicKey,
        walletTypeForRelease
      );
      
      if (result.success) {
        // Find the milestone to get its budget
        const milestone = escrowStatus?.milestones.find(m => m.id.toString() === milestoneId);
        const milestoneAmount = milestone?.budget || '0';
        
        // Show success with transaction details and explorer link
        const network = STELLAR_CONFIG.network === 'mainnet' ? 'public' : 'testnet';
        const explorerUrl = `https://stellar.expert/explorer/${network}/tx/${result.transactionHash}`;
        
        toast.success('Milestone Completed!', {
          description: `Released ${parseFloat(milestoneAmount).toLocaleString()} USDC to freelancer. View on Stellar Explorer: ${explorerUrl}`,
          duration: 10000,
        });
        
        // Refresh escrow status to show real-time updates
        await refreshEscrowStatus();
        
        // Refresh wallet balance
        await wallet.refreshBalance();
      } else {
        throw new Error('Milestone release failed');
      }
    } catch (error: any) {
      console.error('Failed to complete milestone:', error);
      
      if (error instanceof TrustlessWorkError) {
        toast.error('Failed to complete milestone', {
          description: error.message,
        });
      } else {
        toast.error('Failed to complete milestone', {
          description: error.message || 'Please try again',
        });
      }
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
      // Withdraw released funds via Trustless Work
      const walletTypeForWithdraw = (wallet.walletType === 'freighter' || wallet.walletType === 'albedo') 
        ? wallet.walletType 
        : 'freighter';
      
      const result = await withdrawFunds(
        projectData.escrowId,
        wallet.publicKey,
        walletTypeForWithdraw
      );
      
      if (result.success) {
        // Get the withdrawn amount from escrow status
        const withdrawnAmount = escrowStatus?.availableToWithdraw || '0';
        
        // Show success with transaction details and explorer link
        const network = STELLAR_CONFIG.network === 'mainnet' ? 'public' : 'testnet';
        const explorerUrl = `https://stellar.expert/explorer/${network}/tx/${result.transactionHash}`;
        
        toast.success('Withdrawal Successful!', {
          description: `You withdrew ${parseFloat(withdrawnAmount).toLocaleString()} USDC. View on Stellar Explorer: ${explorerUrl}`,
          duration: 10000,
        });
        
        // Refresh escrow status and wallet balance for real-time updates
        await refreshEscrowStatus();
        await wallet.refreshBalance();
      } else {
        throw new Error('Withdrawal failed');
      }
    } catch (error: any) {
      console.error('Failed to withdraw funds:', error);
      
      if (error instanceof TrustlessWorkError) {
        toast.error('Failed to withdraw funds', {
          description: error.message,
        });
      } else {
        toast.error('Failed to withdraw funds', {
          description: error.message || 'Please try again',
        });
      }
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
      <main className="min-h-screen bg-black relative overflow-hidden py-12">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-[#4ade80]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
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
                    <DollarSign className="h-4 w-4" />${projectData.budget.toLocaleString()} USDC budget
                  </span>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
                  <h2 className="text-2xl font-bold mb-4 text-white">Project Description</h2>
                  <p className="text-gray-300 leading-relaxed mb-6">{projectData.description}</p>

                  <h3 className="font-semibold mb-3 text-white">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {projectData.skills.map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm text-white">
                        {skill}
                      </span>
                    ))}
                  </div>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
                  <Tabs defaultValue="milestones" className="w-full" onValueChange={(value) => {
                    if (value === 'bids' && escrowBids.length === 0) {
                      fetchEscrowBidsData();
                    }
                  }}>
                    <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10">
                      <TabsTrigger value="milestones">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Milestones
                      </TabsTrigger>
                      <TabsTrigger value="escrow">
                        <Shield className="h-4 w-4 mr-2" />
                        Escrow
                      </TabsTrigger>
                      <TabsTrigger value="bids">
                        <Users className="h-4 w-4 mr-2" />
                        Bids
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
                        <h2 className="text-2xl font-bold text-white">Project Milestones</h2>
                        {wallet.connected && escrowStatus && wallet.publicKey === escrowStatus.clientAddress && (
                          <Badge variant="outline" className="border-[#4ade80]/30 bg-[#4ade80]/10 text-[#4ade80]">You are the Client</Badge>
                        )}
                      </div>
                      
                      {loadingEscrow ? (
                        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            <span className="ml-3 text-gray-300">Loading milestones...</span>
                          </div>
                        </Card>
                      ) : escrowStatus && escrowStatus.milestones.length > 0 ? (
                        <div className="space-y-4">
                          {escrowStatus.milestones.map((milestone, index) => (
                            <div key={milestone.id} className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                              <div
                                className={`mt-1 ${
                                  milestone.status === "completed" || milestone.status === "approved"
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
                                  <span className="text-sm font-semibold">${parseFloat(milestone.budget).toLocaleString()} USDC</span>
                                </div>
                                {milestone.description && (
                                  <p className="text-sm text-muted mb-2">{milestone.description}</p>
                                )}
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    milestone.status === "completed" || milestone.status === "approved"
                                      ? "bg-[#4ade80]/10 text-[#22c55e]"
                                      : milestone.status === "in-progress"
                                        ? "bg-[#fbbf24]/10 text-[#fbbf24]"
                                        : "bg-surface text-muted"
                                  }`}
                                >
                                  {milestone.status.replace("-", " ")}
                                </span>
                                {milestone.completedAt && (
                                  <p className="text-xs text-muted mt-1">
                                    Completed: {new Date(milestone.completedAt).toLocaleDateString()}
                                  </p>
                                )}
                                {milestone.status === "in-progress" && wallet.connected && escrowStatus.clientAddress === wallet.publicKey && (
                                  <div className="mt-3">
                                    <Button
                                      size="sm"
                                      onClick={() => handleCompleteMilestone(milestone.id.toString())}
                                      disabled={isCompletingMilestone}
                                      className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
                                    >
                                      {isCompletingMilestone && selectedMilestoneId === index ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Releasing Funds...
                                        </>
                                      ) : (
                                        'Mark as Complete & Release Funds'
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No milestones defined for this project yet.
                          </AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>

                    {/* Escrow Tab */}
                    <TabsContent value="escrow" className="space-y-4 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Escrow Contract</h2>
                        {loadingEscrow ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : escrowStatus ? (
                          <Badge 
                            variant="outline" 
                            className={
                              escrowStatus.status === 'active' 
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                : escrowStatus.status === 'completed'
                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                : escrowStatus.status === 'disputed'
                                ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                            }
                          >
                            {escrowStatus.status.charAt(0).toUpperCase() + escrowStatus.status.slice(1)}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Unknown</Badge>
                        )}
                      </div>

                      {loadingEscrow ? (
                        <Card className="bg-surface-dark p-6">
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted" />
                            <span className="ml-3 text-muted">Loading escrow details...</span>
                          </div>
                        </Card>
                      ) : escrowStatus ? (
                        <>
                          {/* Escrow Progress */}
                          <Card className="bg-surface-dark">
                            <div className="p-6 space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted">Released</span>
                                  <span className="font-semibold">
                                    ${parseFloat(escrowStatus.releasedAmount).toLocaleString()} / ${parseFloat(escrowStatus.totalAmount).toLocaleString()} USDC
                                  </span>
                                </div>
                                <Progress 
                                  value={(parseFloat(escrowStatus.releasedAmount) / parseFloat(escrowStatus.totalAmount)) * 100} 
                                  className="h-3" 
                                />
                                <div className="flex justify-between text-xs text-muted">
                                  <span>
                                    {((parseFloat(escrowStatus.releasedAmount) / parseFloat(escrowStatus.totalAmount)) * 100).toFixed(1)}% completed
                                  </span>
                                  <span>Milestone-based release</span>
                                </div>
                              </div>
                              
                              {escrowStatus.yieldGenerated && escrowStatus.yieldGenerated > 0 && (
                                <div className="pt-3 border-t border-border">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4" />
                                      Yield Generated
                                    </span>
                                    <span className="font-semibold text-[#22c55e]">
                                      +${escrowStatus.yieldGenerated.toFixed(2)} USDC
                                    </span>
                                  </div>
                                </div>
                              )}
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
                                  {escrowStatus.contractAddress.slice(0, 12)}...{escrowStatus.contractAddress.slice(-12)}
                                </p>
                                <a
                                  href={`https://stellar.expert/explorer/testnet/contract/${escrowStatus.contractAddress}`}
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
                                  ${parseFloat(escrowStatus.availableToWithdraw).toLocaleString()} USDC
                                </p>
                                {parseFloat(escrowStatus.availableToWithdraw) > 0 && wallet.connected && (
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

                          {/* Escrow Participants */}
                          <Card className="bg-surface-dark">
                            <div className="p-4 space-y-3">
                              <h3 className="font-semibold">Participants</h3>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted">Client</span>
                                  <span className="font-mono text-xs">
                                    {escrowStatus.clientAddress.slice(0, 8)}...{escrowStatus.clientAddress.slice(-8)}
                                  </span>
                                </div>
                                {escrowStatus.freelancerAddress && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted">Freelancer</span>
                                    <span className="font-mono text-xs">
                                      {escrowStatus.freelancerAddress.slice(0, 8)}...{escrowStatus.freelancerAddress.slice(-8)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        </>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Unable to load escrow details. Please try refreshing the page.
                          </AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>

                    {/* Bids Tab */}
                    <TabsContent value="bids" className="space-y-4 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Submitted Bids</h2>
                        <Badge variant="outline">{escrowBids.length} bids</Badge>
                      </div>

                      {loadingBids ? (
                        <Card className="bg-surface-dark p-6">
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted" />
                            <span className="ml-3 text-muted">Loading bids...</span>
                          </div>
                        </Card>
                      ) : escrowBids.length > 0 ? (
                        <div className="space-y-4">
                          {escrowBids.map((bid, index) => (
                            <Card key={bid.hash} className="bg-surface-dark">
                              <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                      <div className="w-full h-full bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center text-white font-bold">
                                        {bid.freelancerAddress.slice(0, 2).toUpperCase()}
                                      </div>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold">Freelancer</p>
                                      <p className="text-xs font-mono text-muted">
                                        {bid.freelancerAddress.slice(0, 8)}...{bid.freelancerAddress.slice(-8)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-[#22c55e]">
                                      ${parseFloat(bid.bidAmount).toLocaleString()} USDC
                                    </p>
                                    <p className="text-sm text-muted">{bid.deliveryDays} days delivery</p>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2">Proposal</h4>
                                    <p className="text-sm text-muted">{bid.proposal}</p>
                                  </div>

                                  {bid.portfolioLink && (
                                    <div>
                                      <h4 className="font-semibold text-sm mb-1">Portfolio</h4>
                                      <a 
                                        href={bid.portfolioLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-[#22c55e] hover:text-[#4ade80] flex items-center gap-1"
                                      >
                                        {bid.portfolioLink} <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </div>
                                  )}

                                  {bid.milestonesApproach && (
                                    <div>
                                      <h4 className="font-semibold text-sm mb-2">Milestone Approach</h4>
                                      <p className="text-sm text-muted">{bid.milestonesApproach}</p>
                                    </div>
                                  )}

                                  <Separator />

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {bid.verified ? (
                                        <>
                                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                                          <span className="text-sm text-green-500">Verified Signature</span>
                                        </>
                                      ) : (
                                        <>
                                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                                          <span className="text-sm text-yellow-500">Unverified</span>
                                        </>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted">
                                      Submitted: {new Date(bid.timestamp).toLocaleDateString()}
                                    </p>
                                  </div>

                                  {wallet.connected && escrowStatus && wallet.publicKey === escrowStatus.clientAddress && bid.verified && (
                                    <Button
                                      size="sm"
                                      className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white"
                                      onClick={() => {
                                        toast.info('Accept Bid', {
                                          description: 'Bid acceptance feature coming soon!',
                                        });
                                      }}
                                    >
                                      Accept Bid
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="bg-surface-dark p-12">
                          <div className="text-center">
                            <Users className="h-12 w-12 text-muted mx-auto mb-4" />
                            <h3 className="font-semibold mb-2">No Bids Yet</h3>
                            <p className="text-sm text-muted mb-4">
                              Be the first to submit a bid for this project!
                            </p>
                            <Button
                              onClick={() => setBidDialogOpen(true)}
                              className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
                            >
                              Place a Bid
                            </Button>
                          </div>
                        </Card>
                      )}
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
                                    ${(parseFloat(projectData.poolRaised) / projectData.poolContributors).toFixed(0)} USDC
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
                                  <div className="space-y-1">
                                    <p className="text-sm text-muted">
                                      Available balance: {parseFloat(wallet.usdcBalance).toFixed(2)} USDC
                                    </p>
                                    {fiatBalance.hasPendingTransactions && parseFloat(fiatBalance.pendingOnRampAmount) > 0 && (
                                      <p className="text-xs text-yellow-500">
                                        +{fiatBalance.pendingOnRampAmount} USDC pending deposit
                                      </p>
                                    )}
                                  </div>
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
                <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
                  <h2 className="text-2xl font-bold mb-4 text-white">Top Bids</h2>
                  <div className="space-y-4">
                    {projectData.topBids.map((bid) => (
                      <div key={bid.id} className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
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
                          <p className="font-bold text-lg">${bid.amount.toLocaleString()} USDC</p>
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
                <Card className="p-6 sticky top-24 bg-white/5 backdrop-blur-sm border-white/10">
                  <h3 className="font-bold text-lg mb-4 text-white">Funding Progress</h3>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#4ade80]">${projectData.funded.toLocaleString()} USDC</span>
                      <span className="text-gray-400">of ${projectData.budget.toLocaleString()} USDC</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${fundedPercentage}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-linear-to-r from-[#4ade80] to-cyan-400 rounded-full"
                      />
                    </div>
                    <p className="text-sm text-gray-400">{fundedPercentage.toFixed(0)}% funded</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
                      <DialogTrigger asChild>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button className="w-full bg-linear-to-r from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#4ade80] text-white shadow-lg shadow-[#4ade80]/50" size="lg">
                            Place a Bid
                          </Button>
                        </motion.div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Submit Your Bid</DialogTitle>
                          <DialogDescription>
                            Provide details about your proposal and how you'll deliver this project
                          </DialogDescription>
                        </DialogHeader>

                        {!wallet.connected ? (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Please connect your wallet to submit a bid. Your bid will be cryptographically signed for verification.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <form onSubmit={handleBidSubmit} className="space-y-4 mt-4">
                            {submitState === 'error' && errorMessage && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{errorMessage}</AlertDescription>
                              </Alert>
                            )}
                            
                            {submitState === 'success' && (
                              <Alert className="bg-green-500/10 border-green-500/20">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <AlertDescription className="text-green-500">
                                  Bid submitted successfully! Your bid has been cryptographically signed.
                                </AlertDescription>
                              </Alert>
                            )}
                            
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="bid-amount">Bid Amount (USDC) *</Label>
                                <div className="relative mt-2">
                                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                  <Input 
                                    id="bid-amount" 
                                    type="number" 
                                    step="0.01"
                                    placeholder="4500.00" 
                                    required 
                                    className="pl-9"
                                    value={bidFormData.bidAmount}
                                    onChange={(e) => setBidFormData({...bidFormData, bidAmount: e.target.value})}
                                    disabled={isSubmitting}
                                  />
                                </div>
                                <p className="text-xs text-muted mt-1">
                                  Project budget: ${projectData.budget.toLocaleString()} USDC
                                </p>
                              </div>

                              <div>
                                <Label htmlFor="delivery-time">Delivery Time (days) *</Label>
                                <div className="relative mt-2">
                                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                  <Input 
                                    id="delivery-time" 
                                    type="number" 
                                    placeholder="30" 
                                    required 
                                    className="pl-9"
                                    value={bidFormData.deliveryDays}
                                    onChange={(e) => setBidFormData({...bidFormData, deliveryDays: e.target.value})}
                                    disabled={isSubmitting}
                                  />
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
                                value={bidFormData.proposal}
                                onChange={(e) => setBidFormData({...bidFormData, proposal: e.target.value})}
                                disabled={isSubmitting}
                              />
                            </div>

                            <div>
                              <Label htmlFor="portfolio">Portfolio Links</Label>
                              <Input 
                                id="portfolio" 
                                type="url" 
                                placeholder="https://yourportfolio.com" 
                                className="mt-2"
                                value={bidFormData.portfolioLink}
                                onChange={(e) => setBidFormData({...bidFormData, portfolioLink: e.target.value})}
                                disabled={isSubmitting}
                              />
                            </div>

                            <div>
                              <Label htmlFor="milestones-approach">Milestone Approach</Label>
                              <Textarea
                                id="milestones-approach"
                                placeholder="How will you tackle each milestone? What's your timeline for each phase?"
                                className="mt-2 min-h-24"
                                value={bidFormData.milestonesApproach}
                                onChange={(e) => setBidFormData({...bidFormData, milestonesApproach: e.target.value})}
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="bg-surface-dark p-4 rounded-lg">
                              <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                <Shield className="h-4 w-4 text-[#4ade80]" />
                                Cryptographic Verification
                              </h4>
                              <p className="text-sm text-muted">
                                Your bid will be signed with your wallet to prove authenticity. This ensures your proposal cannot be tampered with.
                              </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                              <Button 
                                type="submit" 
                                className="flex-1 bg-[#4ade80] hover:bg-[#22c55e] text-white"
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {submitState === 'validating' && 'Validating...'}
                                    {submitState === 'signing' && 'Signing with wallet...'}
                                    {submitState === 'submitting' && 'Submitting...'}
                                  </>
                                ) : (
                                  'Submit Bid'
                                )}
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setBidDialogOpen(false)}
                                disabled={isSubmitting}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm" variant="outline" size="lg">
                          Fund This Project
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Fund This Project</DialogTitle>
                          <DialogDescription>
                            Invest in this project and help bring it to life. Funds are held in secure USDC escrow.
                          </DialogDescription>
                        </DialogHeader>

                        {!wallet.connected ? (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Please connect your wallet to fund this project.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <form onSubmit={handleFundSubmit} className="space-y-4 mt-4">
                            <div>
                              <Label htmlFor="fund-amount">Funding Amount (USDC) *</Label>
                              <div className="relative mt-2">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                <Input 
                                  id="fund-amount" 
                                  type="number" 
                                  step="0.01"
                                  placeholder="500.00" 
                                  required 
                                  className="pl-9"
                                  value={fundAmount}
                                  onChange={(e) => setFundAmount(e.target.value)}
                                />
                              </div>
                              {escrowStatus && (
                                <p className="text-xs text-muted mt-2">
                                  Total funded: ${parseFloat(escrowStatus.releasedAmount).toLocaleString()} / ${parseFloat(escrowStatus.totalAmount).toLocaleString()} USDC
                                </p>
                              )}
                              {wallet.usdcBalance && (
                                <p className="text-xs text-muted mt-1">
                                  Your balance: {parseFloat(wallet.usdcBalance).toFixed(2)} USDC
                                </p>
                              )}
                            </div>

                            <div className="bg-surface-dark p-4 rounded-lg">
                              <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                <Shield className="h-4 w-4 text-[#4ade80]" />
                                Escrow Protection
                              </h4>
                              <ul className="text-sm text-muted space-y-1">
                                <li>• Funds held in Trustless Work USDC escrow</li>
                                <li>• Released only upon milestone completion</li>
                                <li>• Full transparency on Stellar blockchain</li>
                                <li>• Dispute resolution available if needed</li>
                              </ul>
                            </div>

                            <div className="flex gap-3 pt-4">
                              <Button 
                                type="submit" 
                                className="flex-1 bg-[#4ade80] hover:bg-[#22c55e] text-white"
                                disabled={isFunding || !fundAmount}
                              >
                                {isFunding ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  'Confirm Funding'
                                )}
                              </Button>
                              <Button type="button" variant="outline" onClick={() => setFundDialogOpen(false)}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <h4 className="font-semibold mb-3 text-white">Posted by</h4>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <img src={projectData.client.avatar || "/placeholder.svg"} alt={projectData.client.name} />
                      </Avatar>
                      <div>
                        <p className="font-semibold text-white">{projectData.client.name}</p>
                        <p className="text-sm text-gray-400">⭐ {projectData.client.rating} rating</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{projectData.client.projectsPosted} projects posted</p>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
  )
}
