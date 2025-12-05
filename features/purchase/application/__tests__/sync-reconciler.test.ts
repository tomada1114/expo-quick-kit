/**
 * Sync Reconciler Tests - Local/Platform Purchase State Reconciliation
 *
 * Task 9.3: Tests for detecting and resolving purchase state mismatches
 *
 * Coverage:
 * - Happy path: Platform data updates local DB correctly
 * - Sad path: Network/DB errors during reconciliation
 * - Edge cases: Empty results, partial failures, concurrent operations
 * - Unhappy path: System errors, data corruption recovery
 */

import type { Purchase, Transaction } from '../../core/types';
import { syncReconciler, type ReconciliationResult } from '../sync-reconciler';

/**
 * Mock Purchase Repository
 */
const mockPurchaseRepository = {
  requestAllPurchaseHistory: jest.fn(),
};

/**
 * Mock Purchase Service
 */
const mockPurchaseService = {
  getActivePurchases: jest.fn(),
};

/**
 * Mock database operations
 */
const mockDatabase = {
  updatePurchase: jest.fn(),
  deletePurchase: jest.fn(),
  recordPurchase: jest.fn(),
};

/**
 * Helper to create mock transaction
 */
function createMockTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    transactionId: 'txn_' + Math.random().toString(36).substr(2, 9),
    productId: 'product_1',
    purchaseDate: new Date(),
    receiptData: 'mock_receipt',
    ...overrides,
  };
}

/**
 * Helper to create mock purchase
 */
function createMockPurchase(overrides?: Partial<Purchase>): Purchase {
  return {
    transactionId: 'txn_' + Math.random().toString(36).substr(2, 9),
    productId: 'product_1',
    purchasedAt: new Date(),
    price: 9.99,
    currencyCode: 'USD',
    isVerified: true,
    isSynced: false,
    unlockedFeatures: [],
    ...overrides,
  };
}

describe('SyncReconciler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path - Successful Reconciliation', () => {
    test('Given: Platform has 3 new transactions not in local DB, When: reconcile is called, Then: All are recorded and marked as synced', async () => {
      // Given
      const localPurchases: Purchase[] = [];
      const platformTransactions = [
        createMockTransaction({ transactionId: 'txn_new_1' }),
        createMockTransaction({ transactionId: 'txn_new_2' }),
        createMockTransaction({ transactionId: 'txn_new_3' }),
      ];

      mockPurchaseService.getActivePurchases.mockResolvedValue({
        success: true,
        data: localPurchases,
      });

      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: true,
        data: platformTransactions,
      });

      mockDatabase.recordPurchase.mockResolvedValue(true);

      // When
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then
      expect(result.success).toBe(true);
      expect(result.data?.newCount).toBe(3);
      expect(result.data?.updatedCount).toBe(0);
      expect(result.data?.deletedCount).toBe(0);
      expect(mockDatabase.recordPurchase).toHaveBeenCalledTimes(3);
    });

    test('Given: Platform transactions match local DB, When: reconcile is called, Then: No changes made, all marked synced', async () => {
      // Given
      const transaction = createMockTransaction({ transactionId: 'txn_match' });
      const localPurchases = [
        createMockPurchase({
          transactionId: 'txn_match',
          isSynced: false,
        }),
      ];
      const platformTransactions = [transaction];

      mockPurchaseService.getActivePurchases.mockResolvedValue({
        success: true,
        data: localPurchases,
      });

      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: true,
        data: platformTransactions,
      });

      mockDatabase.updatePurchase.mockResolvedValue(true);

      // When
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then
      expect(result.success).toBe(true);
      expect(result.data?.newCount).toBe(0);
      expect(result.data?.updatedCount).toBe(1);
      expect(mockDatabase.updatePurchase).toHaveBeenCalled();
    });

    test('Given: Platform has fewer transactions than local DB, When: reconcile is called, Then: Orphaned local records are marked for removal', async () => {
      // Given
      const localPurchases = [
        createMockPurchase({ transactionId: 'txn_orphan', isSynced: false }),
        createMockPurchase({ transactionId: 'txn_valid', isSynced: false }),
      ];
      const platformTransactions = [
        createMockTransaction({ transactionId: 'txn_valid' }),
      ];

      mockPurchaseService.getActivePurchases.mockResolvedValue({
        success: true,
        data: localPurchases,
      });

      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: true,
        data: platformTransactions,
      });

      mockDatabase.updatePurchase.mockResolvedValue(true);
      mockDatabase.deletePurchase.mockResolvedValue(true);

      // When
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then
      expect(result.success).toBe(true);
      expect(result.data?.deletedCount).toBe(1);
      expect(mockDatabase.deletePurchase).toHaveBeenCalledWith('txn_orphan');
    });

    test('Given: Empty platform history and non-empty local DB, When: reconcile is called, Then: Returns success with zero new, existing marked synced', async () => {
      // Given
      const localPurchases = [createMockPurchase({ isSynced: false })];
      const platformTransactions: Transaction[] = [];

      mockPurchaseService.getActivePurchases.mockResolvedValue({
        success: true,
        data: localPurchases,
      });

      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: true,
        data: platformTransactions,
      });

      // When
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then
      expect(result.success).toBe(true);
      expect(result.data?.newCount).toBe(0);
    });

    test('Given: Mixed new and existing transactions, When: reconcile is called, Then: Correctly categorizes and processes each', async () => {
      // Given
      const localPurchases = [
        createMockPurchase({
          transactionId: 'txn_existing_1',
          isSynced: false,
        }),
        createMockPurchase({
          transactionId: 'txn_existing_2',
          isSynced: false,
        }),
      ];
      const platformTransactions = [
        createMockTransaction({ transactionId: 'txn_existing_1' }),
        createMockTransaction({ transactionId: 'txn_existing_2' }),
        createMockTransaction({ transactionId: 'txn_new_1' }),
        createMockTransaction({ transactionId: 'txn_new_2' }),
      ];

      mockPurchaseService.getActivePurchases.mockResolvedValue({
        success: true,
        data: localPurchases,
      });

      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: true,
        data: platformTransactions,
      });

      mockDatabase.recordPurchase.mockResolvedValue(true);
      mockDatabase.updatePurchase.mockResolvedValue(true);

      // When
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then
      expect(result.success).toBe(true);
      expect(result.data?.newCount).toBe(2);
      expect(result.data?.updatedCount).toBe(2);
      expect(mockDatabase.recordPurchase).toHaveBeenCalledTimes(2);
      expect(mockDatabase.updatePurchase).toHaveBeenCalledTimes(2);
    });
  });

  describe('Sad Path - Expected Errors', () => {
    test('Given: Platform API returns network error, When: reconcile is called, Then: Returns network error with retryable=true', async () => {
      // Given
      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'No internet connection',
          retryable: true,
        },
      });

      // When
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
      expect(result.error?.retryable).toBe(true);
    });

    test('Given: Local DB query fails, When: reconcile is called, Then: Returns DB error with retryable=true', async () => {
      // Given
      mockPurchaseService.getActivePurchases.mockResolvedValue({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Database connection lost',
          retryable: true,
        },
      });

      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: true,
        data: [],
      });

      // When
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
      expect(result.error?.retryable).toBe(true);
    });

    test('Given: Record update fails for some purchases, When: reconcile is called, Then: Returns partial success with accurate counts', async () => {
      // Given
      const platformTransactions = [
        createMockTransaction({ transactionId: 'txn_fail' }),
        createMockTransaction({ transactionId: 'txn_success' }),
      ];

      mockPurchaseService.getActivePurchases.mockResolvedValue({
        success: true,
        data: [],
      });

      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: true,
        data: platformTransactions,
      });

      mockDatabase.recordPurchase
        .mockResolvedValueOnce(false) // First record fails
        .mockResolvedValueOnce(true); // Second record succeeds

      // When
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then
      expect(result.success).toBe(true);
      expect(result.data?.newCount).toBe(1); // Only 1 succeeded
      expect(result.data?.failedOperations).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('Given: Empty results from both platform and local DB, When: reconcile is called, Then: Returns success with all zero counts', async () => {
      // Given
      mockPurchaseService.getActivePurchases.mockResolvedValue({
        success: true,
        data: [],
      });

      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: true,
        data: [],
      });

      // When
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then
      expect(result.success).toBe(true);
      expect(result.data?.newCount).toBe(0);
      expect(result.data?.updatedCount).toBe(0);
      expect(result.data?.deletedCount).toBe(0);
    });

    test('Given: Transaction with missing required fields, When: reconcile is called, Then: Skips invalid transaction with warning', async () => {
      // Given
      const validTransaction = createMockTransaction({
        transactionId: 'txn_valid',
      });
      const invalidTransaction = { transactionId: '' } as Transaction; // Missing productId

      mockPurchaseService.getActivePurchases.mockResolvedValue({
        success: true,
        data: [],
      });

      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: true,
        data: [invalidTransaction, validTransaction],
      });

      mockDatabase.recordPurchase.mockResolvedValue(true);

      // When
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then
      expect(result.success).toBe(true);
      expect(result.data?.newCount).toBe(1); // Only valid one recorded
      expect(mockDatabase.recordPurchase).toHaveBeenCalledTimes(1);
    });

    test('Given: Duplicate transaction IDs in platform history, When: reconcile is called, Then: Processes only unique transactions', async () => {
      // Given
      const transaction = createMockTransaction({ transactionId: 'txn_dup' });

      mockPurchaseService.getActivePurchases.mockResolvedValue({
        success: true,
        data: [],
      });

      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: true,
        data: [transaction, transaction], // Same transaction twice
      });

      mockDatabase.recordPurchase.mockResolvedValue(true);

      // When
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then
      expect(result.success).toBe(true);
      expect(mockDatabase.recordPurchase).toHaveBeenCalledTimes(1); // Only once
    });

    test('Given: Large number of transactions (1000+), When: reconcile is called, Then: Processes all efficiently without timeout', async () => {
      // Given
      const largeTransactionList = Array.from({ length: 1000 }, (_, i) =>
        createMockTransaction({ transactionId: `txn_${i}` })
      );

      mockPurchaseService.getActivePurchases.mockResolvedValue({
        success: true,
        data: [],
      });

      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: true,
        data: largeTransactionList,
      });

      mockDatabase.recordPurchase.mockResolvedValue(true);

      // When
      const startTime = Date.now();
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });
      const duration = Date.now() - startTime;

      // Then
      expect(result.success).toBe(true);
      expect(result.data?.newCount).toBe(1000);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Unhappy Path - System Errors', () => {
    test('Given: Unexpected exception thrown during reconciliation, When: reconcile is called, Then: Returns unknown error with retryable=false', async () => {
      // Given
      mockPurchaseService.getActivePurchases.mockRejectedValue(
        new Error('Unexpected database crash')
      );

      // When
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.error?.retryable).toBe(false);
    });

    test('Given: Multiple consecutive failures, When: reconcile is retried, Then: Maintains consistency and avoids duplicate changes', async () => {
      // Given
      const transaction = createMockTransaction({ transactionId: 'txn_retry' });

      // First call fails
      mockPurchaseService.getActivePurchases
        .mockResolvedValueOnce({
          success: true,
          data: [],
        })
        .mockResolvedValueOnce({
          success: true,
          data: [],
        });

      mockPurchaseRepository.requestAllPurchaseHistory
        .mockResolvedValueOnce({
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network timeout',
            retryable: true,
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: [transaction],
        });

      mockDatabase.recordPurchase.mockResolvedValue(true);

      // When - First call fails
      const result1 = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then - First call fails with retryable error
      expect(result1.success).toBe(false);
      expect(result1.error?.retryable).toBe(true);

      // When - Retry succeeds
      const result2 = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then - Second call succeeds, no duplicate records
      expect(result2.success).toBe(true);
      expect(result2.data?.newCount).toBe(1);
    });

    test('Given: Partial transaction data corruption, When: reconcile is called, Then: Detects and skips corrupted records', async () => {
      // Given
      const validTransaction = createMockTransaction({
        transactionId: 'txn_valid',
      });
      const corruptedTransaction = {
        transactionId: 'txn_corrupt',
        productId: '',
        purchaseDate: 'invalid-date' as any, // Invalid date format
        receiptData: null,
      } as Transaction;

      mockPurchaseService.getActivePurchases.mockResolvedValue({
        success: true,
        data: [],
      });

      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: true,
        data: [corruptedTransaction, validTransaction],
      });

      mockDatabase.recordPurchase.mockResolvedValue(true);

      // When
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then
      expect(result.success).toBe(true);
      expect(result.data?.newCount).toBe(1); // Only valid one
      expect(result.data?.failedOperations).toBe(1);
    });
  });

  describe('Idempotency & Consistency', () => {
    test('Given: Reconcile called twice with same platform state, When: both calls complete, Then: Results are identical and no duplicate records created', async () => {
      // Given
      const transaction = createMockTransaction({
        transactionId: 'txn_idempotent',
      });

      mockPurchaseService.getActivePurchases
        .mockResolvedValueOnce({ success: true, data: [] })
        .mockResolvedValueOnce({
          success: true,
          data: [
            {
              transactionId: 'txn_idempotent',
              productId: 'product_1',
              purchasedAt: new Date(),
              price: 9.99,
              currencyCode: 'USD',
              isVerified: true,
              isSynced: false,
              unlockedFeatures: [],
            } as Purchase,
          ],
        });

      mockPurchaseRepository.requestAllPurchaseHistory
        .mockResolvedValueOnce({ success: true, data: [transaction] })
        .mockResolvedValueOnce({ success: true, data: [transaction] });

      mockDatabase.recordPurchase.mockResolvedValue(true);
      mockDatabase.updatePurchase.mockResolvedValue(true);

      // When - First call
      const result1 = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // When - Second call
      const result2 = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then - Both succeed with consistent results
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockDatabase.recordPurchase).toHaveBeenCalledTimes(1); // Only once
    });

    test('Given: Platform marks purchase as verified, When: reconcile is called, Then: Local record updated with verification status', async () => {
      // Given
      const platformTransaction = createMockTransaction({
        transactionId: 'txn_verify',
      });
      const localPurchase = createMockPurchase({
        transactionId: 'txn_verify',
        isVerified: false,
      });

      mockPurchaseService.getActivePurchases.mockResolvedValue({
        success: true,
        data: [localPurchase],
      });

      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: true,
        data: [platformTransaction],
      });

      mockDatabase.updatePurchase.mockResolvedValue(true);

      // When
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then
      expect(result.success).toBe(true);
      expect(mockDatabase.updatePurchase).toHaveBeenCalled();
    });
  });

  describe('Requirements Traceability', () => {
    test('Requirement 8.3: Detects and resolves local/platform mismatches', async () => {
      // Requirement 8.3: SyncReconciler検出と解決
      // Given: Platform has transactions not in local DB
      const transaction = createMockTransaction({ transactionId: 'txn_new' });

      mockPurchaseService.getActivePurchases.mockResolvedValue({
        success: true,
        data: [],
      });

      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: true,
        data: [transaction],
      });

      mockDatabase.recordPurchase.mockResolvedValue(true);

      // When & Then
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      expect(result.success).toBe(true);
      expect(mockDatabase.recordPurchase).toHaveBeenCalled();
    });

    test('Requirement 3.5: Trusts platform data as source of truth for updates', async () => {
      // Requirement 3.5: 接続復帰時同期
      // Given: Platform transaction is more recent than local
      const platformTransaction = createMockTransaction({
        transactionId: 'txn_sync',
        purchaseDate: new Date(Date.now() + 1000),
      });
      const localPurchase = createMockPurchase({
        transactionId: 'txn_sync',
        purchasedAt: new Date(Date.now() - 10000),
        isSynced: false,
      });

      mockPurchaseService.getActivePurchases.mockResolvedValue({
        success: true,
        data: [localPurchase],
      });

      mockPurchaseRepository.requestAllPurchaseHistory.mockResolvedValue({
        success: true,
        data: [platformTransaction],
      });

      mockDatabase.updatePurchase.mockResolvedValue(true);

      // When
      const result = await syncReconciler.reconcilePurchases({
        purchaseRepository: mockPurchaseRepository,
        purchaseService: mockPurchaseService,
        database: mockDatabase,
      });

      // Then - Platform data trusted for update
      expect(result.success).toBe(true);
      expect(mockDatabase.updatePurchase).toHaveBeenCalled();
    });
  });
});
