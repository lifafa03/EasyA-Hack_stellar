/**
 * EscrowDashboard Component
 * Displays list of user's escrow contracts with filtering and real-time updates
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  ExternalLink,
  Loader2,
  FileText
} from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { EscrowService, EscrowStatus } from '@/lib/stellar/services/escrow';
import { getStellarSDK } from '@/lib/stellar/sdk';
import { toast } from 'sonner';
import Link from 'next/link';

type FilterStatus = 'all' | 'active' | 'completed' | 'disputed';

interface EscrowWithMetadata extends EscrowStatus {
  role: 'client' | 'provider';
}

export function EscrowDashboard() {
  const wallet = useWallet();
  const [escrows, setEscrows] = useState<EscrowWithMetadata[]>([]);
  const [filteredEscrows, setFilteredEscrows] = useState<EscrowWithMetadata[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch user's escrow contracts
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchEscrows();
    } else {
      setEscrows([]);
      setFilteredEscrows([]);
      setIsLoading(false);
    }
  }, [wallet.connected, wallet.publicKey]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!wallet.publicKey || escrows.length === 0) return;

    const sdk = getStellarSDK();
    const escrowService = new EscrowService(sdk);
    const subscriptions: any[] = [];

    // Subscribe to each escrow contract
    escrows.forEach(escrow => {
      const subscription = escrowService.watchEscrow(escrow.contractId).subscribe({
        next: (event) => {
          console.log('Escrow event:', event);
          // Refresh escrow data when event occurs
          fetchEscrowStatus(escrow.contractId);
        },
        error: (error) => {
          console.error('Escrow watch error:', error);
        },
      });
      subscriptions.push(subscription);
    });

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [escrows.length, wallet.publicKey]);

  // Filter and search
  useEffect(() => {
    let filtered = escrows;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.status === filterStatus);
    }

    // Search by contract ID or provider/client address
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.contractId.toLowerCase().includes(query) ||
        e.provider.toLowerCase().includes(query) ||
        e.client.toLowerCase().includes(query)
      );
    }

    setFilteredEscrows(filtered);
    setCurrentPage(1);
  }, [escrows, filterStatus, searchQuery]);

  const fetchEscrows = async () => {
    if (!wallet.publicKey) return;

    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from a backend API
      // that indexes escrow contracts by user address
      // For now, we'll use mock data
      const mockEscrows: EscrowWithMetadata[] = [
        {
          contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          client: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX1',
          provider: wallet.publicKey,
          totalAmount: '5000.00',
          releasedAmount: '2500.00',
          releaseType: 'milestone-based',
          status: 'active',
          role: 'provider',
          milestones: [
            { id: 0, description: 'Initial design', amount: '1250.00', completed: true, completedAt: Date.now() - 86400000 },
            { id: 1, description: 'Development phase 1', amount: '1250.00', completed: true, completedAt: Date.now() - 43200000 },
            { id: 2, description: 'Development phase 2', amount: '1250.00', completed: false },
            { id: 3, description: 'Final delivery', amount: '1250.00', completed: false },
          ],
          createdAt: Date.now() - 604800000,
        },
        {
          contractId: 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
          client: wallet.publicKey,
          provider: 'GYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY2',
          totalAmount: '3000.00',
          releasedAmount: '0.00',
          releaseType: 'time-based',
          status: 'active',
          role: 'client',
          timeSchedule: [
            { releaseDate: Date.now() + 86400000, amount: '1000.00', released: false },
            { releaseDate: Date.now() + 172800000, amount: '1000.00', released: false },
            { releaseDate: Date.now() + 259200000, amount: '1000.00', released: false },
          ],
          createdAt: Date.now() - 259200000,
        },
      ];

      setEscrows(mockEscrows);
    } catch (error: any) {
      console.error('Failed to fetch escrows:', error);
      toast.error('Failed to load escrow contracts', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEscrowStatus = async (contractId: string) => {
    try {
      const sdk = getStellarSDK();
      const escrowService = new EscrowService(sdk);
      const status = await escrowService.getEscrowStatus(contractId);
      
      // Update the escrow in the list
      setEscrows(prev => prev.map(e => 
        e.contractId === contractId 
          ? { ...e, ...status, role: e.role }
          : e
      ));
    } catch (error) {
      console.error('Failed to fetch escrow status:', error);
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

  const calculateProgress = (escrow: EscrowWithMetadata): number => {
    const total = parseFloat(escrow.totalAmount);
    const released = parseFloat(escrow.releasedAmount);
    return total > 0 ? (released / total) * 100 : 0;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  // Pagination
  const totalPages = Math.ceil(filteredEscrows.length / itemsPerPage);
  const paginatedEscrows = filteredEscrows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusCounts = () => {
    return {
      all: escrows.length,
      active: escrows.filter(e => e.status === 'active').length,
      completed: escrows.filter(e => e.status === 'completed').length,
      disputed: escrows.filter(e => e.status === 'disputed').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (!wallet.connected) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to view your escrow contracts
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Escrow Contracts</CardTitle>
          <CardDescription>
            Manage and monitor your escrow contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by contract ID or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  All ({statusCounts.all})
                </TabsTrigger>
                <TabsTrigger value="active">
                  Active ({statusCounts.active})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({statusCounts.completed})
                </TabsTrigger>
                <TabsTrigger value="disputed">
                  Disputed ({statusCounts.disputed})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Escrow List */}
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading escrow contracts...</p>
            </div>
          ) : paginatedEscrows.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Escrow Contracts Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first escrow contract to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedEscrows.map((escrow) => (
                <Card key={escrow.contractId} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold font-mono text-sm">
                              {formatAddress(escrow.contractId)}
                            </h3>
                            <Badge variant="outline" className={getStatusColor(escrow.status)}>
                              {getStatusIcon(escrow.status)}
                              <span className="ml-1 capitalize">{escrow.status}</span>
                            </Badge>
                            <Badge variant="outline">
                              {escrow.role === 'client' ? 'Client' : 'Provider'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Created {formatDate(escrow.createdAt)}
                          </p>
                        </div>
                        <Link href={`/escrow/${escrow.contractId}`}>
                          <Button variant="outline" size="sm">
                            View Details
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </Button>
                        </Link>
                      </div>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">
                            {escrow.releasedAmount} / {escrow.totalAmount} USDC
                          </span>
                        </div>
                        <div className="w-full bg-surface-dark rounded-full h-2">
                          <div
                            className="bg-[#4ade80] h-2 rounded-full transition-all"
                            style={{ width: `${calculateProgress(escrow)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{calculateProgress(escrow).toFixed(1)}% released</span>
                          <span className="capitalize">{escrow.releaseType.replace('-', ' ')}</span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {escrow.role === 'client' ? 'Provider' : 'Client'}
                          </p>
                          <p className="text-sm font-mono">{formatAddress(
                            escrow.role === 'client' ? escrow.provider : escrow.client
                          )}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {escrow.releaseType === 'milestone-based' ? 'Milestones' : 'Releases'}
                          </p>
                          <p className="text-sm font-semibold">
                            {escrow.releaseType === 'milestone-based'
                              ? `${escrow.milestones?.filter(m => m.completed).length || 0} / ${escrow.milestones?.length || 0} completed`
                              : `${escrow.timeSchedule?.filter(t => t.released).length || 0} / ${escrow.timeSchedule?.length || 0} released`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEscrows.length)} of {filteredEscrows.length} contracts
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
