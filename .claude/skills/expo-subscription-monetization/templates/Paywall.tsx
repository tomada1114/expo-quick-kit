/**
 * RevenueCat Template - Paywall Component
 *
 * A wrapper around RevenueCat's built-in Paywall UI.
 * This provides a ready-to-use paywall that matches your RevenueCat dashboard configuration.
 */

import RevenueCatUI, {
  type FullScreenPaywallViewOptions,
} from 'react-native-purchases-ui';
import { View, StyleSheet } from 'react-native';
import type {
  CustomerInfo,
  PurchasesError,
  PurchasesPackage,
  PurchasesStoreTransaction,
} from 'react-native-purchases';

export interface PaywallProps {
  /** Called when the paywall is dismissed */
  onClose: () => void;

  /** RevenueCat paywall options */
  options?: FullScreenPaywallViewOptions;

  /** Called when a purchase starts */
  onPurchaseStarted?: ({
    packageBeingPurchased,
  }: {
    packageBeingPurchased: PurchasesPackage;
  }) => void;

  /** Called when a purchase completes successfully */
  onPurchaseCompleted?: ({
    customerInfo,
    storeTransaction,
  }: {
    customerInfo: CustomerInfo;
    storeTransaction: PurchasesStoreTransaction;
  }) => void;

  /** Called when a purchase fails */
  onPurchaseError?: ({ error }: { error: PurchasesError }) => void;

  /** Called when a purchase is cancelled */
  onPurchaseCancelled?: () => void;

  /** Called when restore starts */
  onRestoreStarted?: () => void;

  /** Called when restore completes */
  onRestoreCompleted?: ({
    customerInfo,
  }: {
    customerInfo: CustomerInfo;
  }) => void;

  /** Called when restore fails */
  onRestoreError?: ({ error }: { error: PurchasesError }) => void;
}

/**
 * Paywall Component
 *
 * Displays the RevenueCat paywall UI configured in your dashboard.
 *
 * Usage:
 *   <Paywall
 *     onClose={() => navigation.goBack()}
 *     onPurchaseCompleted={() => {
 *       // Handle successful purchase
 *       navigation.goBack();
 *     }}
 *   />
 *
 * Note: You need to configure your paywall in the RevenueCat dashboard:
 * https://app.revenuecat.com/
 */
const Paywall = ({
  onClose,
  onPurchaseError,
  ...paywallProps
}: PaywallProps) => {
  const handlePurchaseError = ({ error }: { error: PurchasesError }) => {
    console.error('[Paywall] Purchase error:', error);
    onPurchaseError?.({ error });
  };

  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        onDismiss={onClose}
        onPurchaseCancelled={onClose}
        onPurchaseCompleted={onClose}
        onRestoreError={onClose}
        onRestoreCompleted={onClose}
        onPurchaseError={handlePurchaseError}
        options={{
          displayCloseButton: true,
        }}
        {...paywallProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Paywall;
