/**
 * Subscription Domain Types
 *
 * Core type definitions for the subscription feature.
 * These types represent domain entities and value objects following DDD principles.
 *
 * @module features/subscription/core/types
 */

/**
 * Subscription entity representing the user's subscription state.
 * This is the main domain entity for subscription management.
 */
export interface Subscription {
  /** Whether the subscription is currently active */
  isActive: boolean;
  /** Subscription tier (free or premium) */
  tier: 'free' | 'premium';
  /** Expiration date of the subscription (null for lifetime or free tier) */
  expiresAt: Date | null;
  /** Product identifier (e.g., "monthly_plan", null for free tier) */
  productId: string | null;
}

/**
 * Usage limits value object based on subscription tier.
 * Immutable object that defines resource limits for each tier.
 */
export interface UsageLimits {
  /** Maximum number of items user can create */
  maxItems: number;
  /** Maximum number of exports user can perform */
  maxExports: number;
  /** Whether ads are displayed */
  hasAds: boolean;
}

/**
 * Subscription package available for purchase.
 * Maps to RevenueCat's package offering.
 */
export interface SubscriptionPackage {
  /** Package identifier (e.g., "$rc_monthly", "$rc_annual") */
  identifier: string;
  /** Display title (e.g., "Monthly", "Annual") */
  title: string;
  /** Price string (e.g., "$9.99") */
  priceString: string;
  /** Price in decimal (e.g., 9.99) */
  price: number;
  /** Currency code (e.g., "USD") */
  currencyCode: string;
  /** Introductory price (if available) */
  introPrice?: {
    priceString: string;
    price: number;
    period: string;
  };
}

/**
 * Feature access level for gating features.
 * - 'basic': Available to all users (free and premium)
 * - 'premium': Available only to premium subscribers
 */
export type FeatureLevel = 'basic' | 'premium';

/**
 * Subscription error types.
 * Maps RevenueCat errors to domain-specific error codes.
 */
export type SubscriptionError =
  | { code: 'PURCHASE_CANCELLED'; message: string; retryable: false }
  | { code: 'PURCHASE_NOT_ALLOWED'; message: string; retryable: false }
  | { code: 'PURCHASE_INVALID'; message: string; retryable: false }
  | { code: 'PRODUCT_ALREADY_PURCHASED'; message: string; retryable: false }
  | { code: 'NETWORK_ERROR'; message: string; retryable: true }
  | { code: 'CONFIGURATION_ERROR'; message: string; retryable: false }
  | { code: 'INVALID_CREDENTIALS_ERROR'; message: string; retryable: false }
  | {
      code: 'UNEXPECTED_BACKEND_RESPONSE_ERROR';
      message: string;
      retryable: true;
    }
  | { code: 'RECEIPT_ALREADY_IN_USE_ERROR'; message: string; retryable: false }
  | { code: 'NO_ACTIVE_SUBSCRIPTION'; message: string; retryable: false }
  | { code: 'UNKNOWN_ERROR'; message: string; retryable: false };

/**
 * Subscription error code type for type-safe error handling.
 */
export type SubscriptionErrorCode = SubscriptionError['code'];

/**
 * Result type for error handling without exceptions.
 * Following the Result pattern for explicit error handling.
 */
export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * RevenueCat CustomerInfo type (simplified for domain use).
 * This is the external API response from RevenueCat SDK.
 */
export interface CustomerInfo {
  entitlements: {
    active: Record<string, Entitlement>;
    all: Record<string, Entitlement>;
  };
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  latestExpirationDate: string | null;
  originalAppUserId: string;
  originalApplicationVersion: string | null;
  originalPurchaseDate: string | null;
}

/**
 * RevenueCat Entitlement type.
 */
export interface Entitlement {
  identifier: string;
  isActive: boolean;
  willRenew: boolean;
  periodType: string;
  latestPurchaseDate: string;
  latestPurchaseDateMillis: number;
  originalPurchaseDate: string;
  originalPurchaseDateMillis: number;
  expirationDate: string | null;
  expirationDateMillis: number | null;
  store: string;
  productIdentifier: string;
  productPlanIdentifier: string | null;
  isSandbox: boolean;
  unsubscribeDetectedAt: string | null;
  unsubscribeDetectedAtMillis: number | null;
  billingIssueDetectedAt: string | null;
  billingIssueDetectedAtMillis: number | null;
  ownershipType: string;
}

/**
 * RevenueCat PurchasesPackage type (simplified).
 */
export interface PurchasesPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
    introPrice: {
      price: number;
      priceString: string;
      period: string;
      periodNumberOfUnits: number;
      periodUnit: string;
      cycles: number;
    } | null;
  };
  offeringIdentifier: string;
}

/**
 * Default usage limits for free tier.
 */
export const FREE_TIER_LIMITS: UsageLimits = {
  maxItems: 10,
  maxExports: 1,
  hasAds: true,
};

/**
 * Default usage limits for premium tier.
 */
export const PREMIUM_TIER_LIMITS: UsageLimits = {
  maxItems: Infinity,
  maxExports: Infinity,
  hasAds: false,
};

/**
 * Default subscription state for free users.
 */
export const DEFAULT_FREE_SUBSCRIPTION: Subscription = {
  isActive: false,
  tier: 'free',
  expiresAt: null,
  productId: null,
};

/**
 * Premium entitlement identifier used in RevenueCat.
 */
export const PREMIUM_ENTITLEMENT_ID = 'premium';
