/**
 * Subscription Feature Module
 *
 * Complete subscription monetization implementation with RevenueCat.
 * Includes SDK configuration, domain models, repositories, services,
 * React Context providers, hooks, and UI components.
 *
 * @module features/subscription
 */

// Core exports
export type {
  Subscription,
  UsageLimits,
  SubscriptionPackage,
  FeatureLevel,
  SubscriptionError,
  Result,
} from './core';

// Provider exports
export { SubscriptionProvider, useSubscriptionContext } from './providers';

export type {
  SubscriptionContextValue,
  SubscriptionProviderProps,
} from './providers';

// Hook exports
export { useSubscription } from './hooks';

export type { UseSubscriptionReturn } from './hooks';

// Component exports
export { Paywall } from './components';

export type { PaywallProps } from './components';
