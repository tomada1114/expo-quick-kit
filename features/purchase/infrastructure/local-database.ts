/**
 * LocalDatabase Service - Purchase Data Persistence
 *
 * Provides CRUD operations for purchase records in Drizzle SQLite.
 * Bridges application layer (PurchaseService, FeatureGatingService) with
 * infrastructure layer (Drizzle ORM, SQLite database).
 *
 * Task 11.1: recordPurchase - Record new purchase transactions
 * Task 11.2: getPurchase - Query single purchase by transaction ID
 * Task 11.4: updateSyncStatus - Update sync status flag and timestamp
 *
 * @module features/purchase/infrastructure/local-database
 */

import { eq } from 'drizzle-orm';
import { db } from '@/database/client';
import { purchases } from '@/database/schema';
import type { Result } from '../core/types';

/**
 * Database error type for Result pattern
 */
export type DatabaseError =
  | { code: 'DB_ERROR'; message: string; retryable: boolean }
  | { code: 'INVALID_INPUT'; message: string; retryable: false }
  | { code: 'NOT_FOUND'; message: string; retryable: false };

/**
 * LocalDatabase service - Manages purchase records in SQLite
 *
 * Responsibilities:
 * - CRUD operations for purchase records (Task 11.1-11.6)
 * - Sync status management (Task 11.4, 11.2)
 * - Verification status tracking (Task 11.5)
 * - Data persistence and recovery support
 *
 * All methods use Result pattern for exception-free error handling.
 *
 * @module features/purchase/infrastructure/local-database
 */
export const localDatabase = {
  /**
   * Record a new purchase in the database - Task 11.1
   *
   * Inserts a new purchase record with transaction ID, product ID, price, and verification status.
   * Enforces unique constraint on transactionId to prevent duplicate purchases.
   *
   * Process:
   * 1. Validate required fields (transactionId, productId, purchasedAt)
   * 2. Convert purchasedAt Date to Unix timestamp (seconds)
   * 3. Insert purchase record into purchases table
   * 4. Return success or database error
   *
   * Given/When/Then:
   * - Given: Valid purchase parameters with all required fields
   * - When: recordPurchase is called
   * - Then: Purchase is inserted and returns success result
   *
   * - Given: Duplicate transactionId already exists in database
   * - When: recordPurchase is called with same ID
   * - Then: Returns DB_ERROR with retryable=true (could succeed on retry after delay)
   *
   * - Given: Required field (transactionId, productId, purchasedAt) is missing
   * - When: recordPurchase is called with invalid input
   * - Then: Returns INVALID_INPUT error before database operation
   *
   * @param transactionId - Platform-generated transaction identifier (must be unique)
   * @param productId - Product identifier (e.g., "premium_unlock")
   * @param purchasedAt - Date when purchase was made
   * @param price - Price amount in decimal (e.g., 9.99)
   * @param currencyCode - Currency code (e.g., "USD", "JPY")
   * @param isVerified - Whether receipt signature is verified (default: true)
   * @param isSynced - Whether purchase is synced to server (default: false)
   * @returns Result with undefined data on success or DatabaseError on failure
   *
   * @example
   * ```typescript
   * const result = await localDatabase.recordPurchase(
   *   'txn-123-abc',
   *   'premium_unlock',
   *   new Date(),
   *   9.99,
   *   'USD',
   *   true,    // isVerified
   *   false    // isSynced
   * );
   *
   * if (result.success) {
   *   console.log('Purchase recorded successfully');
   * } else {
   *   console.error('Failed to record purchase:', result.error.message);
   * }
   * ```
   */
  async recordPurchase(
    transactionId: string,
    productId: string,
    purchasedAt: Date,
    price: number,
    currencyCode: string,
    isVerified: boolean = true,
    isSynced: boolean = false
  ): Promise<Result<void, DatabaseError>> {
    try {
      // Step 1: Validation
      if (
        !transactionId ||
        typeof transactionId !== 'string' ||
        transactionId.trim() === ''
      ) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Transaction ID is required and must be a non-empty string',
            retryable: false,
          },
        };
      }

      if (!productId || typeof productId !== 'string' || productId.trim() === '') {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Product ID is required and must be a non-empty string',
            retryable: false,
          },
        };
      }

      if (!purchasedAt || !(purchasedAt instanceof Date)) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Purchased at must be a valid Date object',
            retryable: false,
          },
        };
      }

      // Step 2: Convert timestamp
      const purchasedAtUnix = Math.floor(purchasedAt.getTime() / 1000);

      // Step 3: Insert purchase record
      db.insert(purchases)
        .values({
          transactionId,
          productId,
          purchasedAt: purchasedAtUnix,
          price,
          currencyCode,
          isVerified,
          isSynced,
        })
        .run();

      return { success: true, data: undefined };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown database error';

      console.error('[LocalDatabase] recordPurchase error:', error);

      // Determine if error is retryable based on error message
      const isRetryable =
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('SQLITE_BUSY');

      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: `Failed to record purchase: ${message}`,
          retryable: isRetryable,
        },
      };
    }
  },

  /**
   * Update sync status for a purchase record - Task 11.4
   *
   * Sets isSynced flag and syncedAt timestamp when platform synchronization completes.
   * Called by RestoreService and SyncReconciler after successfully syncing to platform.
   *
   * Process:
   * 1. Validate transaction ID (non-empty string)
   * 2. Update purchases table: isSynced and syncedAt (if isSynced=true)
   * 3. Clear syncedAt when setting isSynced=false
   * 4. Return success or database error
   *
   * Given/When/Then:
   * - Given: Valid transaction ID exists in database
   * - When: updateSyncStatus called with isSynced=true
   * - Then: isSynced set to true and syncedAt set to current Unix timestamp
   *
   * - Given: Valid transaction ID exists and currently synced
   * - When: updateSyncStatus called with isSynced=false
   * - Then: isSynced set to false and syncedAt cleared (set to null)
   *
   * - Given: Invalid transaction ID (empty or null)
   * - When: updateSyncStatus called with invalid ID
   * - Then: Returns INVALID_INPUT error
   *
   * - Given: Database error occurs during update
   * - When: updateSyncStatus called
   * - Then: Returns DB_ERROR with retryable=true
   *
   * @param transactionId - Transaction ID to update
   * @param isSynced - New sync status (true = synced, false = unsynced)
   * @returns Result with void data on success or DatabaseError on failure
   *
   * @example
   * ```typescript
   * // After platform confirms sync
   * const result = await localDatabase.updateSyncStatus('txn-123', true);
   *
   * if (result.success) {
   *   console.log('Purchase marked as synced');
   * } else {
   *   console.error('Failed to update sync status:', result.error.message);
   * }
   * ```
   */
  async updateSyncStatus(
    transactionId: string,
    isSynced: boolean
  ): Promise<Result<void, DatabaseError>> {
    try {
      // Step 1: Validate transaction ID
      if (
        !transactionId ||
        typeof transactionId !== 'string' ||
        transactionId.trim() === ''
      ) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Transaction ID is required and must be a non-empty string',
            retryable: false,
          },
        };
      }

      // Step 2: Update sync status with timestamp
      const syncedAt = isSynced ? Math.floor(Date.now() / 1000) : null;

      db.update(purchases)
        .set({
          isSynced,
          syncedAt,
        })
        .where(eq(purchases.transactionId, transactionId))
        .run();

      return { success: true, data: undefined };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown database error';

      console.error('[LocalDatabase] updateSyncStatus error:', error);

      const isRetryable =
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('SQLITE_BUSY');

      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: `Failed to update sync status: ${message}`,
          retryable: isRetryable,
        },
      };
    }
  },

  /**
   * Get a single purchase by transaction ID - Task 11.2
   *
   * Queries the database for a purchase with the specified transaction ID.
   * Returns the purchase record or null if not found.
   *
   * @param transactionId - Transaction ID to look up
   * @returns Result with purchase record or null if not found
   */
  async getPurchase(transactionId: string): Promise<Result<any | null, DatabaseError>> {
    try {
      if (!transactionId) {
        return { success: true, data: null };
      }

      const record = db
        .select()
        .from(purchases)
        .where(eq(purchases.transactionId, transactionId))
        .get();

      return { success: true, data: record || null };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown database error';

      console.error('[LocalDatabase] getPurchase error:', error);

      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: `Failed to fetch purchase: ${message}`,
          retryable: true,
        },
      };
    }
  },

  /**
   * Get all purchases from the database
   *
   * Queries all purchase records regardless of verification status.
   *
   * @returns Result with array of purchase records
   */
  async getAllPurchases(): Promise<Result<any[], DatabaseError>> {
    try {
      const records = db.select().from(purchases).all();

      return { success: true, data: records };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown database error';

      console.error('[LocalDatabase] getAllPurchases error:', error);

      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: `Failed to fetch purchases: ${message}`,
          retryable: true,
        },
      };
    }
  },

  /**
   * Update verification status for a purchase - Task 11.5
   *
   * Sets isVerified flag based on receipt verification results.
   * Called after ReceiptVerifier validates receipt signature.
   *
   * @param transactionId - Transaction ID to update
   * @param isVerified - Verification status (true=verified, false=not verified)
   * @returns Result with {transactionId, isVerified} or error
   */
  async updateVerificationStatus(
    transactionId: string,
    isVerified: boolean
  ): Promise<
    Result<
      { transactionId: string; isVerified: boolean },
      DatabaseError
    >
  > {
    try {
      // Validate input
      if (!transactionId || typeof transactionId !== 'string' || transactionId.trim() === '') {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'transactionId must be a non-empty string',
            retryable: false,
          },
        };
      }

      // Update the verification status
      const result = db
        .update(purchases)
        .set({ isVerified })
        .where(eq(purchases.transactionId, transactionId))
        .run();

      // Check if any rows were affected
      if (!result || !('changes' in result) || result.changes === 0) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Purchase with transaction not found: ${transactionId}`,
            retryable: false,
          },
        };
      }

      return {
        success: true,
        data: {
          transactionId,
          isVerified,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown database error';

      console.error('[LocalDatabase] updateVerificationStatus error:', error);

      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: `Failed to update verification status: ${message}`,
          retryable: true,
        },
      };
    }
  },
};
