/**
 * Subscription Repository Tests
 *
 * Tests for the subscription repository layer.
 * Following TDD methodology - these tests were written before implementation.
 *
 * Tests cover:
 * - CustomerInfo to Subscription conversion
 * - Error mapping from RevenueCat to domain errors
 * - getCustomerInfo, getAvailablePackages, purchasePackage, restorePurchases
 */

// Import mock utilities directly from the mock file to avoid TypeScript errors
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockModule = require('../../../../__mocks__/react-native-purchases');

const {
  mockFreeCustomerInfo,
  createMockPremiumCustomerInfo,
  setupFreeUserMock,
  setupPremiumUserMock,
  setupPurchaseError,
  resetMock,
  PURCHASES_ERROR_CODE,
} = mockModule;

import Purchases from 'react-native-purchases';
import type { CustomerInfo } from '../types';
import { PREMIUM_ENTITLEMENT_ID } from '../types';

// Import the module under test (will be created in GREEN phase)
import {
  toSubscription,
  toSubscriptionError,
  subscriptionRepository,
} from '../repository';

describe('Subscription Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMock();
  });

  describe('toSubscription', () => {
    it('should convert free user CustomerInfo to Subscription with tier "free"', () => {
      const customerInfo = mockFreeCustomerInfo as unknown as CustomerInfo;

      const subscription = toSubscription(customerInfo);

      expect(subscription).toEqual({
        isActive: false,
        tier: 'free',
        expiresAt: null,
        productId: null,
      });
    });

    it('should convert premium user CustomerInfo to Subscription with tier "premium"', () => {
      const customerInfo =
        createMockPremiumCustomerInfo() as unknown as CustomerInfo;

      const subscription = toSubscription(customerInfo);

      expect(subscription.isActive).toBe(true);
      expect(subscription.tier).toBe('premium');
      expect(subscription.productId).toBe('monthly_plan');
      expect(subscription.expiresAt).toBeInstanceOf(Date);
    });

    it('should handle missing entitlements gracefully', () => {
      const customerInfo = {
        entitlements: {
          active: {},
          all: {},
        },
        activeSubscriptions: [],
        allPurchasedProductIdentifiers: [],
        latestExpirationDate: null,
        originalAppUserId: 'test-user',
        originalApplicationVersion: null,
        originalPurchaseDate: null,
      } as CustomerInfo;

      const subscription = toSubscription(customerInfo);

      expect(subscription.tier).toBe('free');
      expect(subscription.isActive).toBe(false);
    });

    it('should correctly parse expiration date from premium entitlement', () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const customerInfo = {
        entitlements: {
          active: {
            [PREMIUM_ENTITLEMENT_ID]: {
              identifier: PREMIUM_ENTITLEMENT_ID,
              isActive: true,
              willRenew: true,
              periodType: 'normal',
              latestPurchaseDate: new Date().toISOString(),
              latestPurchaseDateMillis: Date.now(),
              originalPurchaseDate: new Date().toISOString(),
              originalPurchaseDateMillis: Date.now(),
              expirationDate: futureDate.toISOString(),
              expirationDateMillis: futureDate.getTime(),
              store: 'APP_STORE',
              productIdentifier: 'annual_plan',
              productPlanIdentifier: null,
              isSandbox: false,
              unsubscribeDetectedAt: null,
              unsubscribeDetectedAtMillis: null,
              billingIssueDetectedAt: null,
              billingIssueDetectedAtMillis: null,
              ownershipType: 'PURCHASED',
            },
          },
          all: {},
        },
        activeSubscriptions: ['annual_plan'],
        allPurchasedProductIdentifiers: ['annual_plan'],
        latestExpirationDate: futureDate.toISOString(),
        originalAppUserId: 'test-user',
        originalApplicationVersion: null,
        originalPurchaseDate: null,
      } as CustomerInfo;

      const subscription = toSubscription(customerInfo);

      expect(subscription.expiresAt?.getTime()).toBeCloseTo(
        futureDate.getTime(),
        -3
      );
      expect(subscription.productId).toBe('annual_plan');
    });
  });

  describe('toSubscriptionError', () => {
    it('should map PURCHASE_CANCELLED_ERROR to PURCHASE_CANCELLED', () => {
      const error = {
        code: PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR,
        message: 'User cancelled',
      };

      const subscriptionError = toSubscriptionError(error);

      expect(subscriptionError.code).toBe('PURCHASE_CANCELLED');
      expect(subscriptionError.retryable).toBe(false);
    });

    it('should map PURCHASE_NOT_ALLOWED_ERROR to PURCHASE_NOT_ALLOWED', () => {
      const error = {
        code: PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR,
        message: 'Purchase not allowed',
      };

      const subscriptionError = toSubscriptionError(error);

      expect(subscriptionError.code).toBe('PURCHASE_NOT_ALLOWED');
      expect(subscriptionError.retryable).toBe(false);
    });

    it('should map PURCHASE_INVALID_ERROR to PURCHASE_INVALID', () => {
      const error = {
        code: PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR,
        message: 'Invalid purchase',
      };

      const subscriptionError = toSubscriptionError(error);

      expect(subscriptionError.code).toBe('PURCHASE_INVALID');
      expect(subscriptionError.retryable).toBe(false);
    });

    it('should map PRODUCT_ALREADY_PURCHASED_ERROR to PRODUCT_ALREADY_PURCHASED', () => {
      const error = {
        code: PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR,
        message: 'Already purchased',
      };

      const subscriptionError = toSubscriptionError(error);

      expect(subscriptionError.code).toBe('PRODUCT_ALREADY_PURCHASED');
      expect(subscriptionError.retryable).toBe(false);
    });

    it('should map NETWORK_ERROR to NETWORK_ERROR with retryable flag', () => {
      const error = {
        code: PURCHASES_ERROR_CODE.NETWORK_ERROR,
        message: 'Network error',
      };

      const subscriptionError = toSubscriptionError(error);

      expect(subscriptionError.code).toBe('NETWORK_ERROR');
      expect(subscriptionError.retryable).toBe(true);
    });

    it('should map CONFIGURATION_ERROR to CONFIGURATION_ERROR', () => {
      const error = {
        code: PURCHASES_ERROR_CODE.CONFIGURATION_ERROR,
        message: 'Configuration error',
      };

      const subscriptionError = toSubscriptionError(error);

      expect(subscriptionError.code).toBe('CONFIGURATION_ERROR');
      expect(subscriptionError.retryable).toBe(false);
    });

    it('should map INVALID_CREDENTIALS_ERROR to INVALID_CREDENTIALS_ERROR', () => {
      const error = {
        code: PURCHASES_ERROR_CODE.INVALID_CREDENTIALS_ERROR,
        message: 'Invalid credentials',
      };

      const subscriptionError = toSubscriptionError(error);

      expect(subscriptionError.code).toBe('INVALID_CREDENTIALS_ERROR');
      expect(subscriptionError.retryable).toBe(false);
    });

    it('should map UNEXPECTED_BACKEND_RESPONSE_ERROR to UNEXPECTED_BACKEND_RESPONSE_ERROR with retryable flag', () => {
      const error = {
        code: PURCHASES_ERROR_CODE.UNEXPECTED_BACKEND_RESPONSE_ERROR,
        message: 'Backend error',
      };

      const subscriptionError = toSubscriptionError(error);

      expect(subscriptionError.code).toBe('UNEXPECTED_BACKEND_RESPONSE_ERROR');
      expect(subscriptionError.retryable).toBe(true);
    });

    it('should map RECEIPT_ALREADY_IN_USE_ERROR to RECEIPT_ALREADY_IN_USE_ERROR', () => {
      const error = {
        code: PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR,
        message: 'Receipt in use',
      };

      const subscriptionError = toSubscriptionError(error);

      expect(subscriptionError.code).toBe('RECEIPT_ALREADY_IN_USE_ERROR');
      expect(subscriptionError.retryable).toBe(false);
    });

    it('should map unknown errors to UNKNOWN_ERROR', () => {
      const error = {
        code: 9999,
        message: 'Unknown error',
      };

      const subscriptionError = toSubscriptionError(error);

      expect(subscriptionError.code).toBe('UNKNOWN_ERROR');
      expect(subscriptionError.retryable).toBe(false);
    });

    it('should handle OFFLINE_CONNECTION_ERROR as NETWORK_ERROR', () => {
      const error = {
        code: PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR,
        message: 'Offline',
      };

      const subscriptionError = toSubscriptionError(error);

      expect(subscriptionError.code).toBe('NETWORK_ERROR');
      expect(subscriptionError.retryable).toBe(true);
    });
  });

  describe('subscriptionRepository.getCustomerInfo', () => {
    it('should return subscription data for free user', async () => {
      setupFreeUserMock();

      const result = await subscriptionRepository.getCustomerInfo();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tier).toBe('free');
        expect(result.data.isActive).toBe(false);
      }
    });

    it('should return subscription data for premium user', async () => {
      setupPremiumUserMock();

      const result = await subscriptionRepository.getCustomerInfo();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tier).toBe('premium');
        expect(result.data.isActive).toBe(true);
      }
    });

    it('should return error result when SDK fails', async () => {
      (Purchases.getCustomerInfo as jest.Mock).mockRejectedValueOnce({
        code: PURCHASES_ERROR_CODE.NETWORK_ERROR,
        message: 'Network error',
      });

      const result = await subscriptionRepository.getCustomerInfo();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('subscriptionRepository.getAvailablePackages', () => {
    it('should return available packages from offerings', async () => {
      const result = await subscriptionRepository.getAvailablePackages();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].identifier).toBe('$rc_monthly');
        expect(result.data[1].identifier).toBe('$rc_annual');
      }
    });

    it('should map package data correctly', async () => {
      const result = await subscriptionRepository.getAvailablePackages();

      expect(result.success).toBe(true);
      if (result.success) {
        const monthlyPackage = result.data[0];
        expect(monthlyPackage.title).toBe('Monthly');
        expect(monthlyPackage.priceString).toBe('$9.99');
        expect(monthlyPackage.price).toBe(9.99);
        expect(monthlyPackage.currencyCode).toBe('USD');
      }
    });

    it('should return empty array when no offerings available', async () => {
      (Purchases.getOfferings as jest.Mock).mockResolvedValueOnce({
        current: null,
        all: {},
      });

      const result = await subscriptionRepository.getAvailablePackages();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should return error when getOfferings fails', async () => {
      (Purchases.getOfferings as jest.Mock).mockRejectedValueOnce({
        code: PURCHASES_ERROR_CODE.NETWORK_ERROR,
        message: 'Failed to fetch offerings',
      });

      const result = await subscriptionRepository.getAvailablePackages();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('subscriptionRepository.purchasePackage', () => {
    it('should return updated subscription on successful purchase', async () => {
      setupFreeUserMock();

      const result =
        await subscriptionRepository.purchasePackage('$rc_monthly');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tier).toBe('premium');
        expect(result.data.isActive).toBe(true);
      }
    });

    it('should call Purchases.purchasePackage with correct package', async () => {
      setupFreeUserMock();

      await subscriptionRepository.purchasePackage('$rc_monthly');

      expect(Purchases.purchasePackage).toHaveBeenCalled();
      const callArg = (Purchases.purchasePackage as jest.Mock).mock.calls[0][0];
      expect(callArg.identifier).toBe('$rc_monthly');
    });

    it('should return PURCHASE_CANCELLED error when user cancels', async () => {
      setupFreeUserMock();
      setupPurchaseError(PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR);

      const result =
        await subscriptionRepository.purchasePackage('$rc_monthly');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PURCHASE_CANCELLED');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should return NETWORK_ERROR with retryable flag on network error', async () => {
      setupFreeUserMock();
      setupPurchaseError(PURCHASES_ERROR_CODE.NETWORK_ERROR);

      const result =
        await subscriptionRepository.purchasePackage('$rc_monthly');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NETWORK_ERROR');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('should return PRODUCT_ALREADY_PURCHASED error when product already purchased', async () => {
      setupPremiumUserMock();
      setupPurchaseError(PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR);

      const result =
        await subscriptionRepository.purchasePackage('$rc_monthly');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PRODUCT_ALREADY_PURCHASED');
      }
    });

    it('should return error when package not found in offerings', async () => {
      (Purchases.getOfferings as jest.Mock).mockResolvedValueOnce({
        current: null,
        all: {},
      });

      const result = await subscriptionRepository.purchasePackage(
        'nonexistent_package'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toContain('Package not found');
      }
    });
  });

  describe('subscriptionRepository.restorePurchases', () => {
    it('should return subscription when active subscription found', async () => {
      setupPremiumUserMock();

      const result = await subscriptionRepository.restorePurchases();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toBeNull();
        expect(result.data?.tier).toBe('premium');
        expect(result.data?.isActive).toBe(true);
      }
    });

    it('should return null when no active subscription found', async () => {
      setupFreeUserMock();

      const result = await subscriptionRepository.restorePurchases();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('should return error when restore fails', async () => {
      (Purchases.restorePurchases as jest.Mock).mockRejectedValueOnce({
        code: PURCHASES_ERROR_CODE.NETWORK_ERROR,
        message: 'Network error',
      });

      const result = await subscriptionRepository.restorePurchases();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NETWORK_ERROR');
      }
    });

    it('should call Purchases.restorePurchases', async () => {
      setupFreeUserMock();

      await subscriptionRepository.restorePurchases();

      expect(Purchases.restorePurchases).toHaveBeenCalled();
    });
  });
});
