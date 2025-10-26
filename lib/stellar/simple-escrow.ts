/**
 * Simple Escrow Smart Contract Integration
 * Simplified escrow without complex message signing
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { getNetworkConfig } from './config';
import { signAndSubmitTransaction, WalletType } from './wallet';
import { toast } from 'sonner';

export interface SimpleMilestone {
  id: number;
  title: string;
  amount: number;
  status: 'pending' | 'in-progress' | 'completed';
  completedAt?: number;
}

export interface SimpleEscrow {
  id: string;
  projectId: string;
  clientAddress: string;
  freelancerAddress?: string;
  totalAmount: number;
  releasedAmount: number;
  milestones: SimpleMilestone[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: number;
}

/**
 * Create a simple escrow by locking USDC
 * This creates a payment channel that holds funds until milestones are completed
 */
export const createSimpleEscrow = async (
  projectId: string,
  clientAddress: string,
  totalAmount: number,
  milestones: SimpleMilestone[],
  walletType: WalletType = 'freighter'
): Promise<{ escrowId: string; success: boolean }> => {
  try {
    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    
    // Load client account
    const account = await server.loadAccount(clientAddress);
    
    // Create a unique escrow ID
    const escrowId = `escrow-${projectId}-${Date.now()}`;
    
    // In a real implementation, this would:
    // 1. Create a multi-sig account for the escrow
    // 2. Transfer USDC to that account
    // 3. Set up the escrow rules in a smart contract
    
    // For now, we'll simulate by storing the escrow data
    const escrowData: SimpleEscrow = {
      id: escrowId,
      projectId,
      clientAddress,
      totalAmount,
      releasedAmount: 0,
      milestones,
      status: 'active',
      createdAt: Date.now(),
    };
    
    // Store in localStorage (in production, this would be on-chain)
    localStorage.setItem(`escrow-${escrowId}`, JSON.stringify(escrowData));
    
    toast.success('Escrow created successfully!');
    
    return {
      escrowId,
      success: true,
    };
  } catch (error) {
    console.error('Error creating escrow:', error);
    toast.error('Failed to create escrow');
    throw error;
  }
};

/**
 * Get escrow details
 */
export const getEscrowDetails = (escrowId: string): SimpleEscrow | null => {
  try {
    const stored = localStorage.getItem(`escrow-${escrowId}`);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error getting escrow:', error);
    return null;
  }
};

/**
 * Release a milestone payment
 * Client approves a milestone and releases funds to freelancer
 */
export const releaseMilestonePayment = async (
  escrowId: string,
  milestoneId: number,
  clientAddress: string,
  walletType: WalletType = 'freighter'
): Promise<{ success: boolean; txHash?: string }> => {
  try {
    const escrow = getEscrowDetails(escrowId);
    if (!escrow) {
      throw new Error('Escrow not found');
    }
    
    if (escrow.clientAddress !== clientAddress) {
      throw new Error('Only the client can release milestone payments');
    }
    
    const milestone = escrow.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
      throw new Error('Milestone not found');
    }
    
    if (milestone.status === 'completed') {
      throw new Error('Milestone already completed');
    }
    
    if (!escrow.freelancerAddress) {
      throw new Error('No freelancer assigned to this escrow');
    }
    
    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    
    // Load client account
    const account = await server.loadAccount(clientAddress);
    
    // Create USDC asset
    const usdcAsset = new StellarSdk.Asset(
      'USDC',
      'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
    );
    
    // Create payment transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: escrow.freelancerAddress,
          asset: usdcAsset,
          amount: milestone.amount.toString(),
        })
      )
      .addMemo(StellarSdk.Memo.text(`Milestone: ${milestone.title}`))
      .setTimeout(180)
      .build();
    
    // Sign and submit
    const result = await signAndSubmitTransaction(transaction, walletType);
    
    // Update escrow data
    milestone.status = 'completed';
    milestone.completedAt = Date.now();
    escrow.releasedAmount += milestone.amount;
    
    // Check if all milestones are completed
    const allCompleted = escrow.milestones.every(m => m.status === 'completed');
    if (allCompleted) {
      escrow.status = 'completed';
    }
    
    // Save updated escrow
    localStorage.setItem(`escrow-${escrowId}`, JSON.stringify(escrow));
    
    toast.success(`Released ${milestone.amount} USDC to freelancer`);
    
    return {
      success: true,
      txHash: result.hash,
    };
  } catch (error) {
    console.error('Error releasing milestone:', error);
    toast.error('Failed to release milestone payment');
    throw error;
  }
};

/**
 * Assign freelancer to escrow
 * Called when a bid is accepted
 */
export const assignFreelancerToEscrow = (
  escrowId: string,
  freelancerAddress: string
): boolean => {
  try {
    const escrow = getEscrowDetails(escrowId);
    if (!escrow) {
      throw new Error('Escrow not found');
    }
    
    if (escrow.freelancerAddress) {
      throw new Error('Freelancer already assigned');
    }
    
    escrow.freelancerAddress = freelancerAddress;
    localStorage.setItem(`escrow-${escrowId}`, JSON.stringify(escrow));
    
    return true;
  } catch (error) {
    console.error('Error assigning freelancer:', error);
    return false;
  }
};

/**
 * Submit a bid with USDC payment
 */
export interface SimpleBid {
  id: string;
  projectId: string;
  freelancerAddress: string;
  bidAmount: number;
  deliveryDays: number;
  proposal: string;
  portfolioLink?: string;
  milestonesApproach?: string;
  timestamp: number;
  txHash?: string;
}

export const submitBidWithPayment = async (
  bid: Omit<SimpleBid, 'id' | 'timestamp' | 'txHash'>,
  walletPublicKey: string,
  walletType: WalletType = 'freighter'
): Promise<SimpleBid> => {
  try {
    const StellarSDK = await import('@stellar/stellar-sdk');
    const { signAndSubmitTransaction } = await import('./wallet');
    
    const config = { 
      horizonUrl: 'https://horizon-testnet.stellar.org',
      networkPassphrase: StellarSDK.Networks.TESTNET 
    };
    const server = new StellarSDK.Horizon.Server(config.horizonUrl);
    
    // Check USDC balance
    const account = await server.loadAccount(walletPublicKey);
    const usdcAsset = account.balances.find((b: any) => 
      b.asset_code === 'USDC' && 
      b.asset_issuer === 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
    );
    
    const usdcBalance = usdcAsset ? parseFloat(usdcAsset.balance) : 0;
    
    if (usdcBalance < bid.bidAmount) {
      throw new Error(`Insufficient USDC balance. You have ${usdcBalance.toFixed(2)} USDC but need ${bid.bidAmount} USDC.`);
    }
    
    // Create USDC payment transaction
    const usdcAssetObj = new StellarSDK.Asset(
      'USDC',
      'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
    );
    
    // For demo, send to a pool address (in production, this would be escrow contract)
    // Using the wallet address as placeholder - in production use actual escrow
    const poolAddress = walletPublicKey; // Replace with actual pool/escrow address
    
    const transaction = new StellarSDK.TransactionBuilder(account, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(
        StellarSDK.Operation.payment({
          destination: poolAddress,
          asset: usdcAssetObj,
          amount: bid.bidAmount.toString(),
        })
      )
      .addMemo(StellarSDK.Memo.text(`Bid for project ${bid.projectId}`))
      .setTimeout(180)
      .build();
    
    // Sign and submit
    const result = await signAndSubmitTransaction(transaction, walletType);
    
    // Store bid with transaction hash
    const fullBid: SimpleBid = {
      ...bid,
      id: `bid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      txHash: result.hash,
    };
    
    // Get existing bids for this project
    const bidsKey = `project-${bid.projectId}-bids`;
    const existingBidsJson = localStorage.getItem(bidsKey);
    const existingBids: SimpleBid[] = existingBidsJson ? JSON.parse(existingBidsJson) : [];
    
    // Add new bid
    existingBids.push(fullBid);
    localStorage.setItem(bidsKey, JSON.stringify(existingBids));
    
    toast.success(`Bid submitted! Transferred ${bid.bidAmount} USDC to project pool.`);
    
    return fullBid;
  } catch (error) {
    console.error('Error submitting bid with payment:', error);
    throw error;
  }
};

export const submitSimpleBid = (bid: Omit<SimpleBid, 'id' | 'timestamp'>): SimpleBid => {
  const fullBid: SimpleBid = {
    ...bid,
    id: `bid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
  
  // Get existing bids for this project
  const bidsKey = `project-${bid.projectId}-bids`;
  const existingBidsJson = localStorage.getItem(bidsKey);
  const existingBids: SimpleBid[] = existingBidsJson ? JSON.parse(existingBidsJson) : [];
  
  // Add new bid
  existingBids.push(fullBid);
  localStorage.setItem(bidsKey, JSON.stringify(existingBids));
  
  return fullBid;
};

/**
 * Get all bids for a project
 */
export const getProjectBids = (projectId: string): SimpleBid[] => {
  try {
    const bidsKey = `project-${projectId}-bids`;
    const bidsJson = localStorage.getItem(bidsKey);
    return bidsJson ? JSON.parse(bidsJson) : [];
  } catch (error) {
    console.error('Error getting bids:', error);
    return [];
  }
};
