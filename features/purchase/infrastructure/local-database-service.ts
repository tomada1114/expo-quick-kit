/**
 * LocalDatabase Service - Task 11.2, 11.4, 11.5
 *
 * Provides database access layer for purchase records using Drizzle ORM.
 *
 * Responsibilities:
 * - Query single purchase by transaction ID (getPurchase) - Task 11.2
 * - Query all verified purchases (getAllPurchases) - Task 11.2
 * - Update sync status (updateSyncStatus) - Task 11.4
 * - Update verification status (updateVerificationStatus) - Task 11.5
 * - Convert database records to domain Purchase entities
 * - Error handling with Result pattern
 * - Timestamp conversion (Unix to Date)
 *
 * Requirements (Task 11.2, 11.4, 11.5):
 * - getPurchase(transactionId): Query by transactionId, return Purchase or null
 * - getAllPurchases(): Query all verified purchases (isVerified = true)
 * - updateSyncStatus(transactionId, isSynced): Update sync flag and timestamp
 * - updateVerificationStatus(transactionId, isVerified): Update isVerified flag
 * - All methods: Safe error handling, Result pattern, timestamp conversion
 *
 * @module features/purchase/infrastructure/local-database-service
 */

import { eq } from 'drizzle-orm';
import { db } from '@/database/client';
import { purchases } from '@/database/schema';
import type { Purchase } from '../core/types';

/**
 * Database error type for Result pattern
 */
export type LocalDatabaseError =
  | {
      code: 'DB_ERROR';
      message: string;
      retryable: boolean;
    }
  | {
      code: 'NOT_FOUND';
      message: string;
      retryable: false;
    }
  | {
      code: 'INVALID_INPUT';
      message: string;
      retryable: false;
    };

/**
 * LocalDatabase Service
 *
 * Provides database query operations for purchase records with error handling.
 *
 * @example
 * ```typescript
 * // Query single purchase
 * const result = await localDatabaseService.getPurchase('txn-001');
 * if (result.success) {
 *   console.log('Purchase:', result.data); // Purchase or null
 * } else {
 *   console.error('Database error:', result.error.message);
 * }
 *
 * // Query all verified purchases
 * const allResult = await localDatabaseService.getAllPurchases();
 * if (allResult.success) {
 *   console.log('All purchases:', allResult.data);
 * }
 * ```
 */
export const localDatabaseService = {
  /**
   * Get a specific purchase by transaction ID
   *
   * Task 11.2: Query LocalDatabase for a specific purchase
   *
   * Process:
   * 1. Validate transaction ID is non-empty string
   * 2. Query purchases table where transactionId = provided ID
   * 3. Convert database record to Purchase entity if found
   * 4. Return Purchase entity or null if not found
   *
   * Safety:
   * - Returns the purchase regardless of verification status
   * - Caller decides if verification is required
   * - Unique constraint on transactionId ensures at most one result
   *
   * Given/When/Then:
   * - Given: Valid transaction ID exists in database
   * - When: getPurchase('txn-001') is called
   * - Then: Returns success with Purchase entity
   *
   * - Given: Transaction ID does not exist
   * - When: getPurchase('non-existent') is called
   * - Then: Returns success with null data
   *
   * - Given: Empty string provided as transaction ID
   * - When: getPurchase('') is called
   * - Then: Returns success with null data
   *
   * - Given: Database query fails
   * - When: Query error occurs
   * - Then: Returns error result with DB_ERROR code and retryable=true
   *
   * @param transactionId - Transaction ID to look up
   * @returns Result containing Purchase entity or null if not found
   *
   * @example
   * ```typescript
   * const result = await localDatabaseService.getPurchase('txn-123');
   *
   * if (result.success) {
   *   if (result.data) {
   *     console.log(`Found purchase: ${result.data.productId}`);
   *     console.log(`Verified: ${result.data.isVerified}`);
   *   } else {
   *     console.log('Purchase not found');
   *   }
   * } else {
   *   console.error(`Database error: ${result.error.message}`);
   * }
   * ```
   */
  async getPurchase(
    transactionId: string
  ): Promise<
    | { success: true; data: Purchase | null }
    | { success: false; error: LocalDatabaseError }
  > {
    try {
      // Early return for empty transaction ID
      if (!transactionId || typeof transactionId !== 'string' || transactionId.trim() === '') {
        return {
          success: true,
          data: null, // Not found (empty ID is treated as no match)
        };
      }

      // Query database for specific purchase by transaction ID
      const dbRecord = db
        .select()
        .from(purchases)
        .where(eq(purchases.transactionId, transactionId))
        .get(); // .get() returns single record or undefined

      // If not found, return null
      if (!dbRecord) {
        return {
          success: true,
          data: null,
        };
      }

      // Convert database record to Purchase entity
      const purchaseEntity: Purchase = {
        transactionId: dbRecord.transactionId,
        productId: dbRecord.productId,
        purchasedAt: new Date(dbRecord.purchasedAt * 1000), // Convert Unix timestamp to Date
        price: dbRecord.price,
        currencyCode: dbRecord.currencyCode,
        isVerified: dbRecord.isVerified,
        isSynced: dbRecord.isSynced,
        syncedAt: dbRecord.syncedAt ? new Date(dbRecord.syncedAt * 1000) : undefined,
        unlockedFeatures: [], // Will be populated from purchaseFeatures table in future enhancement
      };

      return {
        success: true,
        data: purchaseEntity,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown database error';

      console.error('[LocalDatabaseService] Error fetching purchase:', error);

      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: `Failed to fetch purchase: ${message}`,
          retryable: true, // Database errors are typically retryable
        },
      };
    }
  },

  /**
   * Get all verified purchases from local database
   *
   * Task 11.2: Query LocalDatabase for all verified purchases
   *
   * Process:
   * 1. Query purchases table where isVerified = true
   * 2. Convert database records to Purchase entities
   * 3. Return array of verified purchases
   *
   * Safety:
   * - Returns ONLY verified purchases (isVerified = true)
   * - Filters out unverified purchases for safety
   * - Includes both synced and unsynced purchases
   *
   * Given/When/Then:
   * - Given: LocalDatabase contains multiple verified purchases
   * - When: getAllPurchases() is called
   * - Then: Returns all verified purchases with sync status consideration
   *
   * - Given: LocalDatabase contains unverified purchases
   * - When: getAllPurchases() is called
   * - Then: Returns only verified purchases (filters out unverified)
   *
   * - Given: Database is empty or has no verified purchases
   * - When: getAllPurchases() is called
   * - Then: Returns empty array (not an error)
   *
   * - Given: Database query fails
   * - When: Query error occurs
   * - Then: Returns error result with DB_ERROR code and retryable=true
   *
   * @returns Result containing array of verified Purchase entities
   *
   * @example
   * ```typescript
   * const result = await localDatabaseService.getAllPurchases();
   *
   * if (result.success) {
   *   console.log(`Found ${result.data.length} verified purchases`);
   *   result.data.forEach(purchase => {
   *     console.log(`${purchase.productId}: verified=${purchase.isVerified}`);
   *   });
   * } else {
   *   console.error(`Failed to fetch purchases: ${result.error.message}`);
   * }
   * ```
   */
  async getAllPurchases(): Promise<
    | { success: true; data: Purchase[] }
    | { success: false; error: LocalDatabaseError }
  > {
    try {
      // Query database for all verified purchases
      const dbRecords = db
        .select()
        .from(purchases)
        .where(eq(purchases.isVerified, true))
        .all();

      // Convert database records to Purchase entities
      const purchaseEntities: Purchase[] = dbRecords.map((record) => ({
        transactionId: record.transactionId,
        productId: record.productId,
        purchasedAt: new Date(record.purchasedAt * 1000), // Convert Unix timestamp to Date
        price: record.price,
        currencyCode: record.currencyCode,
        isVerified: record.isVerified,
        isSynced: record.isSynced,
        syncedAt: record.syncedAt ? new Date(record.syncedAt * 1000) : undefined,
        unlockedFeatures: [], // Will be populated from purchaseFeatures table in future enhancement
      }));

      return {
        success: true,
        data: purchaseEntities,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown database error';

      console.error('[LocalDatabaseService] Error fetching all purchases:', error);

      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: `Failed to fetch all purchases: ${message}`,
          retryable: true, // Database errors are typically retryable
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
   * - Given: Database error occurs during update
   * - When: updateSyncStatus called
   * - Then: Returns DB_ERROR with retryable=true
   *
   * - Given: Invalid transaction ID (empty or null)
   * - When: updateSyncStatus called with invalid ID
   * - Then: Returns success (no-op for consistency, similar to getPurchase with empty ID)
   *
   * @param transactionId - Transaction ID to update
   * @param isSynced - New sync status (true = synced, false = unsynced)
   * @returns Result with void data on success or LocalDatabaseError on failure
   *
   * @example
   * ```typescript
   * // After platform confirms sync
   * const result = await localDatabaseService.updateSyncStatus('txn-123', true);
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
  ): Promise<
    | { success: true; data: undefined }
    | { success: false; error: LocalDatabaseError }
  > {
    try {
      // Step 1: Validate transaction ID
      if (
        !transactionId ||
        typeof transactionId !== 'string' ||
        transactionId.trim() === ''
      ) {
        // Return success with no-op for consistency with getPurchase behavior
        return {
          success: true,
          data: undefined,
        };
      }

      // Step 2: Update sync status in database
      const now = Math.floor(Date.now() / 1000); // Current Unix timestamp

      const updateData = isSynced
        ? {
            isSynced: true,
            syncedAt: now,
          }
        : {
            isSynced: false,
            syncedAt: null as any, // Allow null assignment
          };

      db.update(purchases)
        .set(updateData)
        .where(eq(purchases.transactionId, transactionId))
        .run();

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      // Capture error for logging and retry determination
      const errorMessage = error instanceof Error ? error.message : String(error);
      const lowerMessage = errorMessage.toLowerCase();

      console.error('[LocalDatabaseService] updateSyncStatus error:', error);

      // Determine if error is retryable (connection/timeout issues are retryable)
      const isRetryable =
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('connection') ||
        lowerMessage.includes('lost') ||
        lowerMessage.includes('ECONNREFUSED') ||
        lowerMessage.includes('locked');

      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: `Failed to update sync status: ${errorMessage}`,
          retryable: isRetryable,
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
   * Process:
   * 1. Validate transactionId (non-empty string)
   * 2. Update purchases table: isVerified flag
   * 3. Verify that at least one row was affected (purchase exists)
   * 4. Return transaction ID and verification status on success
   *
   * Given/When/Then:
   * - Given: Valid transactionId and isVerified status
   * - When: updateVerificationStatus is called
   * - Then: Successfully updates and returns {transactionId, isVerified}
   *
   * - Given: Non-existent transactionId
   * - When: updateVerificationStatus is called
   * - Then: Returns NOT_FOUND error (no rows affected)
   *
   * - Given: Empty or null transactionId
   * - When: updateVerificationStatus is called
   * - Then: Returns INVALID_INPUT validation error
   *
   * - Given: Database connection fails
   * - When: updateVerificationStatus is called
   * - Then: Returns DB_ERROR with retryable flag based on error type
   *
   * @param transactionId - Transaction ID to update
   * @param isVerified - Verification status (true=verified, false=not verified)
   * @returns Result with {transactionId, isVerified} or error
   *
   * @example
   * ```typescript
   * const result = await localDatabaseService.updateVerificationStatus('txn-123', true);
   * if (result.success) {
   *   console.log(`Updated: ${result.data.transactionId} -> verified=${result.data.isVerified}`);
   * } else if (result.error.code === 'NOT_FOUND') {
   *   console.log('Purchase not found');
   * }
   * ```
   */
  async updateVerificationStatus(
    transactionId: string,
    isVerified: boolean
  ): Promise<
    | { success: true; data: { transactionId: string; isVerified: boolean } }
    | { success: false; error: LocalDatabaseError }
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
      // Capture error for logging and retry determination
      const errorMessage = error instanceof Error ? error.message : String(error);
      const lowerMessage = errorMessage.toLowerCase();

      console.error('[LocalDatabaseService] updateVerificationStatus error:', error);

      // Determine if error is retryable (connection/timeout issues are retryable)
      const isRetryable =
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('connection') ||
        lowerMessage.includes('lost') ||
        lowerMessage.includes('ECONNREFUSED') ||
        lowerMessage.includes('locked');

      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: `Failed to update verification status: ${errorMessage}`,
          retryable: isRetryable,
        },
      };
    }
  },

  /**
   * Delete a purchase record - Task 11.6 (Privacy/GDPR Compliance)
   *
   * Removes purchase record and associated data for privacy/GDPR compliance.
   * Called when user requests account deletion or data removal.
   * Purchase_features records are automatically deleted via ON DELETE CASCADE.
   *
   * Process:
   * 1. Validate transactionId (non-empty string)
   * 2. Delete from purchases table where transactionId matches
   * 3. Verify that exactly one row was affected (purchase existed)
   * 4. Return success or appropriate error
   *
   * Given/When/Then:
   * - Given: Valid transactionId exists in database
   * - When: deletePurchase(transactionId) is called
   * - Then: Successfully deletes record and returns success
   *
   * - Given: Non-existent transactionId
   * - When: deletePurchase(transactionId) is called
   * - Then: Returns NOT_FOUND error (no rows affected)
   *
   * - Given: Empty or null transactionId
   * - When: deletePurchase(transactionId) is called
   * - Then: Returns INVALID_INPUT validation error
   *
   * - Given: Database connection fails
   * - When: deletePurchase(transactionId) is called
   * - Then: Returns DB_ERROR with retryable flag based on error type
   *
   * @param transactionId - Transaction ID to delete
   * @returns Result with void data on success or LocalDatabaseError on failure
   *
   * @example
   * ```typescript
   * // Delete purchase for privacy/GDPR compliance
   * const result = await localDatabaseService.deletePurchase('txn-123');
   * if (result.success) {
   *   console.log('Purchase and associated features deleted');
   * } else if (result.error.code === 'NOT_FOUND') {
   *   console.log('Purchase not found');
   * } else if (result.error.retryable) {
   *   console.log('Database error, will retry:', result.error.message);
   * }
   * ```
   */
  async deletePurchase(
    transactionId: string
  ): Promise<
    | { success: true; data: undefined }
    | { success: false; error: LocalDatabaseError }
  > {
    try {
      // Step 1: Validate transaction ID
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

      // Step 2: Delete from database
      // ON DELETE CASCADE in schema ensures purchase_features are also deleted
      const result = db
        .delete(purchases)
        .where(eq(purchases.transactionId, transactionId))
        .run();

      // Step 3: Check if any rows were affected
      if (!result || !('changes' in result) || result.changes === 0) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Purchase with transaction ID not found: ${transactionId}`,
            retryable: false,
          },
        };
      }

      console.log('[LocalDatabaseService] Successfully deleted purchase:', transactionId);

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      // Capture error for logging and retry determination
      const errorMessage = error instanceof Error ? error.message : String(error);
      const lowerMessage = errorMessage.toLowerCase();

      console.error('[LocalDatabaseService] deletePurchase error:', error);

      // Determine if error is retryable
      // Transient errors (connection/timeout/lock) are retryable
      // Persistent errors (constraint violations, etc.) are not
      const isRetryable =
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('connection') ||
        lowerMessage.includes('lost') ||
        lowerMessage.includes('ECONNREFUSED') ||
        lowerMessage.includes('locked');

      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: `Failed to delete purchase: ${errorMessage}`,
          retryable: isRetryable,
        },
      };
    }
  },
};
