/**
 * Multi-Feature Unlock Integration Tests - Task 16.10
 *
 * Integration tests for multiple feature unlock scenarios:
 * - Purchase a product that unlocks multiple features
 * - Verify all unlocked features are accessible
 * - Confirm other products don't interfere with feature access
 * - Test feature bundles
 *
 * Requirements Coverage:
 * - Req 4.6: Support multiple features unlocked by single product (bundle support)
 * - Req 5.3: Display features unlocked by selected option
 * - Req 7.1: Purchase history display with unlocked features
 *
 * Test Scenarios:
 * 1. Happy Path (5 tests): Successful multi-feature unlock
 * 2. Sad Path (2 tests): Feature access denial
 * 3. Edge Cases (3 tests): Special product scenarios
 * 4. Integration (2 tests): Real-world workflows
 *
 * @module features/purchase/__tests__/integration/multi-feature-unlock.integration.test
 */

// Mock ALL dependencies BEFORE any imports to prevent native module issues
jest.mock('@/database/client', () => ({
  db: {
    insert: jest.fn(() => ({
      values: jest.fn().mockResolvedValue(void 0),
    })),
    select: jest.fn(() => ({
      from: jest.fn(function () {
        return {
          where: jest.fn(function () {
            return {
              all: jest.fn(() => []),
              get: jest.fn(() => undefined),
            };
          }),
          innerJoin: jest.fn(function () {
            return {
              where: jest.fn(function () {
                return {
                  all: jest.fn(() => []),
                };
              }),
            };
          }),
        };
      }),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn().mockResolvedValue(void 0),
      })),
    })),
  },
  initializeDatabase: jest.fn(),
  isDatabaseInitialized: jest.fn(() => true),
  resetDatabaseState: jest.fn(),
  DatabaseInitError: Error,
}));

jest.mock('@/database/schema', () => ({
  purchases: {
    productId: 'product_id',
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  sql: jest.fn(),
}));

import { db } from '@/database/client';
import { purchases } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { featureGatingService } from '../../application/feature-gating-service';
import type { Purchase } from '../../core/types';

describe('Multi-Feature Unlock Integration - Task 16.10', () => {
  // Helper to create mock purchase
  const createMockPurchase = (
    productId: string,
    overrides?: Partial<Purchase>
  ): Purchase => ({
    transactionId: `txn-${Date.now()}-${Math.random()}`,
    productId,
    purchasedAt: new Date(),
    price: 9.99,
    currencyCode: 'USD',
    isVerified: true,
    isSynced: true,
    syncedAt: new Date(),
    unlockedFeatures: [],
    ...overrides,
  });

  // Helper to mock database to return purchases
  const mockDatabasePurchases = (purchasesToReturn: any[]) => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn(function () {
        return {
          where: jest.fn(function () {
            return {
              all: jest.fn(() => purchasesToReturn),
              get: jest.fn(() => purchasesToReturn[0] || undefined),
            };
          }),
          innerJoin: jest.fn(function () {
            return {
              where: jest.fn(function () {
                return {
                  all: jest.fn(() => purchasesToReturn),
                };
              }),
            };
          }),
        };
      }),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path - Multi-feature Unlock', () => {
    // E2E-1: Purchase product that unlocks multiple features
    it('should unlock all features when product with multiple features is purchased', () => {
      // Given: Product 'premium_unlock' that unlocks 2 features
      const purchase = createMockPurchase('premium_unlock');
      mockDatabasePurchases([purchase]);

      // When: Get features unlocked by the product
      const unlockedFeatures =
        featureGatingService.getUnlockedFeaturesByProduct('premium_unlock');

      // Then: Should return both features
      expect(unlockedFeatures).toHaveLength(2);
      expect(unlockedFeatures.map((f) => f.id)).toEqual(
        expect.arrayContaining(['advanced_search', 'advanced_analytics'])
      );
      expect(unlockedFeatures[0].level).toBe('premium');
    });

    // E2E-2: Verify first feature in bundle is accessible
    it('should allow access to first feature in bundle after purchase', () => {
      // Given: User has purchased product unlocking multiple features
      const purchase = createMockPurchase('premium_unlock');
      mockDatabasePurchases([purchase]);

      // When: Check access to first feature
      const hasAccess = featureGatingService.canAccessSync('advanced_search');

      // Then: Should grant access
      expect(hasAccess).toBe(true);
    });

    // E2E-3: Verify second feature in bundle is accessible
    it('should allow access to second feature in bundle after purchase', () => {
      // Given: User has purchased product unlocking multiple features
      const purchase = createMockPurchase('premium_unlock');
      mockDatabasePurchases([purchase]);

      // When: Check access to second feature
      const hasAccess =
        featureGatingService.canAccessSync('advanced_analytics');

      // Then: Should grant access
      expect(hasAccess).toBe(true);
    });

    // E2E-4: Single-feature product still works
    it('should unlock single feature when product has only one feature', () => {
      // Given: Product 'data_export' that unlocks only 'export_data'
      const purchase = createMockPurchase('data_export');
      mockDatabasePurchases([purchase]);

      // When: Get features unlocked by the product
      const unlockedFeatures =
        featureGatingService.getUnlockedFeaturesByProduct('data_export');

      // Then: Should return single feature
      expect(unlockedFeatures).toHaveLength(1);
      expect(unlockedFeatures[0].id).toBe('export_data');
    });

    // E2E-5: Multiple purchases unlock different features
    it('should correctly unlock features from multiple different products', () => {
      // Given: User has purchased two different products
      const purchase1 = createMockPurchase('premium_unlock');
      const purchase2 = createMockPurchase('data_export');

      // When: Get features from first product
      const features1 =
        featureGatingService.getUnlockedFeaturesByProduct('premium_unlock');
      const features2 =
        featureGatingService.getUnlockedFeaturesByProduct('data_export');

      // Then: Should return correct features for each
      expect(features1).toHaveLength(2);
      expect(features2).toHaveLength(1);
      expect(
        features1.map((f) => f.id).concat(features2.map((f) => f.id))
      ).toEqual(
        expect.arrayContaining([
          'advanced_search',
          'advanced_analytics',
          'export_data',
        ])
      );
    });
  });

  describe('Sad Path - Feature Access Denial', () => {
    // E2E-6: Premium feature requires correct product
    it('should deny access to feature when required product not purchased', () => {
      // Given: User has not purchased 'premium_unlock'
      mockDatabasePurchases([]);

      // When: Check access to feature requiring 'premium_unlock'
      const hasAccess = featureGatingService.canAccessSync('advanced_search');

      // Then: Should deny access
      expect(hasAccess).toBe(false);
    });

    // E2E-7: Wrong product doesn't unlock other features
    it('should not grant access to feature from wrong product', () => {
      // Given: User has purchased 'data_export' only
      const purchase = createMockPurchase('data_export');
      mockDatabasePurchases([purchase]);

      // When: Check access to feature requiring 'premium_unlock'
      const hasAccess = featureGatingService.canAccessSync('advanced_search');

      // Then: Should deny access
      expect(hasAccess).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    // E2E-8: Product with no features
    it('should return empty array for product with no features', () => {
      // Given: Unknown product ID
      // When: Get features for unknown product
      const unlockedFeatures =
        featureGatingService.getUnlockedFeaturesByProduct('unknown_product');

      // Then: Should return empty array
      expect(unlockedFeatures).toEqual([]);
    });

    // E2E-9: Invalid product ID (null)
    it('should safely handle null product ID', () => {
      // Given: null product ID
      // When: Get features for null
      const unlockedFeatures =
        featureGatingService.getUnlockedFeaturesByProduct(null as any);

      // Then: Should return empty array
      expect(unlockedFeatures).toEqual([]);
    });

    // E2E-10: Invalid product ID (undefined)
    it('should safely handle undefined product ID', () => {
      // Given: undefined product ID
      // When: Get features for undefined
      const unlockedFeatures =
        featureGatingService.getUnlockedFeaturesByProduct(undefined as any);

      // Then: Should return empty array
      expect(unlockedFeatures).toEqual([]);
    });
  });

  describe('Integration Scenarios', () => {
    // E2E-11: Complete workflow - purchase and verify all features
    it('should support complete workflow of purchasing bundle and accessing all features', () => {
      // Given: User purchases premium_unlock
      const purchase = createMockPurchase('premium_unlock');
      mockDatabasePurchases([purchase]);

      // When: Get all features and check access
      const unlockedFeatures =
        featureGatingService.getUnlockedFeaturesByProduct('premium_unlock');
      const canAccessFirst = featureGatingService.canAccessSync(
        unlockedFeatures[0].id
      );
      const canAccessSecond = featureGatingService.canAccessSync(
        unlockedFeatures[1].id
      );

      // Then: Should have 2 features and both should be accessible
      expect(unlockedFeatures).toHaveLength(2);
      expect(canAccessFirst).toBe(true);
      expect(canAccessSecond).toBe(true);
    });

    // E2E-12: Feature definitions match actual products
    it('should have consistent feature definitions matching products', () => {
      // Given: All feature definitions
      const allFeatures = featureGatingService.getFeatureDefinitions();
      const premiumFeatures = allFeatures.filter(
        (f) => f.level === 'premium' && f.requiredProductId
      );

      // When: Group features by required product
      const productMap = new Map<string, typeof premiumFeatures>();
      premiumFeatures.forEach((f) => {
        const productId = f.requiredProductId!;
        if (!productMap.has(productId)) {
          productMap.set(productId, []);
        }
        productMap.get(productId)!.push(f);
      });

      // Then: Should match getUnlockedFeaturesByProduct results
      productMap.forEach((features, productId) => {
        const unlockedFeatures =
          featureGatingService.getUnlockedFeaturesByProduct(productId);
        expect(unlockedFeatures).toHaveLength(features.length);
        expect(unlockedFeatures.map((f) => f.id).sort()).toEqual(
          features.map((f) => f.id).sort()
        );
      });
    });
  });
});
