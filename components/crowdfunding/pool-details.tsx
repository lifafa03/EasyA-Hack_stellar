/**
 * PoolDetails Component
 * Detailed view of a crowdfunding pool with contribution form and real-time updates
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Target, Users, Calendar, TrendingUp, CheckCircle, 
  AlertCircle, Loader2, RefreshCw, DollarSign 
} from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { 
  CrowdfundingService, 
  PoolInfo, 
  ContributorInfo,
  PoolEvent 
} from '@/lib/stellar/services/crowdfunding';
import { getStellarSDK } from '@/lib/stellar/sdk';
import { toast } from 'sonner';

interface PoolDetailsProps {
  poolId: string;
}

export function PoolDetails({ poolId }: PoolDetailsProps) {
  const wallet = useWallet();
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [contributors, setContributors] = useState<ContributorInfo[]>([]);
  const [contributionAmount, setContributionAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isContributing, setIsContributing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crowdfundingService = new CrowdfundingService(getStellarSDK());

  // Load pool data
  const loadPoolData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const poolData = await crowdfundingService.getPoolInfo(poolId);
      const contributorData = await crowdfundingService.getContributors(poolId);
      
      setPool(poolData);
      setContributors(contributorData);
    } catch (err: any) {
      console.error('Failed to load pool data:', err);
      setError(err.message || 'Failed to load pool data');
      toast.error('Failed to load pool data');
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    loadPoolData();

    const subscription = crowdfundingService.watchPool(poolId).subscribe({
      next: (event: PoolEvent) => {
        console.log('Pool event:', event);
        
        // Reload pool data on events
        loadPoolData();
        
        // Show toast notifications
        if (event.type === 'contribution') {
          toast.success('New contribution received!');
        } else if (event.type === 'finalized') {
          toast.success('Pool has been finalized!');
        } else if (event.type === 'refunded') {
          toast.info('Refund processed');
        }
      },
      error: (err) => {
        console.error('Pool watch error:', err);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [poolId]);

  // Handle contribution
  const handleContribute = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      toast.error('Please enter a valid contribution amount');
      return;
    }

    if (wallet.usdcBalance && parseFloat(contributionAmount) > parseFloat(wallet.usdcBalance)) {
      toast.error('Insufficient USDC balance');
      return;
    }

    setIsContributing(true);
    try {
      const signer = {
        sign: async (tx: any) => tx,
        getPublicKey: () => wallet.publicKey!,
      };

      await crowdfundingService.contribute(poolId, contributionAmount, signer);

      toast.success('Contribution successful!', {
        description: `You contributed ${contributionAmount} USDC`,
      });

      setContributionAmount('');
      await wallet.refreshBalance();
      await loadPoolData();
    } catch (err: any) {
      console.error('Failed to contribute:', err);
      toast.error('Failed to contribute', {
        description: err.message || 'Please try again',
      });
    } finally {
      setIsContributing(false);
    }
  };

  // Handle finalize
  const handleFinalize = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsFinalizing(true);
    try {
      const signer = {
        sign: async (tx: any) => tx,
        getPublicKey: () => wallet.publicKey!,
      };

      await crowdfundingService.finalizePool(poolId, signer);

      toast.success('Pool finalized successfully!', {
        description: 'Funds are now available',
      });

      await loadPoolData();
    } catch (err: any) {
      console.error('Failed to finalize:', err);
      toast.error('Failed to finalize pool', {
        description: err.message || 'Please try again',
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  // Handle refund
  const handleRefund = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsRefunding(true);
    try {
      const signer = {
        sign: async (tx: any) => tx,
        getPublicKey: () => wallet.publicKey!,
      };

      await crowdfundingService.requestRefund(poolId, signer);

      toast.success('Refund processed successfully!');

      await wallet.refreshBalance();
      await loadPoolData();
    } catch (err: any) {
      console.error('Failed to request refund:', err);
      toast.error('Failed to request refund', {
        description: err.message || 'Please try again',
      });
    } finally {
      setIsRefunding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#4ade80]" />
      </div>
    );
  }

  if (error || !pool) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Pool</h3>
            <p className="text-muted-foreground mb-4">{error || 'Pool not found'}</p>
            <Button onClick={loadPoolData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const fundingProgress = (parseFloat(pool.totalRaised) / parseFloat(pool.fundingGoal)) * 100;
  const isExpired = pool.deadline * 1000 < Date.now();
  const daysRemaining = Math.ceil((pool.deadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
  const isOwner = wallet.publicKey === pool.projectOwner;
  const canFinalize = isOwner && pool.status === 'funding' && fundingProgress >= 100;
  const canRefund = pool.status === 'failed' || (pool.status === 'funding' && isExpired && fundingProgress < 100);
  const canContribute = pool.status === 'funding' && !isExpired;

  const getStatusBadge = () => {
    if (pool.status === 'funded') {
      return <Badge className="bg-[#22c55e] text-white">Funded</Badge>;
    }
    if (pool.status === 'failed') {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge className="bg-blue-500 text-white">Active</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Pool Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Target className="h-6 w-6 text-[#4ade80]" />
                Pool #{poolId.slice(0, 8)}
              </CardTitle>
              <CardDescription className="mt-2">
                Created {new Date(pool.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Funding Progress */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Funding Progress</span>
              <span className="text-sm font-semibold">{fundingProgress.toFixed(1)}%</span>
            </div>
            <Progress value={fundingProgress} className="h-4" />
            <div className="flex justify-between">
              <span className="text-2xl font-bold">{parseFloat(pool.totalRaised).toFixed(2)} USDC</span>
              <span className="text-lg text-muted-foreground">of {parseFloat(pool.fundingGoal).toFixed(2)} USDC</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-surface-dark">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-[#4ade80]" />
                  <div>
                    <p className="text-sm text-muted-foreground">Contributors</p>
                    <p className="text-xl font-bold">{pool.contributorCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-dark">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-[#4ade80]" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isExpired ? 'Ended' : 'Days Left'}
                    </p>
                    <p className={`text-xl font-bold ${isExpired ? 'text-destructive' : ''}`}>
                      {isExpired ? 'Expired' : daysRemaining}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-dark">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-[#4ade80]" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Contribution</p>
                    <p className="text-xl font-bold">
                      {pool.contributorCount > 0 
                        ? (parseFloat(pool.totalRaised) / pool.contributorCount).toFixed(2)
                        : '0.00'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Owner */}
          <div className="flex items-center justify-between p-4 bg-surface-dark rounded-lg">
            <span className="text-sm text-muted-foreground">Project Owner</span>
            <span className="font-mono text-sm">
              {pool.projectOwner.slice(0, 12)}...{pool.projectOwner.slice(-12)}
              {isOwner && <Badge className="ml-2" variant="outline">You</Badge>}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Contribution Form */}
      {canContribute && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#4ade80]" />
              Make a Contribution
            </CardTitle>
            <CardDescription>
              Support this project by contributing USDC
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Contribution Amount (USDC)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="100.00"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
              {wallet.usdcBalance && (
                <p className="text-sm text-muted-foreground">
                  Available balance: {parseFloat(wallet.usdcBalance).toFixed(2)} USDC
                </p>
              )}
            </div>

            <Button
              onClick={handleContribute}
              disabled={!wallet.connected || isContributing || !contributionAmount}
              className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white"
            >
              {isContributing ? (
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
          </CardContent>
        </Card>
      )}

      {/* Finalize Button */}
      {canFinalize && (
        <Card className="border-[#4ade80]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#22c55e]" />
                  Goal Reached!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You can now finalize the pool and access the funds
                </p>
              </div>
              <Button
                onClick={handleFinalize}
                disabled={isFinalizing}
                className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
              >
                {isFinalizing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  'Finalize Pool'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refund Button */}
      {canRefund && !isOwner && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Pool Failed
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The funding goal was not met. You can request a refund.
                </p>
              </div>
              <Button
                onClick={handleRefund}
                disabled={isRefunding}
                variant="destructive"
              >
                {isRefunding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Request Refund'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contributors List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#4ade80]" />
            Contributors ({contributors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contributors.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No contributions yet. Be the first to support this project!
            </p>
          ) : (
            <div className="space-y-3">
              {contributors.map((contributor, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#4ade80]/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-[#4ade80]" />
                      </div>
                      <div>
                        <p className="font-mono text-sm">
                          {contributor.address.slice(0, 8)}...{contributor.address.slice(-8)}
                          {contributor.address === wallet.publicKey && (
                            <Badge className="ml-2" variant="outline">You</Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(contributor.contributedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold">
                      {parseFloat(contributor.amount).toFixed(2)} USDC
                    </span>
                  </div>
                  {index < contributors.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
