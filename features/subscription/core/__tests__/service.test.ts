/**
 * Subscription Service Unit Tests
 *
 * Tests for the application service layer that contains business logic
 * for subscription management, feature gating, and usage limits.
 *
 * @module features/subscription/core/__tests__/service.test
 */

import {
  getUsageLimits,
  canAccessFeature,
  FREE_TIER_LIMITS,
  PREMIUM_TIER_LIMITS,
  createSubscriptionService,
} from '../service';
import type {
  FeatureLevel,
  Subscription,
  SubscriptionError,
  Result,
} from '../types';
import { DEFAULT_FREE_SUBSCRIPTION } from '../types';

// Mock repository type for testing
type MockSubscriptionRepository = {
  getCustomerInfo: jest.Mock<Promise<Result<Subscription, SubscriptionError>>>;
  purchasePackage: jest.Mock<
    Promise<Result<Subscription, SubscriptionError>>,
    [string]
  >;
  restorePurchases: jest.Mock<
    Promise<Result<Subscription | null, SubscriptionError>>
  >;
};

// Factory to create mock repository
function createMockRepository(
  overrides: Partial<MockSubscriptionRepository> = {}
): MockSubscriptionRepository {
  return {
    getCustomerInfo: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    ...overrides,
  };
}

describe('Subscription Service', () => {
  describe('getUsageLimits', () => {
    it('should return free tier limits for free tier', () => {
      const limits = getUsageLimits('free');

      expect(limits).toEqual(FREE_TIER_LIMITS);
      expect(limits.maxItems).toBe(10);
      expect(limits.maxExports).toBe(1);
      expect(limits.hasAds).toBe(true);
    });

    it('should return premium tier limits for premium tier', () => {
      const limits = getUsageLimits('premium');

      expect(limits).toEqual(PREMIUM_TIER_LIMITS);
      expect(limits.maxItems).toBe(Infinity);
      expect(limits.maxExports).toBe(Infinity);
      expect(limits.hasAds).toBe(false);
    });

    it('should return immutable free tier limits', () => {
      const limits1 = getUsageLimits('free');
      const limits2 = getUsageLimits('free');

      // Should return the same reference (immutable constant)
      expect(limits1).toBe(limits2);
    });

    it('should return immutable premium tier limits', () => {
      const limits1 = getUsageLimits('premium');
      const limits2 = getUsageLimits('premium');

      // Should return the same reference (immutable constant)
      expect(limits1).toBe(limits2);
    });
  });

  describe('canAccessFeature', () => {
    describe('with free tier', () => {
      const tier = 'free' as const;

      it('should allow access to basic features', () => {
        const result = canAccessFeature('basic', tier);
        expect(result).toBe(true);
      });

      it('should deny access to premium features', () => {
        const result = canAccessFeature('premium', tier);
        expect(result).toBe(false);
      });
    });

    describe('with premium tier', () => {
      const tier = 'premium' as const;

      it('should allow access to basic features', () => {
        const result = canAccessFeature('basic', tier);
        expect(result).toBe(true);
      });

      it('should allow access to premium features', () => {
        const result = canAccessFeature('premium', tier);
        expect(result).toBe(true);
      });
    });

    it('should handle all feature levels exhaustively', () => {
      const featureLevels: FeatureLevel[] = ['basic', 'premium'];
      const tiers = ['free', 'premium'] as const;

      // Ensure no runtime errors for all combinations
      for (const level of featureLevels) {
        for (const tier of tiers) {
          expect(typeof canAccessFeature(level, tier)).toBe('boolean');
        }
      }
    });
  });

  describe('createSubscriptionService', () => {
    let mockRepository: MockSubscriptionRepository;
    let onStateChange: jest.Mock<void, [Subscription]>;

    beforeEach(() => {
      mockRepository = createMockRepository();
      onStateChange = jest.fn();
    });

    describe('purchasePackage', () => {
      it('should update subscription state on successful purchase', async () => {
        const premiumSubscription: Subscription = {
          isActive: true,
          tier: 'premium',
          expiresAt: new Date('2025-12-31'),
          productId: 'monthly_plan',
        };

        mockRepository.purchasePackage.mockResolvedValue({
          success: true,
          data: premiumSubscription,
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
        });

        const result = await service.purchasePackage('$rc_monthly');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(premiumSubscription);
        }
        expect(onStateChange).toHaveBeenCalledWith(premiumSubscription);
      });

      it('should handle purchase cancellation without logging error', async () => {
        const cancelledError: SubscriptionError = {
          code: 'PURCHASE_CANCELLED',
          message: 'User cancelled purchase',
          retryable: false,
        };

        mockRepository.purchasePackage.mockResolvedValue({
          success: false,
          error: cancelledError,
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
        });

        const result = await service.purchasePackage('$rc_monthly');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('PURCHASE_CANCELLED');
        }
        // State should NOT be updated on cancellation
        expect(onStateChange).not.toHaveBeenCalled();
      });

      it('should handle network error with retryable flag', async () => {
        const networkError: SubscriptionError = {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
        };

        mockRepository.purchasePackage.mockResolvedValue({
          success: false,
          error: networkError,
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
        });

        const result = await service.purchasePackage('$rc_monthly');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('NETWORK_ERROR');
          expect(result.error.retryable).toBe(true);
        }
        expect(onStateChange).not.toHaveBeenCalled();
      });

      it('should auto-restore when PRODUCT_ALREADY_PURCHASED error occurs', async () => {
        const alreadyPurchasedError: SubscriptionError = {
          code: 'PRODUCT_ALREADY_PURCHASED',
          message: 'Product already purchased',
          retryable: false,
        };

        const premiumSubscription: Subscription = {
          isActive: true,
          tier: 'premium',
          expiresAt: new Date('2025-12-31'),
          productId: 'monthly_plan',
        };

        mockRepository.purchasePackage.mockResolvedValue({
          success: false,
          error: alreadyPurchasedError,
        });

        mockRepository.restorePurchases.mockResolvedValue({
          success: true,
          data: premiumSubscription,
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
        });

        const result = await service.purchasePackage('$rc_monthly');

        expect(mockRepository.restorePurchases).toHaveBeenCalled();
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(premiumSubscription);
        }
        expect(onStateChange).toHaveBeenCalledWith(premiumSubscription);
      });

      it('should return restore error when auto-restore fails after PRODUCT_ALREADY_PURCHASED', async () => {
        const alreadyPurchasedError: SubscriptionError = {
          code: 'PRODUCT_ALREADY_PURCHASED',
          message: 'Product already purchased',
          retryable: false,
        };

        const restoreError: SubscriptionError = {
          code: 'NETWORK_ERROR',
          message: 'Restore failed',
          retryable: true,
        };

        mockRepository.purchasePackage.mockResolvedValue({
          success: false,
          error: alreadyPurchasedError,
        });

        mockRepository.restorePurchases.mockResolvedValue({
          success: false,
          error: restoreError,
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
        });

        const result = await service.purchasePackage('$rc_monthly');

        expect(mockRepository.restorePurchases).toHaveBeenCalled();
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('NETWORK_ERROR');
        }
      });
    });

    describe('restorePurchases', () => {
      it('should update subscription state on successful restore', async () => {
        const premiumSubscription: Subscription = {
          isActive: true,
          tier: 'premium',
          expiresAt: new Date('2025-12-31'),
          productId: 'monthly_plan',
        };

        mockRepository.restorePurchases.mockResolvedValue({
          success: true,
          data: premiumSubscription,
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
        });

        const result = await service.restorePurchases();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(premiumSubscription);
        }
        expect(onStateChange).toHaveBeenCalledWith(premiumSubscription);
      });

      it('should return NO_ACTIVE_SUBSCRIPTION when no subscription found', async () => {
        mockRepository.restorePurchases.mockResolvedValue({
          success: true,
          data: null,
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
        });

        const result = await service.restorePurchases();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('NO_ACTIVE_SUBSCRIPTION');
          expect(result.error.retryable).toBe(false);
        }
        // State should NOT be updated when no subscription found
        expect(onStateChange).not.toHaveBeenCalled();
      });

      it('should handle restore error', async () => {
        const networkError: SubscriptionError = {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
        };

        mockRepository.restorePurchases.mockResolvedValue({
          success: false,
          error: networkError,
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
        });

        const result = await service.restorePurchases();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('NETWORK_ERROR');
          expect(result.error.retryable).toBe(true);
        }
        expect(onStateChange).not.toHaveBeenCalled();
      });
    });

    describe('getSubscription', () => {
      it('should fetch and update subscription state', async () => {
        const premiumSubscription: Subscription = {
          isActive: true,
          tier: 'premium',
          expiresAt: new Date('2025-12-31'),
          productId: 'monthly_plan',
        };

        mockRepository.getCustomerInfo.mockResolvedValue({
          success: true,
          data: premiumSubscription,
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
        });

        const result = await service.getSubscription();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(premiumSubscription);
        }
        expect(onStateChange).toHaveBeenCalledWith(premiumSubscription);
      });

      it('should fallback to free tier when subscription is expired', async () => {
        const expiredSubscription: Subscription = {
          isActive: false,
          tier: 'free',
          expiresAt: new Date('2023-01-01'), // Past date
          productId: 'monthly_plan',
        };

        mockRepository.getCustomerInfo.mockResolvedValue({
          success: true,
          data: expiredSubscription,
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
        });

        const result = await service.getSubscription();

        expect(result.success).toBe(true);
        if (result.success) {
          // Should still return the data but tier should be 'free'
          expect(result.data.tier).toBe('free');
          expect(result.data.isActive).toBe(false);
        }
        expect(onStateChange).toHaveBeenCalledWith(expiredSubscription);
      });

      it('should handle fetch error and return default subscription', async () => {
        const networkError: SubscriptionError = {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
        };

        mockRepository.getCustomerInfo.mockResolvedValue({
          success: false,
          error: networkError,
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
        });

        const result = await service.getSubscription();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('NETWORK_ERROR');
        }
        // State should still update to free tier on error
        expect(onStateChange).toHaveBeenCalledWith(DEFAULT_FREE_SUBSCRIPTION);
      });
    });

    describe('getCurrentSubscription', () => {
      it('should return current subscription state without fetching', () => {
        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
        });

        const result = service.getCurrentSubscription();

        // Initial state should be default free subscription
        expect(result).toEqual(DEFAULT_FREE_SUBSCRIPTION);
        expect(mockRepository.getCustomerInfo).not.toHaveBeenCalled();
      });

      it('should return updated subscription after state change', async () => {
        const premiumSubscription: Subscription = {
          isActive: true,
          tier: 'premium',
          expiresAt: new Date('2025-12-31'),
          productId: 'monthly_plan',
        };

        mockRepository.getCustomerInfo.mockResolvedValue({
          success: true,
          data: premiumSubscription,
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
        });

        // Fetch to update internal state
        await service.getSubscription();

        // Now getCurrentSubscription should return updated state
        const result = service.getCurrentSubscription();
        expect(result).toEqual(premiumSubscription);
      });
    });

    describe('logger', () => {
      it('should call logger on successful purchase', async () => {
        const logger = jest.fn();
        const premiumSubscription: Subscription = {
          isActive: true,
          tier: 'premium',
          expiresAt: new Date('2025-12-31'),
          productId: 'monthly_plan',
        };

        mockRepository.purchasePackage.mockResolvedValue({
          success: true,
          data: premiumSubscription,
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
          logger,
        });

        await service.purchasePackage('$rc_monthly');

        expect(logger).toHaveBeenCalledWith('info', 'Starting purchase', {
          packageId: '$rc_monthly',
        });
        expect(logger).toHaveBeenCalledWith('info', 'Purchase successful', {
          packageId: '$rc_monthly',
        });
      });

      it('should call logger on purchase error', async () => {
        const logger = jest.fn();
        const networkError: SubscriptionError = {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
        };

        mockRepository.purchasePackage.mockResolvedValue({
          success: false,
          error: networkError,
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
          logger,
        });

        await service.purchasePackage('$rc_monthly');

        expect(logger).toHaveBeenCalledWith('error', 'Purchase failed', {
          packageId: '$rc_monthly',
          errorCode: 'NETWORK_ERROR',
          errorMessage: 'Network connection failed',
          retryable: true,
        });
      });

      it('should log info (not error) on purchase cancellation', async () => {
        const logger = jest.fn();
        const cancelledError: SubscriptionError = {
          code: 'PURCHASE_CANCELLED',
          message: 'User cancelled purchase',
          retryable: false,
        };

        mockRepository.purchasePackage.mockResolvedValue({
          success: false,
          error: cancelledError,
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
          logger,
        });

        await service.purchasePackage('$rc_monthly');

        expect(logger).toHaveBeenCalledWith(
          'info',
          'Purchase cancelled by user',
          { packageId: '$rc_monthly' }
        );
        // Should NOT log as error
        expect(logger).not.toHaveBeenCalledWith(
          'error',
          expect.any(String),
          expect.any(Object)
        );
      });

      it('should not throw when logger is not provided', async () => {
        mockRepository.purchasePackage.mockResolvedValue({
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network error',
            retryable: true,
          },
        });

        const service = createSubscriptionService({
          repository: mockRepository,
          onStateChange,
          // No logger provided
        });

        // Should not throw
        await expect(
          service.purchasePackage('$rc_monthly')
        ).resolves.toBeDefined();
      });
    });
  });
});
