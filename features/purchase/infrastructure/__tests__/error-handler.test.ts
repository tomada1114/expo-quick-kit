/**
 * Error Handler Tests
 *
 * Task 6.5: Error handling and user-facing messages
 *
 * Tests error handler including:
 * - PurchaseError to user-facing message conversion
 * - PurchaseFlowError conversion
 * - Recovery action determination
 * - Cancellation detection
 *
 * @module features/purchase/infrastructure/__tests__/error-handler
 */

import { describe, it, expect } from '@jest/globals';
import { errorHandler } from '../error-handler';
import type { PurchaseError } from '../../core/types';
import type { PurchaseFlowError } from '../../application/purchase-service';

describe('ErrorHandler - Task 6.5: Error Handling and User Messages', () => {
  describe('getPurchaseUserError() - Convert PurchaseError to user message', () => {
    /**
     * HAPPY PATH: User cancellation
     */

    it('should convert PURCHASE_CANCELLED to user-friendly message', () => {
      // Given: User cancelled purchase
      const error: PurchaseError = {
        code: 'PURCHASE_CANCELLED',
        message: 'User cancelled',
        retryable: false,
      };

      // When: Converting to user error
      const userError = errorHandler.getPurchaseUserError(error);

      // Then: Should have appropriate UI options
      expect(userError.title).toBe('Purchase Cancelled');
      expect(userError.message).toContain('No charges');
      expect(userError.canRetry).toBe(true);
      expect(userError.canDismiss).toBe(true);
      expect(userError.suggestSupport).toBe(false);
      expect(userError.severity).toBe('info');
      expect(userError.category).toBe('user_cancelled');
    });

    /**
     * HAPPY PATH: Network error
     */

    it('should convert NETWORK_ERROR with retry information', () => {
      // Given: Network connectivity issue
      const error: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'Connection timeout',
        retryable: true,
        platform: 'ios',
      };

      // When: Converting to user error
      const userError = errorHandler.getPurchaseUserError(error);

      // Then: Should suggest retry and check connection
      expect(userError.title).toBe('Connection Problem');
      expect(userError.message).toContain('internet connection');
      expect(userError.canRetry).toBe(true);
      expect(userError.canDismiss).toBe(true);
      expect(userError.suggestSupport).toBe(true);
      expect(userError.severity).toBe('warning');
      expect(userError.category).toBe('network');
    });

    /**
     * HAPPY PATH: Store problem
     */

    it('should convert STORE_PROBLEM_ERROR with platform context', () => {
      // Given: App Store temporarily unavailable
      const error: PurchaseError = {
        code: 'STORE_PROBLEM_ERROR',
        message: 'Store unavailable',
        retryable: true,
        nativeErrorCode: 2,
        platform: 'ios',
      };

      // When: Converting to user error
      const userError = errorHandler.getPurchaseUserError(error);

      // Then: Should explain store issue and suggest retry
      expect(userError.title).toBe('Store Unavailable');
      expect(userError.message).toContain('Code: 2');
      expect(userError.canRetry).toBe(true);
      expect(userError.suggestSupport).toBe(true);
      expect(userError.severity).toBe('warning');
      expect(userError.category).toBe('store_problem');
    });

    /**
     * SAD PATH: Invalid purchase
     */

    it('should convert PURCHASE_INVALID error', () => {
      // Given: Invalid purchase (signature failed)
      const error: PurchaseError = {
        code: 'PURCHASE_INVALID',
        message: 'Signature verification failed',
        retryable: false,
        reason: 'not_signed',
      };

      // When: Converting to user error
      const userError = errorHandler.getPurchaseUserError(error);

      // Then: Should not allow retry but suggest support
      expect(userError.title).toBe('Purchase Invalid');
      expect(userError.canRetry).toBe(false);
      expect(userError.canDismiss).toBe(true);
      expect(userError.suggestSupport).toBe(true);
      expect(userError.severity).toBe('error');
      expect(userError.category).toBe('verification_failed');
    });

    /**
     * SAD PATH: Product unavailable
     */

    it('should convert PRODUCT_UNAVAILABLE error', () => {
      // Given: Product not available in region
      const error: PurchaseError = {
        code: 'PRODUCT_UNAVAILABLE',
        message: 'Not available in your region',
        retryable: false,
        productId: 'premium_unlock',
      };

      // When: Converting to user error
      const userError = errorHandler.getPurchaseUserError(error);

      // Then: Should explain regional limitation
      expect(userError.title).toBe('Product Unavailable');
      expect(userError.message).toContain('no longer available');
      expect(userError.canRetry).toBe(false);
      expect(userError.severity).toBe('error');
    });

    /**
     * EDGE CASE: Unknown error
     */

    it('should handle UNKNOWN_ERROR with safe defaults', () => {
      // Given: Unexpected error
      const error: PurchaseError = {
        code: 'UNKNOWN_ERROR',
        message: 'Something unexpected happened',
        retryable: false,
      };

      // When: Converting to user error
      const userError = errorHandler.getPurchaseUserError(error);

      // Then: Should provide generic helpful message
      expect(userError.title).toBe('Unexpected Error');
      expect(userError.message).toContain('try again');
      expect(userError.suggestSupport).toBe(true);
      expect(userError.severity).toBe('error');
    });
  });

  describe('getFlowUserError() - Convert PurchaseFlowError to user message', () => {
    /**
     * HAPPY PATH: Cancellation in flow
     */

    it('should convert CANCELLED flow error', () => {
      // Given: Purchase flow cancellation
      const error: PurchaseFlowError = {
        code: 'CANCELLED',
        message: 'User cancelled',
        retryable: false,
      };

      // When: Converting to user error
      const userError = errorHandler.getFlowUserError(error);

      // Then: Should be graceful cancellation message
      expect(userError.title).toBe('Purchase Cancelled');
      expect(userError.category).toBe('user_cancelled');
      expect(userError.severity).toBe('info');
      expect(userError.canRetry).toBe(true);
    });

    /**
     * HAPPY PATH: Network error in flow
     */

    it('should convert NETWORK_ERROR flow error with retry', () => {
      // Given: Network error during purchase service
      const error: PurchaseFlowError = {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        retryable: true,
      };

      // When: Converting to user error
      const userError = errorHandler.getFlowUserError(error);

      // Then: Should explain it will auto-retry
      expect(userError.title).toBe('Connection Problem');
      expect(userError.message).toContain('trying again');
      expect(userError.canRetry).toBe(true);
      expect(userError.category).toBe('network');
    });

    /**
     * SAD PATH: Verification failure
     */

    it('should convert VERIFICATION_FAILED error', () => {
      // Given: Receipt verification failed
      const error: PurchaseFlowError = {
        code: 'VERIFICATION_FAILED',
        message: 'Receipt signature invalid',
        retryable: false,
      };

      // When: Converting to user error
      const userError = errorHandler.getFlowUserError(error);

      // Then: Should suggest support
      expect(userError.title).toBe('Verification Failed');
      expect(userError.canRetry).toBe(false);
      expect(userError.suggestSupport).toBe(true);
      expect(userError.category).toBe('verification_failed');
    });

    /**
     * SAD PATH: Database error
     */

    it('should convert DB_ERROR with retry info', () => {
      // Given: Failed to save purchase to local DB
      const error: PurchaseFlowError = {
        code: 'DB_ERROR',
        message: 'Failed to record purchase',
        retryable: true,
      };

      // When: Converting to user error
      const userError = errorHandler.getFlowUserError(error);

      // Then: Should indicate it will auto-retry
      expect(userError.title).toBe('Storage Error');
      expect(userError.message).toContain('retry automatically');
      expect(userError.canRetry).toBe(true);
      expect(userError.canDismiss).toBe(false);
      expect(userError.category).toBe('database_error');
    });
  });

  describe('getUserError() - Generic error conversion', () => {
    /**
     * HAPPY PATH: Convert any error type
     */

    it('should convert PurchaseError via generic method', () => {
      // Given: Any PurchaseError
      const error: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'Connection failed',
        retryable: true,
        platform: 'ios',
      };

      // When: Converting via generic method
      const userError = errorHandler.getUserError(error);

      // Then: Should work same as getPurchaseUserError
      expect(userError.title).toBe('Connection Problem');
      expect(userError.category).toBe('network');
    });

    it('should convert PurchaseFlowError via generic method', () => {
      // Given: PurchaseFlowError
      const error: PurchaseFlowError = {
        code: 'VERIFICATION_FAILED',
        message: 'Verification failed',
        retryable: false,
      };

      // When: Converting via generic method
      const userError = errorHandler.getUserError(error);

      // Then: Should work same as getFlowUserError
      expect(userError.title).toBe('Verification Failed');
      expect(userError.category).toBe('verification_failed');
    });

    /**
     * EDGE CASE: Unknown error structure
     */

    it('should handle unknown error structures gracefully', () => {
      // Given: Unknown error type
      const error = { foo: 'bar' };

      // When: Converting via generic method
      const userError = errorHandler.getUserError(error);

      // Then: Should fallback to safe message
      expect(userError.title).toBe('Unexpected Error');
      expect(userError.message).toContain('try again');
      expect(userError.category).toBe('unknown');
    });

    it('should handle null/undefined', () => {
      // Given: Null error
      // When: Converting
      const userError = errorHandler.getUserError(null);

      // Then: Should fallback gracefully
      expect(userError.title).toBe('Unexpected Error');
      expect(userError.category).toBe('unknown');
    });
  });

  describe('getRecoveryActions() - Determine UI actions available', () => {
    /**
     * HAPPY PATH: Get actions for network error
     */

    it('should return retry option for network error', () => {
      // Given: Network error
      const error: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'Connection failed',
        retryable: true,
        platform: 'ios',
      };

      // When: Getting recovery actions
      const actions = errorHandler.getRecoveryActions(error);

      // Then: Should include retry
      expect(actions).toContain('Retry');
      expect(actions).toContain('Dismiss');
      expect(actions).toContain('Contact Support');
    });

    /**
     * HAPPY PATH: Get actions for cancellation
     */

    it('should return limited actions for cancellation', () => {
      // Given: User cancellation
      const error: PurchaseError = {
        code: 'PURCHASE_CANCELLED',
        message: 'User cancelled',
        retryable: false,
      };

      // When: Getting recovery actions
      const actions = errorHandler.getRecoveryActions(error);

      // Then: Should have dismiss and retry but no support
      expect(actions).toContain('Retry');
      expect(actions).toContain('Dismiss');
      expect(actions).not.toContain('Contact Support');
    });

    /**
     * SAD PATH: Get actions for verification failure
     */

    it('should only suggest support for verification failure', () => {
      // Given: Verification failed
      const error: PurchaseFlowError = {
        code: 'VERIFICATION_FAILED',
        message: 'Verification failed',
        retryable: false,
      };

      // When: Getting recovery actions
      const actions = errorHandler.getRecoveryActions(error);

      // Then: Should not include retry
      expect(actions).not.toContain('Retry');
      expect(actions).toContain('Dismiss');
      expect(actions).toContain('Contact Support');
    });
  });

  describe('isCancellation() - Detect user cancellation', () => {
    /**
     * HAPPY PATH: Identify cancellation
     */

    it('should identify PURCHASE_CANCELLED as cancellation', () => {
      // Given: Cancellation error
      const error: PurchaseError = {
        code: 'PURCHASE_CANCELLED',
        message: 'User cancelled',
        retryable: false,
      };

      // When: Checking if cancellation
      const result = errorHandler.isCancellation(error);

      // Then: Should be true
      expect(result).toBe(true);
    });

    it('should identify CANCELLED flow error as cancellation', () => {
      // Given: Flow cancellation
      const error: PurchaseFlowError = {
        code: 'CANCELLED',
        message: 'Cancelled',
        retryable: false,
      };

      // When: Checking if cancellation
      const result = errorHandler.isCancellation(error);

      // Then: Should be true
      expect(result).toBe(true);
    });

    /**
     * SAD PATH: Non-cancellation errors
     */

    it('should not identify other errors as cancellation', () => {
      // Given: Network error
      const error: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'Network failed',
        retryable: true,
        platform: 'ios',
      };

      // When: Checking if cancellation
      const result = errorHandler.isCancellation(error);

      // Then: Should be false
      expect(result).toBe(false);
    });
  });

  describe('isNetworkError() - Detect network errors', () => {
    /**
     * HAPPY PATH: Identify network error
     */

    it('should identify NETWORK_ERROR', () => {
      // Given: Network error
      const error: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'Connection failed',
        retryable: true,
        platform: 'ios',
      };

      // When: Checking if network error
      const result = errorHandler.isNetworkError(error);

      // Then: Should be true
      expect(result).toBe(true);
    });

    /**
     * SAD PATH: Non-network errors
     */

    it('should not identify other errors as network error', () => {
      // Given: Verification error
      const error: PurchaseFlowError = {
        code: 'VERIFICATION_FAILED',
        message: 'Verification failed',
        retryable: false,
      };

      // When: Checking if network error
      const result = errorHandler.isNetworkError(error);

      // Then: Should be false
      expect(result).toBe(false);
    });
  });

  describe('formatForLogging() - Format errors for debugging', () => {
    /**
     * HAPPY PATH: Format error with context
     */

    it('should format error message for logging', () => {
      // Given: Error with context
      const error: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'Connection timeout',
        retryable: true,
        platform: 'ios',
      };

      const context = { productId: 'premium', attempt: 2 };

      // When: Formatting for logging
      const formatted = errorHandler.formatForLogging(error, context);

      // Then: Should have readable format
      expect(formatted).toContain('NETWORK');
      expect(formatted).toContain('Connection Problem');
      expect(formatted).toContain('premium');
    });

    /**
     * EDGE CASE: Format without context
     */

    it('should format error without context', () => {
      // Given: Error without context
      const error: PurchaseFlowError = {
        code: 'CANCELLED',
        message: 'User cancelled',
        retryable: false,
      };

      // When: Formatting for logging
      const formatted = errorHandler.formatForLogging(error);

      // Then: Should still be readable
      expect(formatted).toContain('USER_CANCELLED');
      expect(formatted).toContain('Purchase Cancelled');
      expect(formatted).not.toContain('Context');
    });
  });
});
