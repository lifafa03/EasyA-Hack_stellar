/**
 * EscrowDetails Component
 * Displays detailed escrow information with milestone/time schedule management
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Calendar,
  DollarSign,
  User,
  FileText,
  Download,
  AlertCircle as AlertCircleIcon,
} from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { EscrowService, EscrowStatus, MilestoneStatus, TimeReleaseStatus } from '@/lib/stellar/services/escrow';
import { getStellarSDK } from '@/lib/stellar/sdk';
import { toast } from 'sonner';

interface EscrowDetailsProps {
  contractId: string;
}

interface Transaction {
  id: string;
  type: 'created' | 'milestone_completed' | 'funds_released' | 'disputed';
  amount?: string;
  description: string;
  timestamp: number;
  txHash: string;
}

export function EscrowDetails({ contractId }: EscrowDetailsProps) {
  const wallet = useWallet();
  const [escrow, setEscrow] = useState<EscrowStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userRole, setUserRole] = useState<'client' | 'provider' | 'none'>('none');

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchEscrowDetails();
    }
  }, [contractId, wallet.connected, wallet.publicKey]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!wallet.publicKey || !escrow) return;

    const sdk = getStellarSDK();
    const escrowService = new EscrowService(sdk);

    const subscription = escrowService.watchEscrow(contractId).subscribe({
      next: (event) => {
        console.log('Escrow event:', event);
        toast.info('Escrow updated', {
          description: `Event: ${event.type}`,
        });
        fetchEscrowDetails();
      },
      error: (error) => {
        console.error('Escrow watch error:', error);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [contractId, wallet.publicKey, escrow]);

  const fetchEscrowDetails = async () => {
    setIsLoading(true);
    try {
      const sdk = getStellarSDK();
      const escrowService = new EscrowService(sdk);
      const status = await escrowService.getEscrowStatus(contractId);
      
      setEscrow(status);

      // Determine user role
      if (wallet.publicKey === status.client) {
        setUserRole('client');
      } else if (wallet.publicKey === status.provider) {
        setUserRole('provider');
      } else {
        setUserRole('none');
      }

      // Mock transaction history
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'created',
          description: 'Escrow contract created',
          timestamp: status.createdAt,
          txHash: 'TX1234567890ABCDEF',
        },
      ];

      if (status.milestones) {
        status.milestones.forEach((milestone, index) => {
          if (milestone.completed && milestone.completedAt) {
            mockTransactions.push({
              id: `milestone-${index}`,
              type: 'milestone_completed',
              amount: milestone.amount,
              description: `Milestone completed: ${milestone.description}`,
              timestamp: milestone.completedAt,
              txHash: `TX${index}234567890ABCDEF`,
            });
          }
        });
      }

      setTransactions(mockTransactions.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error: any) {
      console.error('Failed to fetch escrow details:', error);
      toast.error('Failed to load escrow details', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteMilestone = async (milestoneId: number) => {
    if (!wallet.publicKey || userRole !== 'client') return;

    setIsProcessing(true);
    try {
      const sdk = getStellarSDK();
      const escrowService = new EscrowService(sdk);

      const signer = {
        sign: async (tx: any) => tx,
        getPublicKey: () => wallet.publicKey!,
      };

      await escrowService.completeMilestone(contractId, milestoneId, signer);

      toast.success('Milestone completed successfully!', {
        description: 'Funds have been released to the provider',
      });

      await fetchEscrowDetails();
    } catch (error: any) {
      console.error('Failed to complete milestone:', error);
      toast.error('Failed to complete milestone', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!wallet.publicKey || userRole !== 'provider') return;

    setIsProcessing(true);
    try {
      const sdk = getStellarSDK();
      const escrowService = new EscrowService(sdk);

      const signer = {
        sign: async (tx: any) => tx,
        getPublicKey: () => wallet.publicKey!,
      };

      await escrowService.withdrawReleased(contractId, signer);

      toast.success('Funds withdrawn successfully!', {
        description: 'Check your wallet balance',
      });

      await fetchEscrowDetails();
      await wallet.refreshBalance();
    } catch (error: any) {
      console.error('Failed to withdraw funds:', error);
      toast.error('Failed to withdraw funds', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const calculateProgress = (): number => {
    if (!escrow) return 0;
    const total = parseFloat(escrow.totalAmount);
    const released = parseFloat(escrow.releasedAmount);
    return total > 0 ? (released / total) * 100 : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'disputed':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'disputed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const canWithdraw = (): boolean => {
    if (!escrow || userRole !== 'provider') return false;
    return parseFloat(escrow.releasedAmount) > 0;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading escrow details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircleIcon className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Escrow Not Found</h3>
              <p className="text-muted-foreground">
                The requested escrow contract could not be found
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="font-mono text-lg">
                  {formatAddress(contractId)}
                </CardTitle>
                <Badge variant="outline" className={getStatusColor(escrow.status)}>
                  {getStatusIcon(escrow.status)}
                  <span className="ml-1 capitalize">{escrow.status}</span>
                </Badge>
                <Badge variant="outline">
                  {userRole === 'client' ? 'You are Client' : userRole === 'provider' ? 'You are Provider' : 'Observer'}
                </Badge>
              </div>
              <CardDescription>
                Created {formatDate(escrow.createdAt)}
              </CardDescription>
            </div>
            {userRole === 'provider' && canWithdraw() && (
              <Button
                onClick={handleWithdraw}
                disabled={isProcessing}
                className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
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
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Released</span>
                  <span className="font-semibold">
                    {escrow.releasedAmount} / {escrow.totalAmount} USDC
                  </span>
                </div>
                <Progress value={calculateProgress()} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{calculateProgress().toFixed(1)}% completed</span>
                  <span className="capitalize">{escrow.releaseType.replace('-', ' ')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestones */}
          {escrow.releaseType === 'milestone-based' && escrow.milestones && (
            <Card>
              <CardHeader>
                <CardTitle>Milestones</CardTitle>
                <CardDescription>
                  Track project milestones and payment releases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {escrow.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`mt-1 rounded-full p-1 ${
                            milestone.completed
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-gray-500/20 text-gray-500'
                          }`}>
                            {milestone.completed ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">Milestone {index + 1}</h4>
                              {milestone.completed && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {milestone.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-semibold">{milestone.amount} USDC</span>
                              {milestone.completed && milestone.completedAt && (
                                <span className="text-muted-foreground">
                                  {formatDate(milestone.completedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!milestone.completed && userRole === 'client' && escrow.status === 'active' && (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteMilestone(milestone.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Complete'
                            )}
                          </Button>
                        )}
                      </div>
                      {index < escrow.milestones!.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Schedule */}
          {escrow.releaseType === 'time-based' && escrow.timeSchedule && (
            <Card>
              <CardHeader>
                <CardTitle>Release Schedule</CardTitle>
                <CardDescription>
                  Automatic payment releases based on time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {escrow.timeSchedule.map((release, index) => {
                    const isPast = release.releaseDate < Date.now() / 1000;
                    const isUpcoming = !isPast && !release.released;

                    return (
                      <div key={index} className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 rounded-full p-1 ${
                            release.released
                              ? 'bg-green-500/20 text-green-500'
                              : isUpcoming
                              ? 'bg-blue-500/20 text-blue-500'
                              : 'bg-gray-500/20 text-gray-500'
                          }`}>
                            {release.released ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Calendar className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">Release {index + 1}</h4>
                              {release.released && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                  Released
                                </Badge>
                              )}
                              {isUpcoming && (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                  Upcoming
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-semibold">{release.amount} USDC</span>
                              <span className="text-muted-foreground">
                                {formatDate(release.releaseDate * 1000)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {index < escrow.timeSchedule!.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                All blockchain transactions for this escrow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-dark">
                    <div className="mt-1">
                      {tx.type === 'created' && <FileText className="h-4 w-4 text-blue-500" />}
                      {tx.type === 'milestone_completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {tx.type === 'funds_released' && <DollarSign className="h-4 w-4 text-green-500" />}
                      {tx.type === 'disputed' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(tx.timestamp)}
                        </span>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#22c55e] hover:text-[#4ade80] flex items-center gap-1"
                        >
                          View on Explorer
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    {tx.amount && (
                      <span className="text-sm font-semibold">{tx.amount} USDC</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contract Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Client</span>
                </div>
                <p className="text-sm font-mono break-all">{formatAddress(escrow.client)}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Provider</span>
                </div>
                <p className="text-sm font-mono break-all">{formatAddress(escrow.provider)}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Amount</span>
                </div>
                <p className="text-lg font-semibold">{escrow.totalAmount} USDC</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Released Amount</span>
                </div>
                <p className="text-lg font-semibold text-[#22c55e]">{escrow.releasedAmount} USDC</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <p className="text-sm">{formatDate(escrow.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {escrow.status === 'active' && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userRole === 'provider' && canWithdraw() && (
                  <Button
                    onClick={handleWithdraw}
                    disabled={isProcessing}
                    className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Withdraw {escrow.releasedAmount} USDC
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={`https://stellar.expert/explorer/testnet/contract/${contractId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Stellar Expert
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
