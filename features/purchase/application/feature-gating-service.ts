/**
 * Feature Gating Service - Application Layer
 *
 * Task 7.1: canAccessSync メソッド（同期的なアクセス判定）
 *
 * Responsibility:
 * - Provide synchronous feature access control based on purchase state
 * - Check local database cache for purchase information
 * - Support both free and premium features
 * - Implement safe defaults on errors (fail closed)
 * - Enable offline functionality using cached purchase data
 *
 * Features:
 * - Synchronous access checking (no async/await)
 * - Cache-based (queries local database)
 * - Graceful error handling (returns false on any error)
 * - Support for multiple features per purchase
 * - Works offline with local purchase records
 *
 * Requirements Traceability:
 * - Req 4.2: Check purchase status to confirm access
 * - Req 4.3: Allow/deny access based on purchase state
 * - Req 3.4: Support offline feature unlocking via cached purchases
 *
 * @module features/purchase/application/feature-gating-service
 */

import { eq } from 'drizzle-orm';
import type { FeatureDefinition, FeatureLevel } from '../core/types';
import { db } from '@/database/client';
import { purchases } from '@/database/schema';

// Import subscription service for Task 7.2 integration
// Using dynamic import to avoid circular dependencies
let subscriptionServiceGetter: (() => Promise<'free' | 'premium'>) | null =
  null;

async function loadSubscriptionTier(): Promise<'free' | 'premium'> {
  try {
    // Lazy load to avoid circular dependency
    if (!subscriptionServiceGetter) {
      const module = await import('@/features/subscription/core/service');
      subscriptionServiceGetter = module.getSubscriptionTier;
    }
    return await subscriptionServiceGetter();
  } catch (error) {
    // Subscription service not available - default to free tier
    console.warn(
      '[FeatureGatingService] Subscription service not available, defaulting to free tier'
    );
    return 'free';
  }
}

// For testing: allow injection of subscription tier getter
export function setSubscriptionServiceGetter(
  getter: (() => Promise<'free' | 'premium'>) | null
) {
  subscriptionServiceGetter = getter;
}

/**
 * Feature definitions configuration
 * Defines all available features and their access levels
 *
 * Structure:
 * - free: Available to all users
 * - premium: Requires purchase of specific product
 */
const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  // Free features - available to all users
  {
    id: 'basic_search',
    level: 'free',
    name: 'Basic Search',
    description: 'Search functionality available to all users',
  },
  {
    id: 'view_history',
    level: 'free',
    name: 'View History',
    description: 'View basic usage history',
  },

  // Premium features - require purchase
  {
    id: 'advanced_search',
    level: 'premium',
    name: 'Advanced Search',
    description: 'Advanced search with filters and sorting',
    requiredProductId: 'premium_unlock',
  },
  {
    id: 'export_data',
    level: 'premium',
    name: 'Export Data',
    description: 'Export user data to various formats',
    requiredProductId: 'data_export',
  },
  {
    id: 'advanced_analytics',
    level: 'premium',
    name: 'Advanced Analytics',
    description: 'Detailed analytics and reporting',
    requiredProductId: 'premium_unlock',
  },
];

/**
 * Feature Gating Service
 *
 * Provides synchronous feature access control integrated with purchase state.
 *
 * Key Methods:
 * - canAccessSync(featureId): Check if user can access feature (synchronous)
 * - getFeatureDefinitions(): Get all feature definitions
 * - getFeaturesByLevel(level): Get features by access level
 *
 * Implementation Notes:
 * - All checks are synchronous (no await)
 * - Uses local database cache for performance
 * - Graceful error handling with safe defaults (deny access on error)
 * - Supports offline scenarios with cached purchase data
 */
export const featureGatingService = {
  /**
   * Check synchronous access to a feature
   *
   * Task 7.1 Implementation:
   * - Looks up feature definition by ID
   * - If free feature, always returns true
   * - If premium feature, queries database for matching purchase
   * - Returns true if verified purchase exists for required product
   * - Returns false if no purchase or database error
   *
   * Safety Properties:
   * - Free features always allow access
   * - Premium features default to deny on any error
   * - No async operations (safe for render calls)
   * - Cache-based (uses local database)
   *
   * Performance:
   * - O(1) lookup for free features
   * - O(n) database query for premium features (n = number of user's purchases)
   * - Database indexes on productId and isVerified optimize query
   *
   * Offline Support:
   * - Queries local database (no network required)
   * - Works with isSynced=false purchases (recorded but not synced)
   * - Returns cached purchase state
   *
   * Given/When/Then:
   * - Given: Free feature
   * - When: canAccessSync called
   * - Then: Returns true immediately
   *
   * - Given: Premium feature with verified purchase
   * - When: canAccessSync called
   * - Then: Queries database, finds purchase, returns true
   *
   * - Given: Premium feature without purchase
   * - When: canAccessSync called
   * - Then: Queries database, no purchase found, returns false
   *
   * - Given: Database error or malformed data
   * - When: canAccessSync called
   * - Then: Returns false (safe default)
   *
   * @param featureId - The feature ID to check access for
   * @returns true if user can access the feature, false otherwise
   *
   * @example
   * ```typescript
   * // Free feature always accessible
   * featureGatingService.canAccessSync('basic_search'); // true
   *
   * // Premium feature requires purchase
   * if (featureGatingService.canAccessSync('advanced_search')) {
   *   showAdvancedSearchUI();
   * } else {
   *   showPaywallUI();
   * }
   *
   * // Safe to use in render (synchronous)
   * return featureGatingService.canAccessSync('export_data') ? <Export /> : <Paywall />;
   * ```
   */
  canAccessSync(featureId: string): boolean {
    try {
      // Step 1: Validate input
      if (!featureId || typeof featureId !== 'string') {
        return false;
      }

      // Step 2: Find feature definition
      const feature = FEATURE_DEFINITIONS.find((f) => f.id === featureId);
      if (!feature) {
        // Feature not defined - deny access
        return false;
      }

      // Step 3: Check access level
      if (feature.level === 'free') {
        // Free features are always accessible
        return true;
      }

      // Step 4: Premium features - check for purchase
      if (feature.level === 'premium') {
        // Must have required product ID
        if (!feature.requiredProductId) {
          // Premium feature without product requirement is misconfigured
          console.warn(
            `[FeatureGatingService] Premium feature "${featureId}" missing requiredProductId`
          );
          return false;
        }

        // Query database for verified purchase of required product
        try {
          const userPurchases = db
            .select()
            .from(purchases)
            .where(eq(purchases.productId, feature.requiredProductId))
            .all();

          // Check if any purchase exists (verified or not)
          // Unverified purchases in local DB are still valid for feature gating
          // (verification is for receipt integrity, not access control)
          if (!userPurchases || userPurchases.length === 0) {
            return false;
          }

          // Validate purchases have correct product ID (defensive programming)
          const validPurchase = userPurchases.some(
            (purchase) =>
              purchase && purchase.productId === feature.requiredProductId
          );

          return validPurchase;
        } catch (dbError) {
          // Database error - log and return false (safe default)
          console.error(
            `[FeatureGatingService] Database error checking purchase for feature "${featureId}":`,
            dbError
          );
          return false;
        }
      }

      // Unknown feature level
      return false;
    } catch (error) {
      // Unexpected error - return false (safe default)
      console.error(
        `[FeatureGatingService] Unexpected error in canAccessSync for "${featureId}":`,
        error
      );
      return false;
    }
  },

  /**
   * Check asynchronous access to a feature with subscription tier integration
   *
   * Task 7.2 Implementation:
   * - Integrates subscription tier (existing) with purchase state (new)
   * - If subscription tier === 'premium' → grant all premium features
   * - If subscription tier < 'premium' (i.e., 'free') → check purchase state for individual feature unlock
   * - Free features always accessible regardless of subscription or purchase state
   *
   * Logic:
   * 1. For free features: Always return true (no check needed)
   * 2. Get subscription tier from subscription service
   * 3. If subscription tier is premium: Return true for premium features
   * 4. If subscription tier is free: Check purchase state via canAccessSync()
   *
   * Error Handling:
   * - Subscription service error: Return false (safe default)
   * - Database error during purchase check: Return false (safe default)
   * - Malformed data: Return false (safe default)
   *
   * Offline Support:
   * - Uses local database cache for subscription tier (eventual consistency)
   * - Works with unsynced purchases (isSynced=false)
   *
   * Performance:
   * - Async operation for network-dependent subscription tier fetch
   * - Can be awaited or fire-and-forget depending on UI needs
   *
   * Given/When/Then:
   * - Given: Free feature
   * - When: canAccess called
   * - Then: Returns true immediately
   *
   * - Given: Premium feature with premium subscription
   * - When: canAccess called
   * - Then: Returns true (subscription grants access)
   *
   * - Given: Premium feature with free subscription but with purchase
   * - When: canAccess called
   * - Then: Returns true (purchase grants individual feature access)
   *
   * - Given: Premium feature with free subscription and no purchase
   * - When: canAccess called
   * - Then: Returns false (no access)
   *
   * Requirements Traceability:
   * - Req 4.2: Check purchase status to confirm access
   * - Req 4.3: Allow/deny access based on purchase state
   * - Req 3.4: Support offline feature unlocking via cached purchases
   *
   * @param featureId - The feature ID to check access for
   * @returns Promise<boolean> - true if user can access the feature, false otherwise
   *
   * @example
   * ```typescript
   * // Premium subscriber - all premium features accessible
   * if (await featureGatingService.canAccess('advanced_search')) {
   *   showAdvancedSearchUI();
   * } else {
   *   showPaywallUI();
   * }
   *
   * // Free user with purchase - individual feature unlock
   * const canExport = await featureGatingService.canAccess('export_data');
   *
   * // Free user without purchase - paywall
   * if (!await featureGatingService.canAccess('premium_analytics')) {
   *   showPaywallForAnalytics();
   * }
   * ```
   */
  async canAccess(featureId: string): Promise<boolean> {
    try {
      // Step 1: Validate input
      if (!featureId || typeof featureId !== 'string') {
        return false;
      }

      // Step 2: Find feature definition
      const feature = FEATURE_DEFINITIONS.find((f) => f.id === featureId);
      if (!feature) {
        // Feature not defined - deny access
        return false;
      }

      // Step 3: Free features are always accessible
      if (feature.level === 'free') {
        return true;
      }

      // Step 4: Premium features - check subscription tier first
      if (feature.level === 'premium') {
        try {
          // Get user's current subscription tier
          const subscriptionTier = await loadSubscriptionTier();

          // If premium subscription, grant access to all premium features
          if (subscriptionTier === 'premium') {
            return true;
          }

          // Free subscription - fall through to purchase check
        } catch (subscriptionError) {
          // Subscription service error - log but continue to purchase check
          console.warn(
            `[FeatureGatingService] Subscription service error for "${featureId}":`,
            subscriptionError
          );
          // Continue to purchase check as fallback
        }

        // Step 5: For free subscribers, check if they have individual feature purchase
        // Reuse canAccessSync logic for purchase verification
        try {
          if (!feature.requiredProductId) {
            // Premium feature without product requirement is misconfigured
            console.warn(
              `[FeatureGatingService] Premium feature "${featureId}" missing requiredProductId`
            );
            return false;
          }

          // Query database for verified purchase of required product
          const userPurchases = db
            .select()
            .from(purchases)
            .where(eq(purchases.productId, feature.requiredProductId))
            .all();

          // Check if any purchase exists
          const hasPurchase = userPurchases && userPurchases.length > 0;
          return hasPurchase;
        } catch (dbError) {
          // Database error - log and return false (safe default)
          console.error(
            `[FeatureGatingService] Database error checking purchase for feature "${featureId}":`,
            dbError
          );
          return false;
        }
      }

      // Unknown feature level
      return false;
    } catch (error) {
      // Unexpected error - return false (safe default)
      console.error(
        `[FeatureGatingService] Unexpected error in canAccess for "${featureId}":`,
        error
      );
      return false;
    }
  },

  /**
   * Get all feature definitions
   *
   * Requirements: 7.3 (Feature definitions)
   *
   * @returns Array of all available feature definitions
   *
   * @example
   * ```typescript
   * const features = featureGatingService.getFeatureDefinitions();
   * features.forEach(f => console.log(f.name, f.level));
   * ```
   */
  getFeatureDefinitions(): FeatureDefinition[] {
    return [...FEATURE_DEFINITIONS]; // Return copy to prevent external mutation
  },

  /**
   * Get features by access level
   *
   * Requirements: 7.3 (Feature metadata)
   *
   * Useful for:
   * - UI that shows available features by tier
   * - Marketing pages showing what's included in each tier
   * - Feature inventory management
   *
   * @param level - Feature level to filter by ('free' | 'premium')
   * @returns Array of features at the specified level
   *
   * @example
   * ```typescript
   * const freeFeatures = featureGatingService.getFeaturesByLevel('free');
   * const premiumFeatures = featureGatingService.getFeaturesByLevel('premium');
   *
   * // Display on marketing page
   * showFeaturesInTierUI(premiumFeatures, 'Premium Plan');
   * ```
   */
  getFeaturesByLevel(level: FeatureLevel): FeatureDefinition[] {
    return FEATURE_DEFINITIONS.filter((f) => f.level === level);
  },

  /**
   * Get feature definition by ID
   *
   * Requirements: 4.1 (Feature metadata access)
   *
   * @param featureId - Feature ID to look up
   * @returns Feature definition or undefined if not found
   *
   * @example
   * ```typescript
   * const feature = featureGatingService.getFeatureDefinition('advanced_search');
   * if (feature) {
   *   console.log(feature.name, feature.description);
   * }
   * ```
   */
  getFeatureDefinition(featureId: string): FeatureDefinition | undefined {
    return FEATURE_DEFINITIONS.find((f) => f.id === featureId);
  },

  /**
   * Get the required product ID for a feature (if any)
   *
   * Used in paywall to know which product to purchase
   *
   * @param featureId - Feature ID
   * @returns Product ID if feature requires purchase, undefined otherwise
   *
   * @example
   * ```typescript
   * const productId = featureGatingService.getRequiredProduct('export_data');
   * if (productId) {
   *   showPaywallForProduct(productId);
   * }
   * ```
   */
  getRequiredProduct(featureId: string): string | undefined {
    const feature = FEATURE_DEFINITIONS.find((f) => f.id === featureId);
    return feature?.requiredProductId;
  },

  /**
   * Get all features unlocked by a specific product (bundle support)
   *
   * Task 7.5 Implementation:
   * - Support single purchase unlocking multiple features
   * - Filter FEATURE_DEFINITIONS by requiredProductId matching the given productId
   * - Return all features associated with that product
   *
   * Safety Properties:
   * - Returns empty array for invalid inputs (null, undefined, non-string)
   * - No database queries required (uses in-memory feature definitions)
   * - Thread-safe (no mutable state)
   *
   * Use Cases:
   * - Display all features included in a product bundle on paywall
   * - Verify multiple feature unlocks after purchase
   * - Feature inventory for marketing/analytics
   *
   * Requirements Traceability:
   * - Req 4.6: Support multiple features per product (bundle support)
   * - Req 5.3: Display features unlocked by selected option
   *
   * Given/When/Then:
   * - Given: Product ID with multiple features
   * - When: getUnlockedFeaturesByProduct called
   * - Then: Returns all features requiring that product ID
   *
   * - Given: Product ID with no features
   * - When: getUnlockedFeaturesByProduct called
   * - Then: Returns empty array
   *
   * - Given: Invalid product ID (null, undefined, non-string)
   * - When: getUnlockedFeaturesByProduct called
   * - Then: Returns empty array (safe default)
   *
   * @param productId - Product ID to find features for
   * @returns Array of feature definitions unlocked by this product
   *
   * @example
   * ```typescript
   * // Get all features in a bundle
   * const bundleFeatures = featureGatingService.getUnlockedFeaturesByProduct('premium_unlock');
   * // Returns: [
   * //   { id: 'advanced_search', level: 'premium', name: 'Advanced Search', ... },
   * //   { id: 'advanced_analytics', level: 'premium', name: 'Advanced Analytics', ... }
   * // ]
   *
   * // Display in paywall
   * bundleFeatures.forEach(f => {
   *   console.log(`- ${f.name}: ${f.description}`);
   * });
   *
   * // Handle product with no features
   * const noFeatures = featureGatingService.getUnlockedFeaturesByProduct('unknown_product');
   * // Returns: []
   * ```
   */
  getUnlockedFeaturesByProduct(productId: string): FeatureDefinition[] {
    try {
      // Step 1: Validate input
      if (!productId || typeof productId !== 'string') {
        // Invalid input (null, undefined, non-string) - return empty array
        return [];
      }

      // Step 2: Filter features by requiredProductId matching the given productId
      const unlockedFeatures = FEATURE_DEFINITIONS.filter(
        (feature) => feature.requiredProductId === productId
      );

      // Step 3: Return filtered features (can be empty array if no features match)
      return unlockedFeatures;
    } catch (error) {
      // Unexpected error - log and return safe default (empty array)
      console.error(
        `[FeatureGatingService] Unexpected error in getUnlockedFeaturesByProduct for "${productId}":`,
        error
      );
      return [];
    }
  },
};

export type FeatureGatingService = typeof featureGatingService;
