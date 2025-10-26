/**
 * Crowdfunding Service
 * Handles crowdfunding pool contract interactions including pool creation,
 * contributions, and finalization
 */

import { Contract, nativeToScVal, Address, scValToNative } from '@stellar/stellar-sdk';
import { StellarSDK } from '../sdk';
import { StellarError, ErrorCode, Signer } from '../types';
import { Observable, Subject } from 'rxjs';

export interface CreatePoolParams {
  fundingGoal: string;
  deadline: number; // Unix timestamp
  projectDescription?: string;
}

export interface PoolInfo {
  poolId: string;
  projectOwner: string;
  fundingGoal: string;
  deadline: number;
  totalRaised: string;
  contributorCount: number;
  status: 'funding' | 'funded' | 'failed';
  escrowContract?: string;
  createdAt: number;
}

export interface ContributorInfo {
  address: string;
  amount: string;
  contributedAt: number;
}

export interface PoolEvent {
  type: 'created' | 'contribution' | 'finalized' | 'refunded';
  poolId: string;
  data: any;
  timestamp: string;
}

export class CrowdfundingService {
  private contract: Contract;
  private eventSubjects: Map<string, Subject<PoolEvent>> = new Map();

  constructor(private sdk: StellarSDK) {
    const contractId = sdk.getConfig().contractIds.pool;
    if (!contractId) {
      throw new StellarError(
        'Crowdfunding pool contract ID not configured',
        ErrorCode.CONTRACT_ERROR
      );
    }
    this.contract = new Contract(contractId);
  }

  /**
   * Create a new crowdfunding pool
   */
  async createPool(
    params: CreatePoolParams,
    signer: Signer
  ): Promise<string> {
    try {
      // Validate parameters
      this.validateCreatePoolParams(params);

      const sourcePublicKey = signer.getPublicKey();

      // Convert parameters to Soroban values
      const args = [
        new Address(sourcePublicKey).toScVal(), // project owner
        nativeToScVal(params.fundingGoal, { type: 'i128' }), // funding goal
        nativeToScVal(params.deadline, { type: 'u64' }), // deadline
      ];

      // Build transaction
      const operation = this.contract.call('initialize', ...args);
      const transaction = await this.sdk.buildTransaction(
        sourcePublicKey,
        [operation],
        { timeout: 300 }
      );

      // Sign and submit
      const result = await this.sdk.signAndSubmit(transaction, signer);

      if (result.status !== 'success') {
        throw new StellarError(
          'Failed to create crowdfunding pool',
          ErrorCode.CONTRACT_ERROR,
          result
        );
      }

      // Return pool ID (in real implementation, extract from transaction result)
      const poolId = this.sdk.getConfig().contractIds.pool!;
      
      return poolId;
    } catch (error) {
      if (error instanceof StellarError) {
        throw error;
      }
      throw new StellarError(
        'Failed to create pool',
        ErrorCode.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Contribute to a crowdfunding pool
   */
  async contribute(
    poolId: string,
    amount: string,
    signer: Signer
  ): Promise<void> {
    try {
      // Validate amount
      if (!amount || parseFloat(amount) <= 0) {
        throw new StellarError(
          'Contribution amount must be greater than 0',
          ErrorCode.INVALID_PARAMS
        );
      }

      const sourcePublicKey = signer.getPublicKey();

      const args = [
        nativeToScVal(amount, { type: 'i128' }),
      ];

      const operation = this.contract.call('contribute', ...args);
      const transaction = await this.sdk.buildTransaction(
        sourcePublicKey,
        [operation]
      );

      const result = await this.sdk.signAndSubmit(transaction, signer);

      if (result.status !== 'success') {
        throw new StellarError(
          'Failed to contribute to pool',
          ErrorCode.CONTRACT_ERROR,
          result
        );
      }

      // Emit event
      this.emitEvent(poolId, {
        type: 'contribution',
        poolId,
        data: { contributor: sourcePublicKey, amount },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof StellarError) {
        throw error;
      }
      throw new StellarError(
        'Failed to contribute to pool',
        ErrorCode.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Finalize a crowdfunding pool (close funding and create escrow if goal met)
   */
  async finalizePool(
    poolId: string,
    signer: Signer
  ): Promise<void> {
    try {
      const sourcePublicKey = signer.getPublicKey();

      const operation = this.contract.call('finalize');
      const transaction = await this.sdk.buildTransaction(
        sourcePublicKey,
        [operation]
      );

      const result = await this.sdk.signAndSubmit(transaction, signer);

      if (result.status !== 'success') {
        throw new StellarError(
          'Failed to finalize pool',
          ErrorCode.CONTRACT_ERROR,
          result
        );
      }

      // Emit event
      this.emitEvent(poolId, {
        type: 'finalized',
        poolId,
        data: {},
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof StellarError) {
        throw error;
      }
      throw new StellarError(
        'Failed to finalize pool',
        ErrorCode.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Request refund from a failed pool
   */
  async requestRefund(
    poolId: string,
    signer: Signer
  ): Promise<void> {
    try {
      const sourcePublicKey = signer.getPublicKey();

      const operation = this.contract.call('refund');
      const transaction = await this.sdk.buildTransaction(
        sourcePublicKey,
        [operation]
      );

      const result = await this.sdk.signAndSubmit(transaction, signer);

      if (result.status !== 'success') {
        throw new StellarError(
          'Failed to request refund',
          ErrorCode.CONTRACT_ERROR,
          result
        );
      }

      // Emit event
      this.emitEvent(poolId, {
        type: 'refunded',
        poolId,
        data: { contributor: sourcePublicKey },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof StellarError) {
        throw error;
      }
      throw new StellarError(
        'Failed to request refund',
        ErrorCode.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Get pool information and status
   */
  async getPoolInfo(poolId: string): Promise<PoolInfo> {
    try {
      // Query contract state
      const ownerData = await this.sdk.getContractData(poolId, 'project_owner');
      const goalData = await this.sdk.getContractData(poolId, 'funding_goal');
      const deadlineData = await this.sdk.getContractData(poolId, 'deadline');
      const raisedData = await this.sdk.getContractData(poolId, 'total_raised');
      const statusData = await this.sdk.getContractData(poolId, 'status');
      const contributorsData = await this.sdk.getContractData(poolId, 'contributors');

      // Parse the data (simplified - actual implementation would parse XDR)
      const poolInfo: PoolInfo = {
        poolId,
        projectOwner: scValToNative(ownerData),
        fundingGoal: scValToNative(goalData),
        deadline: scValToNative(deadlineData),
        totalRaised: scValToNative(raisedData),
        contributorCount: this.getContributorCount(scValToNative(contributorsData)),
        status: this.parsePoolStatus(scValToNative(statusData)),
        createdAt: Date.now(), // Would be fetched from contract
      };

      // Get escrow contract if pool is funded
      if (poolInfo.status === 'funded') {
        const escrowData = await this.sdk.getContractData(poolId, 'escrow_contract');
        poolInfo.escrowContract = scValToNative(escrowData);
      }

      return poolInfo;
    } catch (error) {
      throw new StellarError(
        'Failed to get pool info',
        ErrorCode.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Get list of contributors for a pool
   */
  async getContributors(poolId: string): Promise<ContributorInfo[]> {
    try {
      const contributorsData = await this.sdk.getContractData(poolId, 'contributors');
      const contributors = scValToNative(contributorsData);

      // Parse contributors map (simplified)
      return Object.entries(contributors).map(([address, amount]) => ({
        address,
        amount: amount as string,
        contributedAt: Date.now(), // Would be fetched from contract events
      }));
    } catch (error) {
      throw new StellarError(
        'Failed to get contributors',
        ErrorCode.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Watch pool for real-time updates
   */
  watchPool(poolId: string): Observable<PoolEvent> {
    if (!this.eventSubjects.has(poolId)) {
      const subject = new Subject<PoolEvent>();
      this.eventSubjects.set(poolId, subject);

      // Subscribe to contract events
      this.sdk.subscribeToContractEvents(poolId, (event) => {
        const poolEvent: PoolEvent = {
          type: this.parseEventType(event.type),
          poolId,
          data: event.data,
          timestamp: event.timestamp,
        };
        subject.next(poolEvent);
      });
    }

    return this.eventSubjects.get(poolId)!.asObservable();
  }

  /**
   * Validate create pool parameters
   */
  private validateCreatePoolParams(params: CreatePoolParams): void {
    if (!params.fundingGoal || parseFloat(params.fundingGoal) <= 0) {
      throw new StellarError(
        'Funding goal must be greater than 0',
        ErrorCode.INVALID_PARAMS
      );
    }

    if (!params.deadline || params.deadline <= Date.now() / 1000) {
      throw new StellarError(
        'Deadline must be in the future',
        ErrorCode.INVALID_PARAMS
      );
    }

    // Validate deadline is not too far in the future (e.g., max 1 year)
    const oneYearFromNow = Date.now() / 1000 + (365 * 24 * 60 * 60);
    if (params.deadline > oneYearFromNow) {
      throw new StellarError(
        'Deadline cannot be more than 1 year in the future',
        ErrorCode.INVALID_PARAMS
      );
    }
  }

  /**
   * Parse pool status from contract data
   */
  private parsePoolStatus(status: any): 'funding' | 'funded' | 'failed' {
    // Simplified parsing - actual implementation would parse XDR enum
    if (status === 0) return 'funding';
    if (status === 1) return 'funded';
    if (status === 2) return 'failed';
    return 'funding';
  }

  /**
   * Get contributor count from contributors map
   */
  private getContributorCount(contributors: any): number {
    if (!contributors || typeof contributors !== 'object') {
      return 0;
    }
    return Object.keys(contributors).length;
  }

  /**
   * Parse event type from contract event
   */
  private parseEventType(type: string): PoolEvent['type'] {
    // Map contract event types to our event types
    const typeMap: Record<string, PoolEvent['type']> = {
      'pool_created': 'created',
      'contribution_made': 'contribution',
      'pool_finalized': 'finalized',
      'refund_processed': 'refunded',
    };
    return typeMap[type] || 'created';
  }

  /**
   * Emit event to subscribers
   */
  private emitEvent(poolId: string, event: PoolEvent): void {
    const subject = this.eventSubjects.get(poolId);
    if (subject) {
      subject.next(event);
    }
  }
}
