/**
 * Provider Lifecycle Integration Tests
 *
 * End-to-end integration tests for SubscriptionProvider lifecycle events.
 * Tests initialization, fetching on mount, and concurrent request prevention.
 *
 * @module features/subscription/__tests__/integration/provider-lifecycle.integration.test
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';

import Purchases, {
  resetMock,
  setupFreeUserMock,
  setupPremiumUserMock,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';

import { useStore } from '@/store';
import {
  SubscriptionProvider,
  useSubscriptionContext,
} from '../../providers/subscription-provider';
import { createSubscriptionService } from '../../core/service';
import { subscriptionRepository } from '../../core/repository';
import { createStoreIntegration } from '../../core/store-integration';

// Create service with real repository and store integration
const createIntegrationService = () => {
  return createSubscriptionService({
    repository: subscriptionRepository,
    ...createStoreIntegration(),
  });
};

// Test consumer component
function TestConsumer({
  onReady,
}: {
  onReady?: (context: ReturnType<typeof useSubscriptionContext>) => void;
}): React.JSX.Element {
  const context = useSubscriptionContext();

  React.useEffect(() => {
    if (!context.loading && onReady) {
      onReady(context);
    }
  }, [context, context.loading, onReady]);

  return (
    <>
      <Text testID="loading">{context.loading.toString()}</Text>
      <Text testID="subscription-tier">
        {context.subscription?.tier ?? 'null'}
      </Text>
      <Text testID="subscription-active">
        {context.subscription?.isActive?.toString() ?? 'null'}
      </Text>
      <Text testID="error-code">{context.error?.code ?? 'null'}</Text>
      <Text testID="error-retryable">
        {context.error?.retryable?.toString() ?? 'null'}
      </Text>
    </>
  );
}

describe('Provider Lifecycle Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMock();
    useStore.setState({
      isPremium: false,
      isRevenueCatAvailable: false,
    });
  });

  describe('Initialization (fetchCustomerInfo on mount)', () => {
    // Given: Fresh SubscriptionProvider mounted with service instance
    // When: Provider mounts (useEffect runs)
    // Then: service.getSubscription() is called automatically
    it('should fetch subscription on mount', async () => {
      resetMock();
      setupFreeUserMock();
      const service = createIntegrationService();

      const { getByTestId } = render(
        <SubscriptionProvider service={service}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(Purchases.getCustomerInfo).toHaveBeenCalled();
        expect(getByTestId('loading').props.children).toBe('false');
      });
    });

    // Given: Provider mounts
    // When: Initial fetch in progress
    // Then: Loading state is true initially
    it('should set loading to true during initial fetch', () => {
      resetMock();

      // Make getCustomerInfo never resolve
      (Purchases.getCustomerInfo as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      const service = createIntegrationService();

      const { getByTestId } = render(
        <SubscriptionProvider service={service}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      expect(getByTestId('loading').props.children).toBe('true');
    });

    // Given: Provider mounts with free user
    // When: Fetch completes
    // Then: Loading becomes false and subscription state is populated
    it('should populate subscription state after initial fetch', async () => {
      resetMock();
      setupFreeUserMock();
      const service = createIntegrationService();

      const { getByTestId } = render(
        <SubscriptionProvider service={service}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
        expect(getByTestId('subscription-tier').props.children).toBe('free');
      });
    });

    // Given: Provider mounts with premium user
    // When: Fetch completes
    // Then: Subscription shows premium and Zustand store is synced
    it('should sync premium subscription to store on mount', async () => {
      resetMock();
      setupPremiumUserMock();
      const service = createIntegrationService();

      const { getByTestId } = render(
        <SubscriptionProvider service={service}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
        expect(getByTestId('subscription-active').props.children).toBe('true');
      });

      // Verify Zustand store synchronized
      expect(useStore.getState().isPremium).toBe(true);
    });
  });

  describe('Error Handling on Mount', () => {
    // Given: Mock SDK fails getCustomerInfo() with NETWORK_ERROR
    // When: SubscriptionProvider mounts
    // Then: Error state is set, service falls back to free tier
    it('should handle network error during initial fetch', async () => {
      (Purchases.getCustomerInfo as jest.Mock).mockRejectedValue({
        code: PURCHASES_ERROR_CODE.NETWORK_ERROR,
        message: 'Network error',
      });

      const service = createIntegrationService();

      const { getByTestId } = render(
        <SubscriptionProvider service={service}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
        expect(getByTestId('error-code').props.children).toBe('NETWORK_ERROR');
        expect(getByTestId('error-retryable').props.children).toBe('true');
      });

      // Should fall back to free tier
      expect(useStore.getState().isPremium).toBe(false);
    });

    // Given: Mock SDK fails with CONFIGURATION_ERROR
    // When: SubscriptionProvider mounts
    // Then: Error state is set with retryable: false
    it('should handle configuration error during initial fetch', async () => {
      (Purchases.getCustomerInfo as jest.Mock).mockRejectedValue({
        code: PURCHASES_ERROR_CODE.CONFIGURATION_ERROR,
        message: 'Configuration error',
      });

      const service = createIntegrationService();

      const { getByTestId } = render(
        <SubscriptionProvider service={service}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
        expect(getByTestId('error-code').props.children).toBe(
          'CONFIGURATION_ERROR'
        );
        expect(getByTestId('error-retryable').props.children).toBe('false');
      });
    });
  });

  describe('Refetch Subscription', () => {
    // Given: SubscriptionProvider already mounted and initialized
    // When: refetchSubscription() is called
    // Then: fetchSubscription() is called again, state updated if changed
    it('should refetch subscription state', async () => {
      resetMock();
      setupFreeUserMock();
      const service = createIntegrationService();

      let contextRef: ReturnType<typeof useSubscriptionContext> | null = null;

      const { getByTestId } = render(
        <SubscriptionProvider service={service}>
          <TestConsumer
            onReady={(ctx) => {
              contextRef = ctx;
            }}
          />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });

      // Clear mock calls
      jest.clearAllMocks();

      // Directly mock getCustomerInfo to return premium
      const now = Date.now();
      const expirationIso = new Date(
        now + 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      (Purchases.getCustomerInfo as jest.Mock).mockResolvedValue({
        entitlements: {
          active: {
            premium: {
              identifier: 'premium',
              isActive: true,
              expirationDate: expirationIso,
              productIdentifier: 'monthly_plan',
            },
          },
          all: {},
        },
        activeSubscriptions: ['monthly_plan'],
        allPurchasedProductIdentifiers: ['monthly_plan'],
        latestExpirationDate: expirationIso,
        originalAppUserId: 'test-user-123',
        originalApplicationVersion: null,
        originalPurchaseDate: new Date(now).toISOString(),
      });

      // Refetch
      await act(async () => {
        await contextRef!.refetchSubscription();
      });

      await waitFor(() => {
        expect(Purchases.getCustomerInfo).toHaveBeenCalled();
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
      });

      expect(useStore.getState().isPremium).toBe(true);
    });

    // Given: Provider already has subscription state
    // When: refetchSubscription() is called
    // Then: Refetch completes successfully
    it('should complete refetch successfully', async () => {
      resetMock();
      setupFreeUserMock();
      const service = createIntegrationService();

      let contextRef: ReturnType<typeof useSubscriptionContext> | null = null;

      const { getByTestId } = render(
        <SubscriptionProvider service={service}>
          <TestConsumer
            onReady={(ctx) => {
              contextRef = ctx;
            }}
          />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
        expect(contextRef).not.toBeNull();
      });

      // Refetch should complete successfully
      await act(async () => {
        await contextRef!.refetchSubscription();
      });

      // After refetch, loading should be false
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });
    });
  });

  describe('Concurrent Request Prevention', () => {
    // Given: SubscriptionProvider with isProcessing.current = true
    // When: User attempts another purchase while one is in progress
    // Then: Second purchase request is ignored
    it('should prevent duplicate fetch requests', async () => {
      setupFreeUserMock();

      // Make getCustomerInfo slow - use mockImplementationOnce for initial call,
      // then set up a deferred promise for subsequent calls
      let resolveGetCustomerInfo: ((value: unknown) => void) | null = null;

      // First call returns immediately (initial load)
      (Purchases.getCustomerInfo as jest.Mock).mockResolvedValueOnce({
        entitlements: { active: {}, all: {} },
        activeSubscriptions: [],
        allPurchasedProductIdentifiers: [],
        latestExpirationDate: null,
        originalAppUserId: 'test',
        originalApplicationVersion: null,
        originalPurchaseDate: null,
      });

      // Subsequent calls will be slow
      (Purchases.getCustomerInfo as jest.Mock).mockImplementation(() => {
        return new Promise((resolve) => {
          resolveGetCustomerInfo = resolve;
        });
      });

      const service = createIntegrationService();
      let contextRef: ReturnType<typeof useSubscriptionContext> | null = null;
      let contextReceived = false;

      function AsyncConsumer(): React.JSX.Element {
        const context = useSubscriptionContext();

        React.useEffect(() => {
          if (!contextReceived) {
            contextReceived = true;
            contextRef = context;
          }
        });

        return <Text testID="loading">{context.loading.toString()}</Text>;
      }

      render(
        <SubscriptionProvider service={service}>
          <AsyncConsumer />
        </SubscriptionProvider>
      );

      // Wait for context to be available and initial load to complete
      await waitFor(() => {
        expect(contextRef).not.toBeNull();
      });

      // Clear initial call count (but keep the mockImplementation)
      (Purchases.getCustomerInfo as jest.Mock).mockClear();

      // Trigger multiple refetches simultaneously
      const refetch1 = contextRef!.refetchSubscription();
      const refetch2 = contextRef!.refetchSubscription();
      const refetch3 = contextRef!.refetchSubscription();

      // Resolve the pending request
      await act(async () => {
        resolveGetCustomerInfo!({
          entitlements: { active: {}, all: {} },
          activeSubscriptions: [],
          allPurchasedProductIdentifiers: [],
          latestExpirationDate: null,
          originalAppUserId: 'test',
          originalApplicationVersion: null,
          originalPurchaseDate: null,
        });
        await Promise.all([refetch1, refetch2, refetch3]);
      });

      // Should only call getCustomerInfo once (concurrent requests prevented)
      expect(Purchases.getCustomerInfo).toHaveBeenCalledTimes(1);
    });

    // Given: Provider with loading state true
    // When: Multiple purchases attempted
    // Then: Only first purchase is processed
    it('should prevent duplicate purchase requests', async () => {
      setupFreeUserMock();

      const service = createIntegrationService();
      let contextRef: ReturnType<typeof useSubscriptionContext> | null = null;

      const { getByTestId } = render(
        <SubscriptionProvider service={service}>
          <TestConsumer
            onReady={(ctx) => {
              contextRef = ctx;
            }}
          />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });

      // Set up slow purchase process by making getOfferings slow
      // (purchasePackage calls getOfferings first)
      let resolveOfferings: ((value: unknown) => void) | null = null;
      (Purchases.getOfferings as jest.Mock).mockImplementation(() => {
        return new Promise((resolve) => {
          resolveOfferings = resolve;
        });
      });

      // Clear call counts (but keep the mockImplementation)
      (Purchases.getOfferings as jest.Mock).mockClear();

      // Trigger multiple purchases
      const purchase1 = contextRef!.purchasePackage('$rc_monthly');
      const purchase2 = contextRef!.purchasePackage('$rc_monthly');
      const purchase3 = contextRef!.purchasePackage('$rc_monthly');

      // Resolve the offerings request
      await act(async () => {
        resolveOfferings!({
          current: {
            identifier: 'default',
            serverDescription: 'Default offering',
            metadata: {},
            availablePackages: [
              {
                identifier: '$rc_monthly',
                packageType: 'MONTHLY',
                product: {
                  identifier: 'monthly_plan',
                  description: 'Monthly subscription',
                  title: 'Monthly',
                  price: 9.99,
                  priceString: '$9.99',
                  currencyCode: 'USD',
                },
                offeringIdentifier: 'default',
              },
            ],
          },
          all: {},
        });
        await Promise.all([purchase1, purchase2, purchase3]);
      });

      // Should only call getOfferings once (concurrent requests prevented)
      // Note: We verify via getOfferings since purchasePackage internally calls getOfferings first
      expect(Purchases.getOfferings).toHaveBeenCalledTimes(1);
    });
  });
});
