/**
 * Paywall Component
 *
 * A wrapper around RevenueCat's Paywall UI component that integrates with
 * the subscription system and provides navigation control.
 *
 * Features:
 * - Wraps RevenueCatUI.Paywall component
 * - Handles purchase, restore, cancel, and error events
 * - Integrates with expo-router for navigation
 * - Provides callback props for parent component integration
 *
 * @module features/subscription/components/paywall
 *
 * @example
 * ```tsx
 * import { Paywall } from '@/features/subscription/components/paywall';
 *
 * function PaywallScreen() {
 *   return (
 *     <Paywall
 *       onPurchaseSuccess={() => console.log('Purchased!')}
 *       onRestoreSuccess={() => console.log('Restored!')}
 *       onError={(error) => console.error(error)}
 *     />
 *   );
 * }
 * ```
 */

import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import RevenueCatUI from 'react-native-purchases-ui';
import type { PurchasesOffering } from 'react-native-purchases';

/**
 * PurchasesError interface matching RevenueCat SDK.
 * We define this locally to avoid type mismatches between react-native-purchases
 * and the internal types used by react-native-purchases-ui.
 */
interface PurchasesError {
  code: number;
  message: string;
  readableErrorCode: string;
  userInfo: { readableErrorCode: string };
  underlyingErrorMessage: string;
  userCancelled: boolean | null;
}

/**
 * Props for the Paywall component.
 */
export interface PaywallProps {
  /**
   * Optional RevenueCat offering to display.
   * If not provided, the default offering will be used.
   */
  offering?: PurchasesOffering | null;

  /**
   * Callback fired when a purchase completes successfully.
   */
  onPurchaseSuccess?: () => void;

  /**
   * Callback fired when a restore completes successfully.
   */
  onRestoreSuccess?: () => void;

  /**
   * Callback fired when an error occurs during purchase or restore.
   * Receives a PurchasesError from RevenueCat SDK.
   */
  onError?: (error: PurchasesError) => void;

  /**
   * Callback fired when the paywall is dismissed.
   * Called before navigation.back().
   */
  onDismiss?: () => void;
}

/**
 * Paywall component that wraps RevenueCat's Paywall UI.
 *
 * This component:
 * - Displays the RevenueCat paywall with the default or specified offering
 * - Handles all paywall events (purchase, restore, error, dismiss)
 * - Automatically navigates back when the paywall is dismissed
 * - Shows a close button for easy exit
 *
 * @param props - PaywallProps
 * @returns JSX.Element
 */
export function Paywall({
  offering,
  onPurchaseSuccess,
  onRestoreSuccess,
  onError,
  onDismiss,
}: PaywallProps): React.JSX.Element {
  const router = useRouter();

  /**
   * Handle purchase completion.
   * Calls the success callback if provided.
   */
  const handlePurchaseCompleted = useCallback(() => {
    onPurchaseSuccess?.();
  }, [onPurchaseSuccess]);

  /**
   * Handle purchase error.
   * Calls the error callback with the error.
   */
  const handlePurchaseError = useCallback(
    ({ error }: { error: PurchasesError }) => {
      onError?.(error);
    },
    [onError]
  );

  /**
   * Handle restore completion.
   * Calls the restore success callback if provided.
   */
  const handleRestoreCompleted = useCallback(() => {
    onRestoreSuccess?.();
  }, [onRestoreSuccess]);

  /**
   * Handle restore error.
   * Calls the error callback with the error.
   */
  const handleRestoreError = useCallback(
    ({ error }: { error: PurchasesError }) => {
      onError?.(error);
    },
    [onError]
  );

  /**
   * Handle paywall dismissal.
   * Calls the dismiss callback and navigates back if possible.
   */
  const handleDismiss = useCallback(() => {
    onDismiss?.();
    if (router.canGoBack()) {
      router.back();
    }
  }, [onDismiss, router]);

  // Build options with type assertion to handle type mismatch between
  // react-native-purchases and react-native-purchases-ui internal types
  const paywallOptions = {
    // Cast offering to unknown first to handle type incompatibility
    // between react-native-purchases PurchasesOffering and the internal type
    offering: offering as unknown as undefined,
    displayCloseButton: true,
  };

  return (
    <View style={styles.container} testID="paywall-container">
      <RevenueCatUI.Paywall
        options={paywallOptions}
        onPurchaseCompleted={handlePurchaseCompleted}
        onPurchaseError={
          handlePurchaseError as (data: { error: unknown }) => void
        }
        onPurchaseCancelled={() => {
          // Purchase cancelled is not an error, just a user action
          // Do nothing - paywall remains open
        }}
        onRestoreCompleted={handleRestoreCompleted}
        onRestoreError={
          handleRestoreError as (data: { error: unknown }) => void
        }
        onDismiss={handleDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
