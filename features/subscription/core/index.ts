/**
 * Subscription Core Module
 *
 * Exports all core subscription functionality including:
 * - SDK configuration
 * - Repository layer
 * - Domain types
 *
 * @module features/subscription/core
 */

// SDK Configuration
export {
  configurePurchases,
  isConfigured,
  getApiKey,
  resetConfiguration,
} from './sdk';

// Repository
export {
  subscriptionRepository,
  toSubscription,
  toSubscriptionError,
} from './repository';

// Application Service
export {
  getUsageLimits,
  canAccessFeature,
  getDefaultSubscription,
} from './service';

// Domain Types
export type {
  Subscription,
  UsageLimits,
  SubscriptionPackage,
  FeatureLevel,
  SubscriptionError,
  SubscriptionErrorCode,
  Result,
  CustomerInfo,
  Entitlement,
  PurchasesPackage,
} from './types';

export {
  FREE_TIER_LIMITS,
  PREMIUM_TIER_LIMITS,
  DEFAULT_FREE_SUBSCRIPTION,
  PREMIUM_ENTITLEMENT_ID,
} from './types';
