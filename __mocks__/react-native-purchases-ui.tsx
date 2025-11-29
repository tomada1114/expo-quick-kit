/**
 * Mock for react-native-purchases-ui (RevenueCat Paywall UI)
 *
 * This mock is automatically used by Jest for all tests.
 * Provides mock implementations for testing paywall UI features
 * without rendering the actual RevenueCat paywall.
 *
 * @module __mocks__/react-native-purchases-ui
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { PURCHASES_ERROR_CODE } from './react-native-purchases';

/**
 * Mock PurchasesError type matching RevenueCat SDK
 */
interface MockPurchasesError {
  code: number;
  message: string;
  readableErrorCode: string;
  userInfo: { readableErrorCode: string };
  underlyingErrorMessage: string;
  userCancelled: boolean | null;
}

/**
 * Create a mock PurchasesError
 */
function createMockPurchasesError(
  message: string,
  code: number = PURCHASES_ERROR_CODE.UNKNOWN_ERROR
): MockPurchasesError {
  return {
    code,
    message,
    readableErrorCode: 'UNKNOWN_ERROR',
    userInfo: { readableErrorCode: 'UNKNOWN_ERROR' },
    underlyingErrorMessage: message,
    userCancelled: null,
  };
}

/**
 * PAYWALL_RESULT enum matching RevenueCat's result types
 */
export const PAYWALL_RESULT = {
  NOT_PRESENTED: 'NOT_PRESENTED',
  ERROR: 'ERROR',
  CANCELLED: 'CANCELLED',
  PURCHASED: 'PURCHASED',
  RESTORED: 'RESTORED',
} as const;

export type PaywallResult =
  (typeof PAYWALL_RESULT)[keyof typeof PAYWALL_RESULT];

/**
 * Mock state for controlling paywall behavior in tests
 */
let mockPresentPaywallResult: PaywallResult = PAYWALL_RESULT.CANCELLED;
let mockShouldPresentPaywallThrow = false;
let mockPresentPaywallError: Error | null = null;

/**
 * Setup function to control presentPaywall result
 */
export function setupPresentPaywallResult(result: PaywallResult): void {
  mockPresentPaywallResult = result;
  mockShouldPresentPaywallThrow = false;
  mockPresentPaywallError = null;
}

/**
 * Setup function to make presentPaywall throw an error
 */
export function setupPresentPaywallError(error: Error): void {
  mockShouldPresentPaywallThrow = true;
  mockPresentPaywallError = error;
}

/**
 * Reset mock state
 */
export function resetPaywallMock(): void {
  mockPresentPaywallResult = PAYWALL_RESULT.CANCELLED;
  mockShouldPresentPaywallThrow = false;
  mockPresentPaywallError = null;
}

/**
 * Mock Paywall component props interface
 */
interface PaywallProps {
  options?: {
    offering?: unknown;
    displayCloseButton?: boolean;
    fontFamily?: string;
  };
  onPurchaseStarted?: (data: {
    packageBeingPurchased: { identifier: string };
  }) => void;
  onPurchaseCompleted?: (data: {
    customerInfo: unknown;
    storeTransaction: { productIdentifier: string };
  }) => void;
  onPurchaseError?: (data: { error: MockPurchasesError }) => void;
  onPurchaseCancelled?: () => void;
  onRestoreStarted?: () => void;
  onRestoreCompleted?: (data: { customerInfo: unknown }) => void;
  onRestoreError?: (data: { error: MockPurchasesError }) => void;
  onDismiss?: () => void;
}

/**
 * Mock Paywall component for testing.
 * Renders a simple view with testable buttons.
 */
function MockPaywall({
  onPurchaseStarted,
  onPurchaseCompleted,
  onPurchaseError,
  onPurchaseCancelled,
  onRestoreStarted,
  onRestoreCompleted,
  onRestoreError,
  onDismiss,
}: PaywallProps): React.JSX.Element {
  const handlePurchase = () => {
    onPurchaseStarted?.({
      packageBeingPurchased: { identifier: '$rc_monthly' },
    });
    onPurchaseCompleted?.({
      customerInfo: {},
      storeTransaction: { productIdentifier: 'monthly_plan' },
    });
  };

  const handlePurchaseError = () => {
    onPurchaseStarted?.({
      packageBeingPurchased: { identifier: '$rc_monthly' },
    });
    onPurchaseError?.({ error: createMockPurchasesError('Purchase failed') });
  };

  const handlePurchaseCancel = () => {
    onPurchaseCancelled?.();
  };

  const handleRestore = () => {
    onRestoreStarted?.();
    onRestoreCompleted?.({ customerInfo: {} });
  };

  const handleRestoreError = () => {
    onRestoreStarted?.();
    onRestoreError?.({ error: createMockPurchasesError('Restore failed') });
  };

  const handleDismiss = () => {
    onDismiss?.();
  };

  return (
    <View testID="mock-paywall">
      <Text>Mock Paywall</Text>
      <Pressable testID="mock-purchase-button" onPress={handlePurchase}>
        <Text>Purchase</Text>
      </Pressable>
      <Pressable
        testID="mock-purchase-error-button"
        onPress={handlePurchaseError}
      >
        <Text>Purchase Error</Text>
      </Pressable>
      <Pressable
        testID="mock-purchase-cancel-button"
        onPress={handlePurchaseCancel}
      >
        <Text>Cancel</Text>
      </Pressable>
      <Pressable testID="mock-restore-button" onPress={handleRestore}>
        <Text>Restore</Text>
      </Pressable>
      <Pressable
        testID="mock-restore-error-button"
        onPress={handleRestoreError}
      >
        <Text>Restore Error</Text>
      </Pressable>
      <Pressable testID="mock-dismiss-button" onPress={handleDismiss}>
        <Text>Close</Text>
      </Pressable>
    </View>
  );
}

/**
 * Mock presentPaywall function
 */
const presentPaywall = jest.fn().mockImplementation(async () => {
  if (mockShouldPresentPaywallThrow && mockPresentPaywallError) {
    throw mockPresentPaywallError;
  }
  return mockPresentPaywallResult;
});

/**
 * Mock presentPaywallIfNeeded function
 */
const presentPaywallIfNeeded = jest.fn().mockImplementation(async () => {
  if (mockShouldPresentPaywallThrow && mockPresentPaywallError) {
    throw mockPresentPaywallError;
  }
  return mockPresentPaywallResult;
});

/**
 * RevenueCatUI mock object
 */
const RevenueCatUI = {
  Paywall: MockPaywall,
  presentPaywall,
  presentPaywallIfNeeded,
};

export default RevenueCatUI;
