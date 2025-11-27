/**
 * RevenueCat Template - useSubscription Hook
 *
 * Main hook for subscription operations in your app.
 * Provides a React-friendly interface to subscription functionality.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SubscriptionService } from './service';
import { FREE_TIER_LIMITS } from './config';
import type {
  SubscriptionStatus,
  PurchaseResult,
  RestoreResult,
  PackagesResult,
  SubscriptionPackage,
  FeatureLevel,
  Subscription,
  UsageLimits,
} from './types';

// Singleton service instance
let serviceInstance: SubscriptionService | null = null;

function getSubscriptionService(): SubscriptionService {
  if (!serviceInstance) {
    serviceInstance = new SubscriptionService();
  }
  return serviceInstance;
}

/**
 * Hook return type
 */
export interface UseSubscriptionReturn {
  // Subscription status
  subscription: Subscription | undefined;
  usageLimits: UsageLimits;
  isSubscribed: boolean;
  isPremium: boolean;
  isFree: boolean;

  // Loading states
  loading: boolean;
  isLoading: boolean;
  purchaseLoading: boolean;
  restoreLoading: boolean;
  packagesLoading: boolean;

  // Error state
  error: string | null;
  packagesError: string | null;

  // Actions
  purchasePackage: (packageId: string) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<RestoreResult>;
  getAvailablePackages: () => Promise<PackagesResult>;
  canAccessFeature: (featureLevel: FeatureLevel) => boolean;
  hasEntitlement: (entitlementId: string) => Promise<boolean>;

  // Utilities
  refresh: () => Promise<void>;
  refreshPackages: () => Promise<PackagesResult>;
  clearError: () => void;

  // Packages
  packages: SubscriptionPackage[];
}

/**
 * Main hook for subscription operations.
 *
 * Usage:
 *   const {
 *     isPremium,
 *     usageLimits,
 *     purchasePackage,
 *     packages,
 *   } = useSubscription();
 *
 *   if (!isPremium && items.length >= usageLimits.maxItems) {
 *     // Show upgrade prompt
 *   }
 */
export function useSubscription(): UseSubscriptionReturn {
  const subscriptionService = useRef(getSubscriptionService());

  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);

  /**
   * Loads the current subscription status
   */
  const loadSubscriptionStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await subscriptionService.current.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to load subscription status';
      setError(errorMessage);
      setSubscriptionStatus(null);
      console.error('Failed to load subscription status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Loads available subscription packages
   */
  const loadAvailablePackages =
    useCallback(async (): Promise<PackagesResult> => {
      setPackagesLoading(true);
      try {
        const result = await subscriptionService.current.getAvailablePackages();
        setPackages(result.packages);
        setPackagesError(result.error ?? null);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to load subscription packages';
        console.error('Failed to load available packages:', err);
        setPackages([]);
        setPackagesError(errorMessage);
        return {
          packages: [],
          error: errorMessage,
        };
      } finally {
        setPackagesLoading(false);
      }
    }, []);

  /**
   * Purchases a subscription package
   */
  const purchasePackage = useCallback(
    async (packageId: string): Promise<PurchaseResult> => {
      setPurchaseLoading(true);
      setError(null);

      try {
        const result =
          await subscriptionService.current.purchasePackage(packageId);

        if (result.success) {
          await loadSubscriptionStatus();
        } else if (result.error) {
          setError(result.error);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Purchase failed';
        setError(errorMessage);
        return {
          success: false,
          subscription: null,
          error: errorMessage,
        };
      } finally {
        setPurchaseLoading(false);
      }
    },
    [loadSubscriptionStatus]
  );

  /**
   * Restores previous purchases
   */
  const restorePurchases = useCallback(async (): Promise<RestoreResult> => {
    setRestoreLoading(true);
    setError(null);

    try {
      const result = await subscriptionService.current.restorePurchases();

      if (result.success) {
        await loadSubscriptionStatus();
      } else if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Restore failed';
      setError(errorMessage);
      return {
        success: false,
        subscription: null,
        error: errorMessage,
      };
    } finally {
      setRestoreLoading(false);
    }
  }, [loadSubscriptionStatus]);

  /**
   * Gets available packages
   */
  const getAvailablePackages =
    useCallback(async (): Promise<PackagesResult> => {
      return await loadAvailablePackages();
    }, [loadAvailablePackages]);

  /**
   * Checks if user can access a specific feature level
   */
  const canAccessFeature = useCallback(
    (featureLevel: FeatureLevel): boolean => {
      return subscriptionStatus?.canAccessFeature(featureLevel) ?? false;
    },
    [subscriptionStatus]
  );

  /**
   * Checks if user has a specific entitlement
   */
  const hasEntitlement = useCallback(
    async (entitlementId: string): Promise<boolean> => {
      try {
        return await subscriptionService.current.hasEntitlement(entitlementId);
      } catch (err) {
        console.error('Failed to check entitlement:', err);
        return false;
      }
    },
    []
  );

  // Load subscription status on mount
  useEffect(() => {
    void loadSubscriptionStatus();
    void loadAvailablePackages();
  }, [loadSubscriptionStatus, loadAvailablePackages]);

  // Derived state for convenience
  const isSubscribed = subscriptionStatus?.isSubscribed ?? false;
  const isPremium = subscriptionStatus?.isPremium ?? false;
  const isFree = subscriptionStatus?.isFree ?? true;

  // CUSTOMIZE: Update these default values to match your FREE_TIER_LIMITS
  const usageLimits = subscriptionStatus?.usageLimits ?? FREE_TIER_LIMITS;

  return {
    // Subscription status
    subscription: subscriptionStatus?.subscription,
    usageLimits,
    isSubscribed,
    isPremium,
    isFree,

    // Loading states
    loading,
    isLoading: loading,
    purchaseLoading,
    restoreLoading,
    packagesLoading,

    // Error state
    error,
    packagesError,

    // Actions
    purchasePackage,
    restorePurchases,
    getAvailablePackages,
    canAccessFeature,
    hasEntitlement,

    // Utilities
    refresh: loadSubscriptionStatus,
    refreshPackages: loadAvailablePackages,
    clearError: () => {
      setError(null);
      setPackagesError(null);
    },

    // Packages
    packages,
  };
}
