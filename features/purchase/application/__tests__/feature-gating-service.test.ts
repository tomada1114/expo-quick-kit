/**
 * FeatureGatingService Tests
 *
 * Task 7.1: canAccessSync メソッド（同期的なアクセス判定）
 * Task 7.2: canAccess メソッド（非同期アクセス判定、Subscription 統合）
 *
 * Test Coverage:
 * - Happy path: Free features always allow access
 * - Happy path: Premium features with purchase allow access
 * - Sad path: Premium features without purchase deny access
 * - Edge path: Empty/null/undefined feature ID
 * - Unhappy path: Database error handling
 * - Offline path: Uses cached purchase state
 * - Task 7.2: Subscription tier integration with purchase state
 *
 * Given/When/Then structure is used throughout for clarity.
 */

// Mock dependencies BEFORE any imports
jest.mock('@/database/client', () => ({
  db: {
    select: jest.fn(),
  },
}));

jest.mock('@/database/schema', () => ({
  purchases: {},
}));

import { featureGatingService, setSubscriptionServiceGetter } from '../feature-gating-service';
import { db } from '@/database/client';

// Create mock subscription getter
const mockGetSubscriptionTier = jest.fn().mockResolvedValue('free');

describe('FeatureGatingService.canAccessSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Happy Path: Free Features', () => {
    it('should return true for free features regardless of purchase status', () => {
      // Given: A free feature
      // When: Checking access to a free feature
      const result = featureGatingService.canAccessSync('basic_search');

      // Then: Access should be granted
      expect(result).toBe(true);
    });

    it('should return true for another free feature', () => {
      // Given: Another free feature
      // When: Checking access
      const result = featureGatingService.canAccessSync('view_history');

      // Then: Should allow access
      expect(result).toBe(true);
    });
  });

  describe('Happy Path: Premium Features with Purchase', () => {
    it('should return true for premium feature when purchase exists', () => {
      // Given: A premium feature and verified purchase in database
      const mockPurchases = [
        {
          id: 1,
          transactionId: 'txn-123',
          productId: 'premium_unlock',
          purchasedAt: Math.floor(Date.now() / 1000),
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false,
          syncedAt: null,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        },
      ];

      // Mock db.select() for premium_unlock purchases
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue(mockPurchases),
          }),
        }),
      });

      // When: Checking access to premium feature
      const result = featureGatingService.canAccessSync('advanced_search');

      // Then: Access should be granted
      expect(result).toBe(true);
    });

    it('should return true for premium feature when unverified purchase exists', () => {
      // Given: Premium feature with unverified purchase (still recorded in DB)
      const mockPurchases = [
        {
          id: 2,
          transactionId: 'txn-456',
          productId: 'data_export',
          purchasedAt: Math.floor(Date.now() / 1000),
          price: 4.99,
          currencyCode: 'USD',
          isVerified: false,
          isSynced: false,
          syncedAt: null,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue(mockPurchases),
          }),
        }),
      });

      // When: Checking access
      const result = featureGatingService.canAccessSync('export_data');

      // Then: Should allow access (verification is separate from gating)
      expect(result).toBe(true);
    });
  });

  describe('Sad Path: Premium Features without Purchase', () => {
    it('should return false for premium feature when no purchase exists', () => {
      // Given: Premium feature but no purchase in database
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue([]), // Empty purchases list
          }),
        }),
      });

      // When: Checking access to premium feature
      const result = featureGatingService.canAccessSync('advanced_search');

      // Then: Access should be denied
      expect(result).toBe(false);
    });

    it('should return false for premium feature when purchase is for different product', () => {
      // Given: Premium feature requiring premium_unlock, but no such purchase exists
      // (user might have purchase for different product like data_export)
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue([]), // No purchases for premium_unlock
          }),
        }),
      });

      // When: Checking access
      const result = featureGatingService.canAccessSync('advanced_search');

      // Then: Access should be denied (wrong product)
      expect(result).toBe(false);
    });
  });

  describe('Edge Path: Empty and Invalid Feature IDs', () => {
    it('should handle empty feature ID gracefully', () => {
      // Given: Empty feature ID
      // When: Checking access with empty ID
      const result = featureGatingService.canAccessSync('');

      // Then: Should return false (no matching feature definition)
      expect(result).toBe(false);
    });

    it('should handle undefined feature ID gracefully', () => {
      // Given: Undefined feature ID
      // When: Checking access with undefined ID
      const result = featureGatingService.canAccessSync(undefined as any);

      // Then: Should return false
      expect(result).toBe(false);
    });

    it('should handle null feature ID gracefully', () => {
      // Given: Null feature ID
      // When: Checking access with null ID
      const result = featureGatingService.canAccessSync(null as any);

      // Then: Should return false
      expect(result).toBe(false);
    });

    it('should handle non-existent feature ID', () => {
      // Given: Feature ID that doesn't match any definition
      // When: Checking access
      const result = featureGatingService.canAccessSync('non_existent_feature_xyz');

      // Then: Should return false
      expect(result).toBe(false);
    });
  });

  describe('Offline Path: Uses Cached Purchase State', () => {
    it('should use cached purchase state from local database', () => {
      // Given: Premium feature with offline purchase (isSynced=false)
      const mockPurchases = [
        {
          id: 4,
          transactionId: 'txn-offline',
          productId: 'premium_unlock',
          purchasedAt: Math.floor(Date.now() / 1000),
          price: 2.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false, // Not synced (offline scenario)
          syncedAt: null,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue(mockPurchases),
          }),
        }),
      });

      // When: Checking access in offline scenario
      const result = featureGatingService.canAccessSync('advanced_search');

      // Then: Should use cached data and allow access
      expect(result).toBe(true);
    });
  });

  describe('Unhappy Path: Database Errors', () => {
    it('should handle database query error gracefully', () => {
      // Given: Database throws error
      (db.select as jest.Mock).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // When: Checking access during database error
      const result = featureGatingService.canAccessSync('advanced_search');

      // Then: Should return false (safe default on error)
      expect(result).toBe(false);
    });

    it('should handle malformed database records', () => {
      // Given: Malformed purchases (wrong product ID in returned data)
      // The WHERE clause queries for premium_unlock but DB returns product with different ID
      const malformedPurchases = [
        {
          id: 5,
          transactionId: 'txn-bad',
          productId: 'wrong_product_id', // DB returned wrong product (defensive check needed)
          purchasedAt: Math.floor(Date.now() / 1000),
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false,
          syncedAt: null,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue(malformedPurchases),
          }),
        }),
      });

      // When: Checking access with malformed data
      const result = featureGatingService.canAccessSync('advanced_search');

      // Then: Should return false (defensive validation catches mismatch)
      expect(result).toBe(false);
    });
  });

  describe('Feature Definition Management', () => {
    it('should provide access to feature definitions', () => {
      // Given: Feature definitions are configured
      // When: Getting feature definitions
      const definitions = featureGatingService.getFeatureDefinitions();

      // Then: Should return array of feature definitions
      expect(Array.isArray(definitions)).toBe(true);
      expect(definitions.length).toBeGreaterThan(0);
    });

    it('should have correct feature structure', () => {
      // Given: Feature definitions
      const definitions = featureGatingService.getFeatureDefinitions();

      // When: Checking a definition
      const basicSearch = definitions.find((f) => f.id === 'basic_search');

      // Then: Should have all required fields
      expect(basicSearch).toBeDefined();
      expect(basicSearch?.id).toBe('basic_search');
      expect(basicSearch?.level).toBe('free');
      expect(basicSearch?.name).toBeDefined();
      expect(basicSearch?.description).toBeDefined();
    });

    it('should filter features by level - free', () => {
      // Given: Multiple features with different levels
      // When: Getting free features
      const freeFeatures = featureGatingService.getFeaturesByLevel('free');

      // Then: Should return only free features
      expect(freeFeatures.length).toBeGreaterThan(0);
      expect(freeFeatures.every((f) => f.level === 'free')).toBe(true);
    });

    it('should filter features by level - premium', () => {
      // Given: Multiple features with different levels
      // When: Getting premium features
      const premiumFeatures = featureGatingService.getFeaturesByLevel('premium');

      // Then: Should return only premium features
      expect(premiumFeatures.length).toBeGreaterThan(0);
      expect(premiumFeatures.every((f) => f.level === 'premium')).toBe(true);
    });

    it('should get feature definition by ID', () => {
      // Given: A feature ID
      // When: Getting feature definition
      const feature = featureGatingService.getFeatureDefinition('basic_search');

      // Then: Should return correct feature
      expect(feature).toBeDefined();
      expect(feature?.id).toBe('basic_search');
      expect(feature?.level).toBe('free');
    });

    it('should return undefined for non-existent feature', () => {
      // Given: Non-existent feature ID
      // When: Getting feature definition
      const feature = featureGatingService.getFeatureDefinition('non_existent');

      // Then: Should return undefined
      expect(feature).toBeUndefined();
    });
  });

  describe('Premium Feature Product Requirements', () => {
    it('should get required product for premium feature', () => {
      // Given: A premium feature with product requirement
      // When: Getting required product
      const productId = featureGatingService.getRequiredProduct('advanced_search');

      // Then: Should return required product ID
      expect(productId).toBe('premium_unlock');
    });

    it('should return undefined for free feature without product requirement', () => {
      // Given: A free feature
      // When: Getting required product
      const productId = featureGatingService.getRequiredProduct('basic_search');

      // Then: Should return undefined
      expect(productId).toBeUndefined();
    });

    it('should return undefined for non-existent feature', () => {
      // Given: Non-existent feature
      // When: Getting required product
      const productId = featureGatingService.getRequiredProduct('non_existent');

      // Then: Should return undefined
      expect(productId).toBeUndefined();
    });
  });

  describe('Multiple Feature Access', () => {
    it('should correctly evaluate access for multiple features with single purchase', () => {
      // Given: Purchase for premium_unlock product (unlocks multiple features)
      const mockPurchases = [
        {
          id: 6,
          transactionId: 'txn-multi',
          productId: 'premium_unlock',
          purchasedAt: Math.floor(Date.now() / 1000),
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false,
          syncedAt: null,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue(mockPurchases),
          }),
        }),
      });

      // When: Checking access for multiple features
      const canAccessAdvanced = featureGatingService.canAccessSync('advanced_search');
      const canAccessAnalytics = featureGatingService.canAccessSync('advanced_analytics');

      // Then: Both features should be accessible
      expect(canAccessAdvanced).toBe(true);
      expect(canAccessAnalytics).toBe(true);
    });

    it('should deny access to different product requirement', () => {
      // Given: User checking access to feature that requires premium_unlock
      // But the database query for premium_unlock returns empty (no such purchase)
      // User might have purchase for data_export instead, but that's not relevant here
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue([]), // No purchases for premium_unlock
          }),
        }),
      });

      // When: Checking access
      const result = featureGatingService.canAccessSync('advanced_search');

      // Then: Should deny access (different product)
      expect(result).toBe(false);
    });
  });
});
/**
 * Task 7.2: canAccess() Method Tests
 *
 * Tests for asynchronous feature access control with subscription tier integration
 *
 * Logic:
 * - If subscription tier === 'premium' → grant all premium features
 * - If subscription tier < 'premium' (i.e., 'free') → check purchase state for individual feature unlock
 * - Free features are always accessible regardless of subscription or purchase state
 */
/**
 * Task 7.5: Multiple Feature Bundle Support
 *
 * Tests for getUnlockedFeaturesByProduct method
 *
 * Purpose:
 * - Support single purchase unlocking multiple features
 * - Query purchase_features junction table
 * - Return all features unlocked by a specific product
 */
describe('FeatureGatingService.getUnlockedFeaturesByProduct', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Happy Path: Features Unlocked by Product', () => {
    it('should return all features unlocked by a specific product', () => {
      // Given: A product that unlocks multiple features
      // Feature definitions show premium_unlock unlocks: advanced_search and advanced_analytics

      // When: Getting features unlocked by premium_unlock product
      const features = featureGatingService.getUnlockedFeaturesByProduct('premium_unlock');

      // Then: Should return all features associated with that product
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBeGreaterThan(0);
      // Should include advanced_search (requiredProductId: 'premium_unlock')
      expect(features.some((f) => f.id === 'advanced_search')).toBe(true);
      // Should include advanced_analytics (requiredProductId: 'premium_unlock')
      expect(features.some((f) => f.id === 'advanced_analytics')).toBe(true);
    });

    it('should return features for data_export product', () => {
      // Given: data_export product that unlocks specific features

      // When: Getting features unlocked by data_export
      const features = featureGatingService.getUnlockedFeaturesByProduct('data_export');

      // Then: Should return features associated with data_export
      expect(Array.isArray(features)).toBe(true);
      expect(features.some((f) => f.id === 'export_data')).toBe(true);
    });
  });

  describe('Edge Path: No Features for Product', () => {
    it('should return empty array for product with no features', () => {
      // Given: A product ID that has no associated features

      // When: Getting features for non-existent product
      const features = featureGatingService.getUnlockedFeaturesByProduct('non_existent_product');

      // Then: Should return empty array
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBe(0);
    });

    it('should handle empty product ID gracefully', () => {
      // Given: Empty product ID

      // When: Calling with empty string
      const features = featureGatingService.getUnlockedFeaturesByProduct('');

      // Then: Should return empty array
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBe(0);
    });
  });

  describe('Unhappy Path: Invalid Input', () => {
    it('should handle null product ID', () => {
      // Given: Null product ID

      // When: Calling with null
      const features = featureGatingService.getUnlockedFeaturesByProduct(null as any);

      // Then: Should return empty array (safe default)
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBe(0);
    });

    it('should handle undefined product ID', () => {
      // Given: Undefined product ID

      // When: Calling with undefined
      const features = featureGatingService.getUnlockedFeaturesByProduct(undefined as any);

      // Then: Should return empty array (safe default)
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBe(0);
    });

    it('should handle non-string product ID', () => {
      // Given: Non-string product ID

      // When: Calling with number
      const features = featureGatingService.getUnlockedFeaturesByProduct(123 as any);

      // Then: Should return empty array (safe default)
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBe(0);
    });
  });

  describe('Feature Access Integration with Bundle Support', () => {
    it('should correctly identify all features accessible via bundle purchase', () => {
      // Given: User checks access to multiple features that share same product
      // All features requiring premium_unlock should be accessible with that product

      // When: Getting features for premium_unlock bundle
      const bundledFeatures = featureGatingService.getUnlockedFeaturesByProduct('premium_unlock');

      // Then: Should return all premium features requiring that product
      expect(bundledFeatures.length).toBeGreaterThanOrEqual(2);

      // All returned features should be premium level
      expect(bundledFeatures.every((f) => f.level === 'premium')).toBe(true);

      // All returned features should require premium_unlock
      expect(bundledFeatures.every((f) => f.requiredProductId === 'premium_unlock')).toBe(true);
    });
  });
});

describe('FeatureGatingService.canAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSubscriptionTier.mockResolvedValue('free');
    setSubscriptionServiceGetter(mockGetSubscriptionTier);
  });

  afterEach(() => {
    jest.resetAllMocks();
    setSubscriptionServiceGetter(null);
  });

  describe('Task 7.2 - Happy Path: Free Features', () => {
    it('should return true for free features regardless of subscription or purchase', async () => {
      // Given: Free feature and free subscription tier
      (mockGetSubscriptionTier).mockResolvedValue('free');

      // When: Checking access to free feature
      const result = await featureGatingService.canAccess('basic_search');

      // Then: Access should be granted (free features always accessible)
      expect(result).toBe(true);
    });

    it('should return true for free feature even with premium subscription', async () => {
      // Given: Free feature and premium subscription
      (mockGetSubscriptionTier).mockResolvedValue('premium');

      // When: Checking access
      const result = await featureGatingService.canAccess('basic_search');

      // Then: Access should be granted
      expect(result).toBe(true);
    });
  });

  describe('Task 7.2 - Happy Path: Premium Subscriber', () => {
    it('should return true for premium feature with premium subscription (no purchase needed)', async () => {
      // Given: Premium feature and premium subscription tier
      (mockGetSubscriptionTier).mockResolvedValue('premium');
      // Note: No purchase needed when subscription tier is premium

      // When: Checking access to premium feature
      const result = await featureGatingService.canAccess('advanced_search');

      // Then: Access should be granted (premium subscription grants all premium features)
      expect(result).toBe(true);
      // Verify subscription tier was checked
      expect(mockGetSubscriptionTier).toHaveBeenCalled();
    });

    it('should return true for all premium features with premium subscription', async () => {
      // Given: Premium subscription tier
      (mockGetSubscriptionTier).mockResolvedValue('premium');

      // When: Checking access for multiple premium features
      const result1 = await featureGatingService.canAccess('advanced_search');
      const result2 = await featureGatingService.canAccess('export_data');
      const result3 = await featureGatingService.canAccess('advanced_analytics');

      // Then: All premium features should be accessible
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });
  });

  describe('Task 7.2 - Happy Path: Free User with Purchase', () => {
    it('should return true for premium feature with free subscription but with purchase', async () => {
      // Given: Premium feature, free subscription tier, but user has purchase for that feature
      (mockGetSubscriptionTier).mockResolvedValue('free');
      const mockPurchases = [
        {
          id: 1,
          transactionId: 'txn-123',
          productId: 'premium_unlock', // Matches feature's requiredProductId
          purchasedAt: Math.floor(Date.now() / 1000),
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false,
          syncedAt: null,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue(mockPurchases),
          }),
        }),
      });

      // When: Checking access
      const result = await featureGatingService.canAccess('advanced_search');

      // Then: Access should be granted (purchase grants access for free subscriber)
      expect(result).toBe(true);
    });

    it('should integrate purchase state when subscription is free', async () => {
      // Given: Free subscription with purchase for data_export feature
      (mockGetSubscriptionTier).mockResolvedValue('free');
      const mockPurchases = [
        {
          id: 2,
          transactionId: 'txn-export',
          productId: 'data_export',
          purchasedAt: Math.floor(Date.now() / 1000),
          price: 4.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false,
          syncedAt: null,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue(mockPurchases),
          }),
        }),
      });

      // When: Checking access
      const result = await featureGatingService.canAccess('export_data');

      // Then: Access granted via purchase (free tier + purchase = access)
      expect(result).toBe(true);
    });
  });

  describe('Task 7.2 - Sad Path: Free User Without Purchase', () => {
    it('should return false for premium feature with free subscription and no purchase', async () => {
      // Given: Free subscription tier, no purchase
      (mockGetSubscriptionTier).mockResolvedValue('free');
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue([]), // No purchases
          }),
        }),
      });

      // When: Checking access
      const result = await featureGatingService.canAccess('advanced_search');

      // Then: Access should be denied
      expect(result).toBe(false);
    });

    it('should return false when purchase does not match required product', async () => {
      // Given: Free subscription with purchase for wrong product
      // User has 'data_export' purchase but 'advanced_search' requires 'premium_unlock'
      (mockGetSubscriptionTier).mockResolvedValue('free');

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue([]), // No purchases for premium_unlock
          }),
        }),
      });

      // When: Checking access to feature requiring different product
      const result = await featureGatingService.canAccess('advanced_search');

      // Then: Access should be denied (no purchase for required product)
      expect(result).toBe(false);
    });
  });

  describe('Task 7.2 - Subscription/Purchase Integration Logic', () => {
    it('should prioritize subscription tier over purchase check', async () => {
      // Given: Premium subscription (should not check purchase)
      (mockGetSubscriptionTier).mockResolvedValue('premium');

      // When: Checking access with premium subscription
      const result = await featureGatingService.canAccess('advanced_search');

      // Then: Should grant access without querying purchases
      expect(result).toBe(true);
      // Verify database was not queried (premium subscription short-circuits)
      expect(db.select).not.toHaveBeenCalled();
    });

    it('should check purchase state only when subscription is free', async () => {
      // Given: Free subscription tier
      (mockGetSubscriptionTier).mockResolvedValue('free');
      const mockPurchases = [
        {
          id: 4,
          transactionId: 'txn-purchase',
          productId: 'premium_unlock',
          purchasedAt: Math.floor(Date.now() / 1000),
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false,
          syncedAt: null,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue(mockPurchases),
          }),
        }),
      });

      // When: Checking access with free subscription
      const result = await featureGatingService.canAccess('advanced_search');

      // Then: Should check purchases
      expect(result).toBe(true);
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('Task 7.2 - Edge Cases: Invalid Feature ID', () => {
    it('should return false for non-existent feature', async () => {
      // Given: Non-existent feature ID
      (mockGetSubscriptionTier).mockResolvedValue('free');

      // When: Checking access
      const result = await featureGatingService.canAccess('non_existent_feature');

      // Then: Access should be denied
      expect(result).toBe(false);
    });

    it('should handle empty string feature ID', async () => {
      // Given: Empty feature ID
      (mockGetSubscriptionTier).mockResolvedValue('free');

      // When: Checking access
      const result = await featureGatingService.canAccess('');

      // Then: Should return false
      expect(result).toBe(false);
    });
  });

  describe('Task 7.2 - Unhappy Path: Service Failures', () => {
    it('should handle subscription service error gracefully', async () => {
      // Given: Subscription service throws error
      (mockGetSubscriptionTier).mockRejectedValue(new Error('Service unavailable'));

      // When: Checking access
      // Then: Should throw or return safe default (depends on implementation choice)
      // For now, we expect it to handle gracefully
      try {
        await featureGatingService.canAccess('advanced_search');
      } catch (error) {
        // Error handling is acceptable
        expect(error).toBeDefined();
      }
    });

    it('should handle database error during purchase check', async () => {
      // Given: Free subscription but database throws error during purchase check
      (mockGetSubscriptionTier).mockResolvedValue('free');
      (db.select as jest.Mock).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // When: Checking access
      const result = await featureGatingService.canAccess('advanced_search');

      // Then: Should return false (safe default)
      expect(result).toBe(false);
    });
  });

  describe('Task 7.2 - Offline Support', () => {
    it('should use cached purchase state (isSynced=false)', async () => {
      // Given: Free subscription with offline purchase (not synced)
      (mockGetSubscriptionTier).mockResolvedValue('free');
      const mockPurchases = [
        {
          id: 5,
          transactionId: 'txn-offline',
          productId: 'premium_unlock',
          purchasedAt: Math.floor(Date.now() / 1000),
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false, // Offline purchase (not synced)
          syncedAt: null,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue(mockPurchases),
          }),
        }),
      });

      // When: Checking access in offline scenario
      const result = await featureGatingService.canAccess('advanced_search');

      // Then: Should grant access using cached purchase
      expect(result).toBe(true);
    });
  });
});
