/**
 * Subscription Provider Tests
 *
 * Tests for the React Context provider that manages subscription state.
 *
 * @module features/subscription/providers/__tests__/subscription-provider.test
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';

import {
  SubscriptionProvider,
  useSubscriptionContext,
} from '../subscription-provider';
import type { Subscription, SubscriptionError, Result } from '../../core/types';
import { DEFAULT_FREE_SUBSCRIPTION } from '../../core/types';
import type { SubscriptionService } from '../../core/service';

// Mock service factory
const createMockService = (
  overrides: Partial<SubscriptionService> = {}
): SubscriptionService => {
  let currentSubscription: Subscription = DEFAULT_FREE_SUBSCRIPTION;

  return {
    getCurrentSubscription: jest.fn(() => currentSubscription),
    getSubscription: jest.fn(
      async (): Promise<Result<Subscription, SubscriptionError>> => ({
        success: true,
        data: currentSubscription,
      })
    ),
    purchasePackage: jest.fn(
      async (): Promise<Result<Subscription, SubscriptionError>> => ({
        success: true,
        data: { ...currentSubscription, tier: 'premium', isActive: true },
      })
    ),
    restorePurchases: jest.fn(
      async (): Promise<Result<Subscription, SubscriptionError>> => ({
        success: true,
        data: currentSubscription,
      })
    ),
    ...overrides,
  };
};

// Test component that consumes the context
function TestConsumer(): React.JSX.Element {
  const context = useSubscriptionContext();
  return (
    <>
      <Text testID="loading">{context.loading.toString()}</Text>
      <Text testID="subscription-tier">
        {context.subscription?.tier ?? 'null'}
      </Text>
      <Text testID="error">{context.error?.code ?? 'null'}</Text>
    </>
  );
}

describe('SubscriptionProvider', () => {
  describe('initialization', () => {
    it('should fetch customer info on mount', async () => {
      const mockService = createMockService();

      render(
        <SubscriptionProvider service={mockService}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(mockService.getSubscription).toHaveBeenCalledTimes(1);
      });
    });

    it('should set loading to true initially', () => {
      const mockService = createMockService({
        getSubscription: jest.fn(
          () =>
            new Promise<Result<Subscription, SubscriptionError>>(() => {
              // Never resolves to keep loading state
            })
        ),
      });

      const { getByTestId } = render(
        <SubscriptionProvider service={mockService}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      expect(getByTestId('loading').props.children).toBe('true');
    });

    it('should set loading to false after fetching', async () => {
      const mockService = createMockService();

      const { getByTestId } = render(
        <SubscriptionProvider service={mockService}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('false');
      });
    });

    it('should set subscription state after fetching', async () => {
      const premiumSubscription: Subscription = {
        isActive: true,
        tier: 'premium',
        expiresAt: new Date('2025-12-31'),
        productId: 'monthly_plan',
      };

      const mockService = createMockService({
        getSubscription: jest.fn(async () => ({
          success: true as const,
          data: premiumSubscription,
        })),
      });

      const { getByTestId } = render(
        <SubscriptionProvider service={mockService}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
      });
    });

    it('should handle fetch error gracefully', async () => {
      const mockService = createMockService({
        getSubscription: jest.fn(async () => ({
          success: false as const,
          error: {
            code: 'NETWORK_ERROR' as const,
            message: 'Network error',
            retryable: true as const,
          },
        })),
      });

      const { getByTestId } = render(
        <SubscriptionProvider service={mockService}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('error').props.children).toBe('NETWORK_ERROR');
        expect(getByTestId('loading').props.children).toBe('false');
      });
    });
  });

  describe('purchasePackage action', () => {
    it('should call service purchasePackage and update state on success', async () => {
      const premiumSubscription: Subscription = {
        isActive: true,
        tier: 'premium',
        expiresAt: new Date('2025-12-31'),
        productId: 'monthly_plan',
      };

      const mockService = createMockService({
        purchasePackage: jest.fn(async () => ({
          success: true as const,
          data: premiumSubscription,
        })),
      });

      // Component that triggers purchase
      function PurchaseTestConsumer(): React.JSX.Element {
        const context = useSubscriptionContext();
        React.useEffect(() => {
          // Trigger purchase after initial load
          if (!context.loading && context.subscription?.tier === 'free') {
            void context.purchasePackage('$rc_monthly');
          }
        }, [context.loading, context.subscription?.tier]);
        return (
          <Text testID="subscription-tier">
            {context.subscription?.tier ?? 'null'}
          </Text>
        );
      }

      const { getByTestId } = render(
        <SubscriptionProvider service={mockService}>
          <PurchaseTestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(mockService.purchasePackage).toHaveBeenCalledWith('$rc_monthly');
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
      });
    });

    it('should set loading state during purchase', async () => {
      let resolvePurchase: (
        value: Result<Subscription, SubscriptionError>
      ) => void;
      const purchasePromise = new Promise<
        Result<Subscription, SubscriptionError>
      >((resolve) => {
        resolvePurchase = resolve;
      });

      const mockService = createMockService({
        getSubscription: jest.fn(async () => ({
          success: true as const,
          data: DEFAULT_FREE_SUBSCRIPTION,
        })),
        purchasePackage: jest.fn(() => purchasePromise),
      });

      const loadingStates: boolean[] = [];

      function LoadingTracker(): React.JSX.Element {
        const context = useSubscriptionContext();

        React.useEffect(() => {
          loadingStates.push(context.loading);
        }, [context.loading]);

        React.useEffect(() => {
          if (!context.loading && context.subscription) {
            void context.purchasePackage('$rc_monthly');
          }
          // Only trigger on first render after initial load
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return <Text testID="loading">{context.loading.toString()}</Text>;
      }

      render(
        <SubscriptionProvider service={mockService}>
          <LoadingTracker />
        </SubscriptionProvider>
      );

      // Wait for initial load to complete
      await waitFor(() => {
        expect(mockService.getSubscription).toHaveBeenCalled();
      });

      // Resolve the purchase
      await act(async () => {
        resolvePurchase!({
          success: true,
          data: {
            isActive: true,
            tier: 'premium',
            expiresAt: null,
            productId: 'monthly_plan',
          },
        });
      });

      // Verify loading state was toggled
      expect(loadingStates).toContain(true);
    });

    it('should prevent duplicate purchase requests while loading', async () => {
      let resolvePurchase: (
        value: Result<Subscription, SubscriptionError>
      ) => void;

      const purchasePromise = new Promise<
        Result<Subscription, SubscriptionError>
      >((resolve) => {
        resolvePurchase = resolve;
      });

      const mockService = createMockService({
        purchasePackage: jest.fn(() => purchasePromise),
      });

      function DuplicatePurchaseTest(): React.JSX.Element {
        const context = useSubscriptionContext();
        const purchaseTriggered = React.useRef(false);

        React.useEffect(() => {
          if (!context.loading && !purchaseTriggered.current) {
            purchaseTriggered.current = true;
            // Try to trigger multiple purchases
            void context.purchasePackage('$rc_monthly');
            void context.purchasePackage('$rc_monthly');
            void context.purchasePackage('$rc_monthly');
          }
        }, [context.loading, context.subscription?.tier]);

        return (
          <Text testID="tier">{context.subscription?.tier ?? 'null'}</Text>
        );
      }

      render(
        <SubscriptionProvider service={mockService}>
          <DuplicatePurchaseTest />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(mockService.purchasePackage).toHaveBeenCalled();
      });

      // Resolve the purchase
      await act(async () => {
        resolvePurchase!({
          success: true,
          data: {
            isActive: true,
            tier: 'premium',
            expiresAt: null,
            productId: 'monthly_plan',
          },
        });
      });

      // Should only be called once due to duplicate prevention
      expect(mockService.purchasePackage).toHaveBeenCalledTimes(1);
    });
  });

  describe('restorePurchases action', () => {
    it('should call service restorePurchases and update state on success', async () => {
      const premiumSubscription: Subscription = {
        isActive: true,
        tier: 'premium',
        expiresAt: new Date('2025-12-31'),
        productId: 'monthly_plan',
      };

      const mockService = createMockService({
        restorePurchases: jest.fn(async () => ({
          success: true as const,
          data: premiumSubscription,
        })),
      });

      function RestoreTestConsumer(): React.JSX.Element {
        const context = useSubscriptionContext();
        const restoreTriggered = React.useRef(false);

        React.useEffect(() => {
          if (!context.loading && !restoreTriggered.current) {
            restoreTriggered.current = true;
            void context.restorePurchases();
          }
        }, [context.loading]);

        return (
          <Text testID="subscription-tier">
            {context.subscription?.tier ?? 'null'}
          </Text>
        );
      }

      const { getByTestId } = render(
        <SubscriptionProvider service={mockService}>
          <RestoreTestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(mockService.restorePurchases).toHaveBeenCalled();
        expect(getByTestId('subscription-tier').props.children).toBe('premium');
      });
    });

    it('should handle restore with NO_ACTIVE_SUBSCRIPTION error', async () => {
      const mockService = createMockService({
        restorePurchases: jest.fn(async () => ({
          success: false as const,
          error: {
            code: 'NO_ACTIVE_SUBSCRIPTION' as const,
            message: 'No active subscription found',
            retryable: false as const,
          },
        })),
      });

      function RestoreErrorConsumer(): React.JSX.Element {
        const context = useSubscriptionContext();
        const restoreTriggered = React.useRef(false);

        React.useEffect(() => {
          if (!context.loading && !restoreTriggered.current) {
            restoreTriggered.current = true;
            void context.restorePurchases();
          }
        }, [context.loading]);

        return <Text testID="error">{context.error?.code ?? 'null'}</Text>;
      }

      const { getByTestId } = render(
        <SubscriptionProvider service={mockService}>
          <RestoreErrorConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(getByTestId('error').props.children).toBe(
          'NO_ACTIVE_SUBSCRIPTION'
        );
      });
    });
  });

  describe('refetchSubscription action', () => {
    it('should fetch subscription state again', async () => {
      const mockService = createMockService();

      function RefetchConsumer(): React.JSX.Element {
        const context = useSubscriptionContext();
        const refetchTriggered = React.useRef(false);

        React.useEffect(() => {
          if (!context.loading && !refetchTriggered.current) {
            refetchTriggered.current = true;
            void context.refetchSubscription();
          }
        }, [context.loading]);

        return (
          <Text testID="tier">{context.subscription?.tier ?? 'null'}</Text>
        );
      }

      render(
        <SubscriptionProvider service={mockService}>
          <RefetchConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        // Initial fetch + refetch = 2 calls
        expect(mockService.getSubscription).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('useSubscriptionContext outside provider', () => {
    it('should throw error when used outside SubscriptionProvider', () => {
      // Suppress console.error for this test
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      function OrphanConsumer(): React.JSX.Element {
        useSubscriptionContext();
        return <Text>Should not render</Text>;
      }

      expect(() => render(<OrphanConsumer />)).toThrow(
        'useSubscriptionContext must be used within a SubscriptionProvider'
      );

      consoleError.mockRestore();
    });
  });
});
