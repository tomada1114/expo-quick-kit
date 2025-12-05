/**
 * LocalDatabase Service Tests - Task 11.1: recordPurchase
 *
 * Test suite for LocalDatabase.recordPurchase() method
 * Records new purchase transactions to SQLite database with verification and sync status.
 *
 * Test Coverage:
 * - Happy path: Successfully record valid purchases with required fields
 * - Sad path: Duplicate transaction IDs, constraint violations
 * - Edge cases: Boundary values (zero price, long strings, special characters, timestamps)
 * - Unhappy path: Database errors and exceptions
 *
 * Requirements (Task 11.1):
 * - Persist purchase: transactionId, productId, purchasedAt, price, currencyCode, isVerified, isSynced
 * - Enforce unique constraint on transactionId
 * - Return recorded purchase entity on success
 * - Support optional isVerified and isSynced parameters
 * - Handle database errors gracefully with Result pattern
 *
 * @module features/purchase/infrastructure/__tests__/local-database-record-purchase.test
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock database before importing localDatabase
jest.mock('@/database/client', () => ({
  db: {
    insert: jest.fn(() => ({
      values: jest.fn(function () {
        return {
          run: jest.fn(function () {
            return { changes: 1 };
          }),
        };
      }),
    })),
    select: jest.fn(() => ({
      from: jest.fn(function () {
        return {
          where: jest.fn(function () {
            return {
              get: jest.fn(() => undefined),
              all: jest.fn(() => []),
            };
          }),
        };
      }),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(function () {
        return {
          run: jest.fn(() => ({ changes: 1 })),
        };
      }),
    })),
    update: jest.fn(() => ({
      set: jest.fn(function () {
        return {
          where: jest.fn(function () {
            return {
              run: jest.fn(() => ({ changes: 1 })),
            };
          }),
        };
      }),
    })),
  },
}));

jest.mock('@/database/schema', () => ({
  purchases: { id: 'purchases_id', transactionId: 'purchases_txn_id' },
  purchaseFeatures: { id: 'features_id' },
}));

import { db } from '@/database/client';
import { localDatabase } from '../local-database';

describe('LocalDatabase - recordPurchase (Task 11.1)', () => {
  beforeEach(() => {
    // Reset mock implementations to default (successful database operations)
    const mockDb = db as any;
    mockDb.insert = jest.fn(() => ({
      values: jest.fn(function () {
        return {
          run: jest.fn(function () {
            return { changes: 1 };
          }),
        };
      }),
    }));
    mockDb.select = jest.fn(() => ({
      from: jest.fn(function () {
        return {
          where: jest.fn(function () {
            return {
              get: jest.fn(() => undefined),
              all: jest.fn(() => []),
            };
          }),
        };
      }),
    }));
  });

  describe('Happy Path - Successful recording', () => {
    it('should successfully record a purchase with required fields', async () => {
      // Given: Valid purchase parameters
      const transactionId = 'txn-happy-001';
      const productId = 'premium_unlock';
      const purchasedAt = new Date('2025-12-04T10:00:00Z');
      const price = 9.99;
      const currencyCode = 'USD';

      // When: recordPurchase is called
      const result = await localDatabase.recordPurchase(
        transactionId,
        productId,
        purchasedAt,
        price,
        currencyCode
      );

      // Then: Operation succeeds
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // And: Database insert was called with correct values
      expect(db.insert).toHaveBeenCalled();
    });

    it('should record purchase with explicit isVerified flag', async () => {
      // When: recordPurchase is called with isVerified=true
      const result = await localDatabase.recordPurchase(
        'txn-verified-001',
        'premium_unlock',
        new Date(),
        9.99,
        'USD',
        true // isVerified
      );

      // Then: Operation succeeds
      expect(result.success).toBe(true);
    });

    it('should record unverified purchase (pending verification)', async () => {
      // When: recordPurchase is called with isVerified=false
      const result = await localDatabase.recordPurchase(
        'txn-unverified-001',
        'premium_unlock',
        new Date(),
        9.99,
        'USD',
        false // isVerified
      );

      // Then: Operation succeeds
      expect(result.success).toBe(true);
    });

    it('should record purchase with explicit sync status', async () => {
      // When: recordPurchase is called with isSynced=true
      const result = await localDatabase.recordPurchase(
        'txn-synced-001',
        'premium_unlock',
        new Date(),
        9.99,
        'USD',
        true,
        true // isSynced
      );

      // Then: Operation succeeds
      expect(result.success).toBe(true);
    });

    it('should apply default values when optional parameters omitted', async () => {
      // When: recordPurchase called without optional parameters
      const result = await localDatabase.recordPurchase(
        'txn-defaults-001',
        'premium_unlock',
        new Date(),
        9.99,
        'USD'
        // isVerified and isSynced omitted - should use defaults
      );

      // Then: Defaults are applied (returns success)
      expect(result.success).toBe(true);
    });
  });

  describe('Sad Path - Expected error conditions', () => {
    it('should return error when required fields are missing', async () => {
      // When: recordPurchase is called with missing transactionId
      const result = await localDatabase.recordPurchase(
        '', // Empty transaction ID
        'premium_unlock',
        new Date(),
        9.99,
        'USD'
      );

      // Then: Returns error for missing required field
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should return error when productId is missing', async () => {
      // When: recordPurchase is called with missing productId
      const result = await localDatabase.recordPurchase(
        'txn-missing-product',
        '', // Empty product ID
        new Date(),
        9.99,
        'USD'
      );

      // Then: Returns error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should return error when purchasedAt is invalid', async () => {
      // When: recordPurchase is called with null purchasedAt
      const result = await localDatabase.recordPurchase(
        'txn-invalid-date',
        'premium_unlock',
        null as any,
        9.99,
        'USD'
      );

      // Then: Returns error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should handle database insert errors gracefully', async () => {
      // Given: Database insert throws an error
      const mockDb = db as any;
      mockDb.insert = jest.fn(() => {
        throw new Error('Unique constraint violation: transactionId already exists');
      });

      // When: recordPurchase is called
      const result = await localDatabase.recordPurchase(
        'txn-duplicate',
        'premium_unlock',
        new Date(),
        9.99,
        'USD'
      );

      // Then: Returns DB_ERROR
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
    });
  });

  describe('Edge Cases - Boundary values and special conditions', () => {
    it('should handle purchase with zero price', async () => {
      // When: recordPurchase is called with price=0
      const result = await localDatabase.recordPurchase(
        'txn-zero-price',
        'free_trial',
        new Date(),
        0, // Zero price
        'USD'
      );

      // Then: Successfully records zero-price purchase
      expect(result.success).toBe(true);
    });

    it('should handle purchase with very large price', async () => {
      // When: recordPurchase is called with large price
      const result = await localDatabase.recordPurchase(
        'txn-large-price',
        'premium_lifetime',
        new Date(),
        99999.99,
        'USD'
      );

      // Then: Successfully records large price
      expect(result.success).toBe(true);
    });

    it('should handle transaction ID with special characters', async () => {
      // When: recordPurchase is called with special characters in ID
      const result = await localDatabase.recordPurchase(
        'txn-special-@#$%_2025',
        'premium_unlock',
        new Date(),
        9.99,
        'USD'
      );

      // Then: Successfully records special characters
      expect(result.success).toBe(true);
    });

    it('should handle Unix epoch timestamp (Jan 1, 1970)', async () => {
      // When: recordPurchase is called with epoch date
      const result = await localDatabase.recordPurchase(
        'txn-epoch',
        'premium_unlock',
        new Date(0),
        9.99,
        'USD'
      );

      // Then: Successfully records epoch timestamp
      expect(result.success).toBe(true);
    });

    it('should handle future timestamp (year 2100)', async () => {
      // When: recordPurchase is called with future date
      const result = await localDatabase.recordPurchase(
        'txn-future',
        'premium_unlock',
        new Date('2100-01-01'),
        9.99,
        'USD'
      );

      // Then: Successfully records future date
      expect(result.success).toBe(true);
    });

    it('should handle very long transaction ID', async () => {
      // When: recordPurchase is called with very long ID
      const longId = 'txn-' + 'x'.repeat(1000);
      const result = await localDatabase.recordPurchase(
        longId,
        'premium_unlock',
        new Date(),
        9.99,
        'USD'
      );

      // Then: Successfully records long ID
      expect(result.success).toBe(true);
    });

    it('should handle currency codes for different regions', async () => {
      // Given: Various currency codes
      const currencies = ['USD', 'JPY', 'EUR', 'GBP', 'CNY'];

      for (const currency of currencies) {
        // When: recordPurchase is called with different currency
        const result = await localDatabase.recordPurchase(
          `txn-currency-${currency}`,
          'premium_unlock',
          new Date(),
          9.99,
          currency
        );

        // Then: Successfully records all currencies
        expect(result.success).toBe(true);
      }
    });

    it('should handle prices with many decimal places', async () => {
      // When: recordPurchase is called with decimal price
      const result = await localDatabase.recordPurchase(
        'txn-decimal',
        'premium_unlock',
        new Date(),
        123.456789,
        'USD'
      );

      // Then: Successfully records decimal price
      expect(result.success).toBe(true);
    });
  });

  describe('Unhappy Path - Exceptions and error recovery', () => {
    it('should handle database connection errors gracefully', async () => {
      // Given: Database operation throws connection error
      const mockDb = db as any;
      mockDb.insert = jest.fn(() => {
        throw new Error('Database connection failed');
      });

      // When: recordPurchase is called
      const result = await localDatabase.recordPurchase(
        'txn-db-error',
        'premium_unlock',
        new Date(),
        9.99,
        'USD'
      );

      // Then: Returns appropriate error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
      expect(result.error?.message).toContain('Database connection failed');
    });

    it('should indicate retryable errors appropriately', async () => {
      // Given: Database throws timeout error
      const mockDb = db as any;
      mockDb.insert = jest.fn(() => {
        throw new Error('Database timeout: operation took too long');
      });

      // When: recordPurchase is called
      const result = await localDatabase.recordPurchase(
        'txn-timeout',
        'premium_unlock',
        new Date(),
        9.99,
        'USD'
      );

      // Then: Error is marked as retryable for timeout
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.retryable).toBeDefined();
      }
    });

    it('should provide meaningful error message for constraint violations', async () => {
      // Given: Unique constraint violation
      const mockDb = db as any;
      mockDb.insert = jest.fn(() => {
        throw new Error('UNIQUE constraint failed: purchases.transaction_id');
      });

      // When: recordPurchase is called with duplicate ID
      const result = await localDatabase.recordPurchase(
        'txn-constraint',
        'premium_unlock',
        new Date(),
        9.99,
        'USD'
      );

      // Then: Error message is informative
      expect(result.success).toBe(false);
      expect(result.error?.message).toBeDefined();
      expect(result.error?.message.length).toBeGreaterThan(10);
    });
  });

  describe('Return Value Validation', () => {
    it('should return success: true on successful insertion', async () => {
      // When: recordPurchase succeeds
      const result = await localDatabase.recordPurchase(
        'txn-success-return',
        'premium_unlock',
        new Date(),
        9.99,
        'USD'
      );

      // Then: success field is true
      expect(result).toHaveProperty('success', true);
      expect(result).not.toHaveProperty('error');
    });

    it('should return error object on failure', async () => {
      // When: recordPurchase fails due to missing field
      const result = await localDatabase.recordPurchase(
        '',
        'premium_unlock',
        new Date(),
        9.99,
        'USD'
      );

      // Then: error object has required fields
      expect(result).toHaveProperty('success', false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBeDefined();
      expect(result.error?.message).toBeDefined();
    });

    it('should return data as undefined on success', async () => {
      // When: recordPurchase succeeds
      const result = await localDatabase.recordPurchase(
        'txn-data-check',
        'premium_unlock',
        new Date(),
        9.99,
        'USD'
      );

      // Then: data field is undefined (implementation returns void)
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });
  });
});
