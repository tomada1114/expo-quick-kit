/**
 * Subscription Service
 *
 * Application service layer that contains business logic for subscription management.
 * Implements Feature Gating and Usage Limits calculation based on subscription tier.
 *
 * Responsibilities:
 * - Calculate UsageLimits based on subscription tier
 * - Implement Feature Gating logic (canAccessFeature)
 * - Handle purchase and restore flows with error handling
 * - Manage subscription state updates
 *
 * @module features/subscription/core/service
 */

import type {
  UsageLimits,
  FeatureLevel,
  Subscription,
  SubscriptionError,
  Result,
} from './types';
import {
  FREE_TIER_LIMITS,
  PREMIUM_TIER_LIMITS,
  DEFAULT_FREE_SUBSCRIPTION,
} from './types';

// Re-export constants for convenience
export { FREE_TIER_LIMITS, PREMIUM_TIER_LIMITS };

/**
 * Get usage limits based on subscription tier.
 *
 * @param tier - Subscription tier ('free' | 'premium')
 * @returns UsageLimits value object for the given tier
 *
 * @example
 * ```ts
 * const limits = getUsageLimits('free');
 * console.log(limits.maxItems); // 10
 *
 * const premiumLimits = getUsageLimits('premium');
 * console.log(premiumLimits.maxItems); // Infinity
 * ```
 */
export function getUsageLimits(tier: Subscription['tier']): UsageLimits {
  switch (tier) {
    case 'premium':
      return PREMIUM_TIER_LIMITS;
    case 'free':
    default:
      return FREE_TIER_LIMITS;
  }
}

/**
 * Check if a user can access a feature based on feature level and subscription tier.
 *
 * Feature Gating Rules:
 * - 'basic' features are available to all users (free and premium)
 * - 'premium' features are only available to premium subscribers
 *
 * @param level - Feature access level ('basic' | 'premium')
 * @param tier - User's subscription tier ('free' | 'premium')
 * @returns true if user can access the feature, false otherwise
 *
 * @example
 * ```ts
 * // Free user trying to access premium feature
 * canAccessFeature('premium', 'free'); // false
 *
 * // Premium user accessing any feature
 * canAccessFeature('premium', 'premium'); // true
 * canAccessFeature('basic', 'premium'); // true
 *
 * // Basic features available to all
 * canAccessFeature('basic', 'free'); // true
 * ```
 */
export function canAccessFeature(
  level: FeatureLevel,
  tier: Subscription['tier']
): boolean {
  switch (level) {
    case 'basic':
      // Basic features are available to all users
      return true;
    case 'premium':
      // Premium features require premium subscription
      return tier === 'premium';
    default:
      // Defensive: unknown feature levels are denied
      return false;
  }
}

/**
 * Get default subscription state for unauthenticated/free users.
 *
 * @returns Default free subscription state
 */
export function getDefaultSubscription(): Subscription {
  return DEFAULT_FREE_SUBSCRIPTION;
}

/**
 * Repository interface for subscription data access.
 * This interface abstracts the RevenueCat SDK for testability.
 */
export interface SubscriptionRepository {
  getCustomerInfo(): Promise<Result<Subscription, SubscriptionError>>;
  purchasePackage(
    packageId: string
  ): Promise<Result<Subscription, SubscriptionError>>;
  restorePurchases(): Promise<Result<Subscription | null, SubscriptionError>>;
}

/**
 * Configuration options for creating a subscription service.
 */
export interface SubscriptionServiceConfig {
  /** Repository for accessing subscription data */
  repository: SubscriptionRepository;
  /** Callback invoked when subscription state changes */
  onStateChange?: (subscription: Subscription) => void;
}

/**
 * Subscription Service instance interface.
 *
 * Provides methods for:
 * - Fetching current subscription state
 * - Purchasing subscription packages
 * - Restoring previous purchases
 * - Managing subscription state updates
 */
export interface SubscriptionService {
  /** Get the current subscription state without fetching from remote */
  getCurrentSubscription(): Subscription;
  /** Fetch subscription state from RevenueCat and update internal state */
  getSubscription(): Promise<Result<Subscription, SubscriptionError>>;
  /** Purchase a subscription package */
  purchasePackage(
    packageId: string
  ): Promise<Result<Subscription, SubscriptionError>>;
  /** Restore previous purchases */
  restorePurchases(): Promise<Result<Subscription, SubscriptionError>>;
}

/**
 * Create a new subscription service instance.
 *
 * The service handles:
 * - Purchase flow with auto-restore on PRODUCT_ALREADY_PURCHASED error
 * - Restore flow with NO_ACTIVE_SUBSCRIPTION detection
 * - State management with callback notifications
 * - Fallback to free tier on errors
 *
 * @param config - Service configuration
 * @returns SubscriptionService instance
 *
 * @example
 * ```ts
 * const service = createSubscriptionService({
 *   repository: subscriptionRepository,
 *   onStateChange: (subscription) => {
 *     console.log('Subscription updated:', subscription.tier);
 *   },
 * });
 *
 * // Purchase a subscription
 * const result = await service.purchasePackage('$rc_monthly');
 * if (result.success) {
 *   console.log('Purchased:', result.data.tier);
 * }
 * ```
 */
export function createSubscriptionService(
  config: SubscriptionServiceConfig
): SubscriptionService {
  const { repository, onStateChange } = config;

  // Internal state
  let currentSubscription: Subscription = DEFAULT_FREE_SUBSCRIPTION;

  /**
   * Update internal subscription state and notify listeners.
   */
  function updateState(subscription: Subscription): void {
    currentSubscription = subscription;
    onStateChange?.(subscription);
  }

  return {
    getCurrentSubscription(): Subscription {
      return currentSubscription;
    },

    async getSubscription(): Promise<Result<Subscription, SubscriptionError>> {
      const result = await repository.getCustomerInfo();

      if (result.success) {
        updateState(result.data);
        return result;
      }

      // On error, fallback to free tier
      updateState(DEFAULT_FREE_SUBSCRIPTION);
      return result;
    },

    async purchasePackage(
      packageId: string
    ): Promise<Result<Subscription, SubscriptionError>> {
      const result = await repository.purchasePackage(packageId);

      if (result.success) {
        updateState(result.data);
        return result;
      }

      // Handle PRODUCT_ALREADY_PURCHASED by auto-restoring
      if (result.error.code === 'PRODUCT_ALREADY_PURCHASED') {
        const restoreResult = await repository.restorePurchases();

        if (restoreResult.success && restoreResult.data) {
          updateState(restoreResult.data);
          return { success: true, data: restoreResult.data };
        }

        if (!restoreResult.success) {
          return restoreResult;
        }

        // Restore succeeded but no active subscription found
        return {
          success: false,
          error: {
            code: 'NO_ACTIVE_SUBSCRIPTION',
            message: 'No active subscription found after restore',
            retryable: false,
          },
        };
      }

      // For other errors (PURCHASE_CANCELLED, NETWORK_ERROR, etc.)
      // Don't update state, just return the error
      return result;
    },

    async restorePurchases(): Promise<Result<Subscription, SubscriptionError>> {
      const result = await repository.restorePurchases();

      if (!result.success) {
        // Restore failed with an error
        return result;
      }

      if (result.data === null) {
        // Restore succeeded but no active subscription found
        return {
          success: false,
          error: {
            code: 'NO_ACTIVE_SUBSCRIPTION',
            message: 'No active subscription found',
            retryable: false,
          },
        };
      }

      // Restore succeeded with active subscription
      updateState(result.data);
      return { success: true, data: result.data };
    },
  };
}
