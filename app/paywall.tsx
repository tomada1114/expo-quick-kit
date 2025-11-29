/**
 * Paywall Screen
 *
 * Independent route for displaying the subscription paywall.
 * Uses iOS Design System colors and integrates with the subscription system.
 *
 * Features:
 * - Themed background using useThemedColors()
 * - Integration with RevenueCat Paywall UI via Paywall component
 * - Handles purchase, restore, and dismiss events
 * - Auto-refetches subscription state after successful purchase/restore
 *
 * Route: /paywall
 *
 * @module app/paywall
 *
 * @example
 * ```tsx
 * // Navigate to paywall from any screen
 * import { useRouter } from 'expo-router';
 *
 * function UpgradeButton() {
 *   const router = useRouter();
 *   return (
 *     <Button onPress={() => router.push('/paywall')}>
 *       Upgrade to Premium
 *     </Button>
 *   );
 * }
 * ```
 */

import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemedColors } from '@/hooks/use-theme-color';
import { useSubscription } from '@/features/subscription/hooks';
import { Paywall } from '@/features/subscription/components';

/**
 * Paywall screen component.
 *
 * Displays the RevenueCat paywall with themed styling and handles
 * subscription events.
 *
 * @returns JSX.Element
 */
export default function PaywallScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors } = useThemedColors();
  const { refetchSubscription } = useSubscription();

  /**
   * Handle successful purchase.
   * Refetches subscription state to update the app.
   */
  const handlePurchaseSuccess = useCallback(async () => {
    await refetchSubscription();
  }, [refetchSubscription]);

  /**
   * Handle successful restore.
   * Refetches subscription state to update the app.
   */
  const handleRestoreSuccess = useCallback(async () => {
    await refetchSubscription();
  }, [refetchSubscription]);

  /**
   * Handle paywall error.
   * Logs the error for debugging.
   */
  const handleError = useCallback((error: unknown) => {
    console.error('Paywall error:', error);
  }, []);

  /**
   * Handle paywall dismiss.
   * Navigates back to the previous screen.
   */
  const handleDismiss = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View
      testID="paywall-screen-container"
      style={[styles.container, { backgroundColor: colors.background.base }]}
    >
      <Paywall
        onPurchaseSuccess={handlePurchaseSuccess}
        onRestoreSuccess={handleRestoreSuccess}
        onError={handleError}
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
