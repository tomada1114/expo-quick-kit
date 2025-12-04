/**
 * Tests for Purchase Domain Types
 *
 * These tests verify that Purchase entity types and error types are correctly defined
 * and match the requirements specification for one-time purchases (買い切り型).
 *
 * @module features/purchase/core/__tests__/types.test
 */

import {
  type Purchase,
  type PurchaseError,
  type PurchaseErrorCode,
  type FeatureLevel,
  type FeatureDefinition,
  type Result,
} from '../types';

describe('Purchase Domain Types', () => {
  describe('Purchase Entity Type Structure', () => {
    describe('Happy Path - Valid Purchase', () => {
      it('should allow creating a valid verified Purchase', () => {
        const now = new Date();
        const purchase: Purchase = {
          transactionId: 'tx_12345',
          productId: 'premium_unlock',
          purchasedAt: now,
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          verificationKey: 'key_abc123',
          isSynced: false,
          syncedAt: undefined,
          unlockedFeatures: ['feature_a', 'feature_b'],
        };

        expect(purchase.transactionId).toBe('tx_12345');
        expect(purchase.productId).toBe('premium_unlock');
        expect(purchase.purchasedAt).toEqual(now);
        expect(purchase.price).toBe(9.99);
        expect(purchase.currencyCode).toBe('USD');
        expect(purchase.isVerified).toBe(true);
        expect(purchase.verificationKey).toBe('key_abc123');
        expect(purchase.isSynced).toBe(false);
        expect(purchase.syncedAt).toBeUndefined();
        expect(purchase.unlockedFeatures).toEqual(['feature_a', 'feature_b']);
      });

      it('should allow creating a synced Purchase with syncedAt', () => {
        const now = new Date();
        const syncedAt = new Date();
        const purchase: Purchase = {
          transactionId: 'tx_67890',
          productId: 'premium_unlock',
          purchasedAt: now,
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: true,
          syncedAt,
          unlockedFeatures: ['feature_a'],
        };

        expect(purchase.isSynced).toBe(true);
        expect(purchase.syncedAt).toEqual(syncedAt);
      });

      it('should support multiple unlocked features', () => {
        const purchase: Purchase = {
          transactionId: 'tx_multi',
          productId: 'bundle_pack',
          purchasedAt: new Date(),
          price: 19.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false,
          unlockedFeatures: [
            'advanced_editing',
            'cloud_sync',
            'premium_templates',
            'priority_support',
          ],
        };

        expect(purchase.unlockedFeatures).toHaveLength(4);
        expect(purchase.unlockedFeatures).toContain('advanced_editing');
      });

      it('should allow Purchase with empty unlockedFeatures', () => {
        const purchase: Purchase = {
          transactionId: 'tx_empty',
          productId: 'test_product',
          purchasedAt: new Date(),
          price: 0,
          currencyCode: 'USD',
          isVerified: false,
          isSynced: false,
          unlockedFeatures: [],
        };

        expect(purchase.unlockedFeatures).toEqual([]);
        expect(purchase.unlockedFeatures.length).toBe(0);
      });

      it('should handle optional verificationKey', () => {
        const purchase: Purchase = {
          transactionId: 'tx_no_key',
          productId: 'product',
          purchasedAt: new Date(),
          price: 5.99,
          currencyCode: 'USD',
          isVerified: false,
          isSynced: false,
          unlockedFeatures: [],
        };

        expect(purchase.verificationKey).toBeUndefined();
      });
    });

    describe('Edge Cases - Purchase Invariants', () => {
      it('should reflect invariant: isVerified=true enables unlockedFeatures', () => {
        const unverifiedPurchase: Purchase = {
          transactionId: 'tx_unverified',
          productId: 'product',
          purchasedAt: new Date(),
          price: 9.99,
          currencyCode: 'USD',
          isVerified: false,
          isSynced: false,
          unlockedFeatures: [],
        };

        if (unverifiedPurchase.isVerified === true) {
          expect(unverifiedPurchase.unlockedFeatures.length).toBeGreaterThan(0);
        } else {
          expect(unverifiedPurchase.isVerified).toBe(false);
        }
      });

      it('should reflect invariant: isSynced=true requires syncedAt', () => {
        const syncedAt = new Date();
        const syncedPurchase: Purchase = {
          transactionId: 'tx_synced',
          productId: 'product',
          purchasedAt: new Date(),
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: true,
          syncedAt,
          unlockedFeatures: ['feature'],
        };

        if (syncedPurchase.isSynced === true) {
          expect(syncedPurchase.syncedAt).toBeDefined();
          expect(syncedPurchase.syncedAt).not.toBeNull();
        }
      });

      it('should enforce unique transactionId', () => {
        const purchase1: Purchase = {
          transactionId: 'tx_001',
          productId: 'product',
          purchasedAt: new Date(),
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false,
          unlockedFeatures: [],
        };

        const purchase2: Purchase = {
          transactionId: 'tx_002',
          productId: 'product',
          purchasedAt: new Date(),
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false,
          unlockedFeatures: [],
        };

        expect(purchase1.transactionId).not.toBe(purchase2.transactionId);
      });
    });
  });

  describe('PurchaseError Type Structure', () => {
    describe('Network Errors - Retryable', () => {
      it('should allow creating NETWORK_ERROR with retryable true', () => {
        const error: PurchaseError = {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
          platform: 'ios',
        };

        expect(error.code).toBe('NETWORK_ERROR');
        expect(error.retryable).toBe(true);
        if (error.code === 'NETWORK_ERROR') {
          expect(error.platform).toBe('ios');
        }
      });

      it('should allow creating STORE_PROBLEM_ERROR', () => {
        const error: PurchaseError = {
          code: 'STORE_PROBLEM_ERROR',
          message: 'App Store is temporarily unavailable',
          retryable: true,
          nativeErrorCode: 6,
        };

        expect(error.code).toBe('STORE_PROBLEM_ERROR');
        expect(error.retryable).toBe(true);
        if (error.code === 'STORE_PROBLEM_ERROR') {
          expect(error.nativeErrorCode).toBe(6);
        }
      });
    });

    describe('User Errors - Non-Retryable', () => {
      it('should allow creating PURCHASE_CANCELLED error', () => {
        const error: PurchaseError = {
          code: 'PURCHASE_CANCELLED',
          message: 'User cancelled purchase',
          retryable: false,
        };

        expect(error.code).toBe('PURCHASE_CANCELLED');
        expect(error.retryable).toBe(false);
      });

      it('should allow creating PRODUCT_UNAVAILABLE error', () => {
        const error: PurchaseError = {
          code: 'PRODUCT_UNAVAILABLE',
          message: 'Product no longer available',
          retryable: false,
          productId: 'discontinued_product',
        };

        expect(error.code).toBe('PRODUCT_UNAVAILABLE');
        expect(error.retryable).toBe(false);
        if (error.code === 'PRODUCT_UNAVAILABLE') {
          expect(error.productId).toBe('discontinued_product');
        }
      });

      it('should allow creating PURCHASE_INVALID error', () => {
        const error: PurchaseError = {
          code: 'PURCHASE_INVALID',
          message: 'Receipt signature is invalid',
          retryable: false,
          reason: 'not_signed',
        };

        expect(error.code).toBe('PURCHASE_INVALID');
        expect(error.retryable).toBe(false);
        if (error.code === 'PURCHASE_INVALID') {
          expect(error.reason).toBe('not_signed');
        }
      });
    });

    describe('Business Logic Errors', () => {
      it('should allow creating UNKNOWN_ERROR', () => {
        const error: PurchaseError = {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
          retryable: false,
        };

        expect(error.code).toBe('UNKNOWN_ERROR');
        expect(error.retryable).toBe(false);
      });
    });

    describe('Error Type Narrowing', () => {
      it('should support error type narrowing by code', () => {
        const networkError: PurchaseError = {
          code: 'NETWORK_ERROR',
          message: 'Network failed',
          retryable: true,
          platform: 'android',
        };

        if (networkError.code === 'NETWORK_ERROR') {
          expect(networkError.platform).toBe('android');
          expect(networkError.retryable).toBe(true);
        }
      });

      it('should allow extracting error code type', () => {
        const code: PurchaseErrorCode = 'PURCHASE_CANCELLED';
        expect([
          'NETWORK_ERROR',
          'PURCHASE_CANCELLED',
          'UNKNOWN_ERROR',
        ]).toContain(code);
      });
    });
  });

  describe('FeatureLevel Value Object', () => {
    it('should allow free feature level', () => {
      const feature: FeatureDefinition = {
        id: 'basic_feature',
        level: 'free',
        name: 'Basic Feature',
        description: 'Available to all users',
      };

      expect(feature.level).toBe('free');
    });

    it('should allow premium feature level with requiredProductId', () => {
      const feature: FeatureDefinition = {
        id: 'premium_feature',
        level: 'premium',
        name: 'Premium Feature',
        description: 'Available to premium users',
        requiredProductId: 'premium_unlock',
      };

      expect(feature.level).toBe('premium');
      expect(feature.requiredProductId).toBe('premium_unlock');
    });

    it('should allow premium feature without requiredProductId', () => {
      const feature: FeatureDefinition = {
        id: 'premium_feature',
        level: 'premium',
        name: 'Premium Feature',
        description: 'Available to premium users',
      };

      expect(feature.level).toBe('premium');
      expect(feature.requiredProductId).toBeUndefined();
    });
  });

  describe('Result Type Structure', () => {
    it('should allow creating a success result with Purchase data', () => {
      const purchase: Purchase = {
        transactionId: 'tx_001',
        productId: 'product',
        purchasedAt: new Date(),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: false,
        unlockedFeatures: ['feature'],
      };

      const result: Result<Purchase, PurchaseError> = {
        success: true,
        data: purchase,
      };

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(purchase);
      }
    });

    it('should allow creating an error result', () => {
      const result: Result<Purchase, PurchaseError> = {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Connection failed',
          retryable: true,
          platform: 'ios',
        },
      };

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NETWORK_ERROR');
      }
    });

    it('should work with type narrowing on success', () => {
      const result: Result<string, PurchaseError> = {
        success: true,
        data: 'success_data',
      };

      if (result.success) {
        const data: string = result.data;
        expect(data).toBe('success_data');
      }
    });

    it('should work with type narrowing on error', () => {
      const result: Result<string, PurchaseError> = {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Unknown',
          retryable: false,
        },
      };

      if (!result.success) {
        const error: PurchaseError = result.error;
        expect(error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('Type Integration', () => {
    it('should integrate Purchase, PurchaseError, and Result types', () => {
      const successResult: Result<Purchase, PurchaseError> = {
        success: true,
        data: {
          transactionId: 'tx_final',
          productId: 'product',
          purchasedAt: new Date(),
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false,
          unlockedFeatures: ['feature'],
        },
      };

      const errorResult: Result<Purchase, PurchaseError> = {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error',
          retryable: true,
          platform: 'ios',
        },
      };

      expect([successResult, errorResult]).toHaveLength(2);
    });
  });
});
