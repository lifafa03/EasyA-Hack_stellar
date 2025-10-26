/**
 * PoolCard Component
 * Display pool information with progress bar and status
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Users, Calendar, TrendingUp } from 'lucide-react';
import { PoolInfo } from '@/lib/stellar/services/crowdfunding';
import { useRouter } from 'next/navigation';

interface PoolCardProps {
  pool: PoolInfo;
  onContribute?: (poolId: string) => void;
}

export function PoolCard({ pool, onContribute }: PoolCardProps) {
  const router = useRouter();
  
  const fundingProgress = (parseFloat(pool.totalRaised) / parseFloat(pool.fundingGoal)) * 100;
  const isExpired = pool.deadline * 1000 < Date.now();
  const daysRemaining = Math.ceil((pool.deadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24));

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

  const handleCardClick = () => {
    router.push(`/crowdfunding/${pool.poolId}`);
  };

  const handleContribute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onContribute) {
      onContribute(pool.poolId);
    } else {
      router.push(`/crowdfunding/${pool.poolId}`);
    }
  };

  return (
    <Card 
      className="hover:border-[#4ade80]/50 transition-all cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-4 w-4 text-[#4ade80]" />
            Pool #{pool.poolId.slice(0, 8)}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Funding Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{fundingProgress.toFixed(1)}%</span>
          </div>
          <Progress 
            value={fundingProgress} 
            className="h-3"
          />
          <div className="flex justify-between text-sm">
            <span className="font-semibold">{parseFloat(pool.totalRaised).toFixed(2)} USDC</span>
            <span className="text-muted-foreground">of {parseFloat(pool.fundingGoal).toFixed(2)} USDC</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Contributors</p>
              <p className="font-semibold">{pool.contributorCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">
                {isExpired ? 'Ended' : 'Days Left'}
              </p>
              <p className={`font-semibold ${isExpired ? 'text-destructive' : ''}`}>
                {isExpired ? 'Expired' : daysRemaining}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {pool.status === 'funding' && !isExpired && (
          <Button
            onClick={handleContribute}
            className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Contribute
          </Button>
        )}

        {pool.status === 'funded' && (
          <Button
            onClick={handleCardClick}
            variant="outline"
            className="w-full"
          >
            View Details
          </Button>
        )}

        {(pool.status === 'failed' || (pool.status === 'funding' && isExpired)) && (
          <Button
            onClick={handleCardClick}
            variant="outline"
            className="w-full"
          >
            Request Refund
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
