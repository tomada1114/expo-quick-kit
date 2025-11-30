/**
 * Type declarations for react-native-purchases (RevenueCat SDK)
 *
 * This file provides type definitions for the RevenueCat SDK
 * to enable TypeScript type checking before the actual package is installed.
 *
 * Note: When react-native-purchases is installed, these declarations
 * will be overridden by the package's own type definitions.
 */

declare module 'react-native-purchases' {
  /**
   * Log levels for the SDK
   */
  export const LOG_LEVEL: {
    DEBUG: 'DEBUG';
    INFO: 'INFO';
    WARN: 'WARN';
    ERROR: 'ERROR';
  };

  /**
   * Configuration options for the SDK
   */
  export interface PurchasesConfiguration {
    apiKey: string;
    appUserID?: string;
    observerMode?: boolean;
    userDefaultsSuiteName?: string;
    usesStoreKit2IfAvailable?: boolean;
    useAmazon?: boolean;
  }

  /**
   * Entitlement information
   */
  export interface EntitlementInfo {
    identifier: string;
    isActive: boolean;
    willRenew: boolean;
    periodType: string;
    latestPurchaseDate: string;
    latestPurchaseDateMillis: number;
    originalPurchaseDate: string;
    originalPurchaseDateMillis: number;
    expirationDate: string | null;
    expirationDateMillis: number | null;
    store: string;
    productIdentifier: string;
    productPlanIdentifier: string | null;
    isSandbox: boolean;
    unsubscribeDetectedAt: string | null;
    unsubscribeDetectedAtMillis: number | null;
    billingIssueDetectedAt: string | null;
    billingIssueDetectedAtMillis: number | null;
    ownershipType: string;
  }

  /**
   * Entitlements object containing active and all entitlements
   */
  export interface EntitlementInfos {
    active: Record<string, EntitlementInfo>;
    all: Record<string, EntitlementInfo>;
  }

  /**
   * Customer information from RevenueCat
   */
  export interface CustomerInfo {
    entitlements: EntitlementInfos;
    activeSubscriptions: string[];
    allPurchasedProductIdentifiers: string[];
    latestExpirationDate: string | null;
    originalAppUserId: string;
    originalApplicationVersion: string | null;
    originalPurchaseDate: string | null;
  }

  /**
   * Product information
   */
  export interface PurchasesStoreProduct {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
    introPrice: {
      price: number;
      priceString: string;
      period: string;
      periodNumberOfUnits: number;
      periodUnit: string;
      cycles: number;
    } | null;
    discounts: unknown[];
    productCategory: string;
    productType: string;
    subscriptionPeriod: string;
    defaultOption: unknown | null;
    subscriptionOptions: unknown[];
    presentedOfferingIdentifier: string;
    presentedOfferingContext: unknown | null;
  }

  /**
   * Package information
   */
  export interface PurchasesPackage {
    identifier: string;
    packageType: string;
    product: PurchasesStoreProduct;
    offeringIdentifier: string;
    presentedOfferingContext: unknown | null;
  }

  /**
   * Offering information
   */
  export interface PurchasesOffering {
    identifier: string;
    serverDescription: string;
    metadata: Record<string, unknown>;
    availablePackages: PurchasesPackage[];
    monthly: PurchasesPackage | null;
    annual: PurchasesPackage | null;
    twoMonth: PurchasesPackage | null;
    threeMonth: PurchasesPackage | null;
    sixMonth: PurchasesPackage | null;
    lifetime: PurchasesPackage | null;
    weekly: PurchasesPackage | null;
  }

  /**
   * Offerings information
   */
  export interface PurchasesOfferings {
    current: PurchasesOffering | null;
    all: Record<string, PurchasesOffering>;
  }

  /**
   * Purchase result
   */
  export interface MakePurchaseResult {
    customerInfo: CustomerInfo;
    productIdentifier: string;
  }

  /**
   * Error from Purchases SDK
   */
  export interface PurchasesError extends Error {
    code: number;
    underlyingErrorMessage?: string;
    userInfo?: Record<string, unknown>;
  }

  /**
   * Error codes for purchase errors
   */
  export const PURCHASES_ERROR_CODE: {
    UNKNOWN_ERROR: 0;
    PURCHASE_CANCELLED_ERROR: 1;
    STORE_PROBLEM_ERROR: 2;
    PURCHASE_NOT_ALLOWED_ERROR: 3;
    PURCHASE_INVALID_ERROR: 4;
    PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR: 5;
    PRODUCT_ALREADY_PURCHASED_ERROR: 6;
    RECEIPT_ALREADY_IN_USE_ERROR: 7;
    INVALID_RECEIPT_ERROR: 8;
    MISSING_RECEIPT_FILE_ERROR: 9;
    NETWORK_ERROR: 10;
    INVALID_CREDENTIALS_ERROR: 11;
    UNEXPECTED_BACKEND_RESPONSE_ERROR: 12;
    RECEIPT_IN_USE_BY_OTHER_SUBSCRIBER_ERROR: 13;
    INVALID_APP_USER_ID_ERROR: 14;
    OPERATION_ALREADY_IN_PROGRESS_ERROR: 15;
    UNKNOWN_BACKEND_ERROR: 16;
    INVALID_APPLE_SUBSCRIPTION_KEY_ERROR: 17;
    INELIGIBLE_ERROR: 18;
    INSUFFICIENT_PERMISSIONS_ERROR: 19;
    PAYMENT_PENDING_ERROR: 20;
    INVALID_SUBSCRIBER_ATTRIBUTES_ERROR: 21;
    LOG_OUT_WITH_ANONYMOUS_USER_ERROR: 22;
    CONFIGURATION_ERROR: 23;
    UNSUPPORTED_ERROR: 24;
    EMPTY_SUBSCRIBER_ATTRIBUTES_ERROR: 25;
    PRODUCT_DISCOUNT_MISSING_IDENTIFIER_ERROR: 26;
    PRODUCT_DISCOUNT_MISSING_SUBSCRIPTION_GROUP_IDENTIFIER_ERROR: 27;
    CUSTOMER_INFO_ERROR: 28;
    SYSTEM_INFO_ERROR: 29;
    BEGIN_REFUND_REQUEST_ERROR: 30;
    PRODUCT_REQUEST_TIMED_OUT_ERROR: 31;
    API_ENDPOINT_BLOCKED_ERROR: 32;
    INVALID_PROMOTIONAL_OFFER_ERROR: 33;
    OFFLINE_CONNECTION_ERROR: 34;
    FEATURE_NOT_AVAILABLE_IN_CUSTOM_ENTITLEMENTS_COMPUTATION_MODE_ERROR: 35;
    SIGNATURE_VERIFICATION_ERROR: 36;
  };

  /**
   * Main Purchases interface
   */
  interface Purchases {
    configure(configuration: PurchasesConfiguration): Promise<void>;
    setLogLevel(level: string): void;
    isConfigured(): boolean;
    getCustomerInfo(): Promise<CustomerInfo>;
    getOfferings(): Promise<PurchasesOfferings>;
    purchasePackage(pkg: PurchasesPackage): Promise<MakePurchaseResult>;
    restorePurchases(): Promise<CustomerInfo>;
  }

  const Purchases: Purchases;
  export default Purchases;

  // Test utilities (only available in test environment via __mocks__)
  export function resetMock(): void;
  export function setupFreeUserMock(): void;
  export function setupPremiumUserMock(): void;
  export function setupExpiredSubscriptionMock(daysAgo?: number): void;
  export function setupTrialSubscriptionMock(trialDaysRemaining: number): void;
  export function setupCancelledSubscriptionMock(expiresInDays: number): void;
  export function setupBillingIssueMock(): void;
  export function setupLifetimeSubscriptionMock(): void;
  export function setupPurchaseError(errorCode: number): void;
  export function setupRestoreError(errorCode: number): void;
  export function setupOfferingsError(errorCode: number): void;
  export function setupOperationInProgress(): void;
  export function createMockPremiumCustomerInfo(): CustomerInfo;
  export const mockFreeCustomerInfo: CustomerInfo;
  export const mockPremiumCustomerInfo: CustomerInfo;
}
