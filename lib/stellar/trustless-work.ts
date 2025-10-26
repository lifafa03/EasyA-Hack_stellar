/**
 * Trustless Work Integration
 * Connects to Trustless Work API for escrow management
 * Handles project funding, milestone releases, and yield-bearing escrows
 */

import axios from 'axios';
import * as StellarSdk from '@stellar/stellar-sdk';
import { TRUSTLESS_WORK_CONFIG } from './config';
import { signAndSubmitTransaction, WalletType } from './wallet';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: 'pending' | 'in-progress' | 'completed' | 'approved';
  deliverables?: string[];
}

export interface EscrowParams {
  clientAddress: string;
  freelancerAddress: string;
  totalBudget: number;
  milestones: Milestone[];
  projectId: string;
  currency?: 'USDC' | 'XLM';
  enableYield?: boolean;
}

export interface EscrowStatus {
  escrowId: string;
  status: 'active' | 'completed' | 'disputed' | 'cancelled';
  totalFunded: number;
  totalReleased: number;
  currentMilestone: number;
  yieldGenerated?: number;
  contractAddress: string;
}

/**
 * Create a new escrow contract via Trustless Work
 */
export const createEscrow = async (
  params: EscrowParams,
  walletType: WalletType = 'freighter'
): Promise<{ escrowId: string; contractAddress: string; transaction: any }> => {
  try {
    // Generate unique escrow ID
    const escrowId = `ESCROW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const contractAddress = `GESCROW${Math.random().toString(36).substr(2, 9).toUpperCase()}DEMO`;

    // DEMO MODE: For hackathon/testing without actual Trustless Work API
    // In production, this would call the real Trustless Work API
    const DEMO_MODE = !TRUSTLESS_WORK_CONFIG.contractId || TRUSTLESS_WORK_CONFIG.contractId === '';
    
    if (DEMO_MODE) {
      console.log('🎭 DEMO MODE: Simulating escrow creation (no real Trustless Work API call)');
      console.log('Escrow Parameters:', {
        escrowId,
        client: params.clientAddress,
        freelancer: params.freelancerAddress || 'TBD',
        amount: params.totalBudget,
        currency: params.currency || 'USDC',
        milestones: params.milestones.length,
      });

      // Simulate successful escrow creation
      // In a real implementation, this would create an actual Stellar transaction
      return {
        escrowId,
        contractAddress,
        transaction: {
          hash: `DEMO_TX_${Date.now()}`,
          successful: true,
          ledger: Math.floor(Math.random() * 1000000),
        },
      };
    }

    // PRODUCTION MODE: Call actual Trustless Work API
    const response = await axios.post(`${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/create`, {
      client: params.clientAddress,
      freelancer: params.freelancerAddress,
      amount: params.totalBudget,
      milestones: params.milestones,
      currency: params.currency || 'USDC',
      enableYield: params.enableYield || false,
      metadata: {
        projectId: params.projectId,
        platform: 'StellarWork+',
      },
    });

    const { escrowId: apiEscrowId, contractAddress: apiContractAddress, unsignedXdr } = response.data;

    // Step 2: Sign and submit the transaction
    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      unsignedXdr,
      StellarSdk.Networks.TESTNET
    );

    const result = await signAndSubmitTransaction(transaction as StellarSdk.Transaction, walletType);

    return {
      escrowId: apiEscrowId,
      contractAddress: apiContractAddress,
      transaction: result,
    };
  } catch (error) {
    console.error('Error creating escrow:', error);
    throw new Error('Failed to create escrow contract');
  }
};

/**
 * Fund an existing escrow
 */
export const fundEscrow = async (
  escrowId: string,
  amount: number,
  investorAddress: string,
  walletType: WalletType = 'freighter'
): Promise<any> => {
  try {
    const response = await axios.post(`${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${escrowId}/fund`, {
      investor: investorAddress,
      amount,
    });

    const { unsignedXdr } = response.data;

    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      unsignedXdr,
      StellarSdk.Networks.TESTNET
    );

    const result = await signAndSubmitTransaction(transaction as StellarSdk.Transaction, walletType);
    return result;
  } catch (error) {
    console.error('Error funding escrow:', error);
    throw error;
  }
};

/**
 * Release milestone payment
 */
export const releaseMilestone = async (
  escrowId: string,
  milestoneId: string,
  clientAddress: string,
  walletType: WalletType = 'freighter'
): Promise<any> => {
  try {
    const response = await axios.post(
      `${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${escrowId}/release-milestone`,
      {
        milestoneId,
        approver: clientAddress,
      }
    );

    const { unsignedXdr } = response.data;

    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      unsignedXdr,
      StellarSdk.Networks.TESTNET
    );

    const result = await signAndSubmitTransaction(transaction as StellarSdk.Transaction, walletType);
    return result;
  } catch (error) {
    console.error('Error releasing milestone:', error);
    throw error;
  }
};

/**
 * Get escrow status and details
 */
export const getEscrowStatus = async (escrowId: string): Promise<EscrowStatus> => {
  try {
    const response = await axios.get(`${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${escrowId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching escrow status:', error);
    throw error;
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
    return response.data.escrows;
  } catch (error) {
    console.error('Error listing escrows:', error);
    throw error;
  }
};

/**
 * Initiate dispute on an escrow
 */
export const initiateDispute = async (
  escrowId: string,
  initiatorAddress: string,
  reason: string,
  walletType: WalletType = 'freighter'
): Promise<any> => {
  try {
    const response = await axios.post(`${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${escrowId}/dispute`, {
      initiator: initiatorAddress,
      reason,
    });

    const { unsignedXdr } = response.data;

    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      unsignedXdr,
      StellarSdk.Networks.TESTNET
    );

    const result = await signAndSubmitTransaction(transaction as StellarSdk.Transaction, walletType);
    return result;
  } catch (error) {
    console.error('Error initiating dispute:', error);
    throw error;
  }
};

/**
 * Get yield information for an escrow
 */
export const getEscrowYield = async (escrowId: string): Promise<{ apy: number; earned: number }> => {
  try {
    const response = await axios.get(`${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${escrowId}/yield`);
    return response.data;
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
): Promise<any> => {
  try {
    const response = await axios.post(
      `${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/${escrowId}/submit-deliverable`,
      {
        milestoneId,
        freelancer: freelancerAddress,
        deliverableUrl,
        description,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting deliverable:', error);
    throw error;
  }
};
