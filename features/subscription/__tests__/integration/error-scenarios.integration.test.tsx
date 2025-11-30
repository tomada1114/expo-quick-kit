/**
 * Error Scenarios Integration Tests
 *
 * Integration tests for various error scenarios across the subscription flow.
 * Tests network errors, configuration errors, and auto-restore edge cases.
 *
 * @module features/subscription/__tests__/integration/error-scenarios.integration.test
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';

import Purchases, {
  resetMock,
  setupFreeUserMock,
  setupPremiumUserMock,
  setupPurchaseError,
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
      <Text testID="error-message">{context.error?.message ?? 'null'}</Text>
      <Text testID="error-retryable">
        {context.error?.retryable?.toString() ?? 'null'}
      </Text>
    </>
  );
}

describe('Error Scenarios Integration', () => {
  beforeEach(() => {
    resetMock();
    useStore.setState({
      isPremium: false,
      isRevenueCatAvailable: false,
    });
    jest.clearAllMocks();
  });

  describe('Purchase Errors', () => {
    // Given: Mock SDK returns PURCHASE_INVALID_ERROR
    // When: User attempts purchase
    // Then: Error with retryable: false
    it('should handle purchase invalid error', async () => {
      setupFreeUserMock();
      setupPurchaseError(PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR);

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
          'PURCHASE_INVALID'
        );
        expect(getByTestId('error-retryable').props.children).toBe('false');
      });

      expect(useStore.getState().isPremium).toBe(false);
    });

    // Given: Mock SDK returns RECEIPT_ALREADY_IN_USE_ERROR
    // When: User attempts purchase
    // Then: Error with RECEIPT_ALREADY_IN_USE_ERROR
    it('should handle receipt already in use error', async () => {
      setupFreeUserMock();
      setupPurchaseError(PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR);

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
          'RECEIPT_ALREADY_IN_USE_ERROR'
        );
        expect(getByTestId('error-retryable').props.children).toBe('false');
      });

      expect(useStore.getState().isPremium).toBe(false);
    });

    // Given: Mock SDK returns UNEXPECTED_BACKEND_RESPONSE_ERROR
    // When: User attempts purchase
    // Then: Error with retryable: true
    it('should handle unexpected backend response error', async () => {
      setupFreeUserMock();
      setupPurchaseError(
        PURCHASES_ERROR_CODE.UNEXPECTED_BACKEND_RESPONSE_ERROR
      );

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
          'UNEXPECTED_BACKEND_RESPONSE_ERROR'
        );
        expect(getByTestId('error-retryable').props.children).toBe('true');
      });

      expect(useStore.getState().isPremium).toBe(false);
    });

    // Given: Mock SDK returns OFFLINE_CONNECTION_ERROR
    // When: User attempts purchase
    // Then: Error with NETWORK_ERROR and retryable: true
    it('should handle offline connection error', async () => {
      setupFreeUserMock();
      setupPurchaseError(PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR);

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
        // OFFLINE_CONNECTION_ERROR maps to NETWORK_ERROR
        expect(getByTestId('error-code').props.children).toBe('NETWORK_ERROR');
        expect(getByTestId('error-retryable').props.children).toBe('true');
      });

      expect(useStore.getState().isPremium).toBe(false);
    });
  });

  describe('Auto-Restore Edge Cases', () => {
    // Given: Purchase fails with PRODUCT_ALREADY_PURCHASED, auto-restore fails with NETWORK_ERROR
    // When: User attempts purchase
    // Then: Network error from restore is propagated with retryable: true
    it('should propagate network error from auto-restore', async () => {
      setupFreeUserMock();

      // First purchase fails with PRODUCT_ALREADY_PURCHASED
      (Purchases.purchasePackage as jest.Mock).mockRejectedValue({
        code: PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR,
        message: 'Product already purchased',
      });

      // Then restore fails with NETWORK_ERROR
      (Purchases.restorePurchases as jest.Mock).mockRejectedValue({
        code: PURCHASES_ERROR_CODE.NETWORK_ERROR,
        message: 'Network error during restore',
      });

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

      // Verify restore was attempted
      expect(Purchases.restorePurchases).toHaveBeenCalled();
      expect(useStore.getState().isPremium).toBe(false);
    });

    // Given: Purchase fails with PRODUCT_ALREADY_PURCHASED, auto-restore returns no subscription
    // When: User attempts purchase
    // Then: Returns NO_ACTIVE_SUBSCRIPTION error
    it('should handle auto-restore with no active subscription', async () => {
      setupFreeUserMock();

      // First purchase fails with PRODUCT_ALREADY_PURCHASED
      (Purchases.purchasePackage as jest.Mock).mockRejectedValue({
        code: PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR,
        message: 'Product already purchased',
      });

      // Restore succeeds but returns free user (no active subscription)
      (Purchases.restorePurchases as jest.Mock).mockResolvedValue({
        entitlements: { active: {}, all: {} },
        activeSubscriptions: [],
        allPurchasedProductIdentifiers: [],
        latestExpirationDate: null,
        originalAppUserId: 'test-user',
        originalApplicationVersion: null,
        originalPurchaseDate: null,
      });

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
          'NO_ACTIVE_SUBSCRIPTION'
        );
        expect(getByTestId('error-retryable').props.children).toBe('false');
      });

      expect(useStore.getState().isPremium).toBe(false);
    });
  });

  describe('Unknown Error Handling', () => {
    // Given: Mock SDK returns an unknown error code
    // When: User attempts purchase
    // Then: Error with UNKNOWN_ERROR
    it('should handle unknown error codes', async () => {
      setupFreeUserMock();
      setupPurchaseError(999); // Unknown error code

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
        expect(getByTestId('error-code').props.children).toBe('UNKNOWN_ERROR');
        expect(getByTestId('error-retryable').props.children).toBe('false');
      });

      expect(useStore.getState().isPremium).toBe(false);
    });

    // Given: Mock SDK throws a non-standard error (no code property)
    // When: User attempts operation
    // Then: Error with UNKNOWN_ERROR and error message preserved
    it('should handle non-RevenueCat errors', async () => {
      setupFreeUserMock();

      (Purchases.purchasePackage as jest.Mock).mockRejectedValue(
        new Error('Something went wrong')
      );

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
        expect(getByTestId('error-code').props.children).toBe('UNKNOWN_ERROR');
        expect(getByTestId('error-message').props.children).toBe(
          'Something went wrong'
        );
      });

      expect(useStore.getState().isPremium).toBe(false);
    });
  });

  describe('Restore Errors', () => {
    // Given: Mock SDK returns STORE_PROBLEM_ERROR during restore
    // When: User attempts restore
    // Then: Error with retryable: true
    it('should handle store problem error during restore', async () => {
      setupFreeUserMock();
      setupRestoreError(PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR);

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
          'STORE_PROBLEM_ERROR'
        );
        expect(getByTestId('error-retryable').props.children).toBe('true');
      });

      expect(useStore.getState().isPremium).toBe(false);
    });

    // Given: Mock SDK returns CONFIGURATION_ERROR during restore
    // When: User attempts restore
    // Then: Error with retryable: false
    it('should handle configuration error during restore', async () => {
      setupFreeUserMock();
      setupRestoreError(PURCHASES_ERROR_CODE.CONFIGURATION_ERROR);

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
          'CONFIGURATION_ERROR'
        );
        expect(getByTestId('error-retryable').props.children).toBe('false');
      });

      expect(useStore.getState().isPremium).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    // Given: Previous operation failed with error
    // When: Successful operation is performed
    // Then: Error is cleared
    it('should clear error on successful operation', async () => {
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

      // First attempt fails
      await act(async () => {
        await contextRef!.purchasePackage('$rc_monthly');
      });

      await waitFor(() => {
        expect(getByTestId('error-code').props.children).toBe('NETWORK_ERROR');
      });

      // Reset mock to succeed
      resetMock();
      setupFreeUserMock();

      // Second attempt succeeds
      await act(async () => {
        await contextRef!.purchasePackage('$rc_monthly');
      });

      await waitFor(() => {
        expect(getByTestId('error-code').props.children).toBe('null');
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
      });

      expect(useStore.getState().isPremium).toBe(true);
    });
  });
});
