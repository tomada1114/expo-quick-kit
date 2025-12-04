/**
 * Purchase Error Mapper
 *
 * Unified error mapping for purchase operations across platforms.
 * Converts platform-specific error codes from StoreKit2, Google Play Billing, and RevenueCat
 * to domain PurchaseError types.
 *
 * Responsibilities:
 * - Map StoreKit2 (iOS) error codes to PurchaseError
 * - Map Google Play Billing (Android) response codes to PurchaseError
 * - Map RevenueCat error codes to PurchaseError
 * - Classify errors by retryability and severity
 * - Provide consistent error handling across platforms
 *
 * @module features/purchase/infrastructure/error-mapper
 */

import { PURCHASES_ERROR_CODE } from 'react-native-purchases';
import type { PurchaseError } from '../core/types';

/**
 * Google Play Billing Library response codes
 * Reference: https://developer.android.com/reference/com/android/billingclient/api/BillingClient.BillingResponseCode
 */
export const BILLING_RESPONSE_CODES = {
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
 * Type guard for network errors
 * Detects network-related errors by message content
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('network') ||
      msg.includes('timeout') ||
      msg.includes('connection') ||
      msg.includes('offline')
    );
  }
  return false;
}

/**
 * Type guard for StoreKit2 errors
 * Checks if error has required StoreKit2 error structure
 */
export function isStoreKit2Error(
  error: unknown
): error is { code: string; message: string; nativeErrorCode?: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Type guard for RevenueCat SDK errors
 */
export function isRevenueCatError(
  error: unknown
): error is { code: number; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as { code: unknown }).code === 'number' &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Type guard for Google Play Billing response object
 */
export function isBillingResponseObject(
  error: unknown
): error is { responseCode: number; debugMessage?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'responseCode' in error &&
    typeof (error as { responseCode: unknown }).responseCode === 'number'
  );
}

/**
 * Map StoreKit2 error codes to domain PurchaseError
 *
 * Converts iOS StoreKit2 specific error codes to domain error types.
 *
 * @param error - StoreKit2 error object
 * @returns PurchaseError domain error
 *
 * @example
 * ```ts
 * const error = { code: 'USER_CANCELLED', message: 'User cancelled' };
 * const purchaseError = mapStoreKit2Error(error);
 * // => { code: 'PURCHASE_CANCELLED', message: '...', retryable: false }
 * ```
 */
export function mapStoreKit2Error(error: unknown): PurchaseError {
  // Handle generic JavaScript errors first (network/timeout)
  if (isNetworkError(error)) {
    return {
      code: 'NETWORK_ERROR',
      message:
        error instanceof Error ? error.message : 'Network error occurred',
      retryable: true,
      platform: 'ios',
    };
  }

  if (isStoreKit2Error(error)) {
    // Map known StoreKit2 error codes
    switch (error.code) {
      case 'USER_CANCELLED':
        return {
          code: 'PURCHASE_CANCELLED',
          message: error.message,
          retryable: false,
        };

      case 'STORE_PROBLEM':
        return {
          code: 'STORE_PROBLEM_ERROR',
          message: error.message,
          retryable: true,
          nativeErrorCode: error.nativeErrorCode ?? 0,
          platform: 'ios',
        };

      case 'NETWORK_ERROR':
        return {
          code: 'NETWORK_ERROR',
          message: error.message,
          retryable: true,
          platform: 'ios',
        };

      case 'INVALID_PRODUCT':
        return {
          code: 'PRODUCT_UNAVAILABLE',
          message: `Product unavailable: ${error.message}`,
          retryable: false,
          productId: 'unknown',
        };

      case 'INVALID_SIGNATURE':
        return {
          code: 'PURCHASE_INVALID',
          message: error.message,
          retryable: false,
          reason: 'not_signed',
        };

      default:
        return {
          code: 'UNKNOWN_ERROR',
          message: error.message,
          retryable: false,
        };
    }
  }

  const message =
    error instanceof Error ? error.message : 'An unknown error occurred';
  return {
    code: 'UNKNOWN_ERROR',
    message,
    retryable: false,
  };
}

/**
 * Map Google Play Billing response code to domain PurchaseError
 *
 * Converts Android Google Play Billing specific response codes to domain error types.
 *
 * @param responseCode - Google Play Billing response code
 * @param debugMessage - Optional debug message from the response
 * @returns PurchaseError domain error
 *
 * @example
 * ```ts
 * const error = mapGooglePlayBillingError(1, 'User cancelled');
 * // => { code: 'PURCHASE_CANCELLED', message: 'User cancelled the purchase', retryable: false }
 * ```
 */
export function mapGooglePlayBillingError(
  responseCode: number,
  debugMessage: string = ''
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
        platform: 'android',
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
 * Map RevenueCat error codes to domain PurchaseError
 *
 * Converts RevenueCat SDK specific error codes to domain error types.
 *
 * @param error - RevenueCat error object or raw error
 * @returns PurchaseError domain error
 *
 * @example
 * ```ts
 * const error = { code: 101, message: 'Network error' };
 * const purchaseError = mapRevenueCatError(error);
 * // => { code: 'NETWORK_ERROR', message: 'Network error', retryable: true, platform: 'revenueCat' }
 * ```
 */
export function mapRevenueCatError(error: unknown): PurchaseError {
  const message =
    error instanceof Error ? error.message : 'An unknown error occurred';

  // Check for network-related errors by message content first (highest priority)
  if (isNetworkError(error)) {
    return {
      code: 'NETWORK_ERROR',
      message,
      retryable: true,
      platform: 'revenueCat',
    };
  }

  if (isRevenueCatError(error)) {
    const { code } = error;

    // Map RevenueCat error codes
    switch (code) {
      case PURCHASES_ERROR_CODE.NETWORK_ERROR:
      case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
        return {
          code: 'NETWORK_ERROR',
          message,
          retryable: true,
          platform: 'revenueCat',
        };

      case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
        return {
          code: 'STORE_PROBLEM_ERROR',
          message,
          retryable: true,
          nativeErrorCode: code,
          platform: 'revenueCat',
        };

      case PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
        return {
          code: 'PURCHASE_CANCELLED',
          message,
          retryable: false,
        };

      default:
        return {
          code: 'UNKNOWN_ERROR',
          message,
          retryable: false,
        };
    }
  }

  // Default to unknown error
  return {
    code: 'UNKNOWN_ERROR',
    message,
    retryable: false,
  };
}

/**
 * Map generic errors to domain PurchaseError
 *
 * This is a catch-all mapper that handles unknown error types.
 * It detects error type and delegates to appropriate specific mapper.
 *
 * @param error - Error object from any source
 * @returns PurchaseError domain error
 */
export function mapPurchaseError(error: unknown): PurchaseError {
  // Try to detect error type based on structure
  if (isBillingResponseObject(error)) {
    return mapGooglePlayBillingError(
      error.responseCode,
      error.debugMessage || ''
    );
  }

  if (isRevenueCatError(error)) {
    return mapRevenueCatError(error);
  }

  if (isStoreKit2Error(error)) {
    return mapStoreKit2Error(error);
  }

  // Generic error handling
  const message =
    error instanceof Error ? error.message : 'An unknown error occurred';

  if (isNetworkError(error)) {
    return {
      code: 'NETWORK_ERROR',
      message,
      retryable: true,
      platform: 'revenueCat',
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message,
    retryable: false,
  };
}
