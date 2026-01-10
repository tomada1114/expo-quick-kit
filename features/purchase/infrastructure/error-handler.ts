/**
 * Error Handler - User-facing error messages and recovery UI
 *
 * Converts domain errors to user-friendly messages and recovery options.
 * Task 6.5: Detailed error messages and graceful handling
 *
 * Responsibilities:
 * - Convert PurchaseError to user-friendly messages
 * - Determine recovery actions (retry, dismiss, contact support)
 * - Provide error classification for UI presentation
 * - Support cancellation graceful closure
 *
 * @module features/purchase/infrastructure/error-handler
 */

import type { PurchaseError } from '../core/types';
import type { PurchaseFlowError } from '../application/purchase-service';

/**
 * User-facing error information for UI presentation
 */
export interface UserFacingError {
  /** Short error title for UI display */
  title: string;

  /** Detailed error message for user understanding */
  message: string;

  /** Whether user can retry the operation */
  canRetry: boolean;

  /** Whether to show a dismiss/cancel button */
  canDismiss: boolean;

  /** Whether to suggest contacting support */
  suggestSupport: boolean;

  /** Severity level for UI styling */
  severity: 'info' | 'warning' | 'error' | 'critical';

  /** Error category for handling */
  category:
    | 'user_cancelled'
    | 'network'
    | 'store_problem'
    | 'verification_failed'
    | 'database_error'
    | 'unknown';
}

/**
 * Error Handler Service
 *
 * Converts domain errors to user-facing messages and recovery options.
 */
export const errorHandler = {
  /**
   * Convert PurchaseError to user-facing error
   *
   * Process:
   * 1. Classify error by code
   * 2. Generate user-friendly message
   * 3. Determine available recovery actions
   * 4. Assign severity level
   *
   * Given/When/Then:
   * - Given: PurchaseError with NETWORK_ERROR code
   * - When: getPurchaseUserError is called
   * - Then: Returns error with canRetry=true and network-specific message
   *
   * - Given: PurchaseError with PURCHASE_CANCELLED code
   * - When: getPurchaseUserError is called
   * - Then: Returns error with canDismiss=true and gentle message
   *
   * @param error - PurchaseError to convert
   * @returns User-facing error information
   *
   * @example
   * ```typescript
   * const error: PurchaseError = {
   *   code: 'NETWORK_ERROR',
   *   message: 'Failed to connect',
   *   retryable: true,
   *   platform: 'ios'
   * };
   *
   * const userError = errorHandler.getPurchaseUserError(error);
   * console.log(userError.title); // "Connection Problem"
   * console.log(userError.canRetry); // true
   * ```
   */
  getPurchaseUserError(error: PurchaseError): UserFacingError {
    switch (error.code) {
      case 'PURCHASE_CANCELLED':
        return {
          title: 'Purchase Cancelled',
          message: 'You cancelled the purchase. No charges were made.',
          canRetry: true,
          canDismiss: true,
          suggestSupport: false,
          severity: 'info',
          category: 'user_cancelled',
        };

      case 'NETWORK_ERROR':
        return {
          title: 'Connection Problem',
          message:
            'Unable to connect to the store. Please check your internet connection and try again.',
          canRetry: true,
          canDismiss: true,
          suggestSupport: true,
          severity: 'warning',
          category: 'network',
        };

      case 'STORE_PROBLEM_ERROR':
        return {
          title: 'Store Unavailable',
          message: `The app store is temporarily unavailable (Code: ${'nativeErrorCode' in error ? (error as any).nativeErrorCode : 'unknown'}). Please try again in a few moments.`,
          canRetry: true,
          canDismiss: true,
          suggestSupport: true,
          severity: 'warning',
          category: 'store_problem',
        };

      case 'PURCHASE_INVALID':
        return {
          title: 'Purchase Invalid',
          message:
            'The purchase was rejected. Please try again or contact support if the problem persists.',
          canRetry: false,
          canDismiss: true,
          suggestSupport: true,
          severity: 'error',
          category: 'verification_failed',
        };

      case 'PRODUCT_UNAVAILABLE':
        return {
          title: 'Product Unavailable',
          message: `The product is no longer available in your region. Product ID: ${'productId' in error ? (error as any).productId : 'unknown'}`,
          canRetry: false,
          canDismiss: true,
          suggestSupport: false,
          severity: 'error',
          category: 'unknown',
        };

      case 'UNKNOWN_ERROR':
      default:
        return {
          title: 'Unexpected Error',
          message:
            'An unexpected error occurred. Please try again or contact support for assistance.',
          canRetry: true,
          canDismiss: true,
          suggestSupport: true,
          severity: 'error',
          category: 'unknown',
        };
    }
  },

  /**
   * Convert PurchaseFlowError to user-facing error
   *
   * Similar to getPurchaseUserError but for application-layer errors.
   *
   * @param error - PurchaseFlowError to convert
   * @returns User-facing error information
   *
   * @example
   * ```typescript
   * const error: PurchaseFlowError = {
   *   code: 'VERIFICATION_FAILED',
   *   message: 'Receipt signature invalid',
   *   retryable: false
   * };
   *
   * const userError = errorHandler.getFlowUserError(error);
   * ```
   */
  getFlowUserError(error: PurchaseFlowError): UserFacingError {
    switch (error.code) {
      case 'CANCELLED':
        return {
          title: 'Purchase Cancelled',
          message:
            'You cancelled the purchase. No charges were made. Feel free to try again anytime.',
          canRetry: true,
          canDismiss: true,
          suggestSupport: false,
          severity: 'info',
          category: 'user_cancelled',
        };

      case 'NETWORK_ERROR':
        return {
          title: 'Connection Problem',
          message:
            'Network connection failed. Checking your internet and trying again...',
          canRetry: true,
          canDismiss: true,
          suggestSupport: true,
          severity: 'warning',
          category: 'network',
        };

      case 'VERIFICATION_FAILED':
        return {
          title: 'Verification Failed',
          message:
            'We could not verify your purchase. Please try again or contact support if the problem persists.',
          canRetry: false,
          canDismiss: true,
          suggestSupport: true,
          severity: 'error',
          category: 'verification_failed',
        };

      case 'DB_ERROR':
        return {
          title: 'Storage Error',
          message:
            'Failed to save your purchase locally. The system will retry automatically.',
          canRetry: true,
          canDismiss: false,
          suggestSupport: true,
          severity: 'warning',
          category: 'database_error',
        };

      case 'UNKNOWN_ERROR':
      default:
        return {
          title: 'Unexpected Error',
          message:
            'An unexpected error occurred during the purchase. Please try again or contact support.',
          canRetry: true,
          canDismiss: true,
          suggestSupport: true,
          severity: 'error',
          category: 'unknown',
        };
    }
  },

  /**
   * Get a generic user-facing error from any error object
   *
   * This is a catch-all that works with any error type.
   *
   * @param error - Error object from any source
   * @returns User-facing error information
   */
  getUserError(error: unknown): UserFacingError {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      'message' in error
    ) {
      const err = error as any;

      // Check if it's a PurchaseFlowError
      if (
        err.code === 'CANCELLED' ||
        err.code === 'VERIFICATION_FAILED' ||
        err.code === 'DB_ERROR'
      ) {
        return this.getFlowUserError(err as PurchaseFlowError);
      }

      // Otherwise treat as PurchaseError
      return this.getPurchaseUserError(err as PurchaseError);
    }

    // Fallback for unknown errors
    return {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred. Please try again.',
      canRetry: true,
      canDismiss: true,
      suggestSupport: true,
      severity: 'error',
      category: 'unknown',
    };
  },

  /**
   * Get recovery actions for an error
   *
   * Returns recommended actions user can take to recover from error.
   *
   * @param error - Error to analyze
   * @returns Array of recovery action labels
   *
   * @example
   * ```typescript
   * const actions = errorHandler.getRecoveryActions(error);
   * // => ['Retry', 'Dismiss', 'Contact Support']
   * ```
   */
  getRecoveryActions(error: unknown): string[] {
    const userError = this.getUserError(error);
    const actions: string[] = [];

    if (userError.canRetry) {
      actions.push('Retry');
    }
    if (userError.canDismiss) {
      actions.push('Dismiss');
    }
    if (userError.suggestSupport) {
      actions.push('Contact Support');
    }

    return actions;
  },

  /**
   * Check if error is a user cancellation
   *
   * Useful for graceful UI closure without error display.
   *
   * @param error - Error to check
   * @returns Whether this is a cancellation error
   *
   * @example
   * ```typescript
   * if (errorHandler.isCancellation(error)) {
   *   // Close paywall gracefully without showing error
   * }
   * ```
   */
  isCancellation(error: unknown): boolean {
    const userError = this.getUserError(error);
    return userError.category === 'user_cancelled';
  },

  /**
   * Check if error is a network error (retryable)
   *
   * @param error - Error to check
   * @returns Whether this is a network error
   */
  isNetworkError(error: unknown): boolean {
    const userError = this.getUserError(error);
    return userError.category === 'network';
  },

  /**
   * Format error for logging/debugging
   *
   * @param error - Error to format
   * @param context - Additional context
   * @returns Formatted error string
   */
  formatForLogging(error: unknown, context?: Record<string, unknown>): string {
    const userError = this.getUserError(error);
    const parts = [
      `[${userError.category.toUpperCase()}]`,
      userError.title,
      `-`,
      userError.message,
    ];

    if (context && Object.keys(context).length > 0) {
      parts.push(`Context:`, JSON.stringify(context));
    }

    return parts.join(' ');
  },
};
