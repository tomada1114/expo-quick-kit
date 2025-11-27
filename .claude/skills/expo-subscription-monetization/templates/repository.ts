/**
 * RevenueCat Template - Subscription Repository
 *
 * Handles all RevenueCat SDK interactions and maps to domain entities.
 * This is the main integration point with RevenueCat.
 */

import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import { ensureRevenueCatConfigured } from './sdk';
import {
  type Subscription,
  type SubscriptionPackage,
  type SubscriptionRepository,
  SubscriptionError,
  SubscriptionErrorCode,
} from './types';

/**
 * RevenueCat implementation of the SubscriptionRepository.
 * Handles all RevenueCat SDK interactions and maps to domain entities.
 */
export class RevenueCatSubscriptionRepository implements SubscriptionRepository {
  private async ensureConfigured(): Promise<void> {
    await ensureRevenueCatConfigured();
  }

  /**
   * Gets the current subscription status from RevenueCat
   */
  async getCurrentSubscription(): Promise<Subscription | null> {
    try {
      await this.ensureConfigured();
      const customerInfo = await Purchases.getCustomerInfo();
      return this.mapCustomerInfoToSubscription(customerInfo);
    } catch (error) {
      throw this.mapErrorToDomainError(error, 'Failed to get current subscription');
    }
  }

  /**
   * Purchases a package through RevenueCat
   */
  async purchasePackage(packageId: string): Promise<void> {
    try {
      await this.ensureConfigured();
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;

      if (!currentOffering) {
        throw new SubscriptionError(
          'No current offering available',
          SubscriptionErrorCode.INVALID_PACKAGE,
        );
      }

      const packageToPurchase = currentOffering.availablePackages.find(
        (pkg) => pkg.identifier === packageId,
      );

      if (!packageToPurchase) {
        throw new SubscriptionError(
          `Package with identifier ${packageId} not found`,
          SubscriptionErrorCode.INVALID_PACKAGE,
        );
      }

      await Purchases.purchasePackage(packageToPurchase);
    } catch (error) {
      if (error instanceof SubscriptionError) {
        throw error;
      }
      // Handle configuration errors gracefully
      if (this.isRevenueCatError(error)) {
        if (
          error.code === 'configurationError' ||
          error.code === '10' ||
          error.message?.includes('no products registered')
        ) {
          throw new SubscriptionError(
            'Cannot purchase: No products configured in RevenueCat dashboard',
            SubscriptionErrorCode.CONFIGURATION_ERROR,
            error instanceof Error ? error : undefined,
          );
        }
      }
      throw this.mapErrorToDomainError(error, 'Failed to purchase package');
    }
  }

  /**
   * Restores previous purchases through RevenueCat
   */
  async restorePurchases(): Promise<Subscription | null> {
    try {
      await this.ensureConfigured();
      const customerInfo = await Purchases.restorePurchases();
      return this.mapCustomerInfoToSubscription(customerInfo);
    } catch (error) {
      throw this.mapErrorToDomainError(error, 'Failed to restore purchases');
    }
  }

  /**
   * Gets available subscription packages from RevenueCat
   */
  async getAvailablePackages(): Promise<SubscriptionPackage[]> {
    try {
      await this.ensureConfigured();
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;

      if (!currentOffering) {
        return [];
      }

      return currentOffering.availablePackages.map((pkg) => this.mapToSubscriptionPackage(pkg));
    } catch (error) {
      // Handle configuration errors gracefully (e.g., no products configured in dashboard)
      if (this.isRevenueCatError(error)) {
        if (
          error.code === 'configurationError' ||
          error.code === '10' ||
          error.message?.includes('no products registered')
        ) {
          console.warn(
            '[RevenueCatSubscriptionRepository] Configuration warning:',
            error.message ?? 'No products configured',
          );
          return [];
        }
      }
      throw this.mapErrorToDomainError(error, 'Failed to get available packages');
    }
  }

  /**
   * Checks if user has a specific entitlement
   */
  async hasEntitlement(entitlementId: string): Promise<boolean> {
    try {
      await this.ensureConfigured();
      const customerInfo = await Purchases.getCustomerInfo();
      return Boolean(customerInfo.entitlements.active[entitlementId]?.isActive);
    } catch (error) {
      throw this.mapErrorToDomainError(error, 'Failed to check entitlement');
    }
  }

  /**
   * Maps RevenueCat CustomerInfo to domain Subscription entity
   */
  mapCustomerInfoToSubscription(customerInfo: CustomerInfo): Subscription {
    const hasActiveEntitlements = Object.keys(customerInfo.entitlements.active).length > 0;
    const tier = hasActiveEntitlements ? 'premium' : 'free';

    return {
      isActive: hasActiveEntitlements,
      tier,
    };
  }

  /**
   * Maps RevenueCat PurchasesPackage to domain SubscriptionPackage
   */
  mapToSubscriptionPackage(pkg: PurchasesPackage): SubscriptionPackage {
    const { product } = pkg;
    const introPrice = product.introPrice
      ? {
          price: product.introPrice.price?.toString() ?? '0',
          priceString: product.introPrice.priceString,
          period: product.introPrice.period,
          periodNumberOfUnits: product.introPrice.periodNumberOfUnits,
          cycles: product.introPrice.cycles,
          periodUnit: product.introPrice.periodUnit,
        }
      : undefined;

    return {
      identifier: pkg.identifier,
      packageType: pkg.packageType,
      title: product.title ?? pkg.identifier,
      price: product.price != null ? product.price.toString() : '0',
      priceString: product.priceString,
      currencyCode: product.currencyCode ?? '',
      introPrice,
    };
  }

  /**
   * Maps errors to domain subscription errors
   */
  mapErrorToDomainError(error: unknown, defaultMessage: string): SubscriptionError {
    if (this.isRevenueCatError(error)) {
      switch (error.code) {
        case 'purchaseCancelledError':
        case '1':
          return new SubscriptionError(
            'Purchase was cancelled by user',
            SubscriptionErrorCode.PURCHASE_CANCELLED,
            error instanceof Error ? error : undefined,
          );

        case 'purchaseNotAllowedError':
        case 'purchaseInvalidError':
        case '3':
        case '4':
          return new SubscriptionError(
            'Purchase is not allowed or invalid',
            SubscriptionErrorCode.PURCHASE_FAILED,
            error instanceof Error ? error : undefined,
          );

        case 'networkError':
        case '7':
          return new SubscriptionError(
            'Network error occurred during purchase',
            SubscriptionErrorCode.NETWORK_ERROR,
            error instanceof Error ? error : undefined,
          );

        case 'configurationError':
        case '10':
          return new SubscriptionError(
            'RevenueCat configuration error',
            SubscriptionErrorCode.CONFIGURATION_ERROR,
            error instanceof Error ? error : undefined,
          );

        default:
          return new SubscriptionError(
            error.message ?? defaultMessage,
            SubscriptionErrorCode.PURCHASE_FAILED,
            error instanceof Error ? error : undefined,
          );
      }
    }

    if (error instanceof Error) {
      return new SubscriptionError(
        error.message ?? defaultMessage,
        SubscriptionErrorCode.UNKNOWN_ERROR,
        error,
      );
    }

    return new SubscriptionError(defaultMessage, SubscriptionErrorCode.UNKNOWN_ERROR);
  }

  /**
   * Type guard to check if error is a RevenueCat error
   */
  isRevenueCatError(error: unknown): error is { code: string; message?: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string'
    );
  }
}
