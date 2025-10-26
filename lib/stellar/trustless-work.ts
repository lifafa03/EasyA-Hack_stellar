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
 * NOTE: Using simplified local escrow creation until Trustless Work API is deployed
 */
export const createEscrow = async (
  params: EscrowParams,
  walletType: WalletType = 'freighter'
): Promise<{ escrowId: string; contractAddress: string; transaction: any }> => {
  try {
    console.log('🏗️ Creating escrow locally (Trustless Work API integration pending)');
    
    // Generate a unique escrow ID
    const escrowId = `ESCROW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // For now, we'll create a simple payment transaction
    // This will be replaced with actual Soroban smart contract deployment
    const { Horizon } = await import('@stellar/stellar-sdk');
    const { getNetworkConfig } = await import('./config');
    const { fundAccountViaFriendbot } = await import('./wallet');
    const config = getNetworkConfig();
    const server = new Horizon.Server(config.horizonUrl);
    
    // Load the client account (fund it first if it doesn't exist on testnet)
    let sourceAccount;
    try {
      sourceAccount = await server.loadAccount(params.clientAddress);
    } catch (error: any) {
      if (error?.response?.status === 404 && config.network === 'TESTNET') {
        console.log('🆕 Client account not found, funding via Friendbot...');
        await fundAccountViaFriendbot(params.clientAddress);
        
        // Wait for transaction to be confirmed
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        sourceAccount = await server.loadAccount(params.clientAddress);
        console.log('✅ Client account funded and activated!');
      } else {
        throw error;
      }
    }
    
    // Build a transaction that represents the escrow creation
    // In production, this would deploy a Soroban contract
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: `escrow_${escrowId.slice(-10)}`,
          value: JSON.stringify({
            project: params.projectId,
            budget: params.totalBudget,
            milestones: params.milestones.length,
          }).slice(0, 64), // Max 64 bytes for data value
        })
      )
      .setTimeout(300)
      .build();

    // Sign and submit the transaction
    const result = await signAndSubmitTransaction(transaction, walletType);

    console.log('✅ Escrow created:', { escrowId, txHash: result.hash });

    // The contract address would be the deployed Soroban contract address
    // For now, using a demo address format
    const contractAddress = `C${escrowId.slice(-10).toUpperCase()}`;

    return {
      escrowId,
      contractAddress,
      transaction: result,
    };
  } catch (error: any) {
    console.error('❌ Error creating escrow:', error);
    
    // Provide more specific error messages
    if (error.response?.status === 404) {
      throw new Error('Account not found on Stellar network. Please ensure your wallet is funded.');
    }
    if (error.message?.includes('op_underfunded')) {
      throw new Error('Insufficient XLM balance to create escrow. Please add funds to your wallet.');
    }
    
    throw new Error(error.message || 'Failed to create escrow contract');
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
