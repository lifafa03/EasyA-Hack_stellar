'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/use-wallet';
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
  User
} from 'lucide-react';
import { toast } from 'sonner';
import type { FiatTransaction } from '@/lib/stellar/types/fiat-gateway';
import { StellarErrorBoundary } from '@/components/stellar/error-boundary';
import { GradientBackground } from '@/components/gradient-background';

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

function ProfileContent() {
  const wallet = useWallet();
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedAnchor, setSelectedAnchor] = React.useState<AnchorProvider | null>(null);
  const [showAnchorSelector, setShowAnchorSelector] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('profile');
  const [transactions, setTransactions] = React.useState<FiatTransaction[]>([]);

  // Debug wallet connection state
  React.useEffect(() => {
    console.log('Wallet state:', {
      connected: wallet.connected,
      publicKey: wallet.publicKey,
      walletType: wallet.walletType,
    });
  }, [wallet.connected, wallet.publicKey, wallet.walletType]);

  // Handle URL query parameters for tab navigation
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['profile', 'deposit', 'withdraw', 'history', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

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
    <GradientBackground variant="default">
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold">Profile & Wallet</h1>
                <p className="text-muted-foreground mt-1">Manage your account and wallet operations</p>
              </div>
              {!wallet.connected ? (
                <Button onClick={() => wallet.connect()} className="bg-[#4ade80] hover:bg-[#22c55e] text-white">
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
              ) : (
                <Button onClick={() => wallet.disconnect()} variant="outline">
                  Disconnect
                </Button>
              )}
            </div>

            {/* Prominent USDC Balance Display */}
            {wallet.connected && wallet.publicKey && (
              <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Wallet Address</p>
                      <p className="text-sm font-mono">
                        {wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-8)}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm text-muted-foreground">Available Balance</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-[#22c55e]">
                          ${wallet.usdcBalance ? parseFloat(wallet.usdcBalance).toFixed(2) : '0.00'}
                        </p>
                        <span className="text-lg font-semibold text-[#22c55e]">USDC</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {wallet.balance ? parseFloat(wallet.balance).toFixed(2) : '0.00'} XLM
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="space-y-4">
              <TabsList className="grid w-full grid-cols-5 max-w-3xl">
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="deposit" className="gap-2" disabled={!wallet.connected}>
                  <ArrowDownToLine className="h-4 w-4" />
                  <span className="hidden sm:inline">Deposit</span>
                </TabsTrigger>
                <TabsTrigger value="withdraw" className="gap-2" disabled={!wallet.connected}>
                  <ArrowUpFromLine className="h-4 w-4" />
                  <span className="hidden sm:inline">Withdraw</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2" disabled={!wallet.connected}>
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2" disabled={!wallet.connected}>
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>
              
              {!wallet.connected && activeTab !== 'profile' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Wallet Connection Required</AlertTitle>
                  <AlertDescription>
                    Please connect your Stellar wallet to access deposit, withdraw, and transaction features.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-8">
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
                          <span className="font-bold text-lg">{profileData.rating}</span>
                          <span className="text-muted text-sm">({profileData.totalReviews} reviews)</span>
                        </div>
                      </div>
                    </div>

                    <div className="grow">
                      {isEditing ? (
                        <form className="space-y-4" onSubmit={handleSave}>
                          <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" defaultValue={profileData.name} className="mt-2" />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue={profileData.email} className="mt-2" />
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" defaultValue={profileData.location} className="mt-2" />
                          </div>
                          <div>
                            <Label htmlFor="website">Website</Label>
                            <Input id="website" type="url" defaultValue={profileData.website} className="mt-2" />
                          </div>
                          <div>
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea id="bio" defaultValue={profileData.bio} className="mt-2 min-h-24" />
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button type="submit" className="bg-[#4ade80] hover:bg-[#22c55e] text-white">
                              Save Changes
                            </Button>
                            <Button type="button" onClick={() => setIsEditing(false)} variant="outline">
                              Cancel
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-3xl font-bold">{profileData.name}</h2>
                            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                              Edit Profile
                            </Button>
                          </div>
                          <p className="text-muted mb-4">{profileData.email}</p>
                          <p className="text-foreground leading-relaxed mb-4">{profileData.bio}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted">
                            <span>📍 {profileData.location}</span>
                            <span>
                              🌐{" "}
                              <a href={profileData.website} className="text-[#22c55e] hover:underline">
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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#4ade80]/10 flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-[#22c55e]" />
                      </div>
                      <div>
                        <p className="text-sm text-muted">Projects Completed</p>
                        <p className="text-2xl font-bold">{profileData.stats.projectsCompleted}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted">Total Earned</p>
                        <p className="text-2xl font-bold">${profileData.stats.totalEarned.toLocaleString()} USDC</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center">
                        <Award className="h-6 w-6 text-[#fbbf24]" />
                      </div>
                      <div>
                        <p className="text-sm text-muted">Success Rate</p>
                        <p className="text-2xl font-bold">{profileData.stats.successRate}%</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Skills */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {profileData.skills.map((skill) => (
                      <Badge key={skill} className="bg-[#4ade80]/10 text-[#22c55e] hover:bg-[#4ade80]/20 px-4 py-2">
                        {skill}
                      </Badge>
                    ))}
                    {isEditing && (
                      <Button variant="outline" size="sm">
                        + Add Skill
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Portfolio */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Portfolio</h2>
                    {isEditing && (
                      <Button variant="outline" size="sm">
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
                            className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-sm text-muted">{item.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Deposit Tab */}
            <TabsContent value="deposit" className="space-y-4">
              {!wallet.connected ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Connect Wallet</CardTitle>
                    <CardDescription>Connect your wallet to deposit funds</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Wallet Not Connected</AlertTitle>
                      <AlertDescription>
                        Please connect your Stellar wallet to deposit fiat currency and receive USDC.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ) : !selectedAnchor ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Anchor Provider</CardTitle>
                    <CardDescription>Choose a trusted anchor to convert fiat to crypto</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>What is an Anchor?</AlertTitle>
                      <AlertDescription>
                        Anchors are trusted entities that hold deposits and issue credits on the Stellar network.
                      </AlertDescription>
                    </Alert>
                    <Button onClick={() => setShowAnchorSelector(true)} className="w-full" size="lg">
                      Choose Anchor Provider
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Using {selectedAnchor.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Deposit: {selectedAnchor.fees.deposit} • Withdrawal: {selectedAnchor.fees.withdrawal}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowAnchorSelector(true)}>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Connect Wallet</CardTitle>
                    <CardDescription>Connect your wallet to withdraw funds</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Wallet Not Connected</AlertTitle>
                      <AlertDescription>
                        Please connect your Stellar wallet to withdraw USDC to your bank account.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ) : !selectedAnchor ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Anchor Provider</CardTitle>
                    <CardDescription>Choose a trusted anchor to convert crypto to fiat</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>What is an Anchor?</AlertTitle>
                      <AlertDescription>
                        Anchors are trusted entities that hold deposits and issue credits on the Stellar network.
                      </AlertDescription>
                    </Alert>
                    <Button onClick={() => setShowAnchorSelector(true)} className="w-full" size="lg">
                      Choose Anchor Provider
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Using {selectedAnchor.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Deposit: {selectedAnchor.fees.deposit} • Withdrawal: {selectedAnchor.fees.withdrawal}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowAnchorSelector(true)}>
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
              <Card>
                <CardHeader>
                  <CardTitle>Anchor Settings</CardTitle>
                  <CardDescription>Manage your preferred anchor provider</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedAnchor ? (
                    <>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Wallet className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{selectedAnchor.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Deposit: {selectedAnchor.fees.deposit} • Withdrawal: {selectedAnchor.fees.withdrawal}
                            </p>
                          </div>
                        </div>
                        <Button onClick={() => setShowAnchorSelector(true)}>
                          Change Anchor
                        </Button>
                      </div>
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Your preferred anchor is saved and will be used for all future transactions.
                        </AlertDescription>
                      </Alert>
                    </>
                  ) : (
                    <Button onClick={() => setShowAnchorSelector(true)} className="w-full">
                      Select Anchor Provider
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Anchor Selector Modal */}
          <Dialog open={showAnchorSelector} onOpenChange={setShowAnchorSelector}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Select Anchor Provider</DialogTitle>
                <DialogDescription>
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
    </GradientBackground>
  );
}

export default function ProfilePage() {
  return (
    <StellarErrorBoundary>
      <ProfileContent />
    </StellarErrorBoundary>
  );
}
