/**
 * Android Google Play Billing Repository
 *
 * Infrastructure layer that handles communication with Google Play Billing Library v7+.
 * Converts Google Play Billing responses to domain entities and errors.
 *
 * Responsibilities:
 * - Query product metadata from Google Play Console
 * - Launch purchase flow via BillingClient
 * - Retrieve purchase history
 * - Map Google Play Billing errors to PurchaseError domain errors
 * - Manage local cache for offline support
 *
 * @module features/purchase/infrastructure/repository-android
 */

import type {
  Product,
  Transaction,
  PurchaseError,
  Result,
} from '../core/types';

/**
 * Google Play Billing Library error codes
 * Reference: https://developer.android.com/reference/com/android/billingclient/api/BillingClient.BillingResponseCode
 */
const BILLING_RESPONSE_CODES = {
  OK: 0,
  USER_CANCELED: 1,
  SERVICE_UNAVAILABLE: 2,
  BILLING_UNAVAILABLE: 3,
  ITEM_UNAVAILABLE: 4,
  DEVELOPER_ERROR: 5,
  ERROR: 6,
  ITEM_ALREADY_OWNED: 7,
  NETWORK_ERROR: 8,
} as const;

/**
 * Interface for Google Play Billing Library BillingClient
 * Represents the subset of BillingClient APIs used for one-time purchases
 */
interface BillingClient {
  /**
   * Query product details from Google Play Console
   * @param productIds - Array of product IDs to query
   */
  queryProductDetails(productIds: string[]): Promise<{
    productDetailsList: Array<{
      productId: string;
      title: string;
      description: string;
      oneTimePurchaseOfferDetails?: {
        priceMicros: number;
        formattedPrice: string;
        currencyCode: string;
      };
    }>;
    billingResult: {
      responseCode: number;
      debugMessage: string;
    };
  }>;

  /**
   * Launch the billing flow for a product
   * @param productId - Product ID to purchase
   */
  launchBillingFlow(productId: string): Promise<{
    responseCode: number;
    purchaseDetails?: {
      purchaseToken: string;
      productIds: string[];
      purchaseTimeMs: number;
      purchaseState: 0 | 1; // 0 = purchased, 1 = pending
      signature: string;
      originalJson: string;
    };
    debugMessage?: string;
  }>;

  /**
   * Query all past purchases from Google Play
   * Includes both confirmed and pending purchases
   */
  queryPurchasesAsync(): Promise<
    Array<{
      purchaseToken: string;
      productIds: string[];
      purchaseTimeMs: number;
      purchaseState: 0 | 1;
      signature: string;
      originalJson: string;
    }>
  >;
}

/**
 * Determine if error is a network-related error
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('unavailable') ||
      message.includes('connection')
    );
  }
  return false;
}

/**
 * Map Google Play Billing response code to PurchaseError
 */
function mapBillingResponseCodeToError(
  responseCode: number,
  debugMessage: string
): PurchaseError {
  switch (responseCode) {
    case BILLING_RESPONSE_CODES.USER_CANCELED:
      return {
        code: 'PURCHASE_CANCELLED',
        message: 'User cancelled the purchase',
        retryable: false,
      };

    case BILLING_RESPONSE_CODES.SERVICE_UNAVAILABLE:
    case BILLING_RESPONSE_CODES.BILLING_UNAVAILABLE:
      return {
        code: 'NETWORK_ERROR',
        message: 'Google Play Service unavailable. Please try again.',
        retryable: true,
        platform: 'android',
      };

    case BILLING_RESPONSE_CODES.ITEM_UNAVAILABLE:
      return {
        code: 'PRODUCT_UNAVAILABLE',
        message: 'Product is not available for purchase',
        retryable: false,
        productId: '',
      };

    case BILLING_RESPONSE_CODES.DEVELOPER_ERROR:
    case BILLING_RESPONSE_CODES.ERROR:
    case BILLING_RESPONSE_CODES.NETWORK_ERROR:
      return {
        code: 'STORE_PROBLEM_ERROR',
        message: debugMessage || 'Google Play Store error',
        retryable: true,
        nativeErrorCode: responseCode,
      };

    case BILLING_RESPONSE_CODES.ITEM_ALREADY_OWNED:
      return {
        code: 'PURCHASE_INVALID',
        message: 'Product is already owned',
        retryable: false,
        reason: 'revoked',
      };

    default:
      return {
        code: 'UNKNOWN_ERROR',
        message: debugMessage || 'Unknown error from Google Play Store',
        retryable: false,
      };
  }
}

/**
 * Convert Google Play Billing product price (in micros) to decimal
 * @param priceMicros - Price in micros (e.g., 9990000 = $9.99)
 * @returns Price as decimal number
 */
function convertMicrosToPrice(priceMicros: number): number {
  return priceMicros / 1_000_000;
}

/**
 * Convert Google Play Billing ProductDetails to domain Product
 */
function toProduct(productDetails: {
  productId: string;
  title: string;
  description: string;
  oneTimePurchaseOfferDetails?: {
    priceMicros: number;
    formattedPrice: string;
    currencyCode: string;
  };
}): Product | null {
  if (!productDetails.oneTimePurchaseOfferDetails) {
    return null;
  }

  const { priceMicros, formattedPrice, currencyCode } =
    productDetails.oneTimePurchaseOfferDetails;

  return {
    id: productDetails.productId,
    title: productDetails.title,
    description: productDetails.description,
    price: convertMicrosToPrice(priceMicros),
    priceString: formattedPrice,
    currencyCode,
  };
}

/**
 * Convert Google Play Billing PurchaseDetails to domain Transaction
 */
function toTransaction(purchaseDetails: {
  purchaseToken: string;
  productIds: string[];
  purchaseTimeMs: number;
  purchaseState: 0 | 1;
  signature: string;
  originalJson: string;
}): Transaction {
  return {
    transactionId: purchaseDetails.purchaseToken,
    productId: purchaseDetails.productIds[0] || '', // Use first product ID
    purchaseDate: new Date(purchaseDetails.purchaseTimeMs),
    receiptData: purchaseDetails.originalJson, // originalJson contains the receipt JSON
    signature: purchaseDetails.signature,
  };
}

/**
 * Create Android Google Play Billing Repository
 *
 * @param billingClient - Google Play Billing BillingClient instance
 * @returns Repository object with methods to interact with Google Play Billing
 *
 * @example
 * ```ts
 * const repository = createAndroidBillingRepository(billingClient);
 * const result = await repository.loadProductMetadata(['premium_unlock']);
 * if (result.success) {
 *   console.log(result.data); // Array of Product
 * }
 * ```
 */
export function createAndroidBillingRepository(billingClient: BillingClient) {
  // In-memory cache for product metadata
  let productCache: Map<string, Product> = new Map();

  return {
    /**
     * Load product metadata from Google Play Console
     *
     * @param productIds - Array of product IDs to fetch
     * @returns Result with Product[] on success or PurchaseError on failure
     *
     * Happy path: Successfully retrieves metadata from Google Play
     * Sad path: Network error or store problem (retryable)
     * Edge case: Empty product details list
     * Unhappy path: Store is unavailable (retryable error)
     */
    async loadProductMetadata(
      productIds: string[]
    ): Promise<Result<Product[], PurchaseError>> {
      try {
        const response = await billingClient.queryProductDetails(productIds);

        // Check billing result
        if (response.billingResult.responseCode !== BILLING_RESPONSE_CODES.OK) {
          const error = mapBillingResponseCodeToError(
            response.billingResult.responseCode,
            response.billingResult.debugMessage
          );
          return { success: false, error };
        }

        // Convert to domain Product and cache
        const products: Product[] = [];
        for (const productDetails of response.productDetailsList) {
          const product = toProduct(productDetails);
          if (product) {
            products.push(product);
            productCache.set(product.id, product);
          }
        }

        return { success: true, data: products };
      } catch (error) {
        // Network error handling
        if (isNetworkError(error)) {
          return {
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: 'Failed to fetch product metadata',
              retryable: true,
              platform: 'android',
            },
          };
        }

        // Unexpected error
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message,
            retryable: false,
          },
        };
      }
    },

    /**
     * Get cached product metadata (offline support)
     *
     * @returns Array of cached Product objects
     *
     * Happy path: Returns products from cache
     * Edge case: No products have been cached yet (returns empty array)
     */
    async getCachedProducts(): Promise<Product[]> {
      return Array.from(productCache.values());
    },

    /**
     * Launch billing flow to purchase a product
     *
     * @param productId - Product ID to purchase
     * @returns Result with Transaction on success or PurchaseError on failure
     *
     * Happy path: User completes purchase, transaction returned
     * Sad path: User cancels (PURCHASE_CANCELLED, non-retryable)
     * Edge case: Purchase pending but not completed
     * Unhappy path: Network error during purchase flow (retryable)
     */
    async launchPurchaseFlow(
      productId: string
    ): Promise<Result<Transaction, PurchaseError>> {
      try {
        const response = await billingClient.launchBillingFlow(productId);

        // Check response code
        if (response.responseCode !== BILLING_RESPONSE_CODES.OK) {
          const error = mapBillingResponseCodeToError(
            response.responseCode,
            response.debugMessage || 'Purchase flow failed'
          );
          return { success: false, error };
        }

        // Verify purchase details exist
        if (!response.purchaseDetails) {
          return {
            success: false,
            error: {
              code: 'PURCHASE_INVALID',
              message: 'No purchase details returned',
              retryable: false,
              reason: 'wrong_bundle',
            },
          };
        }

        // Convert to domain Transaction
        const transaction = toTransaction(response.purchaseDetails);
        return { success: true, data: transaction };
      } catch (error) {
        // Network error handling
        if (isNetworkError(error)) {
          return {
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: 'Network error during purchase',
              retryable: true,
              platform: 'android',
            },
          };
        }

        // Unexpected error
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message,
            retryable: false,
          },
        };
      }
    },

    /**
     * Request all past purchases from Google Play
     *
     * @returns Result with Transaction[] on success or PurchaseError on failure
     *
     * Happy path: Successfully retrieves purchase history
     * Edge case: No purchases exist (returns empty array)
     * Unhappy path: Network error during retrieval (retryable)
     */
    async requestAllPurchaseHistory(): Promise<
      Result<Transaction[], PurchaseError>
    > {
      try {
        const purchaseDetailsList = await billingClient.queryPurchasesAsync();

        // Convert to domain Transaction array
        const transactions: Transaction[] = purchaseDetailsList.map(
          (purchaseDetails) => toTransaction(purchaseDetails)
        );

        return { success: true, data: transactions };
      } catch (error) {
        // Network error handling
        if (isNetworkError(error)) {
          return {
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: 'Failed to retrieve purchase history',
              retryable: true,
              platform: 'android',
            },
          };
        }

        // Unexpected error
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message,
            retryable: false,
          },
        };
      }
    },

    /**
     * Verify transaction (basic validation for Android)
     *
     * For Android, verification consists of:
     * 1. Ensure signature is present (will be properly verified on backend)
     * 2. Ensure receipt data exists
     *
     * @param transaction - Transaction to verify
     * @returns Result with boolean on success or PurchaseError on failure
     *
     * Happy path: Transaction has valid signature
     * Sad path: Missing signature (PURCHASE_INVALID)
     * Edge case: Malformed receipt data
     */
    async verifyTransaction(
      transaction: Transaction
    ): Promise<Result<boolean, PurchaseError>> {
      // Check that signature exists (required for Android)
      if (!transaction.signature) {
        return {
          success: false,
          error: {
            code: 'PURCHASE_INVALID',
            message: 'Transaction missing signature',
            retryable: false,
            reason: 'not_signed',
          },
        };
      }

      // Check that receipt data exists
      if (!transaction.receiptData) {
        return {
          success: false,
          error: {
            code: 'PURCHASE_INVALID',
            message: 'Transaction missing receipt data',
            retryable: false,
            reason: 'not_signed',
          },
        };
      }

      // Basic validation passed
      // Full cryptographic verification happens on backend
      return { success: true, data: true };
    },
  };
}
