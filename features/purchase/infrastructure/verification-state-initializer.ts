/**
 * Verification State Initializer
 *
 * Handles restoration of verification state on app startup.
 * Loads previously persisted verification metadata from secure store
 * and populates the verification state for offline verification support.
 *
 * Task 5.2: Restore verification state (verifiedAt, verification metadata)
 * on app startup
 *
 * @module features/purchase/infrastructure/verification-state-initializer
 */

import { VerificationMetadataStore } from './verification-metadata-store';
import type { Result } from '../core/types';
import type { VerificationMetadata } from './verification-metadata-store';

/**
 * Verification state initialization error
 */
export type VerificationStateInitializationError =
  | {
      code: 'RESTORATION_FAILED';
      message: string;
    }
  | {
      code: 'STORE_ERROR';
      message: string;
    }
  | {
      code: 'UNKNOWN_ERROR';
      message: string;
    };

/**
 * Verification state cache for runtime access
 *
 * Keeps in-memory cache of verification metadata for fast
 * offline access without requiring secure store reads on each access
 */
interface VerificationStateCache {
  // Map transaction ID to verification metadata
  metadata: Map<string, VerificationMetadata>;
  // Flag indicating whether cache has been initialized
  isInitialized: boolean;
  // Timestamp of last initialization
  initializedAt: Date | null;
}

/**
 * Initializer for verification state on app startup
 *
 * Responsibilities:
 * - Load all verification metadata from secure store on app startup
 * - Populate in-memory cache for fast offline access
 * - Support cache invalidation and refresh
 * - Handle initialization errors gracefully
 * - Provide verification metadata lookup by transaction ID
 * - Support clearing verification state for debugging/privacy
 */
export class VerificationStateInitializer {
  /**
   * Store instance for secure persistence
   */
  private store: VerificationMetadataStore;

  /**
   * Runtime verification state cache
   * Loaded on app startup, used for offline verification
   */
  private cache: VerificationStateCache;

  /**
   * Constructor - Initializes the verification state initializer
   */
  constructor() {
    this.store = new VerificationMetadataStore();
    this.cache = {
      metadata: new Map(),
      isInitialized: false,
      initializedAt: null,
    };
  }

  /**
   * Initialize verification state on app startup
   *
   * Loads all verification metadata from secure store into in-memory cache.
   * This should be called once during app initialization (e.g., in root layout).
   *
   * @returns Result indicating success or error
   *
   * Given/When/Then:
   * - Given: App is starting up
   * - When: initializeVerificationState is called
   * - Then: Loads all metadata from secure store into cache
   *
   * - Given: Previous verification metadata exists in secure store
   * - When: Initialization completes
   * - Then: Cache is populated and isInitialized flag is set
   *
   * - Given: Secure store read fails
   * - When: Attempting initialization
   * - Then: Returns RESTORATION_FAILED error but cache remains usable
   */
  async initializeVerificationState(): Promise<
    Result<void, VerificationStateInitializationError>
  > {
    try {
      // Restore all metadata from secure store
      const restoreResult = await this.store.restoreAllVerificationMetadata();

      if (!restoreResult.success) {
        return {
          success: false,
          error: {
            code: 'RESTORATION_FAILED',
            message: `Failed to restore verification metadata: ${restoreResult.error.message}`,
          },
        };
      }

      // Populate cache with restored metadata
      this.cache.metadata.clear();
      for (const metadata of restoreResult.data) {
        this.cache.metadata.set(metadata.transactionId, metadata);
      }

      // Mark cache as initialized
      this.cache.isInitialized = true;
      this.cache.initializedAt = new Date();

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: `Verification state initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      };
    }
  }

  /**
   * Check if verification state has been initialized
   *
   * @returns True if verification state has been loaded from secure store
   */
  isInitialized(): boolean {
    return this.cache.isInitialized;
  }

  /**
   * Get verification metadata from cache
   *
   * Returns metadata from in-memory cache (no secure store access).
   * Requires initializeVerificationState to be called first.
   *
   * @param transactionId - Transaction ID to look up
   * @returns Verification metadata if found, null otherwise
   *
   * Given/When/Then:
   * - Given: Initialization completed and metadata exists in cache
   * - When: getVerificationMetadata is called
   * - Then: Returns cached metadata without secure store access
   *
   * - Given: Metadata not in cache
   * - When: Attempting to get metadata
   * - Then: Returns null
   */
  getVerificationMetadata(transactionId: string): VerificationMetadata | null {
    return this.cache.metadata.get(transactionId) ?? null;
  }

  /**
   * Check if a transaction has been verified
   *
   * Fast check without secure store access.
   * Returns false if cache not initialized (app startup incomplete).
   *
   * @param transactionId - Transaction ID to check
   * @returns True if transaction is in verification cache
   */
  isTransactionVerified(transactionId: string): boolean {
    if (!this.cache.isInitialized) {
      // Cache not yet loaded, assume not verified
      return false;
    }
    return this.cache.metadata.has(transactionId);
  }

  /**
   * Add verification metadata to cache and secure store
   *
   * Should be called after successful receipt verification
   * to persist the verification state for offline access.
   *
   * @param metadata - Verification metadata to store
   * @returns Result indicating success or error
   *
   * Given/When/Then:
   * - Given: Receipt verification succeeded
   * - When: addVerificationMetadata is called
   * - Then: Metadata is saved to cache and secure store
   *
   * - Given: Secure store write fails
   * - When: Attempting to save
   * - Then: Still updates cache but returns error
   */
  async addVerificationMetadata(
    metadata: VerificationMetadata
  ): Promise<Result<void, VerificationStateInitializationError>> {
    try {
      // Always update cache for offline access
      this.cache.metadata.set(metadata.transactionId, metadata);

      // Also persist to secure store
      const saveResult = await this.store.saveVerificationMetadata(metadata);

      if (!saveResult.success) {
        return {
          success: false,
          error: {
            code: 'STORE_ERROR',
            message: `Failed to persist verification metadata: ${saveResult.error.message}`,
          },
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: `Failed to add verification metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      };
    }
  }

  /**
   * Remove verification metadata from cache and secure store
   *
   * Should be called when cleaning up verification data
   * (e.g., for privacy, user deletion, debugging).
   *
   * @param transactionId - Transaction ID to remove
   * @returns Result indicating success or error
   */
  async removeVerificationMetadata(
    transactionId: string
  ): Promise<Result<void, VerificationStateInitializationError>> {
    try {
      // Remove from cache
      this.cache.metadata.delete(transactionId);

      // Remove from secure store
      const deleteResult = await this.store.deleteVerificationMetadata(
        transactionId
      );

      if (!deleteResult.success) {
        return {
          success: false,
          error: {
            code: 'STORE_ERROR',
            message: `Failed to delete verification metadata: ${deleteResult.error.message}`,
          },
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: `Failed to remove verification metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      };
    }
  }

  /**
   * Get all verification metadata
   *
   * Returns all metadata currently in cache.
   * For listing purchases or debugging purposes.
   *
   * @returns Array of all verification metadata
   */
  getAllVerificationMetadata(): VerificationMetadata[] {
    return Array.from(this.cache.metadata.values());
  }

  /**
   * Get count of verified transactions
   *
   * Quick count for analytics or UI display
   *
   * @returns Number of verified transactions in cache
   */
  getVerifiedTransactionCount(): number {
    return this.cache.metadata.size;
  }

  /**
   * Refresh verification state from secure store
   *
   * Reloads all metadata from secure store, useful for:
   * - Syncing after background operations
   * - Invalidating stale cache
   * - Testing/debugging
   *
   * @returns Result indicating success or error
   */
  async refreshVerificationState(): Promise<
    Result<void, VerificationStateInitializationError>
  > {
    try {
      // Restore fresh copy from secure store
      const restoreResult = await this.store.restoreAllVerificationMetadata();

      if (!restoreResult.success) {
        return {
          success: false,
          error: {
            code: 'RESTORATION_FAILED',
            message: `Failed to refresh verification metadata: ${restoreResult.error.message}`,
          },
        };
      }

      // Rebuild cache
      this.cache.metadata.clear();
      for (const metadata of restoreResult.data) {
        this.cache.metadata.set(metadata.transactionId, metadata);
      }

      // Update timestamp
      this.cache.initializedAt = new Date();

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: `Failed to refresh verification state: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      };
    }
  }

  /**
   * Clear all verification state
   *
   * Removes all verification metadata from cache and secure store.
   * Use with caution - typically only for:
   * - User account deletion
   * - Privacy deletion requests
   * - Development/testing
   *
   * @returns Result indicating success or error
   */
  async clearAllVerificationState(): Promise<
    Result<void, VerificationStateInitializationError>
  > {
    try {
      // Clear cache
      this.cache.metadata.clear();
      this.cache.isInitialized = false;
      this.cache.initializedAt = null;

      // Clear secure store
      const clearResult = await this.store.clearAllVerificationMetadata();

      if (!clearResult.success) {
        return {
          success: false,
          error: {
            code: 'STORE_ERROR',
            message: `Failed to clear verification metadata: ${clearResult.error.message}`,
          },
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: `Failed to clear verification state: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      };
    }
  }

  /**
   * Get initialization timestamp
   *
   * Useful for logging, analytics, and testing
   *
   * @returns Timestamp when cache was initialized, or null if not initialized
   */
  getInitializedAt(): Date | null {
    return this.cache.initializedAt;
  }
}

/**
 * Singleton instance of VerificationStateInitializer
 * Used across the application for consistent verification state management
 */
export const verificationStateInitializer =
  new VerificationStateInitializer();
