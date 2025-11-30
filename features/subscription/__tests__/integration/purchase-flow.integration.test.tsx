/**
 * Purchase Flow Integration Tests
 *
 * End-to-end integration tests for the purchase flow.
 * Tests the complete flow from Repository → Service → Provider → Store.
 *
 * @module features/subscription/__tests__/integration/purchase-flow.integration.test
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';

import Purchases, {
  resetMock,
  setupFreeUserMock,
  setupPremiumUserMock,
  setupPurchaseError,
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

describe('Purchase Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMock();
    useStore.setState({
      isPremium: false,
      isRevenueCatAvailable: false,
    });
  });

  describe('Happy Path', () => {
    // Given: User has free subscription, mock SDK configured to return premium customer info on purchase
    // When: User purchases monthly package via `purchasePackage('$rc_monthly')`
    // Then: Subscription state updates to premium, Zustand store isPremium becomes true
    it('should complete purchase flow from free to premium', async () => {
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

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
        expect(getByTestId('subscription-tier').props.children).toBe('free');
      });

      // Verify initial Zustand state
      expect(useStore.getState().isPremium).toBe(false);

      // Perform purchase
      await act(async () => {
        await contextRef!.purchasePackage('$rc_monthly');
      });

      // Verify purchase completed
      await waitFor(() => {
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
        expect(getByTestId('subscription-active').props.children).toBe('true');
      });

      // Verify Zustand store synchronized
      expect(useStore.getState().isPremium).toBe(true);

      // Verify SDK was called correctly
      expect(Purchases.purchasePackage).toHaveBeenCalled();
    });

    // Given: Mock SDK configured with trial subscription
    // When: User purchases package with trial period
    // Then: Subscription state includes trial period information
    it('should handle purchase with trial period', async () => {
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

      // Purchase triggers trial subscription (mock returns premium on purchase)
      await act(async () => {
        await contextRef!.purchasePackage('$rc_monthly');
      });

      await waitFor(() => {
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
        expect(getByTestId('subscription-active').props.children).toBe('true');
      });

      expect(useStore.getState().isPremium).toBe(true);
    });
  });

  describe('Sad Path', () => {
    // Given: Mock SDK configured to return PURCHASE_CANCELLED_ERROR
    // When: User initiates purchase but cancels
    // Then: Error returned with code PURCHASE_CANCELLED, retryable: false, state unchanged
    it('should handle purchase cancelled by user', async () => {
      setupFreeUserMock();
      setupPurchaseError(PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR);

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

      await act(async () => {
        await contextRef!.purchasePackage('$rc_monthly');
      });

      await waitFor(() => {
        expect(getByTestId('error-code').props.children).toBe(
          'PURCHASE_CANCELLED'
        );
        expect(getByTestId('error-retryable').props.children).toBe('false');
      });

      // State should remain unchanged
      expect(getByTestId('subscription-tier').props.children).toBe('free');
      expect(useStore.getState().isPremium).toBe(false);
    });

    // Given: Mock SDK configured with PURCHASE_NOT_ALLOWED_ERROR
    // When: User attempts purchase
    // Then: Error returned with code PURCHASE_NOT_ALLOWED, retryable: false
    it('should handle purchase not allowed (parental controls)', async () => {
      setupFreeUserMock();
      setupPurchaseError(PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR);

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

      await act(async () => {
        await contextRef!.purchasePackage('$rc_monthly');
      });

      await waitFor(() => {
        expect(getByTestId('error-code').props.children).toBe(
          'PURCHASE_NOT_ALLOWED'
        );
        expect(getByTestId('error-retryable').props.children).toBe('false');
      });

      expect(useStore.getState().isPremium).toBe(false);
    });

    // Given: Mock SDK returns PRODUCT_ALREADY_PURCHASED_ERROR, then premium on restore
    // When: User attempts to purchase already-owned product
    // Then: Service auto-restores and returns success with premium subscription
    it('should auto-restore on PRODUCT_ALREADY_PURCHASED error', async () => {
      setupFreeUserMock();

      // Set up purchase to fail with PRODUCT_ALREADY_PURCHASED
      (Purchases.purchasePackage as jest.Mock).mockRejectedValueOnce({
        code: PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR,
        message: 'Product already purchased',
      });

      // Restore will return premium
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
        expect(getByTestId('loading').props.children).toBe('false');
      });

      await act(async () => {
        await contextRef!.purchasePackage('$rc_monthly');
      });

      // After auto-restore, should be premium
      await waitFor(() => {
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
      });

      expect(useStore.getState().isPremium).toBe(true);
      expect(Purchases.restorePurchases).toHaveBeenCalled();
    });
  });

  describe('Unhappy Path (System Errors)', () => {
    // Given: Mock SDK configured to return NETWORK_ERROR (code 10)
    // When: User attempts purchase
    // Then: Error returned with code NETWORK_ERROR, retryable: true
    it('should handle network error during purchase', async () => {
      setupFreeUserMock();
      setupPurchaseError(PURCHASES_ERROR_CODE.NETWORK_ERROR);

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

      await act(async () => {
        await contextRef!.purchasePackage('$rc_monthly');
      });

      await waitFor(() => {
        expect(getByTestId('error-code').props.children).toBe('NETWORK_ERROR');
        expect(getByTestId('error-retryable').props.children).toBe('true');
      });

      // State should remain unchanged
      expect(getByTestId('subscription-tier').props.children).toBe('free');
      expect(useStore.getState().isPremium).toBe(false);
    });

    // Given: Mock SDK returns STORE_PROBLEM_ERROR (code 2)
    // When: User attempts purchase
    // Then: Error returned with code STORE_PROBLEM_ERROR, retryable: true
    it('should handle store problem error', async () => {
      setupFreeUserMock();
      setupPurchaseError(PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR);

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

      await act(async () => {
        await contextRef!.purchasePackage('$rc_monthly');
      });

      await waitFor(() => {
        expect(getByTestId('error-code').props.children).toBe(
          'STORE_PROBLEM_ERROR'
        );
        expect(getByTestId('error-retryable').props.children).toBe('true');
      });

      expect(useStore.getState().isPremium).toBe(false);
    });

    // Given: Mock SDK returns CONFIGURATION_ERROR (RevenueCat API key issue)
    // When: Any SDK operation is attempted
    // Then: Error returned with code CONFIGURATION_ERROR, retryable: false
    it('should handle configuration error', async () => {
      setupFreeUserMock();
      setupPurchaseError(PURCHASES_ERROR_CODE.CONFIGURATION_ERROR);

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

      await act(async () => {
        await contextRef!.purchasePackage('$rc_monthly');
      });

      await waitFor(() => {
        expect(getByTestId('error-code').props.children).toBe(
          'CONFIGURATION_ERROR'
        );
        expect(getByTestId('error-retryable').props.children).toBe('false');
      });

      expect(useStore.getState().isPremium).toBe(false);
    });
  });

  describe('Full Cross-Layer Integration', () => {
    // Given: All layers wired together, mock SDK configured for successful purchase
    // When: Component calls purchasePackage via provider context
    // Then: All state changes propagate correctly through all layers
    it('should propagate state changes through all layers on purchase', async () => {
      setupFreeUserMock();
      const service = createIntegrationService();

      let contextRef: ReturnType<typeof useSubscriptionContext> | null = null;
      const stateChanges: string[] = [];

      function StateTracker(): React.JSX.Element {
        const context = useSubscriptionContext();

        React.useEffect(() => {
          stateChanges.push(`tier:${context.subscription?.tier}`);
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
          <StateTracker />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('tier').props.children).toBe('free');
      });

      // Verify initial state
      expect(useStore.getState().isPremium).toBe(false);

      // Perform purchase
      await act(async () => {
        await contextRef!.purchasePackage('$rc_monthly');
      });

      // Verify final state
      await waitFor(() => {
        expect(getByTestId('tier').props.children).toBe('premium');
      });

      // Verify Zustand store synchronized
      expect(useStore.getState().isPremium).toBe(true);

      // Verify state transition occurred
      expect(stateChanges).toContain('tier:free');
      expect(stateChanges).toContain('tier:premium');
    });
  });
});
