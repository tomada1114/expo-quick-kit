/**
 * Error Logger Tests
 *
 * Task 6.5: Error logging with timestamps
 *
 * Tests error logging functionality including:
 * - Timestamp recording
 * - Error categorization
 * - Log retrieval and filtering
 * - Error statistics
 *
 * @module features/purchase/infrastructure/__tests__/error-logger
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { errorLogger, type ErrorLogEntry } from '../error-logger';
import type { PurchaseError } from '../../core/types';

describe('ErrorLogger - Task 6.5: Error Logging with Timestamps', () => {
  beforeEach(() => {
    errorLogger.clearLogs();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logPurchaseError() - Record errors with timestamp', () => {
    /**
     * HAPPY PATH: Log network error with timestamp
     */

    it('should record network error with current timestamp', async () => {
      // Given: Network error from purchase platform
      const error: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'Connection failed',
        retryable: true,
        platform: 'ios',
      };

      const beforeTime = new Date();

      // When: Error is logged
      const entry = await Promise.resolve().then(() =>
        errorLogger.logPurchaseError(error)
      );

      const afterTime = new Date();

      // Then: Should have timestamp between before and after times
      expect(entry).toHaveProperty('timestamp');
      expect(entry.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(entry.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should record error with ISO 8601 timestamp string', () => {
      // Given: Any purchase error
      const error: PurchaseError = {
        code: 'STORE_PROBLEM_ERROR',
        message: 'Store unavailable',
        retryable: true,
        nativeErrorCode: 2,
      };

      // When: Error is logged
      const entry = errorLogger.logPurchaseError(error);

      // Then: Should have ISO 8601 formatted timestamp
      expect(entry.timestampISO).toBeDefined();
      expect(entry.timestampISO).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      // Verify it matches the timestamp
      expect(entry.timestampISO).toBe(entry.timestamp.toISOString());
    });

    it('should record cancellation error with metadata', () => {
      // Given: User cancellation with product context
      const error: PurchaseError = {
        code: 'PURCHASE_CANCELLED',
        message: 'User cancelled purchase',
        retryable: false,
      };

      const metadata = { productId: 'premium_unlock', userId: 'user-123' };

      // When: Error is logged with metadata
      const entry = errorLogger.logPurchaseError(error, metadata);

      // Then: Should store metadata
      expect(entry.errorCode).toBe('PURCHASE_CANCELLED');
      expect(entry.metadata).toEqual(metadata);
      expect(entry.retryable).toBe(false);
    });

    it('should record invalid signature error with platform info', () => {
      // Given: Invalid purchase signature
      const error: PurchaseError = {
        code: 'PURCHASE_INVALID',
        message: 'Invalid signature',
        retryable: false,
        reason: 'not_signed',
      };

      // When: Error is logged
      const entry = errorLogger.logPurchaseError(error);

      // Then: Should capture error details
      expect(entry.errorCode).toBe('PURCHASE_INVALID');
      expect(entry.message).toBe('Invalid signature');
      expect(entry.retryable).toBe(false);
    });

    /**
     * SAD PATH: Log unavailable product error
     */

    it('should record product unavailable error with product ID', () => {
      // Given: Product is not available
      const error: PurchaseError = {
        code: 'PRODUCT_UNAVAILABLE',
        message: 'Product not available in region',
        retryable: false,
        productId: 'old_product',
      };

      // When: Error is logged
      const entry = errorLogger.logPurchaseError(error);

      // Then: Should capture product ID
      expect(entry.errorCode).toBe('PRODUCT_UNAVAILABLE');
      expect(entry.metadata).toBeUndefined();
    });
  });

  describe('logFlowError() - Record application-layer errors', () => {
    /**
     * HAPPY PATH: Log verification failed error
     */

    it('should record verification failed error with timestamp', () => {
      // Given: Verification failure in purchase service
      const error = {
        code: 'VERIFICATION_FAILED',
        message: 'Receipt verification failed: Invalid signature',
        retryable: false,
      };

      const context = { transactionId: 'txn-123', attempt: 1 };

      // When: Error is logged
      const entry = errorLogger.logFlowError(error, context);

      // Then: Should have timestamp and context
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.errorCode).toBe('VERIFICATION_FAILED');
      expect(entry.metadata).toEqual(context);
    });

    it('should record DB error with retry context', () => {
      // Given: Database recording failure
      const error = {
        code: 'DB_ERROR',
        message: 'Failed to record purchase to database',
        retryable: true,
      };

      const context = {
        transactionId: 'txn-456',
        attempt: 2,
        maxRetries: 3,
      };

      // When: Error is logged
      const entry = errorLogger.logFlowError(error, context);

      // Then: Should capture retry context
      expect(entry.metadata).toEqual(context);
      expect(entry.retryable).toBe(true);
    });
  });

  describe('logError() - Record generic exceptions', () => {
    /**
     * HAPPY PATH: Log unexpected error
     */

    it('should record unexpected error with stack trace', () => {
      // Given: Unexpected JavaScript error
      const error = new Error('Something went wrong');

      const context = { operation: 'purchaseProduct' };

      // When: Error is logged
      const entry = errorLogger.logError(error, context);

      // Then: Should capture stack trace
      expect(entry.message).toBe('Something went wrong');
      expect(entry.stack).toBeDefined();
      expect(entry.errorCode).toBe('UNKNOWN_ERROR');
      expect(entry.retryable).toBe(false);
    });

    it('should log non-Error objects', () => {
      // Given: Non-Error value thrown
      const error = { foo: 'bar' };

      // When: Error is logged
      const entry = errorLogger.logError(error);

      // Then: Should handle gracefully
      expect(entry).toBeDefined();
      expect(entry.errorCode).toBe('UNKNOWN_ERROR');
    });
  });

  describe('getLogs() - Retrieve error history', () => {
    /**
     * HAPPY PATH: Get all logged errors
     */

    it('should return all logged errors in order', () => {
      // Given: Multiple errors logged
      const error1: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'First error',
        retryable: true,
        platform: 'ios',
      };

      const error2: PurchaseError = {
        code: 'PURCHASE_CANCELLED',
        message: 'Second error',
        retryable: false,
      };

      errorLogger.logPurchaseError(error1);
      errorLogger.logPurchaseError(error2);

      // When: Getting all logs
      const logs = errorLogger.getLogs();

      // Then: Should return all errors in order
      expect(logs.length).toBe(2);
      expect(logs[0].errorCode).toBe('NETWORK_ERROR');
      expect(logs[1].errorCode).toBe('PURCHASE_CANCELLED');
    });

    it('should return empty array when no errors logged', () => {
      // Given: No errors logged
      // When: Getting logs
      const logs = errorLogger.getLogs();

      // Then: Should be empty
      expect(logs).toEqual([]);
    });
  });

  describe('getErrorsSince() - Filter errors by time', () => {
    /**
     * HAPPY PATH: Get recent errors
     */

    it('should return errors logged after specific timestamp', async () => {
      // Given: Multiple errors at different times
      const error1: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'Early error',
        retryable: true,
        platform: 'ios',
      };

      errorLogger.logPurchaseError(error1);

      const midTime = new Date(Date.now() + 1);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const error2: PurchaseError = {
        code: 'PURCHASE_CANCELLED',
        message: 'Later error',
        retryable: false,
      };

      errorLogger.logPurchaseError(error2);

      // When: Getting errors since midpoint
      const logs = errorLogger.getErrorsSince(midTime);

      // Then: Should only return later error
      expect(logs.length).toBe(1);
      expect(logs[0].errorCode).toBe('PURCHASE_CANCELLED');
    });

    /**
     * EDGE CASE: Filter with future timestamp
     */

    it('should return empty array when filtering with future timestamp', () => {
      // Given: Error logged in the past
      const error: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'Old error',
        retryable: true,
        platform: 'ios',
      };

      errorLogger.logPurchaseError(error);

      const futureTime = new Date(Date.now() + 60000);

      // When: Getting errors since future
      const logs = errorLogger.getErrorsSince(futureTime);

      // Then: Should be empty
      expect(logs).toEqual([]);
    });
  });

  describe('getErrorsByCode() - Filter errors by type', () => {
    /**
     * HAPPY PATH: Get network errors
     */

    it('should return all errors with matching code', () => {
      // Given: Multiple errors of different types
      errorLogger.logPurchaseError({
        code: 'NETWORK_ERROR',
        message: 'Network error 1',
        retryable: true,
        platform: 'ios',
      });

      errorLogger.logPurchaseError({
        code: 'PURCHASE_CANCELLED',
        message: 'Cancelled',
        retryable: false,
      });

      errorLogger.logPurchaseError({
        code: 'NETWORK_ERROR',
        message: 'Network error 2',
        retryable: true,
        platform: 'android',
      });

      // When: Getting network errors
      const logs = errorLogger.getErrorsByCode('NETWORK_ERROR');

      // Then: Should return only network errors
      expect(logs.length).toBe(2);
      expect(logs.every((l) => l.errorCode === 'NETWORK_ERROR')).toBe(true);
    });

    it('should return empty array when no errors match code', () => {
      // Given: Errors logged
      errorLogger.logPurchaseError({
        code: 'PURCHASE_CANCELLED',
        message: 'Cancelled',
        retryable: false,
      });

      // When: Getting non-existent error type
      const logs = errorLogger.getErrorsByCode('VERIFICATION_FAILED');

      // Then: Should be empty
      expect(logs).toEqual([]);
    });
  });

  describe('getStatistics() - Error monitoring', () => {
    /**
     * HAPPY PATH: Get error statistics
     */

    it('should calculate error statistics correctly', () => {
      // Given: Multiple errors of different types and platforms
      errorLogger.logPurchaseError({
        code: 'NETWORK_ERROR',
        message: 'Network 1',
        retryable: true,
        platform: 'ios',
      });

      errorLogger.logPurchaseError({
        code: 'NETWORK_ERROR',
        message: 'Network 2',
        retryable: true,
        platform: 'android',
      });

      errorLogger.logPurchaseError({
        code: 'PURCHASE_CANCELLED',
        message: 'Cancelled',
        retryable: false,
      });

      errorLogger.logPurchaseError({
        code: 'STORE_PROBLEM_ERROR',
        message: 'Store problem',
        retryable: true,
        platform: 'ios',
      });

      // When: Getting statistics
      const stats = errorLogger.getStatistics();

      // Then: Should have correct counts
      expect(stats.totalErrors).toBe(4);
      expect(stats.byCode['NETWORK_ERROR']).toBe(2);
      expect(stats.byCode['PURCHASE_CANCELLED']).toBe(1);
      expect(stats.byCode['STORE_PROBLEM_ERROR']).toBe(1);
      expect(stats.byPlatform['ios']).toBe(2);
      expect(stats.byPlatform['android']).toBe(1);
      expect(stats.retryableCount).toBe(3);
    });

    it('should handle empty logs', () => {
      // Given: No errors logged
      // When: Getting statistics
      const stats = errorLogger.getStatistics();

      // Then: Should return zeros
      expect(stats.totalErrors).toBe(0);
      expect(stats.byCode).toEqual({});
      expect(stats.byPlatform).toEqual({});
      expect(stats.retryableCount).toBe(0);
    });
  });

  describe('exportLogsAsJson() - Export for debugging', () => {
    /**
     * HAPPY PATH: Export logs as JSON
     */

    it('should export logs as valid JSON', () => {
      // Given: Multiple errors logged
      errorLogger.logPurchaseError({
        code: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        platform: 'ios',
      });

      // When: Exporting as JSON
      const json = errorLogger.exportLogsAsJson();

      // Then: Should be valid JSON
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      expect(parsed[0].errorCode).toBe('NETWORK_ERROR');
    });
  });

  describe('clearLogs() - Clean up logs', () => {
    /**
     * HAPPY PATH: Clear all logs
     */

    it('should clear all logged errors', () => {
      // Given: Errors logged
      errorLogger.logPurchaseError({
        code: 'NETWORK_ERROR',
        message: 'Error',
        retryable: true,
        platform: 'ios',
      });

      expect(errorLogger.getLogs().length).toBe(1);

      // When: Clearing logs
      errorLogger.clearLogs();

      // Then: Should have no logs
      expect(errorLogger.getLogs()).toEqual([]);
    });
  });
});
