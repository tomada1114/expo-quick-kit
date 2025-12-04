/**
 * Restore Service - Purchase Restoration Flow
 *
 * Task 8.1: Implements the purchase restoration flow
 *
 * Responsibilities:
 * - Fetch purchase history from platform (StoreKit2/Google Play Billing)
 * - Compare with LocalDatabase to identify new vs existing transactions
 * - Update isSynced flag for existing purchases
 * - Record new purchases to LocalDatabase
 * - Ensure idempotent operation (no duplicates)
 * - Handle errors and provide detailed results
 *
 * Process:
 * 1. Call PurchaseRepository.requestAllPurchaseHistory()
 * 2. Get current purchases from LocalDatabase via PurchaseService
 * 3. For each platform transaction:
 *    - Check if transactionId exists in DB
 *    - If exists: update isSynced=true
 *    - If new: record to DB with isVerified=true, isSynced=true
 * 4. Return restoration summary (new count, updated count, total)
 *
 * @module features/purchase/application/restore-service
 */

import { eq } from 'drizzle-orm';
import type { Transaction, PurchaseError } from '../core/types';
import { purchaseRepository } from '../core/repository';
import { purchaseService } from './purchase-service';
import { db } from '@/database/client';
import { purchases } from '@/database/schema';

/**
 * Result of restore operation
 */
export interface RestoreResult {
  /** Total transactions processed from platform */
  restoredCount: number;
  /** New purchases recorded to LocalDatabase */
  newCount: number;
  /** Existing purchases updated with isSynced=true */
  updatedCount: number;
}

/**
 * Error from restore operation
 */
export type RestoreError =
  | {
      code: 'NETWORK_ERROR';
      message: string;
      retryable: true;
    }
  | {
      code: 'STORE_PROBLEM_ERROR';
      message: string;
      retryable: true;
    }
  | {
      code: 'DB_ERROR';
      message: string;
      retryable: true;
    }
  | {
      code: 'UNKNOWN_ERROR';
      message: string;
      retryable: false;
    };

/**
 * Generic Result type for restore operation
 */
export type Result<T, E> = { success: true; data: T } | { success: false; error: E };

/**
 * Restore Service - Orchestrates purchase restoration
 *
 * Main entry point: restorePurchases()
 *
 * @example
 * ```typescript
 * const result = await restoreService.restorePurchases();
 *
 * if (result.success) {
 *   console.log(`Restored ${result.data.restoredCount} purchases`);
 *   console.log(`  New: ${result.data.newCount}`);
 *   console.log(`  Updated: ${result.data.updatedCount}`);
 * } else {
 *   console.error(`Restoration failed: ${result.error.message}`);
 *   if (result.error.retryable) {
 *     // Show retry button
 *   }
 * }
 * ```
 */
export const restoreService = {
  /**
   * Restore purchases from platform and sync with LocalDatabase
   *
   * Task 8.1: Main restoration flow
   *
   * Process:
   * 1. Fetch purchase history from platform (StoreKit2 / Google Play Billing)
   * 2. Fetch current purchases from LocalDatabase
   * 3. For each platform transaction:
   *    a. Check if transactionId exists in DB
   *    b. If exists: Update isSynced flag
   *    c. If new: Record new purchase
   * 4. Return summary of operations
   *
   * Idempotency:
   * - Multiple calls with same platform history = same end state
   * - No duplicate records created
   * - Existing records updated, not re-created
   *
   * Error Handling:
   * - Network errors (retryable)
   * - Store problem errors (retryable)
   * - Database errors (retryable)
   * - Unknown errors (non-retryable)
   *
   * Given/When/Then:
   * - Given: Platform returns purchase history with mix of new and existing
   * - When: restorePurchases is called
   * - Then: New purchases recorded, existing updated, counts returned
   *
   * - Given: Platform returns empty history
   * - When: restorePurchases is called
   * - Then: Returns success with zero counts
   *
   * - Given: Network error during fetch
   * - When: restorePurchases is called
   * - Then: Returns network error with retryable=true
   *
   * @returns Result with RestoreResult (counts) or RestoreError
   */
  async restorePurchases(): Promise<Result<RestoreResult, RestoreError>> {
    try {
      // Step 1: Fetch purchase history from platform
      console.log('[RestoreService] Fetching purchase history from platform');

      const historyResult = await purchaseRepository.requestAllPurchaseHistory();

      if (!historyResult.success) {
        // Handle platform API error
        const error = historyResult.error;

        console.error(
          '[RestoreService] Failed to fetch purchase history:',
          error.code,
          error.message
        );

        return {
          success: false,
          error: mapPurchaseErrorToRestoreError(error),
        };
      }

      const platformTransactions = historyResult.data;
      console.log(
        `[RestoreService] Retrieved ${platformTransactions.length} transactions from platform`
      );

      // Step 2: Fetch current purchases from LocalDatabase
      console.log('[RestoreService] Fetching current purchases from LocalDatabase');

      const currentPurchasesResult = await purchaseService.getActivePurchases();

      if (!currentPurchasesResult.success) {
        // Handle database error
        console.error(
          '[RestoreService] Failed to fetch current purchases:',
          currentPurchasesResult.error.code
        );

        return {
          success: false,
          error: {
            code: 'DB_ERROR',
            message: `Failed to fetch current purchases: ${currentPurchasesResult.error.message}`,
            retryable: true,
          },
        };
      }

      const currentPurchases = currentPurchasesResult.data;
      const existingTransactionIds = new Set(
        currentPurchases.map((p) => p.transactionId)
      );

      console.log(
        `[RestoreService] Found ${currentPurchases.length} existing purchases in DB`
      );

      // Step 3: Process each platform transaction
      let newCount = 0;
      let updatedCount = 0;

      for (const transaction of platformTransactions) {
        try {
          // Validate transaction before processing
          if (!validateTransaction(transaction)) {
            console.warn(
              '[RestoreService] Skipping invalid transaction:',
              transaction.transactionId
            );
            continue;
          }

          const isExisting = existingTransactionIds.has(transaction.transactionId);

          if (isExisting) {
            // Step 3a: Update existing purchase
            console.log(
              `[RestoreService] Updating existing purchase: ${transaction.transactionId}`
            );

            const updateResult = await updatePurchaseSyncStatus(
              transaction.transactionId
            );

            if (updateResult) {
              updatedCount++;
            } else {
              console.warn(
                `[RestoreService] Failed to update purchase: ${transaction.transactionId}`
              );
            }
          } else {
            // Step 3b: Record new purchase
            console.log(
              `[RestoreService] Recording new purchase: ${transaction.transactionId}`
            );

            const recordResult = await recordRestoredPurchase(transaction);

            if (recordResult) {
              newCount++;
            } else {
              console.warn(
                `[RestoreService] Failed to record purchase: ${transaction.transactionId}`
              );
            }
          }
        } catch (error) {
          console.error(
            '[RestoreService] Error processing transaction:',
            transaction.transactionId,
            error
          );
          // Continue processing other transactions
        }
      }

      // Step 4: Return restoration summary
      const result: RestoreResult = {
        restoredCount: platformTransactions.length,
        newCount,
        updatedCount,
      };

      console.log('[RestoreService] Restoration complete:', result);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // Unexpected error
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error during purchase restoration';

      console.error('[RestoreService] Unexpected error:', error);

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: `Purchase restoration failed: ${message}`,
          retryable: false,
        },
      };
    }
  },
};

/**
 * Update purchase sync status to isSynced=true with current timestamp
 *
 * Used when a platform transaction already exists in LocalDatabase.
 * Updates the purchase record to mark it as synced with the platform.
 *
 * @param transactionId - Transaction ID to update
 * @returns true if update successful, false otherwise
 *
 * @private Internal helper for restorePurchases
 */
async function updatePurchaseSyncStatus(transactionId: string): Promise<boolean> {
  try {
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    db.update(purchases)
      .set({
        isSynced: true,
        syncedAt: now,
      })
      .where(eq(purchases.transactionId, transactionId))
      .run();

    return true;
  } catch (error) {
    console.error('[RestoreService] Failed to update sync status:', error);
    return false;
  }
}

/**
 * Record a restored purchase to LocalDatabase
 *
 * Used for new transactions fetched from platform that don't exist in LocalDatabase.
 * Records with isVerified=true (platform has already verified), isSynced=true.
 *
 * @param transaction - Transaction from platform to record
 * @returns true if record successful, false otherwise
 *
 * @private Internal helper for restorePurchases
 */
async function recordRestoredPurchase(transaction: Transaction): Promise<boolean> {
  try {
    const purchasedAtUnix = Math.floor(transaction.purchaseDate.getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);

    // Insert new purchase record
    // For restored purchases: isVerified=true (platform verified), isSynced=true
    db.insert(purchases)
      .values({
        transactionId: transaction.transactionId,
        productId: transaction.productId,
        purchasedAt: purchasedAtUnix,
        price: 0, // Will be filled from product metadata in future
        currencyCode: 'USD', // Will be filled from product metadata
        isVerified: true, // Platform has already verified
        isSynced: true, // Restored from platform, so synced
        syncedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return true;
  } catch (error) {
    console.error('[RestoreService] Failed to record purchase:', error);
    return false;
  }
}

/**
 * Validate transaction structure before processing
 *
 * Checks:
 * - transactionId is non-empty string
 * - productId is non-empty string
 * - purchaseDate is valid Date
 * - receiptData is non-empty string
 *
 * @param transaction - Transaction to validate
 * @returns true if valid, false otherwise
 *
 * @private Internal helper
 */
function validateTransaction(transaction: any): boolean {
  if (!transaction || typeof transaction !== 'object') {
    return false;
  }

  if (!transaction.transactionId || typeof transaction.transactionId !== 'string') {
    return false;
  }

  if (!transaction.productId || typeof transaction.productId !== 'string') {
    return false;
  }

  if (!(transaction.purchaseDate instanceof Date)) {
    return false;
  }

  if (!transaction.receiptData || typeof transaction.receiptData !== 'string') {
    return false;
  }

  return true;
}

/**
 * Map PurchaseError to RestoreError
 *
 * Converts platform-level purchase errors to restoration-level errors.
 *
 * @param error - PurchaseError from repository
 * @returns RestoreError with appropriate code and retryability
 *
 * @private Internal helper
 */
function mapPurchaseErrorToRestoreError(error: PurchaseError): RestoreError {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        retryable: true,
      };

    case 'STORE_PROBLEM_ERROR':
      return {
        code: 'STORE_PROBLEM_ERROR',
        message: error.message,
        retryable: true,
      };

    default:
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        retryable: false,
      };
  }
}
