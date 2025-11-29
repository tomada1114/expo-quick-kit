/**
 * Subscription Service
 *
 * Application service layer that contains business logic for subscription management.
 * Implements Feature Gating and Usage Limits calculation based on subscription tier.
 *
 * Responsibilities:
 * - Calculate UsageLimits based on subscription tier
 * - Implement Feature Gating logic (canAccessFeature)
 * - Pure business logic without external dependencies
 *
 * @module features/subscription/core/service
 */

import type { UsageLimits, FeatureLevel, Subscription } from './types';
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
