/**
 * RevenueCat Template - useRevenueCat Hook
 *
 * Thin wrapper around the RevenueCat context.
 * For subscription operations, prefer useSubscription hook.
 */

import { useContext } from 'react';
import { RevenueCatContext, type RevenueCatContextValue } from './RevenueCatProvider';

/**
 * Hook to access RevenueCat context.
 *
 * Returns:
 *   - customerInfo: Raw RevenueCat customer info
 *   - loading: True while initializing
 *   - configured: True when SDK is ready
 *   - error: Error if initialization failed
 *   - retryAvailable: True if retry is possible
 *   - retry: Function to retry initialization
 *
 * Usage:
 *   const { customerInfo, loading, error } = useRevenueCat();
 */
export function useRevenueCat(): RevenueCatContextValue {
  const context = useContext(RevenueCatContext);

  if (!context) {
    throw new Error('useRevenueCat must be used within RevenueCatProvider');
  }

  return context;
}
