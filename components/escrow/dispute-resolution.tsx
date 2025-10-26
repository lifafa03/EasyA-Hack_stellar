/**
 * DisputeResolution Component
 * Handles dispute initiation and resolution for escrow contracts
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertTriangle,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  User,
} from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { EscrowService } from '@/lib/stellar/services/escrow';
import { getStellarSDK } from '@/lib/stellar/sdk';
import { toast } from 'sonner';

interface DisputeResolutionProps {
  contractId: string;
  currentStatus: 'active' | 'completed' | 'disputed';
  userRole: 'client' | 'provider' | 'none';
}

interface DisputeRecord {
  id: string;
  initiatedBy: 'client' | 'provider';
  reason: string;
  status: 'open' | 'resolved' | 'rejected';
  resolution?: string;
  createdAt: number;
  resolvedAt?: number;
}

export function DisputeResolution({ contractId, currentStatus, userRole }: DisputeResolutionProps) {
  const wallet = useWallet();
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disputes, setDisputes] = useState<DisputeRecord[]>([
    // Mock dispute history
    // In real implementation, this would be fetched from the blockchain or backend
  ]);

  const handleInitiateDispute = async () => {
    if (!wallet.publicKey || !disputeReason.trim()) {
      toast.error('Please provide a reason for the dispute');
      return;
    }

    setIsSubmitting(true);
    try {
      const sdk = getStellarSDK();
      const escrowService = new EscrowService(sdk);

      const signer = {
        sign: async (tx: any) => tx,
        getPublicKey: () => wallet.publicKey!,
      };

      await escrowService.disputeEscrow(contractId, disputeReason, signer);

      toast.success('Dispute initiated successfully', {
        description: 'The escrow contract is now under dispute',
      });

      // Add to local dispute history
      const newDispute: DisputeRecord = {
        id: `dispute-${Date.now()}`,
        initiatedBy: userRole,
        reason: disputeReason,
        status: 'open',
        createdAt: Date.now(),
      };
      setDisputes([newDispute, ...disputes]);

      setShowDisputeDialog(false);
      setDisputeReason('');
    } catch (error: any) {
      console.error('Failed to initiate dispute:', error);
      toast.error('Failed to initiate dispute', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
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

  const getDisputeStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'resolved':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getDisputeStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const canInitiateDispute = (): boolean => {
    return (
      wallet.connected &&
      (userRole === 'client' || userRole === 'provider') &&
      currentStatus === 'active'
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Dispute Resolution</CardTitle>
              <CardDescription>
                Manage disputes and resolution for this escrow contract
              </CardDescription>
            </div>
            {canInitiateDispute() && (
              <Button
                variant="outline"
                onClick={() => setShowDisputeDialog(true)}
                className="border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Initiate Dispute
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Current Status */}
          {currentStatus === 'disputed' && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                    Contract Under Dispute
                  </h4>
                  <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80">
                    This escrow contract is currently under dispute. All fund releases are paused until the dispute is resolved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dispute History */}
          {disputes.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Dispute History</h3>
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <Card key={dispute.id} className="bg-surface-dark">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getDisputeStatusColor(dispute.status)}>
                              {getDisputeStatusIcon(dispute.status)}
                              <span className="ml-1 capitalize">{dispute.status}</span>
                            </Badge>
                            <Badge variant="outline">
                              <User className="h-3 w-3 mr-1" />
                              Initiated by {dispute.initiatedBy}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(dispute.createdAt)}
                          </span>
                        </div>

                        <Separator />

                        {/* Reason */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MessageSquare className="h-4 w-4" />
                            <span>Dispute Reason</span>
                          </div>
                          <p className="text-sm">{dispute.reason}</p>
                        </div>

                        {/* Resolution */}
                        {dispute.status === 'resolved' && dispute.resolution && (
                          <>
                            <Separator />
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4" />
                                <span>Resolution</span>
                              </div>
                              <p className="text-sm">{dispute.resolution}</p>
                              {dispute.resolvedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Resolved on {formatDate(dispute.resolvedAt)}
                                </p>
                              )}
                            </div>
                          </>
                        )}

                        {dispute.status === 'rejected' && (
                          <>
                            <Separator />
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <p className="text-sm text-red-600 dark:text-red-400">
                                This dispute was rejected. The escrow contract continues as normal.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Disputes</h3>
              <p className="text-muted-foreground text-sm">
                This escrow contract has no dispute history
              </p>
            </div>
          )}

          {/* Information */}
          <div className="mt-6 p-4 bg-surface-dark rounded-lg">
            <h4 className="font-semibold text-sm mb-2">About Disputes</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-[#22c55e] mt-1">•</span>
                <span>Both clients and providers can initiate disputes if there are issues with the contract</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#22c55e] mt-1">•</span>
                <span>When a dispute is active, all fund releases are paused until resolution</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#22c55e] mt-1">•</span>
                <span>Disputes are resolved through the platform's resolution process</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#22c55e] mt-1">•</span>
                <span>All dispute actions are recorded on the blockchain for transparency</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Initiate Dispute Dialog */}
      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate Dispute</DialogTitle>
            <DialogDescription>
              Provide details about the issue with this escrow contract
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  <strong>Important:</strong> Initiating a dispute will pause all fund releases until the issue is resolved. 
                  Please provide clear details about the problem.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispute-reason">Dispute Reason</Label>
              <Textarea
                id="dispute-reason"
                placeholder="Describe the issue with this escrow contract..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be specific and provide as much detail as possible to help with resolution
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDisputeDialog(false);
                setDisputeReason('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInitiateDispute}
              disabled={isSubmitting || !disputeReason.trim()}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Submit Dispute
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
