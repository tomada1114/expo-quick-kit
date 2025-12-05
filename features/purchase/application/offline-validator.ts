/**
 * OfflineValidator - Offline Receipt Validation
 *
 * Handles validation of receipts in offline mode by caching verification results.
 * Supports network restoration workflows for revalidation.
 *
 * Key Features:
 * - Cache receipt verification results for offline access
 * - Track cached result expiration with configurable TTL
 * - Support network restoration workflow (mark entries for revalidation)
 * - Maintain cache statistics and pending revalidation tracking
 *
 * Task 15.4: OfflineValidator - オフライン検証モード
 * - オフライン時は キャッシュされた receipt data のみで検証
 * - ネットワーク復帰時に再検証（must）
 *
 * @module features/purchase/application
 */

import { type VerificationResult } from '../infrastructure/receipt-verifier';
import crypto from 'crypto';

// ============================================================================
// Type Definitions
// ============================================================================

/** Configuration for offline validator */
export interface OfflineValidatorConfig {
  /** Cache expiry time in seconds (default: 86400 = 24 hours) */
  cacheExpirySec?: number;
}

/** Offline validation result */
export interface OfflineValidationResult {
  /** Whether the receipt is valid */
  isValid: boolean;
  /** Source of the validation (cache, none) */
  source: 'cache' | 'none';
  /** The cached verification result if available */
  verificationResult?: VerificationResult;
  /** When the result was cached */
  cachedAt?: Date;
  /** Whether this entry requires revalidation on network restoration */
  requiresRevalidation: boolean;
  /** Error information if validation failed */
  error?: {
    code: string;
    message: string;
  };
}

/** Pending revalidation entry */
export interface PendingRevalidationEntry {
  /** The receipt data that needs revalidation */
  receiptData: string;
  /** Hash of the receipt data */
  receiptDataHash: string;
  /** Original cached verification result */
  originalResult?: VerificationResult;
  /** When the entry was cached */
  cachedAt: Date;
  /** When revalidation was requested */
  revalidationRequestedAt: Date;
}

/** Cache statistics */
export interface CacheStats {
  /** Total number of cached entries */
  totalCached: number;
  /** Number of entries pending revalidation */
  pendingRevalidation: number;
  /** Number of expired entries */
  expiredCount: number;
}

/** Cache operation result */
interface CacheOperationResult {
  /** Hash of the receipt data */
  receiptDataHash: string;
  /** When the result was cached */
  cachedAt: Date;
}

/** Result type helper */
interface ResultOk<T> {
  isOk(): boolean;
  isErr(): false;
  ok(): T;
  err(): never;
}

interface ResultErr<E> {
  isOk(): false;
  isErr(): boolean;
  ok(): never;
  err(): E;
}

type Result<T, E> = ResultOk<T> | ResultErr<E>;

function ok<T>(value: T): Result<T, never> {
  return {
    isOk: () => true,
    isErr: () => false,
    ok: () => value,
    err: () => {
      throw new Error('Called err() on Ok result');
    },
  };
}

function err<E>(error: E): Result<never, E> {
  return {
    isOk: () => false,
    isErr: () => true,
    ok: () => {
      throw new Error('Called ok() on Err result');
    },
    err: () => error,
  };
}

// ============================================================================
// Internal Cache Entry Type
// ============================================================================

interface CacheEntry {
  receiptData: string;
  receiptDataHash: string;
  verificationResult: VerificationResult;
  cachedAt: Date;
  expiresAt: Date;
  requiresRevalidation: boolean;
  revalidationRequestedAt?: Date;
}

// ============================================================================
// OfflineValidator Implementation
// ============================================================================

/**
 * OfflineValidator - Manages offline receipt validation via caching
 *
 * Provides:
 * - Receipt result caching with configurable TTL
 * - Offline verification using cached results
 * - Network restoration workflow for revalidation
 * - Cache statistics and pending revalidation tracking
 */
export class OfflineValidator {
  /** Cache of verification results */
  private cache: Map<string, CacheEntry> = new Map();

  /** Configuration */
  private config: Required<OfflineValidatorConfig>;

  constructor(config?: OfflineValidatorConfig) {
    this.config = {
      cacheExpirySec: config?.cacheExpirySec ?? 86400, // 24 hours default
    };
  }

  /**
   * Hash receipt data for cache key
   */
  private hashReceiptData(receiptData: string): string {
    return crypto.createHash('sha256').update(receiptData).digest('hex');
  }

  /**
   * Cache a verification result
   *
   * Given: Valid receipt data and verification result
   * When: Caching
   * Then: Store result with expiry timestamp
   */
  cacheVerificationResult(
    receiptData: string,
    verificationResult: VerificationResult
  ): Result<CacheOperationResult, { code: string; message: string }> {
    // Validate input
    if (!receiptData || typeof receiptData !== 'string') {
      return err({
        code: 'INVALID_INPUT',
        message: 'Receipt data must be a non-empty string',
      });
    }

    const receiptDataHash = this.hashReceiptData(receiptData);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.cacheExpirySec * 1000);

    const cacheEntry: CacheEntry = {
      receiptData,
      receiptDataHash,
      verificationResult,
      cachedAt: now,
      expiresAt,
      requiresRevalidation: false,
    };

    this.cache.set(receiptDataHash, cacheEntry);

    return ok({
      receiptDataHash,
      cachedAt: now,
    });
  }

  /**
   * Verify a receipt using cached result (offline mode)
   *
   * Given: Receipt data
   * When: Verifying offline
   * Then: Return cached result if available and not expired, otherwise error
   */
  verifyReceiptOffline(receiptData: string): OfflineValidationResult {
    // Validate input
    if (!receiptData || typeof receiptData !== 'string') {
      return {
        isValid: false,
        source: 'none',
        requiresRevalidation: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Receipt data must be a non-empty string',
        },
      };
    }

    const receiptDataHash = this.hashReceiptData(receiptData);
    const cacheEntry = this.cache.get(receiptDataHash);

    // Not in cache
    if (!cacheEntry) {
      return {
        isValid: false,
        source: 'none',
        requiresRevalidation: false,
        error: {
          code: 'RECEIPT_NOT_CACHED',
          message: 'Receipt not found in offline cache',
        },
      };
    }

    // Check if expired
    const now = new Date();
    if (now > cacheEntry.expiresAt) {
      return {
        isValid: false,
        source: 'cache',
        verificationResult: cacheEntry.verificationResult,
        cachedAt: cacheEntry.cachedAt,
        requiresRevalidation: true,
        error: {
          code: 'CACHE_EXPIRED',
          message: 'Cached verification has expired',
        },
      };
    }

    // Return cached result
    return {
      isValid: cacheEntry.verificationResult.isValid,
      source: 'cache',
      verificationResult: cacheEntry.verificationResult,
      cachedAt: cacheEntry.cachedAt,
      requiresRevalidation: cacheEntry.requiresRevalidation,
    };
  }

  /**
   * Notify validator that network has been restored
   *
   * Marks all current cached entries as pending revalidation.
   * These entries will still be usable for offline access but will
   * require online revalidation when network is available.
   */
  notifyNetworkRestoration(): void {
    const now = new Date();

    for (const cacheEntry of this.cache.values()) {
      cacheEntry.requiresRevalidation = true;
      cacheEntry.revalidationRequestedAt = now;
    }
  }

  /**
   * Get all entries pending revalidation
   *
   * Returns entries marked for revalidation after network restoration.
   */
  getPendingRevalidations(): PendingRevalidationEntry[] {
    const pending: PendingRevalidationEntry[] = [];

    for (const [receiptDataHash, cacheEntry] of this.cache.entries()) {
      if (cacheEntry.requiresRevalidation) {
        pending.push({
          receiptData: cacheEntry.receiptData,
          receiptDataHash,
          originalResult: cacheEntry.verificationResult,
          cachedAt: cacheEntry.cachedAt,
          revalidationRequestedAt: cacheEntry.revalidationRequestedAt!,
        });
      }
    }

    return pending;
  }

  /**
   * Mark a revalidation as complete with updated result
   *
   * Given: Receipt and updated verification result
   * When: Revalidation completes online
   * Then: Update cache with new result and clear revalidation flag
   */
  markRevalidationComplete(
    receiptData: string,
    updatedVerificationResult: VerificationResult
  ): Result<CacheOperationResult, { code: string; message: string }> {
    // Validate input
    if (!receiptData || typeof receiptData !== 'string') {
      return err({
        code: 'INVALID_INPUT',
        message: 'Receipt data must be a non-empty string',
      });
    }

    const receiptDataHash = this.hashReceiptData(receiptData);
    const cacheEntry = this.cache.get(receiptDataHash);

    // Not found
    if (!cacheEntry) {
      return err({
        code: 'RECEIPT_NOT_FOUND',
        message: 'Receipt not found in cache',
      });
    }

    // Not pending revalidation
    if (!cacheEntry.requiresRevalidation) {
      return err({
        code: 'NOT_PENDING_REVALIDATION',
        message: 'Receipt is not marked for revalidation',
      });
    }

    // Update cache entry
    const now = new Date();
    cacheEntry.verificationResult = updatedVerificationResult;
    cacheEntry.cachedAt = now;
    cacheEntry.expiresAt = new Date(now.getTime() + this.config.cacheExpirySec * 1000);
    cacheEntry.requiresRevalidation = false;

    return ok({
      receiptDataHash,
      cachedAt: now,
    });
  }

  /**
   * Clear all cached entries
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const now = new Date();
    let pendingRevalidation = 0;
    let expiredCount = 0;

    for (const cacheEntry of this.cache.values()) {
      if (cacheEntry.requiresRevalidation) {
        pendingRevalidation += 1;
      }
      if (now > cacheEntry.expiresAt) {
        expiredCount += 1;
      }
    }

    return {
      totalCached: this.cache.size,
      pendingRevalidation,
      expiredCount,
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create an offline validator instance
 */
export function createOfflineValidator(config?: OfflineValidatorConfig): OfflineValidator {
  return new OfflineValidator(config);
}

// ============================================================================
// Type Exports
// ============================================================================

export type { OfflineValidator };
