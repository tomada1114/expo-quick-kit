/**
 * Verification State Initializer Tests
 *
 * Tests for verification state initialization on app startup.
 * Covers loading verification metadata, cache management, and restoration.
 *
 * Task 5.2: Restore verification state on app startup
 */

import { VerificationStateInitializer } from '../verification-state-initializer';
import { VerificationMetadataStore } from '../verification-metadata-store';

// Mock the metadata store
jest.mock(
  '../verification-metadata-store',
  () => ({
    VerificationMetadataStore: jest.fn().mockImplementation(() => ({
      restoreAllVerificationMetadata: jest.fn(),
      saveVerificationMetadata: jest.fn(),
      deleteVerificationMetadata: jest.fn(),
      clearAllVerificationMetadata: jest.fn(),
    })),
    verificationMetadataStore: {},
  })
);

describe('VerificationStateInitializer', () => {
  let initializer: VerificationStateInitializer;
  let mockStore: any;

  const mockMetadata = {
    transactionId: 'txn_123',
    productId: 'premium',
    verifiedAt: new Date('2024-12-04T10:00:00Z'),
    signatureKey: 'key_abc',
    platform: 'ios' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    initializer = new VerificationStateInitializer();
    mockStore = (VerificationMetadataStore as jest.Mock).mock.results[0]?.value;
  });

  describe('Happy Path: Successful Operations', () => {
    it('should initialize verification state from secure store', async () => {
      // Given: Verification metadata in secure store
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [mockMetadata],
      });

      // When: Initializing verification state
      const result = await initializer.initializeVerificationState();

      // Then: Should load metadata into cache
      expect(result.success).toBe(true);
      expect(initializer.isInitialized()).toBe(true);
      expect(
        initializer.getVerificationMetadata('txn_123')
      ).toEqual(mockMetadata);
    });

    it('should mark initialization complete after successful load', async () => {
      // Given: Empty secure store
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      // When: Initializing
      await initializer.initializeVerificationState();

      // Then: Should be marked as initialized
      expect(initializer.isInitialized()).toBe(true);
      expect(initializer.getInitializedAt()).not.toBeNull();
    });

    it('should add verification metadata to cache and store', async () => {
      // Given: Initializer is initialized
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [],
      });
      await initializer.initializeVerificationState();

      // When: Adding verification metadata
      mockStore.saveVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: undefined,
      });
      const result = await initializer.addVerificationMetadata(mockMetadata);

      // Then: Should save and update cache
      expect(result.success).toBe(true);
      expect(initializer.getVerificationMetadata('txn_123')).toEqual(
        mockMetadata
      );
      expect(mockStore.saveVerificationMetadata).toHaveBeenCalledWith(
        mockMetadata
      );
    });

    it('should check if transaction is verified', async () => {
      // Given: Verification metadata in cache
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [mockMetadata],
      });
      await initializer.initializeVerificationState();

      // When: Checking if transaction is verified
      const isVerified = initializer.isTransactionVerified('txn_123');

      // Then: Should return true
      expect(isVerified).toBe(true);
    });

    it('should return false for unverified transaction', async () => {
      // Given: Initialized with different transaction
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [],
      });
      await initializer.initializeVerificationState();

      // When: Checking for non-existent transaction
      const isVerified = initializer.isTransactionVerified('unknown_txn');

      // Then: Should return false
      expect(isVerified).toBe(false);
    });

    it('should remove verification metadata', async () => {
      // Given: Metadata in cache
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [mockMetadata],
      });
      await initializer.initializeVerificationState();

      // When: Removing metadata
      mockStore.deleteVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: undefined,
      });
      const result = await initializer.removeVerificationMetadata('txn_123');

      // Then: Should remove from cache and store
      expect(result.success).toBe(true);
      expect(initializer.getVerificationMetadata('txn_123')).toBeNull();
      expect(mockStore.deleteVerificationMetadata).toHaveBeenCalledWith(
        'txn_123'
      );
    });

    it('should get all verification metadata', async () => {
      // Given: Multiple metadata in cache
      const metadata1 = { ...mockMetadata, transactionId: 'txn_1' };
      const metadata2 = {
        ...mockMetadata,
        transactionId: 'txn_2',
        verifiedAt: new Date('2024-12-03T10:00:00Z'),
      };

      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [metadata1, metadata2],
      });
      await initializer.initializeVerificationState();

      // When: Getting all metadata
      const allMetadata = initializer.getAllVerificationMetadata();

      // Then: Should return all entries
      expect(allMetadata).toHaveLength(2);
      expect(allMetadata).toContainEqual(metadata1);
      expect(allMetadata).toContainEqual(metadata2);
    });

    it('should return verified transaction count', async () => {
      // Given: Multiple verified transactions
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [
          mockMetadata,
          { ...mockMetadata, transactionId: 'txn_2' },
          { ...mockMetadata, transactionId: 'txn_3' },
        ],
      });
      await initializer.initializeVerificationState();

      // When: Getting count
      const count = initializer.getVerifiedTransactionCount();

      // Then: Should return correct count
      expect(count).toBe(3);
    });

    it('should refresh verification state from secure store', async () => {
      // Given: Initial state with one transaction
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [mockMetadata],
      });
      await initializer.initializeVerificationState();

      // When: Refreshing state with new data
      const newMetadata = {
        ...mockMetadata,
        transactionId: 'txn_new',
      };
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [newMetadata],
      });
      const result = await initializer.refreshVerificationState();

      // Then: Should reload fresh data
      expect(result.success).toBe(true);
      expect(initializer.getVerificationMetadata('txn_123')).toBeNull();
      expect(
        initializer.getVerificationMetadata('txn_new')
      ).toEqual(newMetadata);
    });

    it('should clear all verification state', async () => {
      // Given: Cache with metadata
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [mockMetadata],
      });
      await initializer.initializeVerificationState();

      // When: Clearing all state
      mockStore.clearAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: undefined,
      });
      const result = await initializer.clearAllVerificationState();

      // Then: Should clear cache and store
      expect(result.success).toBe(true);
      expect(initializer.isInitialized()).toBe(false);
      expect(initializer.getVerifiedTransactionCount()).toBe(0);
      expect(mockStore.clearAllVerificationMetadata).toHaveBeenCalled();
    });
  });

  describe('Sad Path: Expected Errors', () => {
    it('should return error when restoration fails', async () => {
      // Given: Restoration fails
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: false,
        error: { code: 'STORE_ERROR', message: 'Access denied' },
      });

      // When: Attempting initialization
      const result = await initializer.initializeVerificationState();

      // Then: Should return RESTORATION_FAILED error
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('RESTORATION_FAILED');
    });

    it('should handle store error when adding metadata', async () => {
      // Given: Initialization succeeded
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [],
      });
      await initializer.initializeVerificationState();

      // When: Adding metadata fails
      mockStore.saveVerificationMetadata.mockResolvedValueOnce({
        success: false,
        error: { code: 'STORE_ERROR', message: 'Write failed' },
      });
      const result = await initializer.addVerificationMetadata(mockMetadata);

      // Then: Should return STORE_ERROR
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STORE_ERROR');
    });

    it('should return error when deletion fails', async () => {
      // Given: Metadata in cache
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [mockMetadata],
      });
      await initializer.initializeVerificationState();

      // When: Deletion fails
      mockStore.deleteVerificationMetadata.mockResolvedValueOnce({
        success: false,
        error: { code: 'STORE_ERROR', message: 'Delete failed' },
      });
      const result = await initializer.removeVerificationMetadata('txn_123');

      // Then: Should return error
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STORE_ERROR');
    });

    it('should return error when refresh fails', async () => {
      // Given: Initialized with metadata
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [mockMetadata],
      });
      await initializer.initializeVerificationState();

      // When: Refresh fails
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: false,
        error: { code: 'STORE_ERROR', message: 'Refresh failed' },
      });
      const result = await initializer.refreshVerificationState();

      // Then: Should return RESTORATION_FAILED error
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('RESTORATION_FAILED');
    });

    it('should return error when clear fails', async () => {
      // Given: Metadata exists
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [mockMetadata],
      });
      await initializer.initializeVerificationState();

      // When: Clear fails
      mockStore.clearAllVerificationMetadata.mockResolvedValueOnce({
        success: false,
        error: { code: 'STORE_ERROR', message: 'Clear failed' },
      });
      const result = await initializer.clearAllVerificationState();

      // Then: Should return error
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STORE_ERROR');
    });
  });

  describe('Edge Cases: Boundary Values', () => {
    it('should handle empty verification cache on first initialization', async () => {
      // Given: No previous metadata
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      // When: Initializing
      const result = await initializer.initializeVerificationState();

      // Then: Should succeed with empty cache
      expect(result.success).toBe(true);
      expect(initializer.getVerifiedTransactionCount()).toBe(0);
      expect(initializer.getAllVerificationMetadata()).toEqual([]);
    });

    it('should handle checking uninitialized state', async () => {
      // Given: Initializer not yet initialized
      // When: Checking if transaction verified
      const isVerified = initializer.isTransactionVerified('txn_123');

      // Then: Should return false (cache not loaded)
      expect(isVerified).toBe(false);
    });

    it('should handle getting metadata before initialization', async () => {
      // Given: Initializer not yet initialized
      // When: Getting metadata
      const metadata = initializer.getVerificationMetadata('txn_123');

      // Then: Should return null
      expect(metadata).toBeNull();
    });

    it('should handle large number of transactions', async () => {
      // Given: 1000 verified transactions
      const metadataArray = Array.from({ length: 1000 }, (_, i) => ({
        ...mockMetadata,
        transactionId: `txn_${i}`,
      }));

      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: metadataArray,
      });

      // When: Initializing with many transactions
      const result = await initializer.initializeVerificationState();

      // Then: Should handle gracefully
      expect(result.success).toBe(true);
      expect(initializer.getVerifiedTransactionCount()).toBe(1000);
      expect(initializer.getVerificationMetadata('txn_999')).not.toBeNull();
    });

    it('should handle concurrent add operations', async () => {
      // Given: Initialized cache
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [],
      });
      await initializer.initializeVerificationState();

      mockStore.saveVerificationMetadata.mockResolvedValue({
        success: true,
        data: undefined,
      });

      // When: Adding multiple metadata concurrently
      const results = await Promise.all([
        initializer.addVerificationMetadata({
          ...mockMetadata,
          transactionId: 'txn_1',
        }),
        initializer.addVerificationMetadata({
          ...mockMetadata,
          transactionId: 'txn_2',
        }),
        initializer.addVerificationMetadata({
          ...mockMetadata,
          transactionId: 'txn_3',
        }),
      ]);

      // Then: All should succeed
      expect(results.every((r) => r.success)).toBe(true);
      expect(initializer.getVerifiedTransactionCount()).toBe(3);
    });

    it('should preserve initialization timestamp', async () => {
      // Given: Fresh initializer
      // When: Initializing
      const beforeInit = Date.now();
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [],
      });
      await initializer.initializeVerificationState();
      const afterInit = Date.now();

      // Then: Should have recent timestamp
      const initTime = initializer.getInitializedAt()?.getTime();
      expect(initTime).toBeGreaterThanOrEqual(beforeInit);
      expect(initTime).toBeLessThanOrEqual(afterInit);
    });
  });

  describe('Unhappy Path: System Errors', () => {
    it('should handle exception during initialization', async () => {
      // Given: Store throws unexpected error
      mockStore.restoreAllVerificationMetadata.mockRejectedValueOnce(
        new Error('Unexpected error')
      );

      // When: Attempting initialization
      const result = await initializer.initializeVerificationState();

      // Then: Should handle gracefully
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle exception when adding metadata', async () => {
      // Given: Initialized
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [],
      });
      await initializer.initializeVerificationState();

      // When: Unexpected error during add
      mockStore.saveVerificationMetadata.mockRejectedValueOnce(
        new Error('Unexpected error')
      );
      const result = await initializer.addVerificationMetadata(mockMetadata);

      // Then: Should handle gracefully
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
    });

    it('should still update cache if store write fails', async () => {
      // Given: Initialized
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [],
      });
      await initializer.initializeVerificationState();

      // When: Adding metadata with store failure
      mockStore.saveVerificationMetadata.mockResolvedValueOnce({
        success: false,
        error: { code: 'STORE_ERROR', message: 'Failed' },
      });
      const result = await initializer.addVerificationMetadata(mockMetadata);

      // Then: Cache should still be updated (offline-first)
      expect(result.success).toBe(false);
      expect(initializer.getVerificationMetadata('txn_123')).toEqual(
        mockMetadata
      );
    });
  });

  describe('Integration: App Startup Lifecycle', () => {
    it('should handle complete app startup with verification restore', async () => {
      // Given: App is starting with previous verification data
      const metadata1 = { ...mockMetadata, transactionId: 'txn_1' };
      const metadata2 = { ...mockMetadata, transactionId: 'txn_2' };

      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [metadata1, metadata2],
      });

      // When: App initializes verification state
      const result = await initializer.initializeVerificationState();

      // Then: Verification state is ready for use
      expect(result.success).toBe(true);
      expect(initializer.isInitialized()).toBe(true);
      expect(initializer.isTransactionVerified('txn_1')).toBe(true);
      expect(initializer.isTransactionVerified('txn_2')).toBe(true);
      expect(initializer.getVerifiedTransactionCount()).toBe(2);
    });

    it('should support adding new verification after app startup', async () => {
      // Given: App has started and loaded previous verifications
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [mockMetadata],
      });
      await initializer.initializeVerificationState();

      // When: User completes new purchase and verification
      const newMetadata = {
        ...mockMetadata,
        transactionId: 'txn_new',
      };
      mockStore.saveVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: undefined,
      });
      const addResult = await initializer.addVerificationMetadata(newMetadata);

      // Then: New verification is added to cache and store
      expect(addResult.success).toBe(true);
      expect(initializer.getVerifiedTransactionCount()).toBe(2);
      expect(initializer.isTransactionVerified('txn_new')).toBe(true);
    });

    it('should support offline access after initialization', async () => {
      // Given: App has initialized with cached verification data
      mockStore.restoreAllVerificationMetadata.mockResolvedValueOnce({
        success: true,
        data: [mockMetadata],
      });
      await initializer.initializeVerificationState();

      // When: User goes offline and checks if purchase is verified
      // (no secure store access in offline mode)
      const isVerified = initializer.isTransactionVerified('txn_123');

      // Then: Should return true from cache (no network needed)
      expect(isVerified).toBe(true);
      expect(initializer.getVerificationMetadata('txn_123')).toEqual(
        mockMetadata
      );
    });
  });
});
