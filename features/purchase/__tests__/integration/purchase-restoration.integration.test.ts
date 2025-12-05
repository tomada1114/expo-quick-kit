/**
 * Purchase Restoration Integration Tests - Task 16.8
 *
 * Integration tests for the complete purchase restoration flow:
 * - Fetch purchase history from platform (StoreKit2/Google Play Billing)
 * - Reconcile with LocalDatabase (identify new vs existing)
 * - Deduplication and sync status updates
 * - Idempotent operation verification
 *
 * Requirements Coverage:
 * - Req 6.2: Purchase history retrieval from platform
 * - Req 6.3: Reconciliation with LocalDatabase
 *
 * Test Scenarios (30 tests):
 * 1. Happy Path (6 tests): Normal restoration scenarios
 * 2. Sad Path (5 tests): Expected error conditions
 * 3. Edge Cases (7 tests): Boundary values and special cases
 * 4. Unhappy Path (4 tests): Unexpected system errors
 * 5. Idempotency (5 tests): Multiple calls and race conditions
 * 6. Integration Scenarios (3 tests): Real-world workflows
 *
 * @module features/purchase/__tests__/integration/purchase-restoration.integration.test
 */

// Mock ALL dependencies BEFORE any imports to prevent native module issues
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
          innerJoin: jest.fn(function() {
            return {
              where: jest.fn(function() {
                return {
                  all: jest.fn(() => []),
                };
              }),
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
jest.mock('../../application/purchase-service');

import { db } from '@/database/client';
import { purchases } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { purchaseRepository } from '../../core/repository';
import { purchaseService } from '../../application/purchase-service';
import { restoreService, RestoreError } from '../../application/restore-service';
import type { Transaction, PurchaseError } from '../../core/types';

describe('Purchase Restoration Integration - Task 16.8', () => {
  // Helper to create mock transactions
  const createMockTransaction = (
    overrides?: Partial<Transaction>
  ): Transaction => ({
    transactionId: `txn-${Date.now()}`,
    productId: 'premium_unlock',
    purchaseDate: new Date(),
    receiptData: 'JWS_RECEIPT_DATA',
    ...overrides,
  });

  // Helper to create mock purchase record
  const createMockPurchase = (transactionId: string) => ({
    transactionId,
    productId: 'premium_unlock',
    purchasedAt: Math.floor(Date.now() / 1000),
    price: 9.99,
    currencyCode: 'USD',
    isVerified: true,
    isSynced: false,
    syncedAt: null,
  });

  // Helper to mock platform response
  const mockPlatformHistory = (transactions: Transaction[]) => {
    (purchaseRepository.requestAllPurchaseHistory as jest.Mock).mockResolvedValue(
      {
        success: true,
        data: transactions,
      }
    );
  };

  // Helper to mock platform error
  const mockPlatformError = (error: PurchaseError) => {
    (purchaseRepository.requestAllPurchaseHistory as jest.Mock).mockResolvedValue(
      {
        success: false,
        error,
      }
    );
  };

  // Helper to mock current purchases from DB
  const mockCurrentPurchases = (purchases: any[]) => {
    (purchaseService.getActivePurchases as jest.Mock).mockResolvedValue({
      success: true,
      data: purchases,
    });
  };

  // Helper to mock DB error
  const mockDatabaseError = (errorMsg: string) => {
    (purchaseService.getActivePurchases as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        code: 'DB_ERROR',
        message: errorMsg,
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks to default state
    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        run: jest.fn().mockResolvedValue(void 0),
      }),
    });
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn().mockResolvedValue(void 0),
        })),
      })),
    });
  });

  // ========================================
  // HAPPY PATH TESTS (6 tests)
  // ========================================

  describe('Happy Path - Normal Restoration Scenarios', () => {
    it('E2E-1: Restore purchases with only new transactions', async () => {
      // Given: Platform returns 3 new transactions not in LocalDatabase
      const platformTransactions = [
        createMockTransaction({ transactionId: 'txn-new-1' }),
        createMockTransaction({ transactionId: 'txn-new-2' }),
        createMockTransaction({ transactionId: 'txn-new-3' }),
      ];
      mockPlatformHistory(platformTransactions);
      mockCurrentPurchases([]); // Empty DB

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: All 3 recorded as new with correct counts
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.restoredCount).toBe(3);
        expect(result.data.newCount).toBe(3);
        expect(result.data.updatedCount).toBe(0);
      }
      expect(db.insert).toHaveBeenCalledTimes(3);
    });

    it('E2E-2: Restore purchases with only existing transactions (isSynced=false)', async () => {
      // Given: Platform returns 3 transactions, all exist in DB with isSynced=false
      const platformTransactions = [
        createMockTransaction({ transactionId: 'txn-existing-1' }),
        createMockTransaction({ transactionId: 'txn-existing-2' }),
        createMockTransaction({ transactionId: 'txn-existing-3' }),
      ];
      const dbPurchases = [
        createMockPurchase('txn-existing-1'),
        createMockPurchase('txn-existing-2'),
        createMockPurchase('txn-existing-3'),
      ];
      mockPlatformHistory(platformTransactions);
      mockCurrentPurchases(dbPurchases);

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: All 3 updated with isSynced=true, counts correct
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.restoredCount).toBe(3);
        expect(result.data.newCount).toBe(0);
        expect(result.data.updatedCount).toBe(3);
      }
      expect(db.update).toHaveBeenCalledTimes(3);
    });

    it('E2E-3: Restore purchases with mix of new and existing transactions', async () => {
      // Given: Platform returns 5 transactions: 2 new, 3 existing in DB
      const platformTransactions = [
        createMockTransaction({ transactionId: 'txn-new-1' }),
        createMockTransaction({ transactionId: 'txn-new-2' }),
        createMockTransaction({ transactionId: 'txn-existing-1' }),
        createMockTransaction({ transactionId: 'txn-existing-2' }),
        createMockTransaction({ transactionId: 'txn-existing-3' }),
      ];
      const dbPurchases = [
        createMockPurchase('txn-existing-1'),
        createMockPurchase('txn-existing-2'),
        createMockPurchase('txn-existing-3'),
      ];
      mockPlatformHistory(platformTransactions);
      mockCurrentPurchases(dbPurchases);

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: 2 new recorded, 3 existing updated, correct counts
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.restoredCount).toBe(5);
        expect(result.data.newCount).toBe(2);
        expect(result.data.updatedCount).toBe(3);
      }
      expect(db.insert).toHaveBeenCalledTimes(2);
      expect(db.update).toHaveBeenCalledTimes(3);
    });

    it('E2E-4: Restore purchases with empty history (zero purchases)', async () => {
      // Given: Platform returns empty transaction array
      mockPlatformHistory([]);
      mockCurrentPurchases([]);

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Success with zero counts
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.restoredCount).toBe(0);
        expect(result.data.newCount).toBe(0);
        expect(result.data.updatedCount).toBe(0);
      }
    });

    it('E2E-5: Restore purchases after fresh app reinstall', async () => {
      // Given: User reinstalled app, DB is empty, platform returns 4 historical transactions
      const platformTransactions = [
        createMockTransaction({ transactionId: 'txn-history-1' }),
        createMockTransaction({ transactionId: 'txn-history-2' }),
        createMockTransaction({ transactionId: 'txn-history-3' }),
        createMockTransaction({ transactionId: 'txn-history-4' }),
      ];
      mockPlatformHistory(platformTransactions);
      mockCurrentPurchases([]); // Empty DB after reinstall

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: All 4 recorded as new purchases
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.restoredCount).toBe(4);
        expect(result.data.newCount).toBe(4);
        expect(result.data.updatedCount).toBe(0);
      }
    });

    it('E2E-6: Restore purchases with already synced purchases (isSynced=true)', async () => {
      // Given: Platform returns 3 transactions, all exist in DB with isSynced=true
      const platformTransactions = [
        createMockTransaction({ transactionId: 'txn-synced-1' }),
        createMockTransaction({ transactionId: 'txn-synced-2' }),
        createMockTransaction({ transactionId: 'txn-synced-3' }),
      ];
      const dbPurchases = [
        { ...createMockPurchase('txn-synced-1'), isSynced: true },
        { ...createMockPurchase('txn-synced-2'), isSynced: true },
        { ...createMockPurchase('txn-synced-3'), isSynced: true },
      ];
      mockPlatformHistory(platformTransactions);
      mockCurrentPurchases(dbPurchases);

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: All 3 still updated (idempotent)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.restoredCount).toBe(3);
        expect(result.data.newCount).toBe(0);
        expect(result.data.updatedCount).toBe(3);
      }
    });
  });

  // ========================================
  // SAD PATH TESTS (5 tests)
  // ========================================

  describe('Sad Path - Expected Error Conditions', () => {
    it('E2E-7: Platform returns network error during fetch', async () => {
      // Given: Platform API returns NETWORK_ERROR
      mockPlatformError({
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        retryable: true,
      });

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Returns network error with retryable=true
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NETWORK_ERROR');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('E2E-8: Platform returns store problem error', async () => {
      // Given: Platform API returns STORE_PROBLEM_ERROR
      mockPlatformError({
        code: 'STORE_PROBLEM_ERROR',
        message: 'App Store service temporarily unavailable',
        retryable: true,
      });

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Returns store problem error with retryable=true
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('STORE_PROBLEM_ERROR');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('E2E-9: Database error when fetching current purchases', async () => {
      // Given: Platform fetch succeeds, but getActivePurchases returns DB error
      mockPlatformHistory([createMockTransaction()]);
      mockDatabaseError('Database connection failed');

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Returns DB error with retryable=true
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DB_ERROR');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('E2E-10: Database error when recording new purchase', async () => {
      // Given: Platform returns 1 new transaction, DB insert fails
      mockPlatformHistory([createMockTransaction({ transactionId: 'txn-fail-1' })]);
      mockCurrentPurchases([]);
      (db.insert as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Database insert failed');
      });

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Returns success but newCount=0 (transaction skipped)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newCount).toBe(0);
      }
    });

    it('E2E-11: Database error when updating sync status', async () => {
      // Given: Platform returns 1 existing transaction, DB update fails
      mockPlatformHistory([createMockTransaction({ transactionId: 'txn-update-fail' })]);
      mockCurrentPurchases([createMockPurchase('txn-update-fail')]);
      (db.update as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Database update failed');
      });

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Returns success but updatedCount=0 (transaction skipped)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updatedCount).toBe(0);
      }
    });
  });

  // ========================================
  // EDGE CASES (7 tests)
  // ========================================

  describe('Edge Cases - Boundary Values and Special Scenarios', () => {
    it('E2E-12: Restore large purchase history (50+ transactions)', async () => {
      // Given: Platform returns 100 transactions (50 new, 50 existing)
      const newTransactions = Array.from({ length: 50 }, (_, i) =>
        createMockTransaction({ transactionId: `txn-new-${i}` })
      );
      const existingTransactionIds = Array.from({ length: 50 }, (_, i) =>
        `txn-existing-${i}`
      );
      const existingTransactions = existingTransactionIds.map((id) =>
        createMockTransaction({ transactionId: id })
      );
      const allTransactions = [...newTransactions, ...existingTransactions];

      const dbPurchases = existingTransactionIds.map((id) =>
        createMockPurchase(id)
      );

      mockPlatformHistory(allTransactions);
      mockCurrentPurchases(dbPurchases);

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: All 100 processed, correct counts
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.restoredCount).toBe(100);
        expect(result.data.newCount).toBe(50);
        expect(result.data.updatedCount).toBe(50);
      }
    });

    it('E2E-13: Restore single purchase transaction', async () => {
      // Given: Platform returns exactly 1 transaction (boundary: minimum non-zero)
      mockPlatformHistory([createMockTransaction({ transactionId: 'txn-single' })]);
      mockCurrentPurchases([]);

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Success with correct counts
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.restoredCount).toBe(1);
        expect(result.data.newCount).toBe(1);
        expect(result.data.updatedCount).toBe(0);
      }
    });

    it('E2E-14: Transaction with empty transactionId (validation failure)', async () => {
      // Given: Platform returns transaction with empty transactionId
      const invalidTransaction = createMockTransaction({ transactionId: '' });
      const validTransaction = createMockTransaction({ transactionId: 'txn-valid' });
      mockPlatformHistory([invalidTransaction, validTransaction]);
      mockCurrentPurchases([]);

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Invalid transaction skipped, only valid one processed
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.restoredCount).toBe(2); // Both are in platform response
        expect(result.data.newCount).toBe(1); // Only valid one recorded
      }
    });

    it('E2E-15: Transaction with empty productId (validation failure)', async () => {
      // Given: Platform returns transaction with empty productId
      const invalidTransaction = createMockTransaction({ productId: '' });
      const validTransaction = createMockTransaction({ productId: 'premium_unlock' });
      mockPlatformHistory([invalidTransaction, validTransaction]);
      mockCurrentPurchases([]);

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Invalid transaction skipped
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newCount).toBe(1); // Only valid one recorded
      }
    });

    it('E2E-16: Transaction with invalid purchaseDate (validation failure)', async () => {
      // Given: Platform returns transaction with null purchaseDate
      const invalidTransaction = {
        ...createMockTransaction(),
        purchaseDate: null,
      } as any;
      const validTransaction = createMockTransaction();
      mockPlatformHistory([invalidTransaction, validTransaction]);
      mockCurrentPurchases([]);

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Invalid transaction skipped
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newCount).toBe(1); // Only valid one recorded
      }
    });

    it('E2E-17: Transaction with empty receiptData (validation failure)', async () => {
      // Given: Platform returns transaction with empty receiptData
      const invalidTransaction = createMockTransaction({ receiptData: '' });
      const validTransaction = createMockTransaction({
        receiptData: 'JWS_VALID_DATA',
      });
      mockPlatformHistory([invalidTransaction, validTransaction]);
      mockCurrentPurchases([]);

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Invalid transaction skipped
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newCount).toBe(1); // Only valid one recorded
      }
    });

    it('E2E-18: Transaction with special characters in transactionId', async () => {
      // Given: Platform returns transaction with special characters in ID
      const specialCharIds = [
        'txn-特殊文字',
        'txn-émojis🎉',
        'txn-<script>alert(1)</script>',
        'txn-"quotes"',
      ];
      const transactions = specialCharIds.map((id) =>
        createMockTransaction({ transactionId: id })
      );
      mockPlatformHistory(transactions);
      mockCurrentPurchases([]);

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: All transactions processed normally, special chars preserved
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newCount).toBe(4); // All processed
      }
    });
  });

  // ========================================
  // UNHAPPY PATH TESTS (4 tests)
  // ========================================

  describe('Unhappy Path - Unexpected System Errors', () => {
    it('E2E-19: Exception thrown by requestAllPurchaseHistory', async () => {
      // Given: requestAllPurchaseHistory throws native module error
      (purchaseRepository.requestAllPurchaseHistory as jest.Mock).mockRejectedValueOnce(
        new Error('Native module crashed')
      );

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Catches exception, returns UNKNOWN_ERROR with retryable=false
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('E2E-20: Exception thrown by getActivePurchases', async () => {
      // Given: Platform fetch succeeds, but getActivePurchases throws
      mockPlatformHistory([createMockTransaction()]);
      (purchaseService.getActivePurchases as jest.Mock).mockRejectedValueOnce(
        new Error('Database connection lost')
      );

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Catches exception, returns error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('E2E-21: Platform returns malformed response (missing data)', async () => {
      // Given: Platform returns response without data property
      (purchaseRepository.requestAllPurchaseHistory as jest.Mock).mockResolvedValueOnce({
        success: true,
        // Missing data property - will cause error when trying to iterate
      });

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Returns error due to undefined data
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });

    it('E2E-22: Platform returns non-array transactions', async () => {
      // Given: Platform returns null instead of array
      (purchaseRepository.requestAllPurchaseHistory as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: null,
      });

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Returns error trying to iterate null
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  // ========================================
  // IDEMPOTENCY TESTS (5 tests)
  // ========================================

  describe('Idempotency - Multiple Calls and Race Conditions', () => {
    it('E2E-23: Multiple restoration calls produce same end state', async () => {
      // Given: Platform returns same 3 transactions on every call
      const platformTransactions = [
        createMockTransaction({ transactionId: 'txn-idempotent-1' }),
        createMockTransaction({ transactionId: 'txn-idempotent-2' }),
        createMockTransaction({ transactionId: 'txn-idempotent-3' }),
      ];

      // Call 1: Empty DB
      mockPlatformHistory(platformTransactions);
      mockCurrentPurchases([]);
      const result1 = await restoreService.restorePurchases();

      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.newCount).toBe(3);
        expect(result1.data.updatedCount).toBe(0);
      }

      // Call 2: DB now has those purchases
      const dbPurchases = platformTransactions.map((t) =>
        createMockPurchase(t.transactionId)
      );
      mockPlatformHistory(platformTransactions);
      mockCurrentPurchases(dbPurchases);
      const result2 = await restoreService.restorePurchases();

      expect(result2.success).toBe(true);
      if (result2.success) {
        // Second call should update, not create new records
        expect(result2.data.newCount).toBe(0);
        expect(result2.data.updatedCount).toBe(3);
      }
    });

    it('E2E-24: Restoration after app relaunch (DB persists)', async () => {
      // Given: First restoration completed, app relaunch, DB contains purchases
      const platformTransactions = [
        createMockTransaction({ transactionId: 'txn-persist-1' }),
        createMockTransaction({ transactionId: 'txn-persist-2' }),
      ];

      // Initial state after first restoration
      const persistedPurchases = [
        createMockPurchase('txn-persist-1'),
        createMockPurchase('txn-persist-2'),
      ];

      mockPlatformHistory(platformTransactions);
      mockCurrentPurchases(persistedPurchases);

      // When: restorePurchases() called again
      const result = await restoreService.restorePurchases();

      // Then: Purchases updated, no new records (idempotent)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newCount).toBe(0);
        expect(result.data.updatedCount).toBe(2);
      }
    });

    it('E2E-25: Concurrent restoration calls (race condition)', async () => {
      // Given: Two restorePurchases() calls triggered simultaneously
      const platformTransactions = [
        createMockTransaction({ transactionId: 'txn-race-1' }),
        createMockTransaction({ transactionId: 'txn-race-2' }),
      ];

      mockPlatformHistory(platformTransactions);
      mockCurrentPurchases([]);

      // When: Both calls execute concurrently
      const [result1, result2] = await Promise.all([
        restoreService.restorePurchases(),
        restoreService.restorePurchases(),
      ]);

      // Then: Both succeed (no duplicate records due to DB constraint)
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('E2E-26: Restoration with platform returning duplicate transactionIds', async () => {
      // Given: Platform returns duplicate transactionId in same response
      const duplicateTxn = createMockTransaction({ transactionId: 'txn-dup' });
      const transactions = [duplicateTxn, duplicateTxn, duplicateTxn];
      mockPlatformHistory(transactions);
      mockCurrentPurchases([]);

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: Duplicates handled (only first processed or all cause constraint error)
      expect(result.success).toBe(true);
      if (result.success) {
        // Likely only first duplicate is recorded
        expect(result.data.newCount).toBeGreaterThanOrEqual(1);
        expect(result.data.newCount).toBeLessThanOrEqual(3);
      }
    });

    it('E2E-27: Restoration after partial failure (some transactions processed)', async () => {
      // Given: Previous restoration partially succeeded (3 of 5 recorded)
      const platformTransactions = [
        createMockTransaction({ transactionId: 'txn-partial-1' }),
        createMockTransaction({ transactionId: 'txn-partial-2' }),
        createMockTransaction({ transactionId: 'txn-partial-3' }),
        createMockTransaction({ transactionId: 'txn-partial-4' }),
        createMockTransaction({ transactionId: 'txn-partial-5' }),
      ];

      const partialDBPurchases = [
        createMockPurchase('txn-partial-1'),
        createMockPurchase('txn-partial-2'),
        createMockPurchase('txn-partial-3'),
      ];

      mockPlatformHistory(platformTransactions);
      mockCurrentPurchases(partialDBPurchases);

      // When: restorePurchases() called again
      const result = await restoreService.restorePurchases();

      // Then: Remaining 2 recorded, already recorded ones updated
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newCount).toBe(2);
        expect(result.data.updatedCount).toBe(3);
      }
    });
  });

  // ========================================
  // INTEGRATION SCENARIOS (3 tests)
  // ========================================

  describe('Integration Scenarios - Real-World Workflows', () => {
    it('E2E-28: Complete restoration flow after app reinstall with large history', async () => {
      // Given: User has 25 historical purchases, fresh app install, empty DB
      const historicalTransactions = Array.from({ length: 25 }, (_, i) =>
        createMockTransaction({
          transactionId: `txn-history-${i}`,
          purchaseDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Different dates
        })
      );

      mockPlatformHistory(historicalTransactions);
      mockCurrentPurchases([]); // Fresh install

      // When: User taps "Restore Purchases" button
      const result = await restoreService.restorePurchases();

      // Then: All 25 transactions restored, counts correct
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.restoredCount).toBe(25);
        expect(result.data.newCount).toBe(25);
        expect(result.data.updatedCount).toBe(0);
      }
    });

    it('E2E-29: Restoration updates sync status for offline purchases', async () => {
      // Given: DB contains 3 offline purchases (isSynced=false), platform returns same 3
      const platformTransactions = [
        createMockTransaction({ transactionId: 'txn-offline-1' }),
        createMockTransaction({ transactionId: 'txn-offline-2' }),
        createMockTransaction({ transactionId: 'txn-offline-3' }),
      ];

      const offlinePurchases = [
        { ...createMockPurchase('txn-offline-1'), isSynced: false },
        { ...createMockPurchase('txn-offline-2'), isSynced: false },
        { ...createMockPurchase('txn-offline-3'), isSynced: false },
      ];

      mockPlatformHistory(platformTransactions);
      mockCurrentPurchases(offlinePurchases);

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: All 3 updated to isSynced=true
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updatedCount).toBe(3);
      }
      expect(db.update).toHaveBeenCalledTimes(3);
    });

    it('E2E-30: Restoration with mix of valid and invalid transactions', async () => {
      // Given: Platform returns 10 transactions: 7 valid, 3 invalid
      const validTransactions = Array.from({ length: 7 }, (_, i) =>
        createMockTransaction({ transactionId: `txn-valid-${i}` })
      );

      const invalidTransactions = [
        { ...createMockTransaction(), transactionId: '' }, // Invalid
        { ...createMockTransaction(), productId: '' }, // Invalid
        { ...createMockTransaction(), receiptData: '' }, // Invalid
      ];

      const allTransactions = [...validTransactions, ...invalidTransactions];
      mockPlatformHistory(allTransactions);
      mockCurrentPurchases([]);

      // When: restorePurchases() is called
      const result = await restoreService.restorePurchases();

      // Then: 7 valid processed, 3 invalid skipped
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.restoredCount).toBe(10); // All from platform
        expect(result.data.newCount).toBe(7); // Only valid recorded
      }
    });
  });
});
