/**
 * Subscription Provider
 *
 * React Context provider that manages subscription state and provides
 * subscription actions to all child components.
 *
 * Responsibilities:
 * - Fetch subscription state on mount (from SubscriptionService)
 * - Manage loading and error states
 * - Provide purchase, restore, and refetch actions
 * - Prevent duplicate requests during loading
 *
 * @module features/subscription/providers/subscription-provider
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import type { Subscription, SubscriptionError } from '../core/types';
import type { SubscriptionService } from '../core/service';

/**
 * Subscription context value interface.
 *
 * Provides subscription state and actions to consuming components.
 */
export interface SubscriptionContextValue {
  /** Current subscription state (null until loaded) */
  subscription: Subscription | null;
  /** Whether a subscription operation is in progress */
  loading: boolean;
  /** Error from the last operation (null if no error) */
  error: SubscriptionError | null;

  /**
   * Purchase a subscription package.
   * Sets loading to true and prevents duplicate requests.
   *
   * @param packageId - Package identifier (e.g., "$rc_monthly", "$rc_annual")
   */
  purchasePackage: (packageId: string) => Promise<void>;

  /**
   * Restore previous purchases.
   * Sets loading to true and prevents duplicate requests.
   */
  restorePurchases: () => Promise<void>;

  /**
   * Refetch subscription state from RevenueCat.
   * Useful after external events that might change subscription status.
   */
  refetchSubscription: () => Promise<void>;
}

/**
 * React Context for subscription state.
 * Must be used within SubscriptionProvider.
 */
const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null
);

/**
 * Props for SubscriptionProvider component.
 */
export interface SubscriptionProviderProps {
  /** Child components to wrap */
  children: React.ReactNode;
  /** Subscription service instance for data access */
  service: SubscriptionService;
}

/**
 * Subscription Provider Component.
 *
 * Wraps the application (or a subtree) to provide subscription state
 * and actions to all descendant components via React Context.
 *
 * Features:
 * - Fetches subscription state on mount
 * - Manages loading state to prevent duplicate requests
 * - Provides purchase, restore, and refetch actions
 * - Clears error state on successful operations
 *
 * @example
 * ```tsx
 * import { SubscriptionProvider } from '@/features/subscription/providers';
 * import { createSubscriptionService, subscriptionRepository } from '@/features/subscription/core';
 *
 * const service = createSubscriptionService({ repository: subscriptionRepository });
 *
 * function App() {
 *   return (
 *     <SubscriptionProvider service={service}>
 *       <MyApp />
 *     </SubscriptionProvider>
 *   );
 * }
 * ```
 */
export function SubscriptionProvider({
  children,
  service,
}: SubscriptionProviderProps): React.JSX.Element {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SubscriptionError | null>(null);

  // Track if a request is in progress to prevent duplicates
  const isProcessing = useRef(false);

  /**
   * Fetch subscription state from service.
   * Called on mount and when refetchSubscription is invoked.
   */
  const fetchSubscription = useCallback(async () => {
    if (isProcessing.current) {
      return;
    }

    isProcessing.current = true;
    setLoading(true);

    try {
      const result = await service.getSubscription();

      if (result.success) {
        setSubscription(result.data);
        setError(null);
      } else {
        setError(result.error);
        // Keep existing subscription or use service's current state
        setSubscription(service.getCurrentSubscription());
      }
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  }, [service]);

  // Fetch subscription on mount
  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  /**
   * Purchase a subscription package.
   */
  const purchasePackage = useCallback(
    async (packageId: string): Promise<void> => {
      if (isProcessing.current) {
        return;
      }

      isProcessing.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await service.purchasePackage(packageId);

        if (result.success) {
          setSubscription(result.data);
          setError(null);
        } else {
          setError(result.error);
        }
      } finally {
        setLoading(false);
        isProcessing.current = false;
      }
    },
    [service]
  );

  /**
   * Restore previous purchases.
   */
  const restorePurchases = useCallback(async (): Promise<void> => {
    if (isProcessing.current) {
      return;
    }

    isProcessing.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await service.restorePurchases();

      if (result.success) {
        setSubscription(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  }, [service]);

  /**
   * Refetch subscription state.
   */
  const refetchSubscription = useCallback(async (): Promise<void> => {
    await fetchSubscription();
  }, [fetchSubscription]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<SubscriptionContextValue>(
    () => ({
      subscription,
      loading,
      error,
      purchasePackage,
      restorePurchases,
      refetchSubscription,
    }),
    [
      subscription,
      loading,
      error,
      purchasePackage,
      restorePurchases,
      refetchSubscription,
    ]
  );

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to access subscription context.
 *
 * Must be used within a SubscriptionProvider.
 *
 * @returns SubscriptionContextValue with state and actions
 * @throws Error if used outside SubscriptionProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { subscription, loading, purchasePackage } = useSubscriptionContext();
 *
 *   if (loading) return <LoadingSpinner />;
 *
 *   return (
 *     <View>
 *       <Text>Tier: {subscription?.tier}</Text>
 *       <Button onPress={() => purchasePackage('$rc_monthly')}>
 *         Upgrade
 *       </Button>
 *     </View>
 *   );
 * }
 * ```
 */
export function useSubscriptionContext(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);

  if (context === null) {
    throw new Error(
      'useSubscriptionContext must be used within a SubscriptionProvider'
    );
  }

  return context;
}
