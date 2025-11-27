/**
 * RevenueCat Template - Jest Mock
 *
 * Mock implementation of react-native-purchases for testing.
 * Copy this file to your project's __mocks__ directory.
 */

const mockPurchases = {
  configure: jest.fn(),
  getCustomerInfo: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
  getOfferings: jest.fn(),
  addCustomerInfoUpdateListener: jest.fn(),
  removeCustomerInfoUpdateListener: jest.fn(),
  PACKAGE_TYPE: {
    MONTHLY: 'MONTHLY',
    ANNUAL: 'ANNUAL',
    WEEKLY: 'WEEKLY',
    LIFETIME: 'LIFETIME',
    CUSTOM: 'CUSTOM',
    UNKNOWN: 'UNKNOWN',
    SIX_MONTH: 'SIX_MONTH',
    THREE_MONTH: 'THREE_MONTH',
    TWO_MONTH: 'TWO_MONTH',
  },
  VERIFICATION_RESULT: {
    NOT_REQUESTED: 'NOT_REQUESTED',
    VERIFIED: 'VERIFIED',
    FAILED: 'FAILED',
  },
  PRODUCT_TYPE: {
    CONSUMABLE: 'CONSUMABLE',
    NON_CONSUMABLE: 'NON_CONSUMABLE',
    NON_RENEWABLE_SUBSCRIPTION: 'NON_RENEWABLE_SUBSCRIPTION',
    AUTO_RENEWABLE_SUBSCRIPTION: 'AUTO_RENEWABLE_SUBSCRIPTION',
    PREPAID_SUBSCRIPTION: 'PREPAID_SUBSCRIPTION',
    UNKNOWN: 'UNKNOWN',
  },
};

export default mockPurchases;
export { mockPurchases };

// ============================================================
// Test Helpers
// ============================================================

/**
 * Creates a mock CustomerInfo object for testing
 */
export function createMockCustomerInfo(options: {
  isPremium?: boolean;
  entitlements?: string[];
} = {}) {
  const { isPremium = false, entitlements = [] } = options;

  const activeEntitlements: Record<string, { isActive: boolean }> = {};

  if (isPremium) {
    activeEntitlements['premium'] = { isActive: true };
  }

  entitlements.forEach((entitlement) => {
    activeEntitlements[entitlement] = { isActive: true };
  });

  return {
    entitlements: {
      active: activeEntitlements,
      all: activeEntitlements,
    },
    activeSubscriptions: isPremium ? ['premium_monthly'] : [],
    allPurchasedProductIdentifiers: [],
    latestExpirationDate: null,
    firstSeen: new Date().toISOString(),
    originalAppUserId: 'test-user-id',
    requestDate: new Date().toISOString(),
    originalApplicationVersion: null,
    originalPurchaseDate: null,
    managementURL: null,
    nonSubscriptionTransactions: [],
  };
}

/**
 * Creates a mock package for testing
 */
export function createMockPackage(options: {
  identifier?: string;
  price?: number;
  priceString?: string;
  title?: string;
} = {}) {
  const {
    identifier = '$rc_monthly',
    price = 9.99,
    priceString = '$9.99',
    title = 'Monthly Subscription',
  } = options;

  return {
    identifier,
    packageType: 'MONTHLY',
    product: {
      identifier: `${identifier}_product`,
      title,
      price,
      priceString,
      currencyCode: 'USD',
      introPrice: null,
    },
  };
}

/**
 * Creates mock offerings for testing
 */
export function createMockOfferings(packages: ReturnType<typeof createMockPackage>[] = []) {
  const defaultPackages = packages.length > 0 ? packages : [
    createMockPackage({ identifier: '$rc_monthly', price: 9.99, priceString: '$9.99' }),
    createMockPackage({ identifier: '$rc_annual', price: 79.99, priceString: '$79.99', title: 'Annual Subscription' }),
  ];

  return {
    current: {
      identifier: 'default',
      serverDescription: 'Default offering',
      availablePackages: defaultPackages,
    },
    all: {
      default: {
        identifier: 'default',
        serverDescription: 'Default offering',
        availablePackages: defaultPackages,
      },
    },
  };
}

/**
 * Sets up mock for free user
 */
export function setupFreeUserMock() {
  mockPurchases.getCustomerInfo.mockResolvedValue(createMockCustomerInfo({ isPremium: false }));
  mockPurchases.getOfferings.mockResolvedValue(createMockOfferings());
}

/**
 * Sets up mock for premium user
 */
export function setupPremiumUserMock() {
  mockPurchases.getCustomerInfo.mockResolvedValue(createMockCustomerInfo({ isPremium: true }));
  mockPurchases.getOfferings.mockResolvedValue(createMockOfferings());
}

/**
 * Resets all mocks
 */
export function resetMocks() {
  Object.values(mockPurchases).forEach((value) => {
    if (typeof value === 'function' && 'mockReset' in value) {
      (value as jest.Mock).mockReset();
    }
  });
}
