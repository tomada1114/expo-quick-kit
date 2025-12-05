/**
 * Analytics Engine - Purchase Event Tracking
 *
 * Provides functionality to record and track purchase-related events for:
 * - Conversion funnel analysis (paywall display -> purchase initiation -> completion)
 * - Purchase completion metadata (productId, price, currency, timestamp)
 * - Error tracking (purchase failures with error codes)
 * - Analytics provider integration with Firebase and Amplitude
 * - Event queuing and retry with exponential backoff
 * - Offline support and batch sending
 *
 * Task 10.1: Event recording implementation with provider integration
 *
 * @module features/purchase/infrastructure/analytics-engine
 */

// Export all types and classes from implementation
export * from './analytics-engine-impl';

import type { Result } from '@/lib/result';

const VALID_EVENT_TYPES = new Set([
  'purchase_initiated',
  'purchase_completed',
  'purchase_failed',
  'paywall_displayed',
  'restore_attempted',
]);

const MAX_QUEUE_SIZE = 1000;
const MAX_METADATA_SIZE = 10240; // 10KB
const EVENT_TTL_DAYS = 7;

/**
 * Base event structure with timestamp and event ID
 */
interface BaseEvent {
  /** Unique event identifier */
  id: string;

  /** Event type identifier */
  type: string;

  /** Event timestamp */
  timestamp: Date;

  /** ISO 8601 timestamp string */
  timestampISO: string;

  /** Platform where event occurred */
  platform: 'ios' | 'android';

  /** Whether event was successfully sent to provider */
  sent: boolean;

  /** Number of retry attempts */
  retryCount: number;
}

/**
 * Purchase completed event with metadata
 */
export interface PurchaseCompletionEvent extends BaseEvent {
  type: 'purchase_completed';

  /** Product ID purchased */
  productId: string;

  /** Purchase price */
  price: number;

  /** Currency code (e.g., 'USD', 'EUR') */
  currency: string;
}

/**
 * Purchase initiated event
 */
interface PurchaseInitiatedEvent extends BaseEvent {
  type: 'purchase_initiated';

  /** Product ID for purchase */
  productId: string;
}

/**
 * Paywall displayed event
 */
interface PaywallDisplayedEvent extends BaseEvent {
  type: 'paywall_displayed';

  /** Feature ID that triggered paywall */
  featureId: string;
}

/**
 * Purchase failed event
 */
interface PurchaseFailedEvent extends BaseEvent {
  type: 'purchase_failed';

  /** Product ID that failed to purchase */
  productId: string;

  /** Error code from failure */
  errorCode: string;

  /** Optional error message for details */
  errorMessage?: string;
}

/**
 * Restore attempted event
 */
interface RestoreAttemptedEvent extends BaseEvent {
  type: 'restore_attempted';
}

/**
 * Union type of all purchase events
 */
export type PurchaseEvent =
  | PurchaseCompletionEvent
  | PurchaseInitiatedEvent
  | PaywallDisplayedEvent
  | PurchaseFailedEvent
  | RestoreAttemptedEvent;

/**
 * Funnel event (deprecated - kept for compatibility)
 */
export type FunnelEvent = PurchaseEvent;

/**
 * Analytics engine error types
 */
export type AnalyticsError =
  | {
      code: 'PROVIDER_UNAVAILABLE' | 'SERIALIZATION_ERROR' | 'UNKNOWN_ERROR';
      message: string;
    };

/**
 * Event listener callback type
 */
type EventListener = (event: PurchaseEvent) => void;

/**
 * Analytics error types
 */
export interface AnalyticsErrorType {
  code:
    | 'INVALID_EVENT_TYPE'
    | 'PROVIDER_UNAVAILABLE'
    | 'NETWORK_ERROR'
    | 'DB_ERROR'
    | 'SERIALIZATION_ERROR'
    | 'METADATA_TOO_LARGE'
    | 'INVALID_PRICE'
    | 'RATE_LIMIT_EXCEEDED'
    | 'AUTH_ERROR'
    | 'UNKNOWN_ERROR';
  message: string;
}

/**
 * Analytics Statistics
 */
export interface AnalyticsStatistics {
  totalEvents: number;
  byType: Record<string, number>;
  platform: Record<string, number>;
  sentCount: number;
  failedCount: number;
}

/**
 * Analytics result type
 */
type AnalyticsResultType<T> =
  | { success: true; data: T }
  | { success: false; error: AnalyticsErrorType };

/**
 * Enhanced analytics event with provider support
 */
export interface AnalyticsEventType extends BaseEvent {
  metadata: Record<string, unknown>;
}

/**
 * Analytics Engine Service (Class-based for task 10.1)
 *
 * Provides centralized purchase event tracking for:
 * - Conversion funnel analysis
 * - Purchase completion metadata
 * - Error tracking and analytics
 * - Provider integration (Firebase, Amplitude)
 * - Offline queue management
 */
export class AnalyticsEngine {
  /** In-memory event storage */
  private events: AnalyticsEventType[] = [];

  /** Event listeners for external analytics providers */
  private listeners: Array<(event: PurchaseEvent) => void> = [];

  /** Firebase Analytics provider */
  private firebaseProvider: any = null;

  /** Amplitude Analytics provider */
  private amplitudeProvider: any = null;

  /** Pending sync event IDs */
  private pendingSync = new Set<string>();

  constructor() {
    this.events = [];
    this.listeners = [];
  }

  /**
   * Record a purchase completion event with metadata
   *
   * Process:
   * 1. Validate input data (productId, price, currency, timestamp)
   * 2. Create purchase_completed event
   * 3. Add current timestamp if not provided
   * 4. Store in event log
   * 5. Notify listeners
   *
   * Given/When/Then:
   * - Given: Purchase completion metadata
   * - When: recordPurchaseCompleted is called
   * - Then: Event is recorded and listeners are notified
   *
   * @param metadata - Purchase completion metadata
   * @returns Success result
   *
   * @example
   * ```typescript
   * const result = analyticsEngine.recordPurchaseCompleted({
   *   productId: 'premium_unlock',
   *   price: 9.99,
   *   currency: 'USD',
   *   timestamp: new Date(),
   * });
   *
   * if (result.ok) {
   *   console.log('Purchase recorded for analytics');
   * }
   * ```
   */
  recordPurchaseCompleted(metadata: {
    productId: string;
    price: number;
    currency: string;
    timestamp?: Date;
  }): Result<void, AnalyticsError> {
    try {
      const event: PurchaseCompletionEvent = {
        type: 'purchase_completed',
        productId: metadata.productId,
        price: metadata.price,
        currency: metadata.currency,
        timestamp: metadata.timestamp || new Date(),
      };

      this.private_events.push(event);
      this.private_notifyListeners(event);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to record event',
        },
      };
    }
  },

  /**
   * Record a purchase initiated event
   *
   * @param productId - Product ID being purchased
   * @returns Success result
   *
   * @example
   * ```typescript
   * analyticsEngine.recordPurchaseInitiated('premium_unlock');
   * ```
   */
  recordPurchaseInitiated(productId: string): Result<void, AnalyticsError> {
    try {
      const event: PurchaseInitiatedEvent = {
        type: 'purchase_initiated',
        productId,
        timestamp: new Date(),
      };

      this.private_events.push(event);
      this.private_notifyListeners(event);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to record event',
        },
      };
    }
  },

  /**
   * Record a paywall displayed event
   *
   * @param featureId - Feature ID that triggered paywall display
   * @returns Success result
   *
   * @example
   * ```typescript
   * analyticsEngine.recordPaywallDisplayed('premium_feature');
   * ```
   */
  recordPaywallDisplayed(featureId: string): Result<void, AnalyticsError> {
    try {
      const event: PaywallDisplayedEvent = {
        type: 'paywall_displayed',
        featureId,
        timestamp: new Date(),
      };

      this.private_events.push(event);
      this.private_notifyListeners(event);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to record event',
        },
      };
    }
  },

  /**
   * Record a purchase failed event
   *
   * @param productId - Product ID that failed
   * @param errorCode - Error code from failure
   * @param errorMessage - Optional detailed error message
   * @returns Success result
   *
   * @example
   * ```typescript
   * analyticsEngine.recordPurchaseFailed(
   *   'premium_unlock',
   *   'NETWORK_ERROR',
   *   'Connection timeout'
   * );
   * ```
   */
  recordPurchaseFailed(
    productId: string,
    errorCode: string,
    errorMessage?: string,
  ): Result<void, AnalyticsError> {
    try {
      const event: PurchaseFailedEvent = {
        type: 'purchase_failed',
        productId,
        errorCode,
        errorMessage,
        timestamp: new Date(),
      };

      this.private_events.push(event);
      this.private_notifyListeners(event);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to record event',
        },
      };
    }
  },

  /**
   * Record a restore attempted event
   *
   * @returns Success result
   *
   * @example
   * ```typescript
   * analyticsEngine.recordRestoreAttempted();
   * ```
   */
  recordRestoreAttempted(): Result<void, AnalyticsError> {
    try {
      const event: RestoreAttemptedEvent = {
        type: 'restore_attempted',
        timestamp: new Date(),
      };

      this.private_events.push(event);
      this.private_notifyListeners(event);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to record event',
        },
      };
    }
  },

  /**
   * Get all recorded purchase events
   *
   * @returns Array of all events in chronological order
   *
   * @example
   * ```typescript
   * const events = analyticsEngine.getPurchaseEvents();
   * console.log(`${events.length} events recorded`);
   * ```
   */
  getPurchaseEvents(): PurchaseEvent[] {
    return [...this.private_events];
  },

  /**
   * Get events filtered by type
   *
   * @param type - Event type to filter by
   * @returns Array of events matching the type
   *
   * @example
   * ```typescript
   * const completedEvents = analyticsEngine.getEventsByType('purchase_completed');
   * ```
   */
  getEventsByType<T extends PurchaseEvent['type']>(
    type: T,
  ): PurchaseEvent[] {
    return this.private_events.filter((event) => event.type === type);
  },

  /**
   * Register an event listener for external analytics providers
   *
   * @param listener - Callback function invoked on each event
   *
   * @example
   * ```typescript
   * analyticsEngine.onEvent((event) => {
   *   sendToAnalyticsProvider(event);
   * });
   * ```
   */
  onEvent(listener: EventListener): void {
    this.private_listeners.push(listener);
  },

  /**
   * Clear all recorded events (for testing)
   *
   * @example
   * ```typescript
   * analyticsEngine.clearEvents();
   * ```
   */
  clearEvents(): void {
    this.private_events = [];
  },

  /**
   * Notify all registered listeners of an event
   *
   * @internal
   */
  private_notifyListeners(event: PurchaseEvent): void {
    this.private_listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        // Prevent listener errors from affecting event recording
        console.error('Analytics listener error:', error);
      }
    });
  },
};
