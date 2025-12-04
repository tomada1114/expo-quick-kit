/**
 * Sync Reconciler - Local/Platform Purchase State Reconciliation
 *
 * Task 9.3: Detects and resolves mismatches between local database and platform records
 *
 * Responsibilities:
 * - Fetch purchase history from platform (StoreKit2/Google Play Billing)
 * - Compare with LocalDatabase to identify:
 *   - New transactions not in local DB
 *   - Existing transactions to update (mark as synced)
 *   - Orphaned local records not on platform
 * - Update local DB to reflect platform state (platform is source of truth)
 * - Provide detailed reconciliation results
 *
 * Key Design Decisions:
 * - Platform data is the authoritative source
 * - Local DB is updated to match platform state
 * - Orphaned records are identified and marked for potential removal
 * - All operations are idempotent
 *
 * @module features/purchase/application/sync-reconciler
 */

import type { Transaction, PurchaseError } from '../core/types';
import type { Purchase } from '../core/types';

/**
 * Reconciliation operation result
 */
export interface ReconciliationResult {
  /** Number of new transactions recorded from platform */
  newCount: number;
  /** Number of existing transactions updated as synced */
  updatedCount: number;
  /** Number of orphaned local records identified for removal */
  deletedCount: number;
  /** Number of operations that failed during processing */
  failedOperations: number;
  /** Timestamp when reconciliation completed */
  reconciliationAt: Date;
  /** Detailed status message */
  message: string;
}

/**
 * Reconciliation error
 */
export type ReconciliationError =
  | {
      code: 'NETWORK_ERROR';
      message: string;
      retryable: true;
    }
  | {
      code: 'DB_ERROR';
      message: string;
      retryable: true;
    }
  | {
      code: 'STORE_PROBLEM_ERROR';
      message: string;
      retryable: true;
    }
  | {
      code: 'UNKNOWN_ERROR';
      message: string;
      retryable: false;
    };

/**
 * Generic Result type for sync reconciliation
 */
export type Result<T, E> = { success: true; data: T } | { success: false; error: E };

/**
 * Dependencies for sync reconciliation
 */
export interface SyncReconcilerDependencies {
  purchaseRepository: {
    requestAllPurchaseHistory(): Promise<Result<Transaction[], PurchaseError>>;
  };
  purchaseService: {
    getActivePurchases(): Promise<
      Result<Purchase[], { code: string; message: string; retryable: boolean }>
    >;
  };
  database: {
    recordPurchase(transaction: Transaction): Promise<boolean>;
    updatePurchase(transactionId: string, data: Partial<Purchase>): Promise<boolean>;
    deletePurchase(transactionId: string): Promise<boolean>;
  };
}

/**
 * Validates transaction has required fields
 *
 * @param transaction - Transaction to validate
 * @returns true if transaction is valid
 */
function isValidTransaction(transaction: Transaction): boolean {
  return (
    Boolean(transaction.transactionId) &&
    Boolean(transaction.productId) &&
    transaction.purchaseDate instanceof Date &&
    !isNaN(transaction.purchaseDate.getTime()) &&
    Boolean(transaction.receiptData)
  );
}

/**
 * Maps PurchaseError to ReconciliationError
 *
 * @param error - Purchase error from repository
 * @returns Reconciliation error
 */
function mapPurchaseErrorToReconciliationError(error: PurchaseError): ReconciliationError {
  if (error.code === 'NETWORK_ERROR') {
    return {
      code: 'NETWORK_ERROR',
      message: error.message,
      retryable: true,
    };
  }

  if (error.code === 'STORE_PROBLEM_ERROR') {
    return {
      code: 'STORE_PROBLEM_ERROR',
      message: error.message,
      retryable: true,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: error.message,
    retryable: false,
  };
}

/**
 * Sync Reconciler Service
 *
 * Main entry point: reconcilePurchases()
 *
 * @example
 * ```typescript
 * const result = await syncReconciler.reconcilePurchases({
 *   purchaseRepository,
 *   purchaseService,
 *   database,
 * });
 *
 * if (result.success) {
 *   console.log(`New: ${result.data.newCount}, Updated: ${result.data.updatedCount}`);
 * } else {
 *   console.error(`Reconciliation failed: ${result.error.message}`);
 * }
 * ```
 */
export const syncReconciler = {
  /**
   * Reconcile local and platform purchase states
   *
   * Task 9.3: Detects and resolves local/platform record mismatches
   *
   * Process:
   * 1. Fetch purchase history from platform (StoreKit2/GPB)
   * 2. Fetch current purchases from LocalDatabase
   * 3. For each platform transaction:
   *    a. Validate transaction data
   *    b. If exists in local DB: Update isSynced=true
   *    c. If new: Record to LocalDatabase with isSynced=true
   * 4. Identify orphaned local records not on platform
   * 5. Return reconciliation summary
   *
   * Idempotency:
   * - Multiple calls with same platform state = same end state
   * - No duplicate records created
   * - Existing records updated, not re-created
   * - Orphaned records identified consistently
   *
   * Given/When/Then:
   * - Given: Platform has new transactions and updates to existing
   * - When: reconcilePurchases is called
   * - Then: New purchases recorded, existing marked synced
   *
   * - Given: Platform has fewer transactions than local DB
   * - When: reconcilePurchases is called
   * - Then: Orphaned records identified for removal
   *
   * - Given: Network error during fetch
   * - When: reconcilePurchases is called
   * - Then: Returns network error with retryable=true
   *
   * @param deps - Dependencies (purchaseRepository, purchaseService, database)
   * @returns Result with ReconciliationResult or ReconciliationError
   */
  async reconcilePurchases(
    deps: SyncReconcilerDependencies
  ): Promise<Result<ReconciliationResult, ReconciliationError>> {
    try {
      console.log('[SyncReconciler] Starting purchase reconciliation');

      // Step 1: Fetch platform purchase history
      console.log('[SyncReconciler] Fetching purchase history from platform');

      const historyResult = await deps.purchaseRepository.requestAllPurchaseHistory();

      if (!historyResult.success) {
        const reconciliationError = mapPurchaseErrorToReconciliationError(historyResult.error);

        console.error(
          '[SyncReconciler] Failed to fetch platform history:',
          reconciliationError.code
        );

        return {
          success: false,
          error: reconciliationError,
        };
      }

      const platformTransactions = historyResult.data;
      console.log(
        `[SyncReconciler] Retrieved ${platformTransactions.length} transactions from platform`
      );

      // Step 2: Fetch current local purchases
      console.log('[SyncReconciler] Fetching current purchases from LocalDatabase');

      const localResult = await deps.purchaseService.getActivePurchases();

      if (!localResult.success) {
        console.error(
          '[SyncReconciler] Failed to fetch local purchases:',
          localResult.error.code
        );

        return {
          success: false,
          error: {
            code: 'DB_ERROR',
            message: `Failed to fetch local purchases: ${localResult.error.message}`,
            retryable: true,
          },
        };
      }

      const localPurchases = localResult.data;
      const localTransactionIds = new Set(localPurchases.map((p) => p.transactionId));

      console.log(
        `[SyncReconciler] Found ${localPurchases.length} purchases in LocalDatabase`
      );

      // Step 3: Process each platform transaction
      let newCount = 0;
      let updatedCount = 0;
      let failedOperations = 0;
      const processedPlatformIds = new Set<string>();

      // Deduplicate platform transactions
      const uniqueTransactions = Array.from(
        new Map(platformTransactions.map((t) => [t.transactionId, t])).values()
      );

      for (const transaction of uniqueTransactions) {
        try {
          // Validate transaction
          if (!isValidTransaction(transaction)) {
            console.warn(
              '[SyncReconciler] Skipping invalid transaction:',
              transaction.transactionId
            );
            failedOperations++;
            continue;
          }

          processedPlatformIds.add(transaction.transactionId);
          const isExisting = localTransactionIds.has(transaction.transactionId);

          if (isExisting) {
            // Update existing purchase
            console.log(
              `[SyncReconciler] Updating existing purchase: ${transaction.transactionId}`
            );

            const updated = await deps.database.updatePurchase(transaction.transactionId, {
              isSynced: true,
              syncedAt: new Date(),
              isVerified: true, // Platform verification is authoritative
            });

            if (updated) {
              updatedCount++;
            } else {
              console.warn(
                `[SyncReconciler] Failed to update purchase: ${transaction.transactionId}`
              );
              failedOperations++;
            }
          } else {
            // Record new purchase
            console.log(
              `[SyncReconciler] Recording new purchase: ${transaction.transactionId}`
            );

            const recorded = await deps.database.recordPurchase({
              transactionId: transaction.transactionId,
              productId: transaction.productId,
              purchasedAt: transaction.purchaseDate,
              price: 0, // Price not available from platform transaction
              currencyCode: 'USD', // Default currency
              isVerified: true, // Platform verified
              isSynced: true, // Just synced from platform
              unlockedFeatures: [],
            });

            if (recorded) {
              newCount++;
            } else {
              console.warn(
                `[SyncReconciler] Failed to record purchase: ${transaction.transactionId}`
              );
              failedOperations++;
            }
          }
        } catch (error) {
          console.error(
            '[SyncReconciler] Error processing transaction:',
            transaction.transactionId,
            error
          );
          failedOperations++;
        }
      }

      // Step 4: Identify orphaned local records
      let deletedCount = 0;

      for (const localPurchase of localPurchases) {
        if (!processedPlatformIds.has(localPurchase.transactionId)) {
          // Orphaned record not on platform
          console.log(
            `[SyncReconciler] Deleting orphaned purchase: ${localPurchase.transactionId}`
          );

          try {
            const deleted = await deps.database.deletePurchase(localPurchase.transactionId);
            if (deleted) {
              deletedCount++;
            } else {
              console.warn(
                `[SyncReconciler] Failed to delete purchase: ${localPurchase.transactionId}`
              );
              failedOperations++;
            }
          } catch (error) {
            console.error(
              '[SyncReconciler] Error deleting purchase:',
              localPurchase.transactionId,
              error
            );
            failedOperations++;
          }
        }
      }

      // Step 5: Return reconciliation summary
      const result: ReconciliationResult = {
        newCount,
        updatedCount,
        deletedCount,
        failedOperations,
        reconciliationAt: new Date(),
        message: `Reconciliation complete: ${newCount} new, ${updatedCount} updated, ${deletedCount} deleted, ${failedOperations} failed`,
      };

      console.log('[SyncReconciler] Reconciliation completed:', result.message);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('[SyncReconciler] Unexpected error during reconciliation:', error);

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error during reconciliation',
          retryable: false,
        },
      };
    }
  },
};
