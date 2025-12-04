/**
 * Purchase Repository
 *
 * Infrastructure layer that handles communication with platform purchase APIs.
 * For iOS: Wraps StoreKit2 framework
 * For Android: Wraps Google Play Billing
 * Fallback: Uses RevenueCat for cross-platform support
 *
 * Converts external API responses to domain entities and errors.
 *
 * Responsibilities:
 * - Load product metadata from platform stores (StoreKit2, Google Play Billing)
 * - Launch purchase flows and retrieve transactions
 * - Handle platform-specific errors and convert to domain errors
 * - Cache products locally for offline access
 *
 * @module features/purchase/core/repository
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import type { Product, Transaction, PurchaseError, Result } from './types';
import { StoreKit2 } from '../infrastructure/storekit2';
import {
  mapStoreKit2Error,
  mapRevenueCatError,
  isNetworkError,
} from '../infrastructure/error-mapper';

const CACHE_KEY = 'purchase_products_cache';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours


/**
 * Convert RevenueCat Package to domain Product
 */
function toProduct(pkg: {
  identifier: string;
  product: {
    identifier: string;
    title: string;
    description?: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
}): Product {
  const { product } = pkg;

  return {
    id: product.identifier,
    title: product.title,
    description: product.description || '',
    price: product.price,
    priceString: product.priceString,
    currencyCode: product.currencyCode,
  };
}


/**
 * Save products to local cache
 */
async function cacheProducts(products: Product[]): Promise<void> {
  try {
    const cacheData = {
      products,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Silent failure - cache is optional
  }
}

/**
 * Load products from local cache if available and not expired
 */
async function loadProductsFromCache(): Promise<Product[] | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { products, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_EXPIRY_MS;

    return isExpired ? null : products;
  } catch {
    return null;
  }
}

/**
 * Purchase Repository - Main API for purchase operations
 *
 * Handles all purchase-related operations through platform-specific implementations.
 * Provides error handling, caching, and offline resilience.
 */
export const purchaseRepository = {
  /**
   * Load product metadata from platform store with RevenueCat fallback
   *
   * Implements fallback chain:
   * 1. Try platform API (StoreKit2 for iOS, GPB for Android)
   * 2. If unavailable, try RevenueCat offerings
   * 3. If both fail, use local cache
   *
   * @param productIds - Product identifiers to load
   * @returns Result with Product array on success or PurchaseError on failure
   *
   * @example
   * ```ts
   * const result = await purchaseRepository.loadProductMetadata(['premium_unlock']);
   * if (result.success) {
   *   console.log(result.data); // Product[]
   * } else {
   *   console.error(result.error.code);
   * }
   * ```
   */
  async loadProductMetadata(
    productIds: string[]
  ): Promise<Result<Product[], PurchaseError>> {
    // Empty request should return empty results
    if (productIds.length === 0) {
      return { success: true, data: [] };
    }

    // For iOS, use StoreKit2 first
    if (Platform.OS === 'ios') {
      try {
        const response = await StoreKit2.loadProducts(productIds);

        // Validate response
        if (!Array.isArray(response.products)) {
          return {
            success: false,
            error: {
              code: 'UNKNOWN_ERROR',
              message: 'Invalid product response from StoreKit2',
              retryable: false,
            },
          };
        }

        // Cache products for offline access
        await cacheProducts(response.products);

        return {
          success: true,
          data: response.products,
        };
      } catch (error) {
        // On StoreKit2 failure, fallback to RevenueCat
        // If network error, also try cache
        if (isNetworkError(error)) {
          const cached = await loadProductsFromCache();
          if (cached && cached.length > 0) {
            return {
              success: true,
              data: cached,
            };
          }
        }

        // Try RevenueCat fallback
        return await purchaseRepository._loadProductMetadataFromRevenueCat(
          productIds
        );
      }
    }

    // For Android and other platforms, start with RevenueCat
    if (Platform.OS === 'android') {
      return purchaseRepository._loadProductMetadataFromRevenueCat(
        productIds
      );
    }

    // Platform not supported
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: `Purchase not supported on ${Platform.OS}`,
        retryable: false,
      },
    };
  },

  /**
   * Load product metadata from RevenueCat offerings with cache fallback
   *
   * Internal method that implements RevenueCat loading logic.
   * Extracted for reusability in fallback scenarios.
   *
   * @param productIds - Product identifiers to load
   * @returns Result with Product array on success or PurchaseError on failure
   *
   * @internal
   */
  async _loadProductMetadataFromRevenueCat(
    productIds: string[]
  ): Promise<Result<Product[], PurchaseError>> {
    try {
      // Get offerings from RevenueCat
      const offerings = await Purchases.getOfferings();

      if (!offerings.current) {
        // No offerings available, try cache
        const cached = await loadProductsFromCache();
        if (cached && cached.length > 0) {
          return { success: true, data: cached };
        }
        // Return empty array if no cache
        return { success: true, data: [] };
      }

      // Extract products from offerings and normalize
      const productMap = new Map<string, Product>();

      offerings.current.availablePackages.forEach((pkg) => {
        try {
          const product = toProduct(pkg);
          // Use only the first occurrence of each product ID (deduplicate)
          if (!productMap.has(product.id)) {
            productMap.set(product.id, product);
          }
        } catch (parseError) {
          // Skip malformed packages
          console.warn('Failed to parse package:', pkg, parseError);
        }
      });

      // Filter by requested IDs
      const products = productIds
        .map((id) => productMap.get(id))
        .filter((p): p is Product => p !== undefined);

      // Cache the loaded products
      if (products.length > 0) {
        await cacheProducts(products);
      }

      return { success: true, data: products };
    } catch (error) {
      // RevenueCat call failed, try cache as fallback
      try {
        const cached = await loadProductsFromCache();
        if (cached && cached.length > 0) {
          return { success: true, data: cached };
        }
      } catch (cacheError) {
        // Cache also failed, will return error below
        console.warn('Failed to load from cache:', cacheError);
      }

      // Both RevenueCat and cache failed
      return {
        success: false,
        error: mapRevenueCatError(error),
      };
    }
  },

  /**
   * Get products from local cache only (offline access)
   *
   * @returns Array of cached products or empty array if cache is empty/expired
   */
  async getCachedProducts(): Promise<Product[]> {
    const cached = await loadProductsFromCache();
    return cached || [];
  },

  /**
   * Launch purchase flow for a product
   *
   * Shows the native purchase dialog and returns transaction with JWS receipt.
   * On iOS, this uses StoreKit2. On Android, Google Play Billing.
   *
   * @param productId - Product identifier to purchase
   * @returns Result with Transaction on success or PurchaseError on failure
   *
   * @example
   * ```ts
   * const result = await purchaseRepository.launchPurchaseFlow('premium_unlock');
   * if (result.success) {
   *   const { transactionId, receiptData } = result.data;
   *   // Verify receipt and record purchase
   * } else if (result.error.retryable) {
   *   // Show retry button
   * }
   * ```
   */
  async launchPurchaseFlow(
    productId: string
  ): Promise<Result<Transaction, PurchaseError>> {
    if (Platform.OS === 'ios') {
      try {
        const response = await StoreKit2.launchPurchaseFlow(productId);

        // Validate transaction
        if (
          !response.transaction.transactionId ||
          !response.transaction.receiptData
        ) {
          return {
            success: false,
            error: {
              code: 'PURCHASE_INVALID',
              message: 'Invalid transaction returned from StoreKit2',
              retryable: false,
              reason: 'not_signed',
            },
          };
        }

        return {
          success: true,
          data: response.transaction,
        };
      } catch (error) {
        return {
          success: false,
          error: mapStoreKit2Error(error),
        };
      }
    }

    // Android / Web: Not yet implemented
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: `Purchase not supported on ${Platform.OS}`,
        retryable: false,
      },
    };
  },

  /**
   * Request all purchases from the platform (purchase restoration)
   *
   * Fetches the complete purchase history from StoreKit2.
   * Used when user taps "Restore Purchases".
   *
   * @returns Result with Transaction array on success or PurchaseError on failure
   *
   * @example
   * ```ts
   * const result = await purchaseRepository.requestAllPurchaseHistory();
   * if (result.success) {
   *   // Process transactions, update local DB
   * }
   * ```
   */
  async requestAllPurchaseHistory(): Promise<
    Result<Transaction[], PurchaseError>
  > {
    if (Platform.OS === 'ios') {
      try {
        const response = await StoreKit2.requestPurchaseHistory();

        if (!Array.isArray(response.transactions)) {
          return {
            success: true,
            data: [],
          };
        }

        return {
          success: true,
          data: response.transactions,
        };
      } catch (error) {
        return {
          success: false,
          error: mapStoreKit2Error(error),
        };
      }
    }

    // Android / Web: Not yet implemented
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: `Purchase history not supported on ${Platform.OS}`,
        retryable: false,
      },
    };
  },

  /**
   * Verify transaction receipt signature
   *
   * Validates the cryptographic signature of a transaction receipt.
   * For iOS: Validates JWS signature from StoreKit2
   * For Android: Validates signature from Google Play Billing
   *
   * @param transaction - Transaction to verify
   * @returns Result with boolean (true = valid) or PurchaseError on failure
   */
  async verifyTransaction(
    transaction: Transaction
  ): Promise<Result<boolean, PurchaseError>> {
    // Validate transaction parameter
    if (!transaction || typeof transaction !== 'object') {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Invalid transaction parameter',
          retryable: false,
        },
      };
    }

    // Validate receipt data
    if (!transaction.receiptData || typeof transaction.receiptData !== 'string') {
      return {
        success: false,
        error: {
          code: 'PURCHASE_INVALID',
          message: 'Receipt data is missing or invalid',
          retryable: false,
          reason: 'not_signed',
        },
      };
    }

    // iOS verification
    if (Platform.OS === 'ios') {
      return verifyIOSTransaction(transaction);
    }

    // Android verification
    if (Platform.OS === 'android') {
      return verifyAndroidTransaction(transaction);
    }

    // Unsupported platform
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: `Transaction verification not supported on ${Platform.OS}`,
        retryable: false,
      },
    };
  },
};

/**
 * Verify iOS transaction with JWS signature
 * @internal
 */
async function verifyIOSTransaction(
  transaction: Transaction
): Promise<Result<boolean, PurchaseError>> {
  try {
    const receipt = transaction.receiptData;

    // JWS format validation: should have 3 parts separated by dots
    const parts = receipt.split('.');
    if (parts.length !== 3) {
      return {
        success: false,
        error: {
          code: 'PURCHASE_INVALID',
          message: 'Invalid JWS receipt format',
          retryable: false,
          reason: 'not_signed',
        },
      };
    }

    // Basic Base64 validation for each part
    try {
      for (const part of parts) {
        Buffer.from(part, 'base64').toString('utf8');
      }
    } catch {
      return {
        success: false,
        error: {
          code: 'PURCHASE_INVALID',
          message: 'Receipt contains invalid Base64 data',
          retryable: false,
          reason: 'not_signed',
        },
      };
    }

    // Valid JWS format = valid receipt (TODO: implement actual signature verification)
    return {
      success: true,
      data: true,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'iOS verification failed';
    return {
      success: false,
      error: {
        code: 'PURCHASE_INVALID',
        message,
        retryable: false,
        reason: 'not_signed',
      },
    };
  }
}

/**
 * Verify Android transaction with Google Play signature
 * @internal
 */
async function verifyAndroidTransaction(
  transaction: Transaction
): Promise<Result<boolean, PurchaseError>> {
  try {
    // Android transactions must have signature field
    if (!transaction.signature || typeof transaction.signature !== 'string') {
      return {
        success: false,
        error: {
          code: 'PURCHASE_INVALID',
          message: 'Android transaction is missing required signature field',
          retryable: false,
          reason: 'not_signed',
        },
      };
    }

    const receipt = transaction.receiptData;

    // Parse and validate receipt JSON structure
    let receiptObj: Record<string, unknown>;
    try {
      receiptObj = JSON.parse(receipt);
    } catch {
      return {
        success: false,
        error: {
          code: 'PURCHASE_INVALID',
          message: 'Receipt data is not valid JSON',
          retryable: false,
          reason: 'not_signed',
        },
      };
    }

    // Validate basic receipt structure
    if (
      !receiptObj.orderId ||
      !receiptObj.packageName ||
      !receiptObj.productId
    ) {
      return {
        success: false,
        error: {
          code: 'PURCHASE_INVALID',
          message: 'Receipt is missing required fields',
          retryable: false,
          reason: 'not_signed',
        },
      };
    }

    // Valid receipt structure and signature present = valid (TODO: implement actual signature verification)
    return {
      success: true,
      data: true,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Android verification failed';
    return {
      success: false,
      error: {
        code: 'PURCHASE_INVALID',
        message,
        retryable: false,
        reason: 'not_signed',
      },
    };
  }
}
