/**
 * Bid Validation with Checkpoints
 * Provides comprehensive validation for on-chain bid proposals
 * Includes 5-checkpoint system with auto-correction
 */

import { toast } from 'sonner';
import { BidProposal, SignedBid, signBidProposal, verifyBidSignature, submitBidToEscrow } from './contracts';
import { executeWithRetry } from './validation';

export interface BidFormData {
  bidAmount: string;
  deliveryDays: string;
  proposal: string;
  portfolioLink?: string;
  milestonesApproach?: string;
}

/**
 * ✅ CHECKPOINT 1: Validate Wallet Connection
 * Ensures freelancer wallet is connected before bidding
 */
export const validateWalletForBid = (
  isConnected: boolean,
  publicKey: string | null
): boolean => {
  if (!isConnected || !publicKey) {
    toast.error('Wallet Not Connected', {
      description: 'Please connect your Stellar wallet to submit a bid.',
    });
    return false;
  }
  
  toast.success('✅ Checkpoint 1/5: Wallet Connected');
  return true;
};

/**
 * ✅ CHECKPOINT 2: Validate Bid Parameters
 * Checks bid amount, delivery time, and proposal content
 */
export const validateBidParameters = (
  bidData: BidFormData,
  projectBudget: number
): {
  valid: boolean;
  errors: string[];
  bidAmount?: number;
  deliveryDays?: number;
} => {
  const errors: string[] = [];
  
  // Validate bid amount
  const bidAmount = parseFloat(bidData.bidAmount);
  if (isNaN(bidAmount) || bidAmount <= 0) {
    errors.push('Bid amount must be greater than 0 USDC');
  } else if (bidAmount > projectBudget * 2) {
    errors.push(`Bid amount seems unusually high (> 2x project budget). Please verify.`);
  }
  
  // Validate delivery time
  const deliveryDays = parseInt(bidData.deliveryDays);
  if (isNaN(deliveryDays) || deliveryDays <= 0) {
    errors.push('Delivery time must be a positive number of days');
  } else if (deliveryDays > 365) {
    errors.push('Delivery time cannot exceed 365 days');
  }
  
  // Validate proposal
  if (!bidData.proposal || bidData.proposal.trim().length < 50) {
    errors.push('Proposal must be at least 50 characters long');
  }
  
  // Validate portfolio link if provided
  if (bidData.portfolioLink && bidData.portfolioLink.trim()) {
    try {
      new URL(bidData.portfolioLink);
    } catch (e) {
      errors.push('Portfolio link must be a valid URL');
    }
  }
  
  if (errors.length > 0) {
    toast.error('❌ Validation Failed', {
      description: errors[0], // Show first error
    });
    return { valid: false, errors };
  }
  
  toast.success('✅ Checkpoint 2/5: Bid Parameters Valid');
  return { 
    valid: true, 
    errors: [],
    bidAmount,
    deliveryDays,
  };
};

/**
 * ✅ CHECKPOINT 3: Sign Bid Proposal
 * Creates cryptographic signature for bid authenticity
 */
export const signBid = async (
  bidProposal: BidProposal,
  walletType: 'freighter' | 'albedo' = 'freighter'
): Promise<{ success: boolean; signedBid?: SignedBid; error?: string }> => {
  try {
    const signedBid = await signBidProposal(bidProposal, walletType);
    
    toast.success('✅ Checkpoint 3/5: Bid Signed Successfully');
    return { success: true, signedBid };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign bid';
    toast.error('❌ Signing Failed', {
      description: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
};

/**
 * ✅ CHECKPOINT 4: Verify Signature
 * Confirms signature is valid before submission
 */
export const verifyBid = async (
  signedBid: SignedBid
): Promise<boolean> => {
  try {
    const isValid = await verifyBidSignature(signedBid);
    
    if (!isValid) {
      toast.error('❌ Signature Verification Failed', {
        description: 'The bid signature is invalid. Please try signing again.',
      });
      return false;
    }
    
    toast.success('✅ Checkpoint 4/5: Signature Verified');
    return true;
  } catch (error) {
    toast.error('❌ Verification Error', {
      description: error instanceof Error ? error.message : 'Failed to verify signature',
    });
    return false;
  }
};

/**
 * ✅ CHECKPOINT 5: Submit to Blockchain
 * Submits signed bid to Trustless Work escrow with auto-retry
 */
export const submitBid = async (
  signedBid: SignedBid,
  walletType: 'freighter' | 'albedo' = 'freighter'
): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
  try {
    // Use executeWithRetry for automatic error correction
    const result = await executeWithRetry(
      () => submitBidToEscrow(signedBid, walletType),
      {
        maxRetries: 3,
        retryDelay: 2000,
      }
    );
    
    if (result.success && result.data) {
      toast.success('✅ Checkpoint 5/5: Bid Submitted Successfully!', {
        description: result.data.transactionHash 
          ? `Transaction: ${result.data.transactionHash.substring(0, 12)}...`
          : 'Your bid is now on-chain',
      });
      return result.data;
    } else {
      toast.error('❌ Submission Failed', {
        description: result.error || 'Failed to submit bid to blockchain',
      });
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    toast.error('❌ Submission Error', {
      description: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
};

/**
 * Complete bid submission flow with all 5 checkpoints
 * Handles the entire process from validation to blockchain submission
 */
export const submitBidWithCheckpoints = async (
  bidData: BidFormData,
  escrowId: string,
  freelancerAddress: string,
  projectBudget: number,
  isWalletConnected: boolean,
  walletType: 'freighter' | 'albedo' = 'freighter'
): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
  try {
    // Checkpoint 1: Wallet Connection
    if (!validateWalletForBid(isWalletConnected, freelancerAddress)) {
      return { success: false, error: 'Wallet not connected' };
    }
    
    // Checkpoint 2: Validate Parameters
    const validation = validateBidParameters(bidData, projectBudget);
    if (!validation.valid || !validation.bidAmount || !validation.deliveryDays) {
      return { success: false, error: validation.errors.join(', ') };
    }
    
    // Create bid proposal
    const bidProposal: BidProposal = {
      escrowId,
      freelancerAddress,
      bidAmount: validation.bidAmount,
      deliveryDays: validation.deliveryDays,
      proposal: bidData.proposal.trim(),
      portfolioLink: bidData.portfolioLink?.trim() || undefined,
      milestonesApproach: bidData.milestonesApproach?.trim() || undefined,
      timestamp: Date.now(),
    };
    
    // Checkpoint 3: Sign Bid
    const signResult = await signBid(bidProposal, walletType);
    if (!signResult.success || !signResult.signedBid) {
      return { success: false, error: signResult.error };
    }
    
    // Checkpoint 4: Verify Signature
    const isVerified = await verifyBid(signResult.signedBid);
    if (!isVerified) {
      return { success: false, error: 'Signature verification failed' };
    }
    
    // Checkpoint 5: Submit to Blockchain
    const submitResult = await submitBid(signResult.signedBid, walletType);
    
    return submitResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    toast.error('❌ Bid Submission Failed', {
      description: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
};
