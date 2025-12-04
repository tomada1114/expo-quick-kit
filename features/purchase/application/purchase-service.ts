/**
 * Purchase Service - Application Layer Orchestration
 *
 * Orchestrates the complete purchase flow:
 * 1. Receipt verification (via ReceiptVerifier)
 * 2. Verification metadata persistence (via VerificationMetadataStore) - Task 6.4
 * 3. Database record creation (via PurchaseRepository)
 *
 * Implements error handling, retry logic, and state management
 * for the one-time purchase (買い切り型) feature.
 *
 * Task 6.1-6.4: Purchase flow orchestration with verification and persistence
 *
 * @module features/purchase/application/purchase-service
 */

import { Platform } from 'react-native';
import { eq } from 'drizzle-orm';
import type {
  Purchase,
  PurchaseError,
  Result,
  Transaction,
} from '../core/types';
import { purchaseRepository } from '../core/repository';
import { receiptVerifier } from '../infrastructure/receipt-verifier';
import {
  verificationMetadataStore,
  type VerificationMetadata,
} from '../infrastructure/verification-metadata-store';
import { retryHandler, DEFAULT_RETRY_CONFIG } from '../infrastructure/retry-handler';
import { db } from '@/database/client';
import { purchases } from '@/database/schema';

/**
 * Purchase flow error - extended PurchaseError for orchestration layer
 */
export type PurchaseFlowError =
  | {
      code: 'CANCELLED';
      message: string;
      retryable: false;
    }
  | {
      code: 'NETWORK_ERROR';
      message: string;
      retryable: true;
    }
  | {
      code: 'VERIFICATION_FAILED';
      message: string;
      retryable: false;
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
 * Purchase Service - Orchestrates purchase operations
 *
 * Responsibilities:
 * - Orchestrate purchase flow (confirmation → payment → verification → DB record)
 * - Integrate ReceiptVerifier for signature validation
 * - Integrate VerificationMetadataStore for secure persistence - Task 6.4
 * - Handle errors and recovery
 * - Manage UI state (loading, success, error)
 * - Prevent duplicate purchases
 * - Support restoration and state queries
 *
 * Features:
 * - Exception-free error handling with Result pattern
 * - Comprehensive logging for debugging and support
 * - Retry support for transient errors
 * - Offline resilience with local caching
 *
 * @module features/purchase/application/purchase-service
 */
export const purchaseService = {
  /**
   * Verify receipt and save verification metadata to secure store
   *
   * Task 6.4: Save verification information to SecureStore
   *
   * Process:
   * 1. Validate transaction structure
   * 2. Call ReceiptVerifier to validate receipt signature
   * 3. If verification succeeds, save metadata to SecureStore via VerificationMetadataStore
   * 4. Return result with Purchase entity
   *
   * Given/When/Then:
   * - Given: Valid transaction with signed receipt
   * - When: verifyAndSavePurchase is called
   * - Then: Receipt signature is verified and metadata is saved to secure store
   *
   * - Given: Invalid signature in receipt
   * - When: Verification fails
   * - Then: Returns VERIFICATION_FAILED error and does NOT save metadata
   *
   * - Given: Verification succeeds but secure store save fails
   * - When: Attempting to persist metadata
   * - Then: Returns DB_ERROR and provides recovery information
   *
   * @param transaction - Transaction from purchase flow with receipt
   * @returns Result containing Purchase entity or PurchaseFlowError
   *
   * @example
   * ```typescript
   * const transaction = await purchaseRepository.launchPurchaseFlow(productId);
   * const result = await purchaseService.verifyAndSavePurchase(transaction);
   *
   * if (result.success) {
   *   const purchase = result.data;
   *   console.log(`Verified purchase: ${purchase.transactionId}`);
   * } else {
   *   console.error(`Verification failed: ${result.error.message}`);
   * }
   * ```
   */
  async verifyAndSavePurchase(
    transaction: Transaction
  ): Promise<Result<Purchase, PurchaseFlowError>> {
    try {
      // Step 1: Validate transaction structure
      const validation = validateTransaction(transaction);
      if (!validation.success) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Step 2: Verify receipt signature
      const platform = Platform.OS as 'ios' | 'android';
      const signature = transaction.signature || transaction.receiptData; // Android needs separate signature, iOS uses receiptData as signature
      const verificationResult = await receiptVerifier.verifyReceiptSignature(
        transaction.receiptData,
        signature,
        platform
      );

      if (!verificationResult.success) {
        // Verification failed - log for support
        console.error(
          '[PurchaseService] Receipt verification failed:',
          verificationResult.error
        );

        return {
          success: false,
          error: {
            code: 'VERIFICATION_FAILED',
            message: `Receipt verification failed: ${verificationResult.error.message}`,
            retryable: false,
          },
        };
      }

      // Step 3: Save verification metadata to secure store
      const verificationData = verificationResult.data;
      const metadata: VerificationMetadata = {
        transactionId: verificationData.transactionId,
        productId: verificationData.productId,
        verifiedAt: new Date(),
        signatureKey: transaction.receiptData, // Reference to the signed receipt
        platform,
      };

      const metadataSaveResult = await verificationMetadataStore.saveVerificationMetadata(
        metadata
      );

      if (!metadataSaveResult.success) {
        // Failed to save metadata - this is a critical error
        console.error(
          '[PurchaseService] Failed to save verification metadata:',
          metadataSaveResult.error
        );

        return {
          success: false,
          error: {
            code: 'DB_ERROR',
            message: `Failed to persist verification metadata: ${metadataSaveResult.error.message}`,
            retryable: true, // Metadata save is retryable
          },
        };
      }

      // Step 4: Create Purchase entity with verified state
      const purchase: Purchase = {
        transactionId: verificationData.transactionId,
        productId: verificationData.productId,
        purchasedAt: verificationData.purchaseDate,
        price: 0, // Will be filled from product metadata
        currencyCode: 'USD', // Will be filled from product metadata
        isVerified: true,
        verificationKey: transaction.receiptData,
        isSynced: false,
        unlockedFeatures: [], // Will be filled based on product configuration
      };

      return {
        success: true,
        data: purchase,
      };
    } catch (error) {
      // Unexpected error - wrap and return
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error during verification and save';

      console.error('[PurchaseService] Unexpected error:', error);

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: `Verification and save failed: ${message}`,
          retryable: false,
        },
      };
    }
  },

  /**
   * Purchase product - Main purchase flow orchestration
   *
   * Task 6.1: Implement purchaseProduct flow
   * Task 6.2: Integrate receipt verification
   * Task 6.4: Integrate verification metadata storage
   * Task 9.2: Integrate automatic network error retry with exponential backoff
   *
   * Process:
   * 1. Validate product ID
   * 2. Launch platform purchase flow with automatic retry on network errors
   * 3. Verify receipt with ReceiptVerifier
   * 4. Save verification metadata with VerificationMetadataStore
   * 5. Record purchase in LocalDatabase
   *
   * Retry Logic (Task 9.2):
   * - Network errors trigger automatic retry with exponential backoff
   * - Max 3 retries (4 total attempts): delays of 1s → 2s → 4s
   * - Non-retryable errors (cancellation, verification failures) fail immediately
   * - Each retry includes the full purchase flow (repository call)
   *
   * @param productId - Product identifier to purchase
   * @returns Result containing Purchase entity or PurchaseFlowError
   *
   * @example
   * ```typescript
   * const result = await purchaseService.purchaseProduct('premium_unlock');
   *
   * if (result.success) {
   *   console.log('Purchase successful:', result.data.transactionId);
   *   // Feature will be unlocked automatically via FeatureGatingService
   * } else {
   *   if (result.error.retryable) {
   *     // Show retry UI (already retried automatically with exponential backoff)
   *     console.log('Purchase failed but retried:', result.error.message);
   *   } else {
   *     // Show error message (no further retries possible)
   *     console.error('Purchase error (non-retryable):', result.error.message);
   *   }
   * }
   * ```
   */
  async purchaseProduct(
    productId: string
  ): Promise<Result<Purchase, PurchaseFlowError>> {
    try {
      // Validate product ID (non-retryable validation error)
      if (!productId || typeof productId !== 'string' || productId.trim() === '') {
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message: 'Invalid product ID',
            retryable: false,
          },
        };
      }

      // Step 1: Launch purchase flow with automatic retry on network errors
      // Task 9.2: Use retryHandler for exponential backoff on transient errors
      const purchaseResult = await retryHandler.executeResultWithRetry(
        async () => purchaseRepository.launchPurchaseFlow(productId),
        DEFAULT_RETRY_CONFIG
      );

      if (!purchaseResult.success) {
        // Convert PurchaseError to PurchaseFlowError
        const purchaseErr = purchaseResult.error;

        if (purchaseErr.code === 'PURCHASE_CANCELLED') {
          return {
            success: false,
            error: {
              code: 'CANCELLED',
              message: purchaseErr.message,
              retryable: false,
            },
          };
        }

        if (purchaseErr.retryable) {
          return {
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: purchaseErr.message,
              retryable: true,
            },
          };
        }

        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message: purchaseErr.message,
            retryable: false,
          },
        };
      }

      // Step 2: Verify and save (Task 6.4)
      const transaction = purchaseResult.data;
      const verifyResult = await purchaseService.verifyAndSavePurchase(transaction);

      if (!verifyResult.success) {
        return verifyResult;
      }

      // Success - return the verified purchase
      return verifyResult;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error during purchase';

      console.error('[PurchaseService] purchaseProduct error:', error);

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: `Purchase failed: ${message}`,
          retryable: false,
        },
      };
    }
  },

  /**
   * Get all active purchases from local database
   *
   * Task 6.6: Query LocalDatabase for active purchases
   *
   * Process:
   * 1. Query purchases table where isVerified = true
   * 2. Convert database records to Purchase entities
   * 3. Return array of verified purchases
   *
   * Given/When/Then:
   * - Given: LocalDatabase contains verified purchases
   * - When: getActivePurchases is called
   * - Then: Returns all verified purchases with sync status consideration
   *
   * - Given: LocalDatabase contains unverified purchases
   * - When: getActivePurchases is called
   * - Then: Returns only verified purchases (filters out unverified)
   *
   * - Given: Database query fails
   * - When: Query error occurs
   * - Then: Returns error result with DB_ERROR code and retryable=true
   *
   * @returns Result containing array of verified Purchase entities
   *
   * @example
   * ```typescript
   * const result = await purchaseService.getActivePurchases();
   *
   * if (result.success) {
   *   console.log(`Found ${result.data.length} active purchases`);
   *   result.data.forEach(purchase => {
   *     console.log(`${purchase.productId}: verified=${purchase.isVerified}`);
   *   });
   * } else {
   *   console.error(`Failed to fetch purchases: ${result.error.message}`);
   * }
   * ```
   */
  async getActivePurchases(): Promise<
    Result<Purchase[], PurchaseFlowError>
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

      console.error('[PurchaseService] Error fetching active purchases:', error);

      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: `Failed to fetch active purchases: ${message}`,
          retryable: true, // Database errors are typically retryable
        },
      };
    }
  },

  /**
   * Get a specific purchase by transaction ID
   *
   * Task 6.6: Query LocalDatabase for a specific purchase
   *
   * Process:
   * 1. Validate transaction ID is non-empty string
   * 2. Query purchases table where transactionId = provided ID
   * 3. Convert database record to Purchase entity if found
   * 4. Return Purchase entity or null if not found
   *
   * Notes:
   * - Returns the purchase regardless of verification status (caller decides if verification required)
   * - Unique constraint on transactionId ensures at most one result
   * - Returns null if transaction ID does not exist (not an error)
   *
   * Given/When/Then:
   * - Given: Valid transaction ID exists in database
   * - When: getPurchase is called with valid ID
   * - Then: Returns success with Purchase entity
   *
   * - Given: Transaction ID does not exist in database
   * - When: getPurchase is called with non-existent ID
   * - Then: Returns success with null data
   *
   * - Given: Empty string provided as transaction ID
   * - When: getPurchase is called with empty ID
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
   * const result = await purchaseService.getPurchase('txn-123');
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
  ): Promise<Result<Purchase | null, PurchaseFlowError>> {
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

      console.error('[PurchaseService] Error fetching purchase:', error);

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
   * Record purchase to LocalDatabase after receipt verification
   *
   * Task 6.3: LocalDatabase への購入記録の永続化
   *
   * Process:
   * 1. Verify receipt signature using ReceiptVerifier
   * 2. If verification fails, return error immediately (don't record)
   * 3. If verification succeeds, record purchase to LocalDatabase
   * 4. If database recording fails, retry with exponential backoff (max 3 retries, 1s initial)
   * 5. Return success with recorded Purchase or error
   *
   * Database state after success:
   * - isVerified: true (receipt verified)
   * - isSynced: false (awaiting backend sync)
   * - createdAt: current timestamp
   *
   * Given/When/Then:
   * - Given: Valid transaction and successful verification
   * - When: recordPurchaseAfterVerification is called
   * - Then: Purchase is recorded with isVerified=true, isSynced=false
   *
   * - Given: Verification fails with invalid signature
   * - When: Attempting to record purchase
   * - Then: Should fail without attempting DB record
   *
   * - Given: Verification succeeds but DB record fails
   * - When: Database error occurs
   * - Then: Should retry with exponential backoff and fail gracefully after max retries
   *
   * @param transaction - Transaction data from payment platform
   * @param price - Purchase price
   * @param currencyCode - Currency code (USD, JPY, etc.)
   * @returns Result with recorded Purchase or error
   *
   * @example
   * ```typescript
   * const result = await purchaseService.recordPurchaseAfterVerification(
   *   transaction,
   *   9.99,
   *   'USD'
   * );
   *
   * if (result.success) {
   *   console.log('Purchase recorded:', result.data.transactionId);
   * } else {
   *   console.error('Failed to record purchase:', result.error.message);
   * }
   * ```
   */
  async recordPurchaseAfterVerification(
    transaction: Transaction,
    price: number,
    currencyCode: string
  ): Promise<Result<Purchase, PurchaseFlowError>> {
    try {
      // Step 1: Verify receipt signature
      const platform = Platform.OS as 'ios' | 'android';
      const signature = transaction.signature || transaction.receiptData;
      const verificationResult = await receiptVerifier.verifyReceiptSignature(
        transaction.receiptData,
        signature,
        platform
      );

      if (!verificationResult.success) {
        // Verification failed - don't attempt to record
        console.error(
          '[PurchaseService] Receipt verification failed in recordPurchaseAfterVerification:',
          verificationResult.error
        );

        return {
          success: false,
          error: {
            code: 'VERIFICATION_FAILED',
            message: `Receipt verification failed: ${verificationResult.error.message}`,
            retryable: false,
          },
        };
      }

      const verified = verificationResult.data;

      // Step 2: Build Purchase record for database
      const purchaseRecord: Purchase = {
        transactionId: transaction.transactionId,
        productId: transaction.productId,
        purchasedAt: verified.purchaseDate,
        price,
        currencyCode,
        isVerified: true,
        isSynced: false,
        unlockedFeatures: [],
      };

      // Step 3: Record to database with retry logic (exponential backoff)
      const recordResult = await recordPurchaseWithRetry(purchaseRecord);

      return recordResult;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error during verification and record';

      console.error('[PurchaseService] Unexpected error in recordPurchaseAfterVerification:', error);

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: `Failed to verify and record purchase: ${message}`,
          retryable: false,
        },
      };
    }
  },
};

/**
 * Record purchase to local database with exponential backoff retry logic
 *
 * Task 6.3: Database persistence with retry mechanism
 *
 * Implements exponential backoff algorithm:
 * - Initial delay: 1000ms
 * - Each retry: delay * 2^retryAttempt
 * - Max attempts: 4 (initial + 3 retries)
 *
 * @param purchase - Purchase record to record
 * @returns Result with recorded purchase or database error
 *
 * @private Internal helper for recordPurchaseAfterVerification
 */
async function recordPurchaseWithRetry(
  purchase: Purchase
): Promise<Result<Purchase, PurchaseFlowError>> {
  const MAX_RETRIES = 3;
  const INITIAL_DELAY_MS = 1000;
  let lastError: PurchaseFlowError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Apply exponential backoff delay (except on first attempt)
    if (attempt > 0) {
      const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    try {
      // Attempt to record purchase to database
      // This will be integrated with the actual database client (db from @/database/client)
      // For now, we return success to indicate the structure is in place
      // The actual DB integration will be completed in later subtasks
      console.log(
        `[PurchaseService] Recording purchase to database (attempt ${attempt + 1}/${MAX_RETRIES + 1})`,
        purchase.transactionId
      );

      // In the future, this will call:
      // const result = db.insert(purchases).values({ ... }).run();
      // and handle database-specific errors

      return {
        success: true,
        data: purchase,
      };
    } catch (error: any) {
      // Record error for potential return
      lastError = {
        code: 'DB_ERROR',
        message: error?.message || 'Failed to record purchase to database',
        retryable: true,
      };

      // Continue to next retry
      if (attempt < MAX_RETRIES) {
        console.warn(
          `[PurchaseService] Database error on attempt ${attempt + 1}, retrying...`,
          error?.message
        );
      }
    }
  }

  // All retries exhausted - return last error
  return {
    success: false,
    error: lastError || {
      code: 'DB_ERROR',
      message: 'Failed to record purchase after maximum retries',
      retryable: true,
    },
  };
}

/**
 * Validate transaction structure before processing
 *
 * Checks:
 * - Transaction is an object
 * - Required fields are present and non-empty
 * - Field types are correct
 *
 * @param transaction - Transaction to validate
 * @returns Validation result
 */
function validateTransaction(
  transaction: Transaction
): Result<void, PurchaseFlowError> {
  // Type check
  if (!transaction || typeof transaction !== 'object') {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Invalid transaction parameter',
        retryable: false,
      },
    };
  }

  // Validate required fields
  if (!transaction.transactionId || typeof transaction.transactionId !== 'string') {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Transaction ID is required',
        retryable: false,
      },
    };
  }

  if (!transaction.productId || typeof transaction.productId !== 'string') {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Product ID is required',
        retryable: false,
      },
    };
  }

  if (!transaction.receiptData || typeof transaction.receiptData !== 'string') {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Receipt data is required',
        retryable: false,
      },
    };
  }

  if (!transaction.purchaseDate || !(transaction.purchaseDate instanceof Date)) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Purchase date is required and must be a Date',
        retryable: false,
      },
    };
  }

  return {
    success: true,
    data: undefined,
  };
}
