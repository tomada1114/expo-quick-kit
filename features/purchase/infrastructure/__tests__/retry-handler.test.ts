/**
 * Retry Handler Tests - Simplified
 *
 * Task 6.5: Automatic retry with exponential backoff
 *
 * Tests retry mechanism including:
 * - Exponential backoff delays
 * - Maximum retry limits
 * - Retryable error detection
 *
 * @module features/purchase/infrastructure/__tests__/retry-handler
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retryHandler,
  DEFAULT_RETRY_CONFIG,
} from '../retry-handler';

describe('RetryHandler - Task 6.5: Automatic Retry with Exponential Backoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('executeWithRetry() - Retry with exponential backoff', () => {
    /**
     * HAPPY PATH: Operation succeeds on first try
     */

    it('should return success immediately if operation succeeds', async () => {
      // Given: Operation that succeeds on first attempt
      let attempts = 0;
      const operation = async () => {
        attempts++;
        return 'success_data';
      };
      const isRetryable = () => false;

      // When: Executing with retry
      const result = await retryHandler.executeWithRetry(
        operation,
        isRetryable,
        DEFAULT_RETRY_CONFIG
      );

      // Then: Should succeed without retries
      expect(result.success).toBe(true);
      expect(result.data).toBe('success_data');
      expect(result.attempts).toBe(1);
      expect(result.lastDelayMs).toBe(0);
      expect(attempts).toBe(1);
    });

    /**
     * HAPPY PATH: Operation fails initially, succeeds on retry
     */

    it('should retry transient failures with exponential backoff', async () => {
      // Given: Operation that fails once then succeeds
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('Transient error');
        }
        return 'success_data';
      };

      const isRetryable = () => true;

      // When: Executing with retry
      const startTime = Date.now();
      const result = await retryHandler.executeWithRetry(operation, isRetryable, {
        maxRetries: 3,
        initialDelayMs: 50,
      });
      const elapsed = Date.now() - startTime;

      // Then: Should succeed after retry with delay
      expect(result.success).toBe(true);
      expect(result.data).toBe('success_data');
      expect(result.attempts).toBe(2);
      expect(result.lastDelayMs).toBe(50);
      expect(elapsed).toBeGreaterThanOrEqual(50);
      expect(attempts).toBe(2);
    });

    /**
     * SAD PATH: Non-retryable error
     */

    it('should fail immediately on non-retryable error', async () => {
      // Given: Operation with permanent error
      let attempts = 0;
      const error = new Error('Permanent error');
      const operation = async () => {
        attempts++;
        throw error;
      };
      const isRetryable = () => false;

      // When: Executing with retry
      const result = await retryHandler.executeWithRetry(
        operation,
        isRetryable,
        DEFAULT_RETRY_CONFIG
      );

      // Then: Should fail without retry
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.attempts).toBe(1);
      expect(attempts).toBe(1);
    });

    /**
     * UNHAPPY PATH: Max retries exceeded
     */

    it('should fail after maximum retries exhausted', async () => {
      // Given: Operation that always fails
      let attempts = 0;
      const error = new Error('Persistent error');
      const operation = async () => {
        attempts++;
        throw error;
      };
      const isRetryable = () => true;

      // When: Executing with retry
      const result = await retryHandler.executeWithRetry(operation, isRetryable, {
        maxRetries: 2,
        initialDelayMs: 10,
      });

      // Then: Should fail after max retries
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.attempts).toBe(3); // Initial + 2 retries
      expect(result.couldRetry).toBe(false);
      expect(attempts).toBe(3);
    });

    /**
     * EDGE CASE: Max delay limit respected
     */

    it('should respect maximum delay limit', async () => {
      // Given: Operation that fails once then succeeds with large backoff
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('Error 1');
        }
        return 'success';
      };

      const isRetryable = () => true;

      // When: Executing with large backoff but maxDelayMs limit
      const result = await retryHandler.executeWithRetry(operation, isRetryable, {
        maxRetries: 1,
        initialDelayMs: 100,
        backoffMultiplier: 10, // Would cause 1000ms delay without limit
        maxDelayMs: 200,
      });

      // Then: Should respect max delay
      expect(result.success).toBe(true);
      expect(result.lastDelayMs).toBeLessThanOrEqual(200);
    });
  });

  describe('executeResultWithRetry() - Retry Result-based operations', () => {
    /**
     * HAPPY PATH: Result operation succeeds
     */

    it('should succeed on first Result operation', async () => {
      // Given: Operation returning success Result
      let attempts = 0;
      const operation = async () => {
        attempts++;
        return { success: true, data: { productId: 'premium' } };
      };

      // When: Executing with retry
      const result = await retryHandler.executeResultWithRetry(
        operation,
        DEFAULT_RETRY_CONFIG
      );

      // Then: Should succeed
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ productId: 'premium' });
      expect(result.attempts).toBe(1);
      expect(attempts).toBe(1);
    });

    /**
     * HAPPY PATH: Retryable error then success
     */

    it('should retry on retryable error Result', async () => {
      // Given: Operation that returns error first, then success
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts === 1) {
          return {
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: 'Network error',
              retryable: true,
            },
          };
        }
        return {
          success: true,
          data: { transactionId: 'txn-123' },
        };
      };

      // When: Executing with retry
      const result = await retryHandler.executeResultWithRetry(
        operation,
        { maxRetries: 3, initialDelayMs: 10 }
      );

      // Then: Should succeed after retry
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ transactionId: 'txn-123' });
      expect(result.attempts).toBe(2);
      expect(attempts).toBe(2);
    });

    /**
     * SAD PATH: Non-retryable error
     */

    it('should fail immediately on non-retryable error Result', async () => {
      // Given: Operation returning non-retryable error
      let attempts = 0;
      const operation = async () => {
        attempts++;
        return {
          success: false,
          error: {
            code: 'VERIFICATION_FAILED',
            message: 'Invalid signature',
            retryable: false,
          },
        };
      };

      // When: Executing with retry
      const result = await retryHandler.executeResultWithRetry(
        operation,
        DEFAULT_RETRY_CONFIG
      );

      // Then: Should fail without retry
      expect(result.success).toBe(false);
      expect(attempts).toBe(1);
    });
  });

  describe('isRetryableError() - Detect retryable errors', () => {
    /**
     * HAPPY PATH: Detect retryable error
     */

    it('should identify retryable errors', () => {
      // Given: Retryable error
      const error = {
        code: 'NETWORK_ERROR',
        message: 'Network failed',
        retryable: true,
      };

      // When: Checking if retryable
      const result = retryHandler.isRetryableError(error);

      // Then: Should be true
      expect(result).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      // Given: Non-retryable error
      const error = {
        code: 'VERIFICATION_FAILED',
        message: 'Invalid signature',
        retryable: false,
      };

      // When: Checking if retryable
      const result = retryHandler.isRetryableError(error);

      // Then: Should be false
      expect(result).toBe(false);
    });

    /**
     * EDGE CASE: Missing retryable flag
     */

    it('should return false for errors without retryable flag', () => {
      // Given: Error without retryable property
      const error = { message: 'Some error' };

      // When: Checking if retryable
      const result = retryHandler.isRetryableError(error);

      // Then: Should be false
      expect(result).toBe(false);
    });

    it('should return false for null/undefined', () => {
      // Given: Null error
      // When/Then: Should be false
      expect(retryHandler.isRetryableError(null)).toBe(false);
      expect(retryHandler.isRetryableError(undefined)).toBe(false);
    });
  });

  describe('DEFAULT_RETRY_CONFIG', () => {
    /**
     * HAPPY PATH: Default config characteristics
     */

    it('should have sensible defaults', () => {
      // Given: Default config
      // Then: Should have expected values
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.initialDelayMs).toBe(1000);
      expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBe(2);
      expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(32000);
    });
  });
});
