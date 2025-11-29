/**
 * Zustand Store Integration
 *
 * Provides integration between the Subscription Service and the Zustand store.
 * Synchronizes subscription state changes with the store's isPremium flag.
 *
 * This module bridges the subscription domain with the existing app state management,
 * maintaining compatibility with the existing store/slices/app-slice.ts structure.
 *
 * @module features/subscription/core/store-integration
 */

import { useStore } from '@/store';
import type { Subscription } from './types';

/**
 * Synchronize subscription state to the Zustand store.
 *
 * Updates the `isPremium` flag in the store based on the subscription tier.
 * This function directly mutates the store state using Zustand's getState().setPremium().
 *
 * Design Decision: We check both `tier` AND `isActive` to determine premium status.
 * - `tier === 'premium'` alone would grant access to expired subscriptions
 * - `isActive` ensures the subscription hasn't expired
 * - This prevents users with expired premium subscriptions from accessing premium features
 *
 * @param subscription - The current subscription state to sync
 *
 * @example
 * ```ts
 * const subscription = { tier: 'premium', isActive: true, ... };
 * syncSubscriptionToStore(subscription);
 * // useStore.getState().isPremium is now true
 *
 * const expiredSubscription = { tier: 'premium', isActive: false, ... };
 * syncSubscriptionToStore(expiredSubscription);
 * // useStore.getState().isPremium is now false (expired)
 * ```
 */
export function syncSubscriptionToStore(subscription: Subscription): void {
  const isPremium = subscription.tier === 'premium' && subscription.isActive;
  useStore.getState().setPremium(isPremium);
}

/**
 * Configuration object for subscription service with Zustand store integration.
 */
export interface StoreIntegrationConfig {
  /** Callback to sync subscription state changes to the store */
  onStateChange: (subscription: Subscription) => void;
}

/**
 * Create a store integration configuration for use with createSubscriptionService.
 *
 * Returns an object with an `onStateChange` callback that automatically
 * synchronizes subscription state changes to the Zustand store.
 *
 * @returns StoreIntegrationConfig object compatible with SubscriptionServiceConfig
 *
 * @example
 * ```ts
 * import { createSubscriptionService } from './service';
 * import { createStoreIntegration } from './store-integration';
 *
 * const service = createSubscriptionService({
 *   repository: subscriptionRepository,
 *   ...createStoreIntegration(),
 * });
 * ```
 */
export function createStoreIntegration(): StoreIntegrationConfig {
  return {
    onStateChange: syncSubscriptionToStore,
  };
}
