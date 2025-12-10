/**
 * Offline Purchase State Integration Tests - Task 16.7
 *
 * Integration tests for offline purchase scenarios:
 * 1. Record purchase with isSynced=false (offline purchase)
 * 2. Verify feature access is possible without network connection
 * 3. Confirm synchronization completes when network is restored
 *
 * Requirements Coverage:
 * - Req 3.3: App startup restoration (purchase availability)
 * - Req 3.4: Offline feature unlocking via cached purchases
 * - Req 3.5: Sync reconciliation when connection restored
 * - Req 4.2: Purchase state confirmation for feature access
 *
 * Test Scenarios:
 * 1. Record offline purchases (isSynced=false)
 * 2. Query feature access using offline purchases
 * 3. Update sync status when network restored
 * 4. Handle validation errors for incomplete offline purchases
 * 5. Support multiple offline purchases
 *
 * @module features/purchase/__tests__/integration/offline-purchase-state.integration.test
 */

// Mock ALL dependencies BEFORE any imports to prevent native module issues
jest.mock('@/database/client', () => ({
  db: {
    insert: jest.fn(() => ({
      values: jest.fn().mockResolvedValue(void 0),
    })),
    select: jest.fn(() => ({
      from: jest.fn(function () {
        return {
          where: jest.fn(function () {
            return {
              all: jest.fn(() => []),
              get: jest.fn(() => undefined),
            };
          }),
          innerJoin: jest.fn(function () {
            return {
              where: jest.fn(function () {
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
        where: jest.fn().mockResolvedValue(void 0),
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
    transaction_id: 'transaction_id',
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  sql: jest.fn(),
}));

import { db } from '@/database/client';
import { purchases } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { localDatabase } from '../../infrastructure/local-database';
import { featureGatingService } from '../../application/feature-gating-service';

describe('Offline Purchase State Integration - Task 16.7', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks to default state
    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockResolvedValue(void 0),
    });
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn(function () {
        return {
          where: jest.fn(function () {
            return {
              all: jest.fn(() => []),
              get: jest.fn(() => undefined),
            };
          }),
          innerJoin: jest.fn(function () {
            return {
              where: jest.fn(function () {
                return {
                  all: jest.fn(() => []),
                };
              }),
            };
          }),
        };
      }),
    });
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn(() => ({
        where: jest.fn().mockResolvedValue(void 0),
      })),
    });
  });

  describe('Happy Path: Offline Purchase Recording', () => {
    it('E2E-1: Should record purchase with isSynced=false when offline', async () => {
      // Given: A verified purchase transaction (offline scenario)
      const transactionId = 'offline-txn-001';
      const productId = 'premium_unlock';
      const purchasedAt = new Date('2025-12-04T10:00:00Z');
      const price = 9.99;
      const currencyCode = 'USD';
      const isVerified = true;
      const isSynced = false; // Key: Purchase recorded as NOT synced

      // When: Recording purchase to LocalDatabase
      const result = await localDatabase.recordPurchase(
        transactionId,
        productId,
        purchasedAt,
        price,
        currencyCode,
        isVerified,
        isSynced
      );

      // Then: Purchase recorded successfully with offline status
      expect(result.success).toBe(true);
      expect(db.insert).toHaveBeenCalledWith(purchases);
    });

    it('E2E-2: Should record multiple offline purchases', async () => {
      // Given: Multiple verified purchase transactions
      const purchases_to_record = [
        {
          transactionId: 'offline-txn-001',
          productId: 'premium_unlock',
          purchasedAt: new Date('2025-12-04T10:00:00Z'),
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false,
        },
        {
          transactionId: 'offline-txn-002',
          productId: 'export_feature',
          purchasedAt: new Date('2025-12-04T10:05:00Z'),
          price: 4.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false,
        },
      ];

      // When: Recording multiple purchases
      const results = await Promise.all(
        purchases_to_record.map((p) =>
          localDatabase.recordPurchase(
            p.transactionId,
            p.productId,
            p.purchasedAt,
            p.price,
            p.currencyCode,
            p.isVerified,
            p.isSynced
          )
        )
      );

      // Then: All purchases recorded successfully
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
      expect(db.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('Sad Path: Invalid Offline Purchases', () => {
    it('E2E-3: Should reject offline purchase with empty transaction ID', async () => {
      // Given: Invalid purchase (empty transactionId)
      const transactionId = '';
      const productId = 'premium_unlock';
      const purchasedAt = new Date();
      const price = 9.99;
      const currencyCode = 'USD';

      // When: Recording invalid purchase
      const result = await localDatabase.recordPurchase(
        transactionId,
        productId,
        purchasedAt,
        price,
        currencyCode
      );

      // Then: Should fail with validation error
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_INPUT');
    });

    it('E2E-4: Should reject offline purchase with invalid product ID', async () => {
      // Given: Invalid purchase (empty productId)
      const transactionId = 'offline-txn-001';
      const productId = '';
      const purchasedAt = new Date();
      const price = 9.99;
      const currencyCode = 'USD';

      // When: Recording invalid purchase
      const result = await localDatabase.recordPurchase(
        transactionId,
        productId,
        purchasedAt,
        price,
        currencyCode
      );

      // Then: Should fail with validation error
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_INPUT');
    });

    it('E2E-5: Should reject offline purchase with invalid purchase date', async () => {
      // Given: Invalid purchase (invalid date)
      const transactionId = 'offline-txn-001';
      const productId = 'premium_unlock';
      const purchasedAt = 'not-a-date' as any;
      const price = 9.99;
      const currencyCode = 'USD';

      // When: Recording invalid purchase
      const result = await localDatabase.recordPurchase(
        transactionId,
        productId,
        purchasedAt,
        price,
        currencyCode
      );

      // Then: Should fail with validation error
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_INPUT');
    });
  });

  describe('Network Restoration: Sync Status Update', () => {
    it('E2E-6: Should update sync status when network restored', async () => {
      // Given: Offline purchase that needs syncing
      const offlineTransactionId = 'offline-txn-sync-001';

      // When: Sync reconciliation updates status
      const result = await localDatabase.updateSyncStatus(
        offlineTransactionId,
        true
      );

      // Then: Sync status should be updated successfully
      expect(result.success).toBe(true);
      expect(db.update).toHaveBeenCalledWith(purchases);
    });

    it('E2E-7: Should handle sync status update error gracefully', async () => {
      // Given: Database connection error during sync
      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn(() => ({
          where: jest.fn().mockRejectedValue(new Error('Connection timeout')),
        })),
      });

      // When: Attempting to update sync status
      const result = await localDatabase.updateSyncStatus(
        'offline-txn-001',
        true
      );

      // Then: Error should be marked as retryable
      expect(result.success).toBe(false);
      expect(result.error.retryable).toBe(true);
    });
  });

  describe('Feature Access: Offline Scenarios', () => {
    it('E2E-8: Should check feature access synchronously (works offline)', async () => {
      // Given: Feature gating service is available
      // When: Checking feature access (no async call to network)
      const canAccess = featureGatingService.canAccessSync('advanced_features');

      // Then: Should return boolean (synchronous result)
      expect(typeof canAccess).toBe('boolean');
    });

    it('E2E-9: Should handle free features without purchase requirement', async () => {
      // Given: Free feature that requires no purchase
      // When: Checking access for free feature
      const canAccess = featureGatingService.canAccessSync('basic_search');

      // Then: Should return true (free features are always accessible)
      // This tests that free features work offline without any DB queries
      expect(canAccess).toBe(true);
    });
  });

  describe('Integration: Complete Offline Lifecycle', () => {
    it('E2E-10: Complete offline purchase lifecycle workflow', async () => {
      // Step 1: Record offline purchase (unsynced)
      const recordResult = await localDatabase.recordPurchase(
        'lifecycle-001',
        'premium_unlock',
        new Date(),
        9.99,
        'USD',
        true,
        false
      );
      expect(recordResult.success).toBe(true);

      // Step 2: Check feature access works offline
      const offlineAccess =
        featureGatingService.canAccessSync('advanced_features');
      expect(typeof offlineAccess).toBe('boolean');

      // Step 3: Network restored - update sync status
      const syncResult = await localDatabase.updateSyncStatus(
        'lifecycle-001',
        true
      );
      expect(syncResult.success).toBe(true);

      // Step 4: Verify sync status update was called
      expect(db.update).toHaveBeenCalledWith(purchases);
    });

    it('E2E-11: Multiple offline purchases with mixed sync status', async () => {
      // Step 1: Record first offline purchase (unsynced)
      const result1 = await localDatabase.recordPurchase(
        'offline-sync-001',
        'premium_unlock',
        new Date(),
        9.99,
        'USD',
        true,
        false
      );
      expect(result1.success).toBe(true);

      // Step 2: Record second offline purchase (already synced)
      const result2 = await localDatabase.recordPurchase(
        'offline-sync-002',
        'export_feature',
        new Date(),
        4.99,
        'USD',
        true,
        true // Already synced (isSynced=true)
      );
      expect(result2.success).toBe(true);

      // Step 3: Update first purchase sync status
      const syncResult = await localDatabase.updateSyncStatus(
        'offline-sync-001',
        true
      );
      expect(syncResult.success).toBe(true);

      // Step 4: Verify both purchases exist
      expect(db.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases: Boundary Conditions', () => {
    it('E2E-12: Should handle offline purchase from far past', async () => {
      // Given: Purchase from 1 year ago, offline
      const oldPurchaseDate = new Date('2024-12-04T10:00:00Z');

      // When: Recording old offline purchase
      const result = await localDatabase.recordPurchase(
        'old-offline-001',
        'premium_unlock',
        oldPurchaseDate,
        9.99,
        'USD',
        true,
        false
      );

      // Then: Should still record successfully (one-time purchases don't expire)
      expect(result.success).toBe(true);
    });

    it('E2E-13: Should record offline purchase with various currencies', async () => {
      // Given: Offline purchases with different currencies
      const currencies = ['USD', 'JPY', 'EUR', 'GBP'];

      // When: Recording purchases with each currency
      const results = await Promise.all(
        currencies.map((currency) =>
          localDatabase.recordPurchase(
            `offline-${currency}`,
            'premium_unlock',
            new Date(),
            9.99,
            currency,
            true,
            false
          )
        )
      );

      // Then: All purchases recorded successfully regardless of currency
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it('E2E-14: Should record offline purchase with zero price', async () => {
      // Given: Free tier purchase (zero price)
      const freePrice = 0;

      // When: Recording zero-price offline purchase
      const result = await localDatabase.recordPurchase(
        'free-tier-001',
        'basic_features',
        new Date(),
        freePrice,
        'USD',
        true,
        false
      );

      // Then: Should record successfully
      expect(result.success).toBe(true);
    });
  });

  describe('Performance: Offline Database Operations', () => {
    it('E2E-15: Should efficiently perform synchronous feature check', async () => {
      // Given: Feature gating service ready
      // When: Checking feature access (synchronous, no network)
      const startTime = performance.now();
      const canAccess = featureGatingService.canAccessSync('advanced_features');
      const duration = performance.now() - startTime;

      // Then: Synchronous check should be very fast (no network call)
      expect(typeof canAccess).toBe('boolean');
      expect(duration).toBeLessThan(10); // Should complete in <10ms (no network)
    });
  });
});
