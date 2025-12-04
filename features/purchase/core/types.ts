/**
 * Purchase Domain Types
 *
 * Core type definitions for the purchase feature (one-time purchases / 買い切り型).
 * These types represent domain entities and value objects following DDD principles.
 *
 * @module features/purchase/core/types
 */

/**
 * Purchase entity representing a one-time purchase (買い切り型).
 * This is the main domain entity for one-time purchase management.
 *
 * A Purchase represents a permanent, one-time unlock of features.
 * Unlike Subscription, a Purchase does not expire and cannot be revoked.
 *
 * Invariants:
 * - transactionId must be unique (primary key)
 * - When isVerified === true, unlockedFeatures should be non-empty
 * - When isSynced === true, syncedAt must be defined
 */
export interface Purchase {
  /** Unique identifier for the transaction (platform-generated) */
  transactionId: string;

  /** Product identifier (e.g., "premium_unlock", "feature_bundle") */
  productId: string;

  /** Timestamp when purchase was made */
  purchasedAt: Date;

  /** Price in decimal (e.g., 9.99) */
  price: number;

  /** Currency code (e.g., "USD", "JPY") */
  currencyCode: string;

  /** Whether the purchase receipt has been cryptographically verified */
  isVerified: boolean;

  /** Reference to the JWS signature key used for verification (if verified) */
  verificationKey?: string;

  /** Whether the purchase has been synced to backend (offline resilience) */
  isSynced: boolean;

  /** Timestamp when synced to backend (defined when isSynced === true) */
  syncedAt?: Date;

  /** List of feature IDs unlocked by this purchase (can unlock multiple features) */
  unlockedFeatures: string[];
}

/**
 * Feature Level value object for feature gating.
 * - 'free': Available to all users
 * - 'premium': Available only after purchase
 */
export type FeatureLevel = 'free' | 'premium';

/**
 * Feature definition for gating control.
 * Defines a feature's access level and requirements.
 */
export interface FeatureDefinition {
  /** Unique feature identifier */
  id: string;

  /** Access level (free or premium) */
  level: FeatureLevel;

  /** Display name */
  name: string;

  /** Description of feature */
  description: string;

  /** Product ID required to unlock (optional, for flexible mapping) */
  requiredProductId?: string;
}

/**
 * Purchase error types for domain-specific error handling.
 * Discriminated union for type-safe error handling.
 *
 * Errors are categorized into:
 * - Network errors (retryable): Can be recovered with exponential backoff
 * - User errors (non-retryable): User action or cancellation
 * - System errors (non-retryable): Store problems or invalid state
 */
export type PurchaseError =
  | {
      code: 'NETWORK_ERROR';
      message: string;
      retryable: true;
      platform: 'ios' | 'android' | 'revenueCat';
    }
  | {
      code: 'STORE_PROBLEM_ERROR';
      message: string;
      retryable: true;
      nativeErrorCode: number;
    }
  | {
      code: 'PURCHASE_CANCELLED';
      message: string;
      retryable: false;
    }
  | {
      code: 'PURCHASE_INVALID';
      message: string;
      retryable: false;
      reason: 'not_signed' | 'wrong_bundle' | 'revoked';
    }
  | {
      code: 'PRODUCT_UNAVAILABLE';
      message: string;
      retryable: false;
      productId: string;
    }
  | {
      code: 'UNKNOWN_ERROR';
      message: string;
      retryable: false;
    };

/**
 * Purchase error code type for type-safe error handling.
 * Extracts the 'code' field from PurchaseError discriminated union.
 */
export type PurchaseErrorCode = PurchaseError['code'];

/**
 * Result type for error handling without exceptions.
 * Following the Result pattern for explicit error handling.
 *
 * Enables type-safe error handling with discriminator:
 * ```typescript
 * const result = await purchaseService.purchaseProduct(id);
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Product information from platform store.
 * Represents metadata for a purchasable product.
 */
export interface Product {
  /** Product identifier */
  id: string;

  /** Display title */
  title: string;

  /** Description */
  description: string;

  /** Price in decimal */
  price: number;

  /** Formatted price string (e.g., "$9.99") */
  priceString: string;

  /** Currency code */
  currencyCode: string;
}

/**
 * Transaction from platform store.
 * Represents a completed or pending transaction.
 */
export interface Transaction {
  /** Platform-generated transaction identifier */
  transactionId: string;

  /** Product identifier */
  productId: string;

  /** Purchase date */
  purchaseDate: Date;

  /** Receipt data (JWS for iOS, JSON for Android) */
  receiptData: string;

  /** Signature (Android only) */
  signature?: string;
}
