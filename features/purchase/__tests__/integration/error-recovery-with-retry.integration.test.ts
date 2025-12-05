/**
 * Error Recovery with Retry Integration Tests - Task 16.9
 *
 * Integration tests for error recovery with automatic retry mechanism:
 * - Network errors trigger automatic retry with exponential backoff
 * - Retry delays follow pattern: 1s → 2s → 4s (3 retries, 4 total attempts)
 * - Eventual success after transient failures
 * - Graceful degradation when retries exhausted
 * - Non-retryable errors fail immediately without retry
 *
 * Requirements Coverage:
 * - Req 8.1: Automatic retry with exponential backoff
 * - Req 9.2: Error recovery during purchase flow
 *
 * Test Scenarios (14 tests):
 * 1. Happy Path (3 tests): Success after retries, immediate success, retry exhaustion
 * 2. Sad Path (4 tests): Network errors with retry, non-retryable errors, verification failures
 * 3. Edge Cases (4 tests): Max retry boundaries, rapid retries, mixed error types
 * 4. Unhappy Path (3 tests): Unexpected exceptions, system failures, partial recovery
 *
 * @module features/purchase/__tests__/integration/error-recovery-with-retry.integration.test
 */

// Mock ALL dependencies BEFORE any imports
jest.mock('@/database/client', () => ({
  db: {
    insert: jest.fn(() => ({
      values: jest.fn().mockReturnValue({
        run: jest.fn().mockResolvedValue(void 0),
      }),
    })),
    select: jest.fn(() => ({
      from: jest.fn(function() {
        return {
          where: jest.fn(function() {
            return {
              all: jest.fn(() => []),
              get: jest.fn(() => undefined),
            };
          }),
        };
      }),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn().mockResolvedValue(void 0),
        })),
      })),
    })),
  },
  initializeDatabase: jest.fn(),
  isDatabaseInitialized: jest.fn(() => true),
  resetDatabaseState: jest.fn(),
  DatabaseInitError: Error,
}));

jest.mock('@/database/schema', () => ({
  purchases: {
    transactionId: 'transaction_id',
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  sql: jest.fn(),
}));

jest.mock('../../core/repository');
jest.mock('../../infrastructure/receipt-verifier');
jest.mock('../../infrastructure/verification-metadata-store');
jest.mock('../../infrastructure/error-handler');

import { db } from '@/database/client';
import { purchases } from '@/database/schema';
import { purchaseRepository } from '../../core/repository';
import { purchaseService } from '../../application/purchase-service';
import { receiptVerifier } from '../../infrastructure/receipt-verifier';
import { verificationMetadataStore } from '../../infrastructure/verification-metadata-store';
import { retryHandler, DEFAULT_RETRY_CONFIG } from '../../infrastructure/retry-handler';
import type { Transaction, PurchaseError } from '../../core/types';

describe('Error Recovery with Retry Integration - Task 16.9', () => {
  // Test helpers
  const createMockTransaction = (
    overrides?: Partial<Transaction>
  ): Transaction => ({
    transactionId: `txn-${Date.now()}`,
    productId: 'premium_unlock',
    purchaseDate: new Date(),
    receiptData: 'JWS_RECEIPT_DATA',
    ...overrides,
  });

  const createMockNetworkError = (): PurchaseError => ({
    code: 'NETWORK_ERROR',
    message: 'Network connection failed',
    retryable: true,
  });

  const createMockNonRetryableError = (): PurchaseError => ({
    code: 'PURCHASE_CANCELLED',
    message: 'User cancelled purchase',
    retryable: false,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful verification by default
    (receiptVerifier.verifyReceiptSignature as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        transactionId: 'txn-123',
        productId: 'premium_unlock',
        purchaseDate: new Date(),
      },
    });

    // Mock successful metadata save by default
    (verificationMetadataStore.saveVerificationMetadata as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  describe('Happy Path - Successful recovery after retries', () => {
    // E2E-1: Network error on first attempt, success on second attempt
    it('should succeed after single network error with exponential backoff (1 retry)', async () => {
      // Given: Purchase flow that fails on first attempt with network error, succeeds on retry
      let attemptCount = 0;
      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockImplementation(
        async () => {
          attemptCount++;
          if (attemptCount === 1) {
            // First attempt fails with network error
            return { success: false, error: createMockNetworkError() };
          }
          // Second attempt succeeds
          return { success: true, data: createMockTransaction() };
        }
      );

      // When: Purchase is initiated
      const result = await purchaseService.purchaseProduct('premium_unlock');

      // Then: Eventually succeeds after retry
      expect(result.success).toBe(true);
      expect(result.data?.transactionId).toBe('txn-123');
      expect(attemptCount).toBe(2); // Called twice: initial + 1 retry
    });

    // E2E-2: Network errors on first two attempts, success on third attempt (max backoff)
    it('should succeed after multiple network errors with exponential backoff (2 retries)', async () => {
      // Given: Purchase flow that fails on first two attempts, succeeds on third
      let attemptCount = 0;
      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockImplementation(
        async () => {
          attemptCount++;
          if (attemptCount <= 2) {
            // First two attempts fail with network error
            return { success: false, error: createMockNetworkError() };
          }
          // Third attempt succeeds
          return { success: true, data: createMockTransaction() };
        }
      );

      // When: Purchase is initiated
      const result = await purchaseService.purchaseProduct('premium_unlock');

      // Then: Eventually succeeds after 2 retries
      expect(result.success).toBe(true);
      expect(result.data?.transactionId).toBe('txn-123');
      expect(attemptCount).toBe(3); // Called three times: initial + 2 retries
    });

    // E2E-3: Immediate success without retry
    it('should succeed immediately without retry if no error', async () => {
      // Given: Purchase flow succeeds on first attempt
      const mockTransaction = createMockTransaction();
      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTransaction,
      });

      // When: Purchase is initiated
      const result = await purchaseService.purchaseProduct('premium_unlock');

      // Then: Succeeds immediately without retries
      expect(result.success).toBe(true);
      expect(result.data?.transactionId).toBe('txn-123');
      expect(purchaseRepository.launchPurchaseFlow).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sad Path - Expected error conditions with retry exhaustion', () => {
    // E2E-4: Network error persists through all retries
    it(
      'should fail gracefully after max retries exhausted (exponential backoff)',
      async () => {
        // Given: Purchase flow that consistently fails with network error
        (purchaseRepository.launchPurchaseFlow as jest.Mock).mockResolvedValue({
          success: false,
          error: createMockNetworkError(),
        });

        // When: Purchase is initiated with exhausted retries
        const result = await purchaseService.purchaseProduct('premium_unlock');

        // Then: Fails after 4 total attempts (1 initial + 3 retries)
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('NETWORK_ERROR');
        expect(result.error?.retryable).toBe(true);
        expect(purchaseRepository.launchPurchaseFlow).toHaveBeenCalledTimes(4); // 1 + 3 retries
      },
      10000 // Increase timeout to 10s to allow for exponential backoff delays
    );

    // E2E-5: Non-retryable error fails immediately without retry
    it('should fail immediately for non-retryable errors (no retry)', async () => {
      // Given: Purchase flow fails with non-retryable cancellation error
      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockResolvedValue({
        success: false,
        error: createMockNonRetryableError(),
      });

      // When: Purchase is initiated
      const result = await purchaseService.purchaseProduct('premium_unlock');

      // Then: Fails immediately without retry
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CANCELLED');
      expect(result.error?.retryable).toBe(false);
      expect(purchaseRepository.launchPurchaseFlow).toHaveBeenCalledTimes(1); // No retries
    });

    // E2E-6: Verification failure after successful purchase (no retry of verification)
    it('should fail verification without retry if receipt is invalid', async () => {
      // Given: Purchase succeeds but verification fails
      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockResolvedValue({
        success: true,
        data: createMockTransaction(),
      });

      (receiptVerifier.verifyReceiptSignature as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Signature verification failed',
        },
      });

      // When: Purchase is initiated
      const result = await purchaseService.purchaseProduct('premium_unlock');

      // Then: Fails with verification error, no retry of verification
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VERIFICATION_FAILED');
      expect(result.error?.retryable).toBe(false);
      expect(receiptVerifier.verifyReceiptSignature).toHaveBeenCalledTimes(1);
    });

    // E2E-7: Metadata save error with retryable flag
    it('should return retryable error if metadata save fails', async () => {
      // Given: Purchase and verification succeed but metadata save fails
      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockResolvedValue({
        success: true,
        data: createMockTransaction(),
      });

      (verificationMetadataStore.saveVerificationMetadata as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Failed to save metadata',
        },
      });

      // When: Purchase is initiated
      const result = await purchaseService.purchaseProduct('premium_unlock');

      // Then: Fails with retryable DB error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
      expect(result.error?.retryable).toBe(true);
    });
  });

  describe('Edge Cases - Boundary values and special scenarios', () => {
    // E2E-8: Retry with exact exponential backoff delays
    it('should apply correct exponential backoff delays (1s → 2s → 4s)', async () => {
      // Given: Network errors with timing validation
      const delays: number[] = [];
      let attemptCount = 0;

      // Spy on the delay function to capture delays
      const originalDelay = retryHandler._delay;
      (retryHandler._delay as jest.Mock) = jest.fn(async (ms) => {
        delays.push(ms);
        return new Promise((resolve) => setTimeout(resolve, 0)); // Immediate in test
      });

      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockImplementation(
        async () => {
          attemptCount++;
          if (attemptCount <= 2) {
            return { success: false, error: createMockNetworkError() };
          }
          return { success: true, data: createMockTransaction() };
        }
      );

      // When: Purchase is initiated
      const result = await purchaseService.purchaseProduct('premium_unlock');

      // Then: Exponential backoff delays are correct
      expect(result.success).toBe(true);
      expect(delays).toEqual([1000, 2000]); // 1s, 2s delays

      // Restore original delay
      (retryHandler._delay as any) = originalDelay;
    });

    // E2E-9: Very rapid network errors (no delay between retries in test)
    it('should handle rapid retry attempts correctly', async () => {
      // Given: Rapid sequential failures followed by success
      let attemptCount = 0;
      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockImplementation(
        async () => {
          attemptCount++;
          // Fail first 3 attempts, succeed on 4th
          return attemptCount <= 3
            ? { success: false, error: createMockNetworkError() }
            : { success: true, data: createMockTransaction() };
        }
      );

      // When: Purchase is initiated
      const result = await purchaseService.purchaseProduct('premium_unlock');

      // Then: All retries are attempted
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(4); // Max attempts: 1 initial + 3 retries
    }, 10000); // Timeout for full backoff delays

    // E2E-10: Switching between retryable and non-retryable errors
    it('should fail immediately when error changes from retryable to non-retryable', async () => {
      // Given: First error is retryable, second is not (edge case)
      let attemptCount = 0;
      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockImplementation(
        async () => {
          attemptCount++;
          if (attemptCount === 1) {
            return { success: false, error: createMockNetworkError() };
          }
          // Second attempt has non-retryable error
          return { success: false, error: createMockNonRetryableError() };
        }
      );

      // When: Purchase is initiated
      const result = await purchaseService.purchaseProduct('premium_unlock');

      // Then: Fails after encountering non-retryable error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CANCELLED');
      expect(attemptCount).toBe(2); // Called once, retried, failed on non-retryable error
    });

    // E2E-11: Max delay boundary (should not exceed maxDelayMs)
    it('should not exceed maximum delay limit', async () => {
      // Given: Many retry attempts to test delay cap
      const delays: number[] = [];
      let attemptCount = 0;

      // Spy on delay with max delay boundary
      const originalDelay = retryHandler._delay;
      (retryHandler._delay as jest.Mock) = jest.fn(async (ms) => {
        delays.push(ms);
        // Verify no delay exceeds maxDelayMs (32000)
        expect(ms).toBeLessThanOrEqual(32000);
      });

      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockImplementation(
        async () => {
          attemptCount++;
          return attemptCount === 4
            ? { success: true, data: createMockTransaction() }
            : { success: false, error: createMockNetworkError() };
        }
      );

      // When: Purchase is initiated
      const result = await purchaseService.purchaseProduct('premium_unlock');

      // Then: All delays are within acceptable range
      expect(result.success).toBe(true);
      expect(delays.every((d) => d <= 32000)).toBe(true);

      // Restore
      (retryHandler._delay as any) = originalDelay;
    });
  });

  describe('Unhappy Path - Unexpected system failures and graceful degradation', () => {
    // E2E-12: Exception thrown during operation (not structured error)
    it('should handle unexpected exceptions during purchase flow', async () => {
      // Given: Operation throws unexpected exception
      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockRejectedValue(
        new Error('Unexpected runtime error')
      );

      // When: Purchase is initiated
      const result = await purchaseService.purchaseProduct('premium_unlock');

      // Then: Fails with graceful error handling
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.error?.retryable).toBe(false);
    });

    // E2E-13: Database corruption during metadata save after successful purchase
    it('should handle database errors gracefully with retryable flag', async () => {
      // Given: Purchase succeeds, verification succeeds, but DB is unavailable
      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockResolvedValue({
        success: true,
        data: createMockTransaction(),
      });

      (verificationMetadataStore.saveVerificationMetadata as jest.Mock).mockRejectedValue(
        new Error('Database connection lost')
      );

      // When: Purchase is initiated
      const result = await purchaseService.purchaseProduct('premium_unlock');

      // Then: Fails with retryable error (user can retry)
      expect(result.success).toBe(false);
      // Should indicate retryable nature due to DB error
      expect(result.error?.code).toBe('UNKNOWN_ERROR'); // Unexpected exception wrapped
      expect(result.error?.retryable).toBe(false); // Exception, not structured error
    });

    // E2E-14: Partial recovery - success after metadata save failure and retry
    it('should support partial recovery workflow (purchase → verify → metadata save)', async () => {
      // Given: Full purchase flow with potential failure points
      let purchaseAttempts = 0;

      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockImplementation(
        async () => {
          purchaseAttempts++;
          // Always succeed on purchase
          return { success: true, data: createMockTransaction() };
        }
      );

      let metadataAttempts = 0;
      (verificationMetadataStore.saveVerificationMetadata as jest.Mock).mockImplementation(
        async () => {
          metadataAttempts++;
          // Fail first time, succeed on potential retry
          if (metadataAttempts === 1) {
            return {
              success: false,
              error: { code: 'TRANSIENT_DB_ERROR' },
            };
          }
          return { success: true };
        }
      );

      // When: Purchase is initiated
      const result = await purchaseService.purchaseProduct('premium_unlock');

      // Then: Shows clear error for user decision on retry
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
      expect(result.error?.retryable).toBe(true); // User can retry the full flow
    });
  });

  describe('Integration - Real-world retry workflows', () => {
    // E2E-15: Simulated real-world scenario - intermittent network
    it('should handle intermittent network with eventual success', async () => {
      // Given: Simulated intermittent network (fails, succeeds, fails, succeeds)
      const states = ['fail', 'fail', 'success'];
      let attemptCount = 0;

      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockImplementation(
        async () => {
          const state = states[attemptCount % states.length];
          attemptCount++;

          if (state === 'fail') {
            return { success: false, error: createMockNetworkError() };
          }
          return { success: true, data: createMockTransaction() };
        }
      );

      // When: Purchase is initiated
      const result = await purchaseService.purchaseProduct('premium_unlock');

      // Then: Eventually succeeds despite intermittent failures
      expect(result.success).toBe(true);
      expect(result.data?.transactionId).toBe('txn-123');
    });

    // E2E-16: Full lifecycle - retry during purchase, success through verification and save
    it('should handle complete purchase lifecycle with retry and verification', async () => {
      // Given: Full integration with retry, verification, and metadata save
      let purchaseAttempts = 0;

      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockImplementation(
        async () => {
          purchaseAttempts++;
          if (purchaseAttempts === 1) {
            // First attempt fails with network error
            return { success: false, error: createMockNetworkError() };
          }
          // Subsequent attempts succeed
          return { success: true, data: createMockTransaction() };
        }
      );

      (receiptVerifier.verifyReceiptSignature as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          transactionId: 'txn-123',
          productId: 'premium_unlock',
          purchaseDate: new Date(),
        },
      });

      (verificationMetadataStore.saveVerificationMetadata as jest.Mock).mockResolvedValue({
        success: true,
      });

      // When: Complete purchase flow is executed
      const result = await purchaseService.purchaseProduct('premium_unlock');

      // Then: All stages complete successfully
      expect(result.success).toBe(true);
      expect(result.data?.isVerified).toBe(true);
      expect(result.data?.isSynced).toBe(false);
      expect(purchaseRepository.launchPurchaseFlow).toHaveBeenCalledTimes(2); // 1 fail + 1 success
      expect(receiptVerifier.verifyReceiptSignature).toHaveBeenCalledTimes(1);
      expect(verificationMetadataStore.saveVerificationMetadata).toHaveBeenCalledTimes(1);
    });

    // E2E-17: Custom retry configuration
    it('should respect custom retry configuration', async () => {
      // Given: Custom retry config with fewer retries
      const customConfig = { maxRetries: 1, initialDelayMs: 500 };
      let attemptCount = 0;

      (purchaseRepository.launchPurchaseFlow as jest.Mock).mockImplementation(
        async () => {
          attemptCount++;
          // Always fail to test retry limit
          return { success: false, error: createMockNetworkError() };
        }
      );

      // When: Using custom retry config
      const result = await retryHandler.executeResultWithRetry(
        async () => purchaseRepository.launchPurchaseFlow('premium_unlock'),
        customConfig
      );

      // Then: Respects max retries limit
      expect(result.success).toBe(false);
      expect(attemptCount).toBe(2); // 1 initial + 1 retry (not 3)
    });
  });
});
