/**
 * PoolList Component
 * Display list of crowdfunding pools with filtering and search
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { PoolCard } from './pool-card';
import { PoolInfo } from '@/lib/stellar/services/crowdfunding';
import { getStellarSDK } from '@/lib/stellar/sdk';

type PoolStatus = 'all' | 'funding' | 'funded' | 'failed';

interface PoolListProps {
  onContribute?: (poolId: string) => void;
}

export function PoolList({ onContribute }: PoolListProps) {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [filteredPools, setFilteredPools] = useState<PoolInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PoolStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const poolsPerPage = 9;

  // Mock data for demonstration - in production, this would fetch from the blockchain
  const loadPools = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // In a real implementation, this would query the blockchain for all pools
      // For now, we'll use mock data
      const mockPools: PoolInfo[] = [
        {
          poolId: 'POOL001',
          projectOwner: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX1',
          fundingGoal: '10000',
          deadline: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
          totalRaised: '7500',
          contributorCount: 15,
          status: 'funding',
          createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        },
        {
          poolId: 'POOL002',
          projectOwner: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX2',
          fundingGoal: '5000',
          deadline: Math.floor(Date.now() / 1000) + 15 * 24 * 60 * 60, // 15 days
          totalRaised: '5200',
          contributorCount: 8,
          status: 'funded',
          createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        },
        {
          poolId: 'POOL003',
          projectOwner: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX3',
          fundingGoal: '20000',
          deadline: Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60, // Expired 2 days ago
          totalRaised: '8000',
          contributorCount: 12,
          status: 'failed',
          createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
        },
        {
          poolId: 'POOL004',
          projectOwner: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX4',
          fundingGoal: '15000',
          deadline: Math.floor(Date.now() / 1000) + 45 * 24 * 60 * 60, // 45 days
          totalRaised: '3200',
          contributorCount: 6,
          status: 'funding',
          createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        },
        {
          poolId: 'POOL005',
          projectOwner: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX5',
          fundingGoal: '8000',
          deadline: Math.floor(Date.now() / 1000) + 20 * 24 * 60 * 60, // 20 days
          totalRaised: '8500',
          contributorCount: 20,
          status: 'funded',
          createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        },
      ];

      setPools(mockPools);
      setFilteredPools(mockPools);
    } catch (err: any) {
      console.error('Failed to load pools:', err);
      setError(err.message || 'Failed to load pools');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPools();
  }, []);

  // Filter and search pools
  useEffect(() => {
    let filtered = [...pools];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pool => {
        if (statusFilter === 'funding') {
          return pool.status === 'funding' && pool.deadline * 1000 > Date.now();
        }
        return pool.status === statusFilter;
      });
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pool => 
        pool.poolId.toLowerCase().includes(query) ||
        pool.projectOwner.toLowerCase().includes(query)
      );
    }

    setFilteredPools(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [pools, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredPools.length / poolsPerPage);
  const startIndex = (currentPage - 1) * poolsPerPage;
  const endIndex = startIndex + poolsPerPage;
  const currentPools = filteredPools.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#4ade80]" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Pools</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadPools} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Crowdfunding Pools</CardTitle>
          <CardDescription>
            Browse and support active crowdfunding campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by pool ID or owner address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PoolStatus)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pools</SelectItem>
                <SelectItem value="funding">Active</SelectItem>
                <SelectItem value="funded">Funded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="flex gap-4 flex-wrap">
            <Badge variant="outline" className="text-sm">
              Total: {pools.length}
            </Badge>
            <Badge variant="outline" className="text-sm">
              Active: {pools.filter(p => p.status === 'funding' && p.deadline * 1000 > Date.now()).length}
            </Badge>
            <Badge variant="outline" className="text-sm">
              Funded: {pools.filter(p => p.status === 'funded').length}
            </Badge>
            <Badge variant="outline" className="text-sm">
              Failed: {pools.filter(p => p.status === 'failed').length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Pool Grid */}
      {currentPools.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pools Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'No crowdfunding pools available yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPools.map((pool) => (
              <PoolCard
                key={pool.poolId}
                pool={pool}
                onContribute={onContribute}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredPools.length)} of {filteredPools.length} pools
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={currentPage === page ? 'bg-[#4ade80] hover:bg-[#22c55e] text-white' : ''}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
