/**
 * Restore Flow Integration Tests
 *
 * End-to-end integration tests for the restore purchases flow.
 * Tests the complete flow from Repository → Service → Provider → Store.
 *
 * @module features/subscription/__tests__/integration/restore-flow.integration.test
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';

import Purchases, {
  resetMock,
  setupFreeUserMock,
  setupPremiumUserMock,
  setupRestoreError,
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

describe('Restore Flow Integration', () => {
  beforeEach(() => {
    resetMock();
    useStore.setState({
      isPremium: false,
      isRevenueCatAvailable: false,
    });
  });

  describe('Happy Path', () => {
    // Given: User has existing premium subscription on server
    // When: User calls restorePurchases()
    // Then: Subscription state updates to premium, Zustand store isPremium becomes true
    it('should successfully restore premium subscription', async () => {
      // Start as free user
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

      // Set up restore to return premium
      setupPremiumUserMock();

      // Perform restore
      await act(async () => {
        await contextRef!.restorePurchases();
      });

      // Verify restore completed
      await waitFor(() => {
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
        expect(getByTestId('subscription-active').props.children).toBe('true');
      });

      // Verify Zustand store synchronized
      expect(useStore.getState().isPremium).toBe(true);

      // Verify SDK was called correctly
      expect(Purchases.restorePurchases).toHaveBeenCalled();
    });

    // Given: User restores subscription on a new device
    // When: User calls restorePurchases()
    // Then: Subscription state updates, store synced
    it('should restore subscription on new device', async () => {
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

      // Initial state should be free
      expect(useStore.getState().isPremium).toBe(false);

      // Set up restore to return premium
      setupPremiumUserMock();

      await act(async () => {
        await contextRef!.restorePurchases();
      });

      await waitFor(() => {
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
      });

      expect(useStore.getState().isPremium).toBe(true);
    });
  });

  describe('Sad Path', () => {
    // Given: Mock SDK returns free customer info (no active entitlement)
    // When: User attempts restore
    // Then: Service returns error NO_ACTIVE_SUBSCRIPTION, state remains free
    it('should handle restore with no active subscription found', async () => {
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

      // Restore with free user mock (no active subscription)
      await act(async () => {
        await contextRef!.restorePurchases();
      });

      await waitFor(() => {
        expect(getByTestId('error-code').props.children).toBe(
          'NO_ACTIVE_SUBSCRIPTION'
        );
        expect(getByTestId('error-retryable').props.children).toBe('false');
      });

      // State should remain free
      expect(getByTestId('subscription-tier').props.children).toBe('free');
      expect(useStore.getState().isPremium).toBe(false);
    });
  });

  describe('Unhappy Path (System Errors)', () => {
    // Given: Mock SDK configured to fail restore with NETWORK_ERROR
    // When: User attempts restore
    // Then: Error returned with code NETWORK_ERROR, retryable: true
    it('should handle network error during restore', async () => {
      setupFreeUserMock();
      setupRestoreError(PURCHASES_ERROR_CODE.NETWORK_ERROR);

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
        await contextRef!.restorePurchases();
      });

      await waitFor(() => {
        expect(getByTestId('error-code').props.children).toBe('NETWORK_ERROR');
        expect(getByTestId('error-retryable').props.children).toBe('true');
      });

      // State should remain unchanged
      expect(getByTestId('subscription-tier').props.children).toBe('free');
      expect(useStore.getState().isPremium).toBe(false);
    });

    // Given: Mock SDK returns UNEXPECTED_BACKEND_RESPONSE_ERROR
    // When: User attempts restore
    // Then: Error returned with retryable: true
    it('should handle unexpected backend response error', async () => {
      setupFreeUserMock();
      setupRestoreError(PURCHASES_ERROR_CODE.UNEXPECTED_BACKEND_RESPONSE_ERROR);

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
        await contextRef!.restorePurchases();
      });

      await waitFor(() => {
        expect(getByTestId('error-code').props.children).toBe(
          'UNEXPECTED_BACKEND_RESPONSE_ERROR'
        );
        expect(getByTestId('error-retryable').props.children).toBe('true');
      });

      expect(useStore.getState().isPremium).toBe(false);
    });

    // Given: Mock SDK returns INVALID_CREDENTIALS_ERROR
    // When: User attempts restore
    // Then: Error returned with retryable: false
    it('should handle invalid credentials error', async () => {
      setupFreeUserMock();
      setupRestoreError(PURCHASES_ERROR_CODE.INVALID_CREDENTIALS_ERROR);

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
        await contextRef!.restorePurchases();
      });

      await waitFor(() => {
        expect(getByTestId('error-code').props.children).toBe(
          'INVALID_CREDENTIALS_ERROR'
        );
        expect(getByTestId('error-retryable').props.children).toBe('false');
      });

      expect(useStore.getState().isPremium).toBe(false);
    });
  });

  describe('Full Cross-Layer Integration', () => {
    // Given: All layers wired together, mock SDK returns premium on restore
    // When: Component calls restorePurchases via provider context
    // Then: All state changes propagate correctly through all layers
    it('should propagate state changes through all layers on restore', async () => {
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

      // Set up restore to return premium
      setupPremiumUserMock();

      // Perform restore
      await act(async () => {
        await contextRef!.restorePurchases();
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

      // Verify SDK was called
      expect(Purchases.restorePurchases).toHaveBeenCalled();
    });
  });
});
