/**
 * Bid Card Component
 * Displays bid information with verification status
 * Shows verified vs unverified bids with visual indicators
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertCircle, ExternalLink, Shield, Clock, DollarSign } from 'lucide-react';
import { SimpleBid } from '@/lib/stellar/simple-escrow';

interface BidCardProps {
  bid: SimpleBid;
  isClient?: boolean;
  onAcceptBid?: (bid: SimpleBid) => void;
  isAccepting?: boolean;
}

export function BidCard({ bid, isClient = false, onAcceptBid, isAccepting = false }: BidCardProps) {
  return (
    <Card className={`bg-surface-dark transition-all ${bid.verified ? 'border-green-500/20' : 'border-yellow-500/20'}`}>
      <div className="p-6">
        {/* Header with freelancer info and bid amount */}
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
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-5 w-5 text-[#22c55e]" />
              <p className="text-2xl font-bold text-[#22c55e]">
                {parseFloat(bid.bidAmount).toLocaleString()} USDC
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted">
              <Clock className="h-4 w-4" />
              <span>{bid.deliveryDays} days delivery</span>
            </div>
          </div>
        </div>

        {/* Verification Status Badge */}
        <div className="mb-4">
          {bid.verified ? (
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified Signature
            </Badge>
          ) : (
            <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              <AlertCircle className="h-3 w-3 mr-1" />
              Unverified
            </Badge>
          )}
        </div>

        {/* Proposal Content */}
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-2">Proposal</h4>
            <p className="text-sm text-muted leading-relaxed">{bid.proposal}</p>
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
              <p className="text-sm text-muted leading-relaxed">{bid.milestonesApproach}</p>
            </div>
          )}

          <Separator />

          {/* Footer with metadata and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {bid.verified ? (
                <>
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">Cryptographically Verified</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-500">Off-chain Bid</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted">
              Submitted: {new Date(bid.timestamp).toLocaleDateString()}
            </p>
          </div>

          {/* Accept Bid Button (only for clients with verified bids) */}
          {isClient && bid.verified && onAcceptBid && (
            <Button
              size="sm"
              className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white mt-3"
              onClick={() => onAcceptBid(bid)}
              disabled={isAccepting}
            >
              {isAccepting ? 'Accepting...' : 'Accept Bid'}
            </Button>
          )}

          {/* Warning for unverified bids */}
          {!bid.verified && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="text-xs text-yellow-500">
                  <p className="font-semibold mb-1">Unverified Bid</p>
                  <p>This bid was not cryptographically signed and cannot be verified on-chain. Exercise caution.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Bid List Component
 * Displays a list of bids with filtering options
 */
interface BidListProps {
  bids: SignedBid[];
  isClient?: boolean;
  onAcceptBid?: (bid: SignedBid) => void;
  isAccepting?: boolean;
  showVerifiedOnly?: boolean;
}

export function BidList({ 
  bids, 
  isClient = false, 
  onAcceptBid, 
  isAccepting = false,
  showVerifiedOnly = false 
}: BidListProps) {
  const filteredBids = showVerifiedOnly 
    ? bids.filter(bid => bid.verified)
    : bids;

  const verifiedCount = bids.filter(bid => bid.verified).length;
  const unverifiedCount = bids.length - verifiedCount;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-muted">{verifiedCount} verified</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <span className="text-muted">{unverifiedCount} unverified</span>
        </div>
      </div>

      {/* Bid Cards */}
      {filteredBids.length > 0 ? (
        <div className="space-y-4">
          {filteredBids.map((bid) => (
            <BidCard
              key={bid.hash}
              bid={bid}
              isClient={isClient}
              onAcceptBid={onAcceptBid}
              isAccepting={isAccepting}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-surface-dark p-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Bids Found</h3>
            <p className="text-sm text-muted">
              {showVerifiedOnly 
                ? 'No verified bids available yet.'
                : 'No bids have been submitted for this project yet.'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
