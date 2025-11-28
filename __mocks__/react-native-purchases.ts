/**
 * Mock for react-native-purchases (RevenueCat SDK)
 *
 * This mock is automatically used by Jest for all tests.
 * Provides mock implementations for testing subscription features
 * without making real API calls.
 *
 * @module __mocks__/react-native-purchases
 */

/**
 * Mock CustomerInfo type
 */
interface MockCustomerInfo {
  entitlements: {
    active: Record<string, MockEntitlement>;
    all: Record<string, MockEntitlement>;
  };
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  latestExpirationDate: string | null;
  originalAppUserId: string;
  originalApplicationVersion: string | null;
  originalPurchaseDate: string | null;
}

interface MockEntitlement {
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

interface MockPurchasesPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
    introPrice: null | {
      price: number;
      priceString: string;
      period: string;
    };
  };
  offeringIdentifier: string;
}

// Mock CustomerInfo for free user
export const mockFreeCustomerInfo: MockCustomerInfo = {
  entitlements: {
    active: {},
    all: {},
  },
  activeSubscriptions: [],
  allPurchasedProductIdentifiers: [],
  latestExpirationDate: null,
  originalAppUserId: 'test-user-123',
  originalApplicationVersion: null,
  originalPurchaseDate: null,
};

// Mock CustomerInfo for premium user
export const mockPremiumCustomerInfo: MockCustomerInfo = {
  entitlements: {
    active: {
      premium: {
        identifier: 'premium',
        isActive: true,
        willRenew: true,
        periodType: 'normal',
        latestPurchaseDate: new Date().toISOString(),
        latestPurchaseDateMillis: Date.now(),
        originalPurchaseDate: new Date().toISOString(),
        originalPurchaseDateMillis: Date.now(),
        expirationDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        expirationDateMillis: Date.now() + 30 * 24 * 60 * 60 * 1000,
        store: 'APP_STORE',
        productIdentifier: 'monthly_plan',
        productPlanIdentifier: null,
        isSandbox: true,
        unsubscribeDetectedAt: null,
        unsubscribeDetectedAtMillis: null,
        billingIssueDetectedAt: null,
        billingIssueDetectedAtMillis: null,
        ownershipType: 'PURCHASED',
      },
    },
    all: {},
  },
  activeSubscriptions: ['monthly_plan'],
  allPurchasedProductIdentifiers: ['monthly_plan'],
  latestExpirationDate: new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString(),
  originalAppUserId: 'test-user-123',
  originalApplicationVersion: null,
  originalPurchaseDate: new Date().toISOString(),
};

// Test utilities for setting up mock state
let mockCustomerInfo: MockCustomerInfo = mockFreeCustomerInfo;
let mockShouldFailPurchase = false;
let mockPurchaseErrorCode: number | null = null;

/**
 * Set up the mock to return free user state.
 * Use this at the beginning of tests for free user scenarios.
 */
export function setupFreeUserMock(): void {
  mockCustomerInfo = mockFreeCustomerInfo;
}

/**
 * Set up the mock to return premium user state.
 * Use this at the beginning of tests for premium user scenarios.
 */
export function setupPremiumUserMock(): void {
  mockCustomerInfo = mockPremiumCustomerInfo;
}

/**
 * Set up the mock to simulate a purchase error.
 * @param errorCode - The error code to return
 */
export function setupPurchaseError(errorCode: number): void {
  mockShouldFailPurchase = true;
  mockPurchaseErrorCode = errorCode;
}

/**
 * Reset all mock state to defaults.
 * Call this in beforeEach to ensure clean test state.
 */
export function resetMock(): void {
  mockCustomerInfo = mockFreeCustomerInfo;
  mockShouldFailPurchase = false;
  mockPurchaseErrorCode = null;
}

// LOG_LEVEL enum
export const LOG_LEVEL = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

// Error codes matching RevenueCat SDK
export const PURCHASES_ERROR_CODE = {
  UNKNOWN_ERROR: 0,
  PURCHASE_CANCELLED_ERROR: 1,
  STORE_PROBLEM_ERROR: 2,
  PURCHASE_NOT_ALLOWED_ERROR: 3,
  PURCHASE_INVALID_ERROR: 4,
  PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR: 5,
  PRODUCT_ALREADY_PURCHASED_ERROR: 6,
  RECEIPT_ALREADY_IN_USE_ERROR: 7,
  INVALID_RECEIPT_ERROR: 8,
  MISSING_RECEIPT_FILE_ERROR: 9,
  NETWORK_ERROR: 10,
  INVALID_CREDENTIALS_ERROR: 11,
  UNEXPECTED_BACKEND_RESPONSE_ERROR: 12,
  RECEIPT_IN_USE_BY_OTHER_SUBSCRIBER_ERROR: 13,
  INVALID_APP_USER_ID_ERROR: 14,
  OPERATION_ALREADY_IN_PROGRESS_ERROR: 15,
  UNKNOWN_BACKEND_ERROR: 16,
  INVALID_APPLE_SUBSCRIPTION_KEY_ERROR: 17,
  INELIGIBLE_ERROR: 18,
  INSUFFICIENT_PERMISSIONS_ERROR: 19,
  PAYMENT_PENDING_ERROR: 20,
  INVALID_SUBSCRIBER_ATTRIBUTES_ERROR: 21,
  LOG_OUT_WITH_ANONYMOUS_USER_ERROR: 22,
  CONFIGURATION_ERROR: 23,
  UNSUPPORTED_ERROR: 24,
  EMPTY_SUBSCRIBER_ATTRIBUTES_ERROR: 25,
  PRODUCT_DISCOUNT_MISSING_IDENTIFIER_ERROR: 26,
  PRODUCT_DISCOUNT_MISSING_SUBSCRIPTION_GROUP_IDENTIFIER_ERROR: 27,
  CUSTOMER_INFO_ERROR: 28,
  SYSTEM_INFO_ERROR: 29,
  BEGIN_REFUND_REQUEST_ERROR: 30,
  PRODUCT_REQUEST_TIMED_OUT_ERROR: 31,
  API_ENDPOINT_BLOCKED_ERROR: 32,
  INVALID_PROMOTIONAL_OFFER_ERROR: 33,
  OFFLINE_CONNECTION_ERROR: 34,
  FEATURE_NOT_AVAILABLE_IN_CUSTOM_ENTITLEMENTS_COMPUTATION_MODE_ERROR: 35,
  SIGNATURE_VERIFICATION_ERROR: 36,
} as const;

// Mock Purchases class
const Purchases = {
  configure: jest.fn().mockResolvedValue(undefined),
  setLogLevel: jest.fn(),
  isConfigured: jest.fn().mockReturnValue(false),

  getCustomerInfo: jest.fn().mockImplementation(() => {
    return Promise.resolve(mockCustomerInfo);
  }),

  getOfferings: jest.fn().mockResolvedValue({
    current: {
      identifier: 'default',
      serverDescription: 'Default offering',
      metadata: {},
      availablePackages: [
        {
          identifier: '$rc_monthly',
          packageType: 'MONTHLY',
          product: {
            identifier: 'monthly_plan',
            description: 'Monthly subscription',
            title: 'Monthly',
            price: 9.99,
            priceString: '$9.99',
            currencyCode: 'USD',
            introPrice: null,
            discounts: [],
            productCategory: 'SUBSCRIPTION',
            productType: 'AUTO_RENEWABLE_SUBSCRIPTION',
            subscriptionPeriod: 'P1M',
            defaultOption: null,
            subscriptionOptions: [],
            presentedOfferingIdentifier: 'default',
            presentedOfferingContext: null,
          },
          offeringIdentifier: 'default',
          presentedOfferingContext: null,
        },
        {
          identifier: '$rc_annual',
          packageType: 'ANNUAL',
          product: {
            identifier: 'annual_plan',
            description: 'Annual subscription',
            title: 'Annual',
            price: 99.99,
            priceString: '$99.99',
            currencyCode: 'USD',
            introPrice: null,
            discounts: [],
            productCategory: 'SUBSCRIPTION',
            productType: 'AUTO_RENEWABLE_SUBSCRIPTION',
            subscriptionPeriod: 'P1Y',
            defaultOption: null,
            subscriptionOptions: [],
            presentedOfferingIdentifier: 'default',
            presentedOfferingContext: null,
          },
          offeringIdentifier: 'default',
          presentedOfferingContext: null,
        },
      ],
      monthly: null,
      annual: null,
      twoMonth: null,
      threeMonth: null,
      sixMonth: null,
      lifetime: null,
      weekly: null,
    },
    all: {},
  }),

  purchasePackage: jest.fn().mockImplementation((pkg: MockPurchasesPackage) => {
    if (mockShouldFailPurchase) {
      const error = new Error('Purchase failed');
      (error as Error & { code: number }).code =
        mockPurchaseErrorCode ?? PURCHASES_ERROR_CODE.UNKNOWN_ERROR;
      return Promise.reject(error);
    }
    // Simulate successful purchase - user becomes premium
    mockCustomerInfo = mockPremiumCustomerInfo;
    return Promise.resolve({ customerInfo: mockPremiumCustomerInfo });
  }),

  restorePurchases: jest.fn().mockImplementation(() => {
    return Promise.resolve(mockCustomerInfo);
  }),
};

export default Purchases;
