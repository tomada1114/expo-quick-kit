/**
 * StoreKit2 Abstraction Layer for iOS Purchases
 *
 * This module provides a wrapper around Apple's StoreKit2 framework for handling
 * one-time purchases on iOS. It abstracts platform-specific APIs into domain-neutral
 * interfaces.
 *
 * Note: This is a TypeScript interface definition. Implementation requires native
 * code bridge via react-native-storekit2 or similar.
 *
 * @module features/purchase/infrastructure/storekit2
 */

import type { Product, Transaction } from '../core/types';

/**
 * Native error structure from StoreKit2
 */
export interface StoreKit2Error {
  code: string;
  message: string;
  nativeErrorCode?: number;
}

/**
 * Product metadata response from StoreKit2
 */
export interface StoreKit2ProductResponse {
  products: Product[];
  requestId: string;
}

/**
 * Transaction response from StoreKit2
 */
export interface StoreKit2TransactionResponse {
  transaction: Transaction;
}

/**
 * Purchase history response
 */
export interface StoreKit2HistoryResponse {
  transactions: Transaction[];
}

/**
 * StoreKit2 API interface
 *
 * Handles communication with Apple's StoreKit2 framework for iOS purchases.
 * All methods follow the error-as-result pattern (throwing errors that will
 * be caught and converted to domain errors).
 */
export const StoreKit2 = {
  /**
   * Load product metadata from StoreKit2
   *
   * @param productIds - Array of product identifiers to load
   * @returns Promise resolving to product metadata and request ID
   * @throws {Error} If products cannot be loaded from StoreKit2
   *
   * @example
   * ```ts
   * const response = await StoreKit2.loadProducts(['premium_unlock']);
   * // response: { products: [...], requestId: '...' }
   * ```
   */
  async loadProducts(productIds: string[]): Promise<StoreKit2ProductResponse> {
    // This will be implemented via native module bridge
    // For now, throw to indicate not yet implemented
    throw new Error('StoreKit2.loadProducts not yet implemented');
  },

  /**
   * Launch the native purchase flow for a product
   *
   * Shows the native App Store purchase dialog and handles the transaction.
   * Returns Transaction with JWS receipt data when successful.
   *
   * @param productId - Product identifier to purchase
   * @returns Promise resolving to completed transaction
   * @throws {StoreKit2Error} If purchase fails or is cancelled
   *
   * @example
   * ```ts
   * const response = await StoreKit2.launchPurchaseFlow('premium_unlock');
   * // response: { transaction: { transactionId, receiptData, ... } }
   * ```
   */
  async launchPurchaseFlow(
    productId: string
  ): Promise<StoreKit2TransactionResponse> {
    throw new Error('StoreKit2.launchPurchaseFlow not yet implemented');
  },

  /**
   * Request all purchases (restoration)
   *
   * Fetches the complete purchase history from the device/App Store.
   * Used for the "Restore Purchases" feature.
   *
   * @returns Promise resolving to all transactions
   * @throws {Error} If purchase history cannot be fetched
   *
   * @example
   * ```ts
   * const response = await StoreKit2.requestPurchaseHistory();
   * // response: { transactions: [...] }
   * ```
   */
  async requestPurchaseHistory(): Promise<StoreKit2HistoryResponse> {
    throw new Error('StoreKit2.requestPurchaseHistory not yet implemented');
  },
};

/**
 * Type guard to check if error is a StoreKit2Error
 */
export function isStoreKit2Error(error: unknown): error is StoreKit2Error {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    typeof (error as { message: unknown }).message === 'string'
  );
}
