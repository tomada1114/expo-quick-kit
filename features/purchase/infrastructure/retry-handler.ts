/**
 * Retry Handler - Exponential backoff retry mechanism
 *
 * Implements automatic retry logic for transient errors with:
 * - Configurable exponential backoff
 * - Maximum retry limits
 * - Retryable error detection
 * - Error logging during retries
 *
 * Task 6.5: Automatic retry with exponential backoff
 *
 * @module features/purchase/infrastructure/retry-handler
 */

import type { PurchaseError } from '../core/types';
import { errorLogger } from './error-logger';

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;

  /** Initial delay in milliseconds */
  initialDelayMs: number;

  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;

  /** Maximum delay in milliseconds to prevent runaway delays */
  maxDelayMs?: number;
}

/**
 * Default retry configuration
 *
 * - Max 3 retries (4 total attempts)
 * - Initial 1 second delay
 * - Exponential backoff: 1s → 2s → 4s
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 32000, // 32 seconds max
};

/**
 * Result of a retry attempt
 */
export interface RetryResult<T> {
  /** Whether the operation succeeded */
  success: boolean;

  /** Result data if successful */
  data?: T;

  /** Error if failed */
  error?: unknown;

  /** Number of attempts made */
  attempts: number;

  /** Last delay used (in milliseconds) */
  lastDelayMs: number;

  /** Whether more retries are possible */
  couldRetry: boolean;
}

/**
 * Retry Handler Service
 *
 * Provides retry logic for transient errors with exponential backoff.
 * Used by PurchaseService for network error recovery.
 */
export const retryHandler = {
  /**
   * Execute an async operation with automatic retry on transient errors
   *
   * Process:
   * 1. Execute operation
   * 2. If fails and error is retryable, wait with exponential backoff
   * 3. Retry operation
   * 4. Continue until success or max retries exhausted
   *
   * Given/When/Then:
   * - Given: Operation that fails transiently then succeeds
   * - When: executeWithRetry is called
   * - Then: Operation succeeds after retries
   *
   * - Given: Operation that consistently fails with non-retryable error
   * - When: executeWithRetry is called
   * - Then: Fails immediately without retries
   *
   * @param operation - Async function to execute
   * @param isRetryable - Function to determine if error is retryable
   * @param config - Retry configuration
   * @returns Result with success/data or error information
   *
   * @example
   * ```typescript
   * const result = await retryHandler.executeWithRetry(
   *   async () => purchaseRepository.launchPurchaseFlow(productId),
   *   (error) => error instanceof PurchaseError && error.retryable,
   *   { maxRetries: 3, initialDelayMs: 1000 }
   * );
   *
   * if (result.success) {
   *   console.log(`Succeeded after ${result.attempts} attempts`);
   * } else {
   *   console.log(`Failed after ${result.attempts} attempts`);
   * }
   * ```
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    isRetryable: (error: unknown) => boolean,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<RetryResult<T>> {
    const { maxRetries, initialDelayMs, backoffMultiplier = 2, maxDelayMs = 32000 } = config;
    let lastError: unknown = null;
    let lastDelayMs = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Apply exponential backoff delay (except on first attempt)
        if (attempt > 0) {
          lastDelayMs = Math.min(
            initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
            maxDelayMs
          );

          console.log(
            `[RetryHandler] Retry attempt ${attempt + 1}/${maxRetries + 1}, waiting ${lastDelayMs}ms`
          );

          await retryHandler._delay(lastDelayMs);
        }

        // Execute operation
        const result = await operation();

        // Success
        if (attempt > 0) {
          console.log(`[RetryHandler] Operation succeeded on retry attempt ${attempt + 1}`);
        }

        return {
          success: true,
          data: result,
          attempts: attempt + 1,
          lastDelayMs,
          couldRetry: false,
        };
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!isRetryable(error)) {
          // Non-retryable error - fail immediately
          return {
            success: false,
            error,
            attempts: attempt + 1,
            lastDelayMs,
            couldRetry: false,
          };
        }

        // Check if more retries are available
        if (attempt === maxRetries) {
          // Max retries exhausted
          return {
            success: false,
            error,
            attempts: attempt + 1,
            lastDelayMs,
            couldRetry: false,
          };
        }

        // Log retry attempt
        console.warn(
          `[RetryHandler] Operation failed on attempt ${attempt + 1}, will retry...`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Should not reach here, but return error as fallback
    return {
      success: false,
      error: lastError || new Error('Unknown error during retry'),
      attempts: maxRetries + 1,
      lastDelayMs,
      couldRetry: false,
    };
  },

  /**
   * Execute an operation with retry, handling Result-based return values
   *
   * Specialized for PurchaseService which uses Result<T, E> pattern.
   *
   * @param operation - Async function returning Result
   * @param config - Retry configuration
   * @returns Result with success or error
   *
   * @example
   * ```typescript
   * const result = await retryHandler.executeResultWithRetry(
   *   async () => purchaseRepository.launchPurchaseFlow(productId),
   *   { maxRetries: 3, initialDelayMs: 1000 }
   * );
   * ```
   */
  async executeResultWithRetry<T, E extends { retryable?: boolean }>(
    operation: () => Promise<{ success: boolean; data?: T; error?: E }>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<{ success: boolean; data?: T; error?: E; attempts: number }> {
    const { maxRetries, initialDelayMs, backoffMultiplier = 2, maxDelayMs = 32000 } = config;
    let lastError: E | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Apply exponential backoff delay
      if (attempt > 0) {
        const delayMs = Math.min(
          initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
          maxDelayMs
        );

        console.log(
          `[RetryHandler] Retry attempt ${attempt + 1}/${maxRetries + 1}, waiting ${delayMs}ms`
        );

        await retryHandler._delay(delayMs);
      }

      try {
        const result = await operation();

        if (result.success) {
          if (attempt > 0) {
            console.log(`[RetryHandler] Operation succeeded on retry attempt ${attempt + 1}`);
          }
          return { success: true, data: result.data, attempts: attempt + 1 };
        }

        // Operation returned error result
        if (result.error) {
          lastError = result.error;

          // Check if error is retryable
          if (!result.error.retryable || attempt === maxRetries) {
            // Non-retryable or max retries exhausted
            return { success: false, error: result.error, attempts: attempt + 1 };
          }

          // Log and continue to next retry
          console.warn(
            `[RetryHandler] Operation failed on attempt ${attempt + 1}, will retry...`,
            result.error
          );
        } else {
          // No error object - unexpected
          return { success: false, error: result.error, attempts: attempt + 1 };
        }
      } catch (unexpectedError) {
        // Unexpected exception - fail immediately
        console.error('[RetryHandler] Unexpected error during operation:', unexpectedError);
        return {
          success: false,
          error: { retryable: false } as E,
          attempts: attempt + 1,
        };
      }
    }

    // Max retries exhausted
    return {
      success: false,
      error: lastError || ({ retryable: false } as E),
      attempts: maxRetries + 1,
    };
  },

  /**
   * Delay execution for a specified number of milliseconds
   *
   * @param ms - Milliseconds to wait
   * @returns Promise that resolves after the delay
   *
   * @internal Internal utility - not meant to be called directly
   */
  async _delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  },

  /**
   * Check if a PurchaseError is retryable
   *
   * Determines whether an error should trigger a retry.
   *
   * @param error - Error to check
   * @returns Whether error is retryable
   *
   * @example
   * ```typescript
   * if (retryHandler.isRetryableError(error)) {
   *   // Retry the operation
   * }
   * ```
   */
  isRetryableError(error: unknown): boolean {
    if (
      error &&
      typeof error === 'object' &&
      'retryable' in error
    ) {
      const err = error as any;
      return err.retryable === true;
    }
    return false;
  },
};
