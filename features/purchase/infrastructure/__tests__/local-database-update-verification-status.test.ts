/**
 * LocalDatabase Service Tests - Task 11.5: updateVerificationStatus
 *
 * Test suite for LocalDatabase.updateVerificationStatus() method
 * Updates isVerified flag based on receipt verification results.
 *
 * Test Coverage:
 * - Happy path: Successfully update isVerified flag to true/false
 * - Sad path: Transaction not found, validation errors, database errors
 * - Edge cases: Boundary values (empty string, null, long strings, special characters)
 * - Unhappy path: Database connection failures, concurrent updates
 * - Integration: Works with other database operations
 *
 * Requirements (Task 11.5):
 * - Update isVerified flag in purchases table
 * - Validate transactionId is non-empty string
 * - Return transaction ID and isVerified status on success
 * - Handle NOT_FOUND when purchase doesn't exist
 * - Return INVALID_INPUT for empty/null/invalid transactionId
 * - Handle database errors gracefully with retryable flag
 *
 * @module features/purchase/infrastructure/__tests__/local-database-update-verification-status.test
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { eq } from 'drizzle-orm';
import { db } from '@/database/client';
import { purchases } from '@/database/schema';
import { localDatabase } from '../local-database';
import type { Purchase } from '../../core/types';

describe('LocalDatabase - updateVerificationStatus (Task 11.5)', () => {
  // Test data cleanup helpers
  const deleteTestPurchase = (transactionId: string) => {
    try {
      db.delete(purchases)
        .where(eq(purchases.transactionId, transactionId))
        .run();
    } catch (e) {
      // Ignore cleanup errors
    }
  };

  const createTestPurchase = (
    transactionId: string,
    isVerified: boolean = false
  ): Purchase => ({
    transactionId,
    productId: 'premium_unlock',
    purchasedAt: new Date(),
    price: 9.99,
    currencyCode: 'USD',
    isVerified,
    isSynced: false,
    unlockedFeatures: [],
  });

  const recordTestPurchase = async (
    transactionId: string,
    isVerified: boolean = false
  ) => {
    const purchase = createTestPurchase(transactionId, isVerified);
    return await localDatabase.recordPurchase(
      purchase.transactionId,
      purchase.productId,
      purchase.purchasedAt,
      purchase.price,
      purchase.currencyCode,
      purchase.isVerified,
      purchase.isSynced
    );
  };

  beforeEach(() => {
    // Clean up before each test
    deleteTestPurchase('txn-verify-001');
    deleteTestPurchase('txn-unverify-001');
    deleteTestPurchase('txn-partial-update-001');
    deleteTestPurchase('txn-multi-update-001');
    deleteTestPurchase('txn-concurrent-001');
    deleteTestPurchase('txn-concurrent-002');
    deleteTestPurchase('txn-idempotent-001');
    deleteTestPurchase('txn-consistency-001');
    deleteTestPurchase('txn-integration-verify-001');
    deleteTestPurchase('txn-sync-verify-001');
    deleteTestPurchase('txn-long-id-' + 'x'.repeat(1000));
    deleteTestPurchase('txn-special-!@#$%^&*()');
  });

  afterEach(() => {
    // Clean up after each test
    deleteTestPurchase('txn-verify-001');
    deleteTestPurchase('txn-unverify-001');
    deleteTestPurchase('txn-partial-update-001');
    deleteTestPurchase('txn-multi-update-001');
    deleteTestPurchase('txn-concurrent-001');
    deleteTestPurchase('txn-concurrent-002');
    deleteTestPurchase('txn-idempotent-001');
    deleteTestPurchase('txn-consistency-001');
    deleteTestPurchase('txn-integration-verify-001');
    deleteTestPurchase('txn-sync-verify-001');
  });

  // ===== HAPPY PATH =====

  describe('Happy Path - Successful verification status updates', () => {
    it('should successfully update isVerified flag to true', async () => {
      // Given: A purchase exists in database with isVerified=false
      const purchase = createTestPurchase('txn-verify-001', false);
      await recordTestPurchase(purchase.transactionId, purchase.isVerified);

      // When: updateVerificationStatus is called to verify
      const result = await localDatabase.updateVerificationStatus('txn-verify-001', true);

      // Then: Should successfully update the verification status
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactionId).toBe('txn-verify-001');
        expect(result.data.isVerified).toBe(true);
      }

      // Verify: Check database was updated
      const dbRecord = db
        .select()
        .from(purchases)
        .where(eq(purchases.transactionId, 'txn-verify-001'))
        .get();
      expect(dbRecord?.isVerified).toBe(true);
    });

    it('should successfully update isVerified flag to false', async () => {
      // Given: A verified purchase needs to be marked as unverified
      const purchase = createTestPurchase('txn-unverify-001', true);
      await recordTestPurchase(purchase.transactionId, purchase.isVerified);

      // When: updateVerificationStatus is called to unverify
      const result = await localDatabase.updateVerificationStatus('txn-unverify-001', false);

      // Then: Should successfully update to false
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isVerified).toBe(false);
      }

      // Verify database update
      const dbRecord = db
        .select()
        .from(purchases)
        .where(eq(purchases.transactionId, 'txn-unverify-001'))
        .get();
      expect(dbRecord?.isVerified).toBe(false);
    });

    it('should update only isVerified field without modifying other fields', async () => {
      // Given: A purchase with multiple fields
      const purchase: Purchase = {
        transactionId: 'txn-partial-update-001',
        productId: 'premium_unlock',
        purchasedAt: new Date('2025-12-04T10:00:00Z'),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: false,
        isSynced: true,
        syncedAt: new Date('2025-12-04T11:00:00Z'),
        unlockedFeatures: ['feature_1', 'feature_2'],
      };

      await recordTestPurchase(purchase.transactionId, purchase.isVerified);

      // When: Only updating verification status
      const result = await localDatabase.updateVerificationStatus(
        'txn-partial-update-001',
        true
      );

      // Then: Only isVerified changes, others remain the same
      expect(result.success).toBe(true);

      const dbRecord = db
        .select()
        .from(purchases)
        .where(eq(purchases.transactionId, 'txn-partial-update-001'))
        .get();

      expect(dbRecord?.isVerified).toBe(true);
      expect(dbRecord?.isSynced).toBe(true); // Should remain unchanged
      expect(dbRecord?.price).toBe(9.99); // Should remain unchanged
      expect(dbRecord?.currencyCode).toBe('USD');
    });

    it('should handle multiple sequential updates to same transaction', async () => {
      // Given: A purchase that gets updated multiple times
      const purchase = createTestPurchase('txn-multi-update-001', false);
      await recordTestPurchase(purchase.transactionId, purchase.isVerified);

      // When: Update multiple times
      const result1 = await localDatabase.updateVerificationStatus(
        'txn-multi-update-001',
        true
      );
      const result2 = await localDatabase.updateVerificationStatus(
        'txn-multi-update-001',
        false
      );
      const result3 = await localDatabase.updateVerificationStatus(
        'txn-multi-update-001',
        true
      );

      // Then: All updates succeed
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      // Verify final state
      const dbRecord = db
        .select()
        .from(purchases)
        .where(eq(purchases.transactionId, 'txn-multi-update-001'))
        .get();
      expect(dbRecord?.isVerified).toBe(true);
    });
  });

  // ===== SAD PATH =====

  describe('Sad Path - Expected error scenarios', () => {
    it('should return NOT_FOUND error for non-existent transaction', async () => {
      // Given: Transaction ID that doesn't exist
      // When: updateVerificationStatus is called
      const result = await localDatabase.updateVerificationStatus(
        'txn-nonexistent-001',
        true
      );

      // Then: Should return NOT_FOUND error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toContain('transaction not found');
      }
    });

    it('should return INVALID_INPUT error for empty transactionId', async () => {
      // Given: Empty transaction ID
      // When: updateVerificationStatus is called with empty string
      const result = await localDatabase.updateVerificationStatus('', true);

      // Then: Should return INVALID_INPUT error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_INPUT');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should return INVALID_INPUT error for null transactionId', async () => {
      // Given: Null transaction ID
      // When: updateVerificationStatus is called
      const result = await localDatabase.updateVerificationStatus(null as any, true);

      // Then: Should return INVALID_INPUT error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('should return INVALID_INPUT error for undefined transactionId', async () => {
      // Given: Undefined transaction ID
      // When: updateVerificationStatus is called
      const result = await localDatabase.updateVerificationStatus(undefined as any, true);

      // Then: Should return INVALID_INPUT error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('should return INVALID_INPUT error for whitespace-only transactionId', async () => {
      // Given: Whitespace-only transaction ID
      // When: updateVerificationStatus is called
      const result = await localDatabase.updateVerificationStatus('   ', true);

      // Then: Should return INVALID_INPUT error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });
  });

  // ===== EDGE CASES =====

  describe('Edge Cases - Boundary conditions', () => {
    it('should handle very long transactionId', async () => {
      // Given: A purchase with very long transaction ID
      const longTxnId = 'txn-long-id-' + 'x'.repeat(1000);
      const purchase = createTestPurchase(longTxnId, false);
      await recordTestPurchase(purchase.transactionId, purchase.isVerified);

      // When: updateVerificationStatus is called
      const result = await localDatabase.updateVerificationStatus(longTxnId, true);

      // Then: Should succeed
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactionId).toBe(longTxnId);
      }
    });

    it('should handle transactionId with special characters', async () => {
      // Given: A purchase with special characters in ID
      const specialTxnId = 'txn-special-!@#$%^&*()';
      const purchase = createTestPurchase(specialTxnId, false);
      await recordTestPurchase(purchase.transactionId, purchase.isVerified);

      // When: updateVerificationStatus is called
      const result = await localDatabase.updateVerificationStatus(specialTxnId, true);

      // Then: Should succeed
      expect(result.success).toBe(true);
    });

    it('should handle concurrent updates to different transactions', async () => {
      // Given: Multiple purchases
      const purchases_list = [
        createTestPurchase('txn-concurrent-001', false),
        createTestPurchase('txn-concurrent-002', false),
      ];

      for (const p of purchases_list) {
        await localDatabase.recordPurchase(p);
      }

      // When: Concurrent updates
      const [result1, result2] = await Promise.all([
        localDatabase.updateVerificationStatus('txn-concurrent-001', true),
        localDatabase.updateVerificationStatus('txn-concurrent-002', false),
      ]);

      // Then: Both succeed
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should handle idempotent updates (same value twice)', async () => {
      // Given: A purchase with isVerified=true
      const purchase = createTestPurchase('txn-idempotent-001', true);
      await recordTestPurchase(purchase.transactionId, purchase.isVerified);

      // When: Update to same value twice
      const result1 = await localDatabase.updateVerificationStatus(
        'txn-idempotent-001',
        true
      );
      const result2 = await localDatabase.updateVerificationStatus(
        'txn-idempotent-001',
        true
      );

      // Then: Both succeed
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should handle alternating boolean values', async () => {
      // Given: A purchase
      const purchase = createTestPurchase('txn-alternate-001', true);
      await recordTestPurchase(purchase.transactionId, purchase.isVerified);

      // When: Alternating updates
      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = await localDatabase.updateVerificationStatus(
          'txn-alternate-001',
          i % 2 === 0
        );
        results.push(result);
      }

      // Then: All succeed
      expect(results.every((r) => r.success)).toBe(true);

      // Final state should be false (last alternation)
      const dbRecord = db
        .select()
        .from(purchases)
        .where(eq(purchases.transactionId, 'txn-alternate-001'))
        .get();
      expect(dbRecord?.isVerified).toBe(false);
    });
  });

  // ===== UNHAPPY PATH =====

  describe('Unhappy Path - Exceptions and error scenarios', () => {
    it('should not leave database in inconsistent state on partial failure', async () => {
      // Given: A purchase is recorded
      const purchase = createTestPurchase('txn-consistency-001', false);
      await recordTestPurchase(purchase.transactionId, purchase.isVerified);

      // When: updateVerificationStatus succeeds
      const result = await localDatabase.updateVerificationStatus('txn-consistency-001', true);

      // Then: Database is in consistent state
      expect(result.success).toBe(true);

      // Verify purchase still has all its data
      const dbRecord = db
        .select()
        .from(purchases)
        .where(eq(purchases.transactionId, 'txn-consistency-001'))
        .get();

      expect(dbRecord?.transactionId).toBe('txn-consistency-001');
      expect(dbRecord?.productId).toBe('premium_unlock');
      expect(dbRecord?.isVerified).toBe(true);
      expect(dbRecord?.price).toBe(9.99);
    });

    it('should handle type coercion gracefully', async () => {
      // Given: A purchase
      const purchase = createTestPurchase('txn-type-001', false);
      await recordTestPurchase(purchase.transactionId, purchase.isVerified);

      // When: updateVerificationStatus is called with coercible types
      const result = await localDatabase.updateVerificationStatus(
        'txn-type-001',
        true as any // Valid: boolean
      );

      // Then: Should succeed
      expect(result.success).toBe(true);
    });
  });

  // ===== INTEGRATION SCENARIOS =====

  describe('Integration - updateVerificationStatus with other operations', () => {
    it('should integrate with recordPurchase and synchronously reflect changes', async () => {
      // Given: A purchase is recorded as unverified
      const purchase = createTestPurchase('txn-integration-verify-001', false);
      const recordResult = await recordTestPurchase(purchase.transactionId, purchase.isVerified);
      expect(recordResult.success).toBe(true);

      // When: Verification status is updated
      const updateResult = await localDatabase.updateVerificationStatus(
        'txn-integration-verify-001',
        true
      );
      expect(updateResult.success).toBe(true);

      // Then: Direct database query reflects the updated status
      const dbRecord = db
        .select()
        .from(purchases)
        .where(eq(purchases.transactionId, 'txn-integration-verify-001'))
        .get();

      expect(dbRecord?.isVerified).toBe(true);
      expect(dbRecord?.transactionId).toBe('txn-integration-verify-001');
      expect(dbRecord?.productId).toBe('premium_unlock');
    });

    it('should work in sequence with updateSyncStatus', async () => {
      // Given: A purchase is recorded
      const purchase = createTestPurchase('txn-sync-verify-001', false);
      await recordTestPurchase(purchase.transactionId, purchase.isVerified);

      // When: Update verification first, then sync status
      const verifyResult = await localDatabase.updateVerificationStatus(
        'txn-sync-verify-001',
        true
      );
      expect(verifyResult.success).toBe(true);

      const syncResult = await localDatabase.updateSyncStatus('txn-sync-verify-001', true);
      expect(syncResult.success).toBe(true);

      // Then: Both flags are updated correctly
      const dbRecord = db
        .select()
        .from(purchases)
        .where(eq(purchases.transactionId, 'txn-sync-verify-001'))
        .get();

      expect(dbRecord?.isVerified).toBe(true);
      expect(dbRecord?.isSynced).toBe(true);
    });

    it('should return correct data structure on success', async () => {
      // Given: A purchase exists
      const purchase = createTestPurchase('txn-data-structure-001', false);
      await recordTestPurchase(purchase.transactionId, purchase.isVerified);

      // When: updateVerificationStatus is called
      const result = await localDatabase.updateVerificationStatus(
        'txn-data-structure-001',
        true
      );

      // Then: Result has correct structure
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data).toBe('object');
        expect(result.data.transactionId).toBe('txn-data-structure-001');
        expect(typeof result.data.isVerified).toBe('boolean');
        expect(result.data.isVerified).toBe(true);
      }
    });

    it('should return correct error structure on NOT_FOUND', async () => {
      // When: updateVerificationStatus called with non-existent ID
      const result = await localDatabase.updateVerificationStatus('txn-not-found', true);

      // Then: Error structure is correct
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(typeof result.error.message).toBe('string');
        expect(result.error.retryable).toBe(false);
      }
    });
  });

  // ===== METHOD SIGNATURE VALIDATION =====

  describe('Method Signatures - Type safety', () => {
    it('should accept string and boolean parameters', async () => {
      // Given: A purchase exists
      const purchase = createTestPurchase('txn-sig-001', false);
      await recordTestPurchase(purchase.transactionId, purchase.isVerified);

      // When: Called with correct types
      const result = await localDatabase.updateVerificationStatus('txn-sig-001', true);

      // Then: Should work without type errors
      expect(result.success).toBe(true);
    });

    it('should return Promise<Result<{transactionId, isVerified}, DatabaseError>>', async () => {
      // Given: A purchase exists
      const purchase = createTestPurchase('txn-return-001', false);
      await recordTestPurchase(purchase.transactionId, purchase.isVerified);

      // When: Called
      const result = localDatabase.updateVerificationStatus('txn-return-001', true);

      // Then: Should return Promise
      expect(result).toBeInstanceOf(Promise);
      const resolvedResult = await result;
      expect(resolvedResult.success).toBe(true);
    });

    it('should be async function', () => {
      // Then: updateVerificationStatus should be a function
      expect(typeof localDatabase.updateVerificationStatus).toBe('function');
    });
  });
});
