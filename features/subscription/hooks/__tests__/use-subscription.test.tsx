/**
 * useSubscription Hook Tests
 *
 * Tests for the custom hook that provides subscription state and actions
 * with derived state (isPremium, isFree, usageLimits) and feature gating.
 *
 * @module features/subscription/hooks/__tests__/use-subscription.test
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';

import { useSubscription } from '../use-subscription';
import {
  SubscriptionProvider,
  type SubscriptionContextValue,
} from '../../providers/subscription-provider';
import type { Subscription, SubscriptionError, Result } from '../../core/types';
import {
  DEFAULT_FREE_SUBSCRIPTION,
  FREE_TIER_LIMITS,
  PREMIUM_TIER_LIMITS,
} from '../../core/types';
import type { SubscriptionService } from '../../core/service';

// Test helper: create a mock service
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

// Test helper: wrapper component with provider
const createWrapper = (service: SubscriptionService) => {
  return function Wrapper({
    children,
  }: {
    children: React.ReactNode;
  }): React.JSX.Element {
    return (
      <SubscriptionProvider service={service}>{children}</SubscriptionProvider>
    );
  };
};

describe('useSubscription', () => {
  describe('derived state - isPremium and isFree', () => {
    it('should return isPremium: false and isFree: true for free tier subscription', async () => {
      const mockService = createMockService({
        getSubscription: jest.fn(async () => ({
          success: true as const,
          data: {
            isActive: false,
            tier: 'free' as const,
            expiresAt: null,
            productId: null,
          },
        })),
      });

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isPremium).toBe(false);
      expect(result.current.isFree).toBe(true);
    });

    it('should return isPremium: true and isFree: false for premium tier subscription', async () => {
      const mockService = createMockService({
        getSubscription: jest.fn(async () => ({
          success: true as const,
          data: {
            isActive: true,
            tier: 'premium' as const,
            expiresAt: new Date('2025-12-31'),
            productId: 'monthly_plan',
          },
        })),
      });

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isPremium).toBe(true);
      expect(result.current.isFree).toBe(false);
    });

    it('should return isPremium: false and isFree: true when subscription is null', async () => {
      const mockService = createMockService({
        getSubscription: jest.fn(
          () =>
            new Promise<Result<Subscription, SubscriptionError>>(() => {
              // Never resolves to keep subscription null
            })
        ),
      });

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      // While loading, subscription is null, should default to free
      expect(result.current.isPremium).toBe(false);
      expect(result.current.isFree).toBe(true);
    });
  });

  describe('derived state - usageLimits', () => {
    it('should return FREE_TIER_LIMITS for free tier subscription', async () => {
      const mockService = createMockService({
        getSubscription: jest.fn(async () => ({
          success: true as const,
          data: DEFAULT_FREE_SUBSCRIPTION,
        })),
      });

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.usageLimits).toEqual(FREE_TIER_LIMITS);
      expect(result.current.usageLimits.maxItems).toBe(10);
      expect(result.current.usageLimits.maxExports).toBe(1);
      expect(result.current.usageLimits.hasAds).toBe(true);
    });

    it('should return PREMIUM_TIER_LIMITS for premium tier subscription', async () => {
      const mockService = createMockService({
        getSubscription: jest.fn(async () => ({
          success: true as const,
          data: {
            isActive: true,
            tier: 'premium' as const,
            expiresAt: new Date('2025-12-31'),
            productId: 'monthly_plan',
          },
        })),
      });

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.usageLimits).toEqual(PREMIUM_TIER_LIMITS);
      expect(result.current.usageLimits.maxItems).toBe(Infinity);
      expect(result.current.usageLimits.maxExports).toBe(Infinity);
      expect(result.current.usageLimits.hasAds).toBe(false);
    });

    it('should return FREE_TIER_LIMITS when subscription is null', async () => {
      const mockService = createMockService({
        getSubscription: jest.fn(
          () =>
            new Promise<Result<Subscription, SubscriptionError>>(() => {
              // Never resolves
            })
        ),
      });

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      // While loading, should default to free tier limits
      expect(result.current.usageLimits).toEqual(FREE_TIER_LIMITS);
    });
  });

  describe('raw state passthrough', () => {
    it('should pass through subscription from context', async () => {
      const premiumSubscription: Subscription = {
        isActive: true,
        tier: 'premium',
        expiresAt: new Date('2025-12-31'),
        productId: 'annual_plan',
      };

      const mockService = createMockService({
        getSubscription: jest.fn(async () => ({
          success: true as const,
          data: premiumSubscription,
        })),
      });

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscription).toEqual(premiumSubscription);
    });

    it('should pass through loading state from context', () => {
      const mockService = createMockService({
        getSubscription: jest.fn(
          () =>
            new Promise<Result<Subscription, SubscriptionError>>(() => {
              // Never resolves
            })
        ),
      });

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      expect(result.current.loading).toBe(true);
    });

    it('should pass through error state from context', async () => {
      const mockService = createMockService({
        getSubscription: jest.fn(async () => ({
          success: false as const,
          error: {
            code: 'NETWORK_ERROR' as const,
            message: 'Network unavailable',
            retryable: true as const,
          },
        })),
      });

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual({
        code: 'NETWORK_ERROR',
        message: 'Network unavailable',
        retryable: true,
      });
    });
  });

  describe('canAccessFeature function', () => {
    it('should return true for basic features regardless of tier', async () => {
      const mockService = createMockService({
        getSubscription: jest.fn(async () => ({
          success: true as const,
          data: DEFAULT_FREE_SUBSCRIPTION, // free tier
        })),
      });

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canAccessFeature('basic')).toBe(true);
    });

    it('should return false for premium features when user is free tier', async () => {
      const mockService = createMockService({
        getSubscription: jest.fn(async () => ({
          success: true as const,
          data: DEFAULT_FREE_SUBSCRIPTION, // free tier
        })),
      });

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canAccessFeature('premium')).toBe(false);
    });

    it('should return true for premium features when user is premium tier', async () => {
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

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canAccessFeature('premium')).toBe(true);
    });

    it('should return true for basic features when user is premium tier', async () => {
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

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canAccessFeature('basic')).toBe(true);
    });

    it('should return false for premium features when subscription is null', () => {
      const mockService = createMockService({
        getSubscription: jest.fn(
          () =>
            new Promise<Result<Subscription, SubscriptionError>>(() => {
              // Never resolves
            })
        ),
      });

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      // While loading, subscription is null, should default to free tier access
      expect(result.current.canAccessFeature('premium')).toBe(false);
      expect(result.current.canAccessFeature('basic')).toBe(true);
    });
  });

  describe('action passthrough', () => {
    it('should pass through purchasePackage action', async () => {
      const mockService = createMockService();

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.purchasePackage('$rc_monthly');
      });

      expect(mockService.purchasePackage).toHaveBeenCalledWith('$rc_monthly');
    });

    it('should pass through restorePurchases action', async () => {
      const mockService = createMockService();

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.restorePurchases();
      });

      expect(mockService.restorePurchases).toHaveBeenCalled();
    });

    it('should pass through refetchSubscription action', async () => {
      const mockService = createMockService();

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refetchSubscription();
      });

      // Initial fetch + refetch = 2 calls
      expect(mockService.getSubscription).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should throw error when used outside SubscriptionProvider', () => {
      // Suppress console.error for this test
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // The error is thrown by useSubscriptionContext which is called internally
      expect(() => {
        renderHook(() => useSubscription());
      }).toThrow('must be used within a SubscriptionProvider');

      consoleError.mockRestore();
    });
  });

  describe('memoization', () => {
    it('should memoize usageLimits to prevent unnecessary recalculations', async () => {
      const mockService = createMockService({
        getSubscription: jest.fn(async () => ({
          success: true as const,
          data: DEFAULT_FREE_SUBSCRIPTION,
        })),
      });

      const { result, rerender } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialLimits = result.current.usageLimits;

      // Re-render without changing subscription
      rerender({});

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // usageLimits should be the same reference (memoized)
      expect(result.current.usageLimits).toBe(initialLimits);
    });

    it('should memoize canAccessFeature function', async () => {
      const mockService = createMockService();

      const { result, rerender } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(mockService),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCanAccessFeature = result.current.canAccessFeature;

      // Re-render without changing subscription
      rerender({});

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // canAccessFeature should be the same reference (memoized)
      expect(result.current.canAccessFeature).toBe(initialCanAccessFeature);
    });
  });
});
