/**
 * Privacy Handler - User Data Deletion for GDPR/Privacy Compliance
 *
 * Task 15.3: PrivacyHandler - Delete all purchase-related personal information
 *
 * Handles complete removal of user purchase data when user deletes their account.
 * Provides comprehensive deletion across LocalDatabase and SecureStore.
 *
 * Deletion Strategy:
 * 1. Retrieve all purchase records from local database
 * 2. Delete each purchase record individually (with error resilience)
 * 3. Clear all verification metadata from secure store
 * 4. Report deletion results (successful/failed counts)
 *
 * @module features/purchase/application/privacy-handler
 */

import type { Result } from '../core/types';
import { localDatabase } from '../infrastructure/local-database';
import {
  verificationMetadataStore,
} from '../infrastructure/verification-metadata-store';

/**
 * Database error type for Result pattern
 */
export type DatabaseError =
  | { code: 'DB_ERROR'; message: string; retryable: boolean }
  | { code: 'INVALID_INPUT'; message: string; retryable: false }
  | { code: 'NOT_FOUND'; message: string; retryable: false };

/**
 * Result of purchase deletion operation
 */
export interface DeletePurchasesResult {
  /** Number of purchases successfully deleted */
  deletedCount: number;
  /** Number of purchases that failed to delete */
  failedCount: number;
  /** List of transaction IDs that failed deletion */
  failedTransactionIds: string[];
}

/**
 * Result of secure store deletion operation
 */
export interface DeleteSecureStoreResult {
  /** Whether deletion was successful */
  success: boolean;
}

/**
 * Complete user deletion result
 */
export interface DeleteUserDataResult {
  /** Purchases deletion details */
  purchases: DeletePurchasesResult;
  /** Secure store deletion details */
  secureStore: DeleteSecureStoreResult;
  /** Total items deleted across all stores */
  totalDeleted: number;
}

/**
 * Privacy Handler Service
 *
 * Handles complete user data deletion for privacy/GDPR compliance.
 * Ensures all purchase-related personal information is removed.
 */
export const privacyHandler = {
  /**
   * Delete all purchase records from local database
   *
   * Process:
   * 1. Retrieve all purchases from database
   * 2. Iterate through and delete each one
   * 3. Continue on individual failures to maximize deletion
   * 4. Return summary with success/failure counts
   *
   * Given/When/Then:
   * - Given: Multiple purchase records in database
   * - When: deleteAllPurchaseData is called
   * - Then: All purchases are deleted and count is returned
   *
   * - Given: Database contains no purchases
   * - When: deleteAllPurchaseData is called
   * - Then: Returns success with zero deleted count
   *
   * - Given: Some deletes fail while others succeed
   * - When: deleteAllPurchaseData processes each purchase
   * - Then: Continues processing and reports partial results
   *
   * @returns Result with deletion summary
   *
   * @example
   * ```typescript
   * const result = await privacyHandler.deleteAllPurchaseData();
   * if (result.success) {
   *   console.log(`Deleted ${result.data?.deletedCount} purchases`);
   * } else {
   *   console.error('Failed to delete purchases:', result.error);
   * }
   * ```
   */
  async deleteAllPurchaseData(): Promise<Result<DeletePurchasesResult, DatabaseError>> {
    try {
      // Step 1: Retrieve all purchases
      const purchasesResult = await localDatabase.getAllPurchases();

      if (!purchasesResult.success) {
        // Failed to retrieve purchases
        return purchasesResult as Result<DeletePurchasesResult, DatabaseError>;
      }

      const purchases = purchasesResult.data;

      // Step 2: Delete each purchase
      let deletedCount = 0;
      const failedTransactionIds: string[] = [];

      for (const purchase of purchases) {
        try {
          const deleteResult = await localDatabase.deletePurchase(
            purchase.transactionId
          );

          if (deleteResult.success) {
            deletedCount++;
          } else {
            failedTransactionIds.push(purchase.transactionId);
          }
        } catch (error) {
          // Log and continue on exception
          failedTransactionIds.push(purchase.transactionId);
        }
      }

      // Step 3: Return summary
      return {
        success: true,
        data: {
          deletedCount,
          failedCount: failedTransactionIds.length,
          failedTransactionIds,
        },
      };
    } catch (error) {
      // Handle unexpected errors
      const errorMessage =
        error instanceof Error ? error.message : 'Purchase deletion failed';

      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: errorMessage,
          retryable: true,
        },
      };
    }
  },

  /**
   * Delete all verification metadata from secure store
   *
   * Process:
   * 1. Clear all verification metadata
   * 2. Return success or error result
   *
   * Given/When/Then:
   * - Given: Secure store with verification metadata
   * - When: deleteSecureStoreData is called
   * - Then: All metadata is cleared
   *
   * - Given: Secure store is empty
   * - When: deleteSecureStoreData is called
   * - Then: Returns success (idempotent)
   *
   * @returns Result of secure store deletion
   *
   * @example
   * ```typescript
   * const result = await privacyHandler.deleteSecureStoreData();
   * if (result.success) {
   *   console.log('Verification metadata cleared');
   * }
   * ```
   */
  async deleteSecureStoreData(): Promise<Result<DeleteSecureStoreResult, DatabaseError>> {
    try {
      // Step 1: Clear all verification metadata
      const clearResult =
        await verificationMetadataStore.clearAllVerificationMetadata();

      if (!clearResult.success) {
        return {
          success: false,
          error: clearResult.error,
        };
      }

      // Step 2: Return success
      return {
        success: true,
        data: { success: true },
      };
    } catch (error) {
      // Handle unexpected errors
      const errorMessage =
        error instanceof Error ? error.message : 'Secure store deletion failed';

      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: errorMessage,
          retryable: true,
        },
      };
    }
  },

  /**
   * Delete all user purchase data comprehensively
   *
   * Orchestrates complete user data deletion across all storage layers.
   * Ensures all personal information related to purchases is removed.
   *
   * Process:
   * 1. Delete all purchase records from local database
   * 2. Delete all verification metadata from secure store
   * 3. Return comprehensive deletion result
   *
   * Failures in one layer do not block deletion of other layers.
   * Returns overall success only if both layers complete without critical errors.
   *
   * Given/When/Then:
   * - Given: User with purchases and verification metadata
   * - When: deleteUserAllPurchaseData is called
   * - When: All data is deleted
   *
   * - Given: Database error prevents reading purchases
   * - When: deleteUserAllPurchaseData is called
   * - Then: Attempts secure store deletion and returns database error
   *
   * @returns Result with comprehensive deletion summary
   *
   * @example
   * ```typescript
   * // Called when user deletes their account
   * const result = await privacyHandler.deleteUserAllPurchaseData();
   *
   * if (result.success) {
   *   console.log(`Deleted ${result.data?.totalDeleted} items total`);
   *   console.log(`Purchases: ${result.data?.purchases.deletedCount}`);
   * } else {
   *   console.error('Deletion failed:', result.error);
   *   // Retry or escalate to support
   * }
   * ```
   */
  async deleteUserAllPurchaseData(): Promise<Result<DeleteUserDataResult, DatabaseError>> {
    try {
      // Step 1: Delete all purchase records
      const purchasesResult =
        await privacyHandler.deleteAllPurchaseData();

      // Step 2: Delete all secure store data (continue even if purchases fail)
      const secureStoreResult =
        await privacyHandler.deleteSecureStoreData();

      // Step 3: Determine overall success
      // Consider success if we were able to delete data or data didn't exist
      const purchasesSuccess = purchasesResult.success;
      const secureStoreSuccess = secureStoreResult.success;

      // If either failed with a non-retryable error, return that error
      if (!purchasesSuccess && !purchasesResult.error.retryable) {
        return {
          success: false,
          error: purchasesResult.error,
        };
      }

      if (!secureStoreSuccess && !secureStoreResult.error.retryable) {
        return {
          success: false,
          error: secureStoreResult.error,
        };
      }

      // If database read failed (retryable), report it
      if (!purchasesSuccess) {
        return {
          success: false,
          error: purchasesResult.error,
        };
      }

      // Step 4: Calculate totals
      const purchaseData = purchasesResult.data || {
        deletedCount: 0,
        failedCount: 0,
        failedTransactionIds: [],
      };

      const totalDeleted = purchaseData.deletedCount +
        (secureStoreSuccess ? 1 : 0); // Count secure store clear as 1 operation

      // Step 5: Return comprehensive result
      return {
        success: true,
        data: {
          purchases: purchaseData,
          secureStore: secureStoreResult.data || { success: false },
          totalDeleted,
        },
      };
    } catch (error) {
      // Handle unexpected errors during orchestration
      const errorMessage =
        error instanceof Error ? error.message : 'User data deletion failed';

      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: errorMessage,
          retryable: true,
        },
      };
    }
  },
};
