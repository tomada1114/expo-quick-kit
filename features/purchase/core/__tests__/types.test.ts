/**
 * Unit tests for Purchase domain types
 * Tests for PurchaseError discriminated union (Task 1.2)
 */

import type { PurchaseError } from '../types';

describe('PurchaseError type (Task 1.2)', () => {
  describe('NETWORK_ERROR variant', () => {
    it('should allow NETWORK_ERROR with all required fields', () => {
      const error: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        retryable: true,
        platform: 'ios',
        nativeErrorCode: -1001,
      };
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.retryable).toBe(true);
    });

    it('should support all platforms for NETWORK_ERROR', () => {
      const iosError: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'iOS network error',
        retryable: true,
        platform: 'ios',
        nativeErrorCode: 0,
      };
      const androidError: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'Android network error',
        retryable: true,
        platform: 'android',
        nativeErrorCode: 0,
      };
      const revenueCatError: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'RevenueCat network error',
        retryable: true,
        platform: 'revenueCat',
        nativeErrorCode: 0,
      };
      expect(iosError.platform).toBe('ios');
      expect(androidError.platform).toBe('android');
      expect(revenueCatError.platform).toBe('revenueCat');
    });
  });

  describe('STORE_PROBLEM_ERROR variant', () => {
    it('should allow STORE_PROBLEM_ERROR with all required fields', () => {
      const error: PurchaseError = {
        code: 'STORE_PROBLEM_ERROR',
        message: 'App Store is temporarily unavailable',
        retryable: true,
        platform: 'ios',
        nativeErrorCode: -500,
      };
      expect(error.code).toBe('STORE_PROBLEM_ERROR');
      expect(error.retryable).toBe(true);
    });

    it('should support iOS and Android platforms for STORE_PROBLEM_ERROR', () => {
      const iosError: PurchaseError = {
        code: 'STORE_PROBLEM_ERROR',
        message: 'Store unavailable',
        retryable: true,
        platform: 'ios',
        nativeErrorCode: 8,
      };
      const androidError: PurchaseError = {
        code: 'STORE_PROBLEM_ERROR',
        message: 'Store unavailable',
        retryable: true,
        platform: 'android',
        nativeErrorCode: 8,
      };
      expect(iosError.platform).toBe('ios');
      expect(androidError.platform).toBe('android');
    });
  });

  describe('PURCHASE_CANCELLED variant', () => {
    it('should allow PURCHASE_CANCELLED with required fields', () => {
      const error: PurchaseError = {
        code: 'PURCHASE_CANCELLED',
        message: 'User cancelled the purchase',
        retryable: false,
      };
      expect(error.code).toBe('PURCHASE_CANCELLED');
      expect(error.retryable).toBe(false);
    });

    it('should not be retryable', () => {
      const error: PurchaseError = {
        code: 'PURCHASE_CANCELLED',
        message: 'Cancelled',
        retryable: false,
      };
      expect(error.retryable).toBe(false);
    });
  });

  describe('PURCHASE_INVALID variant', () => {
    it('should allow PURCHASE_INVALID with all reason values', () => {
      const notSigned: PurchaseError = {
        code: 'PURCHASE_INVALID',
        message: 'Not signed',
        retryable: false,
        reason: 'not_signed',
      };
      const wrongBundle: PurchaseError = {
        code: 'PURCHASE_INVALID',
        message: 'Wrong bundle',
        retryable: false,
        reason: 'wrong_bundle',
      };
      const revoked: PurchaseError = {
        code: 'PURCHASE_INVALID',
        message: 'Purchase revoked',
        retryable: false,
        reason: 'revoked',
      };

      expect(notSigned.reason).toBe('not_signed');
      expect(wrongBundle.reason).toBe('wrong_bundle');
      expect(revoked.reason).toBe('revoked');
    });

    it('should not be retryable', () => {
      const error: PurchaseError = {
        code: 'PURCHASE_INVALID',
        message: 'Invalid',
        retryable: false,
        reason: 'not_signed',
      };
      expect(error.retryable).toBe(false);
    });
  });

  describe('PRODUCT_UNAVAILABLE variant', () => {
    it('should allow PRODUCT_UNAVAILABLE with productId', () => {
      const error: PurchaseError = {
        code: 'PRODUCT_UNAVAILABLE',
        message: 'Product not found in store',
        retryable: false,
        productId: 'premium_unlock',
      };
      expect(error.code).toBe('PRODUCT_UNAVAILABLE');
      expect(error.productId).toBe('premium_unlock');
    });

    it('should not be retryable', () => {
      const error: PurchaseError = {
        code: 'PRODUCT_UNAVAILABLE',
        message: 'Unavailable',
        retryable: false,
        productId: 'feature_x',
      };
      expect(error.retryable).toBe(false);
    });
  });

  describe('UNKNOWN_ERROR variant', () => {
    it('should allow UNKNOWN_ERROR with required fields', () => {
      const error: PurchaseError = {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        retryable: false,
      };
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.retryable).toBe(false);
    });

    it('should not be retryable', () => {
      const error: PurchaseError = {
        code: 'UNKNOWN_ERROR',
        message: 'Something went wrong',
        retryable: false,
      };
      expect(error.retryable).toBe(false);
    });
  });

  describe('Type narrowing and error discrimination', () => {
    it('should narrow retryable errors correctly', () => {
      const errors: PurchaseError[] = [
        {
          code: 'NETWORK_ERROR',
          message: 'Network failed',
          retryable: true,
          platform: 'ios',
          nativeErrorCode: 0,
        },
        {
          code: 'PURCHASE_CANCELLED',
          message: 'Cancelled',
          retryable: false,
        },
        {
          code: 'STORE_PROBLEM_ERROR',
          message: 'Store error',
          retryable: true,
          platform: 'android',
          nativeErrorCode: 0,
        },
      ];

      const retryableErrors = errors.filter((e) => e.retryable);
      expect(retryableErrors).toHaveLength(2);
      expect(retryableErrors.every((e) => e.retryable)).toBe(true);
    });

    it('should have distinct error codes', () => {
      const codes = new Set<string>();
      const errors: PurchaseError[] = [
        {
          code: 'NETWORK_ERROR',
          message: 'msg',
          retryable: true,
          platform: 'ios',
          nativeErrorCode: 0,
        },
        {
          code: 'STORE_PROBLEM_ERROR',
          message: 'msg',
          retryable: true,
          platform: 'ios',
          nativeErrorCode: 0,
        },
        {
          code: 'PURCHASE_CANCELLED',
          message: 'msg',
          retryable: false,
        },
        {
          code: 'PURCHASE_INVALID',
          message: 'msg',
          retryable: false,
          reason: 'not_signed',
        },
        {
          code: 'PRODUCT_UNAVAILABLE',
          message: 'msg',
          retryable: false,
          productId: 'id',
        },
        {
          code: 'UNKNOWN_ERROR',
          message: 'msg',
          retryable: false,
        },
      ];

      errors.forEach((e) => codes.add(e.code));
      expect(codes.size).toBe(6);
    });

    it('should support type narrowing by error code', () => {
      const networkError: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        platform: 'ios',
        nativeErrorCode: 0,
      };

      if (networkError.code === 'NETWORK_ERROR') {
        expect(networkError.platform).toBeDefined();
        expect(networkError.nativeErrorCode).toBeDefined();
      }
    });

    it('should support retryable flag discrimination', () => {
      const error: PurchaseError = {
        code: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        platform: 'ios',
        nativeErrorCode: 0,
      };

      if (error.retryable) {
        expect(['NETWORK_ERROR', 'STORE_PROBLEM_ERROR']).toContain(error.code);
      }
    });
  });
});
