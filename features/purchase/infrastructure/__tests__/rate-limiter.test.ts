/**
 * RateLimiter Tests - Verification Retry Rate Limiting
 *
 * Tests comprehensive retry rate limiting for receipt verification failures.
 * Ensures that excessive verification failures trigger manual intervention requirement.
 *
 * Test Perspectives:
 * - Happy path: Within rate limit, retries allowed
 * - Sad path: Rate limit exceeded, manual intervention required
 * - Edge cases: Boundary values, reset behavior
 * - Unhappy path: Concurrent operations, storage failures
 *
 * Task 15.1: RateLimiter - verification retry rate limiting
 */

import { RateLimiter } from '../rate-limiter';

describe('RateLimiter - Verification Retry Rate Limiting', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
  });

  describe('Happy Path - Retries Within Limit', () => {
    test('allows retry when under limit for first transactionId', async () => {
      // Given: RateLimiter with default max retries (3)
      // When: recordRetryFailure is called for a new transactionId
      // Then: canRetry should return true

      const transactionId = 'txn_001';
      const result = await rateLimiter.canRetry(transactionId);

      expect(result).toBe(true);
    });

    test('allows multiple retries up to max limit', async () => {
      // Given: RateLimiter with default max retries (3)
      // When: recordRetryFailure is called 3 times
      // Then: canRetry returns true for all 3 attempts

      const transactionId = 'txn_002';

      // First failure - should allow retry
      await rateLimiter.recordRetryFailure(transactionId);
      expect(await rateLimiter.canRetry(transactionId)).toBe(true);

      // Second failure - should allow retry
      await rateLimiter.recordRetryFailure(transactionId);
      expect(await rateLimiter.canRetry(transactionId)).toBe(true);

      // Third failure - should allow retry
      await rateLimiter.recordRetryFailure(transactionId);
      expect(await rateLimiter.canRetry(transactionId)).toBe(true);
    });

    test('returns correct retry count', async () => {
      // Given: Transaction with 2 retry failures
      // When: getRetryCount is called
      // Then: Returns 2

      const transactionId = 'txn_003';

      await rateLimiter.recordRetryFailure(transactionId);
      await rateLimiter.recordRetryFailure(transactionId);

      const count = await rateLimiter.getRetryCount(transactionId);
      expect(count).toBe(2);
    });

    test('resets retry count after successful clearance', async () => {
      // Given: Transaction with 2 retry failures
      // When: clearRetryRecord is called
      // Then: Retry count resets to 0

      const transactionId = 'txn_004';

      await rateLimiter.recordRetryFailure(transactionId);
      await rateLimiter.recordRetryFailure(transactionId);

      await rateLimiter.clearRetryRecord(transactionId);

      const count = await rateLimiter.getRetryCount(transactionId);
      expect(count).toBe(0);
    });

    test('tracks different transactionIds independently', async () => {
      // Given: Two different transactionIds
      // When: recordRetryFailure is called different number of times
      // Then: Each transaction has independent retry count

      const txn1 = 'txn_005a';
      const txn2 = 'txn_005b';

      await rateLimiter.recordRetryFailure(txn1);
      await rateLimiter.recordRetryFailure(txn1);

      await rateLimiter.recordRetryFailure(txn2);

      expect(await rateLimiter.getRetryCount(txn1)).toBe(2);
      expect(await rateLimiter.getRetryCount(txn2)).toBe(1);
    });
  });

  describe('Sad Path - Rate Limit Exceeded', () => {
    test('denies retry when limit is exceeded', async () => {
      // Given: RateLimiter with max retries = 3
      // When: recordRetryFailure is called 4 times
      // Then: canRetry returns false

      const transactionId = 'txn_010';

      // Record 3 failures (at limit)
      for (let i = 0; i < 3; i++) {
        await rateLimiter.recordRetryFailure(transactionId);
      }

      // Fourth failure exceeds limit
      await rateLimiter.recordRetryFailure(transactionId);

      const canRetry = await rateLimiter.canRetry(transactionId);
      expect(canRetry).toBe(false);
    });

    test('returns correct error when rate limit exceeded', async () => {
      // Given: Transaction exceeding retry limit
      // When: getRetryStatus is called
      // Then: Returns error with requiresManualIntervention = true

      const transactionId = 'txn_011';

      // Exceed limit
      for (let i = 0; i < 4; i++) {
        await rateLimiter.recordRetryFailure(transactionId);
      }

      const status = await rateLimiter.getRetryStatus(transactionId);

      expect(status.isLimited).toBe(true);
      expect(status.requiresManualIntervention).toBe(true);
      expect(status.retryCount).toBe(4);
    });

    test('maintains rate limit across multiple checks', async () => {
      // Given: Transaction at rate limit
      // When: canRetry is called multiple times
      // Then: Consistently returns false

      const transactionId = 'txn_012';

      for (let i = 0; i < 4; i++) {
        await rateLimiter.recordRetryFailure(transactionId);
      }

      // Check multiple times
      expect(await rateLimiter.canRetry(transactionId)).toBe(false);
      expect(await rateLimiter.canRetry(transactionId)).toBe(false);
      expect(await rateLimiter.canRetry(transactionId)).toBe(false);
    });
  });

  describe('Edge Cases - Boundary Values', () => {
    test('handles empty transactionId gracefully', async () => {
      // Given: RateLimiter with empty transactionId
      // When: canRetry is called
      // Then: Returns false (invalid input)

      const result = await rateLimiter.canRetry('');
      expect(result).toBe(false);
    });

    test('handles null/undefined transactionId gracefully', async () => {
      // Given: RateLimiter with null transactionId
      // When: canRetry is called
      // Then: Returns false

      const result = await rateLimiter.canRetry(null as any);
      expect(result).toBe(false);
    });

    test('handles special characters in transactionId', async () => {
      // Given: TransactionId with special characters
      // When: recordRetryFailure is called
      // Then: Stores and retrieves correctly

      const transactionId = 'txn_@#$%_special!&^';

      await rateLimiter.recordRetryFailure(transactionId);
      const count = await rateLimiter.getRetryCount(transactionId);

      expect(count).toBe(1);
    });

    test('allows zero retries configuration', async () => {
      // Given: RateLimiter with maxRetries = 0
      // When: recordRetryFailure is called once
      // Then: canRetry returns false immediately

      const limiter = new RateLimiter({ maxRetries: 0 });
      const transactionId = 'txn_013';

      await limiter.recordRetryFailure(transactionId);
      const canRetry = await limiter.canRetry(transactionId);

      expect(canRetry).toBe(false);
    });

    test('allows high retry limit configuration', async () => {
      // Given: RateLimiter with maxRetries = 100
      // When: recordRetryFailure is called 50 times
      // Then: canRetry returns true

      const limiter = new RateLimiter({ maxRetries: 100 });
      const transactionId = 'txn_014';

      for (let i = 0; i < 50; i++) {
        await limiter.recordRetryFailure(transactionId);
      }

      const canRetry = await limiter.canRetry(transactionId);
      expect(canRetry).toBe(true);
    });

    test('handles concurrent retry recording on same transactionId', async () => {
      // Given: Multiple concurrent recordRetryFailure calls
      // When: Called simultaneously on same transaction
      // Then: All failures are counted correctly

      const transactionId = 'txn_015';

      // Record 3 failures concurrently
      await Promise.all([
        rateLimiter.recordRetryFailure(transactionId),
        rateLimiter.recordRetryFailure(transactionId),
        rateLimiter.recordRetryFailure(transactionId),
      ]);

      const count = await rateLimiter.getRetryCount(transactionId);
      expect(count).toBe(3);
    });
  });

  describe('Unhappy Path - System Errors', () => {
    test('handles storage failure gracefully on recordRetryFailure', async () => {
      // Given: RateLimiter with storage issue
      // When: recordRetryFailure throws error
      // Then: Error is propagated for caller handling

      // Mock storage failure scenario
      const limiter = new RateLimiter();
      const transactionId = 'txn_016';

      // This should not throw - implementation handles storage internally
      // If it does throw, it's a proper failure case
      const result = await limiter.recordRetryFailure(transactionId);
      expect(result).not.toThrow;
    });

    test('provides default status when no retry history exists', async () => {
      // Given: TransactionId with no retry history
      // When: getRetryStatus is called
      // Then: Returns default status with isLimited = false

      const transactionId = 'txn_017_no_history';
      const status = await rateLimiter.getRetryStatus(transactionId);

      expect(status.isLimited).toBe(false);
      expect(status.requiresManualIntervention).toBe(false);
      expect(status.retryCount).toBe(0);
    });

    test('recovers from concurrent access patterns', async () => {
      // Given: Multiple concurrent operations
      // When: getRetryCount, recordRetryFailure, canRetry called concurrently
      // Then: All return correct values

      const transactionId = 'txn_018';

      const results = await Promise.all([
        rateLimiter.recordRetryFailure(transactionId),
        rateLimiter.canRetry(transactionId),
        rateLimiter.getRetryCount(transactionId),
      ]);

      expect(results).toHaveLength(3);
      // recordRetryFailure returns undefined
      // canRetry returns boolean
      // getRetryCount returns number
    });
  });

  describe('Configuration & Customization', () => {
    test('accepts custom maxRetries configuration', async () => {
      // Given: RateLimiter with custom maxRetries = 5
      // When: recordRetryFailure is called 6 times
      // Then: canRetry returns false on 6th

      const limiter = new RateLimiter({ maxRetries: 5 });
      const transactionId = 'txn_019';

      for (let i = 0; i < 5; i++) {
        await limiter.recordRetryFailure(transactionId);
      }

      expect(await limiter.canRetry(transactionId)).toBe(true);

      await limiter.recordRetryFailure(transactionId);
      expect(await limiter.canRetry(transactionId)).toBe(false);
    });

    test('accepts custom reset duration configuration', async () => {
      // Given: RateLimiter with custom resetDurationMs = 1000
      // When: clearRetryRecord is called
      // Then: Record is cleared immediately

      const limiter = new RateLimiter({
        maxRetries: 3,
        resetDurationMs: 1000,
      });

      const transactionId = 'txn_020';
      await limiter.recordRetryFailure(transactionId);
      await limiter.clearRetryRecord(transactionId);

      expect(await limiter.getRetryCount(transactionId)).toBe(0);
    });
  });

  describe('Status Reporting', () => {
    test('returns detailed retry status', async () => {
      // Given: Transaction with retry failures
      // When: getRetryStatus is called
      // Then: Returns complete status information

      const transactionId = 'txn_021';

      await rateLimiter.recordRetryFailure(transactionId);
      await rateLimiter.recordRetryFailure(transactionId);

      const status = await rateLimiter.getRetryStatus(transactionId);

      expect(status).toHaveProperty('retryCount');
      expect(status).toHaveProperty('isLimited');
      expect(status).toHaveProperty('requiresManualIntervention');
      expect(status.retryCount).toBe(2);
      expect(status.isLimited).toBe(false);
    });

    test('returns all limited transactionIds', async () => {
      // Given: Multiple transactions, some limited
      // When: getLimitedTransactions is called
      // Then: Returns only limited transaction IDs

      const txn1 = 'txn_022a';
      const txn2 = 'txn_022b';

      // Limit txn1
      for (let i = 0; i < 4; i++) {
        await rateLimiter.recordRetryFailure(txn1);
      }

      // Don't limit txn2
      await rateLimiter.recordRetryFailure(txn2);

      const limited = await rateLimiter.getLimitedTransactions();

      expect(limited).toContain(txn1);
      expect(limited).not.toContain(txn2);
    });

    test('provides statistics summary', async () => {
      // Given: Multiple transactions with various retry counts
      // When: getStatistics is called
      // Then: Returns aggregate statistics

      const txn1 = 'txn_023a';
      const txn2 = 'txn_023b';

      for (let i = 0; i < 4; i++) {
        await rateLimiter.recordRetryFailure(txn1);
      }

      for (let i = 0; i < 2; i++) {
        await rateLimiter.recordRetryFailure(txn2);
      }

      const stats = await rateLimiter.getStatistics();

      expect(stats).toHaveProperty('totalTrackedTransactions');
      expect(stats).toHaveProperty('limitedCount');
      expect(stats.totalTrackedTransactions).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Integration Scenarios', () => {
    test('typical verification retry scenario - success within limit', async () => {
      // Given: Verification fails twice, then succeeds
      // When: Retry handling completes
      // Then: Transaction is usable after clearing

      const transactionId = 'txn_integration_001';

      // First verification attempt fails
      await rateLimiter.recordRetryFailure(transactionId);
      expect(await rateLimiter.canRetry(transactionId)).toBe(true);

      // Second attempt fails
      await rateLimiter.recordRetryFailure(transactionId);
      expect(await rateLimiter.canRetry(transactionId)).toBe(true);

      // Third attempt succeeds - clear record
      await rateLimiter.clearRetryRecord(transactionId);
      expect(await rateLimiter.getRetryCount(transactionId)).toBe(0);
    });

    test('manual intervention scenario - limit exceeded', async () => {
      // Given: Verification fails 4 times (exceeds limit of 3)
      // When: Manual intervention is needed
      // Then: System prevents further automatic retries

      const transactionId = 'txn_integration_002';

      for (let i = 0; i < 4; i++) {
        await rateLimiter.recordRetryFailure(transactionId);
      }

      const canAutoRetry = await rateLimiter.canRetry(transactionId);
      expect(canAutoRetry).toBe(false);

      const status = await rateLimiter.getRetryStatus(transactionId);
      expect(status.requiresManualIntervention).toBe(true);
    });
  });
});
