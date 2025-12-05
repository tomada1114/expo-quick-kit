/**
 * Purchase Repository Tests - iOS StoreKit2 (Task 3.2)
 *
 * Tests for iOS StoreKit2 purchase integration:
 * - Product metadata loading
 * - Purchase flow with JWS receipt
 * - Cache fallback for offline
 * - Error handling
 */

import { Platform } from 'react-native';
import type { Product, Transaction } from '../types';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-secure-store');
jest.mock('jose');
jest.mock('react-native-purchases');
jest.mock('../../infrastructure/storekit2', () => ({
  StoreKit2: {
    loadProducts: jest.fn(),
    launchPurchaseFlow: jest.fn(),
    requestPurchaseHistory: jest.fn(),
  },
  isStoreKit2Error: jest.fn((error: unknown) => {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      typeof (error as { code: unknown }).code === 'string' &&
      typeof (error as { message: unknown }).message === 'string'
    );
  }),
}));

import { purchaseRepository } from '../repository';
import { StoreKit2 } from '../../infrastructure/storekit2';
import * as secureStore from 'expo-secure-store';
import * as jose from 'jose';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';

const mockedSecureStore = secureStore as jest.Mocked<typeof secureStore>;
const mockedJose = jose as jest.Mocked<typeof jose>;
const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockedPurchases = Purchases as jest.Mocked<typeof Purchases>;

const mockedStoreKit2 = StoreKit2 as jest.Mocked<typeof StoreKit2>;

describe('Purchase Repository - iOS StoreKit2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';

    // Mock jose for JWS verification
    mockedJose.importSPKI = jest
      .fn()
      .mockResolvedValue({ alg: 'ES256' } as any);
    mockedJose.jwtVerify = jest.fn().mockResolvedValue({
      payload: {},
      protected: 'header',
    } as any);

    // Mock secure store for verification key
    mockedSecureStore.getItemAsync = jest.fn().mockResolvedValue(
      JSON.stringify({
        alg: 'ES256',
        crv: 'P-256',
        kty: 'EC',
        x: 'test_x',
        y: 'test_y',
      })
    );
  });

  describe('loadProductMetadata', () => {
    beforeEach(() => {
      // Setup default AsyncStorage mock to return null (no cache)
      mockedAsyncStorage.getItem = jest.fn().mockResolvedValue(null);
      mockedAsyncStorage.setItem = jest.fn().mockResolvedValue(undefined);
      // Setup default RevenueCat mock
      mockedPurchases.getOfferings = jest
        .fn()
        .mockRejectedValue(new Error('RevenueCat unavailable'));
    });

    // ==================== HAPPY PATH TESTS ====================
    describe('Happy Path - Successful metadata loading', () => {
      it('should load product metadata successfully from StoreKit2 on iOS', async () => {
        // Given: Platform is iOS and StoreKit2 returns valid products
        Platform.OS = 'ios';
        const mockProducts: Product[] = [
          {
            id: 'premium_unlock',
            title: 'Premium Unlock',
            description: 'Permanent premium access',
            price: 9.99,
            priceString: '$9.99',
            currencyCode: 'USD',
          },
        ];
        mockedStoreKit2.loadProducts.mockResolvedValueOnce({
          products: mockProducts,
          requestId: 'test-request-id',
        });

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return success with products and cache them
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(mockProducts);
          expect(result.data).toHaveLength(1);
          expect(result.data[0].id).toBe('premium_unlock');
          expect(result.data[0].price).toBe(9.99);
        }
        expect(mockedStoreKit2.loadProducts).toHaveBeenCalledWith([
          'premium_unlock',
        ]);
        expect(mockedAsyncStorage.setItem).toHaveBeenCalled();
      });

      it('should load multiple products successfully from StoreKit2', async () => {
        // Given: Multiple product IDs requested on iOS
        Platform.OS = 'ios';
        const mockProducts: Product[] = [
          {
            id: 'product_1',
            title: 'Product 1',
            description: 'Description 1',
            price: 4.99,
            priceString: '$4.99',
            currencyCode: 'USD',
          },
          {
            id: 'product_2',
            title: 'Product 2',
            description: 'Description 2',
            price: 9.99,
            priceString: '$9.99',
            currencyCode: 'USD',
          },
        ];
        mockedStoreKit2.loadProducts.mockResolvedValueOnce({
          products: mockProducts,
          requestId: 'test-request-id',
        });

        // When: Loading multiple product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'product_1',
          'product_2',
        ]);

        // Then: Should return all products
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveLength(2);
          expect(result.data[0].id).toBe('product_1');
          expect(result.data[1].id).toBe('product_2');
        }
      });

      it('should load products successfully from RevenueCat on Android', async () => {
        // Given: Platform is Android and RevenueCat returns valid offerings
        Platform.OS = 'android';
        const mockOfferings = {
          current: {
            availablePackages: [
              {
                identifier: 'premium_package',
                product: {
                  identifier: 'premium_unlock',
                  title: 'Premium Unlock',
                  description: 'Permanent access',
                  price: 9.99,
                  priceString: '$9.99',
                  currencyCode: 'USD',
                },
              },
            ],
          },
        };
        mockedPurchases.getOfferings.mockResolvedValueOnce(
          mockOfferings as any
        );

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return success with products
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveLength(1);
          expect(result.data[0].id).toBe('premium_unlock');
          expect(result.data[0].price).toBe(9.99);
        }
      });

      it('should fallback to RevenueCat when StoreKit2 fails on iOS', async () => {
        // Given: StoreKit2 fails but RevenueCat succeeds
        Platform.OS = 'ios';
        mockedStoreKit2.loadProducts.mockRejectedValueOnce(
          new Error('StoreKit2 unavailable')
        );
        const mockOfferings = {
          current: {
            availablePackages: [
              {
                identifier: 'premium_package',
                product: {
                  identifier: 'premium_unlock',
                  title: 'Premium Unlock',
                  description: 'Permanent access',
                  price: 9.99,
                  priceString: '$9.99',
                  currencyCode: 'USD',
                },
              },
            ],
          },
        };
        mockedPurchases.getOfferings.mockResolvedValueOnce(
          mockOfferings as any
        );

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return success from RevenueCat fallback
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveLength(1);
          expect(result.data[0].id).toBe('premium_unlock');
        }
      });

      it('should return empty array when empty productIds requested', async () => {
        // Given: Empty productIds array
        Platform.OS = 'ios';

        // When: Loading product metadata with empty array
        const result = await purchaseRepository.loadProductMetadata([]);

        // Then: Should return empty array without making API calls
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual([]);
        }
        expect(mockedStoreKit2.loadProducts).not.toHaveBeenCalled();
      });
    });

    // ==================== OFFLINE PATH TESTS ====================
    describe('Offline Path - Cache fallback', () => {
      it('should return cached products when network error occurs and cache is fresh', async () => {
        // Given: StoreKit2 returns network error and cache has fresh products (< 24h)
        Platform.OS = 'ios';
        const cachedProducts: Product[] = [
          {
            id: 'premium_unlock',
            title: 'Premium',
            description: 'Desc',
            price: 9.99,
            priceString: '$9.99',
            currencyCode: 'USD',
          },
        ];
        const cacheData = {
          products: cachedProducts,
          timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
        };
        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(cacheData)
        );
        mockedStoreKit2.loadProducts.mockRejectedValueOnce(
          new Error('Network connection lost')
        );

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return cached products
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(cachedProducts);
          expect(result.data[0].id).toBe('premium_unlock');
        }
      });

      it('should return cached products when RevenueCat fails on Android', async () => {
        // Given: Android platform with RevenueCat failure and valid cache
        Platform.OS = 'android';
        const cachedProducts: Product[] = [
          {
            id: 'premium_unlock',
            title: 'Premium',
            description: 'Desc',
            price: 9.99,
            priceString: '$9.99',
            currencyCode: 'USD',
          },
        ];
        const cacheData = {
          products: cachedProducts,
          timestamp: Date.now() - 1000,
        };
        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(cacheData)
        );
        mockedPurchases.getOfferings.mockRejectedValueOnce(
          new Error('Network timeout')
        );

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return cached products
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(cachedProducts);
        }
      });

      it('should return cached products when RevenueCat offerings are empty', async () => {
        // Given: RevenueCat returns no current offerings but cache exists
        Platform.OS = 'android';
        const cachedProducts: Product[] = [
          {
            id: 'premium_unlock',
            title: 'Premium',
            description: 'Desc',
            price: 9.99,
            priceString: '$9.99',
            currencyCode: 'USD',
          },
        ];
        const cacheData = {
          products: cachedProducts,
          timestamp: Date.now(),
        };
        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(cacheData)
        );
        mockedPurchases.getOfferings.mockResolvedValueOnce({
          current: null,
        } as any);

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return cached products
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(cachedProducts);
        }
      });

      it('should return empty array when no offerings and no cache', async () => {
        // Given: No current offerings and no cache
        Platform.OS = 'android';
        mockedAsyncStorage.getItem.mockResolvedValueOnce(null);
        mockedPurchases.getOfferings.mockResolvedValueOnce({
          current: null,
        } as any);

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return empty array (success with no products)
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual([]);
        }
      });

      it('should not return expired cache (> 24h) when network error occurs', async () => {
        // Given: Network error and cache is expired (> 24h)
        Platform.OS = 'ios';
        const expiredCacheData = {
          products: [
            {
              id: 'premium_unlock',
              title: 'Premium',
              description: 'Desc',
              price: 9.99,
              priceString: '$9.99',
              currencyCode: 'USD',
            },
          ],
          timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        };
        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(expiredCacheData)
        );
        mockedStoreKit2.loadProducts.mockRejectedValueOnce(
          new Error('Network error')
        );
        mockedPurchases.getOfferings.mockRejectedValueOnce(
          new Error('Network error')
        );

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return network error (no cache fallback)
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('NETWORK_ERROR');
          expect(result.error.retryable).toBe(true);
        }
      });
    });

    // ==================== ERROR PATH TESTS ====================
    describe('Error Path - Error handling', () => {
      it('should return network error when both API and cache fail on iOS', async () => {
        // Given: Network error and no cache
        Platform.OS = 'ios';
        mockedAsyncStorage.getItem.mockResolvedValueOnce(null);
        mockedStoreKit2.loadProducts.mockRejectedValueOnce(
          new Error('Network connection issue')
        );
        mockedPurchases.getOfferings.mockRejectedValueOnce(
          new Error('Network connection issue')
        );

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return network error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('NETWORK_ERROR');
          expect(result.error.retryable).toBe(true);
        }
      });

      it('should return error when RevenueCat fails on Android with no cache', async () => {
        // Given: Android platform with RevenueCat failure and no cache
        Platform.OS = 'android';
        mockedAsyncStorage.getItem.mockResolvedValueOnce(null);
        mockedPurchases.getOfferings.mockRejectedValueOnce(
          new Error('Network timeout')
        );

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return network error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('NETWORK_ERROR');
          expect(result.error.retryable).toBe(true);
        }
      });

      it('should return error when StoreKit2 returns invalid response structure', async () => {
        // Given: StoreKit2 returns non-array products
        Platform.OS = 'ios';
        mockedStoreKit2.loadProducts.mockResolvedValueOnce({
          products: null as any, // Invalid response
          requestId: 'test-request-id',
        });

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('UNKNOWN_ERROR');
          expect(result.error.message).toContain('Invalid product response');
          expect(result.error.retryable).toBe(false);
        }
      });

      it('should return error for unsupported platform', async () => {
        // Given: Platform is not iOS or Android
        Platform.OS = 'web' as any;

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('UNKNOWN_ERROR');
          expect(result.error.message).toContain('not supported');
          expect(result.error.retryable).toBe(false);
        }
      });

      it('should return empty array when requested product not in offerings', async () => {
        // Given: RevenueCat offerings don't contain requested product
        Platform.OS = 'android';
        const mockOfferings = {
          current: {
            availablePackages: [
              {
                identifier: 'other_package',
                product: {
                  identifier: 'other_product',
                  title: 'Other Product',
                  description: 'Other desc',
                  price: 5.99,
                  priceString: '$5.99',
                  currencyCode: 'USD',
                },
              },
            ],
          },
        };
        mockedPurchases.getOfferings.mockResolvedValueOnce(
          mockOfferings as any
        );

        // When: Loading product metadata for 'premium_unlock'
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return success with empty array (product not found)
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual([]);
        }
      });

      it('should handle AsyncStorage read failure gracefully', async () => {
        // Given: AsyncStorage.getItem throws error
        Platform.OS = 'ios';
        mockedAsyncStorage.getItem.mockRejectedValueOnce(
          new Error('Storage read error')
        );
        mockedStoreKit2.loadProducts.mockRejectedValueOnce(
          new Error('Network error')
        );
        mockedPurchases.getOfferings.mockRejectedValueOnce(
          new Error('Network error')
        );

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return network error (cache read failed silently)
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('NETWORK_ERROR');
        }
      });

      it('should silently fail when cache write fails', async () => {
        // Given: AsyncStorage.setItem throws error
        Platform.OS = 'ios';
        const mockProducts: Product[] = [
          {
            id: 'premium_unlock',
            title: 'Premium',
            description: 'Desc',
            price: 9.99,
            priceString: '$9.99',
            currencyCode: 'USD',
          },
        ];
        mockedStoreKit2.loadProducts.mockResolvedValueOnce({
          products: mockProducts,
          requestId: 'test-request-id',
        });
        mockedAsyncStorage.setItem.mockRejectedValueOnce(
          new Error('Storage quota exceeded')
        );

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should still return success (cache is optional)
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(mockProducts);
        }
      });

      it('should handle corrupted cache data gracefully', async () => {
        // Given: Cache contains invalid JSON
        Platform.OS = 'ios';
        mockedAsyncStorage.getItem.mockResolvedValueOnce('{"invalid json');
        mockedStoreKit2.loadProducts.mockRejectedValueOnce(
          new Error('Network error')
        );
        mockedPurchases.getOfferings.mockRejectedValueOnce(
          new Error('Network error')
        );

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should treat corrupted cache as no cache and return error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('NETWORK_ERROR');
        }
      });
    });

    // ==================== EDGE CASES ====================
    describe('Edge Cases - Boundary conditions', () => {
      it('should handle product with zero price', async () => {
        // Given: Product with price 0
        Platform.OS = 'ios';
        const mockProducts: Product[] = [
          {
            id: 'free_trial',
            title: 'Free Trial',
            description: 'Desc',
            price: 0,
            priceString: 'Free',
            currencyCode: 'USD',
          },
        ];
        mockedStoreKit2.loadProducts.mockResolvedValueOnce({
          products: mockProducts,
          requestId: 'test-request-id',
        });

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'free_trial',
        ]);

        // Then: Should return product with zero price
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data[0].price).toBe(0);
        }
      });

      it('should handle product with very high price', async () => {
        // Given: Product with very high price
        Platform.OS = 'ios';
        const mockProducts: Product[] = [
          {
            id: 'enterprise',
            title: 'Enterprise',
            description: 'Desc',
            price: 99999.99,
            priceString: '$99,999.99',
            currencyCode: 'USD',
          },
        ];
        mockedStoreKit2.loadProducts.mockResolvedValueOnce({
          products: mockProducts,
          requestId: 'test-request-id',
        });

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'enterprise',
        ]);

        // Then: Should return product with high price
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data[0].price).toBe(99999.99);
        }
      });

      it('should handle very large product ID list', async () => {
        // Given: 50 product IDs
        Platform.OS = 'ios';
        const productIds = Array.from({ length: 50 }, (_, i) => `product_${i}`);
        const mockProducts: Product[] = productIds.map((id, i) => ({
          id,
          title: `Product ${i}`,
          description: `Description ${i}`,
          price: 9.99,
          priceString: '$9.99',
          currencyCode: 'USD',
        }));
        mockedStoreKit2.loadProducts.mockResolvedValueOnce({
          products: mockProducts,
          requestId: 'test-request-id',
        });

        // When: Loading 50 products
        const result = await purchaseRepository.loadProductMetadata(productIds);

        // Then: Should return all 50 products
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveLength(50);
        }
      });

      it('should handle product with empty description', async () => {
        // Given: Product with empty description
        Platform.OS = 'ios';
        const mockProducts: Product[] = [
          {
            id: 'premium_unlock',
            title: 'Premium',
            description: '',
            price: 9.99,
            priceString: '$9.99',
            currencyCode: 'USD',
          },
        ];
        mockedStoreKit2.loadProducts.mockResolvedValueOnce({
          products: mockProducts,
          requestId: 'test-request-id',
        });

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return product with empty description
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data[0].description).toBe('');
        }
      });

      it('should cache at boundary condition (just before 24h expiry)', async () => {
        // Given: Cache timestamp 23h 59m ago (still valid)
        Platform.OS = 'ios';
        const cachedProducts: Product[] = [
          {
            id: 'premium_unlock',
            title: 'Premium',
            description: 'Desc',
            price: 9.99,
            priceString: '$9.99',
            currencyCode: 'USD',
          },
        ];
        const cacheData = {
          products: cachedProducts,
          timestamp: Date.now() - (23 * 60 * 60 * 1000 + 59 * 60 * 1000), // 23h 59m ago
        };
        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(cacheData)
        );
        mockedStoreKit2.loadProducts.mockRejectedValueOnce(
          new Error('Network error')
        );

        // When: Loading product metadata
        const result = await purchaseRepository.loadProductMetadata([
          'premium_unlock',
        ]);

        // Then: Should return cached products (still valid)
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(cachedProducts);
        }
      });
    });

    // ==================== ORIGINAL TESTS ====================
    it('should handle empty products array', async () => {
      Platform.OS = 'ios';
      mockedStoreKit2.loadProducts.mockResolvedValueOnce({
        products: [],
        requestId: 'test-request-id',
      });

      const result = await purchaseRepository.loadProductMetadata([
        'premium_unlock',
      ]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('launchPurchaseFlow', () => {
    it('should launch purchase and return transaction with JWS receipt', async () => {
      const mockTransaction: Transaction = {
        transactionId: 'ios-transaction-123456789',
        productId: 'premium_unlock',
        purchaseDate: new Date(),
        receiptData:
          'eyJhbGciOiJFQzI1NiJ9.eyJ0cmFuc2FjdGlvbklkIjoiaW9zLXRyYW5zYWN0aW9uLTEyMzQ1Njc4OSJ9.signature',
      };

      mockedStoreKit2.launchPurchaseFlow.mockResolvedValueOnce({
        transaction: mockTransaction,
      });

      const result =
        await purchaseRepository.launchPurchaseFlow('premium_unlock');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactionId).toBe('ios-transaction-123456789');
        expect(result.data.receiptData).toBeDefined();
      }
    });

    it('should handle user cancellation', async () => {
      mockedStoreKit2.launchPurchaseFlow.mockRejectedValueOnce({
        code: 'USER_CANCELLED',
        message: 'User cancelled',
      });

      const result =
        await purchaseRepository.launchPurchaseFlow('premium_unlock');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PURCHASE_CANCELLED');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should handle network error during purchase', async () => {
      mockedStoreKit2.launchPurchaseFlow.mockRejectedValueOnce(
        new Error('Network error during payment')
      );

      const result =
        await purchaseRepository.launchPurchaseFlow('premium_unlock');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NETWORK_ERROR');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('should handle store problem error', async () => {
      mockedStoreKit2.launchPurchaseFlow.mockRejectedValueOnce({
        code: 'STORE_PROBLEM',
        message: 'App Store unavailable',
        nativeErrorCode: 600,
      });

      const result =
        await purchaseRepository.launchPurchaseFlow('premium_unlock');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('STORE_PROBLEM_ERROR');
        expect(result.error.retryable).toBe(true);
        expect(result.error.platform).toBe('ios');
      }
    });
  });

  describe('getCachedProducts', () => {
    it('should return empty array when no cache', async () => {
      const result = await purchaseRepository.getCachedProducts();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('requestAllPurchaseHistory', () => {
    it('should fetch all purchases from StoreKit2', async () => {
      const mockTransactions: Transaction[] = [
        {
          transactionId: 'ios-txn-001',
          productId: 'premium_unlock',
          purchaseDate: new Date('2025-01-01'),
          receiptData: 'jws-receipt-data-001',
        },
      ];

      mockedStoreKit2.requestPurchaseHistory.mockResolvedValueOnce({
        transactions: mockTransactions,
      });

      const result = await purchaseRepository.requestAllPurchaseHistory();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].transactionId).toBe('ios-txn-001');
      }
    });

    it('should handle error when requesting history', async () => {
      mockedStoreKit2.requestPurchaseHistory.mockRejectedValueOnce(
        new Error('Network timeout during fetch')
      );

      const result = await purchaseRepository.requestAllPurchaseHistory();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NETWORK_ERROR');
        expect(result.error.retryable).toBe(true);
      }
    });
  });

  describe('verifyTransaction - Receipt signature validation', () => {
    it('should verify a valid iOS JWS signature successfully', async () => {
      // Valid JWS format: header.payload.signature (3 parts separated by dots)
      // Payload must include required fields: transactionId, productId, purchaseDate
      const validJWS = `${Buffer.from('{"alg":"ES256","typ":"JWT"}').toString('base64')}.${Buffer.from('{"transactionId":"ios-txn-valid-001","productId":"premium_unlock","purchaseDate":1704067200000}').toString('base64')}.${Buffer.from('signature').toString('base64')}`;

      const validTransaction: Transaction = {
        transactionId: 'ios-txn-valid-001',
        productId: 'premium_unlock',
        purchaseDate: new Date('2025-01-01'),
        receiptData: validJWS,
      };

      const result =
        await purchaseRepository.verifyTransaction(validTransaction);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should reject invalid JWS signature', async () => {
      const invalidTransaction: Transaction = {
        transactionId: 'ios-txn-invalid-001',
        productId: 'premium_unlock',
        purchaseDate: new Date('2025-01-01'),
        receiptData: 'eyJhbGciOiJFQzI1NiIsIng1YyI6IkkTVkFMSURSRUNFSVBUIn0',
      };

      const result =
        await purchaseRepository.verifyTransaction(invalidTransaction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PURCHASE_INVALID');
        expect(result.error.retryable).toBe(false);
        expect(result.error.reason).toBe('not_signed');
      }
    });

    it('should handle missing signature for Android', async () => {
      const androidNoSigTransaction: Transaction = {
        transactionId: 'android-txn-nosig-001',
        productId: 'premium_unlock',
        purchaseDate: new Date('2025-01-01'),
        receiptData:
          '{"orderId":"GPA.1234-5678-9012-34567","packageName":"com.example.app"}',
      };

      const result = await purchaseRepository.verifyTransaction(
        androidNoSigTransaction
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PURCHASE_INVALID');
        expect(result.error.reason).toBe('not_signed');
      }
    });

    it('should handle null transaction', async () => {
      const result = await purchaseRepository.verifyTransaction(
        null as unknown as Transaction
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });

    it('should handle malformed receipt data', async () => {
      const malformedTransaction: Transaction = {
        transactionId: 'ios-txn-malformed-001',
        productId: 'premium_unlock',
        purchaseDate: new Date('2025-01-01'),
        receiptData: '!!!INVALID_BASE64_STRING!!!NOT_A_RECEIPT!!!',
      };

      const result =
        await purchaseRepository.verifyTransaction(malformedTransaction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PURCHASE_INVALID');
      }
    });
  });

  describe('Error mapping', () => {
    it('should map STORE_PROBLEM to STORE_PROBLEM_ERROR with platform', async () => {
      mockedStoreKit2.launchPurchaseFlow.mockRejectedValueOnce({
        code: 'STORE_PROBLEM',
        message: 'App Store unavailable',
        nativeErrorCode: 600,
      });

      const result =
        await purchaseRepository.launchPurchaseFlow('premium_unlock');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('STORE_PROBLEM_ERROR');
        expect(result.error.platform).toBe('ios');
      }
    });
  });
});
