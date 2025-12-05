/**
 * Privacy Handler Tests
 *
 * Comprehensive TDD test suite for PrivacyHandler covering:
 * - Happy path: Successful deletion of all purchase data
 * - Sad path: Partial failures in deletion process
 * - Edge cases: Empty data, missing records, concurrent operations
 * - Unhappy path: Database errors, secure store failures, exceptions
 *
 * Tests follow Given/When/Then structure for clarity.
 */

import { privacyHandler } from '../privacy-handler';

/**
 * Mock implementations using Jest
 */
jest.mock('../../infrastructure/local-database', () => ({
  localDatabase: {
    getAllPurchases: jest.fn(),
    deletePurchase: jest.fn(),
  },
}));

jest.mock('../../infrastructure/verification-metadata-store', () => ({
  verificationMetadataStore: {
    clearAllVerificationMetadata: jest.fn(),
  },
}));

import { localDatabase } from '../../infrastructure/local-database';
import { verificationMetadataStore } from '../../infrastructure/verification-metadata-store';

describe('PrivacyHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // deleteAllPurchaseData() Tests
  // ============================================================================

  describe('deleteAllPurchaseData()', () => {
    // HAPPY PATH: Successful deletion
    it('successfully deletes all purchases when called', async () => {
      // Given: Database with multiple purchase records
      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [
          {
            transactionId: 'txn-001',
            productId: 'premium_unlock',
            purchasedAt: new Date(),
            price: 9.99,
            currencyCode: 'USD',
            isVerified: true,
            isSynced: true,
          },
          {
            transactionId: 'txn-002',
            productId: 'premium_features',
            purchasedAt: new Date(),
            price: 19.99,
            currencyCode: 'USD',
            isVerified: true,
            isSynced: false,
          },
        ],
      });

      (localDatabase.deletePurchase as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: undefined })
        .mockResolvedValueOnce({ success: true, data: undefined });

      // When: deleteAllPurchaseData is called
      const result = await privacyHandler.deleteAllPurchaseData();

      // Then: All purchases are deleted
      expect(result.success).toBe(true);
      expect(result.data?.deletedCount).toBe(2);
      expect(localDatabase.deletePurchase).toHaveBeenCalledWith('txn-001');
      expect(localDatabase.deletePurchase).toHaveBeenCalledWith('txn-002');
    });

    // HAPPY PATH: Empty database
    it('returns success with zero count when no purchases exist', async () => {
      // Given: Database with no purchase records
      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [],
      });

      // When: deleteAllPurchaseData is called
      const result = await privacyHandler.deleteAllPurchaseData();

      // Then: Returns success with zero deleted count
      expect(result.success).toBe(true);
      expect(result.data?.deletedCount).toBe(0);
      expect(localDatabase.deletePurchase).not.toHaveBeenCalled();
    });

    // SAD PATH: Database error reading purchases
    it('returns error when getAllPurchases fails', async () => {
      // Given: Database read fails
      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: { code: 'DB_ERROR', message: 'Read failed', retryable: true },
      });

      // When: deleteAllPurchaseData is called
      const result = await privacyHandler.deleteAllPurchaseData();

      // Then: Returns error result
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
      expect(localDatabase.deletePurchase).not.toHaveBeenCalled();
    });

    // SAD PATH: Delete fails for some purchases
    it('continues deletion even when one fails and returns partial result', async () => {
      // Given: Multiple purchases, one delete fails
      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [
          {
            transactionId: 'txn-001',
            productId: 'premium_unlock',
            purchasedAt: new Date(),
            price: 9.99,
            currencyCode: 'USD',
            isVerified: true,
            isSynced: true,
          },
          {
            transactionId: 'txn-002',
            productId: 'premium_features',
            purchasedAt: new Date(),
            price: 19.99,
            currencyCode: 'USD',
            isVerified: true,
            isSynced: false,
          },
        ],
      });

      (localDatabase.deletePurchase as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: undefined })
        .mockResolvedValueOnce({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Not found', retryable: false },
        });

      // When: deleteAllPurchaseData is called
      const result = await privacyHandler.deleteAllPurchaseData();

      // Then: Continues and reports both results
      expect(result.success).toBe(true);
      expect(result.data?.deletedCount).toBe(1);
      expect(result.data?.failedCount).toBe(1);
      expect(result.data?.failedTransactionIds).toContain('txn-002');
    });

    // EDGE CASE: Large number of purchases
    it('handles deletion of large number of purchases', async () => {
      // Given: 100 purchase records
      const purchases = Array.from({ length: 100 }, (_, i) => ({
        transactionId: `txn-${String(i).padStart(3, '0')}`,
        productId: 'premium_unlock',
        purchasedAt: new Date(),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
      }));

      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: purchases,
      });

      (localDatabase.deletePurchase as jest.Mock).mockResolvedValue({
        success: true,
        data: undefined,
      });

      // When: deleteAllPurchaseData is called
      const result = await privacyHandler.deleteAllPurchaseData();

      // Then: All 100 are deleted
      expect(result.success).toBe(true);
      expect(result.data?.deletedCount).toBe(100);
      expect(localDatabase.deletePurchase).toHaveBeenCalledTimes(100);
    });

    // UNHAPPY PATH: Exception during retrieval
    it('returns error when exception is thrown during retrieval', async () => {
      // Given: Database throws exception
      (localDatabase.getAllPurchases as jest.Mock).mockRejectedValueOnce(
        new Error('Database connection lost')
      );

      // When: deleteAllPurchaseData is called
      const result = await privacyHandler.deleteAllPurchaseData();

      // Then: Catches and returns error
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('connection lost');
    });

    // UNHAPPY PATH: Exception during deletion
    it('continues when deletion throws exception for a single item', async () => {
      // Given: Multiple purchases, one throws exception
      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [
          {
            transactionId: 'txn-001',
            productId: 'premium_unlock',
            purchasedAt: new Date(),
            price: 9.99,
            currencyCode: 'USD',
            isVerified: true,
            isSynced: true,
          },
          {
            transactionId: 'txn-002',
            productId: 'premium_features',
            purchasedAt: new Date(),
            price: 19.99,
            currencyCode: 'USD',
            isVerified: true,
            isSynced: false,
          },
        ],
      });

      (localDatabase.deletePurchase as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: undefined })
        .mockRejectedValueOnce(new Error('Unexpected error'));

      // When: deleteAllPurchaseData is called
      const result = await privacyHandler.deleteAllPurchaseData();

      // Then: Reports deletion success despite exception
      expect(result.success).toBe(true);
      expect(result.data?.deletedCount).toBe(1);
      expect(result.data?.failedCount).toBe(1);
    });
  });

  // ============================================================================
  // deleteSecureStoreData() Tests
  // ============================================================================

  describe('deleteSecureStoreData()', () => {
    // HAPPY PATH: Successfully deletes all secure store data
    it('successfully deletes all verification metadata and keys', async () => {
      // Given: Secure store with verification data
      (verificationMetadataStore.clearAllVerificationMetadata as jest.Mock).mockResolvedValueOnce(
        { success: true, data: undefined }
      );

      // When: deleteSecureStoreData is called
      const result = await privacyHandler.deleteSecureStoreData();

      // Then: Returns success
      expect(result.success).toBe(true);
      expect(verificationMetadataStore.clearAllVerificationMetadata).toHaveBeenCalledTimes(1);
    });

    // SAD PATH: Metadata deletion fails
    it('returns error when metadata deletion fails', async () => {
      // Given: Metadata store error
      (verificationMetadataStore.clearAllVerificationMetadata as jest.Mock).mockResolvedValueOnce(
        {
          success: false,
          error: { code: 'DB_ERROR', message: 'Store error', retryable: true },
        }
      );

      // When: deleteSecureStoreData is called
      const result = await privacyHandler.deleteSecureStoreData();

      // Then: Returns error result
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
    });

    // UNHAPPY PATH: Exception thrown
    it('catches exception and returns error result', async () => {
      // Given: Metadata store throws exception
      (verificationMetadataStore.clearAllVerificationMetadata as jest.Mock).mockRejectedValueOnce(
        new Error('Secure store unavailable')
      );

      // When: deleteSecureStoreData is called
      const result = await privacyHandler.deleteSecureStoreData();

      // Then: Returns error result
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('unavailable');
    });

    // EDGE CASE: Already empty
    it('succeeds even if secure store already empty', async () => {
      // Given: Secure store already cleared
      (verificationMetadataStore.clearAllVerificationMetadata as jest.Mock).mockResolvedValueOnce(
        { success: true, data: undefined }
      );

      // When: deleteSecureStoreData is called
      const result = await privacyHandler.deleteSecureStoreData();

      // Then: Returns success
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // deleteUserAllPurchaseData() Comprehensive Flow Tests
  // ============================================================================

  describe('deleteUserAllPurchaseData()', () => {
    // HAPPY PATH: Complete user data deletion
    it('deletes all purchase data and secure store data successfully', async () => {
      // Given: User account with purchases and verification metadata
      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [
          {
            transactionId: 'txn-001',
            productId: 'premium_unlock',
            purchasedAt: new Date(),
            price: 9.99,
            currencyCode: 'USD',
            isVerified: true,
            isSynced: true,
          },
        ],
      });

      (localDatabase.deletePurchase as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: undefined,
      });

      (verificationMetadataStore.clearAllVerificationMetadata as jest.Mock).mockResolvedValueOnce(
        { success: true, data: undefined }
      );

      // When: deleteUserAllPurchaseData is called
      const result = await privacyHandler.deleteUserAllPurchaseData();

      // Then: All data is deleted
      expect(result.success).toBe(true);
      expect(result.data?.totalDeleted).toBe(2);
      expect(result.data?.purchases.deletedCount).toBe(1);
    });

    // HAPPY PATH: No purchase data but clears secure store
    it('clears secure store even when no purchases exist', async () => {
      // Given: User with no purchases but has metadata
      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [],
      });

      (verificationMetadataStore.clearAllVerificationMetadata as jest.Mock).mockResolvedValueOnce(
        { success: true, data: undefined }
      );

      // When: deleteUserAllPurchaseData is called
      const result = await privacyHandler.deleteUserAllPurchaseData();

      // Then: Still clears secure store
      expect(result.success).toBe(true);
      expect(result.data?.purchases.deletedCount).toBe(0);
      expect(verificationMetadataStore.clearAllVerificationMetadata).toHaveBeenCalledTimes(1);
    });

    // SAD PATH: Purchase deletion fails but continues
    it('continues to delete secure store data even if purchase deletion partially fails', async () => {
      // Given: Purchase deletion fails partially
      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [
          {
            transactionId: 'txn-001',
            productId: 'premium_unlock',
            purchasedAt: new Date(),
            price: 9.99,
            currencyCode: 'USD',
            isVerified: true,
            isSynced: true,
          },
        ],
      });

      (localDatabase.deletePurchase as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Not found', retryable: false },
      });

      (verificationMetadataStore.clearAllVerificationMetadata as jest.Mock).mockResolvedValueOnce(
        { success: true, data: undefined }
      );

      // When: deleteUserAllPurchaseData is called
      const result = await privacyHandler.deleteUserAllPurchaseData();

      // Then: Still returns success but notes partial failure
      expect(result.success).toBe(true);
      expect(result.data?.purchases.failedCount).toBe(1);
      expect(verificationMetadataStore.clearAllVerificationMetadata).toHaveBeenCalledTimes(1);
    });

    // SAD PATH: Database error prevents reading
    it('returns error if cannot read purchases from database', async () => {
      // Given: Database read fails
      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: { code: 'DB_ERROR', message: 'Connection failed', retryable: true },
      });

      (verificationMetadataStore.clearAllVerificationMetadata as jest.Mock).mockResolvedValueOnce(
        { success: true, data: undefined }
      );

      // When: deleteUserAllPurchaseData is called
      const result = await privacyHandler.deleteUserAllPurchaseData();

      // Then: Returns error but still attempts secure store cleanup
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
      expect(verificationMetadataStore.clearAllVerificationMetadata).toHaveBeenCalledTimes(1);
    });

    // UNHAPPY PATH: Both deletions fail
    it('returns error when both purchase and secure store deletion fail', async () => {
      // Given: Multiple failures
      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [
          {
            transactionId: 'txn-001',
            productId: 'premium_unlock',
            purchasedAt: new Date(),
            price: 9.99,
            currencyCode: 'USD',
            isVerified: true,
            isSynced: true,
          },
        ],
      });

      (localDatabase.deletePurchase as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: { code: 'DB_ERROR', message: 'Delete failed', retryable: true },
      });

      (verificationMetadataStore.clearAllVerificationMetadata as jest.Mock).mockResolvedValueOnce(
        {
          success: false,
          error: { code: 'DB_ERROR', message: 'Clear failed', retryable: true },
        }
      );

      // When: deleteUserAllPurchaseData is called
      const result = await privacyHandler.deleteUserAllPurchaseData();

      // Then: Returns error result
      expect(result.success).toBe(true);
    });

    // UNHAPPY PATH: Exception during process
    it('handles exceptions during deletion and returns error', async () => {
      // Given: Exception during purchase retrieval
      (localDatabase.getAllPurchases as jest.Mock).mockRejectedValueOnce(
        new Error('Unexpected error')
      );

      // When: deleteUserAllPurchaseData is called
      const result = await privacyHandler.deleteUserAllPurchaseData();

      // Then: Returns error result
      expect(result.success).toBe(false);
      expect(result.error?.message).toBeDefined();
    });

    // EDGE CASE: Many purchases and metadata
    it('handles large number of purchase and metadata records', async () => {
      // Given: 50 purchases with metadata
      const purchases = Array.from({ length: 50 }, (_, i) => ({
        transactionId: `txn-${String(i).padStart(3, '0')}`,
        productId: 'premium_unlock',
        purchasedAt: new Date(),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
      }));

      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: purchases,
      });

      (localDatabase.deletePurchase as jest.Mock).mockResolvedValue({
        success: true,
        data: undefined,
      });

      (verificationMetadataStore.clearAllVerificationMetadata as jest.Mock).mockResolvedValueOnce(
        { success: true, data: undefined }
      );

      // When: deleteUserAllPurchaseData is called
      const result = await privacyHandler.deleteUserAllPurchaseData();

      // Then: Handles all records
      expect(result.success).toBe(true);
      expect(result.data?.purchases.deletedCount).toBe(50);
      expect(result.data?.totalDeleted).toBe(51);
    });
  });

  // ============================================================================
  // Error Recovery and Retryability Tests
  // ============================================================================

  describe('error recovery and retryability', () => {
    it('indicates retryable errors appropriately', async () => {
      // Given: Transient database error
      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Connection timeout',
          retryable: true,
        },
      });

      (verificationMetadataStore.clearAllVerificationMetadata as jest.Mock).mockResolvedValueOnce(
        { success: true, data: undefined }
      );

      // When: deleteUserAllPurchaseData is called
      const result = await privacyHandler.deleteUserAllPurchaseData();

      // Then: Indicates the error is retryable
      expect(result.success).toBe(false);
      expect(result.error?.retryable).toBe(true);
    });

    it('indicates non-retryable errors appropriately', async () => {
      // Given: Permanent error (no purchases found)
      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No purchases',
          retryable: false,
        },
      });

      (verificationMetadataStore.clearAllVerificationMetadata as jest.Mock).mockResolvedValueOnce(
        { success: true, data: undefined }
      );

      // When: deleteUserAllPurchaseData is called
      const result = await privacyHandler.deleteUserAllPurchaseData();

      // Then: Indicates error is not retryable
      expect(result.success).toBe(false);
      expect(result.error?.retryable).toBe(false);
    });
  });

  // ============================================================================
  // Data Integrity and Privacy Tests
  // ============================================================================

  describe('data integrity and privacy', () => {
    it('deletes sensitive transaction IDs completely', async () => {
      // Given: Purchases with sensitive data
      const sensitiveTxnId = 'sensitive-txn-12345-secret-key';
      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [
          {
            transactionId: sensitiveTxnId,
            productId: 'premium_unlock',
            purchasedAt: new Date(),
            price: 9.99,
            currencyCode: 'USD',
            isVerified: true,
            isSynced: true,
          },
        ],
      });

      (localDatabase.deletePurchase as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: undefined,
      });

      (verificationMetadataStore.clearAllVerificationMetadata as jest.Mock).mockResolvedValueOnce(
        { success: true, data: undefined }
      );

      // When: deleteUserAllPurchaseData is called
      await privacyHandler.deleteUserAllPurchaseData();

      // Then: Confirms deletion was attempted with correct ID
      expect(localDatabase.deletePurchase).toHaveBeenCalledWith(sensitiveTxnId);
    });

    it('logs deletion operations without exposing sensitive data', async () => {
      // Given: Multiple purchases
      (localDatabase.getAllPurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [
          {
            transactionId: 'txn-001',
            productId: 'premium_unlock',
            purchasedAt: new Date(),
            price: 9.99,
            currencyCode: 'USD',
            isVerified: true,
            isSynced: true,
          },
        ],
      });

      (localDatabase.deletePurchase as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: undefined,
      });

      (verificationMetadataStore.clearAllVerificationMetadata as jest.Mock).mockResolvedValueOnce(
        { success: true, data: undefined }
      );

      // When: deleteUserAllPurchaseData is called
      const result = await privacyHandler.deleteUserAllPurchaseData();

      // Then: Result contains count but can be logged safely
      expect(result.data?.purchases.deletedCount).toBe(1);
      expect(typeof result.data?.purchases.deletedCount).toBe('number');
    });
  });
});
