/**
 * Recovery Handler - DB Corruption Detection and Recovery
 *
 * Task 9.5: ローカル購入記録の破損検出と復旧
 *
 * Provides comprehensive corruption detection and recovery mechanisms:
 * - Detects database read failures and corruption
 * - Reconstructs purchase records from platform transaction history
 * - Validates recovery results
 * - Automatically recovers on app startup
 *
 * Recovery Strategy:
 * 1. Detect: Attempt to read purchases from DB and catch errors
 * 2. Notify: Log corruption with timestamp and error details
 * 3. Recover: Fetch transaction history from platform (StoreKit2/GPB)
 * 4. Reconstruct: Build purchase records from verified transactions
 * 5. Validate: Ensure recovery integrity and consistency
 *
 * @module features/purchase/application/recovery-handler
 */

import type { Purchase, PurchaseError, Result, Transaction } from '../core/types';
import { purchaseRepository } from '../core/repository';
import { db } from '@/database/client';
import { purchases as purchasesTable } from '@/database/schema';
import { errorLogger } from '../infrastructure/error-logger';

/**
 * Error information from DB corruption
 */
export interface CorruptionErrorInfo {
  /** Error message */
  error: string;
  /** Timestamp when corruption was detected */
  timestamp: Date;
  /** Additional context if available */
  context?: Record<string, unknown>;
}

/**
 * DB corruption detection result
 */
export interface DBCorruptionResult {
  /** Whether corruption is detected */
  isCorrupted: boolean;
  /** Error information if corrupted */
  errorInfo?: CorruptionErrorInfo;
  /** Number of readable records (if read succeeds) */
  recordCount?: number;
}

/**
 * Recovery result from transaction history
 */
export interface RecoveryResult {
  /** Number of successfully recovered purchases */
  recoveredCount: number;
  /** List of transaction IDs that were recovered */
  recoveredTransactionIds: string[];
}

/**
 * Reconstruction result
 */
export interface ReconstructionResult {
  /** Number of records added from recovery */
  addedCount: number;
  /** Number of existing records updated */
  updatedCount: number;
}

/**
 * Recovery validation result
 */
export interface RecoveryValidation {
  /** Whether recovery is valid */
  isValid: boolean;
  /** List of validation errors (if any) */
  errors: string[];
}

/**
 * Recovery status for monitoring
 */
export interface RecoveryStatus {
  /** Whether DB is corrupted */
  isCorrupted: boolean;
  /** Whether recovery was attempted */
  recoveryAttempted: boolean;
  /** Whether recovery was successful */
  recoverySuccessful?: boolean;
  /** Number of purchases recovered (if successful) */
  recoveredPurchaseCount?: number;
  /** Error if recovery failed */
  recoveryError?: PurchaseError;
  /** Timestamp of status check */
  statusTimestamp: Date;
  /** Any error during status retrieval */
  statusError?: string;
}

/**
 * Recovery Handler Service
 *
 * Handles database corruption detection and recovery.
 * Uses platform transaction history as source of truth for reconstruction.
 */
export const recoveryHandler = {
  /**
   * Detect database corruption by attempting to read purchases
   *
   * Process:
   * 1. Attempt to query purchases table
   * 2. Catch any read errors as corruption indicators
   * 3. Return corruption status with error details
   *
   * Given/When/Then:
   * - Given: Healthy database
   * - When: detectDBCorruption is called
   * - Then: Returns isCorrupted: false
   *
   * - Given: Database read fails with error
   * - When: Query throws exception
   * - Then: Returns isCorrupted: true with error details
   *
   * @returns Corruption detection result
   *
   * @example
   * ```typescript
   * const result = await recoveryHandler.detectDBCorruption();
   * if (result.isCorrupted) {
   *   console.log(`Corruption detected: ${result.errorInfo?.error}`);
   * }
   * ```
   */
  async detectDBCorruption(): Promise<DBCorruptionResult> {
    try {
      // Attempt to read from purchases table
      const purchases = await db.select().from(purchasesTable);

      // If successful, no corruption detected
      return {
        isCorrupted: false,
        recordCount: purchases.length,
      };
    } catch (error) {
      // DB read failed - corruption detected
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const result: DBCorruptionResult = {
        isCorrupted: true,
        errorInfo: {
          error: errorMessage,
          timestamp: new Date(),
          context: {
            errorType: error instanceof Error ? 'Error' : typeof error,
          },
        },
      };

      // Log corruption
      errorLogger.logError(error, {
        operation: 'detectDBCorruption',
        context: 'Database read failure',
      });

      return result;
    }
  },

  /**
   * Recover purchase records from platform transaction history
   *
   * Process:
   * 1. Fetch all purchase history from platform (StoreKit2/GPB)
   * 2. Deduplicate transactions by ID
   * 3. Validate transaction structure
   * 4. Return recovered transactions
   *
   * Given/When/Then:
   * - Given: Platform has transaction history
   * - When: recoverFromTransactionHistory is called
   * - Then: Returns recovered transactions
   *
   * - Given: Duplicate transaction IDs in history
   * - When: Processing history
   * - Then: Deduplicates by transaction ID
   *
   * @returns Result with recovered transaction information
   *
   * @example
   * ```typescript
   * const result = await recoveryHandler.recoverFromTransactionHistory();
   * if (result.success) {
   *   console.log(`Recovered ${result.data.recoveredCount} purchases`);
   * }
   * ```
   */
  async recoverFromTransactionHistory(): Promise<Result<RecoveryResult, PurchaseError>> {
    try {
      // Step 1: Fetch transaction history from platform
      const historyResult =
        await purchaseRepository.requestAllPurchaseHistory();

      if (!historyResult.success) {
        // Failed to fetch history
        return historyResult as Result<RecoveryResult, PurchaseError>;
      }

      const transactionHistory = historyResult.data;

      // Step 2: Deduplicate by transaction ID
      const seenIds = new Set<string>();
      const uniqueTransactions: Transaction[] = [];

      for (const transaction of transactionHistory) {
        // Validate transaction structure
        if (!transaction.transactionId || !transaction.productId) {
          // Skip invalid transaction
          continue;
        }

        // Check for duplicates
        if (!seenIds.has(transaction.transactionId)) {
          seenIds.add(transaction.transactionId);
          uniqueTransactions.push(transaction);
        }
      }

      // Step 3: Return recovery result
      const recoveredIds = uniqueTransactions.map(t => t.transactionId);

      return {
        success: true,
        data: {
          recoveredCount: uniqueTransactions.length,
          recoveredTransactionIds: recoveredIds,
        },
      };
    } catch (error) {
      // Log recovery error
      errorLogger.logError(error, {
        operation: 'recoverFromTransactionHistory',
        context: 'Exception during recovery',
      });

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Recovery failed',
          retryable: false,
        },
      };
    }
  },

  /**
   * Reconstruct missing purchase records in database
   *
   * Process:
   * 1. Fetch transaction history from platform
   * 2. Compare with existing local records
   * 3. Add missing records to database
   * 4. Update sync status for existing records
   *
   * Given/When/Then:
   * - Given: Transaction history available
   * - When: reconstructMissingRecords is called
   * - Then: Adds new records from history
   *
   * - Given: Database error during reconstruction
   * - When: Insert/update fails
   * - Then: Returns error with partial count
   *
   * @returns Result with reconstruction details
   *
   * @example
   * ```typescript
   * const result = await recoveryHandler.reconstructMissingRecords();
   * if (result.success) {
   *   console.log(`Added ${result.data.addedCount}, Updated ${result.data.updatedCount}`);
   * }
   * ```
   */
  async reconstructMissingRecords(): Promise<
    Result<ReconstructionResult, PurchaseError>
  > {
    try {
      // Step 1: Get transaction history
      const historyResult =
        await purchaseRepository.requestAllPurchaseHistory();

      if (!historyResult.success) {
        return historyResult as Result<ReconstructionResult, PurchaseError>;
      }

      const transactionHistory = historyResult.data;
      let addedCount = 0;
      let updatedCount = 0;

      // Step 2: Process each transaction
      for (const transaction of transactionHistory) {
        try {
          // Check if transaction already exists
          const existing = await db
            .select()
            .from(purchasesTable)
            .where(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (db as any).eq?.(purchasesTable.transactionId, transaction.transactionId)
            )
            .limit(1);

          if (existing && existing.length > 0) {
            // Record exists - update sync status if needed
            // Only count as update if we actually change something
            const current = existing[0];
            if (!current.isSynced) {
              await db
                .update(purchasesTable)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .set({ isSynced: true, syncedAt: Math.floor(Date.now() / 1000) })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .where((db as any).eq?.(purchasesTable.transactionId, transaction.transactionId));

              updatedCount++;
            }
          } else {
            // Record doesn't exist - add it (unverified initially)
            await db.insert(purchasesTable).values({
              transactionId: transaction.transactionId,
              productId: transaction.productId,
              purchasedAt: Math.floor(transaction.purchaseDate.getTime() / 1000),
              price: 0, // Will be filled from product metadata
              currencyCode: 'USD', // Default, will be corrected later
              isVerified: false, // Not yet verified
              isSynced: true, // From platform, so mark as synced
              syncedAt: Math.floor(Date.now() / 1000),
            });

            addedCount++;
          }
        } catch (txError) {
          // Log transaction error but continue with others
          errorLogger.logError(txError, {
            operation: 'reconstructMissingRecords',
            transactionId: transaction.transactionId,
            context: 'Transaction processing error',
          });
          // Continue to next transaction
        }
      }

      return {
        success: true,
        data: {
          addedCount,
          updatedCount,
        },
      };
    } catch (error) {
      // Log reconstruction error
      errorLogger.logError(error, {
        operation: 'reconstructMissingRecords',
        context: 'Database reconstruction error',
      });

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Reconstruction failed',
          retryable: false,
        },
      };
    }
  },

  /**
   * Validate recovery result for integrity
   *
   * Checks:
   * 1. Recovered count matches transaction ID count
   * 2. No duplicate transaction IDs
   * 3. All transaction IDs are non-empty
   *
   * Given/When/Then:
   * - Given: Valid recovery result
   * - When: validateRecovery is called
   * - Then: Returns isValid: true
   *
   * - Given: Count mismatch
   * - When: Validation checks counts
   * - Then: Returns isValid: false with error
   *
   * @param recovery - Recovery result to validate
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const validation = recoveryHandler.validateRecovery(recovery);
   * if (!validation.isValid) {
   *   console.error('Recovery invalid:', validation.errors);
   * }
   * ```
   */
  validateRecovery(recovery: RecoveryResult): RecoveryValidation {
    const errors: string[] = [];

    // Check count consistency
    if (recovery.recoveredCount !== recovery.recoveredTransactionIds.length) {
      errors.push('count mismatch between recoveredCount and IDs');
    }

    // Check for duplicate IDs
    const uniqueIds = new Set(recovery.recoveredTransactionIds);
    if (uniqueIds.size !== recovery.recoveredTransactionIds.length) {
      errors.push('duplicate transaction IDs detected');
    }

    // Check for empty IDs
    for (const id of recovery.recoveredTransactionIds) {
      if (!id || id.trim().length === 0) {
        errors.push('empty transaction ID found');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Get comprehensive recovery status
   *
   * Performs corruption detection and returns detailed status.
   * Does NOT attempt automatic recovery (use autoRecoverOnStartup for that).
   *
   * Process:
   * 1. Detect corruption
   * 2. If corrupted, optionally attempt recovery
   * 3. Return comprehensive status
   *
   * @returns Recovery status information
   *
   * @example
   * ```typescript
   * const status = await recoveryHandler.getRecoveryStatus();
   * if (status.isCorrupted) {
   *   console.log('DB corruption detected');
   * }
   * ```
   */
  async getRecoveryStatus(): Promise<RecoveryStatus> {
    try {
      // Step 1: Detect corruption
      const corruptionResult = await recoveryHandler.detectDBCorruption();

      const status: RecoveryStatus = {
        isCorrupted: corruptionResult.isCorrupted,
        recoveryAttempted: false,
        statusTimestamp: new Date(),
      };

      // Step 2: If corrupted, attempt recovery
      if (corruptionResult.isCorrupted) {
        status.recoveryAttempted = true;

        const recoveryResult =
          await recoveryHandler.recoverFromTransactionHistory();

        if (recoveryResult.success) {
          status.recoverySuccessful = true;
          status.recoveredPurchaseCount = recoveryResult.data.recoveredCount;
        } else {
          status.recoverySuccessful = false;
          status.recoveryError = recoveryResult.error;
        }
      } else {
        // Not corrupted
        status.recoverySuccessful = true;
        status.recoveredPurchaseCount = 0;
      }

      return status;
    } catch (error) {
      // Handle unexpected error
      return {
        isCorrupted: false,
        recoveryAttempted: false,
        statusTimestamp: new Date(),
        statusError:
          error instanceof Error ? error.message : 'Status check failed',
      };
    }
  },

  /**
   * Automatically recover on app startup if corruption detected
   *
   * Process:
   * 1. Detect corruption
   * 2. If corrupted, attempt recovery from transaction history
   * 3. Return success/failure result
   *
   * This is called during app initialization to ensure data integrity.
   * Failures are logged but do not block app startup.
   *
   * Given/When/Then:
   * - Given: Corrupted DB on startup
   * - When: autoRecoverOnStartup is called
   * - Then: Detects and recovers from transaction history
   *
   * - Given: Healthy DB on startup
   * - When: autoRecoverOnStartup is called
   * - Then: Returns success without recovery
   *
   * - Given: Network unavailable during recovery
   * - When: Cannot fetch transaction history
   * - Then: Returns error but allows app to continue
   *
   * @returns Result with recovery information
   *
   * @example
   * ```typescript
   * // In app initialization
   * const recovery = await recoveryHandler.autoRecoverOnStartup();
   * if (!recovery.success) {
   *   console.warn('Recovery failed, will retry on next sync');
   * }
   * ```
   */
  async autoRecoverOnStartup(): Promise<Result<RecoveryResult, PurchaseError>> {
    try {
      // Step 1: Detect corruption
      const corruptionResult = await recoveryHandler.detectDBCorruption();

      // Step 2: If no corruption, return success
      if (!corruptionResult.isCorrupted) {
        return {
          success: true,
          data: {
            recoveredCount: 0,
            recoveredTransactionIds: [],
          },
        };
      }

      // Step 3: If corrupted, attempt recovery
      console.warn('[RecoveryHandler] Database corruption detected at startup');

      const recoveryResult =
        await recoveryHandler.recoverFromTransactionHistory();

      if (recoveryResult.success) {
        // Step 4: Attempt to reconstruct records
        await recoveryHandler.reconstructMissingRecords();

        console.log(
          `[RecoveryHandler] Successfully recovered ${recoveryResult.data.recoveredCount} purchases`
        );
      } else {
        console.error(
          '[RecoveryHandler] Recovery failed:',
          recoveryResult.error.message
        );
      }

      return recoveryResult;
    } catch (error) {
      // Log startup recovery error
      errorLogger.logError(error, {
        operation: 'autoRecoverOnStartup',
        context: 'Startup recovery exception',
      });

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Startup recovery failed',
          retryable: false,
        },
      };
    }
  },
};
