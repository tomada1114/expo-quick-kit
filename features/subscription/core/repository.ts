/**
 * Subscription Repository
 *
 * Infrastructure layer that handles communication with RevenueCat SDK.
 * Converts external API responses to domain entities and errors.
 *
 * Responsibilities:
 * - Call RevenueCat SDK APIs (getCustomerInfo, getOfferings, purchasePackage, restorePurchases)
 * - Convert CustomerInfo to Subscription domain entity
 * - Map RevenueCat errors to domain errors (SubscriptionError)
 *
 * @module features/subscription/core/repository
 */

import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo as SDKCustomerInfo,
} from 'react-native-purchases';
import type {
  Subscription,
  SubscriptionError,
  SubscriptionPackage,
  Result,
} from './types';
import { PREMIUM_ENTITLEMENT_ID, DEFAULT_FREE_SUBSCRIPTION } from './types';

/**
 * Type guard for RevenueCat SDK errors.
 * RevenueCat errors have a numeric `code` and string `message` property.
 */
function isRevenueCatError(
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
 * Safely convert error to SubscriptionError.
 * Handles both RevenueCat errors and unknown errors.
 */
function handleError(error: unknown): SubscriptionError {
  if (isRevenueCatError(error)) {
    return toSubscriptionError(error);
  }

  // Handle unknown errors
  const message =
    error instanceof Error ? error.message : 'An unknown error occurred';
  return {
    code: 'UNKNOWN_ERROR',
    message,
    retryable: false,
  };
}

/**
 * Convert RevenueCat CustomerInfo to domain Subscription entity.
 *
 * @param customerInfo - CustomerInfo from RevenueCat SDK
 * @returns Subscription domain entity
 *
 * @example
 * ```ts
 * const customerInfo = await Purchases.getCustomerInfo();
 * const subscription = toSubscription(customerInfo);
 * console.log(subscription.tier); // 'free' or 'premium'
 * ```
 */
export function toSubscription(customerInfo: SDKCustomerInfo): Subscription {
  const premiumEntitlement =
    customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];

  if (!premiumEntitlement || !premiumEntitlement.isActive) {
    return DEFAULT_FREE_SUBSCRIPTION;
  }

  return {
    isActive: true,
    tier: 'premium',
    expiresAt: premiumEntitlement.expirationDate
      ? new Date(premiumEntitlement.expirationDate)
      : null,
    productId: premiumEntitlement.productIdentifier,
  };
}

/**
 * Map RevenueCat PurchasesError to domain SubscriptionError.
 *
 * @param error - Error from RevenueCat SDK with code property
 * @returns SubscriptionError domain error
 *
 * @example
 * ```ts
 * try {
 *   await Purchases.purchasePackage(pkg);
 * } catch (e) {
 *   const subscriptionError = toSubscriptionError(e);
 *   if (subscriptionError.retryable) {
 *     // Show retry button
 *   }
 * }
 * ```
 */
export function toSubscriptionError(error: {
  code: number;
  message: string;
}): SubscriptionError {
  const { code, message } = error;

  switch (code) {
    case PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
      return {
        code: 'PURCHASE_CANCELLED',
        message,
        retryable: false,
      };

    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return {
        code: 'PURCHASE_NOT_ALLOWED',
        message,
        retryable: false,
      };

    case PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR:
      return {
        code: 'PURCHASE_INVALID',
        message,
        retryable: false,
      };

    case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
      return {
        code: 'PRODUCT_ALREADY_PURCHASED',
        message,
        retryable: false,
      };

    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
    case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
      return {
        code: 'NETWORK_ERROR',
        message,
        retryable: true,
      };

    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      return {
        code: 'STORE_PROBLEM_ERROR',
        message,
        retryable: true,
      };

    case PURCHASES_ERROR_CODE.CONFIGURATION_ERROR:
      return {
        code: 'CONFIGURATION_ERROR',
        message,
        retryable: false,
      };

    case PURCHASES_ERROR_CODE.INVALID_CREDENTIALS_ERROR:
      return {
        code: 'INVALID_CREDENTIALS_ERROR',
        message,
        retryable: false,
      };

    case PURCHASES_ERROR_CODE.UNEXPECTED_BACKEND_RESPONSE_ERROR:
      return {
        code: 'UNEXPECTED_BACKEND_RESPONSE_ERROR',
        message,
        retryable: true,
      };

    case PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR:
    case PURCHASES_ERROR_CODE.RECEIPT_IN_USE_BY_OTHER_SUBSCRIBER_ERROR:
      return {
        code: 'RECEIPT_ALREADY_IN_USE_ERROR',
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

/**
 * Convert RevenueCat Package to domain SubscriptionPackage.
 *
 * @param pkg - Package from RevenueCat offerings
 * @returns SubscriptionPackage domain entity
 */
function toSubscriptionPackage(pkg: {
  identifier: string;
  product: {
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
    introPrice?: {
      price: number;
      priceString: string;
      period: string;
    } | null;
  };
}): SubscriptionPackage {
  const { identifier, product } = pkg;

  return {
    identifier,
    title: product.title,
    priceString: product.priceString,
    price: product.price,
    currencyCode: product.currencyCode,
    introPrice: product.introPrice
      ? {
          priceString: product.introPrice.priceString,
          price: product.introPrice.price,
          period: product.introPrice.period,
        }
      : undefined,
  };
}

/**
 * Subscription Repository interface for accessing RevenueCat SDK.
 *
 * All methods return Result type for explicit error handling without exceptions.
 */
export const subscriptionRepository = {
  /**
   * Fetch current subscription state from RevenueCat.
   *
   * @returns Result with Subscription on success or SubscriptionError on failure
   */
  async getCustomerInfo(): Promise<Result<Subscription, SubscriptionError>> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const subscription = toSubscription(customerInfo);
      return { success: true, data: subscription };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * Get available subscription packages (monthly, annual) from RevenueCat offerings.
   *
   * @returns Result with array of SubscriptionPackage on success or SubscriptionError on failure
   */
  async getAvailablePackages(): Promise<
    Result<SubscriptionPackage[], SubscriptionError>
  > {
    try {
      const offerings = await Purchases.getOfferings();

      if (!offerings.current) {
        return { success: true, data: [] };
      }

      const packages = offerings.current.availablePackages.map((pkg) =>
        toSubscriptionPackage(pkg)
      );

      return { success: true, data: packages };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * Purchase a subscription package.
   *
   * @param packageId - Package identifier (e.g., "$rc_monthly", "$rc_annual")
   * @returns Result with updated Subscription on success or SubscriptionError on failure
   *
   * @example
   * ```ts
   * const result = await subscriptionRepository.purchasePackage('$rc_monthly');
   * if (result.success) {
   *   console.log('Purchased:', result.data.tier); // 'premium'
   * } else if (result.error.code === 'PURCHASE_CANCELLED') {
   *   // User cancelled, don't show error
   * }
   * ```
   */
  async purchasePackage(
    packageId: string
  ): Promise<Result<Subscription, SubscriptionError>> {
    try {
      // First, get the offerings to find the package
      const offerings = await Purchases.getOfferings();

      if (!offerings.current) {
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message: 'Package not found: No offerings available',
            retryable: false,
          },
        };
      }

      const pkg = offerings.current.availablePackages.find(
        (p) => p.identifier === packageId
      );

      if (!pkg) {
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message: `Package not found: ${packageId}`,
            retryable: false,
          },
        };
      }

      // Purchase the package
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const subscription = toSubscription(customerInfo);

      return { success: true, data: subscription };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * Restore previous purchases.
   *
   * @returns Result with Subscription if active subscription found, null if no active subscription, or SubscriptionError on failure
   *
   * @example
   * ```ts
   * const result = await subscriptionRepository.restorePurchases();
   * if (result.success && result.data) {
   *   console.log('Restored:', result.data.tier); // 'premium'
   * } else if (result.success && !result.data) {
   *   console.log('No active subscription found');
   * }
   * ```
   */
  async restorePurchases(): Promise<
    Result<Subscription | null, SubscriptionError>
  > {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const subscription = toSubscription(customerInfo);

      // Return null if no active subscription
      if (!subscription.isActive) {
        return { success: true, data: null };
      }

      return { success: true, data: subscription };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },
};
