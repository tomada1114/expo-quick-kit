/**
 * Verification Metadata Store Tests
 *
 * Tests for persisting and restoring verification metadata in secure store.
 * Covers verification info persistence, restoration on app startup, and error handling.
 *
 * Task 5.2: Store verified timestamp and verification metadata to secure-store,
 * and restore verification state on app startup
 */

import * as SecureStore from 'expo-secure-store';
import { VerificationMetadataStore } from '../verification-metadata-store';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('VerificationMetadataStore', () => {
  let store: VerificationMetadataStore;
  const mockTransactionId = 'txn_12345';
  const mockVerificationMetadata = {
    transactionId: 'txn_12345',
    productId: 'premium_unlock',
    verifiedAt: new Date('2024-12-04T10:00:00Z'),
    signatureKey: 'test_key_abc123',
    platform: 'ios' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    store = new VerificationMetadataStore();
  });

  describe('Happy Path: Successful Operations', () => {
    it('should save verification metadata to secure store', async () => {
      // Given: Valid verification metadata
      // When: Saving verification metadata
      const result = await store.saveVerificationMetadata(mockVerificationMetadata);

      // Then: Should succeed with no error
      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        expect.stringContaining(mockTransactionId),
        expect.any(String)
      );
    });

    it('should retrieve verification metadata from secure store', async () => {
      // Given: Verification metadata previously stored
      const storedData = JSON.stringify(mockVerificationMetadata);
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(storedData);

      // When: Retrieving verification metadata
      const result = await store.getVerificationMetadata(mockTransactionId);

      // Then: Should return the stored metadata
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockVerificationMetadata);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
        expect.stringContaining(mockTransactionId)
      );
    });

    it('should restore all verification metadata on startup', async () => {
      // Given: Multiple verification metadata entries in secure store
      const metadata1 = { ...mockVerificationMetadata, transactionId: 'txn_1' };
      const metadata2 = {
        ...mockVerificationMetadata,
        transactionId: 'txn_2',
        verifiedAt: new Date('2024-12-03T10:00:00Z'),
      };

      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(metadata1))
        .mockResolvedValueOnce(JSON.stringify(metadata2))
        .mockResolvedValueOnce(null); // No more metadata

      // When: Restoring all verification metadata
      const result = await store.restoreAllVerificationMetadata();

      // Then: Should return all restored metadata
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data).toContainEqual(metadata1);
      expect(result.data).toContainEqual(metadata2);
    });

    it('should delete verification metadata by transaction ID', async () => {
      // Given: A transaction ID with stored metadata
      // When: Deleting verification metadata
      const result = await store.deleteVerificationMetadata(mockTransactionId);

      // Then: Should succeed and remove from store
      expect(result.success).toBe(true);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        expect.stringContaining(mockTransactionId)
      );
    });

    it('should clear all verification metadata', async () => {
      // Given: Multiple verification metadata entries exist
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockVerificationMetadata))
        .mockResolvedValueOnce(null);

      // When: Clearing all verification metadata
      const result = await store.clearAllVerificationMetadata();

      // Then: Should succeed and delete all entries
      expect(result.success).toBe(true);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    });
  });

  describe('Sad Path: Expected Errors', () => {
    it('should return error when metadata not found', async () => {
      // Given: No metadata stored for transaction ID
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

      // When: Retrieving non-existent metadata
      const result = await store.getVerificationMetadata('nonexistent_txn');

      // Then: Should return NOT_FOUND error
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toContain('not found');
    });

    it('should return error when secure store read fails', async () => {
      // Given: Secure store throws an error
      const storeError = new Error('Secure store access denied');
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(storeError);

      // When: Attempting to retrieve metadata
      const result = await store.getVerificationMetadata(mockTransactionId);

      // Then: Should return STORE_ERROR with details
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STORE_ERROR');
      expect(result.error.message).toContain('Failed to retrieve');
    });

    it('should return error when secure store write fails', async () => {
      // Given: Secure store write fails
      const storeError = new Error('Permission denied');
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(storeError);

      // When: Attempting to save metadata
      const result = await store.saveVerificationMetadata(mockVerificationMetadata);

      // Then: Should return STORE_ERROR
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STORE_ERROR');
      expect(result.error.message).toContain('Failed to save');
    });

    it('should return error when deleting non-existent metadata', async () => {
      // Given: Secure store delete fails
      const storeError = new Error('Item not found');
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(storeError);

      // When: Attempting to delete metadata
      const result = await store.deleteVerificationMetadata(mockTransactionId);

      // Then: Should return STORE_ERROR
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STORE_ERROR');
      expect(result.error.message).toContain('Failed to delete');
    });
  });

  describe('Edge Cases: Boundary Values', () => {
    it('should handle empty transaction ID', async () => {
      // Given: Empty transaction ID
      // When: Attempting to save with empty ID
      const invalidMetadata = {
        ...mockVerificationMetadata,
        transactionId: '',
      };
      const result = await store.saveVerificationMetadata(invalidMetadata);

      // Then: Should return validation error
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle null verifiedAt timestamp', async () => {
      // Given: Metadata with missing verifiedAt
      const invalidMetadata = {
        ...mockVerificationMetadata,
        verifiedAt: null as any,
      };

      // When: Attempting to save
      const result = await store.saveVerificationMetadata(invalidMetadata);

      // Then: Should return validation error
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle corrupted JSON in secure store', async () => {
      // Given: Corrupted JSON stored in secure store
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
        'invalid json {{'
      );

      // When: Retrieving and parsing metadata
      const result = await store.getVerificationMetadata(mockTransactionId);

      // Then: Should return PARSE_ERROR
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PARSE_ERROR');
      expect(result.error.message).toContain('Failed to parse');
    });

    it('should handle missing required fields in stored metadata', async () => {
      // Given: Stored metadata missing required fields
      const incompleteMetadata = {
        transactionId: 'txn_123',
        // Missing productId, verifiedAt, signatureKey, platform
      };
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(incompleteMetadata)
      );

      // When: Retrieving metadata
      const result = await store.getVerificationMetadata(mockTransactionId);

      // Then: Should return validation error
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle very large metadata', async () => {
      // Given: Very large metadata string
      const largeMetadata = {
        ...mockVerificationMetadata,
        signatureKey: 'x'.repeat(10000), // Large key
      };

      // When: Saving large metadata
      const result = await store.saveVerificationMetadata(largeMetadata);

      // Then: Should handle gracefully
      expect(result.success).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('should handle concurrent access to same transaction', async () => {
      // Given: Two concurrent requests for same metadata
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(mockVerificationMetadata)
      );

      // When: Making concurrent requests
      const [result1, result2] = await Promise.all([
        store.getVerificationMetadata(mockTransactionId),
        store.getVerificationMetadata(mockTransactionId),
      ]);

      // Then: Both should succeed with same data
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data).toEqual(result2.data);
    });

    it('should handle restore when no metadata exists', async () => {
      // Given: Empty secure store (no metadata)
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

      // When: Restoring all metadata
      const result = await store.restoreAllVerificationMetadata();

      // Then: Should return empty array, not error
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('Unhappy Path: System Errors', () => {
    it('should handle secure store timeout during retrieval', async () => {
      // Given: Secure store operation times out
      const timeoutError = new Error('Timeout: operation exceeded 30s');
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(
        timeoutError
      );

      // When: Attempting to retrieve metadata
      const result = await store.getVerificationMetadata(mockTransactionId);

      // Then: Should return STORE_ERROR with timeout indication
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STORE_ERROR');
      expect(result.error.message).toContain('Failed to retrieve');
    });

    it('should handle platform-specific secure store errors', async () => {
      // Given: Platform-specific error (e.g., iOS Keychain unavailable)
      const platformError = new Error('Keychain is not available');
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(
        platformError
      );

      // When: Attempting to save
      const result = await store.saveVerificationMetadata(mockVerificationMetadata);

      // Then: Should return appropriate error
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STORE_ERROR');
    });

    it('should handle restoration with partial failures', async () => {
      // Given: Some metadata is valid, some is corrupted
      const validMetadata = { ...mockVerificationMetadata };
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(validMetadata))
        .mockResolvedValueOnce('invalid json')
        .mockResolvedValueOnce(null);

      // When: Restoring all metadata (implementation should skip corrupted)
      const result = await store.restoreAllVerificationMetadata();

      // Then: Should return valid metadata and skip corrupted entries
      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
    });
  });

  describe('Integration: Full Verification Lifecycle', () => {
    it('should handle complete save-retrieve-delete lifecycle', async () => {
      // Given: Fresh store instance
      // When: Saving metadata
      const saveResult = await store.saveVerificationMetadata(
        mockVerificationMetadata
      );
      expect(saveResult.success).toBe(true);

      // Mock stored data for retrieval
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockVerificationMetadata)
      );

      // When: Retrieving metadata
      const getResult = await store.getVerificationMetadata(mockTransactionId);
      expect(getResult.success).toBe(true);
      expect(getResult.data).toEqual(mockVerificationMetadata);

      // When: Deleting metadata
      const deleteResult = await store.deleteVerificationMetadata(
        mockTransactionId
      );
      expect(deleteResult.success).toBe(true);
    });

    it('should restore state after app restart', async () => {
      // Given: Metadata was saved before
      const metadata = mockVerificationMetadata;

      // When: App restarts and restores verification state
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(metadata)
      );
      const result = await store.restoreAllVerificationMetadata();

      // Then: Should restore all metadata correctly
      expect(result.success).toBe(true);
      expect(result.data).toContainEqual(metadata);
    });

    it('should maintain metadata integrity through multiple operations', async () => {
      // Given: Multiple metadata entries
      const metadata1 = { ...mockVerificationMetadata, transactionId: 'txn_1' };
      const metadata2 = { ...mockVerificationMetadata, transactionId: 'txn_2' };

      // When: Saving both
      await store.saveVerificationMetadata(metadata1);
      await store.saveVerificationMetadata(metadata2);

      // Mock retrieval with correct data
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(metadata1))
        .mockResolvedValueOnce(JSON.stringify(metadata2));

      // When: Retrieving both
      const result1 = await store.getVerificationMetadata('txn_1');
      const result2 = await store.getVerificationMetadata('txn_2');

      // Then: Both should be intact
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data?.transactionId).toBe('txn_1');
      expect(result2.data?.transactionId).toBe('txn_2');
    });
  });
});
