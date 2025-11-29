/**
 * useSubscription Hook
 *
 * Custom hook that provides subscription state and actions with derived state
 * (isPremium, isFree, usageLimits) and feature gating capability.
 *
 * This hook wraps useSubscriptionContext and adds:
 * - Derived state calculations (isPremium, isFree, usageLimits)
 * - Feature gating function (canAccessFeature)
 * - Memoization to prevent unnecessary re-renders
 *
 * @module features/subscription/hooks/use-subscription
 */

import { useMemo, useCallback } from 'react';
import { useSubscriptionContext } from '../providers/subscription-provider';
import type { UsageLimits, FeatureLevel } from '../core/types';
import { FREE_TIER_LIMITS, PREMIUM_TIER_LIMITS } from '../core/types';
import { canAccessFeature as checkFeatureAccess } from '../core/service';

/**
 * Return type for useSubscription hook.
 */
export interface UseSubscriptionReturn {
  /** Whether the user has a premium subscription */
  isPremium: boolean;
  /** Whether the user is on the free tier */
  isFree: boolean;
  /** Usage limits based on subscription tier */
  usageLimits: UsageLimits;
  /** Raw subscription state (null until loaded) */
  subscription: ReturnType<typeof useSubscriptionContext>['subscription'];
  /** Whether a subscription operation is in progress */
  loading: boolean;
  /** Error from the last operation (null if no error) */
  error: ReturnType<typeof useSubscriptionContext>['error'];
  /** Purchase a subscription package */
  purchasePackage: (packageId: string) => Promise<void>;
  /** Restore previous purchases */
  restorePurchases: () => Promise<void>;
  /** Check if user can access a feature based on feature level */
  canAccessFeature: (level: FeatureLevel) => boolean;
  /** Refetch subscription state from RevenueCat */
  refetchSubscription: () => Promise<void>;
}

/**
 * Hook to access subscription state, derived values, and actions.
 *
 * Must be used within a SubscriptionProvider.
 *
 * @returns UseSubscriptionReturn with state and actions
 * @throws Error if used outside SubscriptionProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     isPremium,
 *     isFree,
 *     usageLimits,
 *     canAccessFeature,
 *     purchasePackage,
 *   } = useSubscription();
 *
 *   if (!canAccessFeature('premium')) {
 *     return <UpgradePrompt onUpgrade={() => purchasePackage('$rc_monthly')} />;
 *   }
 *
 *   return (
 *     <View>
 *       <Text>Max items: {usageLimits.maxItems}</Text>
 *       {isPremium && <PremiumBadge />}
 *     </View>
 *   );
 * }
 * ```
 */
export function useSubscription(): UseSubscriptionReturn {
  const context = useSubscriptionContext();

  // Derive tier from subscription, default to 'free' if null
  const tier = context.subscription?.tier ?? 'free';

  // Derive isPremium and isFree from tier
  const isPremium = tier === 'premium';
  const isFree = tier === 'free';

  // Memoize usageLimits based on tier
  const usageLimits = useMemo<UsageLimits>(() => {
    return tier === 'premium' ? PREMIUM_TIER_LIMITS : FREE_TIER_LIMITS;
  }, [tier]);

  // Memoize canAccessFeature function based on tier
  const canAccessFeature = useCallback(
    (level: FeatureLevel): boolean => {
      return checkFeatureAccess(level, tier);
    },
    [tier]
  );

  return {
    // Derived state
    isPremium,
    isFree,
    usageLimits,
    // Raw state passthrough
    subscription: context.subscription,
    loading: context.loading,
    error: context.error,
    // Actions passthrough
    purchasePackage: context.purchasePackage,
    restorePurchases: context.restorePurchases,
    refetchSubscription: context.refetchSubscription,
    // Feature gating function
    canAccessFeature,
  };
}
