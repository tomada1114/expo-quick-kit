/**
 * RevenueCat Template - Subscription Service
 *
 * Application service for coordinating subscription use cases.
 * This can be used directly or through hooks.
 */

import { RevenueCatSubscriptionRepository } from './repository';
import {
  type Subscription,
  type SubscriptionPackage,
  type SubscriptionStatus,
  type PurchaseResult,
  type RestoreResult,
  type PackagesResult,
  type FeatureLevel,
} from './types';
import {
  getUsageLimits,
  canAccessFeature,
  isPremium,
  isFree,
  getFreeSubscription,
} from './config';

/**
 * Subscription service for coordinating subscription use cases.
 *
 * Usage:
 *   const service = new SubscriptionService();
 *   const status = await service.getSubscriptionStatus();
 */
export class SubscriptionService {
  private repository: RevenueCatSubscriptionRepository;

  constructor(repository?: RevenueCatSubscriptionRepository) {
    this.repository = repository ?? new RevenueCatSubscriptionRepository();
  }

  /**
   * Gets the complete subscription status with business logic applied
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
    try {
      const subscription =
        (await this.repository.getCurrentSubscription()) ??
        getFreeSubscription();

      const usageLimits = getUsageLimits(subscription);
      const subscribed = isPremium(subscription);
      const premium = isPremium(subscription);
      const free = isFree(subscription);

      return {
        subscription,
        usageLimits,
        isSubscribed: subscribed,
        isPremium: premium,
        isFree: free,
        canAccessFeature: (featureLevel: FeatureLevel) =>
          canAccessFeature(subscription, featureLevel),
      };
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      throw error instanceof Error
        ? error
        : new Error('Failed to get subscription status');
    }
  }

  /**
   * Purchases a subscription package
   */
  async purchasePackage(packageId: string): Promise<PurchaseResult> {
    try {
      await this.repository.purchasePackage(packageId);
      const subscription = await this.repository.getCurrentSubscription();

      return {
        success: true,
        subscription,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Purchase failed';
      console.error('Purchase failed:', error);

      return {
        success: false,
        subscription: null,
        error: errorMessage,
      };
    }
  }

  /**
   * Restores previous purchases
   */
  async restorePurchases(): Promise<RestoreResult> {
    try {
      const subscription = await this.repository.restorePurchases();

      return {
        success: true,
        subscription,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Restore failed';
      console.error('Restore purchases failed:', error);

      return {
        success: false,
        subscription: null,
        error: errorMessage,
      };
    }
  }

  /**
   * Gets available subscription packages
   */
  async getAvailablePackages(): Promise<PackagesResult> {
    try {
      const packages = await this.repository.getAvailablePackages();
      return { packages };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to get packages';
      console.error('Failed to get available packages:', error);

      return {
        packages: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Checks if user has a specific entitlement
   */
  async hasEntitlement(entitlementId: string): Promise<boolean> {
    try {
      return await this.repository.hasEntitlement(entitlementId);
    } catch (error) {
      console.error('Failed to check entitlement:', error);
      return false;
    }
  }

  /**
   * Gets usage limits for the current subscription
   */
  async getUsageLimits() {
    try {
      const subscription =
        (await this.repository.getCurrentSubscription()) ??
        getFreeSubscription();

      return getUsageLimits(subscription);
    } catch (error) {
      console.error('Failed to get usage limits:', error);
      return getUsageLimits(getFreeSubscription());
    }
  }
}
