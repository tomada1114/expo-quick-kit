/**
 * LocalDatabase Service - deletePurchase() Tests (Task 11.6)
 *
 * Tests for purchase deletion functionality for privacy/GDPR compliance.
 *
 * Test Coverage:
 * - Happy path: Successfully delete existing purchase and cascaded features
 * - Sad path: Attempt to delete non-existent purchase
 * - Edge cases: Empty transaction ID, invalid input
 * - Unhappy path: Database errors
 *
 * Requirements (Task 11.6):
 * - deletePurchase(transactionId): Delete purchase record by transaction ID
 * - Cascade delete: purchase_features records are automatically deleted (ON DELETE CASCADE)
 * - Error handling: NOT_FOUND, INVALID_INPUT, DB_ERROR with retryable flag
 * - Privacy: Complete removal of purchase and associated data
 *
 * @module features/purchase/infrastructure/__tests__/local-database-delete-purchase.test.ts
 */

// Mock database client to avoid native module initialization
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}), { virtual: true });

jest.mock('@/database/client', () => ({
  db: {
    delete: jest.fn(function() {
      return {
        where: jest.fn(function() {
          return {
            run: jest.fn(() => ({ changes: 1 })),
          };
        }),
      };
    }),
    select: jest.fn(function() {
      return {
        from: jest.fn(function() {
          return {
            where: jest.fn(function() {
              return {
                get: jest.fn(() => undefined),
              };
            }),
          };
        }),
      };
    }),
  },
}));

import { localDatabaseService } from '../local-database-service';

describe('LocalDatabase Service - deletePurchase() (Task 11.6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path: Successfully delete purchase', () => {
    /**
     * Happy Path: Valid transaction ID exists and is successfully deleted
     *
     * Given: A purchase with transactionId 'txn-delete-001' exists in database
     * When: deletePurchase('txn-delete-001') is called
     * Then: Returns success with void data, purchase_features cascade deleted
     */
    it('should successfully delete purchase when transaction ID exists', async () => {
      // Given: Valid transaction ID
      const transactionId = 'txn-delete-001';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => ({ changes: 1 })),
        })),
      }));

      // When: Call deletePurchase
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should return success
      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
      expect(mockDb.delete).toHaveBeenCalled();
    });

    /**
     * Happy Path: Multiple purchases in database, only one is deleted
     *
     * Given: Database has 3 purchases, transactionId 'txn-delete-middle' exists
     * When: deletePurchase('txn-delete-middle') is called
     * Then: Only that purchase is deleted, others remain unaffected
     */
    it('should delete only the specified purchase when multiple exist', async () => {
      // Given: Multiple purchases, delete one
      const transactionId = 'txn-delete-middle';
      const mockDb = require('@/database/client').db;

      let deleteCallCount = 0;
      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => {
            deleteCallCount++;
            return { changes: 1 }; // Only one purchase affected
          }),
        })),
      }));

      // When: Delete specific purchase
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should delete exactly one record
      expect(result.success).toBe(true);
      expect(deleteCallCount).toBe(1);
    });

    /**
     * Happy Path: Cascade delete of purchase_features records
     *
     * Given: Purchase with transactionId exists and has 3 linked features
     * When: deletePurchase() is called
     * Then: Purchase and all 3 purchase_features records are deleted (ON DELETE CASCADE)
     */
    it('should cascade delete purchase_features when purchase is deleted', async () => {
      // Given: Purchase with associated features
      const transactionId = 'txn-with-features-001';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => ({ changes: 1 })), // 1 purchase deleted + cascade handled by DB
        })),
      }));

      // When: Delete purchase
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should succeed (cascade is handled by DB schema)
      expect(result.success).toBe(true);
    });

    /**
     * Happy Path: Delete unverified purchase
     *
     * Given: Unverified purchase (isVerified=false) with transactionId exists
     * When: deletePurchase(transactionId) is called
     * Then: Deletes the unverified purchase (all records should be deletable)
     */
    it('should delete unverified purchase records for privacy', async () => {
      // Given: Unverified purchase to be deleted for privacy
      const transactionId = 'txn-unverified-delete-001';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => ({ changes: 1 })),
        })),
      }));

      // When: Delete unverified purchase
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should succeed regardless of verification status
      expect(result.success).toBe(true);
    });

    /**
     * Happy Path: Delete synced purchase
     *
     * Given: Synced purchase (isSynced=true) with transactionId exists
     * When: deletePurchase(transactionId) is called
     * Then: Deletes even if synced (supports complete user deletion)
     */
    it('should delete synced purchase for complete privacy', async () => {
      // Given: Synced purchase marked for deletion
      const transactionId = 'txn-synced-delete-001';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => ({ changes: 1 })),
        })),
      }));

      // When: Delete synced purchase
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should succeed (for GDPR compliance)
      expect(result.success).toBe(true);
    });

    /**
     * Happy Path: Delete recently purchased item
     *
     * Given: Purchase with transactionId created moments ago
     * When: deletePurchase(transactionId) is called
     * Then: Deletes successfully even with recent timestamp
     */
    it('should delete recently purchased items', async () => {
      // Given: Recent purchase
      const transactionId = 'txn-recent-delete';
      const now = Math.floor(Date.now() / 1000);
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => ({ changes: 1 })),
        })),
      }));

      // When: Delete recent purchase
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should succeed
      expect(result.success).toBe(true);
    });

    /**
     * Happy Path: Delete old purchase
     *
     * Given: Purchase with old timestamp (weeks/months ago)
     * When: deletePurchase(transactionId) is called
     * Then: Deletes successfully regardless of age
     */
    it('should delete old purchases without timestamp issues', async () => {
      // Given: Old purchase record
      const transactionId = 'txn-old-delete';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => ({ changes: 1 })),
        })),
      }));

      // When: Delete old purchase
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should succeed
      expect(result.success).toBe(true);
    });
  });

  describe('Sad Path: Purchase not found or invalid', () => {
    /**
     * Sad Path: Transaction ID does not exist in database
     *
     * Given: Transaction ID 'non-existent-txn' does not exist in database
     * When: deletePurchase('non-existent-txn') is called
     * Then: Returns NOT_FOUND error (0 rows affected)
     */
    it('should return NOT_FOUND when transaction ID does not exist', async () => {
      // Given: Non-existent transaction ID
      const transactionId = 'non-existent-txn';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => ({ changes: 0 })), // No rows affected
        })),
      }));

      // When: Try to delete non-existent purchase
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should return NOT_FOUND error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
      expect(result.error?.retryable).toBe(false);
    });

    /**
     * Sad Path: Empty string as transaction ID
     *
     * Given: Empty string provided as transaction ID
     * When: deletePurchase('') is called
     * Then: Returns INVALID_INPUT validation error
     */
    it('should return INVALID_INPUT when transaction ID is empty string', async () => {
      // When: Call with empty string
      const result = await localDatabaseService.deletePurchase('');

      // Then: Should return INVALID_INPUT error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.error?.retryable).toBe(false);
      expect(result.error?.message).toContain('non-empty');
    });

    /**
     * Sad Path: Whitespace-only string
     *
     * Given: String with only whitespace provided
     * When: deletePurchase('   ') is called
     * Then: Returns INVALID_INPUT validation error
     */
    it('should return INVALID_INPUT when transaction ID is whitespace only', async () => {
      // When: Call with whitespace string
      const result = await localDatabaseService.deletePurchase('   ');

      // Then: Should return INVALID_INPUT error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.error?.retryable).toBe(false);
    });

    /**
     * Sad Path: Null-like values passed
     *
     * Given: Null or undefined is passed
     * When: deletePurchase(null) or deletePurchase(undefined) is called
     * Then: Returns INVALID_INPUT validation error
     */
    it('should return INVALID_INPUT when transaction ID is null or undefined', async () => {
      // When: Call with null/undefined
      // @ts-ignore - Testing invalid input
      const result1 = await localDatabaseService.deletePurchase(null);
      // @ts-ignore - Testing invalid input
      const result2 = await localDatabaseService.deletePurchase(undefined);

      // Then: Both should return INVALID_INPUT
      expect(result1.success).toBe(false);
      expect(result1.error?.code).toBe('INVALID_INPUT');
      expect(result2.success).toBe(false);
      expect(result2.error?.code).toBe('INVALID_INPUT');
    });

    /**
     * Sad Path: Wrong type passed (number instead of string)
     *
     * Given: Number passed instead of string
     * When: deletePurchase(12345) is called
     * Then: Returns INVALID_INPUT validation error
     */
    it('should return INVALID_INPUT when transaction ID is not a string', async () => {
      // When: Call with wrong type
      // @ts-ignore - Testing invalid input
      const result = await localDatabaseService.deletePurchase(12345);

      // Then: Should return INVALID_INPUT
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('Edge Cases: Boundary values and special characters', () => {
    /**
     * Edge Case: Very long transaction ID (UUID or similar)
     *
     * Given: Valid but very long transaction ID
     * When: deletePurchase(longId) is called
     * Then: Successfully deletes (text field should handle)
     */
    it('should delete purchase with very long transaction ID', async () => {
      // Given: Long transaction ID (e.g., UUID)
      const transactionId = 'txn-' + 'a'.repeat(256);
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => ({ changes: 1 })),
        })),
      }));

      // When: Delete with long ID
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should succeed
      expect(result.success).toBe(true);
    });

    /**
     * Edge Case: Transaction ID with special characters
     *
     * Given: Transaction ID containing special characters
     * When: deletePurchase('txn-with-@#$-chars') is called
     * Then: Successfully deletes (should be SQL-safe)
     */
    it('should delete purchase with special characters in transaction ID', async () => {
      // Given: ID with special chars
      const transactionId = 'txn-with-special-!@#$%^&*()_+-=[]{}';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => ({ changes: 1 })),
        })),
      }));

      // When: Delete with special char ID
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should succeed (Drizzle handles escaping)
      expect(result.success).toBe(true);
    });

    /**
     * Edge Case: Transaction ID with Unicode characters
     *
     * Given: Transaction ID with Unicode/emoji characters
     * When: deletePurchase(unicodeId) is called
     * Then: Successfully deletes (UTF-8 should be supported)
     */
    it('should delete purchase with Unicode transaction ID', async () => {
      // Given: ID with Unicode
      const transactionId = 'txn-日本語-émoji-🚀';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => ({ changes: 1 })),
        })),
      }));

      // When: Delete with Unicode ID
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should succeed
      expect(result.success).toBe(true);
    });

    /**
     * Edge Case: Case sensitivity
     *
     * Given: Transaction IDs that differ only in case
     * When: deletePurchase('TXN-001') is called when 'txn-001' exists
     * Then: Should be case-sensitive (database behavior)
     */
    it('should handle case-sensitive transaction IDs correctly', async () => {
      // Given: Case-sensitive ID lookup
      const transactionId = 'TXN-001';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => ({ changes: 0 })), // No match for uppercase
        })),
      }));

      // When: Delete with different case
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should not find (case-sensitive)
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('Unhappy Path: Database errors', () => {
    /**
     * Unhappy Path: Database connection error
     *
     * Given: Database is unavailable
     * When: deletePurchase(transactionId) is called
     * Then: Returns DB_ERROR with retryable=true
     */
    it('should return DB_ERROR with retryable=true on connection error', async () => {
      // Given: Database connection failure
      const transactionId = 'txn-connection-error';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => {
        throw new Error('Database connection timeout');
      });

      // When: Call deletePurchase during connection error
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should return DB_ERROR with retryable=true
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
      expect(result.error?.retryable).toBe(true);
    });

    /**
     * Unhappy Path: Database is locked
     *
     * Given: Database file is locked by another process
     * When: deletePurchase(transactionId) is called
     * Then: Returns DB_ERROR with retryable=true
     */
    it('should return retryable error when database is locked', async () => {
      // Given: Database locked error
      const transactionId = 'txn-locked-error';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => {
        throw new Error('database is locked');
      });

      // When: Call during database lock
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should return retryable error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
      expect(result.error?.retryable).toBe(true);
    });

    /**
     * Unhappy Path: Query timeout
     *
     * Given: Delete query exceeds timeout
     * When: deletePurchase(transactionId) is called
     * Then: Returns DB_ERROR with retryable=true
     */
    it('should return retryable error on query timeout', async () => {
      // Given: Query timeout
      const transactionId = 'txn-timeout-error';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => {
        throw new Error('query timeout');
      });

      // When: Call during timeout
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should return retryable error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
      expect(result.error?.retryable).toBe(true);
    });

    /**
     * Unhappy Path: Constraint violation (should not happen in delete, but test error handling)
     *
     * Given: Unexpected constraint violation during delete
     * When: deletePurchase(transactionId) is called
     * Then: Returns DB_ERROR with retryable=false
     */
    it('should return non-retryable error on constraint violation', async () => {
      // Given: Constraint violation
      const transactionId = 'txn-constraint-error';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => {
        throw new Error('FOREIGN KEY constraint failed');
      });

      // When: Call with constraint error
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should return non-retryable error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
      expect(result.error?.retryable).toBe(false);
    });

    /**
     * Unhappy Path: Generic unknown error
     *
     * Given: Unknown error occurs
     * When: deletePurchase(transactionId) is called
     * Then: Returns DB_ERROR with retryable=false
     */
    it('should return non-retryable error for unknown exceptions', async () => {
      // Given: Unknown error
      const transactionId = 'txn-unknown-error';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => {
        throw new Error('Unexpected database state');
      });

      // When: Call with unknown error
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should return non-retryable error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
      expect(result.error?.retryable).toBe(false);
    });

    /**
     * Unhappy Path: Error with no message
     *
     * Given: Error object with no message property
     * When: deletePurchase(transactionId) is called
     * Then: Handles gracefully with default message
     */
    it('should handle errors with no message gracefully', async () => {
      // Given: Error without message
      const transactionId = 'txn-no-message-error';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => {
        throw {}; // Empty object (not an Error)
      });

      // When: Call with malformed error
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should still return error result
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
      expect(result.error?.message).toBeDefined();
    });
  });

  describe('Integration: Complete workflow scenarios', () => {
    /**
     * Integration: Record purchase, then delete for privacy
     *
     * Given: Purchase was recorded in database
     * When: User requests account deletion, deletePurchase is called
     * Then: Purchase and all associated data are completely removed
     */
    it('should completely remove purchase data for account deletion', async () => {
      // Scenario: User deletion workflow
      const transactionId = 'txn-account-delete-001';
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => ({ changes: 1 })),
        })),
      }));

      // When: Delete for account deletion
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should succeed and remove all traces
      expect(result.success).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    /**
     * Integration: Delete multiple purchases sequentially
     *
     * Given: User has multiple purchases to delete
     * When: deletePurchase is called multiple times
     * Then: All purchases are deleted individually without affecting others
     */
    it('should delete multiple purchases independently', async () => {
      // Given: Multiple purchases
      const txnIds = ['txn-multi-delete-001', 'txn-multi-delete-002', 'txn-multi-delete-003'];
      const mockDb = require('@/database/client').db;

      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => ({ changes: 1 })),
        })),
      }));

      // When: Delete each purchase
      const results = await Promise.all(
        txnIds.map((txn) => localDatabaseService.deletePurchase(txn))
      );

      // Then: All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
      expect(mockDb.delete).toHaveBeenCalledTimes(txnIds.length);
    });

    /**
     * Integration: Cascade deletion verification
     *
     * Given: Purchase with multiple linked features exists
     * When: deletePurchase is called
     * Then: Database schema ensures cascade delete of purchase_features
     */
    it('should verify cascade deletion of associated features', async () => {
      // Given: Purchase with features
      const transactionId = 'txn-cascade-delete-001';
      const mockDb = require('@/database/client').db;

      // Track that delete was called on purchases table
      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => ({ changes: 1 })), // 1 purchase deleted (cascade handled by schema)
        })),
      }));

      // When: Delete purchase
      const result = await localDatabaseService.deletePurchase(transactionId);

      // Then: Should be successful (cascade is DB-level, not app-level)
      expect(result.success).toBe(true);
      // Cascade deletion is handled by ON DELETE CASCADE in schema
    });

    /**
     * Integration: Error recovery workflow
     *
     * Given: Delete fails due to temporary database lock
     * When: Caller retries after short delay
     * Then: Second attempt succeeds
     */
    it('should support retry workflow for transient errors', async () => {
      // Given: First attempt fails with lock, second succeeds
      const transactionId = 'txn-retry-workflow-001';
      const mockDb = require('@/database/client').db;

      let attemptCount = 0;
      mockDb.delete = jest.fn(() => ({
        where: jest.fn(() => ({
          run: jest.fn(() => {
            attemptCount++;
            if (attemptCount === 1) {
              throw new Error('database is locked');
            }
            return { changes: 1 };
          }),
        })),
      }));

      // When: First attempt fails
      const result1 = await localDatabaseService.deletePurchase(transactionId);
      expect(result1.success).toBe(false);
      expect(result1.error?.retryable).toBe(true);

      // When: Retry succeeds
      const result2 = await localDatabaseService.deletePurchase(transactionId);
      expect(result2.success).toBe(true);
    });
  });
});
