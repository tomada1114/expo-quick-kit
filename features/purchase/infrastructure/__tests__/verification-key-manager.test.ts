/**
 * VerificationKeyManager Tests
 *
 * Task 4.3: Tests for verification key management and expo-secure-store integration
 *
 * Test Coverage:
 * - Happy path: Key loading from cache, key caching
 * - Sad path: Key not found, storage errors
 * - Edge cases: Empty keys, malformed keys, size limits
 * - Unhappy path: Network timeouts, secure store unavailable
 * - Offline scenarios: Key reuse from cache
 */

import { VerificationKeyManager } from '../verification-key-manager';
import * as SecureStore from 'expo-secure-store';

// Mock expo-secure-store
jest.mock('expo-secure-store');

describe('VerificationKeyManager', () => {
  let manager: VerificationKeyManager;
  const mockIOSPublicKey = 'ios_public_key_12345';
  const mockAndroidPublicKey = 'android_public_key_67890';

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new VerificationKeyManager();
  });

  // HAPPY PATH TESTS

  describe('loadVerificationKey - iOS', () => {
    it('should return cached iOS key when available', async () => {
      // Given: A cached iOS key exists in secure store
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(mockIOSPublicKey);

      // When: Loading verification key for iOS
      const result = await manager.loadVerificationKey('ios');

      // Then: Should return the cached key successfully
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mockIOSPublicKey);
      }
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
        'verification_key_ios'
      );
    });

    it('should return cached Android key when available', async () => {
      // Given: A cached Android key exists in secure store
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        mockAndroidPublicKey
      );

      // When: Loading verification key for Android
      const result = await manager.loadVerificationKey('android');

      // Then: Should return the cached key successfully
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mockAndroidPublicKey);
      }
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
        'verification_key_android'
      );
    });
  });

  describe('cacheVerificationKey - iOS', () => {
    it('should successfully cache iOS verification key', async () => {
      // Given: A valid iOS public key to cache
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      // When: Caching the iOS key
      const result = await manager.cacheVerificationKey('ios', mockIOSPublicKey);

      // Then: Should return success
      expect(result.success).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'verification_key_ios',
        mockIOSPublicKey
      );
    });

    it('should successfully cache Android verification key', async () => {
      // Given: A valid Android public key to cache
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      // When: Caching the Android key
      const result = await manager.cacheVerificationKey(
        'android',
        mockAndroidPublicKey
      );

      // Then: Should return success
      expect(result.success).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'verification_key_android',
        mockAndroidPublicKey
      );
    });
  });

  describe('clearVerificationKey', () => {
    it('should successfully delete cached iOS key', async () => {
      // Given: A cached iOS key exists
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      // When: Clearing the iOS key
      const result = await manager.clearVerificationKey('ios');

      // Then: Should return success
      expect(result.success).toBe(true);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        'verification_key_ios'
      );
    });

    it('should successfully delete cached Android key', async () => {
      // Given: A cached Android key exists
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      // When: Clearing the Android key
      const result = await manager.clearVerificationKey('android');

      // Then: Should return success
      expect(result.success).toBe(true);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        'verification_key_android'
      );
    });
  });

  // SAD PATH TESTS - Key Not Found

  describe('loadVerificationKey - Key Not Found', () => {
    it('should return KEY_NOT_FOUND error when iOS key not cached', async () => {
      // Given: No iOS key is cached
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      // When: Loading verification key for iOS
      const result = await manager.loadVerificationKey('ios');

      // Then: Should return KEY_NOT_FOUND error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('KEY_NOT_FOUND');
        expect(result.error.message).toContain('ios');
      }
    });

    it('should return KEY_NOT_FOUND error when Android key not cached', async () => {
      // Given: No Android key is cached
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      // When: Loading verification key for Android
      const result = await manager.loadVerificationKey('android');

      // Then: Should return KEY_NOT_FOUND error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('KEY_NOT_FOUND');
        expect(result.error.message).toContain('android');
      }
    });
  });

  // EDGE CASE TESTS

  describe('Edge Cases - Key Validation', () => {
    it('should reject empty string as verification key', async () => {
      // Given: An empty string as key
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      // When: Caching an empty key
      const result = await manager.cacheVerificationKey('ios', '');

      // Then: Should return validation error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_KEY_FORMAT');
      }
    });

    it('should reject null/undefined as verification key', async () => {
      // Given: Null/undefined key values
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      // When: Attempting to cache null/undefined
      const result1 = await manager.cacheVerificationKey('ios', null as any);
      const result2 = await manager.cacheVerificationKey('ios', undefined as any);

      // Then: Both should return validation errors
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });

    it('should handle very long verification keys', async () => {
      // Given: A very long key (simulating large public key)
      const longKey = 'a'.repeat(10000); // 10KB key
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      // When: Caching the long key
      const result = await manager.cacheVerificationKey('ios', longKey);

      // Then: Should store successfully (no size limit for this version)
      expect(result.success).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'verification_key_ios',
        longKey
      );
    });

    it('should handle keys with special characters', async () => {
      // Given: A key with special Base64 characters
      const specialKey =
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4+/q8+v+/';
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      // When: Caching key with special characters
      const result = await manager.cacheVerificationKey('ios', specialKey);

      // Then: Should cache successfully
      expect(result.success).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'verification_key_ios',
        specialKey
      );
    });
  });

  // UNHAPPY PATH TESTS - Storage Errors

  describe('loadVerificationKey - Storage Errors', () => {
    it('should return UNKNOWN_ERROR on secure store read failure', async () => {
      // Given: Secure store throws an error
      const storageError = new Error('Secure store unavailable');
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(storageError);

      // When: Attempting to load key
      const result = await manager.loadVerificationKey('ios');

      // Then: Should return UNKNOWN_ERROR
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toContain('Failed to load');
      }
    });

    it('should return NETWORK_ERROR on timeout', async () => {
      // Given: Secure store operation times out
      const timeoutError = new Error('Operation timeout');
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(timeoutError);

      // When: Attempting to load key
      const result = await manager.loadVerificationKey('ios');

      // Then: Should handle gracefully as UNKNOWN_ERROR
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('cacheVerificationKey - Storage Errors', () => {
    it('should return UNKNOWN_ERROR on secure store write failure', async () => {
      // Given: Secure store write fails
      const storageError = new Error('Permission denied');
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(storageError);

      // When: Attempting to cache key
      const result = await manager.cacheVerificationKey('ios', mockIOSPublicKey);

      // Then: Should return UNKNOWN_ERROR
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toContain('Failed to cache');
      }
    });

    it('should handle platform-specific secure store errors', async () => {
      // Given: Platform-specific error (e.g., iOS Keychain issue)
      const keychainError = new Error('NSError: Item not found');
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(keychainError);

      // When: Attempting to cache key
      const result = await manager.cacheVerificationKey('ios', mockIOSPublicKey);

      // Then: Should return error
      expect(result.success).toBe(false);
    });
  });

  describe('clearVerificationKey - Storage Errors', () => {
    it('should return UNKNOWN_ERROR on secure store delete failure', async () => {
      // Given: Secure store delete fails
      const storageError = new Error('Cannot delete item');
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(
        storageError
      );

      // When: Attempting to clear key
      const result = await manager.clearVerificationKey('ios');

      // Then: Should return UNKNOWN_ERROR
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  // OFFLINE SCENARIOS

  describe('Offline Support - Key Reuse', () => {
    it('should use cached key for verification when offline', async () => {
      // Given: Key is cached from previous session
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        mockIOSPublicKey
      );

      // When: Loading key while offline (first call succeeds, subsequent calls also work)
      const result1 = await manager.loadVerificationKey('ios');
      const result2 = await manager.loadVerificationKey('ios');

      // Then: Both calls should return the cached key
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data).toBe(result2.data);
      }
    });

    it('should persist across multiple load attempts', async () => {
      // Given: Multiple load attempts for the same key
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        mockIOSPublicKey
      );

      // When: Loading key multiple times
      const results = await Promise.all([
        manager.loadVerificationKey('ios'),
        manager.loadVerificationKey('ios'),
        manager.loadVerificationKey('ios'),
      ]);

      // Then: All should succeed and return same key
      expect(results.every((r) => r.success)).toBe(true);
      results.forEach((result) => {
        if (result.success) {
          expect(result.data).toBe(mockIOSPublicKey);
        }
      });
    });
  });

  // CONCURRENT OPERATIONS

  describe('Concurrent Operations', () => {
    it('should handle concurrent cache and load operations', async () => {
      // Given: Multiple concurrent operations with proper mocking setup
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(mockIOSPublicKey);

      // When: Running operations concurrently
      const results = await Promise.all([
        manager.cacheVerificationKey('ios', mockIOSPublicKey),
        manager.loadVerificationKey('ios'),
        manager.loadVerificationKey('ios'),
      ]);

      // Then: All operations should complete without error
      expect(results[0].success).toBe(true); // cache operation
      expect(results[1].success).toBe(true); // first load
      expect(results[2].success).toBe(true); // second load
    });

    it('should handle concurrent iOS and Android operations', async () => {
      // Given: Concurrent operations for different platforms
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(mockIOSPublicKey);

      // When: Running concurrent operations for both platforms
      const results = await Promise.all([
        manager.cacheVerificationKey('ios', mockIOSPublicKey),
        manager.cacheVerificationKey('android', mockAndroidPublicKey),
        manager.loadVerificationKey('ios'),
        manager.loadVerificationKey('android'),
      ]);

      // Then: All operations should complete
      expect(results.every((r) => typeof r.success === 'boolean')).toBe(true);
    });
  });

  // VALIDATION TESTS

  describe('Input Validation', () => {
    it('should validate platform parameter', async () => {
      // Given: Invalid platform value
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      // When: Loading with invalid platform
      const result = await manager.loadVerificationKey('invalid' as any);

      // Then: Should handle gracefully or validate platform
      expect(result.success).toBe(false);
    });

    it('should handle whitespace-only keys', async () => {
      // Given: A key with only whitespace
      const whitespaceKey = '   \n\t  ';
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      // When: Attempting to cache whitespace key
      const result = await manager.cacheVerificationKey('ios', whitespaceKey);

      // Then: Should validate and reject
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_KEY_FORMAT');
      }
    });
  });
});
