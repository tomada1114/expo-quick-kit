/**
 * Tests for Subscription Domain Types
 *
 * These tests verify that domain type constants are correctly defined
 * and match the requirements specification.
 *
 * @module features/subscription/core/__tests__/types.test
 */

import {
  DEFAULT_FREE_SUBSCRIPTION,
  FREE_TIER_LIMITS,
  PREMIUM_ENTITLEMENT_ID,
  PREMIUM_TIER_LIMITS,
  type FeatureLevel,
  type Result,
  type Subscription,
  type SubscriptionError,
  type SubscriptionErrorCode,
  type SubscriptionPackage,
  type UsageLimits,
} from '../types';

describe('Subscription Domain Types', () => {
  describe('FREE_TIER_LIMITS', () => {
    it('should have maxItems of 10', () => {
      expect(FREE_TIER_LIMITS.maxItems).toBe(10);
    });

    it('should have maxExports of 1', () => {
      expect(FREE_TIER_LIMITS.maxExports).toBe(1);
    });

    it('should have hasAds as true', () => {
      expect(FREE_TIER_LIMITS.hasAds).toBe(true);
    });
  });

  describe('PREMIUM_TIER_LIMITS', () => {
    it('should have maxItems of Infinity', () => {
      expect(PREMIUM_TIER_LIMITS.maxItems).toBe(Infinity);
    });

    it('should have maxExports of Infinity', () => {
      expect(PREMIUM_TIER_LIMITS.maxExports).toBe(Infinity);
    });

    it('should have hasAds as false', () => {
      expect(PREMIUM_TIER_LIMITS.hasAds).toBe(false);
    });
  });

  describe('DEFAULT_FREE_SUBSCRIPTION', () => {
    it('should have isActive as false', () => {
      expect(DEFAULT_FREE_SUBSCRIPTION.isActive).toBe(false);
    });

    it('should have tier as free', () => {
      expect(DEFAULT_FREE_SUBSCRIPTION.tier).toBe('free');
    });

    it('should have expiresAt as null', () => {
      expect(DEFAULT_FREE_SUBSCRIPTION.expiresAt).toBeNull();
    });

    it('should have productId as null', () => {
      expect(DEFAULT_FREE_SUBSCRIPTION.productId).toBeNull();
    });
  });

  describe('PREMIUM_ENTITLEMENT_ID', () => {
    it('should be "premium"', () => {
      expect(PREMIUM_ENTITLEMENT_ID).toBe('premium');
    });
  });

  describe('Type Structure Validation', () => {
    it('should allow creating a valid Subscription object', () => {
      const subscription: Subscription = {
        isActive: true,
        tier: 'premium',
        expiresAt: new Date('2025-12-31'),
        productId: 'monthly_plan',
      };

      expect(subscription.isActive).toBe(true);
      expect(subscription.tier).toBe('premium');
      expect(subscription.expiresAt).toBeInstanceOf(Date);
      expect(subscription.productId).toBe('monthly_plan');
    });

    it('should allow creating a valid UsageLimits object', () => {
      const limits: UsageLimits = {
        maxItems: 100,
        maxExports: 5,
        hasAds: false,
      };

      expect(limits.maxItems).toBe(100);
      expect(limits.maxExports).toBe(5);
      expect(limits.hasAds).toBe(false);
    });

    it('should allow creating a valid SubscriptionPackage object', () => {
      const pkg: SubscriptionPackage = {
        identifier: '$rc_monthly',
        title: 'Monthly',
        priceString: '$9.99',
        price: 9.99,
        currencyCode: 'USD',
      };

      expect(pkg.identifier).toBe('$rc_monthly');
      expect(pkg.title).toBe('Monthly');
      expect(pkg.priceString).toBe('$9.99');
      expect(pkg.price).toBe(9.99);
      expect(pkg.currencyCode).toBe('USD');
    });

    it('should allow creating a SubscriptionPackage with introPrice', () => {
      const pkg: SubscriptionPackage = {
        identifier: '$rc_annual',
        title: 'Annual',
        priceString: '$99.99',
        price: 99.99,
        currencyCode: 'USD',
        introPrice: {
          priceString: '$0.99',
          price: 0.99,
          period: '1 week',
        },
      };

      expect(pkg.introPrice).toBeDefined();
      expect(pkg.introPrice?.priceString).toBe('$0.99');
      expect(pkg.introPrice?.price).toBe(0.99);
      expect(pkg.introPrice?.period).toBe('1 week');
    });

    it('should validate FeatureLevel type values', () => {
      const basicLevel: FeatureLevel = 'basic';
      const premiumLevel: FeatureLevel = 'premium';

      expect(basicLevel).toBe('basic');
      expect(premiumLevel).toBe('premium');
    });
  });

  describe('SubscriptionError Type Structure', () => {
    it('should allow creating a PURCHASE_CANCELLED error', () => {
      const error: SubscriptionError = {
        code: 'PURCHASE_CANCELLED',
        message: 'User cancelled the purchase',
        retryable: false,
      };

      expect(error.code).toBe('PURCHASE_CANCELLED');
      expect(error.retryable).toBe(false);
    });

    it('should allow creating a NETWORK_ERROR with retryable true', () => {
      const error: SubscriptionError = {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        retryable: true,
      };

      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.retryable).toBe(true);
    });

    it('should allow creating a CONFIGURATION_ERROR', () => {
      const error: SubscriptionError = {
        code: 'CONFIGURATION_ERROR',
        message: 'API key is missing',
        retryable: false,
      };

      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.retryable).toBe(false);
    });

    it('should allow creating an UNEXPECTED_BACKEND_RESPONSE_ERROR with retryable true', () => {
      const error: SubscriptionError = {
        code: 'UNEXPECTED_BACKEND_RESPONSE_ERROR',
        message: 'Server returned unexpected response',
        retryable: true,
      };

      expect(error.code).toBe('UNEXPECTED_BACKEND_RESPONSE_ERROR');
      expect(error.retryable).toBe(true);
    });

    it('should allow extracting error code type', () => {
      const code: SubscriptionErrorCode = 'PURCHASE_CANCELLED';
      expect(code).toBe('PURCHASE_CANCELLED');
    });
  });

  describe('Result Type Structure', () => {
    it('should allow creating a success result', () => {
      const result: Result<Subscription, SubscriptionError> = {
        success: true,
        data: DEFAULT_FREE_SUBSCRIPTION,
      };

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(DEFAULT_FREE_SUBSCRIPTION);
      }
    });

    it('should allow creating an error result', () => {
      const result: Result<Subscription, SubscriptionError> = {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Connection failed',
          retryable: true,
        },
      };

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NETWORK_ERROR');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('should work with type narrowing', () => {
      const successResult: Result<string, SubscriptionError> = {
        success: true,
        data: 'test',
      };

      const errorResult: Result<string, SubscriptionError> = {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error',
          retryable: false,
        },
      };

      // Type narrowing should work
      if (successResult.success) {
        expect(successResult.data).toBe('test');
      }

      if (!errorResult.success) {
        expect(errorResult.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });
});
