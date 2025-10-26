'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { useWalletKit } from '@/hooks/use-wallet-kit';
import { AnchorRegistry, type AnchorProvider } from '@/lib/stellar/services/anchor-registry';
import { OnRampFlow } from '@/components/fiat-gateway/on-ramp-flow';
import { OffRampFlow } from '@/components/fiat-gateway/off-ramp-flow';
import { TransactionHistory } from '@/components/fiat-gateway/transaction-history';
import { AnchorSelector } from '@/components/fiat-gateway/anchor-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Wallet,
  Settings,
  Info,
  Camera,
  Star,
  Briefcase,
  DollarSign,
  Award,
  User,
  Clock,
  Calendar,
  Shield,
  CheckCircle,
  ExternalLink,
  FileText,
  TrendingUp,
  Target,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import type { FiatTransaction } from '@/lib/stellar/types/fiat-gateway';
import { StellarErrorBoundary } from '@/components/stellar/error-boundary';

// Mock profile data
const profileData = {
  name: "Alex Johnson",
  email: "alex@example.com",
  bio: "Full-stack developer with 8+ years of experience in React, Node.js, and blockchain technologies. Passionate about building decentralized applications and helping startups bring their ideas to life.",
  location: "San Francisco, CA",
  website: "https://alexjohnson.dev",
  avatar: "/programmer.png",
  rating: 4.8,
  totalReviews: 24,
  skills: ["React", "Node.js", "Blockchain", "Smart Contracts", "TypeScript", "Python", "AWS"],
  stats: {
    projectsCompleted: 8,
    totalEarned: 12500,
    successRate: 95,
  },
  portfolio: [
    {
      id: 1,
      title: "DeFi Trading Platform",
      description: "Built a decentralized trading platform with smart contract integration",
      image: "/defi-trading-platform.jpg",
    },
    {
      id: 2,
      title: "E-commerce Mobile App",
      description: "React Native app with payment processing and real-time inventory",
      image: "/ecommerce-mobile-app.png",
    },
    {
      id: 3,
      title: "AI Content Generator",
      description: "Full-stack application using GPT-4 for automated content creation",
      image: "/ai-content-generator.png",
    },
  ],
};

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

function DashboardContent() {
  const wallet = useWalletKit();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedAnchor, setSelectedAnchor] = React.useState<AnchorProvider | null>(null);
  const [showAnchorSelector, setShowAnchorSelector] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('profile');
  const [transactions, setTransactions] = React.useState<FiatTransaction[]>([]);

  const totalInvested = myInvestments.reduce((sum, inv) => sum + inv.amountInvested, 0);
  const totalEarned = myBids
    .filter((bid) => bid.escrowReleasedAmount)
    .reduce((sum, bid) => sum + (bid.escrowReleasedAmount || 0), 0);
  const activeBids = myBids.filter((bid) => bid.status === 'accepted').length;
  const activeInvestments = myInvestments.filter((inv) => inv.status === 'active').length;

  // Handle URL query parameters for tab navigation
  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'bids', 'investments', 'deposit', 'withdraw', 'history', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.push(`/dashboard?tab=${newTab}`, { scroll: false });
  };

  // Load preferred anchor on mount
  React.useEffect(() => {
    if (wallet.publicKey) {
      const preferred = AnchorRegistry.getPreferredAnchor(wallet.publicKey);
      if (preferred) {
        setSelectedAnchor(preferred);
      } else {
        const anchors = AnchorRegistry.getAvailableAnchors();
        if (anchors.length > 0) {
          setSelectedAnchor(anchors[0]);
        }
      }
    }
  }, [wallet.publicKey]);

  // Load transaction history from localStorage
  React.useEffect(() => {
    if (wallet.publicKey) {
      try {
        const stored = localStorage.getItem(`fiat-transactions-${wallet.publicKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setTransactions(parsed);
        }
      } catch (error) {
        console.error('Failed to load transaction history:', error);
      }
    }
  }, [wallet.publicKey]);

  const handleAnchorSelect = (anchor: AnchorProvider) => {
    setSelectedAnchor(anchor);
    setShowAnchorSelector(false);
    toast.success(`Selected ${anchor.name} as your anchor provider`);
  };

  const handleTransactionComplete = (transactionId: string, type: 'on-ramp' | 'off-ramp') => {
    toast.success(
      type === 'on-ramp' 
        ? 'Deposit completed successfully!' 
        : 'Withdrawal initiated successfully!'
    );

    setActiveTab('history');

    if (wallet.publicKey) {
      try {
        const stored = localStorage.getItem(`fiat-transactions-${wallet.publicKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setTransactions(parsed);
        }
      } catch (error) {
        console.error('Failed to reload transaction history:', error);
      }
    }
  };

  const handleTransactionError = (error: string, type: 'on-ramp' | 'off-ramp') => {
    toast.error(
      type === 'on-ramp' 
        ? `Deposit failed: ${error}` 
        : `Withdrawal failed: ${error}`
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    toast.success('Profile updated successfully');
  };

  return (
    <main className="min-h-screen bg-black relative overflow-hidden py-12">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-[#4ade80]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-300 text-lg mt-1">Manage your profile, bids, and investments</p>
          </div>

          {/* Prominent USDC Balance Display */}
          {wallet.connected && wallet.publicKey && (
            <Card className="border-[#4ade80]/30 bg-linear-to-br from-[#4ade80]/10 to-purple-600/10 backdrop-blur-sm">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Wallet Address</p>
                    <p className="text-sm font-mono text-white">
                      {wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-8)}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm text-gray-400">Available Balance</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-[#4ade80]">
                        ${wallet.usdcBalance ? parseFloat(wallet.usdcBalance).toFixed(2) : '0.00'}
                      </p>
                      <span className="text-lg font-semibold text-[#4ade80]">USDC</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {wallet.balance ? parseFloat(wallet.balance).toFixed(2) : '0.00'} XLM
                    </p>
                  </div>
            </div>
              </CardContent>
            </Card>
          )}
          </motion.div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} whileHover={{ y: -5, scale: 1.05 }}>
            <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10 hover:border-[#4ade80]/50 transition-all">
                <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center shadow-lg shadow-[#4ade80]/30">
                  <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  <div>
                  <p className="text-sm text-gray-400">Active Bids</p>
                  <p className="text-2xl font-bold text-white">{activeBids}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} whileHover={{ y: -5, scale: 1.05 }}>
            <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10 hover:border-blue-500/50 transition-all">
                <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                  <p className="text-sm text-gray-400">Total Earned</p>
                  <p className="text-2xl font-bold text-white">${totalEarned.toLocaleString()} USDC</p>
                  </div>
                </div>
              </Card>
            </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} whileHover={{ y: -5, scale: 1.05 }}>
            <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10 hover:border-purple-500/50 transition-all">
                <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                  <p className="text-sm text-gray-400">Investments</p>
                  <p className="text-2xl font-bold text-white">{activeInvestments}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} whileHover={{ y: -5, scale: 1.05 }}>
            <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10 hover:border-amber-500/50 transition-all">
                <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                  <p className="text-sm text-gray-400">Total Invested</p>
                  <p className="text-2xl font-bold text-white">${totalInvested.toLocaleString()} USDC</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex w-auto min-w-full bg-white/5 border border-white/10">
                <TabsTrigger value="profile" className="gap-2 text-white data-[state=active]:bg-[#4ade80] data-[state=active]:text-white">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="bids" className="gap-2 text-white data-[state=active]:bg-[#4ade80] data-[state=active]:text-white">
                <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">My Bids</span>
              </TabsTrigger>
                <TabsTrigger value="investments" className="gap-2 text-white data-[state=active]:bg-[#4ade80] data-[state=active]:text-white">
                <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Investments</span>
                </TabsTrigger>
                <TabsTrigger value="deposit" className="gap-2 text-white data-[state=active]:bg-[#4ade80] data-[state=active]:text-white" disabled={!wallet.connected}>
                  <ArrowDownToLine className="h-4 w-4" />
                  <span className="hidden sm:inline">Deposit</span>
              </TabsTrigger>
                <TabsTrigger value="withdraw" className="gap-2 text-white data-[state=active]:bg-[#4ade80] data-[state=active]:text-white" disabled={!wallet.connected}>
                  <ArrowUpFromLine className="h-4 w-4" />
                  <span className="hidden sm:inline">Withdraw</span>
                            </TabsTrigger>
                <TabsTrigger value="history" className="gap-2 text-white data-[state=active]:bg-[#4ade80] data-[state=active]:text-white" disabled={!wallet.connected}>
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                            </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2 text-white data-[state=active]:bg-[#4ade80] data-[state=active]:text-white" disabled={!wallet.connected}>
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
                              </div>

            {!wallet.connected && activeTab !== 'profile' && activeTab !== 'bids' && activeTab !== 'investments' && (
              <Alert className="bg-white/5 border-white/10 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4 text-[#4ade80]" />
                <AlertTitle className="text-white">Wallet Connection Required</AlertTitle>
                <AlertDescription className="text-gray-400">
                  Please connect your Stellar wallet to access deposit, withdraw, and transaction features.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>

          {/* Profile Tab - Content from profile page */}
          <TabsContent value="profile" className="space-y-6">
            {/* Profile card and other profile content will go here - I'll add this in the next part */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <Avatar className="h-32 w-32">
                        <img src={profileData.avatar || "/placeholder.svg"} alt={profileData.name} />
                      </Avatar>
                      {isEditing && (
                        <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#4ade80] flex items-center justify-center text-white hover:bg-[#22c55e] transition-colors">
                          <Camera className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    <div className="mt-4 text-center">
                      <div className="flex items-center gap-2 justify-center mb-2">
                        <Star className="h-5 w-5 text-[#fbbf24] fill-[#fbbf24]" />
                        <span className="font-bold text-lg text-white">{profileData.rating}</span>
                        <span className="text-gray-400 text-sm">({profileData.totalReviews} reviews)</span>
                      </div>
                            </div>
                          </div>

                  <div className="flex-1">
                    {isEditing ? (
                      <form className="space-y-4" onSubmit={handleSave}>
                          <div>
                          <Label htmlFor="name" className="text-white">Full Name</Label>
                          <Input id="name" defaultValue={profileData.name} className="mt-2 bg-white/5 border-white/10 text-white" />
                            </div>
                        <div>
                          <Label htmlFor="email" className="text-white">Email</Label>
                          <Input id="email" type="email" defaultValue={profileData.email} className="mt-2 bg-white/5 border-white/10 text-white" />
                            </div>
                            <div>
                          <Label htmlFor="location" className="text-white">Location</Label>
                          <Input id="location" defaultValue={profileData.location} className="mt-2 bg-white/5 border-white/10 text-white" />
                            </div>
                              <div>
                          <Label htmlFor="website" className="text-white">Website</Label>
                          <Input id="website" type="url" defaultValue={profileData.website} className="mt-2 bg-white/5 border-white/10 text-white" />
                              </div>
                              <div>
                          <Label htmlFor="bio" className="text-white">Bio</Label>
                          <Textarea id="bio" defaultValue={profileData.bio} className="mt-2 min-h-24 bg-white/5 border-white/10 text-white" />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button type="submit" className="bg-[#4ade80] hover:bg-[#22c55e] text-white">
                            Save Changes
                          </Button>
                          <Button type="button" onClick={() => setIsEditing(false)} variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white">
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-3xl font-bold text-white">{profileData.name}</h2>
                          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm">
                            Edit Profile
                          </Button>
                        </div>
                        <p className="text-gray-400 mb-4">{profileData.email}</p>
                        <p className="text-gray-300 leading-relaxed mb-4">{profileData.bio}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          <span>📍 {profileData.location}</span>
                          <span>
                            🌐{" "}
                            <a href={profileData.website} className="text-[#4ade80] hover:underline">
                              {profileData.website}
                            </a>
                          </span>
                              </div>
                            </div>
                            )}
                          </div>
                </div>
              </Card>
            </motion.div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} whileHover={{ y: -5, scale: 1.05 }}>
                <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10 hover:border-[#4ade80]/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center shadow-lg shadow-[#4ade80]/30">
                      <Briefcase className="h-6 w-6 text-white" />
                              </div>
                              <div>
                      <p className="text-sm text-gray-400">Projects Completed</p>
                      <p className="text-2xl font-bold text-white">{profileData.stats.projectsCompleted}</p>
                                </div>
                              </div>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} whileHover={{ y: -5, scale: 1.05 }}>
                <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10 hover:border-blue-500/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <DollarSign className="h-6 w-6 text-white" />
                                </div>
                                <div>
                      <p className="text-sm text-gray-400">Total Earned</p>
                      <p className="text-2xl font-bold text-white">${profileData.stats.totalEarned.toLocaleString()} USDC</p>
                                </div>
                              </div>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} whileHover={{ y: -5, scale: 1.05 }}>
                <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10 hover:border-amber-500/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <Award className="h-6 w-6 text-white" />
                            </div>
                    <div>
                      <p className="text-sm text-gray-400">Success Rate</p>
                      <p className="text-2xl font-bold text-white">{profileData.stats.successRate}%</p>
                    </div>
                    </div>
                  </Card>
                </motion.div>
            </div>

            {/* Skills */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
                <h2 className="text-2xl font-bold mb-4 text-white">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill) => (
                    <Badge key={skill} className="bg-[#4ade80]/20 text-[#4ade80] hover:bg-[#4ade80]/30 px-4 py-2 border border-[#4ade80]/30">
                      {skill}
                    </Badge>
                  ))}
                  {isEditing && (
                    <Button variant="outline" size="sm" className="border-white/20 bg-white/5 hover:bg-white/10 text-white">
                      + Add Skill
                  </Button>
                  )}
                </div>
              </Card>
                </motion.div>

            {/* Portfolio */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Portfolio</h2>
                  {isEditing && (
                    <Button variant="outline" size="sm" className="border-white/20 bg-white/5 hover:bg-white/10 text-white">
                      + Add Project
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profileData.portfolio.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="group cursor-pointer"
                    >
                      <div className="relative overflow-hidden rounded-lg mb-3">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.title}
                          className="w-full h-48 object-cover transition-transform group-hover:scale-110 duration-500"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                      </div>
                      <h3 className="font-semibold mb-1 text-white">{item.title}</h3>
                      <p className="text-sm text-gray-400">{item.description}</p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
            </TabsContent>

          {/* My Bids Tab */}
            <TabsContent value="bids" className="space-y-4">
              {myBids.map((bid, index) => (
                <motion.div
                  key={bid.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10 hover:border-[#4ade80]/50 hover:shadow-2xl hover:shadow-[#4ade80]/10 transition-all">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-lg text-white">{bid.projectTitle}</h3>
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
                      <Button variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm" size="sm" asChild>
                          <Link href={`/project/${bid.projectId}`}>View Project</Link>
                        </Button>
                      </div>

                      {(bid.status === 'pending' || bid.status === 'rejected') && (
                        <div className="space-y-3">
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-[#4ade80]" />
                              Bid: ${bid.bidAmount.toLocaleString()} USDC
                            </span>
                            <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-[#4ade80]" />
                              {bid.deliveryDays} days
                            </span>
                            <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-[#4ade80]" />
                              Submitted {new Date(bid.submittedDate).toLocaleDateString()}
                            </span>
                            <span>Competing with {bid.totalBids - 1} other bids</span>
                          </div>
                        </div>
                      )}

                      {bid.status === 'accepted' && bid.escrowId && (
                        <Tabs defaultValue="milestones" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
                          <TabsTrigger value="milestones" className="data-[state=active]:bg-[#4ade80] data-[state=active]:text-white">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Milestones
                            </TabsTrigger>
                          <TabsTrigger value="escrow" className="data-[state=active]:bg-[#4ade80] data-[state=active]:text-white">
                              <Shield className="h-4 w-4 mr-2" />
                              Escrow
                            </TabsTrigger>
                          <TabsTrigger value="payments" className="data-[state=active]:bg-[#4ade80] data-[state=active]:text-white">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Payments
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="milestones" className="space-y-4 mt-4">
                            <div className="space-y-3">
                              {bid.milestones?.map((milestone) => (
                              <div key={milestone.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
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
                                      <h4 className="font-semibold text-white">{milestone.title}</h4>
                                      <span className="text-sm font-semibold text-white">${milestone.amount.toLocaleString()} USDC</span>
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
                                      <p className="text-xs text-gray-400 mt-2">Completed {new Date(milestone.completedAt).toLocaleDateString()}</p>
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
                                <span className="text-gray-400">Funds Released</span>
                                <span className="font-semibold text-white">
                                    ${bid.escrowReleasedAmount?.toLocaleString()} USDC / ${bid.escrowTotalAmount?.toLocaleString()} USDC
                                  </span>
                                </div>
                                <Progress value={((bid.escrowReleasedAmount || 0) / (bid.escrowTotalAmount || 1)) * 100} className="h-3" />
                              </div>

                            <Separator className="bg-white/10" />

                              <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                <p className="text-sm text-gray-400 mb-1">Total Contract</p>
                                <p className="text-xl font-bold text-white">${bid.escrowTotalAmount?.toLocaleString()} USDC</p>
                                </div>
                              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                <p className="text-sm text-gray-400 mb-1">Available to Withdraw</p>
                                  <p className="text-xl font-bold text-[#22c55e]">${bid.escrowReleasedAmount?.toLocaleString()} USDC</p>
                                </div>
                              </div>

                              {(bid.escrowReleasedAmount || 0) > 0 && (
                                <Alert className="border-blue-500/50 bg-blue-500/10">
                                  <Wallet className="h-4 w-4 text-blue-500" />
                                <AlertDescription className="text-sm text-gray-300">
                                    <div className="flex items-center justify-between">
                                      <span>You have ${bid.escrowReleasedAmount?.toLocaleString()} USDC available to withdraw</span>
                                    <Button variant="outline" size="sm" className="border-white/20 bg-white/5 hover:bg-white/10 text-white" asChild>
                                        <Link href={`/project/${bid.projectId}`}>
                                          Withdraw <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                      </Button>
                                    </div>
                                  </AlertDescription>
                                </Alert>
                              )}

                              <Alert className="border-[#4ade80]/50 bg-[#4ade80]/10">
                                <Shield className="h-4 w-4 text-[#22c55e]" />
                              <AlertDescription className="text-sm text-gray-300">
                                Your funds are secured in a smart contract. Payments are released automatically as milestones are completed.
                                </AlertDescription>
                              </Alert>
                            </div>
                          </TabsContent>

                          <TabsContent value="payments" className="space-y-4 mt-4">
                            <div className="space-y-3">
                            <h4 className="font-semibold text-white">Payment History</h4>
                              {bid.paymentHistory && bid.paymentHistory.length > 0 ? (
                                <div className="space-y-3">
                                  {bid.paymentHistory.map((payment, idx) => (
                                  <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                      <div className="mt-1">
                                        <DollarSign className="h-4 w-4 text-green-500" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium text-white">{payment.milestone}</p>
                                          <span className="text-sm font-semibold text-[#22c55e]">+${payment.amount.toLocaleString()} USDC</span>
                                        </div>
                                      <p className="text-xs text-gray-400 mb-2">
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
                              <div className="text-center py-8 text-gray-400">
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
                <p className="text-gray-300 text-lg mb-4">You haven't placed any bids yet</p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-linear-to-r from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#4ade80] text-white shadow-lg shadow-[#4ade80]/50" asChild>
                    <Link href="/browse">Browse Projects</Link>
                  </Button>
                </motion.div>
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
                <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-lg text-white">{investment.projectTitle}</h3>
                          <Badge className={statusColors[investment.status as keyof typeof statusColors]}>
                            {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                          </Badge>
                        </div>
                      <Button variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm" size="sm" asChild>
                          <Link href={`/project/${investment.projectId}`}>
                            View Project <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>

                      <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-[#4ade80] data-[state=active]:text-white">Overview</TabsTrigger>
                        <TabsTrigger value="pool" className="data-[state=active]:bg-[#4ade80] data-[state=active]:text-white">
                            <Target className="h-4 w-4 mr-2" />
                            Pool
                          </TabsTrigger>
                        <TabsTrigger value="escrow" disabled={!investment.escrowId} className="data-[state=active]:bg-[#4ade80] data-[state=active]:text-white">
                            <Shield className="h-4 w-4 mr-2" />
                            Escrow
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4 mt-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                            <p className="text-sm text-gray-400 mb-1">Your Investment</p>
                              <p className="text-xl font-bold text-[#22c55e]">${investment.amountInvested.toLocaleString()} USDC</p>
                            </div>
                            <div>
                            <p className="text-sm text-gray-400 mb-1">Expected Return</p>
                            <p className="text-sm font-semibold text-white">{investment.expectedReturn}</p>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-400">Project Funding Progress</span>
                            <span className="font-semibold text-white">
                                ${investment.currentFunding.toLocaleString()} USDC / ${investment.totalBudget.toLocaleString()} USDC
                              </span>
                            </div>
                            <Progress value={investment.progress} className="h-2" />
                          </div>

                        <p className="text-sm text-gray-400">Invested on {new Date(investment.investedDate).toLocaleDateString()}</p>
                        </TabsContent>

                        <TabsContent value="pool" className="space-y-4 mt-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Pool Status</span>
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
                              <span className="text-gray-400">Pool Progress</span>
                              <span className="font-semibold text-white">
                                  ${investment.poolRaised.toLocaleString()} USDC / ${investment.poolGoal.toLocaleString()} USDC
                                </span>
                              </div>
                              <Progress value={(investment.poolRaised / investment.poolGoal) * 100} className="h-2" />
                            </div>

                          <Separator className="bg-white/10" />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                              <p className="text-gray-400 mb-1">Your Contribution</p>
                              <p className="font-semibold text-white">${investment.amountInvested.toLocaleString()} USDC</p>
                              </div>
                              <div>
                              <p className="text-gray-400 mb-1">{investment.poolStatus === 'funding' ? 'Days Left' : 'Ended'}</p>
                              <p className="font-semibold text-white">
                                  {investment.poolStatus === 'funding'
                                    ? Math.ceil((investment.poolDeadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
                                    : new Date(investment.poolDeadline * 1000).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {investment.poolStatus === 'funded' && investment.escrowId && (
                              <Alert className="border-green-500/50 bg-green-500/10">
                                <Target className="h-4 w-4 text-green-500" />
                              <AlertDescription className="text-sm text-gray-300">
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
                              <span className="text-sm text-gray-400">Escrow Status</span>
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
                                <span className="text-gray-400">Funds Released</span>
                                <span className="font-semibold text-white">
                                    ${investment.escrowReleased.toLocaleString()} USDC / ${investment.totalBudget.toLocaleString()} USDC
                                  </span>
                                </div>
                                <Progress value={(investment.escrowReleased / investment.totalBudget) * 100} className="h-2" />
                              </div>

                            <Separator className="bg-white/10" />

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                <p className="text-gray-400 mb-1">Your Share</p>
                                <p className="font-semibold text-white">{((investment.amountInvested / investment.poolGoal) * 100).toFixed(1)}%</p>
                                </div>
                                <div>
                                <p className="text-gray-400 mb-1">Your Returns</p>
                                  <p className="font-semibold text-[#22c55e]">
                                    ${((investment.amountInvested / investment.poolGoal) * investment.escrowReleased).toFixed(2)} USDC
                                  </p>
                                </div>
                              </div>

                              <Alert className="border-[#4ade80]/50 bg-[#4ade80]/10">
                                <Shield className="h-4 w-4 text-[#22c55e]" />
                              <AlertDescription className="text-sm text-gray-300">
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
                <p className="text-gray-300 text-lg mb-4">You haven't invested in any projects yet</p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-linear-to-r from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#4ade80] text-white shadow-lg shadow-[#4ade80]/50" asChild>
                    <Link href="/browse">Discover Projects</Link>
                  </Button>
                </motion.div>
                </motion.div>
              )}
            </TabsContent>

          {/* Deposit Tab */}
          <TabsContent value="deposit" className="space-y-4">
            {!wallet.connected ? (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Connect Wallet</CardTitle>
                  <CardDescription className="text-gray-400">Connect your wallet to deposit funds</CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="bg-white/5 border-white/10">
                    <AlertCircle className="h-4 w-4 text-[#4ade80]" />
                    <AlertTitle className="text-white">Wallet Not Connected</AlertTitle>
                    <AlertDescription className="text-gray-400">
                      Please connect your Stellar wallet to deposit fiat currency and receive USDC.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : !selectedAnchor ? (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Select Anchor Provider</CardTitle>
                  <CardDescription className="text-gray-400">Choose a trusted anchor to convert fiat to crypto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-white/5 border-white/10">
                    <Info className="h-4 w-4 text-[#4ade80]" />
                    <AlertTitle className="text-white">What is an Anchor?</AlertTitle>
                    <AlertDescription className="text-gray-400">
                      Anchors are trusted entities that hold deposits and issue credits on the Stellar network.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={() => setShowAnchorSelector(true)} className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white" size="lg">
                    Choose Anchor Provider
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#4ade80]/10 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-[#4ade80]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Using {selectedAnchor.name}</p>
                          <p className="text-xs text-gray-400">
                            Deposit: {selectedAnchor.fees.deposit} • Withdrawal: {selectedAnchor.fees.withdrawal}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setShowAnchorSelector(true)}>
                        Change
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <OnRampFlow
                  selectedAnchor={selectedAnchor}
                  onComplete={(txId) => handleTransactionComplete(txId, 'on-ramp')}
                  onError={(error) => handleTransactionError(error, 'on-ramp')}
                  onBack={() => setShowAnchorSelector(true)}
                />
              </>
            )}
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw" className="space-y-4">
            {!wallet.connected ? (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Connect Wallet</CardTitle>
                  <CardDescription className="text-gray-400">Connect your wallet to withdraw funds</CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="bg-white/5 border-white/10">
                    <AlertCircle className="h-4 w-4 text-[#4ade80]" />
                    <AlertTitle className="text-white">Wallet Not Connected</AlertTitle>
                    <AlertDescription className="text-gray-400">
                      Please connect your Stellar wallet to withdraw USDC to your bank account.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : !selectedAnchor ? (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Select Anchor Provider</CardTitle>
                  <CardDescription className="text-gray-400">Choose a trusted anchor to convert crypto to fiat</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-white/5 border-white/10">
                    <Info className="h-4 w-4 text-[#4ade80]" />
                    <AlertTitle className="text-white">What is an Anchor?</AlertTitle>
                    <AlertDescription className="text-gray-400">
                      Anchors are trusted entities that hold deposits and issue credits on the Stellar network.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={() => setShowAnchorSelector(true)} className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white" size="lg">
                    Choose Anchor Provider
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Escrow Funds Available for Withdrawal */}
                {(() => {
                  const bidsWithFunds = myBids.filter(bid => (bid.escrowReleasedAmount || 0) > 0)
                  const totalAvailable = bidsWithFunds.reduce((sum, bid) => sum + (bid.escrowReleasedAmount || 0), 0)
                  
                  return totalAvailable > 0 ? (
                    <Card className="bg-linear-to-br from-[#4ade80]/10 to-purple-600/10 backdrop-blur-sm border-[#4ade80]/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Shield className="h-5 w-5 text-[#4ade80]" />
                          Escrow Funds Available
                        </CardTitle>
                        <CardDescription className="text-gray-300">
                          You have completed milestones with funds ready to withdraw
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Total Available</span>
                            <span className="text-3xl font-bold text-[#22c55e]">${totalAvailable.toLocaleString()} USDC</span>
                          </div>
                          <p className="text-xs text-gray-400">From {bidsWithFunds.length} project{bidsWithFunds.length > 1 ? 's' : ''}</p>
                        </div>

                        <div className="space-y-3">
                          {bidsWithFunds.map((bid) => (
                            <div key={bid.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-white mb-1">{bid.projectTitle}</h4>
                                  <p className="text-sm text-gray-400">
                                    ${bid.escrowReleasedAmount?.toLocaleString()} USDC available
                                  </p>
                                </div>
                                <Button 
                                  size="sm" 
                                  className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
                                  onClick={async () => {
                                    try {
                                      toast.info('Withdrawing funds from escrow...')
                                      
                                      // Import Stellar SDK
                                      const StellarSDK = await import('@stellar/stellar-sdk')
                                      const { signAndSubmitTransaction } = await import('@/lib/stellar/wallet')
                                      
                                      const config = {
                                        horizonUrl: 'https://horizon-testnet.stellar.org',
                                        networkPassphrase: StellarSDK.Networks.TESTNET
                                      }
                                      const server = new StellarSDK.Horizon.Server(config.horizonUrl)
                                      const account = await server.loadAccount(wallet.publicKey!)
                                      
                                      const withdrawAmount = bid.escrowReleasedAmount || 0
                                      
                                      // Create USDC asset
                                      const usdcAsset = new StellarSDK.Asset(
                                        'USDC',
                                        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
                                      )
                                      
                                      // In a real escrow, funds would be held in an escrow account
                                      // For demo, we'll simulate by sending from a test account to user
                                      // In production, this would call the escrow smart contract
                                      
                                      // Create payment transaction to user's wallet
                                      const transaction = new StellarSDK.TransactionBuilder(account, {
                                        fee: StellarSDK.BASE_FEE,
                                        networkPassphrase: config.networkPassphrase,
                                      })
                                        .addOperation(
                                          StellarSDK.Operation.payment({
                                            destination: wallet.publicKey!,
                                            asset: usdcAsset,
                                            amount: withdrawAmount.toString(),
                                          })
                                        )
                                        .addMemo(StellarSDK.Memo.text(`Escrow withdrawal: ${bid.projectTitle.substring(0, 20)}`))
                                        .setTimeout(180)
                                        .build()
                                      
                                      // Sign and submit the transaction
                                      const result = await signAndSubmitTransaction(transaction, wallet.walletType as any)
                                      
                                      // Show success with transaction link
                                      toast.success(`Withdrawn ${withdrawAmount} USDC from escrow`, {
                                        description: 'Transaction confirmed on Stellar',
                                        action: {
                                          label: 'View Transaction',
                                          onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${result.hash}`, '_blank'),
                                        },
                                        duration: 10000,
                                      })
                                      
                                      // Update the bid to mark funds as withdrawn
                                      bid.escrowReleasedAmount = 0
                                      
                                      // Refresh wallet balance
                                      if (wallet.refreshBalance) {
                                        await wallet.refreshBalance()
                                      }
                                    } catch (error: any) {
                                      console.error('Withdrawal error:', error)
                                      toast.error('Failed to withdraw funds', {
                                        description: error.message || 'Please try again'
                                      })
                                    }
                                  }}
                                >
                                  <Wallet className="h-4 w-4 mr-2" />
                                  Withdraw
                                </Button>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Badge variant="outline" className="bg-[#4ade80]/10 text-[#22c55e] border-[#4ade80]/20">
                                  Escrow
                                </Badge>
                                <span>•</span>
                                <span>Project #{bid.projectId}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Alert className="border-[#4ade80]/50 bg-[#4ade80]/10">
                          <Info className="h-4 w-4 text-[#22c55e]" />
                          <AlertDescription className="text-sm text-gray-200">
                            These funds are from completed milestones and are ready to be withdrawn to your wallet.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  ) : null
                })()}

                {/* Fiat Withdrawal Section */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Convert USDC to Fiat</CardTitle>
                    <CardDescription className="text-gray-300">
                      Withdraw your USDC balance to your bank account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#4ade80]/10 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-[#4ade80]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Using {selectedAnchor.name}</p>
                          <p className="text-xs text-gray-400">
                            Deposit: {selectedAnchor.fees.deposit} • Withdrawal: {selectedAnchor.fees.withdrawal}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setShowAnchorSelector(true)}>
                        Change
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <OffRampFlow
                  selectedAnchor={selectedAnchor}
                  onComplete={(txId) => handleTransactionComplete(txId, 'off-ramp')}
                  onError={(error) => handleTransactionError(error, 'off-ramp')}
                  onBack={() => setShowAnchorSelector(true)}
                />
              </>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <TransactionHistory
              transactions={transactions}
              network={process.env.NEXT_PUBLIC_STELLAR_NETWORK as 'testnet' | 'mainnet' || 'testnet'}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Anchor Settings</CardTitle>
                <CardDescription className="text-gray-400">Manage your preferred anchor provider</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedAnchor ? (
                  <>
                    <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#4ade80]/10 flex items-center justify-center">
                          <Wallet className="h-6 w-6 text-[#4ade80]" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{selectedAnchor.name}</p>
                          <p className="text-sm text-gray-400">
                            Deposit: {selectedAnchor.fees.deposit} • Withdrawal: {selectedAnchor.fees.withdrawal}
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => setShowAnchorSelector(true)} className="bg-[#4ade80] hover:bg-[#22c55e] text-white">
                        Change Anchor
                      </Button>
                    </div>
                    <Alert className="bg-white/5 border-white/10">
                      <Info className="h-4 w-4 text-[#4ade80]" />
                      <AlertDescription className="text-gray-400">
                        Your preferred anchor is saved and will be used for all future transactions.
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <Button onClick={() => setShowAnchorSelector(true)} className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white">
                    Select Anchor Provider
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          </Tabs>

        {/* Anchor Selector Modal */}
        <Dialog open={showAnchorSelector} onOpenChange={setShowAnchorSelector}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white/5 backdrop-blur-sm border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Select Anchor Provider</DialogTitle>
              <DialogDescription className="text-gray-400">
                Choose a trusted anchor to convert between fiat and cryptocurrency
              </DialogDescription>
            </DialogHeader>
            <AnchorSelector
              onSelect={handleAnchorSelect}
              selectedAnchorId={selectedAnchor?.id}
              userId={wallet.publicKey || 'default'}
            />
          </DialogContent>
        </Dialog>
        </div>
      </main>
  );
}

export default function DashboardPage() {
  return (
    <StellarErrorBoundary>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </StellarErrorBoundary>
  );
}
