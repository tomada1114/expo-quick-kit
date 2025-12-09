/**
 * Settings Screen
 *
 * Settings screen with subscription management functionality.
 * Includes "Restore Purchases" button for iOS App Store guideline compliance.
 *
 * Requirements:
 * - 6.4: iOS App Store Guidelines compliance (restore button required)
 * - 6.5: Loading indicator during restore
 * - Display success/error messages for restore operations
 */

import { router, type Href } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacer } from '@/components/ui/spacer';
import { Spacing, Typography } from '@/constants/theme';
import type { SubscriptionErrorCode } from '@/features/subscription/core/types';
import { useSubscription } from '@/features/subscription/hooks';
import { useThemedColors } from '@/hooks/use-theme-color';

/**
 * Error messages for different error codes
 */
const ERROR_MESSAGES: Record<SubscriptionErrorCode, string> = {
  PURCHASE_CANCELLED: '', // Silent handling - no message shown
  PURCHASE_NOT_ALLOWED:
    'Purchases are not allowed on this device. Please check your settings.',
  PURCHASE_INVALID: 'Invalid purchase. Please try again.',
  PRODUCT_ALREADY_PURCHASED: 'This product has already been purchased.',
  NETWORK_ERROR:
    'A network error occurred. Please check your connection and try again.',
  STORE_PROBLEM_ERROR:
    'The store service is temporarily unavailable. Please try again later.',
  CONFIGURATION_ERROR:
    'A configuration error occurred. Please contact support.',
  INVALID_CREDENTIALS_ERROR: 'Authentication failed. Please try again.',
  UNEXPECTED_BACKEND_RESPONSE_ERROR:
    'A server error occurred. Please try again later.',
  RECEIPT_ALREADY_IN_USE_ERROR:
    'This purchase is already associated with another account.',
  NO_ACTIVE_SUBSCRIPTION: '', // Handled separately as info, not error
  UNKNOWN_ERROR: 'An error occurred. Please try again.',
};

export default function SettingsScreen() {
  const { colors } = useThemedColors();
  const { top } = useSafeAreaInsets();
  const { isPremium, subscription, restorePurchases, refetchSubscription } =
    useSubscription();

  const [isRestoring, setIsRestoring] = useState(false);

  /**
   * Handle restore purchases button press
   * Implements iOS App Store guideline requirement for restore functionality
   */
  const handleRestorePurchases = useCallback(async () => {
    if (isRestoring) {
      return; // Prevent duplicate calls
    }

    setIsRestoring(true);

    try {
      await restorePurchases();

      // Refetch subscription state to get updated premium status
      await refetchSubscription();

      // Show success message - restorePurchases throws if no active subscription found
      Alert.alert('Success', 'Your purchases have been restored.', [
        { text: 'OK' },
      ]);
    } catch (error) {
      // Extract error code from error object (supports both Error.message and typed errors)
      const errorCode: SubscriptionErrorCode =
        error instanceof Error &&
        Object.keys(ERROR_MESSAGES).includes(error.message)
          ? (error.message as SubscriptionErrorCode)
          : 'UNKNOWN_ERROR';

      // Handle user cancellation silently
      if (errorCode === 'PURCHASE_CANCELLED') {
        setIsRestoring(false);
        return;
      }

      // Handle no active subscription as info, not error
      if (errorCode === 'NO_ACTIVE_SUBSCRIPTION') {
        Alert.alert('Info', 'No purchases available to restore.', [
          { text: 'OK' },
        ]);
        setIsRestoring(false);
        return;
      }

      // Show error message for other errors
      const message = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN_ERROR;
      Alert.alert('Error', message, [{ text: 'OK' }]);
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, restorePurchases, refetchSubscription]);

  /**
   * Handle upgrade to premium button press
   */
  const handleUpgrade = useCallback(() => {
    // Note: Type assertion needed because expo-router typed routes may not be regenerated
    router.push('/paywall' as Href);
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.base }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: top + Spacing.xl },
      ]}
      testID="settings-screen-container"
    >
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Settings</ThemedText>
      </ThemedView>

      <Spacer size="lg" />

      {/* Subscription Status Section */}
      <Card style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Subscription</ThemedText>
        <Spacer size="sm" />

        <View style={styles.statusRow}>
          <ThemedText style={styles.statusLabel}>Current Plan:</ThemedText>
          <ThemedText
            style={[
              styles.statusValue,
              isPremium
                ? { color: colors.semantic.success }
                : { color: colors.text.secondary },
            ]}
          >
            {isPremium ? 'Premium' : 'Free'}
          </ThemedText>
        </View>

        {subscription?.expiresAt && (
          <>
            <Spacer size="xs" />
            <View style={styles.statusRow}>
              <ThemedText style={styles.statusLabel}>Expires:</ThemedText>
              <ThemedText style={styles.statusValue}>
                {subscription.expiresAt.toLocaleDateString()}
              </ThemedText>
            </View>
          </>
        )}

        <Spacer size="md" />

        {!isPremium && (
          <>
            <Button
              testID="upgrade-premium-button"
              variant="primary"
              onPress={handleUpgrade}
            >
              Upgrade to Premium
            </Button>
            <Spacer size="sm" />
          </>
        )}

        {/* Restore Purchases Button - iOS App Store Compliance */}
        <Button
          testID="restore-purchases-button"
          variant="secondary"
          onPress={handleRestorePurchases}
          loading={isRestoring}
          disabled={isRestoring}
        >
          Restore Purchases
        </Button>
      </Card>

      <Spacer size="lg" />

      {/* App Info Section */}
      <Card style={styles.section}>
        <ThemedText style={styles.sectionTitle}>About</ThemedText>
        <Spacer size="sm" />

        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Version:</ThemedText>
          <ThemedText style={styles.infoValue}>1.0.0</ThemedText>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    ...Typography.largeTitle,
    fontWeight: '700',
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headline,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  statusLabel: {
    ...Typography.body,
  },
  statusValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...Typography.body,
  },
  infoValue: {
    ...Typography.body,
    fontWeight: '500',
  },
});
