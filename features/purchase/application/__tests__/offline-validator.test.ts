/**
 * OfflineValidator Unit Tests
 *
 * Test suite for offline receipt validation.
 * - Cached receipt validation in offline mode
 * - Validation cache expiration
 * - Network restoration and revalidation workflow
 * - Error handling for offline scenarios
 *
 * Task 15.4: OfflineValidator - オフライン検証モード
 */

import { createOfflineValidator, type OfflineValidator, type OfflineValidationResult } from '../offline-validator';
import { type VerificationResult, type VerificationError } from '../../infrastructure/receipt-verifier';

/**
 * Test helper: Create mock verification result
 */
function createMockVerificationResult(overrides?: Partial<VerificationResult>): VerificationResult {
  return {
    isValid: true,
    transactionId: 'txn_123',
    productId: 'product_1',
    purchaseDate: new Date('2025-12-04T10:00:00Z'),
    ...overrides,
  };
}

/**
 * Test helper: Create mock verification error
 */
function createMockVerificationError(overrides?: Partial<VerificationError>): VerificationError {
  return {
    code: 'KEY_NOT_FOUND',
    message: 'Verification key not found',
    ...overrides,
  };
}

describe('OfflineValidator', () => {
  describe('verifyReceiptOffline - Happy Path', () => {
    // Given: Offline validator with cache initialized
    // When: Verifying a receipt that exists in cache and is not expired
    // Then: Return validation success with cached result
    it('should return cached validation result for valid cached receipt', () => {
      const validator = createOfflineValidator();
      const receiptData = 'cached_receipt_data_123';
      const cachedResult = createMockVerificationResult();

      validator.cacheVerificationResult(receiptData, cachedResult);

      const result = validator.verifyReceiptOffline(receiptData);

      expect(result).toEqual({
        isValid: true,
        source: 'cache',
        verificationResult: cachedResult,
        cachedAt: expect.any(Date),
        requiresRevalidation: false,
      });
    });

    // Given: Multiple receipts cached
    // When: Verifying each receipt
    // Then: Return correct cached result for each
    it('should return correct cached result for multiple receipts', () => {
      const validator = createOfflineValidator();
      const receipt1 = 'receipt_1';
      const receipt2 = 'receipt_2';
      const result1 = createMockVerificationResult({ transactionId: 'txn_1' });
      const result2 = createMockVerificationResult({ transactionId: 'txn_2' });

      validator.cacheVerificationResult(receipt1, result1);
      validator.cacheVerificationResult(receipt2, result2);

      const verified1 = validator.verifyReceiptOffline(receipt1);
      const verified2 = validator.verifyReceiptOffline(receipt2);

      expect(verified1.verificationResult?.transactionId).toBe('txn_1');
      expect(verified2.verificationResult?.transactionId).toBe('txn_2');
    });
  });

  describe('verifyReceiptOffline - Sad Path', () => {
    // Given: Receipt not in cache
    // When: Verifying offline
    // Then: Return not-found error with fallback to trust
    it('should return not-found error for receipt not in cache', () => {
      const validator = createOfflineValidator();

      const result = validator.verifyReceiptOffline('unknown_receipt');

      expect(result.isValid).toBe(false);
      expect(result.source).toBe('none');
      expect(result.error?.code).toBe('RECEIPT_NOT_CACHED');
    });

    // Given: Cache has invalid result
    // When: Verifying offline
    // Then: Return cached invalid result
    it('should return cached invalid result', () => {
      const validator = createOfflineValidator();
      const receiptData = 'invalid_receipt';
      const invalidResult: VerificationResult = {
        isValid: false,
        transactionId: 'txn_invalid',
        productId: 'product_1',
        purchaseDate: new Date(),
      };

      validator.cacheVerificationResult(receiptData, invalidResult);

      const result = validator.verifyReceiptOffline(receiptData);

      expect(result.isValid).toBe(false);
      expect(result.verificationResult?.isValid).toBe(false);
    });

    // Given: Empty receipt data
    // When: Verifying offline
    // Then: Return validation error
    it('should return error for empty receipt data', () => {
      const validator = createOfflineValidator();

      const result = validator.verifyReceiptOffline('');

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('verifyReceiptOffline - Edge Cases', () => {
    // Given: Cache expiration configured
    // When: Verifying receipt that has exceeded TTL
    // Then: Mark as requiring revalidation
    it('should mark expired cache as requiring revalidation', () => {
      const validator = createOfflineValidator({ cacheExpirySec: 60 });
      const receiptData = 'expiring_receipt';
      const result = createMockVerificationResult();

      validator.cacheVerificationResult(receiptData, result);

      // Simulate time passing (60 seconds)
      const mockNow = Date.now() + 61 * 1000;
      jest.useFakeTimers();
      jest.setSystemTime(mockNow);

      const verifyResult = validator.verifyReceiptOffline(receiptData);

      expect(verifyResult.requiresRevalidation).toBe(true);
      expect(verifyResult.error?.code).toBe('CACHE_EXPIRED');

      jest.useRealTimers();
    });

    // Given: Custom cache expiry configured
    // When: Verifying before expiry
    // Then: Cache should still be valid
    it('should respect custom cache expiry configuration', () => {
      const validator = createOfflineValidator({ cacheExpirySec: 300 });
      const receiptData = 'receipt_custom_ttl';
      const result = createMockVerificationResult();

      validator.cacheVerificationResult(receiptData, result);

      // Verify within expiry window
      const verifyResult = validator.verifyReceiptOffline(receiptData);

      expect(verifyResult.requiresRevalidation).toBe(false);
      expect(verifyResult.isValid).toBe(true);
    });

    // Given: Very long receipt data
    // When: Caching and verifying
    // Then: Handle gracefully
    it('should handle very long receipt data', () => {
      const validator = createOfflineValidator();
      const longReceipt = 'a'.repeat(10000);
      const result = createMockVerificationResult();

      validator.cacheVerificationResult(longReceipt, result);
      const verifyResult = validator.verifyReceiptOffline(longReceipt);

      expect(verifyResult.isValid).toBe(true);
      expect(verifyResult.source).toBe('cache');
    });

    // Given: Special characters in receipt data
    // When: Caching and verifying
    // Then: Handle correctly
    it('should handle special characters in receipt data', () => {
      const validator = createOfflineValidator();
      const specialReceipt = 'receipt_with_特殊文字_@#$%^&*()_+{}[]|:;<>?,./';
      const result = createMockVerificationResult();

      validator.cacheVerificationResult(specialReceipt, result);
      const verifyResult = validator.verifyReceiptOffline(specialReceipt);

      expect(verifyResult.isValid).toBe(true);
    });
  });

  describe('cacheVerificationResult', () => {
    // Given: Valid verification result
    // When: Caching
    // Then: Store successfully and return success
    it('should cache verification result successfully', () => {
      const validator = createOfflineValidator();
      const receiptData = 'receipt_to_cache';
      const result = createMockVerificationResult();

      const cacheResult = validator.cacheVerificationResult(receiptData, result);

      expect(cacheResult.isOk()).toBe(true);
      expect(cacheResult.ok()).toEqual({
        receiptDataHash: expect.any(String),
        cachedAt: expect.any(Date),
      });
    });

    // Given: Multiple cache operations
    // When: Caching different receipts
    // Then: All cached successfully
    it('should cache multiple results independently', () => {
      const validator = createOfflineValidator();

      const cache1 = validator.cacheVerificationResult('receipt_1', createMockVerificationResult({ transactionId: 'txn_1' }));
      const cache2 = validator.cacheVerificationResult('receipt_2', createMockVerificationResult({ transactionId: 'txn_2' }));

      expect(cache1.isOk()).toBe(true);
      expect(cache2.isOk()).toBe(true);
      expect(cache1.ok().receiptDataHash).not.toBe(cache2.ok().receiptDataHash);
    });

    // Given: Empty receipt data
    // When: Attempting to cache
    // Then: Return error
    it('should return error for empty receipt data', () => {
      const validator = createOfflineValidator();

      const result = validator.cacheVerificationResult('', createMockVerificationResult());

      expect(result.isErr()).toBe(true);
      expect(result.err().code).toBe('INVALID_INPUT');
    });

    // Given: Invalid verification result
    // When: Attempting to cache
    // Then: Validate and cache anyway (store any result)
    it('should cache even invalid verification results', () => {
      const validator = createOfflineValidator();
      const invalidResult: VerificationResult = {
        isValid: false,
        transactionId: 'txn_bad',
        productId: 'product_1',
        purchaseDate: new Date(),
      };

      const cacheResult = validator.cacheVerificationResult('invalid_receipt', invalidResult);

      expect(cacheResult.isOk()).toBe(true);
      const verifyResult = validator.verifyReceiptOffline('invalid_receipt');
      expect(verifyResult.isValid).toBe(false);
    });
  });

  describe('networkRestoration flow', () => {
    // Given: Receipt cached in offline mode
    // When: Network becomes available and revalidation occurs
    // Then: Mark cache entry as pending revalidation
    it('should mark cache as requiring revalidation on network restoration', () => {
      const validator = createOfflineValidator();
      const receiptData = 'receipt_to_revalidate';
      const result = createMockVerificationResult();

      validator.cacheVerificationResult(receiptData, result);
      validator.notifyNetworkRestoration();

      const offlineResult = validator.verifyReceiptOffline(receiptData);

      expect(offlineResult.requiresRevalidation).toBe(true);
      expect(offlineResult.isValid).toBe(true); // Still valid, but needs online revalidation
    });

    // Given: Multiple cached receipts
    // When: Network restoration triggered
    // Then: All entries marked for revalidation
    it('should mark all cached entries for revalidation', () => {
      const validator = createOfflineValidator();

      validator.cacheVerificationResult('receipt_1', createMockVerificationResult({ transactionId: 'txn_1' }));
      validator.cacheVerificationResult('receipt_2', createMockVerificationResult({ transactionId: 'txn_2' }));

      validator.notifyNetworkRestoration();

      const result1 = validator.verifyReceiptOffline('receipt_1');
      const result2 = validator.verifyReceiptOffline('receipt_2');

      expect(result1.requiresRevalidation).toBe(true);
      expect(result2.requiresRevalidation).toBe(true);
    });

    // Given: No cached entries
    // When: Network restoration triggered
    // Then: Handle gracefully
    it('should handle network restoration with empty cache', () => {
      const validator = createOfflineValidator();

      expect(() => validator.notifyNetworkRestoration()).not.toThrow();
    });
  });

  describe('getPendingRevalidations', () => {
    // Given: Mixed cached entries (some expired, some marked for revalidation)
    // When: Requesting pending revalidations
    // Then: Return only those requiring revalidation
    it('should return entries requiring revalidation', () => {
      const validator = createOfflineValidator();

      validator.cacheVerificationResult('receipt_1', createMockVerificationResult({ transactionId: 'txn_1' }));
      validator.cacheVerificationResult('receipt_2', createMockVerificationResult({ transactionId: 'txn_2' }));

      validator.notifyNetworkRestoration();

      const pending = validator.getPendingRevalidations();

      expect(pending.length).toBe(2);
      expect(pending.map(p => p.receiptData)).toContain('receipt_1');
      expect(pending.map(p => p.receiptData)).toContain('receipt_2');
    });

    // Given: No entries requiring revalidation
    // When: Requesting pending revalidations
    // Then: Return empty array
    it('should return empty array when no revalidations pending', () => {
      const validator = createOfflineValidator();

      validator.cacheVerificationResult('receipt_1', createMockVerificationResult());

      const pending = validator.getPendingRevalidations();

      expect(pending).toEqual([]);
    });

    // Given: Large number of cached entries
    // When: Requesting pending revalidations
    // Then: Return all pending entries
    it('should handle large number of pending revalidations', () => {
      const validator = createOfflineValidator();

      for (let i = 0; i < 100; i++) {
        validator.cacheVerificationResult(
          `receipt_${i}`,
          createMockVerificationResult({ transactionId: `txn_${i}` })
        );
      }

      validator.notifyNetworkRestoration();

      const pending = validator.getPendingRevalidations();

      expect(pending.length).toBe(100);
    });
  });

  describe('markRevalidationComplete', () => {
    // Given: Pending revalidation entry
    // When: Marking as complete with online verification result
    // Then: Update cache with new result
    it('should update cache with revalidation result', () => {
      const validator = createOfflineValidator();
      const receiptData = 'receipt_to_revalidate';
      const originalResult = createMockVerificationResult({ transactionId: 'txn_old' });

      validator.cacheVerificationResult(receiptData, originalResult);
      validator.notifyNetworkRestoration();

      const updatedResult = createMockVerificationResult({ transactionId: 'txn_new' });
      const markResult = validator.markRevalidationComplete(receiptData, updatedResult);

      expect(markResult.isOk()).toBe(true);

      const cachedResult = validator.verifyReceiptOffline(receiptData);
      expect(cachedResult.verificationResult?.transactionId).toBe('txn_new');
      expect(cachedResult.requiresRevalidation).toBe(false);
    });

    // Given: Non-existent receipt
    // When: Attempting to mark revalidation complete
    // Then: Return error
    it('should return error for non-existent receipt', () => {
      const validator = createOfflineValidator();

      const result = validator.markRevalidationComplete('unknown_receipt', createMockVerificationResult());

      expect(result.isErr()).toBe(true);
      expect(result.err().code).toBe('RECEIPT_NOT_FOUND');
    });

    // Given: Entry not marked for revalidation
    // When: Attempting to mark as complete
    // Then: Return error
    it('should return error if entry not pending revalidation', () => {
      const validator = createOfflineValidator();
      const receiptData = 'receipt_not_pending';

      validator.cacheVerificationResult(receiptData, createMockVerificationResult());

      const result = validator.markRevalidationComplete(receiptData, createMockVerificationResult());

      expect(result.isErr()).toBe(true);
      expect(result.err().code).toBe('NOT_PENDING_REVALIDATION');
    });
  });

  describe('clearCache', () => {
    // Given: Populated cache
    // When: Clearing cache
    // Then: Remove all entries
    it('should clear all cached entries', () => {
      const validator = createOfflineValidator();

      validator.cacheVerificationResult('receipt_1', createMockVerificationResult());
      validator.cacheVerificationResult('receipt_2', createMockVerificationResult());

      expect(validator.verifyReceiptOffline('receipt_1').isValid).toBe(true);

      validator.clearCache();

      expect(validator.verifyReceiptOffline('receipt_1').isValid).toBe(false);
      expect(validator.verifyReceiptOffline('receipt_2').isValid).toBe(false);
    });

    // Given: Empty cache
    // When: Clearing cache
    // Then: Handle gracefully
    it('should handle clearing empty cache', () => {
      const validator = createOfflineValidator();

      expect(() => validator.clearCache()).not.toThrow();
    });
  });

  describe('getCacheStats', () => {
    // Given: Cache with multiple entries
    // When: Requesting stats
    // Then: Return accurate statistics
    it('should return accurate cache statistics', () => {
      const validator = createOfflineValidator();

      validator.cacheVerificationResult('receipt_1', createMockVerificationResult());
      validator.cacheVerificationResult('receipt_2', createMockVerificationResult());

      const stats = validator.getCacheStats();

      expect(stats.totalCached).toBe(2);
      expect(stats.pendingRevalidation).toBe(0);

      validator.notifyNetworkRestoration();

      const updatedStats = validator.getCacheStats();
      expect(updatedStats.pendingRevalidation).toBe(2);
    });

    // Given: Cache with expired entries
    // When: Requesting stats
    // Then: Include expired count
    it('should include expired entry count in stats', () => {
      const validator = createOfflineValidator({ cacheExpirySec: 60 });

      validator.cacheVerificationResult('receipt_1', createMockVerificationResult());

      const mockNow = Date.now() + 61 * 1000;
      jest.useFakeTimers();
      jest.setSystemTime(mockNow);

      const stats = validator.getCacheStats();

      expect(stats.expiredCount).toBe(1);

      jest.useRealTimers();
    });

    // Given: Empty cache
    // When: Requesting stats
    // Then: Return zero values
    it('should return zero counts for empty cache', () => {
      const validator = createOfflineValidator();

      const stats = validator.getCacheStats();

      expect(stats.totalCached).toBe(0);
      expect(stats.pendingRevalidation).toBe(0);
      expect(stats.expiredCount).toBe(0);
    });
  });

  describe('integration workflow', () => {
    // Given: Complete offline-to-online workflow
    // When: Following offline validation, network restoration, and revalidation
    // Then: All steps complete successfully
    it('should complete full offline-to-online workflow', () => {
      const validator = createOfflineValidator();

      // Step 1: Cache during offline mode
      const originalResult = createMockVerificationResult({ transactionId: 'txn_original' });
      validator.cacheVerificationResult('receipt_workflow', originalResult);

      const offlineResult = validator.verifyReceiptOffline('receipt_workflow');
      expect(offlineResult.isValid).toBe(true);
      expect(offlineResult.requiresRevalidation).toBe(false);

      // Step 2: Network restoration
      validator.notifyNetworkRestoration();

      const afterRestoration = validator.verifyReceiptOffline('receipt_workflow');
      expect(afterRestoration.requiresRevalidation).toBe(true);

      const pending = validator.getPendingRevalidations();
      expect(pending.length).toBe(1);

      // Step 3: Online revalidation
      const revalidatedResult = createMockVerificationResult({ transactionId: 'txn_revalidated' });
      const markResult = validator.markRevalidationComplete('receipt_workflow', revalidatedResult);
      expect(markResult.isOk()).toBe(true);

      // Step 4: Verify updated cache
      const finalResult = validator.verifyReceiptOffline('receipt_workflow');
      expect(finalResult.isValid).toBe(true);
      expect(finalResult.verificationResult?.transactionId).toBe('txn_revalidated');
      expect(finalResult.requiresRevalidation).toBe(false);
    });

    // Given: Multiple receipts in various states
    // When: Complex offline-to-online workflow
    // Then: Handle all states correctly
    it('should handle multiple receipts in various states', () => {
      const validator = createOfflineValidator({ cacheExpirySec: 60 });

      // Cache multiple receipts
      validator.cacheVerificationResult('receipt_1', createMockVerificationResult({ transactionId: 'txn_1' }));
      validator.cacheVerificationResult('receipt_2', createMockVerificationResult({ transactionId: 'txn_2' }));
      validator.cacheVerificationResult('receipt_3', createMockVerificationResult({ transactionId: 'txn_3' }));

      // Trigger network restoration
      validator.notifyNetworkRestoration();

      // Get pending revalidations
      const pending = validator.getPendingRevalidations();
      expect(pending.length).toBe(3);

      // Revalidate each
      for (const entry of pending) {
        const updatedResult = createMockVerificationResult({
          transactionId: `${entry.originalResult?.transactionId}_revalidated`,
        });
        const markResult = validator.markRevalidationComplete(entry.receiptData, updatedResult);
        expect(markResult.isOk()).toBe(true);
      }

      // Verify final state
      const stats = validator.getCacheStats();
      expect(stats.pendingRevalidation).toBe(0);
      expect(stats.totalCached).toBe(3);
    });
  });
});
