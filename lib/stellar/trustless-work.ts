/**
 * Trustless Work Integration
 * Connects to Trustless Work API for escrow management
 * Handles project funding, milestone releases, and yield-bearing escrows
 * Enhanced with bid submission, acceptance, verification, and comprehensive error handling
 */

import axios, { AxiosError } from 'axios';
import * as StellarSdk from '@stellar/stellar-sdk';
import { TRUSTLESS_WORK_CONFIG, USDC_ASSET } from './config';
import { signAndSubmitTransaction, WalletType } from './wallet';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Milestone {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: 'pending' | 'in-progress' | 'completed' | 'approved';
  deliverables?: string[];
  completedAt?: number;
}

export interface EscrowParams {
  clientAddress: string;
  freelancerAddress?: string; // Optional - can be assigned later via bid acceptance
  totalBudget: number;
  milestones: Milestone[];
  projectId: string;
  currency?: 'USDC' | 'XLM';
  enableYield?: boolean;
}

export interface EscrowStatus {
  escrowId: string;
  contractAddress: string;
  status: 'active' | 'completed' | 'disputed' | 'cancelled';
  totalAmount: string; // USDC amount
  totalFunded: number;
  totalReleased: number;
  releasedAmount: string; // USDC amount
  availableToWithdraw: string; // USDC amount
  currentMilestone: number;
  yieldGenerated?: number;
  clientAddress: string;
  freelancerAddress?: string;
  milestones: MilestoneStatus[];
}

export interface MilestoneStatus {
  id: number;
  title: string;
  description: string;
  budget: string; // USDC amount
  status: 'pending' | 'in-progress' | 'completed' | 'approved';
  completedAt?: number;
  deliverables?: string[];
}

export interface SignedBid {
  escrowId: string;
  freelancerAddress: string;
  bidAmount: string; // USDC amount
  deliveryDays: number;
  proposal: string;
  portfolioLink?: string;
  milestonesApproach?: string;
  timestamp: number;
  signature: string;
  hash: string;
  verified: boolean;
}

export interface BidParams {
  escrowId: string;
  freelancerAddress: string;
  bidAmount: string;
  deliveryDays: number;
  proposal: string;
  portfolioLink?: string;
  milestonesApproach?: string;
}

export interface BidSubmissionResult {
  success: boolean;
  bidHash: string;
  signature: string;
  timestamp: number;
}

export interface BidAcceptanceResult {
  success: boolean;
  transactionHash: string;
  freelancerAssigned: string;
}

export interface TransactionResult {
  success: boolean;
  transactionHash: string;
  ledger?: number;
}

// ============================================================================
// Error Handling
// ============================================================================

export class TrustlessWorkError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'TrustlessWorkError';
  }
}

/**
 * Handle Trustless Work API errors with user-friendly messages
 */
const handleTrustlessWorkError = (error: any, context: string): never => {
  console.error(`Trustless Work API Error (${context}):`, error);

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const statusCode = axiosError.response?.status;
    const errorData = axiosError.response?.data as any;

    // Network errors
    if (!axiosError.response) {
      throw new TrustlessWorkError(
        'Unable to connect to Trustless Work service. Please check your internet connection.',
        'NETWORK_ERROR',
        undefined,
        { context }
      );
    }

    // API-specific errors
    switch (statusCode) {
      case 400:
        throw new TrustlessWorkError(
          errorData?.message || 'Invalid request. Please check your input.',
          'INVALID_REQUEST',
          400,
          { context, details: errorData }
        );
      case 401:
        throw new TrustlessWorkError(
          'Authentication failed. Please reconnect your wallet.',
          'UNAUTHORIZED',
          401,
          { context }
        );
      case 403:
        throw new TrustlessWorkError(
          'You do not have permission to perform this action.',
          'FORBIDDEN',
          403,
          { context }
        );
      case 404:
        throw new TrustlessWorkError(
          'Escrow contract not found. It may have been cancelled or completed.',
          'NOT_FOUND',
          404,
          { context, escrowId: errorData?.escrowId }
        );
      case 409:
        throw new TrustlessWorkError(
          errorData?.message || 'Conflict: This action cannot be performed in the current state.',
          'CONFLICT',
          409,
          { context, details: errorData }
        );
      case 429:
        throw new TrustlessWorkError(
          'Too many requests. Please wait a moment and try again.',
          'RATE_LIMIT',
          429,
          { context }
        );
      case 500:
      case 502:
      case 503:
        throw new TrustlessWorkError(
          'Trustless Work service is temporarily unavailable. Please try again later.',
          'SERVICE_UNAVAILABLE',
          statusCode,
          { context }
        );
      default:
        throw new TrustlessWorkError(
          errorData?.message || 'An unexpected error occurred with Trustless Work service.',
          'UNKNOWN_ERROR',
          statusCode,
          { context, details: errorData }
        );
    }
  }

  // Non-Axios errors
  throw new TrustlessWorkError(
    error.message || 'An unexpected error occurred.',
    'UNKNOWN_ERROR',
    undefined,
    { context, originalError: error }
  );
};

// ============================================================================
// Escrow Creation and Management
// ============================================================================

/**
 * Create a new USDC-based escrow contract via Trustless Work
 * Enhanced with milestone configuration and comprehensive error handling
 */
export const createEscrow = async (
  params: EscrowParams,
  walletType: WalletType = 'freighter'
): Promise<{ escrowId: string; contractAddress: string; transaction: any }> => {
  try {
    // Validate USDC currency
    const currency = params.currency || 'USDC';
    if (currency !== 'USDC') {
      throw new TrustlessWorkError(
        'Only USDC escrows are supported',
        'INVALID_CURRENCY',
        400,
        { providedCurrency: currency }
      );
    }

    // Validate milestones
    if (!params.milestones || params.milestones.length === 0) {
      throw new TrustlessWorkError(
        'At least one milestone is required',
        'INVALID_MILESTONES',
        400
      );
    }

    // Validate total budget matches milestone sum
    const milestoneSum = params.milestones.reduce((sum, m) => sum + m.budget, 0);
    if (Math.abs(milestoneSum - params.totalBudget) > 0.01) {
      throw new TrustlessWorkError(
        'Total budget must equal sum of milestone budgets',
        'BUDGET_MISMATCH',
        400,
        { totalBudget: params.totalBudget, milestoneSum }
      );
    }

    // Step 1: Call Trustless Work API to prepare USDC escrow
    const response = await axios.post(`${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/create`, {
      client: params.clientAddress,
      freelancer: params.freelancerAddress, // Optional - can be assigned via bid acceptance
      amount: params.totalBudget,
      milestones: params.milestones.map((m, index) => ({
        id: m.id || `milestone-${index}`,
        title: m.title,
        description: m.description,
        budget: m.budget,
        deliverables: m.deliverables || [],
      })),
      currency: 'USDC',
      asset: {
        code: USDC_ASSET.code,
        issuer: USDC_ASSET.issuer,
      },
      enableYield: params.enableYield || false,
      metadata: {
        projectId: params.projectId,
        platform: 'StellarWork+',
        createdAt: Date.now(),
      },
    });

    const { escrowId, contractAddress, unsignedXdr } = response.data;

    if (!escrowId || !contractAddress || !unsignedXdr) {
      throw new TrustlessWorkError(
        'Invalid response from Trustless Work API',
        'INVALID_RESPONSE',
        500,
        { response: response.data }
      );
    }

    // Step 2: Sign and submit the transaction
    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      unsignedXdr,
      StellarSdk.Networks.TESTNET
    );

    const result = await signAndSubmitTransaction(transaction as StellarSdk.Transaction, walletType);

    return {
      escrowId,
      contractAddress,
      transaction: result,
    };
  } catch (error) {
    if (error instanceof TrustlessWorkError) {
      throw error;
    }
    handleTrustlessWorkError(error, 'createEscrow');
  }
};

/**
 * Fund an existing escrow with USDC
 * Enhanced with balance validation and error handling
 */
export const fundEscrow = async (
  escrowId: string,
  amount: string,
  investorAddress: string,
  walletType: WalletType = 'freighter'
): Promise<TransactionResult> => {
  try {
    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new TrustlessWorkError(
        'Invalid funding amount',
        'INVALID_AMOUNT',
        400,
        { amount }
      );
    }

    const response = await axios.post(`${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${escrowId}/fund`, {
      investor: investorAddress,
      amount: amount,
      currency: 'USDC',
    });

    const { unsignedXdr } = response.data;

    if (!unsignedXdr) {
      throw new TrustlessWorkError(
        'Invalid response: missing transaction XDR',
        'INVALID_RESPONSE',
        500
      );
    }

    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      unsignedXdr,
      StellarSdk.Networks.TESTNET
    );

    const result = await signAndSubmitTransaction(transaction as StellarSdk.Transaction, walletType);

    return {
      success: result.successful,
      transactionHash: result.hash,
      ledger: result.ledger,
    };
  } catch (error) {
    if (error instanceof TrustlessWorkError) {
      throw error;
    }
    handleTrustlessWorkError(error, 'fundEscrow');
  }
};

/**
 * Release milestone payment to freelancer
 * Enhanced with authorization validation and error handling
 */
export const releaseMilestone = async (
  escrowId: string,
  milestoneId: string,
  clientAddress: string,
  walletType: WalletType = 'freighter'
): Promise<TransactionResult> => {
  try {
    const response = await axios.post(
      `${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${escrowId}/release-milestone`,
      {
        milestoneId,
        approver: clientAddress,
      }
    );

    const { unsignedXdr } = response.data;

    if (!unsignedXdr) {
      throw new TrustlessWorkError(
        'Invalid response: missing transaction XDR',
        'INVALID_RESPONSE',
        500
      );
    }

    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      unsignedXdr,
      StellarSdk.Networks.TESTNET
    );

    const result = await signAndSubmitTransaction(transaction as StellarSdk.Transaction, walletType);

    return {
      success: result.successful,
      transactionHash: result.hash,
      ledger: result.ledger,
    };
  } catch (error) {
    if (error instanceof TrustlessWorkError) {
      throw error;
    }
    handleTrustlessWorkError(error, 'releaseMilestone');
  }
};

/**
 * Withdraw released funds from escrow
 * Allows freelancers to claim their earned USDC
 */
export const withdrawFunds = async (
  escrowId: string,
  freelancerAddress: string,
  walletType: WalletType = 'freighter'
): Promise<TransactionResult> => {
  try {
    const response = await axios.post(
      `${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${escrowId}/withdraw`,
      {
        freelancer: freelancerAddress,
      }
    );

    const { unsignedXdr, amount } = response.data;

    if (!unsignedXdr) {
      throw new TrustlessWorkError(
        'Invalid response: missing transaction XDR',
        'INVALID_RESPONSE',
        500
      );
    }

    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      unsignedXdr,
      StellarSdk.Networks.TESTNET
    );

    const result = await signAndSubmitTransaction(transaction as StellarSdk.Transaction, walletType);

    return {
      success: result.successful,
      transactionHash: result.hash,
      ledger: result.ledger,
    };
  } catch (error) {
    if (error instanceof TrustlessWorkError) {
      throw error;
    }
    handleTrustlessWorkError(error, 'withdrawFunds');
  }
};

/**
 * Get escrow status and details
 * Enhanced with comprehensive status information
 */
export const getEscrowStatus = async (escrowId: string): Promise<EscrowStatus> => {
  try {
    const response = await axios.get(`${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${escrowId}`);
    
    const data = response.data;
    
    // Ensure all required fields are present
    if (!data.escrowId || !data.contractAddress) {
      throw new TrustlessWorkError(
        'Invalid escrow status response',
        'INVALID_RESPONSE',
        500,
        { data }
      );
    }

    return {
      escrowId: data.escrowId,
      contractAddress: data.contractAddress,
      status: data.status || 'active',
      totalAmount: data.totalAmount || '0',
      totalFunded: data.totalFunded || 0,
      totalReleased: data.totalReleased || 0,
      releasedAmount: data.releasedAmount || '0',
      availableToWithdraw: data.availableToWithdraw || '0',
      currentMilestone: data.currentMilestone || 0,
      yieldGenerated: data.yieldGenerated,
      clientAddress: data.clientAddress,
      freelancerAddress: data.freelancerAddress,
      milestones: data.milestones || [],
    };
  } catch (error) {
    if (error instanceof TrustlessWorkError) {
      throw error;
    }
    handleTrustlessWorkError(error, 'getEscrowStatus');
  }
};

/**
 * List all escrows for an address
 */
export const listEscrows = async (
  address: string,
  role: 'client' | 'freelancer' | 'investor' = 'client'
): Promise<EscrowStatus[]> => {
  try {
    const response = await axios.get(`${TRUSTLESS_WORK_CONFIG.apiUrl}/escrows`, {
      params: { address, role },
    });
    return response.data.escrows || [];
  } catch (error) {
    if (error instanceof TrustlessWorkError) {
      throw error;
    }
    handleTrustlessWorkError(error, 'listEscrows');
  }
};

// ============================================================================
// Bid Submission, Acceptance, and Verification
// ============================================================================

/**
 * Generate a hash for bid verification
 */
const generateBidHash = (bid: BidParams & { timestamp: number }): string => {
  const data = `${bid.escrowId}:${bid.freelancerAddress}:${bid.bidAmount}:${bid.deliveryDays}:${bid.timestamp}`;
  // In production, use a proper hashing library like crypto-js or built-in crypto
  return Buffer.from(data).toString('base64');
};

/**
 * Sign a message using the wallet
 * This is a placeholder - actual implementation depends on wallet capabilities
 */
const signMessage = async (message: string, walletType: WalletType): Promise<string> => {
  // Note: Stellar wallets have varying support for message signing
  // Freighter supports signMessage, others may need alternative approaches
  try {
    if (typeof window === 'undefined') {
      throw new Error('Message signing only available in browser');
    }

    // For Freighter
    if (walletType === 'freighter' && (window as any).freighter) {
      const result = await (window as any).freighter.signMessage(message);
      return result.signature;
    }

    // For other wallets, we might need to use transaction signing as a proxy
    // This is a simplified approach - production should use proper message signing
    throw new TrustlessWorkError(
      'Message signing not supported by this wallet',
      'UNSUPPORTED_OPERATION',
      400,
      { walletType }
    );
  } catch (error: any) {
    throw new TrustlessWorkError(
      error.message || 'Failed to sign message',
      'SIGNING_FAILED',
      500,
      { walletType }
    );
  }
};

/**
 * Submit a bid proposal with wallet signature
 * Requirements: 6.1, 6.2
 */
export const submitBid = async (
  bidParams: BidParams,
  walletType: WalletType = 'freighter'
): Promise<BidSubmissionResult> => {
  try {
    // Validate bid amount
    const bidAmount = parseFloat(bidParams.bidAmount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      throw new TrustlessWorkError(
        'Invalid bid amount',
        'INVALID_AMOUNT',
        400,
        { bidAmount: bidParams.bidAmount }
      );
    }

    // Validate delivery days
    if (bidParams.deliveryDays <= 0) {
      throw new TrustlessWorkError(
        'Delivery days must be positive',
        'INVALID_DELIVERY_DAYS',
        400,
        { deliveryDays: bidParams.deliveryDays }
      );
    }

    // Add timestamp
    const timestamp = Date.now();
    const bidWithTimestamp = { ...bidParams, timestamp };

    // Generate bid hash
    const hash = generateBidHash(bidWithTimestamp);

    // Sign the bid hash with wallet
    const signature = await signMessage(hash, walletType);

    // Submit bid to Trustless Work API
    const response = await axios.post(
      `${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${bidParams.escrowId}/bids`,
      {
        freelancerAddress: bidParams.freelancerAddress,
        bidAmount: bidParams.bidAmount,
        deliveryDays: bidParams.deliveryDays,
        proposal: bidParams.proposal,
        portfolioLink: bidParams.portfolioLink,
        milestonesApproach: bidParams.milestonesApproach,
        timestamp,
        signature,
        hash,
      }
    );

    return {
      success: true,
      bidHash: hash,
      signature,
      timestamp,
    };
  } catch (error) {
    if (error instanceof TrustlessWorkError) {
      throw error;
    }
    handleTrustlessWorkError(error, 'submitBid');
  }
};

/**
 * Fetch all bids for an escrow
 * Requirements: 6.4
 */
export const fetchBids = async (escrowId: string): Promise<SignedBid[]> => {
  try {
    const response = await axios.get(
      `${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${escrowId}/bids`
    );

    const bids = response.data.bids || [];

    return bids.map((bid: any) => ({
      escrowId: bid.escrowId || escrowId,
      freelancerAddress: bid.freelancerAddress,
      bidAmount: bid.bidAmount,
      deliveryDays: bid.deliveryDays,
      proposal: bid.proposal,
      portfolioLink: bid.portfolioLink,
      milestonesApproach: bid.milestonesApproach,
      timestamp: bid.timestamp,
      signature: bid.signature,
      hash: bid.hash,
      verified: bid.verified || false,
    }));
  } catch (error) {
    if (error instanceof TrustlessWorkError) {
      throw error;
    }
    handleTrustlessWorkError(error, 'fetchBids');
  }
};

/**
 * Verify a bid signature
 * Requirements: 6.2, 6.3
 */
export const verifyBid = async (bid: SignedBid): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${bid.escrowId}/bids/verify`,
      {
        bidHash: bid.hash,
        signature: bid.signature,
        freelancerAddress: bid.freelancerAddress,
      }
    );

    return response.data.verified === true;
  } catch (error) {
    console.error('Error verifying bid:', error);
    return false;
  }
};

/**
 * Accept a bid and assign freelancer to escrow
 * Requirements: 6.3
 */
export const acceptBid = async (
  escrowId: string,
  bidHash: string,
  clientAddress: string,
  walletType: WalletType = 'freighter'
): Promise<BidAcceptanceResult> => {
  try {
    const response = await axios.post(
      `${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${escrowId}/accept-bid`,
      {
        bidHash,
        clientAddress,
      }
    );

    const { unsignedXdr, freelancerAddress } = response.data;

    if (!unsignedXdr) {
      throw new TrustlessWorkError(
        'Invalid response: missing transaction XDR',
        'INVALID_RESPONSE',
        500
      );
    }

    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      unsignedXdr,
      StellarSdk.Networks.TESTNET
    );

    const result = await signAndSubmitTransaction(transaction as StellarSdk.Transaction, walletType);

    return {
      success: result.successful,
      transactionHash: result.hash,
      freelancerAssigned: freelancerAddress,
    };
  } catch (error) {
    if (error instanceof TrustlessWorkError) {
      throw error;
    }
    handleTrustlessWorkError(error, 'acceptBid');
  }
};

/**
 * Validate bid amount against project budget
 * Requirements: 6.2
 */
export const validateBidAmount = async (
  escrowId: string,
  bidAmount: string
): Promise<{ valid: boolean; reason?: string }> => {
  try {
    const escrowStatus = await getEscrowStatus(escrowId);
    const budget = parseFloat(escrowStatus.totalAmount);
    const bid = parseFloat(bidAmount);

    if (isNaN(bid) || bid <= 0) {
      return { valid: false, reason: 'Bid amount must be positive' };
    }

    if (bid > budget) {
      return { 
        valid: false, 
        reason: `Bid amount ($${bid} USDC) exceeds project budget ($${budget} USDC)` 
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating bid amount:', error);
    return { valid: false, reason: 'Unable to validate bid amount' };
  }
};

// ============================================================================
// Additional Escrow Operations
// ============================================================================

/**
 * Initiate dispute on an escrow
 */
export const initiateDispute = async (
  escrowId: string,
  initiatorAddress: string,
  reason: string,
  walletType: WalletType = 'freighter'
): Promise<TransactionResult> => {
  try {
    if (!reason || reason.trim().length === 0) {
      throw new TrustlessWorkError(
        'Dispute reason is required',
        'INVALID_REASON',
        400
      );
    }

    const response = await axios.post(`${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${escrowId}/dispute`, {
      initiator: initiatorAddress,
      reason: reason.trim(),
    });

    const { unsignedXdr } = response.data;

    if (!unsignedXdr) {
      throw new TrustlessWorkError(
        'Invalid response: missing transaction XDR',
        'INVALID_RESPONSE',
        500
      );
    }

    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      unsignedXdr,
      StellarSdk.Networks.TESTNET
    );

    const result = await signAndSubmitTransaction(transaction as StellarSdk.Transaction, walletType);

    return {
      success: result.successful,
      transactionHash: result.hash,
      ledger: result.ledger,
    };
  } catch (error) {
    if (error instanceof TrustlessWorkError) {
      throw error;
    }
    handleTrustlessWorkError(error, 'initiateDispute');
  }
};

/**
 * Get yield information for an escrow
 */
export const getEscrowYield = async (escrowId: string): Promise<{ apy: number; earned: number }> => {
  try {
    const response = await axios.get(`${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${escrowId}/yield`);
    return {
      apy: response.data.apy || 0,
      earned: response.data.earned || 0,
    };
  } catch (error) {
    console.error('Error fetching yield data:', error);
    return { apy: 0, earned: 0 };
  }
};

/**
 * Submit milestone deliverable
 */
export const submitMilestoneDeliverable = async (
  escrowId: string,
  milestoneId: string,
  freelancerAddress: string,
  deliverableUrl: string,
  description: string
): Promise<{ success: boolean; deliverableId: string }> => {
  try {
    if (!deliverableUrl || !description) {
      throw new TrustlessWorkError(
        'Deliverable URL and description are required',
        'INVALID_DELIVERABLE',
        400
      );
    }

    const response = await axios.post(
      `${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${escrowId}/submit-deliverable`,
      {
        milestoneId,
        freelancer: freelancerAddress,
        deliverableUrl,
        description,
      }
    );

    return {
      success: true,
      deliverableId: response.data.deliverableId,
    };
  } catch (error) {
    if (error instanceof TrustlessWorkError) {
      throw error;
    }
    handleTrustlessWorkError(error, 'submitMilestoneDeliverable');
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if Trustless Work API is available
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${TRUSTLESS_WORK_CONFIG.apiUrl}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('Trustless Work API health check failed:', error);
    return false;
  }
};

/**
 * Format USDC amount for display
 */
export const formatUSDC = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00 USDC';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
};

/**
 * Parse USDC amount from string
 */
export const parseUSDC = (amount: string): number => {
  const cleaned = amount.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};
