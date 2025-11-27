/**
 * RevenueCat Template - Configuration
 *
 * CUSTOMIZE THIS FILE for your app's specific subscription setup.
 */

import type { UsageLimits, FeatureLevel, Subscription } from './types';

// ============================================================
// Usage Limits Configuration
// ============================================================

/**
 * CUSTOMIZE: Define the limits for free tier users.
 *
 * Examples for different app types:
 *
 * File Storage App:
 *   FREE_TIER_LIMITS = { maxStorageMB: 100, maxUploads: 10, hasAds: true }
 *
 * Project Management App:
 *   FREE_TIER_LIMITS = { maxProjects: 3, maxTeamMembers: 1, hasAds: true }
 *
 * AI App:
 *   FREE_TIER_LIMITS = { maxRequests: 50, maxTokens: 10000, hasAds: true }
 */
export const FREE_TIER_LIMITS: UsageLimits = {
  maxItems: 10,
  maxExports: 1,
  hasAds: true,
};

/**
 * CUSTOMIZE: Define the limits for premium tier users.
 */
export const PREMIUM_TIER_LIMITS: UsageLimits = {
  maxItems: Infinity,
  maxExports: Infinity,
  hasAds: false,
};

// ============================================================
// Business Logic Functions
// ============================================================

/**
 * Gets usage limits based on subscription status.
 * Modify this if you have more than 2 tiers.
 */
export function getUsageLimits(subscription: Subscription): UsageLimits {
  if (!subscription.isActive || subscription.tier === 'free') {
    return FREE_TIER_LIMITS;
  }
  return PREMIUM_TIER_LIMITS;
}

/**
 * Checks if a subscription can access a specific feature level.
 */
export function canAccessFeature(
  subscription: Subscription,
  featureLevel: FeatureLevel
): boolean {
  // Basic features are always available
  if (featureLevel === 'basic') {
    return true;
  }
  // Premium features require active premium subscription
  return subscription.isActive && subscription.tier === 'premium';
}

/**
 * Determines if a subscription is premium
 */
export function isPremium(subscription: Subscription): boolean {
  return subscription.isActive && subscription.tier === 'premium';
}

/**
 * Determines if a subscription is free or inactive
 */
export function isFree(subscription: Subscription): boolean {
  return !subscription.isActive || subscription.tier === 'free';
}

/**
 * Gets the default free subscription
 */
export function getFreeSubscription(): Subscription {
  return {
    isActive: false,
    tier: 'free',
  };
}

/**
 * Creates a new subscription entity
 */
export function createSubscription(
  tier: 'free' | 'premium' = 'free'
): Subscription {
  return {
    isActive: true,
    tier,
  };
}
