/**
 * Store Synchronization Integration Tests
 *
 * End-to-end integration tests for Zustand store synchronization.
 * Tests that subscription state changes properly sync with isPremium flag.
 *
 * @module features/subscription/__tests__/integration/store-sync.integration.test
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';

import Purchases, {
  resetMock,
  setupFreeUserMock,
  setupPremiumUserMock,
  setupExpiredSubscriptionMock,
  setupCancelledSubscriptionMock,
  setupLifetimeSubscriptionMock,
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
      <Text testID="store-isPremium">
        {useStore.getState().isPremium.toString()}
      </Text>
    </>
  );
}

describe('Store Synchronization Integration', () => {
  beforeEach(() => {
    resetMock();
    useStore.setState({
      isPremium: false,
      isRevenueCatAvailable: false,
    });
    jest.clearAllMocks();
  });

  describe('Premium Subscription Sync', () => {
    // Given: Service state changes to premium subscription
    // When: onStateChange callback invoked with premium subscription
    // Then: useStore.getState().isPremium is true
    it('should sync premium subscription to store on purchase', async () => {
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

      // Initial state
      expect(useStore.getState().isPremium).toBe(false);

      // Purchase
      await act(async () => {
        await contextRef!.purchasePackage('$rc_monthly');
      });

      await waitFor(() => {
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
      });

      // Store should be synced
      expect(useStore.getState().isPremium).toBe(true);
    });

    // Given: Provider mounts with premium user
    // When: Fetch completes
    // Then: Store isPremium is true
    it('should sync premium subscription to store on mount', async () => {
      setupPremiumUserMock();
      const service = createIntegrationService();

      const { getByTestId } = render(
        <SubscriptionProvider service={service}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
      });

      expect(useStore.getState().isPremium).toBe(true);
    });
  });

  describe('Free Subscription Sync', () => {
    // Given: Service state changes to free subscription
    // When: onStateChange callback invoked with free subscription
    // Then: useStore.getState().isPremium is false
    it('should sync free subscription to store', async () => {
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

      expect(useStore.getState().isPremium).toBe(false);
    });

    // Given: Store was premium
    // When: Subscription changes to free (expired or cancelled)
    // Then: Store isPremium becomes false
    it('should sync from premium to free when subscription ends', async () => {
      setupPremiumUserMock();
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
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
      });

      // Should be premium initially
      expect(useStore.getState().isPremium).toBe(true);

      // Change to free user
      setupFreeUserMock();

      // Refetch
      await act(async () => {
        await contextRef!.refetchSubscription();
      });

      await waitFor(() => {
        expect(getByTestId('subscription-tier').props.children).toBe('free');
      });

      // Store should be updated
      expect(useStore.getState().isPremium).toBe(false);
    });
  });

  describe('Expired Premium Sync', () => {
    // Given: Service state changes to expired premium (tier: premium, isActive: false)
    // When: onStateChange callback invoked
    // Then: useStore.getState().isPremium is false (expired)
    it('should sync expired premium subscription as free', async () => {
      setupExpiredSubscriptionMock(1); // 1 day ago
      const service = createIntegrationService();

      const { getByTestId } = render(
        <SubscriptionProvider service={service}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
        // Expired subscriptions are converted to free tier by repository
        expect(getByTestId('subscription-tier').props.children).toBe('free');
      });

      // Expired premium should NOT grant premium access
      expect(useStore.getState().isPremium).toBe(false);
    });
  });

  describe('Active But Cancelled Subscription Sync', () => {
    // Given: Service state has cancelled subscription (still in grace period, isActive: true)
    // When: onStateChange callback invoked
    // Then: useStore.getState().isPremium is true (still active)
    it('should sync cancelled but still active subscription as premium', async () => {
      setupCancelledSubscriptionMock(7); // Expires in 7 days
      const service = createIntegrationService();

      const { getByTestId } = render(
        <SubscriptionProvider service={service}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
        expect(getByTestId('subscription-active').props.children).toBe('true');
      });

      // Still active, so should be premium
      expect(useStore.getState().isPremium).toBe(true);
    });
  });

  describe('Lifetime Subscription Sync', () => {
    // Given: User has lifetime subscription (no expiration)
    // When: Subscription fetched
    // Then: Store isPremium is true
    it('should sync lifetime subscription as premium', async () => {
      setupLifetimeSubscriptionMock();
      const service = createIntegrationService();

      const { getByTestId } = render(
        <SubscriptionProvider service={service}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
        expect(getByTestId('subscription-active').props.children).toBe('true');
      });

      expect(useStore.getState().isPremium).toBe(true);
    });
  });

  describe('State Change Transitions', () => {
    // Given: Multiple state changes occur
    // When: Each state change happens
    // Then: Store is updated on each change
    it('should update store on each state change', async () => {
      setupFreeUserMock();
      const service = createIntegrationService();

      let contextRef: ReturnType<typeof useSubscriptionContext> | null = null;
      const storeStates: boolean[] = [];

      function StateWatcher(): React.JSX.Element {
        const context = useSubscriptionContext();

        React.useEffect(() => {
          storeStates.push(useStore.getState().isPremium);
          if (!context.loading && !contextRef) {
            contextRef = context;
          }
        }, [context, context.subscription?.tier]);

        return (
          <Text testID="tier">{context.subscription?.tier ?? 'null'}</Text>
        );
      }

      const { getByTestId } = render(
        <SubscriptionProvider service={service}>
          <StateWatcher />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('tier').props.children).toBe('free');
      });

      // Initial state should be false
      expect(storeStates).toContain(false);

      // Purchase to become premium
      await act(async () => {
        await contextRef!.purchasePackage('$rc_monthly');
      });

      await waitFor(() => {
        expect(getByTestId('tier').props.children).toBe('premium');
      });

      // Store should have been updated to true
      expect(useStore.getState().isPremium).toBe(true);

      // Now set up free user and refetch
      setupFreeUserMock();

      await act(async () => {
        await contextRef!.refetchSubscription();
      });

      await waitFor(() => {
        expect(getByTestId('tier').props.children).toBe('free');
      });

      // Store should be back to false
      expect(useStore.getState().isPremium).toBe(false);
    });
  });

  describe('Restore and Store Sync', () => {
    // Given: User restores premium subscription
    // When: Restore completes
    // Then: Store isPremium is true
    it('should sync store after restore', async () => {
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

      expect(useStore.getState().isPremium).toBe(false);

      // Set up premium for restore
      setupPremiumUserMock();

      await act(async () => {
        await contextRef!.restorePurchases();
      });

      await waitFor(() => {
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
      });

      expect(useStore.getState().isPremium).toBe(true);
    });

    // Given: User restores but has no active subscription
    // When: Restore completes with no subscription
    // Then: Store isPremium remains false
    it('should keep store false when restore finds no subscription', async () => {
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

      expect(useStore.getState().isPremium).toBe(false);

      // Restore (still free user mock)
      await act(async () => {
        await contextRef!.restorePurchases();
      });

      // Should remain free
      expect(useStore.getState().isPremium).toBe(false);
    });
  });
});
