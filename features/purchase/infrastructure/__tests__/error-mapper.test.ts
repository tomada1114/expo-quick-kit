/**
 * Error Mapper Tests - Task 3.5
 *
 * Comprehensive test suite for error mapping across all platforms.
 * Tests error code conversion from StoreKit2, Google Play Billing, and RevenueCat
 * to unified domain PurchaseError types.
 *
 * Coverage:
 * - Happy path: Valid error codes map correctly
 * - Sad path: Expected errors (cancellation, unavailability)
 * - Edge cases: Unknown codes, missing fields, empty messages
 * - Unhappy path: Network errors, store problems
 */

import {
  mapStoreKit2Error,
  mapGooglePlayBillingError,
  mapRevenueCatError,
  mapPurchaseError,
  isNetworkError,
  isStoreKit2Error,
  isRevenueCatError,
  isBillingResponseObject,
  BILLING_RESPONSE_CODES,
} from '../error-mapper';
import { PURCHASES_ERROR_CODE } from 'react-native-purchases';

describe('Error Mapper - Task 3.5', () => {
  describe('Type Guards', () => {
    describe('isNetworkError', () => {
      // Happy path: Detects network-related error messages
      it('should detect network error by message content', () => {
        expect(isNetworkError(new Error('network timeout'))).toBe(true);
        expect(isNetworkError(new Error('Network connection failed'))).toBe(
          true
        );
        expect(isNetworkError(new Error('timeout'))).toBe(true);
        expect(isNetworkError(new Error('connection refused'))).toBe(true);
        expect(isNetworkError(new Error('offline mode'))).toBe(true);
      });

      // Edge case: Case-insensitive detection
      it('should be case-insensitive', () => {
        expect(isNetworkError(new Error('NETWORK ERROR'))).toBe(true);
        expect(isNetworkError(new Error('TIMEOUT'))).toBe(true);
      });

      // Sad path: Non-network errors
      it('should not detect non-network errors', () => {
        expect(isNetworkError(new Error('Invalid product'))).toBe(false);
        expect(isNetworkError(new Error('User cancelled'))).toBe(false);
        expect(isNetworkError(new Error('Store problem'))).toBe(false);
      });

      // Edge case: Non-Error objects
      it('should handle non-Error objects', () => {
        expect(isNetworkError('network error')).toBe(false);
        expect(isNetworkError(null)).toBe(false);
        expect(isNetworkError(undefined)).toBe(false);
        expect(isNetworkError({})).toBe(false);
      });
    });

    describe('isStoreKit2Error', () => {
      // Happy path: Valid StoreKit2 error structure
      it('should identify valid StoreKit2 errors', () => {
        const error = {
          code: 'USER_CANCELLED',
          message: 'User cancelled purchase',
        };
        expect(isStoreKit2Error(error)).toBe(true);
      });

      // Edge case: With optional nativeErrorCode
      it('should accept optional nativeErrorCode', () => {
        const error = {
          code: 'STORE_PROBLEM',
          message: 'Store problem',
          nativeErrorCode: 123,
        };
        expect(isStoreKit2Error(error)).toBe(true);
      });

      // Sad path: Missing required fields
      it('should reject errors with missing fields', () => {
        expect(isStoreKit2Error({ code: 'USER_CANCELLED' })).toBe(false);
        expect(isStoreKit2Error({ message: 'Error' })).toBe(false);
        expect(isStoreKit2Error({})).toBe(false);
      });

      // Edge case: Wrong field types
      it('should validate field types', () => {
        expect(isStoreKit2Error({ code: 123, message: 'Error' })).toBe(false);
        expect(isStoreKit2Error({ code: 'ERROR', message: 123 })).toBe(false);
      });
    });

    describe('isRevenueCatError', () => {
      // Happy path: Valid RevenueCat error structure
      it('should identify valid RevenueCat errors', () => {
        const error = { code: 101, message: 'Network error' };
        expect(isRevenueCatError(error)).toBe(true);
      });

      // Sad path: Missing required fields
      it('should reject errors with missing fields', () => {
        expect(isRevenueCatError({ code: 101 })).toBe(false);
        expect(isRevenueCatError({ message: 'Error' })).toBe(false);
        expect(isRevenueCatError({})).toBe(false);
      });

      // Edge case: Wrong field types
      it('should validate field types', () => {
        expect(isRevenueCatError({ code: '101', message: 'Error' })).toBe(
          false
        );
        expect(isRevenueCatError({ code: 101, message: 123 })).toBe(false);
      });
    });

    describe('isBillingResponseObject', () => {
      // Happy path: Valid billing response
      it('should identify valid billing response objects', () => {
        const response = { responseCode: 0, debugMessage: 'OK' };
        expect(isBillingResponseObject(response)).toBe(true);
      });

      // Edge case: Without debugMessage
      it('should work without debugMessage', () => {
        const response = { responseCode: 1 };
        expect(isBillingResponseObject(response)).toBe(true);
      });

      // Sad path: Missing responseCode
      it('should reject without responseCode', () => {
        expect(isBillingResponseObject({ debugMessage: 'Error' })).toBe(false);
        expect(isBillingResponseObject({})).toBe(false);
      });

      // Edge case: Wrong type for responseCode
      it('should validate responseCode type', () => {
        expect(isBillingResponseObject({ responseCode: '0' })).toBe(false);
      });
    });
  });

  describe('mapStoreKit2Error', () => {
    // Happy path: User cancelled purchase
    it('should map USER_CANCELLED to PURCHASE_CANCELLED', () => {
      const error = { code: 'USER_CANCELLED', message: 'User cancelled' };
      const result = mapStoreKit2Error(error);

      expect(result.code).toBe('PURCHASE_CANCELLED');
      expect(result.retryable).toBe(false);
      expect(result.message).toBe('User cancelled');
    });

    // Happy path: Store problem
    it('should map STORE_PROBLEM to STORE_PROBLEM_ERROR', () => {
      const error = {
        code: 'STORE_PROBLEM',
        message: 'Store unavailable',
        nativeErrorCode: 500,
      };
      const result = mapStoreKit2Error(error);

      expect(result.code).toBe('STORE_PROBLEM_ERROR');
      expect(result.retryable).toBe(true);
      expect(result.nativeErrorCode).toBe(500);
    });

    // Happy path: Network error
    it('should map NETWORK_ERROR to NETWORK_ERROR with platform', () => {
      const error = {
        code: 'NETWORK_ERROR',
        message: 'Connection failed',
      };
      const result = mapStoreKit2Error(error);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.retryable).toBe(true);
      expect(result.platform).toBe('ios');
    });

    // Happy path: Invalid product
    it('should map INVALID_PRODUCT to PRODUCT_UNAVAILABLE', () => {
      const error = {
        code: 'INVALID_PRODUCT',
        message: 'Product not found',
      };
      const result = mapStoreKit2Error(error);

      expect(result.code).toBe('PRODUCT_UNAVAILABLE');
      expect(result.retryable).toBe(false);
      expect(result.productId).toBe('unknown');
    });

    // Happy path: Invalid signature
    it('should map INVALID_SIGNATURE to PURCHASE_INVALID', () => {
      const error = {
        code: 'INVALID_SIGNATURE',
        message: 'JWS signature verification failed',
      };
      const result = mapStoreKit2Error(error);

      expect(result.code).toBe('PURCHASE_INVALID');
      expect(result.retryable).toBe(false);
      expect(result.reason).toBe('not_signed');
    });

    // Sad path: Unknown code
    it('should map unknown codes to UNKNOWN_ERROR', () => {
      const error = {
        code: 'UNKNOWN_CODE',
        message: 'Unknown error',
      };
      const result = mapStoreKit2Error(error);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.retryable).toBe(false);
    });

    // Unhappy path: Network error detection by message
    it('should detect network errors by message content', () => {
      const error = new Error('network timeout');
      const result = mapStoreKit2Error(error);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.retryable).toBe(true);
      expect(result.platform).toBe('ios');
    });

    // Edge case: Missing nativeErrorCode
    it('should default nativeErrorCode to 0 if missing', () => {
      const error = { code: 'STORE_PROBLEM', message: 'Error' };
      const result = mapStoreKit2Error(error);

      expect(result.nativeErrorCode).toBe(0);
    });

    // Edge case: Non-Error object
    it('should handle non-Error objects', () => {
      const error = 'Some error string';
      const result = mapStoreKit2Error(error);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.retryable).toBe(false);
    });
  });

  describe('mapGooglePlayBillingError', () => {
    // Happy path: User cancelled
    it('should map USER_CANCELED to PURCHASE_CANCELLED', () => {
      const result = mapGooglePlayBillingError(
        BILLING_RESPONSE_CODES.USER_CANCELED,
        'User cancelled'
      );

      expect(result.code).toBe('PURCHASE_CANCELLED');
      expect(result.retryable).toBe(false);
    });

    // Happy path: Service unavailable (retryable)
    it('should map SERVICE_UNAVAILABLE to NETWORK_ERROR (retryable)', () => {
      const result = mapGooglePlayBillingError(
        BILLING_RESPONSE_CODES.SERVICE_UNAVAILABLE,
        'Service unavailable'
      );

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.retryable).toBe(true);
      expect(result.platform).toBe('android');
    });

    // Happy path: Billing unavailable
    it('should map BILLING_UNAVAILABLE to NETWORK_ERROR', () => {
      const result = mapGooglePlayBillingError(
        BILLING_RESPONSE_CODES.BILLING_UNAVAILABLE
      );

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.retryable).toBe(true);
      expect(result.platform).toBe('android');
    });

    // Happy path: Item unavailable
    it('should map ITEM_UNAVAILABLE to PRODUCT_UNAVAILABLE', () => {
      const result = mapGooglePlayBillingError(
        BILLING_RESPONSE_CODES.ITEM_UNAVAILABLE,
        'Item not available'
      );

      expect(result.code).toBe('PRODUCT_UNAVAILABLE');
      expect(result.retryable).toBe(false);
      expect(result.productId).toBe('');
    });

    // Happy path: Developer error (retryable)
    it('should map DEVELOPER_ERROR to STORE_PROBLEM_ERROR (retryable)', () => {
      const result = mapGooglePlayBillingError(
        BILLING_RESPONSE_CODES.DEVELOPER_ERROR,
        'Developer error'
      );

      expect(result.code).toBe('STORE_PROBLEM_ERROR');
      expect(result.retryable).toBe(true);
      expect(result.nativeErrorCode).toBe(BILLING_RESPONSE_CODES.DEVELOPER_ERROR);
    });

    // Happy path: Network error response code
    it('should map NETWORK_ERROR code to STORE_PROBLEM_ERROR', () => {
      const result = mapGooglePlayBillingError(
        BILLING_RESPONSE_CODES.NETWORK_ERROR,
        'Network issue'
      );

      expect(result.code).toBe('STORE_PROBLEM_ERROR');
      expect(result.retryable).toBe(true);
      expect(result.nativeErrorCode).toBe(BILLING_RESPONSE_CODES.NETWORK_ERROR);
    });

    // Happy path: Item already owned
    it('should map ITEM_ALREADY_OWNED to PURCHASE_INVALID with revoked reason', () => {
      const result = mapGooglePlayBillingError(
        BILLING_RESPONSE_CODES.ITEM_ALREADY_OWNED,
        'Already owned'
      );

      expect(result.code).toBe('PURCHASE_INVALID');
      expect(result.retryable).toBe(false);
      expect(result.reason).toBe('revoked');
    });

    // Sad path: Unknown code
    it('should map unknown codes to UNKNOWN_ERROR', () => {
      const result = mapGooglePlayBillingError(999, 'Unknown error');

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.retryable).toBe(false);
      expect(result.message).toBe('Unknown error');
    });

    // Edge case: Empty debug message
    it('should handle empty debug message', () => {
      const result = mapGooglePlayBillingError(
        BILLING_RESPONSE_CODES.ITEM_UNAVAILABLE,
        ''
      );

      expect(result.message).toBeDefined();
      expect(result.code).toBe('PRODUCT_UNAVAILABLE');
    });

    // Edge case: OK response code (should not happen in error context)
    it('should map OK code to UNKNOWN_ERROR', () => {
      const result = mapGooglePlayBillingError(BILLING_RESPONSE_CODES.OK);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.retryable).toBe(false);
    });
  });

  describe('mapRevenueCatError', () => {
    // Happy path: Network error code
    it('should map NETWORK_ERROR code to NETWORK_ERROR', () => {
      const error = {
        code: PURCHASES_ERROR_CODE.NETWORK_ERROR,
        message: 'Network error',
      };
      const result = mapRevenueCatError(error);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.retryable).toBe(true);
      expect(result.platform).toBe('revenueCat');
    });

    // Happy path: Offline connection error
    it('should map OFFLINE_CONNECTION_ERROR to NETWORK_ERROR', () => {
      const error = {
        code: PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR,
        message: 'Offline',
      };
      const result = mapRevenueCatError(error);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.retryable).toBe(true);
      expect(result.platform).toBe('revenueCat');
    });

    // Happy path: Store problem error
    it('should map STORE_PROBLEM_ERROR to STORE_PROBLEM_ERROR', () => {
      const error = {
        code: PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR,
        message: 'Store problem',
      };
      const result = mapRevenueCatError(error);

      expect(result.code).toBe('STORE_PROBLEM_ERROR');
      expect(result.retryable).toBe(true);
      expect(result.nativeErrorCode).toBe(PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR);
    });

    // Happy path: Purchase cancelled error
    it('should map PURCHASE_CANCELLED_ERROR to PURCHASE_CANCELLED', () => {
      const error = {
        code: PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR,
        message: 'User cancelled',
      };
      const result = mapRevenueCatError(error);

      expect(result.code).toBe('PURCHASE_CANCELLED');
      expect(result.retryable).toBe(false);
    });

    // Unhappy path: Network detection by message
    it('should detect network errors by message content', () => {
      const error = new Error('network timeout');
      const result = mapRevenueCatError(error);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.retryable).toBe(true);
      expect(result.platform).toBe('revenueCat');
    });

    // Sad path: Unknown code
    it('should map unknown codes to UNKNOWN_ERROR', () => {
      const error = { code: 999, message: 'Unknown error' };
      const result = mapRevenueCatError(error);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.retryable).toBe(false);
    });

    // Edge case: Error object with message
    it('should extract message from Error objects', () => {
      const error = new Error('Connection failed');
      const result = mapRevenueCatError(error);

      expect(result.message).toBe('Connection failed');
    });

    // Edge case: Non-Error object
    it('should handle non-Error objects', () => {
      const error = 'Some error string';
      const result = mapRevenueCatError(error);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.retryable).toBe(false);
    });

    // Edge case: Null or undefined
    it('should handle null and undefined', () => {
      const resultNull = mapRevenueCatError(null);
      const resultUndefined = mapRevenueCatError(undefined);

      expect(resultNull.code).toBe('UNKNOWN_ERROR');
      expect(resultUndefined.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('mapPurchaseError', () => {
    // Happy path: Auto-detect StoreKit2 error
    it('should detect and map StoreKit2 errors', () => {
      const error = { code: 'USER_CANCELLED', message: 'Cancelled' };
      const result = mapPurchaseError(error);

      expect(result.code).toBe('PURCHASE_CANCELLED');
    });

    // Happy path: Auto-detect RevenueCat error
    it('should detect and map RevenueCat errors', () => {
      const error = {
        code: PURCHASES_ERROR_CODE.NETWORK_ERROR,
        message: 'Network error',
      };
      const result = mapPurchaseError(error);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.retryable).toBe(true);
    });

    // Happy path: Auto-detect billing response object
    it('should detect and map Google Play Billing responses', () => {
      const error = { responseCode: BILLING_RESPONSE_CODES.USER_CANCELED };
      const result = mapPurchaseError(error);

      expect(result.code).toBe('PURCHASE_CANCELLED');
    });

    // Unhappy path: Network error by message
    it('should detect network errors by message', () => {
      const error = new Error('network timeout');
      const result = mapPurchaseError(error);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.retryable).toBe(true);
    });

    // Sad path: Generic Error object
    it('should handle generic Error objects', () => {
      const error = new Error('Some generic error');
      const result = mapPurchaseError(error);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('Some generic error');
    });

    // Edge case: Unknown object
    it('should default to UNKNOWN_ERROR for unknown objects', () => {
      const error = { someField: 'value' };
      const result = mapPurchaseError(error);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.retryable).toBe(false);
    });

    // Edge case: Null and undefined
    it('should handle null and undefined', () => {
      const resultNull = mapPurchaseError(null);
      const resultUndefined = mapPurchaseError(undefined);

      expect(resultNull.code).toBe('UNKNOWN_ERROR');
      expect(resultUndefined.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('Error code constants', () => {
    it('should have all required Google Play Billing response codes', () => {
      expect(BILLING_RESPONSE_CODES.OK).toBe(0);
      expect(BILLING_RESPONSE_CODES.USER_CANCELED).toBe(1);
      expect(BILLING_RESPONSE_CODES.SERVICE_UNAVAILABLE).toBe(2);
      expect(BILLING_RESPONSE_CODES.BILLING_UNAVAILABLE).toBe(3);
      expect(BILLING_RESPONSE_CODES.ITEM_UNAVAILABLE).toBe(4);
      expect(BILLING_RESPONSE_CODES.DEVELOPER_ERROR).toBe(5);
      expect(BILLING_RESPONSE_CODES.ERROR).toBe(6);
      expect(BILLING_RESPONSE_CODES.ITEM_ALREADY_OWNED).toBe(7);
      expect(BILLING_RESPONSE_CODES.NETWORK_ERROR).toBe(8);
    });
  });

  describe('Integration: Cross-platform error consistency', () => {
    // Verify that same semantic error maps consistently across platforms
    it('should map user cancellation consistently across platforms', () => {
      const storeKit2Result = mapStoreKit2Error({
        code: 'USER_CANCELLED',
        message: 'Cancelled',
      });
      const billingResult = mapGooglePlayBillingError(
        BILLING_RESPONSE_CODES.USER_CANCELED
      );
      const revenueCatResult = mapRevenueCatError({
        code: PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR,
        message: 'Cancelled',
      });

      expect(storeKit2Result.code).toBe('PURCHASE_CANCELLED');
      expect(storeKit2Result.retryable).toBe(false);

      expect(billingResult.code).toBe('PURCHASE_CANCELLED');
      expect(billingResult.retryable).toBe(false);

      expect(revenueCatResult.code).toBe('PURCHASE_CANCELLED');
      expect(revenueCatResult.retryable).toBe(false);
    });

    // Verify network errors map consistently with retryable flag
    it('should map network errors consistently with retryable=true', () => {
      const storeKit2Result = mapStoreKit2Error({
        code: 'NETWORK_ERROR',
        message: 'Network failed',
      });
      const billingResult = mapGooglePlayBillingError(
        BILLING_RESPONSE_CODES.SERVICE_UNAVAILABLE
      );
      const revenueCatResult = mapRevenueCatError({
        code: PURCHASES_ERROR_CODE.NETWORK_ERROR,
        message: 'Network failed',
      });

      expect(storeKit2Result.code).toBe('NETWORK_ERROR');
      expect(storeKit2Result.retryable).toBe(true);

      expect(billingResult.code).toBe('NETWORK_ERROR');
      expect(billingResult.retryable).toBe(true);

      expect(revenueCatResult.code).toBe('NETWORK_ERROR');
      expect(revenueCatResult.retryable).toBe(true);
    });

    // Verify store problems map consistently
    it('should map store problems consistently with retryable=true', () => {
      const storeKit2Result = mapStoreKit2Error({
        code: 'STORE_PROBLEM',
        message: 'Store error',
      });
      const billingResult = mapGooglePlayBillingError(
        BILLING_RESPONSE_CODES.ERROR,
        'Store error'
      );
      const revenueCatResult = mapRevenueCatError({
        code: PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR,
        message: 'Store error',
      });

      expect(storeKit2Result.code).toBe('STORE_PROBLEM_ERROR');
      expect(storeKit2Result.retryable).toBe(true);

      expect(billingResult.code).toBe('STORE_PROBLEM_ERROR');
      expect(billingResult.retryable).toBe(true);

      expect(revenueCatResult.code).toBe('STORE_PROBLEM_ERROR');
      expect(revenueCatResult.retryable).toBe(true);
    });
  });
});
