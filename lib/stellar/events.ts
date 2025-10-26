/**
 * Real-time event monitoring system using Stellar streaming API
 * Manages WebSocket connections and event subscriptions
 */

import { Server } from '@stellar/stellar-sdk';
import { StellarSDK } from './sdk';
import { StellarError, ErrorCode, ContractEvent } from './types';
import { logError } from './errors';
import { Subject, Observable, fromEvent, merge } from 'rxjs';
import { filter, map, retry, catchError } from 'rxjs/operators';

/**
 * Event subscription configuration
 */
export interface EventSubscriptionConfig {
  contractId?: string;
  eventTypes?: string[];
  startCursor?: string;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

/**
 * Event handler function type
 */
export type EventHandler = (event: ContractEvent) => void;

/**
 * Event subscription
 */
export interface EventSubscription {
  id: string;
  config: EventSubscriptionConfig;
  unsubscribe: () => void;
  isActive: () => boolean;
}

/**
 * Connection status
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error';

/**
 * Event monitor class
 */
export class EventMonitor {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventSubjects: Map<string, Subject<ContractEvent>> = new Map();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private statusSubject: Subject<ConnectionStatus> = new Subject();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(private sdk: StellarSDK) {}

  /**
   * Subscribe to contract events
   */
  subscribe(
    config: EventSubscriptionConfig,
    handler: EventHandler
  ): EventSubscription {
    const id = this.generateSubscriptionId();
    const subject = new Subject<ContractEvent>();

    // Subscribe to the subject
    const subscription = subject.subscribe(handler);

    // Create event stream
    const eventStream = this.createEventStream(config, subject);

    const eventSubscription: EventSubscription = {
      id,
      config,
      unsubscribe: () => {
        subscription.unsubscribe();
        if (eventStream && typeof eventStream === 'function') {
          eventStream();
        }
        this.subscriptions.delete(id);
        this.eventSubjects.delete(id);
      },
      isActive: () => this.subscriptions.has(id),
    };

    this.subscriptions.set(id, eventSubscription);
    this.eventSubjects.set(id, subject);

    return eventSubscription;
  }

  /**
   * Subscribe to multiple contracts
   */
  subscribeToContracts(
    contractIds: string[],
    handler: EventHandler,
    config?: Omit<EventSubscriptionConfig, 'contractId'>
  ): EventSubscription[] {
    return contractIds.map(contractId =>
      this.subscribe({ ...config, contractId }, handler)
    );
  }

  /**
   * Unsubscribe from all events
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
    this.eventSubjects.clear();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Watch connection status changes
   */
  watchConnectionStatus(): Observable<ConnectionStatus> {
    return this.statusSubject.asObservable();
  }

  /**
   * Create event stream for a subscription
   */
  private createEventStream(
    config: EventSubscriptionConfig,
    subject: Subject<ContractEvent>
  ): (() => void) | null {
    try {
      const server = this.sdk.getServer();
      let streamBuilder = server.events();

      // Filter by contract if specified
      if (config.contractId) {
        streamBuilder = streamBuilder.forContract(config.contractId);
      }

      // Set cursor
      const cursor = config.startCursor || 'now';
      streamBuilder = streamBuilder.cursor(cursor);

      // Start streaming
      const closeStream = streamBuilder.stream({
        onmessage: (event: any) => {
          this.handleEvent(event, config, subject);
        },
        onerror: (error: any) => {
          this.handleStreamError(error, config, subject);
        },
        reconnectTimeout: config.reconnectDelay || 5000,
      });

      this.setConnectionStatus('connected');
      this.reconnectAttempts = 0;

      return closeStream;
    } catch (error) {
      logError(
        new StellarError(
          'Failed to create event stream',
          ErrorCode.NETWORK_ERROR,
          error
        )
      );
      this.setConnectionStatus('error');
      return null;
    }
  }

  /**
   * Handle incoming event
   */
  private handleEvent(
    event: any,
    config: EventSubscriptionConfig,
    subject: Subject<ContractEvent>
  ): void {
    try {
      // Parse event
      const contractEvent: ContractEvent = {
        type: event.type || 'unknown',
        contractId: config.contractId || event.contract_id || '',
        data: event,
        ledger: event.ledger || 0,
        timestamp: new Date().toISOString(),
      };

      // Filter by event type if specified
      if (config.eventTypes && config.eventTypes.length > 0) {
        if (!config.eventTypes.includes(contractEvent.type)) {
          return;
        }
      }

      // Emit event
      subject.next(contractEvent);
    } catch (error) {
      logError(
        new StellarError(
          'Failed to handle event',
          ErrorCode.CONTRACT_ERROR,
          error
        )
      );
    }
  }

  /**
   * Handle stream error
   */
  private handleStreamError(
    error: any,
    config: EventSubscriptionConfig,
    subject: Subject<ContractEvent>
  ): void {
    logError(
      new StellarError(
        'Event stream error',
        ErrorCode.NETWORK_ERROR,
        error
      )
    );

    this.setConnectionStatus('error');

    // Attempt reconnection if enabled
    if (config.reconnect !== false && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.setConnectionStatus('reconnecting');

      const delay = config.reconnectDelay || 5000;
      setTimeout(() => {
        this.createEventStream(config, subject);
      }, delay);
    }
  }

  /**
   * Set connection status
   */
  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusSubject.next(status);
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }
}

/**
 * Notification system for important events
 */
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

/**
 * Notification manager
 */
export class NotificationManager {
  private notifications: Notification[] = [];
  private notificationSubject: Subject<Notification> = new Subject();
  private maxNotifications: number = 50;

  /**
   * Add notification
   */
  notify(
    type: Notification['type'],
    title: string,
    message: string,
    data?: any
  ): Notification {
    const notification: Notification = {
      id: this.generateNotificationId(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      data,
    };

    this.notifications.unshift(notification);

    // Keep only recent notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    this.notificationSubject.next(notification);

    return notification;
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead(): void {
    this.notifications.forEach(n => (n.read = true));
  }

  /**
   * Clear notification
   */
  clearNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications = [];
  }

  /**
   * Watch for new notifications
   */
  watchNotifications(): Observable<Notification> {
    return this.notificationSubject.asObservable();
  }

  /**
   * Generate notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.getUnreadNotifications().length;
  }
}

// Singleton instances
let eventMonitorInstance: EventMonitor | null = null;
let notificationManagerInstance: NotificationManager | null = null;

/**
 * Get event monitor instance
 */
export function getEventMonitor(sdk?: StellarSDK): EventMonitor {
  if (!eventMonitorInstance) {
    if (!sdk) {
      throw new StellarError(
        'SDK instance required to create EventMonitor',
        ErrorCode.CONTRACT_ERROR
      );
    }
    eventMonitorInstance = new EventMonitor(sdk);
  }
  return eventMonitorInstance;
}

/**
 * Reset event monitor
 */
export function resetEventMonitor(): void {
  if (eventMonitorInstance) {
    eventMonitorInstance.unsubscribeAll();
  }
  eventMonitorInstance = null;
}

/**
 * Get notification manager instance
 */
export function getNotificationManager(): NotificationManager {
  if (!notificationManagerInstance) {
    notificationManagerInstance = new NotificationManager();
  }
  return notificationManagerInstance;
}

/**
 * Reset notification manager
 */
export function resetNotificationManager(): void {
  if (notificationManagerInstance) {
    notificationManagerInstance.clearAll();
  }
  notificationManagerInstance = null;
}

/**
 * Create event-based notification
 */
export function createEventNotification(event: ContractEvent): Notification | null {
  const manager = getNotificationManager();

  // Map event types to notifications
  switch (event.type) {
    case 'escrow_created':
      return manager.notify(
        'success',
        'Escrow Created',
        'A new escrow contract has been created',
        event
      );

    case 'milestone_completed':
      return manager.notify(
        'success',
        'Milestone Completed',
        'A milestone has been marked as completed',
        event
      );

    case 'funds_released':
      return manager.notify(
        'success',
        'Funds Released',
        'Funds have been released from escrow',
        event
      );

    case 'dispute_initiated':
      return manager.notify(
        'warning',
        'Dispute Initiated',
        'A dispute has been raised on an escrow contract',
        event
      );

    case 'pool_funded':
      return manager.notify(
        'success',
        'Pool Funded',
        'A crowdfunding pool has reached its goal',
        event
      );

    case 'contribution_received':
      return manager.notify(
        'info',
        'Contribution Received',
        'A new contribution has been made to a pool',
        event
      );

    default:
      return null;
  }
}

/**
 * Auto-subscribe to important events and create notifications
 */
export function enableAutoNotifications(
  sdk: StellarSDK,
  contractIds?: string[]
): EventSubscription[] {
  const monitor = getEventMonitor(sdk);
  const importantEventTypes = [
    'escrow_created',
    'milestone_completed',
    'funds_released',
    'dispute_initiated',
    'pool_funded',
    'contribution_received',
  ];

  const handler: EventHandler = (event) => {
    createEventNotification(event);
  };

  if (contractIds && contractIds.length > 0) {
    return monitor.subscribeToContracts(contractIds, handler, {
      eventTypes: importantEventTypes,
      reconnect: true,
    });
  }

  return [
    monitor.subscribe(
      {
        eventTypes: importantEventTypes,
        reconnect: true,
      },
      handler
    ),
  ];
}
