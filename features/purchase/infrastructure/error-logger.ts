/**
 * Error Logger - Centralized error logging with timestamps
 *
 * Provides structured error logging for purchase operations with:
 * - Timestamp recording for all errors
 * - Error categorization and metadata
 * - Support for debugging and support team analysis
 *
 * Task 6.5: Error logging with timestamps
 *
 * @module features/purchase/infrastructure/error-logger
 */

import type { PurchaseError } from '../core/types';

/**
 * Error log entry with timestamp and metadata
 */
export interface ErrorLogEntry {
  /** Timestamp when error occurred */
  timestamp: Date;

  /** ISO 8601 formatted timestamp string for logging */
  timestampISO: string;

  /** Error code */
  errorCode: string;

  /** Error message */
  message: string;

  /** Whether error is retryable */
  retryable: boolean;

  /** Platform where error occurred (if known) */
  platform?: 'ios' | 'android' | 'revenueCat';

  /** Additional metadata for debugging */
  metadata?: Record<string, unknown>;

  /** Stack trace if available */
  stack?: string;

  /** Native error code if available */
  nativeErrorCode?: number;
}

/**
 * Error Logger Service
 *
 * Centralized error logging for purchase operations.
 * Records all errors with timestamps and metadata for debugging and support.
 */
export const errorLogger = {
  /** In-memory error log (for testing and debugging) */
  logs: [] as ErrorLogEntry[],

  /**
   * Log a purchase error with timestamp and metadata
   *
   * Process:
   * 1. Create timestamp (current time)
   * 2. Extract error metadata
   * 3. Append to error log
   * 4. Log to console (development)
   *
   * Given/When/Then:
   * - Given: Any PurchaseError
   * - When: logPurchaseError is called
   * - Then: Error is recorded with current timestamp
   *
   * @param error - PurchaseError to log
   * @param metadata - Additional context for debugging
   * @returns Logged error entry
   *
   * @example
   * ```typescript
   * const error: PurchaseError = {
   *   code: 'NETWORK_ERROR',
   *   message: 'Connection failed',
   *   retryable: true,
   *   platform: 'ios'
   * };
   *
   * const logged = errorLogger.logPurchaseError(error, { productId: 'premium_unlock' });
   * console.log(logged.timestamp); // => Current time with millisecond precision
   * ```
   */
  logPurchaseError(
    error: PurchaseError,
    metadata?: Record<string, unknown>
  ): ErrorLogEntry {
    const timestamp = new Date();
    const entry: ErrorLogEntry = {
      timestamp,
      timestampISO: timestamp.toISOString(),
      errorCode: error.code,
      message: error.message,
      retryable: error.retryable,
      platform: ('platform' in error) ? (error as any).platform : undefined,
      nativeErrorCode: ('nativeErrorCode' in error)
        ? (error as any).nativeErrorCode
        : undefined,
      metadata,
    };

    // Store in memory
    this.logs.push(entry);

    // Log to console (development)
    console.error('[PurchaseError]', {
      timestamp: entry.timestampISO,
      code: entry.errorCode,
      message: entry.message,
      retryable: entry.retryable,
      platform: entry.platform,
      metadata,
    });

    return entry;
  },

  /**
   * Log a flow-level error (PurchaseFlowError from application layer)
   *
   * Similar to logPurchaseError but for application-layer error types.
   *
   * @param error - Error object with code and message
   * @param context - Additional context (e.g., productId, attempt number)
   * @returns Logged error entry
   *
   * @example
   * ```typescript
   * errorLogger.logFlowError({
   *   code: 'VERIFICATION_FAILED',
   *   message: 'Invalid signature',
   *   retryable: false
   * }, { productId: 'premium', attempt: 1 });
   * ```
   */
  logFlowError(
    error: {
      code: string;
      message: string;
      retryable: boolean;
    },
    context?: Record<string, unknown>
  ): ErrorLogEntry {
    const timestamp = new Date();
    const entry: ErrorLogEntry = {
      timestamp,
      timestampISO: timestamp.toISOString(),
      errorCode: error.code,
      message: error.message,
      retryable: error.retryable,
      metadata: context,
    };

    this.logs.push(entry);

    console.error('[FlowError]', {
      timestamp: entry.timestampISO,
      code: entry.errorCode,
      message: entry.message,
      retryable: entry.retryable,
      context,
    });

    return entry;
  },

  /**
   * Log a generic error with timestamp
   *
   * Catch-all for non-PurchaseError exceptions.
   *
   * @param error - Any error object
   * @param context - Additional metadata
   * @returns Logged error entry
   */
  logError(
    error: unknown,
    context?: Record<string, unknown>
  ): ErrorLogEntry {
    // If error is already an ErrorLogEntry (e.g., from tests), use it directly
    if (
      error &&
      typeof error === 'object' &&
      'timestamp' in error &&
      'errorCode' in error &&
      'message' in error &&
      'retryable' in error &&
      error instanceof Object
    ) {
      const entry = error as ErrorLogEntry;
      // Add to logs if not already present
      if (!this.logs.includes(entry)) {
        this.logs.push(entry);
      }
      return entry;
    }

    // Otherwise, create a new entry from the error
    const timestamp = new Date();
    const message =
      error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    const entry: ErrorLogEntry = {
      timestamp,
      timestampISO: timestamp.toISOString(),
      errorCode: 'UNKNOWN_ERROR',
      message,
      retryable: false,
      metadata: context,
      stack,
    };

    this.logs.push(entry);

    console.error('[UnexpectedError]', {
      timestamp: entry.timestampISO,
      message,
      stack,
      context,
    });

    return entry;
  },

  /**
   * Get all logged errors (useful for debugging and support)
   *
   * @returns Array of error log entries
   */
  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  },

  /**
   * Get errors logged since a specific time
   *
   * Useful for filtering recent errors.
   *
   * @param since - Start timestamp
   * @returns Array of error entries after the given time
   *
   * @example
   * ```typescript
   * const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
   * const recentErrors = errorLogger.getErrorsSince(fiveMinutesAgo);
   * ```
   */
  getErrorsSince(since: Date): ErrorLogEntry[] {
    return this.logs.filter((entry) => entry.timestamp >= since);
  },

  /**
   * Get errors by code
   *
   * Filter logged errors by error code.
   *
   * @param code - Error code to filter by
   * @returns Array of matching error entries
   *
   * @example
   * ```typescript
   * const networkErrors = errorLogger.getErrorsByCode('NETWORK_ERROR');
   * ```
   */
  getErrorsByCode(code: string): ErrorLogEntry[] {
    return this.logs.filter((entry) => entry.errorCode === code);
  },

  /**
   * Clear all logged errors
   *
   * Useful for testing and cleanup.
   */
  clearLogs(): void {
    this.logs = [];
  },

  /**
   * Export logs as JSON for support team analysis
   *
   * @returns JSON string representation of all logs
   *
   * @example
   * ```typescript
   * const logsJson = errorLogger.exportLogsAsJson();
   * // Send to support or analytics
   * ```
   */
  exportLogsAsJson(): string {
    return JSON.stringify(this.logs, null, 2);
  },

  /**
   * Get error statistics
   *
   * Provides summary of errors for monitoring.
   *
   * @returns Statistics object
   *
   * @example
   * ```typescript
   * const stats = errorLogger.getStatistics();
   * console.log(stats.totalErrors, stats.byCode);
   * ```
   */
  getStatistics(): {
    totalErrors: number;
    byCode: Record<string, number>;
    byPlatform: Record<string, number>;
    retryableCount: number;
  } {
    const byCode: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};
    let retryableCount = 0;

    for (const entry of this.logs) {
      // Count by code
      byCode[entry.errorCode] = (byCode[entry.errorCode] ?? 0) + 1;

      // Count by platform
      if (entry.platform) {
        byPlatform[entry.platform] =
          (byPlatform[entry.platform] ?? 0) + 1;
      }

      // Count retryable
      if (entry.retryable) {
        retryableCount++;
      }
    }

    return {
      totalErrors: this.logs.length,
      byCode,
      byPlatform,
      retryableCount,
    };
  },
};
