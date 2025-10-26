/**
 * Escrow Service
 * Handles escrow contract interactions including creation, milestone management,
 * and fund releases
 */

import { Contract, xdr, nativeToScVal, Address, scValToNative } from '@stellar/stellar-sdk';
import { StellarSDK } from '../sdk';
import { StellarError, ErrorCode, Signer } from '../types';
import { Observable, Subject } from 'rxjs';

export type ReleaseType = 'time-based' | 'milestone-based';

export interface MilestoneConfig {
  id: number;
  description: string;
  amount: string;
}

export interface TimeReleaseConfig {
  releaseDate: number; // Unix timestamp
  amount: string;
}

export interface CreateEscrowParams {
  provider: string;
  totalAmount: string;
  releaseType: ReleaseType;
  milestones?: MilestoneConfig[];
  timeSchedule?: TimeReleaseConfig[];
}

export interface EscrowStatus {
  contractId: string;
  client: string;
  provider: string;
  totalAmount: string;
  releasedAmount: string;
  releaseType: ReleaseType;
  status: 'active' | 'completed' | 'disputed';
  milestones?: MilestoneStatus[];
  timeSchedule?: TimeReleaseStatus[];
  createdAt: number;
}

export interface MilestoneStatus {
  id: number;
  description: string;
  amount: string;
  completed: boolean;
  completedAt?: number;
}

export interface TimeReleaseStatus {
  releaseDate: number;
  amount: string;
  released: boolean;
}

export interface EscrowEvent {
  type: 'created' | 'milestone_completed' | 'funds_released' | 'disputed' | 'resolved';
  contractId: string;
  data: any;
  timestamp: string;
}

export class EscrowService {
  private contract: Contract;
  private eventSubjects: Map<string, Subject<EscrowEvent>> = new Map();

  constructor(private sdk: StellarSDK) {
    const contractId = sdk.getConfig().contractIds.escrow;
    if (!contractId) {
      throw new StellarError(
        'Escrow contract ID not configured',
        ErrorCode.CONTRACT_ERROR
      );
    }
    this.contract = new Contract(contractId);
  }

  /**
   * Create a new escrow contract
   */
  async createEscrow(
    params: CreateEscrowParams,
    signer: Signer
  ): Promise<string> {
    try {
      // Validate parameters
      this.validateCreateParams(params);

      const sourcePublicKey = signer.getPublicKey();

      // Convert parameters to Soroban values
      const args = [
        new Address(sourcePublicKey).toScVal(), // client
        new Address(params.provider).toScVal(), // provider
        nativeToScVal(params.totalAmount, { type: 'i128' }), // amount
        nativeToScVal(params.releaseType === 'time-based' ? 0 : 1, { type: 'u32' }), // release type
      ];

      // Add milestones or time schedule
      if (params.releaseType === 'milestone-based' && params.milestones) {
        const milestonesScVal = nativeToScVal(
          params.milestones.map(m => ({
            id: m.id,
            description: m.description,
            amount: m.amount,
            completed: false,
          })),
          { type: 'vec' }
        );
        args.push(milestonesScVal);
      } else if (params.releaseType === 'time-based' && params.timeSchedule) {
        const scheduleScVal = nativeToScVal(
          params.timeSchedule.map(t => ({
            release_date: t.releaseDate,
            amount: t.amount,
            released: false,
          })),
          { type: 'vec' }
        );
        args.push(scheduleScVal);
      }

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
          'Failed to create escrow contract',
          ErrorCode.CONTRACT_ERROR,
          result
        );
      }

      // Return contract ID (in real implementation, extract from transaction result)
      const contractId = this.sdk.getConfig().contractIds.escrow!;
      
      return contractId;
    } catch (error) {
      if (error instanceof StellarError) {
        throw error;
      }
      throw new StellarError(
        'Failed to create escrow',
        ErrorCode.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Complete a milestone and release associated funds
   */
  async completeMilestone(
    contractId: string,
    milestoneId: number,
    signer: Signer
  ): Promise<void> {
    try {
      const sourcePublicKey = signer.getPublicKey();

      const args = [
        nativeToScVal(milestoneId, { type: 'u32' }),
      ];

      const operation = this.contract.call('complete_milestone', ...args);
      const transaction = await this.sdk.buildTransaction(
        sourcePublicKey,
        [operation]
      );

      const result = await this.sdk.signAndSubmit(transaction, signer);

      if (result.status !== 'success') {
        throw new StellarError(
          'Failed to complete milestone',
          ErrorCode.CONTRACT_ERROR,
          result
        );
      }

      // Emit event
      this.emitEvent(contractId, {
        type: 'milestone_completed',
        contractId,
        data: { milestoneId },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof StellarError) {
        throw error;
      }
      throw new StellarError(
        'Failed to complete milestone',
        ErrorCode.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Get current escrow status
   */
  async getEscrowStatus(contractId: string): Promise<EscrowStatus> {
    try {
      // Query contract state
      const statusData = await this.sdk.getContractData(contractId, 'status');
      const clientData = await this.sdk.getContractData(contractId, 'client');
      const providerData = await this.sdk.getContractData(contractId, 'provider');
      const totalAmountData = await this.sdk.getContractData(contractId, 'total_amount');
      const releasedAmountData = await this.sdk.getContractData(contractId, 'released_amount');
      const releaseTypeData = await this.sdk.getContractData(contractId, 'release_type');

      // Parse the data (simplified - actual implementation would parse XDR)
      const status: EscrowStatus = {
        contractId,
        client: scValToNative(clientData),
        provider: scValToNative(providerData),
        totalAmount: scValToNative(totalAmountData),
        releasedAmount: scValToNative(releasedAmountData),
        releaseType: scValToNative(releaseTypeData) === 0 ? 'time-based' : 'milestone-based',
        status: this.parseContractStatus(scValToNative(statusData)),
        createdAt: Date.now(), // Would be fetched from contract
      };

      // Fetch milestones or time schedule based on release type
      if (status.releaseType === 'milestone-based') {
        const milestonesData = await this.sdk.getContractData(contractId, 'milestones');
        status.milestones = scValToNative(milestonesData);
      } else {
        const scheduleData = await this.sdk.getContractData(contractId, 'time_schedule');
        status.timeSchedule = scValToNative(scheduleData);
      }

      return status;
    } catch (error) {
      throw new StellarError(
        'Failed to get escrow status',
        ErrorCode.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Withdraw released funds (for service provider)
   */
  async withdrawReleased(
    contractId: string,
    signer: Signer
  ): Promise<void> {
    try {
      const sourcePublicKey = signer.getPublicKey();

      const operation = this.contract.call('withdraw_released');
      const transaction = await this.sdk.buildTransaction(
        sourcePublicKey,
        [operation]
      );

      const result = await this.sdk.signAndSubmit(transaction, signer);

      if (result.status !== 'success') {
        throw new StellarError(
          'Failed to withdraw funds',
          ErrorCode.CONTRACT_ERROR,
          result
        );
      }

      // Emit event
      this.emitEvent(contractId, {
        type: 'funds_released',
        contractId,
        data: {},
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof StellarError) {
        throw error;
      }
      throw new StellarError(
        'Failed to withdraw funds',
        ErrorCode.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Initiate a dispute
   */
  async disputeEscrow(
    contractId: string,
    reason: string,
    signer: Signer
  ): Promise<void> {
    try {
      const sourcePublicKey = signer.getPublicKey();

      const args = [
        nativeToScVal(reason, { type: 'string' }),
      ];

      const operation = this.contract.call('dispute', ...args);
      const transaction = await this.sdk.buildTransaction(
        sourcePublicKey,
        [operation]
      );

      const result = await this.sdk.signAndSubmit(transaction, signer);

      if (result.status !== 'success') {
        throw new StellarError(
          'Failed to initiate dispute',
          ErrorCode.CONTRACT_ERROR,
          result
        );
      }

      // Emit event
      this.emitEvent(contractId, {
        type: 'disputed',
        contractId,
        data: { reason },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof StellarError) {
        throw error;
      }
      throw new StellarError(
        'Failed to initiate dispute',
        ErrorCode.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Watch escrow for real-time updates
   */
  watchEscrow(contractId: string): Observable<EscrowEvent> {
    if (!this.eventSubjects.has(contractId)) {
      const subject = new Subject<EscrowEvent>();
      this.eventSubjects.set(contractId, subject);

      // Subscribe to contract events
      this.sdk.subscribeToContractEvents(contractId, (event) => {
        const escrowEvent: EscrowEvent = {
          type: this.parseEventType(event.type),
          contractId,
          data: event.data,
          timestamp: event.timestamp,
        };
        subject.next(escrowEvent);
      });
    }

    return this.eventSubjects.get(contractId)!.asObservable();
  }

  /**
   * Validate create escrow parameters
   */
  private validateCreateParams(params: CreateEscrowParams): void {
    if (!params.provider) {
      throw new StellarError(
        'Provider address is required',
        ErrorCode.INVALID_PARAMS
      );
    }

    if (!params.totalAmount || parseFloat(params.totalAmount) <= 0) {
      throw new StellarError(
        'Total amount must be greater than 0',
        ErrorCode.INVALID_PARAMS
      );
    }

    if (params.releaseType === 'milestone-based') {
      if (!params.milestones || params.milestones.length === 0) {
        throw new StellarError(
          'Milestones are required for milestone-based release',
          ErrorCode.INVALID_PARAMS
        );
      }

      // Validate milestone amounts sum to total
      const milestonesTotal = params.milestones.reduce(
        (sum, m) => sum + parseFloat(m.amount),
        0
      );
      if (Math.abs(milestonesTotal - parseFloat(params.totalAmount)) > 0.01) {
        throw new StellarError(
          'Milestone amounts must sum to total amount',
          ErrorCode.INVALID_PARAMS
        );
      }
    } else if (params.releaseType === 'time-based') {
      if (!params.timeSchedule || params.timeSchedule.length === 0) {
        throw new StellarError(
          'Time schedule is required for time-based release',
          ErrorCode.INVALID_PARAMS
        );
      }

      // Validate schedule amounts sum to total
      const scheduleTotal = params.timeSchedule.reduce(
        (sum, t) => sum + parseFloat(t.amount),
        0
      );
      if (Math.abs(scheduleTotal - parseFloat(params.totalAmount)) > 0.01) {
        throw new StellarError(
          'Schedule amounts must sum to total amount',
          ErrorCode.INVALID_PARAMS
        );
      }
    }
  }

  /**
   * Parse contract status from contract data
   */
  private parseContractStatus(status: any): 'active' | 'completed' | 'disputed' {
    // Simplified parsing - actual implementation would parse XDR enum
    if (status === 0) return 'active';
    if (status === 1) return 'completed';
    if (status === 2) return 'disputed';
    return 'active';
  }

  /**
   * Parse event type from contract event
   */
  private parseEventType(type: string): EscrowEvent['type'] {
    // Map contract event types to our event types
    const typeMap: Record<string, EscrowEvent['type']> = {
      'escrow_created': 'created',
      'milestone_completed': 'milestone_completed',
      'funds_released': 'funds_released',
      'dispute_initiated': 'disputed',
      'dispute_resolved': 'resolved',
    };
    return typeMap[type] || 'created';
  }

  /**
   * Emit event to subscribers
   */
  private emitEvent(contractId: string, event: EscrowEvent): void {
    const subject = this.eventSubjects.get(contractId);
    if (subject) {
      subject.next(event);
    }
  }
}
