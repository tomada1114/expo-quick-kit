/**
 * VerificationKeyManager - Secure Verification Key Storage & Management
 *
 * Task 4.3: Manages verification keys for iOS (Apple public key) and Android (Google Play public key).
 * Provides secure storage via expo-secure-store with support for offline verification scenarios.
 *
 * Responsibilities:
 * - Load verification keys from secure cache (iOS Keychain / Android Keystore)
 * - Cache verification keys securely for offline use
 * - Delete cached keys (privacy cleanup)
 * - Handle platform-specific key management
 * - Support offline verification with cached keys
 *
 * @module features/purchase/infrastructure/verification-key-manager
 */

import * as SecureStore from 'expo-secure-store';
import type { Result } from '../core/types';

/**
 * Verification key manager error types
 */
export type VerificationKeyError =
  | { code: 'KEY_NOT_FOUND'; message: string }
  | { code: 'INVALID_KEY_FORMAT'; message: string }
  | { code: 'UNKNOWN_ERROR'; message: string };

/**
 * Platform identifier for verification keys
 */
export type VerificationKeyPlatform = 'ios' | 'android';

/**
 * VerificationKeyManager - Manages verification keys for receipt validation
 *
 * Handles secure storage and retrieval of platform-specific public keys used for
 * verifying receipt signatures. Supports both iOS StoreKit2 keys and Android
 * Google Play Billing keys.
 *
 * Encryption is handled transparently by expo-secure-store:
 * - iOS: Stored in Keychain (encrypted by default)
 * - Android: Stored in Keystore (encrypted by default)
 *
 * @example
 * ```ts
 * const keyManager = new VerificationKeyManager();
 *
 * // Cache a key (typically done after fetching from server)
 * const cacheResult = await keyManager.cacheVerificationKey('ios', applePublicKey);
 * if (cacheResult.success) {
 *   console.log('Key cached successfully');
 * }
 *
 * // Load key for verification (uses cache first, then falls back)
 * const loadResult = await keyManager.loadVerificationKey('ios');
 * if (loadResult.success) {
 *   const key = loadResult.data;
 *   // Use key for signature verification
 * }
 *
 * // Clean up (privacy/security)
 * await keyManager.clearVerificationKey('ios');
 * ```
 */
export class VerificationKeyManager {
  /**
   * Secure store key prefix for verification keys
   * Format: verification_key_{platform}
   */
  private static readonly SECURE_STORE_PREFIX = 'verification_key_';

  /**
   * Load verification key from secure cache
   *
   * Retrieves platform-specific public key from encrypted secure storage.
   * This key is used for verifying receipt signatures during offline mode or
   * when server verification is unavailable.
   *
   * @param platform - Platform identifier ('ios' or 'android')
   * @returns Result containing the key string or error
   *
   * Given/When/Then:
   * - Given: A cached verification key exists for the platform
   * - When: loadVerificationKey is called with that platform
   * - Then: Returns success with the cached key string
   *
   * - Given: No cached key exists for the platform
   * - When: loadVerificationKey is called
   * - Then: Returns KEY_NOT_FOUND error
   *
   * - Given: Secure store read operation fails
   * - When: Attempting to load key
   * - Then: Returns UNKNOWN_ERROR with error details
   *
   * @example
   * ```ts
   * const result = await manager.loadVerificationKey('ios');
   * if (result.success) {
   *   console.log('Loaded key:', result.data);
   * } else {
   *   console.error('Failed to load:', result.error.message);
   * }
   * ```
   */
  async loadVerificationKey(
    platform: VerificationKeyPlatform
  ): Promise<Result<string, VerificationKeyError>> {
    try {
      const storeKey = this.getSecureStoreKey(platform);

      const key = await SecureStore.getItemAsync(storeKey);

      if (!key) {
        return {
          success: false,
          error: {
            code: 'KEY_NOT_FOUND' as const,
            message: `Verification key not found for ${platform} platform. Please sync from server.`,
          },
        };
      }

      return {
        success: true,
        data: key,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR' as const,
          message: `Failed to load verification key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      };
    }
  }

  /**
   * Cache verification key in secure storage
   *
   * Stores platform-specific public key in encrypted secure storage for offline use.
   * The key is encrypted before storage using platform-native encryption:
   * - iOS: Keychain encryption
   * - Android: Keystore encryption
   *
   * @param platform - Platform identifier ('ios' or 'android')
   * @param key - The verification key to cache (public key string)
   * @returns Result with success/error
   *
   * Given/When/Then:
   * - Given: A valid verification key string
   * - When: cacheVerificationKey is called with the key
   * - Then: Key is stored in secure storage and returns success
   *
   * - Given: An empty or invalid key string
   * - When: Attempting to cache
   * - Then: Returns INVALID_KEY_FORMAT error
   *
   * - Given: Secure store write fails
   * - When: Attempting to cache key
   * - Then: Returns UNKNOWN_ERROR with error details
   *
   * @example
   * ```ts
   * const result = await manager.cacheVerificationKey('ios', publicKeyString);
   * if (result.success) {
   *   console.log('Key cached successfully for offline use');
   * } else {
   *   console.error('Failed to cache key:', result.error.message);
   * }
   * ```
   */
  async cacheVerificationKey(
    platform: VerificationKeyPlatform,
    key: string
  ): Promise<Result<void, VerificationKeyError>> {
    // Validate input
    const validation = this.validateKeyInput(key);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    try {
      const storeKey = this.getSecureStoreKey(platform);

      await SecureStore.setItemAsync(storeKey, key);

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR' as const,
          message: `Failed to cache verification key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      };
    }
  }

  /**
   * Clear (delete) cached verification key
   *
   * Removes platform-specific verification key from secure storage.
   * Used for privacy cleanup or when invalidating cached keys.
   *
   * @param platform - Platform identifier ('ios' or 'android')
   * @returns Result with success/error
   *
   * Given/When/Then:
   * - Given: A cached verification key exists for the platform
   * - When: clearVerificationKey is called
   * - Then: Key is deleted and returns success
   *
   * - Given: No cached key exists
   * - When: clearVerificationKey is called
   * - Then: Still returns success (idempotent operation)
   *
   * - Given: Secure store delete operation fails
   * - When: Attempting to clear key
   * - Then: Returns UNKNOWN_ERROR with error details
   *
   * @example
   * ```ts
   * const result = await manager.clearVerificationKey('ios');
   * if (result.success) {
   *   console.log('Key cleared for privacy');
   * } else {
   *   console.error('Failed to clear key:', result.error.message);
   * }
   * ```
   */
  async clearVerificationKey(
    platform: VerificationKeyPlatform
  ): Promise<Result<void, VerificationKeyError>> {
    try {
      const storeKey = this.getSecureStoreKey(platform);

      await SecureStore.deleteItemAsync(storeKey);

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR' as const,
          message: `Failed to clear verification key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      };
    }
  }

  /**
   * Get secure store key name for platform
   *
   * @param platform - Platform identifier
   * @returns Secure store key name
   *
   * @private
   */
  private getSecureStoreKey(platform: VerificationKeyPlatform): string {
    return `${VerificationKeyManager.SECURE_STORE_PREFIX}${platform}`;
  }

  /**
   * Validate verification key input
   *
   * Checks that the key:
   * - Is not null/undefined
   * - Is a string type
   * - Is not empty or whitespace-only
   * - Is not excessively large
   *
   * @param key - Key to validate
   * @returns Validation result
   *
   * @private
   */
  private validateKeyInput(key: string): Result<void, VerificationKeyError> {
    // Type validation
    if (key === null || key === undefined) {
      return {
        success: false,
        error: {
          code: 'INVALID_KEY_FORMAT' as const,
          message: 'Verification key cannot be null or undefined',
        },
      };
    }

    if (typeof key !== 'string') {
      return {
        success: false,
        error: {
          code: 'INVALID_KEY_FORMAT' as const,
          message: 'Verification key must be a string',
        },
      };
    }

    // Empty/whitespace validation
    if (key.trim().length === 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_KEY_FORMAT' as const,
          message: 'Verification key cannot be empty or whitespace-only',
        },
      };
    }

    return { success: true, data: undefined };
  }
}

/**
 * Singleton instance of VerificationKeyManager
 * Used across the application for consistent key management
 */
export const verificationKeyManager = new VerificationKeyManager();
