/**
 * RevenueCat Template - Type Definitions
 *
 * All TypeScript types and interfaces used by the RevenueCat integration.
 * These can be imported from a single file for convenience.
 */

// ============================================================
// Subscription Entity
// ============================================================

/**
 * Subscription entity representing user's subscription status
 */
export interface Subscription {
  isActive: boolean;
  tier: 'free' | 'premium';
}

// ============================================================
// Usage Limits
// ============================================================

/**
 * Value object representing usage limits for a subscription.
 *
 * CUSTOMIZE THIS: Modify these fields based on your app's needs.
 * Examples:
 *   - maxProjects, maxTeamMembers (project management app)
 *   - maxStorageMB, maxUploads (file storage app)
 *   - maxAIRequests, maxTokens (AI app)
 */
export interface UsageLimits {
  maxItems: number;
  maxExports: number;
  hasAds: boolean;
}

// ============================================================
// Feature Levels
// ============================================================

/**
 * Feature access levels.
 * Extend this union type if you need more tiers (e.g., 'pro' | 'enterprise').
 */
export type FeatureLevel = 'basic' | 'premium';

// ============================================================
// Subscription Package
// ============================================================

/**
 * Represents an available subscription package from RevenueCat
 */
export interface SubscriptionPackage {
  readonly identifier: string;
  readonly packageType: string;
  readonly title: string;
  readonly price: string;
  readonly priceString: string;
  readonly currencyCode: string;
  readonly introPrice?: {
    readonly price: string;
    readonly priceString: string;
    readonly period: string;
    readonly periodNumberOfUnits: number;
    readonly cycles: number;
    readonly periodUnit: string;
  };
}

// ============================================================
// Error Handling
// ============================================================

/**
 * Error codes for subscription-related failures
 */
export enum SubscriptionErrorCode {
  PURCHASE_CANCELLED = 'PURCHASE_CANCELLED',
  PURCHASE_FAILED = 'PURCHASE_FAILED',
  RESTORE_FAILED = 'RESTORE_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_PACKAGE = 'INVALID_PACKAGE',
  ENTITLEMENT_CHECK_FAILED = 'ENTITLEMENT_CHECK_FAILED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Errors that can occur during subscription operations
 */
export class SubscriptionError extends Error {
  constructor(
    message: string,
    public readonly code: SubscriptionErrorCode,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'SubscriptionError';
  }
}

// ============================================================
// Repository Interface (Optional - for DDD/CA projects)
// ============================================================

/**
 * Repository interface for subscription data access.
 * Use this if your project follows DDD/Clean Architecture patterns.
 * Otherwise, you can use RevenueCatSubscriptionRepository directly.
 */
export interface SubscriptionRepository {
  getCurrentSubscription(): Promise<Subscription | null>;
  purchasePackage(packageId: string): Promise<void>;
  restorePurchases(): Promise<Subscription | null>;
  getAvailablePackages(): Promise<SubscriptionPackage[]>;
  hasEntitlement(entitlementId: string): Promise<boolean>;
}

// ============================================================
// Result Types
// ============================================================

/**
 * Purchase result with detailed information
 */
export interface PurchaseResult {
  success: boolean;
  subscription: Subscription | null;
  error?: string;
}

/**
 * Restore result with detailed information
 */
export interface RestoreResult {
  success: boolean;
  subscription: Subscription | null;
  error?: string;
}

/**
 * Available packages result
 */
export interface PackagesResult {
  packages: SubscriptionPackage[];
  error?: string;
}

/**
 * Complete subscription status with computed properties
 */
export interface SubscriptionStatus {
  subscription: Subscription;
  usageLimits: UsageLimits;
  isSubscribed: boolean;
  isPremium: boolean;
  isFree: boolean;
  canAccessFeature: (featureLevel: FeatureLevel) => boolean;
}
