# Clean Architecture Patterns for Subscription Implementation

## Layer Structure

```
src/
├── domain/subscription/          # Pure business logic
│   ├── entities.ts               # Subscription entity
│   ├── value-objects.ts          # UsageLimits, FeatureLevel
│   ├── repository.ts             # Repository interface
│   └── services.ts               # SubscriptionService (domain logic)
├── application/subscription/     # Use case orchestration
│   └── SubscriptionApplicationService.ts
├── infrastructure/repositories/  # External integrations
│   ├── RevenueCatSubscriptionRepository.ts
│   └── MockSubscriptionRepository.ts
└── [presentation layer]/         # UI, hooks, components
    ├── hooks/useSubscription.ts
    ├── provider/RevenueCatProvider.tsx
    └── components/payment/paywall.tsx
```

## Domain Layer Implementation

### entities.ts

```typescript
/**
 * Subscription entity representing user's subscription status
 */
export interface Subscription {
  isActive: boolean;
  tier: 'free' | 'premium';
}
```

### value-objects.ts

```typescript
/**
 * Usage limits based on subscription tier
 */
export interface UsageLimits {
  maxItems: number;
  maxExports: number;
  hasAds: boolean;
}
```

### repository.ts

```typescript
/**
 * Subscription package from store
 */
export interface SubscriptionPackage {
  identifier: string;
  packageType: 'MONTHLY' | 'ANNUAL' | 'LIFETIME' | string;
  title: string;
  price: string;
  priceString: string;
  currencyCode: string;
  introPrice?: {
    price: string;
    priceString: string;
    period: string;
    periodNumberOfUnits: number;
    cycles: number;
    periodUnit: string;
  };
}

/**
 * Repository interface (no implementation details)
 */
export interface SubscriptionRepository {
  getCurrentSubscription(): Promise<Subscription | null>;
  purchasePackage(packageId: string): Promise<void>;
  restorePurchases(): Promise<Subscription | null>;
  getAvailablePackages(): Promise<SubscriptionPackage[]>;
  hasEntitlement(entitlementId: string): Promise<boolean>;
}

/**
 * Domain errors
 */
export enum SubscriptionErrorCode {
  PURCHASE_CANCELLED = 'PURCHASE_CANCELLED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_PACKAGE = 'INVALID_PACKAGE',
  STORE_ERROR = 'STORE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class SubscriptionError extends Error {
  constructor(
    message: string,
    public readonly code: SubscriptionErrorCode,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SubscriptionError';
  }
}
```

### services.ts

```typescript
import { type Subscription } from './entities';
import { type UsageLimits } from './value-objects';

export type FeatureLevel = 'basic' | 'premium';

/**
 * Service for subscription business logic
 */
export class SubscriptionService {
  /**
   * Get usage limits based on subscription tier
   */
  static getUsageLimits(subscription: Subscription): UsageLimits {
    if (!subscription.isActive || subscription.tier === 'free') {
      return {
        maxItems: 10,
        maxExports: 1,
        hasAds: true,
      };
    }

    return {
      maxItems: Infinity,
      maxExports: Infinity,
      hasAds: false,
    };
  }

  /**
   * Check if subscription can access a feature level
   */
  static canAccessFeature(
    subscription: Subscription,
    featureLevel: FeatureLevel
  ): boolean {
    if (featureLevel === 'basic') {
      return true;
    }
    return subscription.isActive && subscription.tier === 'premium';
  }

  static isPremium(subscription: Subscription): boolean {
    return subscription.isActive && subscription.tier === 'premium';
  }

  static isFree(subscription: Subscription): boolean {
    return !subscription.isActive || subscription.tier === 'free';
  }

  static getFreeSubscription(): Subscription {
    return { isActive: false, tier: 'free' };
  }
}
```

## Application Layer Implementation

### SubscriptionApplicationService.ts

```typescript
import type { SubscriptionRepository } from '../../domain/subscription/repository';
import { SubscriptionService } from '../../domain/subscription/services';
import type { Subscription } from '../../domain/subscription/entities';
import type { UsageLimits } from '../../domain/subscription/value-objects';
import type { FeatureLevel } from '../../domain/subscription/services';

export interface SubscriptionStatus {
  subscription: Subscription;
  usageLimits: UsageLimits;
  isSubscribed: boolean;
  isPremium: boolean;
  isFree: boolean;
  canAccessFeature: (level: FeatureLevel) => boolean;
}

export interface PurchaseResult {
  success: boolean;
  subscription: Subscription | null;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  subscription: Subscription | null;
  error?: string;
}

export interface PackagesResult {
  packages: SubscriptionPackage[];
  error?: string;
}

/**
 * Application service orchestrating subscription use cases
 */
export class SubscriptionApplicationService {
  constructor(
    private readonly repository: SubscriptionRepository,
    private readonly domainService = SubscriptionService
  ) {}

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const subscription =
      (await this.repository.getCurrentSubscription()) ??
      this.domainService.getFreeSubscription();

    const usageLimits = this.domainService.getUsageLimits(subscription);
    const isSubscribed = this.domainService.isPremium(subscription);
    const isPremium = this.domainService.isPremium(subscription);
    const isFree = this.domainService.isFree(subscription);

    return {
      subscription,
      usageLimits,
      isSubscribed,
      isPremium,
      isFree,
      canAccessFeature: (level: FeatureLevel) =>
        this.domainService.canAccessFeature(subscription, level),
    };
  }

  async purchasePackage(packageId: string): Promise<PurchaseResult> {
    try {
      await this.repository.purchasePackage(packageId);
      const subscription = await this.repository.getCurrentSubscription();
      return {
        success: true,
        subscription: subscription ?? this.domainService.getFreeSubscription(),
      };
    } catch (error) {
      return {
        success: false,
        subscription: null,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  async restorePurchases(): Promise<RestoreResult> {
    try {
      const subscription = await this.repository.restorePurchases();
      return {
        success: true,
        subscription: subscription ?? this.domainService.getFreeSubscription(),
      };
    } catch (error) {
      return {
        success: false,
        subscription: null,
        error: error instanceof Error ? error.message : 'Restore failed',
      };
    }
  }

  async getAvailablePackages(): Promise<PackagesResult> {
    try {
      const packages = await this.repository.getAvailablePackages();
      return { packages };
    } catch (error) {
      return {
        packages: [],
        error:
          error instanceof Error ? error.message : 'Failed to load packages',
      };
    }
  }

  async hasEntitlement(entitlementId: string): Promise<boolean> {
    try {
      return await this.repository.hasEntitlement(entitlementId);
    } catch (error) {
      console.error('Failed to check entitlement:', error);
      return false;
    }
  }
}
```

## Infrastructure Layer Implementation

### RevenueCatSubscriptionRepository.ts

```typescript
import Purchases, { CustomerInfo } from 'react-native-purchases';
import type {
  SubscriptionRepository,
  SubscriptionPackage,
} from '../../domain/subscription/repository';
import type { Subscription } from '../../domain/subscription/entities';
import {
  SubscriptionError,
  SubscriptionErrorCode,
} from '../../domain/subscription/repository';
import { ensureRevenueCatConfigured } from '../revenuecat/configuration';

/**
 * RevenueCat implementation of SubscriptionRepository
 */
export class RevenueCatSubscriptionRepository implements SubscriptionRepository {
  private async ensureConfigured(): Promise<void> {
    await ensureRevenueCatConfigured();
  }

  async getCurrentSubscription(): Promise<Subscription | null> {
    await this.ensureConfigured();
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.mapCustomerInfoToSubscription(customerInfo);
    } catch (error) {
      throw this.mapToDomainError(error, 'Failed to get subscription');
    }
  }

  async purchasePackage(packageId: string): Promise<void> {
    await this.ensureConfigured();
    try {
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;

      if (!currentOffering) {
        throw new SubscriptionError(
          'No current offering available',
          SubscriptionErrorCode.STORE_ERROR
        );
      }

      const pkg = currentOffering.availablePackages.find(
        (p) => p.identifier === packageId
      );

      if (!pkg) {
        throw new SubscriptionError(
          `Package ${packageId} not found`,
          SubscriptionErrorCode.INVALID_PACKAGE
        );
      }

      await Purchases.purchasePackage(pkg);
    } catch (error) {
      throw this.mapToDomainError(error, 'Purchase failed');
    }
  }

  async restorePurchases(): Promise<Subscription | null> {
    await this.ensureConfigured();
    try {
      const customerInfo = await Purchases.restorePurchases();
      return this.mapCustomerInfoToSubscription(customerInfo);
    } catch (error) {
      throw this.mapToDomainError(error, 'Restore failed');
    }
  }

  async getAvailablePackages(): Promise<SubscriptionPackage[]> {
    await this.ensureConfigured();
    try {
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;

      if (!currentOffering) {
        return [];
      }

      return currentOffering.availablePackages.map((pkg) => ({
        identifier: pkg.identifier,
        packageType: pkg.packageType,
        title: pkg.product.title,
        price: pkg.product.price.toString(),
        priceString: pkg.product.priceString,
        currencyCode: pkg.product.currencyCode,
        introPrice: pkg.product.introPrice
          ? {
              price: pkg.product.introPrice.price.toString(),
              priceString: pkg.product.introPrice.priceString,
              period: pkg.product.introPrice.period,
              periodNumberOfUnits: pkg.product.introPrice.periodNumberOfUnits,
              cycles: pkg.product.introPrice.cycles,
              periodUnit: pkg.product.introPrice.periodUnit,
            }
          : undefined,
      }));
    } catch (error) {
      throw this.mapToDomainError(error, 'Failed to get packages');
    }
  }

  async hasEntitlement(entitlementId: string): Promise<boolean> {
    await this.ensureConfigured();
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return Boolean(customerInfo.entitlements.active[entitlementId]?.isActive);
    } catch (error) {
      throw this.mapToDomainError(error, 'Failed to check entitlement');
    }
  }

  private mapCustomerInfoToSubscription(
    customerInfo: CustomerInfo
  ): Subscription {
    const hasActiveEntitlements =
      Object.keys(customerInfo.entitlements.active).length > 0;
    return {
      isActive: hasActiveEntitlements,
      tier: hasActiveEntitlements ? 'premium' : 'free',
    };
  }

  private mapToDomainError(error: unknown, message: string): SubscriptionError {
    if (this.isRevenueCatError(error)) {
      switch (error.code) {
        case 'purchaseCancelledError':
          return new SubscriptionError(
            message,
            SubscriptionErrorCode.PURCHASE_CANCELLED,
            error
          );
        case 'networkError':
          return new SubscriptionError(
            message,
            SubscriptionErrorCode.NETWORK_ERROR,
            error
          );
        case 'storeProblemError':
          return new SubscriptionError(
            message,
            SubscriptionErrorCode.STORE_ERROR,
            error
          );
        default:
          return new SubscriptionError(
            message,
            SubscriptionErrorCode.UNKNOWN_ERROR,
            error
          );
      }
    }
    return new SubscriptionError(message, SubscriptionErrorCode.UNKNOWN_ERROR);
  }

  private isRevenueCatError(
    error: unknown
  ): error is { code: string; message: string } {
    return typeof error === 'object' && error !== null && 'code' in error;
  }
}
```

## Presentation Layer Implementation

### hooks/useSubscription.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useSubscriptionService } from '../provider/ServiceProvider';
import type { FeatureLevel } from '../domain/subscription/services';

/**
 * Hook for managing subscription state and operations
 */
export function useSubscription() {
  const subscriptionService = useSubscriptionService();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSubscriptionStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await subscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load subscription status'
      );
      setSubscriptionStatus(null);
    } finally {
      setLoading(false);
    }
  }, [subscriptionService]);

  const purchasePackage = useCallback(
    async (packageId: string) => {
      const result = await subscriptionService.purchasePackage(packageId);
      if (result.success) {
        await loadSubscriptionStatus();
      } else if (result.error) {
        setError(result.error);
      }
      return result;
    },
    [subscriptionService, loadSubscriptionStatus]
  );

  const restorePurchases = useCallback(async () => {
    const result = await subscriptionService.restorePurchases();
    if (result.success) {
      await loadSubscriptionStatus();
    } else if (result.error) {
      setError(result.error);
    }
    return result;
  }, [subscriptionService, loadSubscriptionStatus]);

  useEffect(() => {
    void loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  return {
    subscription: subscriptionStatus?.subscription,
    usageLimits: subscriptionStatus?.usageLimits ?? {
      maxItems: 10,
      maxExports: 1,
      hasAds: true,
    },
    isSubscribed: subscriptionStatus?.isSubscribed ?? false,
    isPremium: subscriptionStatus?.isPremium ?? false,
    isFree: subscriptionStatus?.isFree ?? true,
    loading,
    error,
    purchasePackage,
    restorePurchases,
    canAccessFeature: (level: FeatureLevel) =>
      subscriptionStatus?.canAccessFeature(level) ?? false,
    refresh: loadSubscriptionStatus,
  };
}
```

## Dependency Injection Pattern

### provider/ServiceProvider.tsx

```typescript
import React, { createContext, useContext, useMemo } from 'react';
import { SubscriptionApplicationService } from '../application/subscription/SubscriptionApplicationService';
import { RevenueCatSubscriptionRepository } from '../infrastructure/repositories/RevenueCatSubscriptionRepository';

interface Services {
  subscription: SubscriptionApplicationService;
}

const ServiceContext = createContext<Services | undefined>(undefined);

export function ServiceProvider({ children, configuration = {} }) {
  const services = useMemo(() => {
    const repo = configuration.subscriptionRepository ?? new RevenueCatSubscriptionRepository();
    return {
      subscription: new SubscriptionApplicationService(repo),
    };
  }, [configuration]);

  return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>;
}

export function useSubscriptionService(): SubscriptionApplicationService {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useSubscriptionService must be used within ServiceProvider');
  }
  return context.subscription;
}
```

## Key Principles

1. **Dependency Direction:** Presentation → Application → Domain ← Infrastructure
2. **Repository Pattern:** Infrastructure implements domain interfaces
3. **Error Mapping:** Convert SDK errors to domain errors
4. **Type Safety:** Strict TypeScript with branded types where needed
5. **Testability:** Each layer is independently testable with mock implementations
